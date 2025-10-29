-- Enhanced Booking Features Migration
-- Adds support for group bookings, waitlist, capacity management, and dynamic pricing

-- 1. Add capacity management to availability_slots table
ALTER TABLE availability
ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_bookings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS allows_groups BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_group_size INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS group_buffer_minutes INTEGER DEFAULT 0;

-- 2. Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id),
  user_id UUID REFERENCES auth.users(id),
  preferred_date DATE NOT NULL,
  preferred_time TIME NOT NULL,
  preferred_time_range_start TIME,
  preferred_time_range_end TIME,
  location_type location_type DEFAULT 'studio',
  group_size INTEGER DEFAULT 1,
  flexible_with_time BOOLEAN DEFAULT true,
  flexible_with_location BOOLEAN DEFAULT false,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'promoted', 'cancelled', 'expired')),
  priority_score INTEGER DEFAULT 0, -- Higher number = higher priority
  auto_promote_eligible BOOLEAN DEFAULT true,
  promotion_attempts INTEGER DEFAULT 0,
  max_promotion_attempts INTEGER DEFAULT 3,
  promoted_booking_id UUID REFERENCES bookings(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for waitlist
CREATE INDEX IF NOT EXISTS idx_waitlist_service_date ON waitlist_entries(service_id, preferred_date);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist_entries(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_priority ON waitlist_entries(priority_score DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_waitlist_user_id ON waitlist_entries(user_id);

-- 3. Create dynamic pricing rules table
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('group_discount', 'time_based', 'seasonal', 'demand_based', 'early_bird', 'last_minute')),

  -- Rule configuration (JSONB for flexibility)
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Applicability
  min_group_size INTEGER DEFAULT 2,
  max_group_size INTEGER,
  valid_from DATE,
  valid_until DATE,
  valid_days TEXT[], -- Array of day names: ['Monday', 'Tuesday', ...]
  valid_time_start TIME,
  valid_time_end TIME,

  -- Priority and stacking
  priority INTEGER DEFAULT 0, -- Higher priority rules applied first
  is_stackable BOOLEAN DEFAULT false, -- Can combine with other rules

  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for pricing rules
CREATE INDEX IF NOT EXISTS idx_pricing_rules_service ON pricing_rules(service_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON pricing_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_priority ON pricing_rules(priority DESC);

-- 4. Create booking history tracking table for rescheduling
CREATE TABLE IF NOT EXISTS booking_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  user_id UUID REFERENCES auth.users(id),
  change_type TEXT NOT NULL CHECK (change_type IN ('created', 'rescheduled', 'cancelled', 'modified_details', 'status_changed')),

  -- Old values (for tracking changes)
  old_date DATE,
  old_time TIME,
  old_service_id UUID,
  old_status TEXT,

  -- New values
  new_date DATE,
  new_time TIME,
  new_service_id UUID,
  new_status TEXT,

  -- Metadata
  reason TEXT,
  changed_by UUID REFERENCES auth.users(id), -- Who made the change (user or admin)
  system_generated BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for booking changes
CREATE INDEX IF NOT EXISTS idx_booking_changes_booking_id ON booking_changes(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_changes_user_id ON booking_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_changes_type ON booking_changes(change_type);
CREATE INDEX IF NOT EXISTS idx_booking_changes_created ON booking_changes(created_at DESC);

-- 5. Create group bookings table (for managing groups as entities)
CREATE TABLE IF NOT EXISTS group_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_name TEXT,
  group_size INTEGER NOT NULL CHECK (group_size > 1),
  primary_contact_name TEXT NOT NULL,
  primary_contact_email TEXT NOT NULL,
  primary_contact_phone TEXT,

  -- Group booking details
  service_id UUID NOT NULL REFERENCES services(id),
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  location_type location_type DEFAULT 'studio',

  -- Pricing
  base_price_per_person NUMERIC(10, 2) NOT NULL,
  discount_percentage NUMERIC(5, 2) DEFAULT 0,
  total_price NUMERIC(10, 2) NOT NULL,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  deposit_required BOOLEAN DEFAULT false,
  deposit_amount NUMERIC(10, 2) DEFAULT 0,
  deposit_paid BOOLEAN DEFAULT false,

  -- Additional participants info
  participants JSONB DEFAULT '[]'::jsonb, -- Array of participant details

  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  creator_user_id UUID REFERENCES auth.users(id)
);

-- Add indexes for group bookings
CREATE INDEX IF NOT EXISTS idx_group_bookings_service ON group_bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_group_bookings_date ON group_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_group_bookings_status ON group_bookings(status);
CREATE INDEX IF NOT EXISTS idx_group_bookings_creator ON group_bookings(creator_user_id);

-- 6. Update bookings table to support new features
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS group_booking_id UUID REFERENCES group_bookings(id),
ADD COLUMN IF NOT EXISTS is_group_booking BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS group_participant_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS original_price NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS applied_pricing_rules JSONB DEFAULT '[]'::jsonb, -- Track applied rules
ADD COLUMN IF NOT EXISTS waitlist_entry_id UUID REFERENCES waitlist_entries(id),
ADD COLUMN IF NOT EXISTS reschedule_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_rescheduled_at TIMESTAMPTZ;

-- 7. Functions for enhanced booking features

-- Function to check availability with capacity
CREATE OR REPLACE FUNCTION check_slot_availability_with_capacity(
  p_service_id UUID,
  p_booking_date DATE,
  p_booking_time TIME,
  p_duration_minutes INTEGER,
  p_group_size INTEGER DEFAULT 1
)
RETURNS TABLE (
  available BOOLEAN,
  remaining_capacity INTEGER,
  conflict_reason TEXT
) AS $$
DECLARE
  v_service services%ROWTYPE;
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_current_bookings INTEGER;
  v_capacity INTEGER;
  v_allows_groups BOOLEAN;
  v_max_group_size INTEGER;
BEGIN
  -- Get service details
  SELECT * INTO v_service
  FROM services
  WHERE id = p_service_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'Service not found or inactive'::TEXT;
    RETURN;
  END IF;

  -- Create time range
  v_start_time := (p_booking_date || ' ' || p_booking_time)::timestamptz;
  v_end_time := v_start_time + (p_duration_minutes || ' minutes')::interval;

  -- Check regular availability first
  PERFORM 1
  FROM availability
  WHERE service_type = v_service.service_type
    AND time_range @> TSTZRANGE(v_start_time, v_end_time, '[)')
    AND is_available = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'Outside available hours'::TEXT;
    RETURN;
  END IF;

  -- Get capacity settings for this time slot
  SELECT
    COALESCE(capacity, 1) as capacity,
    COALESCE(allows_groups, false) as allows_groups,
    COALESCE(max_group_size, 1) as max_group_size
  INTO v_capacity, v_allows_groups, v_max_group_size
  FROM availability
  WHERE service_type = v_service.service_type
    AND time_range @> TSTZRANGE(v_start_time, v_end_time, '[)')
  LIMIT 1;

  -- Check if groups are allowed for this booking
  IF p_group_size > 1 AND NOT v_allows_groups THEN
    RETURN QUERY SELECT false, 0, 'Groups not allowed for this time slot'::TEXT;
    RETURN;
  END IF;

  IF p_group_size > v_max_group_size THEN
    RETURN QUERY SELECT false, 0, format('Group size exceeds maximum of %s', v_max_group_size)::TEXT;
    RETURN;
  END IF;

  -- Count current bookings for this time slot
  SELECT COUNT(*) INTO v_current_bookings
  FROM booking_calendar
  WHERE booking_range && TSTZRANGE(v_start_time, v_end_time, '[)')
    AND status IN ('pending', 'confirmed');

  -- Calculate remaining capacity
  IF v_current_bookings + p_group_size <= v_capacity THEN
    RETURN QUERY SELECT
      true,
      v_capacity - v_current_bookings - p_group_size,
      NULL::TEXT;
  ELSE
    RETURN QUERY SELECT
      false,
      0,
      format('Insufficient capacity: %s booked, %s requested, %s total',
             v_current_bookings, p_group_size, v_capacity)::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate dynamic pricing
CREATE OR REPLACE FUNCTION calculate_dynamic_pricing(
  p_service_id UUID,
  p_booking_date DATE,
  p_booking_time TIME,
  p_group_size INTEGER DEFAULT 1,
  p_base_price NUMERIC(10, 2)
)
RETURNS TABLE (
  final_price NUMERIC(10, 2),
  applied_rules JSONB,
  total_discount NUMERIC(10, 2)
) AS $$
DECLARE
  v_service services%ROWTYPE;
  v_day_of_week TEXT;
  v_final_price NUMERIC(10, 2);
  v_total_discount NUMERIC(10, 2) DEFAULT 0;
  v_applied_rules JSONB DEFAULT '[]'::jsonb;
  v_rule RECORD;
BEGIN
  -- Get service details
  SELECT * INTO v_service
  FROM services
  WHERE id = p_service_id;

  v_final_price := p_base_price * p_group_size;
  v_day_of_week := TRIM(TO_CHAR(p_booking_date, 'Day'));

  -- Apply active pricing rules
  FOR v_rule IN
    SELECT * FROM pricing_rules
    WHERE service_id = p_service_id
      AND is_active = true
      AND (valid_from IS NULL OR p_booking_date >= valid_from)
      AND (valid_until IS NULL OR p_booking_date <= valid_until)
      AND (valid_days IS NULL OR v_day_of_week = ANY(valid_days))
      AND (valid_time_start IS NULL OR p_booking_time >= valid_time_start)
      AND (valid_time_end IS NULL OR p_booking_time <= valid_time_end)
      AND (min_group_size IS NULL OR p_group_size >= min_group_size)
      AND (max_group_size IS NULL OR p_group_size <= max_group_size)
    ORDER BY priority DESC
  LOOP
    -- Apply group discount rule
    IF v_rule.rule_type = 'group_discount' AND p_group_size > 1 THEN
      DECLARE
        v_min_size INTEGER := COALESCE((v_rule.configuration->>'min_group_size')::INTEGER, 2);
        v_discount_percent NUMERIC(5, 2) := COALESCE((v_rule.configuration->>'discount_percentage')::NUMERIC, 0);
      BEGIN
        IF p_group_size >= v_min_size AND v_discount_percent > 0 THEN
          v_total_discount := v_total_discount + (v_final_price * v_discount_percent / 100);
          v_applied_rules := v_applied_rules || jsonb_build_object(
            'rule_id', v_rule.id,
            'rule_type', v_rule.rule_type,
            'discount_percentage', v_discount_percent,
            'applied_amount', v_final_price * v_discount_percent / 100
          );
        END IF;
      END;

    -- Apply early bird discount
    ELSIF v_rule.rule_type = 'early_bird' THEN
      DECLARE
        v_days_ahead INTEGER := (p_booking_date - CURRENT_DATE);
        v_min_days_ahead INTEGER := COALESCE((v_rule.configuration->>'min_days_ahead')::INTEGER, 7);
        v_discount_percent NUMERIC(5, 2) := COALESCE((v_rule.configuration->>'discount_percentage')::NUMERIC, 0);
      BEGIN
        IF v_days_ahead >= v_min_days_ahead AND v_discount_percent > 0 THEN
          v_total_discount := v_total_discount + (v_final_price * v_discount_percent / 100);
          v_applied_rules := v_applied_rules || jsonb_build_object(
            'rule_id', v_rule.id,
            'rule_type', v_rule.rule_type,
            'discount_percentage', v_discount_percent,
            'applied_amount', v_final_price * v_discount_percent / 100
          );
        END IF;
      END;

    -- Apply seasonal pricing
    ELSIF v_rule.rule_type = 'seasonal' THEN
      DECLARE
        v_price_multiplier NUMERIC := COALESCE((v_rule.configuration->>'price_multiplier')::NUMERIC, 1.0);
      BEGIN
        IF v_price_multiplier != 1.0 THEN
          v_final_price := v_final_price * v_price_multiplier;
          v_applied_rules := v_applied_rules || jsonb_build_object(
            'rule_id', v_rule.id,
            'rule_type', v_rule.rule_type,
            'price_multiplier', v_price_multiplier
          );
        END IF;
      END;
    END IF;
  END LOOP;

  -- Ensure price doesn't go below minimum
  v_final_price := GREATEST(v_final_price - v_total_discount, p_base_price * 0.5); -- Minimum 50% of base price

  RETURN QUERY SELECT
    v_final_price,
    v_applied_rules,
    LEAST(v_total_discount, v_final_price - (p_base_price * 0.5));
END;
$$ LANGUAGE plpgsql;

-- Function to promote waitlist entries
CREATE OR REPLACE FUNCTION promote_waitlist_entry(p_waitlist_id UUID)
RETURNS UUID AS $$
DECLARE
  v_waitlist waitlist_entries%ROWTYPE;
  v_service services%ROWTYPE;
  v_availability RECORD;
  v_booking_id UUID;
BEGIN
  -- Get waitlist entry
  SELECT * INTO v_waitlist
  FROM waitlist_entries
  WHERE id = p_waitlist_id AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Waitlist entry not found or not active';
  END IF;

  -- Get service details
  SELECT * INTO v_service
  FROM services
  WHERE id = v_waitlist.service_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found or inactive';
  END IF;

  -- Check availability with preferred time
  SELECT * INTO v_availability
  FROM check_slot_availability_with_capacity(
    v_waitlist.service_id,
    v_waitlist.preferred_date,
    v_waitlist.preferred_time,
    v_service.duration_minutes,
    v_waitlist.group_size
  );

  -- If not available at preferred time, try flexible time search
  IF NOT v_availability.available AND v_waitlist.flexible_with_time THEN
    -- Search for available slots within time range
    FOR v_availability IN
      SELECT * FROM check_slot_availability_with_capacity(
        v_waitlist.service_id,
        v_waitlist.preferred_date,
        generate_series(
          COALESCE(v_waitlist.preferred_time_range_start, '08:00'::TIME),
          COALESCE(v_waitlist.preferred_time_range_end, '20:00'::TIME),
          '30 minutes'::INTERVAL
        ),
        v_service.duration_minutes,
        v_waitlist.group_size
      ) WHERE available = true
      LIMIT 1
    LOOP
      EXIT; -- Found an available slot
    END LOOP;
  END IF;

  IF v_availability.available THEN
    -- Create booking from waitlist entry
    INSERT INTO bookings (
      user_id,
      service_id,
      status,
      booking_date,
      booking_time,
      client_name,
      client_email,
      client_phone,
      location_type,
      amount_paid,
      currency,
      metadata,
      waitlist_entry_id,
      group_participant_count
    ) VALUES (
      v_waitlist.user_id,
      v_waitlist.service_id,
      'confirmed',
      v_waitlist.preferred_date,
      v_waitlist.preferred_time,
      split_part(v_waitlist.primary_contact_name, ' ', 1),
      v_waitlist.contact_email,
      v_waitlist.contact_phone,
      v_waitlist.location_type,
      v_service.price_from * v_waitlist.group_size,
      'PLN',
      jsonb_build_object(
        'from_waitlist', true,
        'group_size', v_waitlist.group_size,
        'flexible_with_time', v_waitlist.flexible_with_time,
        'promotion_attempts', v_waitlist.promotion_attempts + 1
      ),
      v_waitlist.id,
      v_waitlist.group_size
    ) RETURNING id INTO v_booking_id;

    -- Update waitlist entry
    UPDATE waitlist_entries
    SET status = 'promoted',
        promoted_booking_id = v_booking_id,
        promotion_attempts = promotion_attempts + 1,
        updated_at = now()
    WHERE id = p_waitlist_id;

    RETURN v_booking_id;
  ELSE
    -- Increment promotion attempts
    UPDATE waitlist_entries
    SET promotion_attempts = promotion_attempts + 1,
        updated_at = now()
    WHERE id = p_waitlist_id;

    -- Mark as expired if max attempts reached
    IF v_waitlist.promotion_attempts + 1 >= v_waitlist.max_promotion_attempts THEN
      UPDATE waitlist_entries
      SET status = 'expired',
          updated_at = now()
      WHERE id = p_waitlist_id;
    END IF;

    RAISE EXCEPTION 'No available slots found for waitlist entry';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_waitlist_entries_updated_at
  BEFORE UPDATE ON waitlist_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_rules_updated_at
  BEFORE UPDATE ON pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_bookings_updated_at
  BEFORE UPDATE ON group_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security Policies for new tables

-- Waitlist entries
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own waitlist entries"
  ON waitlist_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all waitlist entries"
  ON waitlist_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can create waitlist entries"
  ON waitlist_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage waitlist entries"
  ON waitlist_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Pricing rules
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pricing rules"
  ON pricing_rules FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage pricing rules"
  ON pricing_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Group bookings
ALTER TABLE group_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own group bookings"
  ON group_bookings FOR SELECT
  USING (auth.uid() = creator_user_id);

CREATE POLICY "Admins can view all group bookings"
  ON group_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can create group bookings"
  ON group_bookings FOR INSERT
  WITH CHECK (auth.uid() = creator_user_id);

CREATE POLICY "Admins can manage group bookings"
  ON group_bookings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Booking changes
ALTER TABLE booking_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own booking changes"
  ON booking_changes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all booking changes"
  ON booking_changes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Schedule waitlist promotion check (every hour)
SELECT cron.schedule(
  'promote-waitlist-entries',
  '0 * * * *',
  $$
  DECLARE
    v_entry RECORD;
  v_booking_id UUID;
  v_notification_sent BOOLEAN;
  BEGIN
    -- Loop through active waitlist entries
    FOR v_entry IN
      SELECT * FROM waitlist_entries
      WHERE status = 'active'
        AND auto_promote_eligible = true
        AND promotion_attempts < max_promotion_attempts
        AND preferred_date >= CURRENT_DATE
        AND preferred_date <= CURRENT_DATE + INTERVAL '7 days'
      ORDER BY priority_score DESC, created_at ASC
      LIMIT 50 -- Process in batches
    LOOP
      BEGIN
        -- Try to promote the entry
        v_booking_id := promote_waitlist_entry(v_entry.id);

        -- Send notification (implementation depends on notification system)
        -- PERFORM send_waitlist_promotion_notification(v_entry.user_id, v_booking_id);

        INSERT INTO booking_changes (
          booking_id,
          user_id,
          change_type,
          new_date,
          new_time,
          new_service_id,
          reason,
          system_generated,
          metadata
        ) VALUES (
          v_booking_id,
          v_entry.user_id,
          'created',
          v_entry.preferred_date,
          v_entry.preferred_time,
          v_entry.service_id,
          'Auto-promoted from waitlist',
          true,
          jsonb_build_object('waitlist_entry_id', v_entry.id)
        );

      EXCEPTION WHEN OTHERS THEN
        -- Log error and continue with next entry
        -- Could implement notification to admin about failed promotion
        CONTINUE;
      END;
    END LOOP;
  END;
  $$
);

COMMENT ON TABLE waitlist_entries IS 'Manages waitlist entries for fully booked time slots';
COMMENT ON TABLE pricing_rules IS 'Dynamic pricing rules for services based on various conditions';
COMMENT ON TABLE group_bookings IS 'Manages group bookings with special pricing and logistics';
COMMENT ON TABLE booking_changes IS 'Tracks all changes to bookings for audit and rescheduling';