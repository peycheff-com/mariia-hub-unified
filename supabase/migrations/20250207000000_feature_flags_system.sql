-- Comprehensive Feature Flags System
-- Supports A/B testing, gradual rollouts, and kill switches

-- Core feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),

  -- Targeting configuration
  target_segments JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Environment and scheduling
  environments TEXT[] DEFAULT '{development,staging,production}',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,

  -- Metadata for experiments
  metadata JSONB DEFAULT '{}',

  -- Constraints
  CONSTRAINT valid_rollout_percentage CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  CONSTRAINT valid_dates CHECK (
    (start_date IS NULL OR end_date IS NULL) OR
    (start_date < end_date)
  )
);

-- User flag assignments for explicit targeting
CREATE TABLE IF NOT EXISTS user_flag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  flag_key TEXT NOT NULL REFERENCES feature_flags(flag_key) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL,
  variant TEXT, -- For A/B testing variants
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Ensure unique user-flag combination
  UNIQUE(user_id, flag_key)
);

-- Audit trail for flag changes
CREATE TABLE IF NOT EXISTS feature_flag_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT NOT NULL REFERENCES feature_flags(flag_key),
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'activated', 'deactivated', 'deleted')),
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES profiles(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reason TEXT
);

-- Experiment tracking for A/B testing
CREATE TABLE IF NOT EXISTS experiment_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_key TEXT NOT NULL REFERENCES feature_flags(flag_key),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  variant TEXT NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  converted BOOLEAN DEFAULT false,
  conversion_value DECIMAL(10,2) DEFAULT 0,
  converted_at TIMESTAMP WITH TIME ZONE,

  -- Ensure unique user-experiment combination
  UNIQUE(experiment_key, user_id)
);

