-- Service Packages System Migration
-- Implements comprehensive package management for multi-session service purchases

-- ========================================
-- 1. SERVICE PACKAGES DEFINITION TABLE
-- ========================================

-- Service packages defined by admins (template packages for sale)
CREATE TABLE IF NOT EXISTS service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,

  -- Pricing details
  session_count INTEGER NOT NULL CHECK (session_count > 0),
  original_price DECIMAL(10,2), -- Total regular price for sessions
  package_price DECIMAL(10,2) NOT NULL CHECK (package_price > 0),
  savings_amount DECIMAL(10,2) GENERATED ALWAYS AS (COALESCE(original_price, 0) - package_price) STORED,
  savings_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN COALESCE(original_price, 0) > 0
      THEN ROUND(((COALESCE(original_price, 0) - package_price) / COALESCE(original_price, 0)) * 100, 2)
      ELSE 0
    END
  ) STORED,

  -- Package configuration
  validity_days INTEGER DEFAULT 365 CHECK (validity_days > 0),
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,

  -- Package features and benefits
  features JSONB DEFAULT '{}', -- {include_aftercare, premium_support, flexible_booking, etc}
  benefits TEXT[], -- Array of benefit descriptions
  inclusions JSONB DEFAULT '{}', -- What's included in the package

  -- Visual assets
  image_url TEXT,
  badge_text TEXT, -- E.g., "Best Value", "Popular"

  -- Availability and restrictions
  max_purchases_per_client INTEGER, -- Limit purchases per client
  valid_from DATE,
  valid_until DATE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

-- ========================================
-- 2. CLIENT PACKAGES TABLE
-- ========================================

-- Track purchased packages per client (replaces/enhances booking_packages)
CREATE TABLE IF NOT EXISTS client_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,

  -- Purchase details
  purchase_date TIMESTAMPTZ DEFAULT now(),
  expiry_date TIMESTAMPTZ GENERATED ALWAYS AS (
    (purchase_date + (SELECT validity_days FROM service_packages WHERE id = package_id) * INTERVAL '1 day')
  ) STORED,

  -- Session tracking
  total_sessions INTEGER NOT NULL,
  sessions_used INTEGER DEFAULT 0,
  sessions_remaining INTEGER GENERATED ALWAYS AS (total_sessions - sessions_used) STORED,

  -- Payment information
  payment_id UUID REFERENCES payments(id),
  amount_paid DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'pln',

  -- Status tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'depleted', 'cancelled', 'suspended')),
  auto_renew BOOLEAN DEFAULT false,

  -- Usage restrictions
  can_be_gifted BOOLEAN DEFAULT false,
  transfer_count INTEGER DEFAULT 0,
  max_transfers INTEGER DEFAULT 0,

  -- Notes and metadata
  purchase_notes TEXT,
  admin_notes TEXT,
  gift_message TEXT,
  gift_from UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- 3. PACKAGE SESSIONS TABLE
-- ========================================

-- Track individual session usage from packages
CREATE TABLE IF NOT EXISTS package_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_package_id UUID NOT NULL REFERENCES client_packages(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

  -- Session details
  session_number INTEGER NOT NULL, -- Which session in the package (1, 2, 3...)
  used_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,

  -- Session status
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'scheduled', 'completed', 'cancelled', 'no_show')),

  -- Additional information
  notes TEXT,
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_text TEXT,

  -- Service modifications (if session was different from package service)
  actual_service_id UUID REFERENCES services(id),
  price_difference DECIMAL(10,2), -- Additional charge or refund

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- 4. INDEXES FOR PERFORMANCE
-- ========================================

