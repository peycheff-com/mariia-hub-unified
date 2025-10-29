-- Analytics cache table for pre-computed metrics
CREATE TABLE IF NOT EXISTS analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Index for efficient cache lookups
CREATE INDEX idx_analytics_cache_key ON analytics_cache(key);
CREATE INDEX idx_analytics_cache_expires_at ON analytics_cache(expires_at);

-- Report templates table
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  metrics TEXT[] NOT NULL,
  date_range TEXT NOT NULL DEFAULT '30days',
  frequency TEXT NOT NULL DEFAULT 'once' CHECK (frequency IN ('once', 'daily', 'weekly', 'monthly')),
  recipients TEXT[] DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Index for report templates
CREATE INDEX idx_report_templates_created_by ON report_templates(created_by);
CREATE INDEX idx_report_templates_frequency ON report_templates(frequency);

-- Report schedule table for automated report generation
CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
  next_run TIMESTAMP WITH TIME ZONE NOT NULL,
  last_run TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Index for report schedules
CREATE INDEX idx_report_schedules_template_id ON report_schedules(template_id);
CREATE INDEX idx_report_schedules_next_run ON report_schedules(next_run) WHERE is_active = true;

-- Generated reports history
CREATE TABLE IF NOT EXISTS generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,
  file_path TEXT,
  file_type TEXT NOT NULL DEFAULT 'json' CHECK (file_type IN ('json', 'csv', 'pdf')),
  date_range_start DATE,
  date_range_end DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  generated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  file_size BIGINT,
  error_message TEXT
);

-- Index for generated reports
CREATE INDEX idx_generated_reports_template_id ON generated_reports(template_id);
CREATE INDEX idx_generated_reports_generated_at ON generated_reports(generated_at);
CREATE INDEX idx_generated_reports_status ON generated_reports(status);

-- Row Level Security
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;

-- Analytics cache policies - only admin can read/write
CREATE POLICY "Admin full access to analytics cache" ON analytics_cache
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Report templates policies
CREATE POLICY "Admin full access to report templates" ON report_templates
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Report schedules policies
CREATE POLICY "Admin full access to report schedules" ON report_schedules
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Generated reports policies
CREATE POLICY "Admin full access to generated reports" ON generated_reports
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for report_templates
CREATE TRIGGER update_report_templates_updated_at
  BEFORE UPDATE ON report_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM analytics_cache WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Schedule the cleanup function to run daily
SELECT cron.schedule(
  'cleanup-analytics-cache',
  '0 2 * * *', -- Run at 2 AM every day
  'SELECT cleanup_expired_cache();'
);

-- Insert default report templates
INSERT INTO report_templates (name, description, metrics, date_range, frequency, is_default) VALUES
(
  'Monthly Business Report',
  'Comprehensive monthly report covering all key business metrics',
  ARRAY['revenue', 'bookings', 'clients', 'services', 'providers'],
  'lastMonth',
  'monthly',
  true
),
(
  'Weekly Performance Summary',
  'Weekly overview of business performance and trends',
  ARRAY['revenue', 'bookings', 'services'],
  '7days',
  'weekly',
  true
),
(
  'Client Analytics Report',
  'Deep dive into client demographics and behavior',
  ARRAY['clients', 'retention', 'funnel'],
  '30days',
  'monthly',
  true
) ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON analytics_cache TO authenticated;
GRANT ALL ON report_templates TO authenticated;
GRANT ALL ON report_schedules TO authenticated;
GRANT ALL ON generated_reports TO authenticated;

-- Grant usage on sequences
GRANT USAGE, SELECT ON SEQUENCE analytics_cache_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE report_templates_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE report_schedules_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE generated_reports_id_seq TO authenticated;