-- Experiment events for detailed tracking
CREATE TABLE IF NOT EXISTS experiment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_key TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  event_type TEXT NOT NULL,
  event_value DECIMAL(10,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Indexes for performance
  INDEX idx_experiment_events_experiment_key (experiment_key),
  INDEX idx_experiment_events_user_id (user_id),
  INDEX idx_experiment_events_created_at (created_at)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(flag_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_active ON feature_flags(is_active);
CREATE INDEX IF NOT EXISTS idx_feature_flags_environment ON feature_flags USING GIN(environments);
CREATE INDEX IF NOT EXISTS idx_feature_flags_dates ON feature_flags(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_user_flag_assignments_user_id ON user_flag_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_flag_assignments_flag_key ON user_flag_assignments(flag_key);
CREATE INDEX IF NOT EXISTS idx_user_flag_assignments_enabled ON user_flag_assignments(is_enabled);

CREATE INDEX IF NOT EXISTS idx_experiment_assignments_experiment_key ON experiment_assignments(experiment_key);
CREATE INDEX IF NOT EXISTS idx_experiment_assignments_user_id ON experiment_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_experiment_assignments_variant ON experiment_assignments(variant);
CREATE INDEX IF NOT EXISTS idx_experiment_assignments_converted ON experiment_assignments(converted);

CREATE INDEX IF NOT EXISTS idx_feature_flag_audit_log_flag_key ON feature_flag_audit_log(flag_key);
CREATE INDEX IF NOT EXISTS idx_feature_flag_audit_log_changed_at ON feature_flag_audit_log(changed_at);

-- Row Level Security (RLS) policies
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_flag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_events ENABLE ROW LEVEL SECURITY;

-- Feature flags policies
CREATE POLICY "Admins can view all feature flags" ON feature_flags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert feature flags" ON feature_flags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update feature flags" ON feature_flags
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete feature flags" ON feature_flags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- User flag assignments policies
CREATE POLICY "Users can view their own flag assignments" ON user_flag_assignments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all flag assignments" ON user_flag_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage flag assignments" ON user_flag_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Audit log policies (read-only for admins)
CREATE POLICY "Admins can view audit log" ON feature_flag_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Experiment assignments policies
CREATE POLICY "Users can view their own experiment assignments" ON experiment_assignments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all experiment assignments" ON experiment_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "System can insert experiment assignments" ON experiment_assignments
  FOR INSERT WITH CHECK (true);

-- Experiment events policies
CREATE POLICY "System can insert experiment events" ON experiment_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all experiment events" ON experiment_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Helper functions for feature flag evaluation
CREATE OR REPLACE FUNCTION is_feature_enabled(
  flag_key_param TEXT,
  user_id_param UUID DEFAULT NULL,
  user_role_param TEXT DEFAULT NULL,
  user_segments_param JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  flag_record feature_flags%ROWTYPE;
  user_assignment RECORD;
  environment TEXT := current_setting('app.environment', true);
  rollout_hash INTEGER;
  rollout_threshold INTEGER;
BEGIN
  -- Get the flag record
  SELECT * INTO flag_record
  FROM feature_flags
  WHERE flag_key = flag_key_param AND is_active = true;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check environment
  IF NOT (environment = ANY(flag_record.environments)) THEN
    RETURN false;
  END IF;

  -- Check date constraints
  IF flag_record.start_date IS NOT NULL AND flag_record.start_date > now() THEN
    RETURN false;
  END IF;

  IF flag_record.end_date IS NOT NULL AND flag_record.end_date < now() THEN
    RETURN false;
  END IF;

  -- Check explicit user assignment
  IF user_id_param IS NOT NULL THEN
    SELECT * INTO user_assignment
    FROM user_flag_assignments
    WHERE user_id = user_id_param AND flag_key = flag_key_param;

    IF FOUND THEN
      RETURN user_assignment.is_enabled;
    END IF;
  END IF;

  -- Check targeting segments
  IF flag_record.target_segments IS NOT NULL AND user_segments_param IS NOT NULL THEN
    -- Check role targeting
    IF flag_record.target_segments ? 'roles' AND user_role_param IS NOT NULL THEN
      IF NOT (user_role_param = ANY((flag_record.target_segments->'roles')::text[])) THEN
        RETURN false;
      END IF;
    END IF;

    -- Check custom segment targeting
    IF flag_record.target_segments ? 'segments' AND user_segments_param ? 'segments' THEN
      DECLARE
        flag_segments TEXT[] := (flag_record.target_segments->'segments')::text[];
        user_segments TEXT[] := (user_segments_param->'segments')::text[];
        has_matching_segment BOOLEAN := false;
      BEGIN
        FOR segment IN SELECT unnest(flag_segments) LOOP
          IF segment = ANY(user_segments) THEN
            has_matching_segment := true;
            EXIT;
          END IF;
        END LOOP;

        IF NOT has_matching_segment THEN
          RETURN false;
        END IF;
      END;
    END IF;
  END IF;

  -- Check percentage rollout
  IF flag_record.rollout_percentage > 0 AND flag_record.rollout_percentage < 100 THEN
    IF user_id_param IS NULL THEN
      RETURN false; -- Need user ID for percentage rollout
    END IF;

    -- Consistent hash based on user ID and flag key
    rollout_hash := (hashtext(user_id_param::text || ':' || flag_key_param) & 4294967295)::INTEGER;
    rollout_threshold := (flag_record.rollout_percentage * 4294967295 / 100)::INTEGER;

    IF rollout_hash > rollout_threshold THEN
      RETURN false;
    END IF;
  END IF;

  -- If no conditions blocked it, the flag is enabled
  RETURN true;
END;
$$;

-- Function to get experiment variant for a user
CREATE OR REPLACE FUNCTION get_experiment_variant(
  experiment_key TEXT,
  user_id_param UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  flag_record feature_flags%ROWTYPE;
  existing_assignment RECORD;
  variants JSONB;
  weights JSONB;
  total_weight DECIMAL := 0;
  hash_value INTEGER;
  cumulative_weight DECIMAL := 0;
  selected_variant TEXT;
BEGIN
  -- Check if experiment is active
  SELECT * INTO flag_record
  FROM feature_flags
  WHERE flag_key = experiment_key AND is_active = true;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Check for existing assignment
  SELECT * INTO existing_assignment
  FROM experiment_assignments
  WHERE experiment_key = experiment_key AND user_id = user_id_param;

  IF FOUND THEN
    RETURN existing_assignment.variant;
  END IF;

  -- Get variants and weights from metadata
  variants := flag_record.metadata->'variants';
  weights := flag_record.metadata->'weights';

  IF variants IS NULL OR jsonb_typeof(variants) != 'object' THEN
    RETURN NULL;
  END IF;

  -- Calculate total weight
  FOR variant_rec IN SELECT * FROM jsonb_each_text(weights) LOOP
    total_weight := total_weight + variant_rec.value::DECIMAL;
  END LOOP;

  -- Use consistent hash to select variant
  hash_value := (hashtext(user_id_param::text || ':' || experiment_key) & 4294967295)::INTEGER;
  hash_value := (hash_value::DECIMAL / 4294967296 * total_weight)::INTEGER;

  -- Find the variant based on hash
  FOR variant_rec IN SELECT * FROM jsonb_each_text(weights) ORDER BY key LOOP
    cumulative_weight := cumulative_weight + variant_rec.value::DECIMAL;
    IF hash_value < cumulative_weight THEN
      selected_variant := variant_rec.key;
      EXIT;
    END IF;
  END LOOP;

  -- Create the assignment
  INSERT INTO experiment_assignments (experiment_key, user_id, variant)
  VALUES (experiment_key, user_id_param, COALESCE(selected_variant, (jsonb_object_keys(variants)->>0)));

  RETURN COALESCE(selected_variant, (jsonb_object_keys(variants)->>0));
END;
$$;

-- Function to track experiment conversion
CREATE OR REPLACE FUNCTION track_experiment_conversion(
  experiment_key TEXT,
  user_id_param UUID,
  conversion_value_param DECIMAL DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  assignment RECORD;
BEGIN
  -- Find the experiment assignment
  SELECT * INTO assignment
  FROM experiment_assignments
  WHERE experiment_key = experiment_key AND user_id = user_id_param;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Update the conversion
  UPDATE experiment_assignments
  SET
    converted = true,
    conversion_value = COALESCE(conversion_value_param, 0),
    converted_at = now()
  WHERE id = assignment.id;

  RETURN true;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to log flag changes
CREATE OR REPLACE FUNCTION log_flag_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO feature_flag_audit_log (flag_key, action, new_values, changed_by, reason)
    VALUES (NEW.flag_key, 'created', row_to_json(NEW), NEW.created_by, 'Initial creation');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    DECLARE
      action TEXT := 'updated';
    BEGIN
      IF OLD.is_active = false AND NEW.is_active = true THEN
        action := 'activated';
      ELSIF OLD.is_active = true AND NEW.is_active = false THEN
        action := 'deactivated';
      END IF;

      INSERT INTO feature_flag_audit_log (flag_key, action, old_values, new_values, changed_by)
      VALUES (NEW.flag_key, action, row_to_json(OLD), row_to_json(NEW), NEW.created_by);
      RETURN NEW;
    END;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO feature_flag_audit_log (flag_key, action, old_values, changed_by)
    VALUES (OLD.flag_key, 'deleted', row_to_json(OLD), OLD.created_by);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feature_flag_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION log_flag_changes();

-- Insert some default feature flags
INSERT INTO feature_flags (flag_key, description, is_active, rollout_percentage, environments, metadata) VALUES
  ('new_booking_flow', 'Enable new booking flow architecture', false, 10, '{staging,production}', '{"category": "booking", "risk_level": "medium", "tags": ["booking", "ui", "ux"]}'),
  ('ai_smart_scheduling', 'Enable AI-powered scheduling suggestions', true, 25, '{staging,production}', '{"category": "ai", "risk_level": "low", "tags": ["ai", "scheduling", "optimization"]}'),
  ('advanced_analytics', 'Enable advanced analytics dashboard', true, 100, '{development,staging,production}', '{"category": "analytics", "risk_level": "low", "tags": ["analytics", "admin", "dashboard"]}'),
  ('real_time_notifications', 'Enable real-time booking notifications', false, 5, '{staging,production}', '{"category": "notifications", "risk_level": "high", "tags": ["notifications", "real-time", "websocket"]}'),
  ('dynamic_pricing', 'Enable dynamic pricing based on demand', false, 0, '{development}', '{"category": "pricing", "risk_level": "high", "tags": ["pricing", "dynamic", "revenue"]}')
ON CONFLICT (flag_key) DO NOTHING;

-- Create a view for active flags with easy access
CREATE OR REPLACE VIEW active_feature_flags AS
SELECT
  ff.*,
  CASE
    WHEN ff.rollout_percentage = 100 THEN 'Full Rollout'
    WHEN ff.rollout_percentage > 0 THEN 'Partial Rollout'
    ELSE 'Disabled'
  END as rollout_status,
  CASE
    WHEN ff.start_date IS NOT NULL AND ff.start_date > now() THEN 'Scheduled'
    WHEN ff.end_date IS NOT NULL AND ff.end_date < now() THEN 'Expired'
    WHEN ff.is_active = true THEN 'Active'
    ELSE 'Inactive'
  END as flag_status
FROM feature_flags ff
WHERE ff.is_active = true OR ff.rollout_percentage > 0;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON feature_flags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_flag_assignments TO authenticated;
GRANT SELECT ON feature_flag_audit_log TO authenticated;
GRANT SELECT, INSERT ON experiment_assignments TO authenticated;
GRANT SELECT, INSERT ON experiment_events TO authenticated;
GRANT SELECT ON active_feature_flags TO authenticated;
GRANT EXECUTE ON FUNCTION is_feature_enabled TO authenticated;
GRANT EXECUTE ON FUNCTION get_experiment_variant TO authenticated;
GRANT EXECUTE ON FUNCTION track_experiment_conversion TO authenticated;