-- Service packages indexes
CREATE INDEX IF NOT EXISTS idx_service_packages_service_id ON service_packages(service_id);
CREATE INDEX IF NOT EXISTS idx_service_packages_active ON service_packages(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_service_packages_featured ON service_packages(is_featured, display_order);
CREATE INDEX IF NOT EXISTS idx_service_packages_validity ON service_packages(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_service_packages_slug ON service_packages(slug);

-- Client packages indexes
CREATE INDEX IF NOT EXISTS idx_client_packages_client_id ON client_packages(client_id);
CREATE INDEX IF NOT EXISTS idx_client_packages_package_id ON client_packages(package_id);
CREATE INDEX IF NOT EXISTS idx_client_packages_status ON client_packages(status);
CREATE INDEX IF NOT EXISTS idx_client_packages_expiry ON client_packages(expiry_date);
CREATE INDEX IF NOT EXISTS idx_client_packages_purchase_date ON client_packages(purchase_date DESC);

-- Package sessions indexes
CREATE INDEX IF NOT EXISTS idx_package_sessions_client_package_id ON package_sessions(client_package_id);
CREATE INDEX IF NOT EXISTS idx_package_sessions_booking_id ON package_sessions(booking_id);
CREATE INDEX IF NOT EXISTS idx_package_sessions_status ON package_sessions(status);
CREATE INDEX IF NOT EXISTS idx_package_sessions_used_at ON package_sessions(used_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_client_packages_client_active ON client_packages(client_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_service_packages_service_active ON service_packages(service_id, is_active) WHERE is_active = true;

-- ========================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ========================================

-- Enable RLS on all package tables
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_sessions ENABLE ROW LEVEL SECURITY;

-- Service packages policies
CREATE POLICY "Anyone can view active service packages"
ON service_packages
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage all service packages"
ON service_packages
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Client packages policies
CREATE POLICY "Clients can view own packages"
ON client_packages
FOR SELECT
USING (auth.uid() = client_id OR auth.uid() = gift_from);

CREATE POLICY "Admins can manage all client packages"
ON client_packages
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Package sessions policies
CREATE POLICY "Clients can view own package sessions"
ON package_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM client_packages cp
    JOIN service_packages sp ON cp.package_id = sp.id
    WHERE cp.id = package_sessions.client_package_id
    AND (cp.client_id = auth.uid() OR cp.gift_from = auth.uid())
  )
);

CREATE POLICY "Admins can manage all package sessions"
ON package_sessions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- ========================================
-- 6. TRIGGERS FOR AUTOMATIC UPDATES
-- ========================================

-- Update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_service_packages_updated_at
  BEFORE UPDATE ON service_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_packages_updated_at
  BEFORE UPDATE ON client_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_package_sessions_updated_at
  BEFORE UPDATE ON package_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update client package sessions when session is used
CREATE OR REPLACE FUNCTION update_client_package_sessions()
RETURNS TRIGGER AS $$
BEGIN
  -- Update sessions used count when a package session is completed
  IF TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' THEN
    UPDATE client_packages
    SET sessions_used = (
      SELECT COUNT(*)
      FROM package_sessions
      WHERE client_package_id = NEW.client_package_id
      AND status = 'completed'
    ),
    status = CASE
      WHEN sessions_remaining <= 1 THEN 'depleted'
      WHEN expiry_date < now() THEN 'expired'
      ELSE status
    END
    WHERE id = NEW.client_package_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_client_package_sessions
  AFTER UPDATE ON package_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_client_package_sessions();

-- ========================================
-- 7. CHECK CONSTRAINTS FOR DATA INTEGRITY
-- ========================================

-- Additional constraints for service_packages
ALTER TABLE service_packages
ADD CONSTRAINT chk_service_packages_valid_dates
  CHECK (
    (valid_from IS NULL AND valid_until IS NULL) OR
    (valid_from IS NULL AND valid_until >= CURRENT_DATE) OR
    (valid_until IS NULL AND valid_from <= CURRENT_DATE) OR
    (valid_from <= valid_until)
  );

-- Additional constraints for client_packages
ALTER TABLE client_packages
ADD CONSTRAINT chk_client_packages_sessions_not_negative
  CHECK (sessions_used >= 0 AND sessions_used <= total_sessions);

ALTER TABLE client_packages
ADD CONSTRAINT chk_client_packages_max_transfers
  CHECK (transfer_count <= max_transfers OR max_transfers = 0);

-- Additional constraints for package_sessions
ALTER TABLE package_sessions
ADD CONSTRAINT chk_package_sessions_number_valid
  CHECK (session_number > 0 AND session_number <= (SELECT total_sessions FROM client_packages WHERE id = client_package_id));

-- ========================================
-- 8. VIEWS FOR REPORTING
-- ========================================

-- Active packages view for easy querying
CREATE OR REPLACE VIEW active_packages_view AS
SELECT
  cp.*,
  sp.name as package_name,
  sp.description as package_description,
  sp.savings_percentage,
  sp.image_url,
  sp.badge_text,
  s.title as service_title,
  s.service_type,
  p.first_name || ' ' || p.last_name as client_name,
  p.email as client_email,
  CASE
    WHEN cp.expiry_date < now() THEN 'expired'
    WHEN cp.sessions_remaining = 0 THEN 'depleted'
    ELSE 'active'
  END as computed_status,
  ROUND((cp.sessions_used::DECIMAL / NULLIF(cp.total_sessions, 0)) * 100, 2) as usage_percentage
FROM client_packages cp
JOIN service_packages sp ON cp.package_id = sp.id
JOIN services s ON sp.service_id = s.id
JOIN profiles p ON cp.client_id = p.id
WHERE cp.status NOT IN ('cancelled', 'expired')
ORDER BY cp.purchase_date DESC;

-- Package usage analytics view
CREATE OR REPLACE VIEW package_usage_analytics AS
SELECT
  sp.id as package_id,
  sp.name as package_name,
  s.title as service_title,
  s.service_type,
  COUNT(cp.id) as total_sold,
  SUM(CASE WHEN cp.status = 'active' THEN 1 ELSE 0 END) as active_packages,
  SUM(CASE WHEN cp.status = 'completed' OR cp.status = 'depleted' THEN 1 ELSE 0 END) as completed_packages,
  SUM(cp.total_sessions) as total_sessions_sold,
  SUM(cp.sessions_used) as total_sessions_used,
  ROUND(AVG(CASE WHEN cp.status IN ('active', 'depleted', 'completed')
    THEN (cp.sessions_used::DECIMAL / NULLIF(cp.total_sessions, 0)) * 100
    END), 2) as avg_usage_percentage,
  SUM(cp.amount_paid) as total_revenue,
  AVG(cp.amount_paid) as avg_package_price
FROM service_packages sp
LEFT JOIN client_packages cp ON sp.id = cp.package_id
LEFT JOIN services s ON sp.service_id = s.id
GROUP BY sp.id, sp.name, s.title, s.service_type
ORDER BY total_revenue DESC;

-- Package revenue summary by month
CREATE OR REPLACE VIEW package_revenue_summary AS
SELECT
  DATE_TRUNC('month', cp.purchase_date) as month,
  COUNT(*) as packages_sold,
  SUM(cp.amount_paid) as revenue,
  SUM(cp.total_sessions) as sessions_sold,
  AVG(cp.amount_paid) as avg_package_value,
  COUNT(DISTINCT cp.client_id) as unique_clients
FROM client_packages cp
WHERE cp.status NOT IN ('cancelled')
GROUP BY DATE_TRUNC('month', cp.purchase_date)
ORDER BY month DESC;

-- ========================================
-- 9. SEED SAMPLE PACKAGES (Optional)
-- ========================================

-- This section can be uncommented for initial seeding
/*
-- Insert sample beauty packages
INSERT INTO service_packages (name, slug, description, service_id, session_count, original_price, package_price, validity_days, is_featured, benefits, image_url, badge_text)
SELECT
  'Lash Perfection Package',
  'lash-perfection-6-sessions',
  'Six lash lifting sessions for perfectly curled lashes throughout the year. Includes aftercare kit for each session.',
  s.id,
  6,
  894, -- 6 x 149 zł
  749,
  365,
  true,
  ARRAY['Save 145 zł', 'Free aftercare kit', 'Flexible scheduling', 'Priority booking'],
  '/assets/packages/lash-perfection.webp',
  'Best Value'
FROM services s WHERE s.slug = 'rzesy-lifting-laminacja'
ON CONFLICT (slug) DO NOTHING;

-- Insert sample fitness packages
INSERT INTO service_packages (name, slug, description, service_id, session_count, original_price, package_price, validity_days, is_featured, benefits, image_url, badge_text)
SELECT
  'Glute Transformation Complete',
  'glute-transformation-complete',
  'Complete 8-week glute sculpting program with 24 sessions, nutrition guide, and progress tracking.',
  s.id,
  24,
  28800, -- 24 x 1200 zł
  24000,
  90,
  true,
  ARRAY['Save 4800 zł', 'Nutrition guide included', 'Weekly progress photos', 'Home workout plan'],
  '/assets/packages/glute-complete.webp',
  'Popular'
FROM services s WHERE s.slug = 'glute-sculpt-8w'
ON CONFLICT (slug) DO NOTHING;
*/