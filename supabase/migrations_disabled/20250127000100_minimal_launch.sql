-- Minimal Launch Migration - Only essential tables for launch
-- This migration contains the critical tables needed for launch

-- 1. Feedback System
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('rating', 'review', 'bug_report', 'feature_request', 'complaint', 'compliment', 'suggestion', 'nps', 'user_experience', 'payment_experience')),
  category TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  title TEXT,
  content TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'addressed', 'resolved', 'dismissed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. System Monitoring
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(15,5),
  metric_unit TEXT,
  tags JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  url TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Polish VAT Compliance
CREATE TABLE IF NOT EXISTS nip_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nip_number TEXT NOT NULL UNIQUE,
  company_name TEXT,
  company_address TEXT,
  is_valid BOOLEAN NOT NULL,
  validation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  nip_info JSONB,
  seller_info JSONB DEFAULT '{}',
  buyer_info JSONB DEFAULT '{}',
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10,2) NOT NULL,
  vat_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  vat_rates JSONB DEFAULT '{}',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  currency TEXT DEFAULT 'PLN',
  payment_method TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Meta CAPI
CREATE TABLE IF NOT EXISTS meta_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  event_id TEXT UNIQUE,
  event_time BIGINT NOT NULL,
  user_data JSONB,
  custom_data JSONB,
  action_source TEXT NOT NULL DEFAULT 'website',
  event_source_url TEXT,
  data_processing_options JSONB DEFAULT '[]',
  test_event_code TEXT,
  original_event_data JSONB,
  conversion_value DECIMAL(10,2),
  currency TEXT DEFAULT 'PLN',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'retry')),
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMP WITH TIME ZONE,
  meta_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. VAT Rates
CREATE TABLE IF NOT EXISTS vat_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_category TEXT NOT NULL,
  vat_rate DECIMAL(5,2) NOT NULL,
  is_reverse_charge BOOLEAN DEFAULT FALSE,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Referral Program
CREATE TABLE IF NOT EXISTS referral_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('discount_percentage', 'discount_fixed', 'free_service', 'points', 'cash')),
  reward_value DECIMAL(10,2) NOT NULL,
  referrer_reward_type TEXT NOT NULL CHECK (referrer_reward_type IN ('discount_percentage', 'discount_fixed', 'free_service', 'points', 'cash')),
  referrer_reward_value DECIMAL(10,2) NOT NULL,
  max_uses_per_referrer INTEGER DEFAULT 10,
  max_uses_total INTEGER DEFAULT 1000,
  expiry_days INTEGER DEFAULT 365,
  is_active BOOLEAN DEFAULT true,
  conditions JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES referral_programs(id) ON DELETE CASCADE,
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  share_url TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended')),
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_meta_conversions_status ON meta_conversions(status);
CREATE INDEX IF NOT EXISTS idx_meta_conversions_event_time ON meta_conversions(event_time DESC);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_referrer_id ON referral_codes(referrer_id);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own feedback" ON feedback
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own invoices" ON invoices
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own referral codes" ON referral_codes
  FOR SELECT USING (referrer_id = auth.uid());

-- Insert default VAT rates
INSERT INTO vat_rates (service_category, vat_rate, description) VALUES
  ('beauty_standard', 23.00, 'Standard beauty services'),
  ('beauty_medical', 8.00, 'Medical beauty services'),
  ('fitness_standard', 23.00, 'Standard fitness services')
ON CONFLICT DO NOTHING;

-- Create default referral program
INSERT INTO referral_programs (name, description, reward_type, reward_value, referrer_reward_type, referrer_reward_value) VALUES
  ('Beauty Referral Program', 'Give 10% off to friends, earn 50 PLN for each successful referral', 'discount_percentage', 10.00, 'discount_fixed', 50.00)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL ON feedback TO authenticated;
GRANT ALL ON invoices TO authenticated;
GRANT ALL ON vat_rates TO authenticated;
GRANT ALL ON referral_codes TO authenticated;
GRANT ALL ON referral_programs TO authenticated;
GRANT SELECT ON system_metrics TO authenticated;
GRANT SELECT ON error_logs TO authenticated;
GRANT SELECT ON meta_conversions TO authenticated;