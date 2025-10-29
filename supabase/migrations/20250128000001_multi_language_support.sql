-- Multi-language support migration
-- Adds support for multiple languages, currencies, and regional settings

-- Add translation support to services
ALTER TABLE services ADD COLUMN translations JSONB DEFAULT '{}';
CREATE INDEX idx_services_translations ON services USING GIN (translations);

-- Add translation support to service content
ALTER TABLE service_content ADD COLUMN translations JSONB DEFAULT '{}';
ALTER TABLE service_content ADD COLUMN language TEXT DEFAULT 'en';
CREATE INDEX idx_service_content_translations ON service_content USING GIN (translations);
CREATE INDEX idx_service_content_language ON service_content(language);

-- Add translation support to blog posts
ALTER TABLE blog_posts ADD COLUMN translations JSONB DEFAULT '{}';
ALTER TABLE blog_posts ADD COLUMN language TEXT DEFAULT 'en';
CREATE INDEX idx_blog_posts_translations ON blog_posts USING GIN (translations);
CREATE INDEX idx_blog_posts_language ON blog_posts(language);

-- Add translation support to categories
ALTER TABLE categories ADD COLUMN translations JSONB DEFAULT '{}';

-- Add translation support to FAQ
ALTER TABLE faq ADD COLUMN translations JSONB DEFAULT '{}';

-- Add translation memory table
CREATE TABLE translation_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_text TEXT NOT NULL,
  target_text TEXT NOT NULL,
  source_lang TEXT NOT NULL CHECK (source_lang IN ('en', 'pl', 'ua', 'ru')),
  target_lang TEXT NOT NULL CHECK (target_lang IN ('en', 'pl', 'ua', 'ru')),
  context TEXT,
  category TEXT DEFAULT 'general',
  quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 1),
  usage_count INTEGER DEFAULT 1,
  last_used TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT REFERENCES auth.users(id),
  approved BOOLEAN DEFAULT FALSE,
  notes TEXT,

  CONSTRAINT unique_translation UNIQUE (source_text, target_text, source_lang, target_lang)
);

-- Indexes for translation memory
CREATE INDEX idx_translation_memory_source ON translation_memory(source_lang);
CREATE INDEX idx_translation_memory_target ON translation_memory(target_lang);
CREATE INDEX idx_translation_memory_category ON translation_memory(category);
CREATE INDEX idx_translation_memory_approved ON translation_memory(approved);
CREATE INDEX idx_translation_memory_quality ON translation_memory(quality_score);

-- Add full-text search for translations
ALTER TABLE translation_memory ADD COLUMN search_vector tsvector;
CREATE INDEX idx_translation_memory_search ON translation_memory USING GIN (search_vector);

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_translation_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.source_text, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.target_text, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.context, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(NEW.category, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update search vector
CREATE TRIGGER update_translation_search_vector_trigger
  BEFORE INSERT OR UPDATE ON translation_memory
  FOR EACH ROW EXECUTE FUNCTION update_translation_search_vector();

-- Add user preferences for language and currency
ALTER TABLE profiles ADD COLUMN preferred_language TEXT DEFAULT 'en';
ALTER TABLE profiles ADD COLUMN preferred_currency TEXT DEFAULT 'PLN';
ALTER TABLE profiles ADD COLUMN timezone TEXT DEFAULT 'Europe/Warsaw';
ALTER TABLE profiles ADD COLUMN date_format TEXT DEFAULT 'DD.MM.YYYY';
ALTER TABLE profiles ADD COLUMN time_format TEXT DEFAULT '24h';
ALTER TABLE profiles ADD COLUMN number_format TEXT DEFAULT 'pl-PL';
ALTER TABLE profiles ADD COLUMN payment_methods JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN metric_units BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN rtl_override BOOLEAN DEFAULT FALSE;

-- Add index for user preferences
CREATE INDEX idx_profiles_language ON profiles(preferred_language);
CREATE INDEX idx_profiles_currency ON profiles(preferred_currency);

-- Create regional settings table
CREATE TABLE regional_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL UNIQUE,
  country_name TEXT NOT NULL,
  default_language TEXT NOT NULL,
  default_currency TEXT NOT NULL,
  default_timezone TEXT NOT NULL,
  date_format TEXT NOT NULL,
  time_format TEXT NOT NULL,
  number_format TEXT NOT NULL,
  payment_methods JSONB NOT NULL,
  features JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert regional settings
INSERT INTO regional_settings (country_code, country_name, default_language, default_currency, default_timezone, date_format, time_format, number_format, payment_methods, features) VALUES
('PL', 'Poland', 'pl', 'PLN', 'Europe/Warsaw', 'DD.MM.YYYY', '24h', 'pl-PL', '["card", "blik", "transfer", "cash"]', '{"tax_inclusive": true, "military_time": true, "week_starts_on": 1, "driving_side": "right"}'),
('UA', 'Ukraine', 'ua', 'UAH', 'Europe/Kyiv', 'DD.MM.YYYY', '24h', 'uk-UA', '["card", "transfer", "cash"]', '{"tax_inclusive": true, "military_time": true, "week_starts_on": 1, "driving_side": "right"}'),
('BY', 'Belarus', 'ru', 'BYN', 'Europe/Minsk', 'DD.MM.YYYY', '24h', 'be-BY', '["card", "transfer", "cash"]', '{"tax_inclusive": true, "military_time": true, "week_starts_on": 1, "driving_side": "right"}'),
('GB', 'United Kingdom', 'en', 'GBP', 'Europe/London', 'DD/MM/YYYY', '12h', 'en-GB', '["card", "transfer", "cash"]', '{"tax_inclusive": true, "military_time": false, "week_starts_on": 1, "driving_side": "left"}'),
('US', 'United States', 'en', 'USD', 'America/New_York', 'MM/DD/YYYY', '12h', 'en-US', '["card", "transfer", "cash"]', '{"tax_inclusive": false, "military_time": false, "week_starts_on": 0, "driving_side": "right"}');

-- Create exchange rates table
CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate DECIMAL(12,6) NOT NULL,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_active_rate UNIQUE (from_currency, to_currency, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Insert default exchange rates (with PLN as base)
INSERT INTO exchange_rates (from_currency, to_currency, rate) VALUES
('PLN', 'PLN', 1.000000),
('PLN', 'EUR', 0.230000),
('PLN', 'USD', 0.250000),
('PLN', 'GBP', 0.200000),
('PLN', 'UAH', 10.000000),
('PLN', 'BYN', 0.780000),
('PLN', 'CHF', 0.220000),
('PLN', 'CZK', 5.850000);

-- Reverse rates
INSERT INTO exchange_rates (from_currency, to_currency, rate) VALUES
('EUR', 'PLN', 4.347826),
('USD', 'PLN', 4.000000),
('GBP', 'PLN', 5.000000),
('UAH', 'PLN', 0.100000),
('BYN', 'PLN', 1.282051),
('CHF', 'PLN', 4.545455),
('CZK', 'PLN', 0.170940);

-- Add indexes for exchange rates
CREATE INDEX idx_exchange_rates_from ON exchange_rates(from_currency);
CREATE INDEX idx_exchange_rates_to ON exchange_rates(to_currency);
CREATE INDEX idx_exchange_rates_active ON exchange_rates(is_active);
CREATE INDEX idx_exchange_rates_valid ON exchange_rates(valid_from, valid_until);

-- Function to get exchange rate
CREATE OR REPLACE FUNCTION get_exchange_rate(
  from_currency TEXT,
  to_currency TEXT
)
RETURNS DECIMAL(12,6) AS $$
DECLARE
  result DECIMAL(12,6);
BEGIN
  IF from_currency = to_currency THEN
    RETURN 1.0;
  END IF;

  SELECT rate INTO result
  FROM exchange_rates
  WHERE exchange_rates.from_currency = get_exchange_rate.from_currency
    AND exchange_rates.to_currency = get_exchange_rate.to_currency
    AND exchange_rates.is_active = TRUE
    AND (exchange_rates.valid_until IS NULL OR exchange_rates.valid_until > NOW())
  ORDER BY exchange_rates.valid_from DESC
  LIMIT 1;

  RETURN COALESCE(result, 1.0);
END;
$$ LANGUAGE plpgsql;

-- Add support for mixed-language content
ALTER TABLE reviews ADD COLUMN language TEXT DEFAULT 'en';
ALTER TABLE reviews ADD COLUMN original_text TEXT;
ALTER TABLE reviews ADD COLUMN translated_text JSONB DEFAULT '{}';

-- Add language-specific URLs
ALTER TABLE pages ADD COLUMN slug JSONB DEFAULT '{}';
CREATE INDEX idx_pages_slug ON pages USING GIN (slug);

-- Add localized meta tags
ALTER TABLE services ADD COLUMN meta_tags JSONB DEFAULT '{}';
ALTER TABLE blog_posts ADD COLUMN meta_tags JSONB DEFAULT '{}';

-- Function to increment translation usage
CREATE OR REPLACE FUNCTION increment_translation_usage(
  translation_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE translation_memory
  SET usage_count = usage_count + 1,
      last_used = NOW()
  WHERE id = increment_translation_usage.translation_id;
END;
$$ LANGUAGE plpgsql;

-- View for translation statistics
CREATE VIEW translation_stats AS
SELECT
  source_lang,
  target_lang,
  category,
  COUNT(*) as total_translations,
  COUNT(*) FILTER (WHERE approved = TRUE) as approved_translations,
  AVG(quality_score) as avg_quality,
  SUM(usage_count) as total_usage,
  MAX(last_used) as last_used
FROM translation_memory
GROUP BY source_lang, target_lang, category;

-- Row Level Security policies
ALTER TABLE translation_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Policies for translation memory
CREATE POLICY "Anyone can view approved translations"
  ON translation_memory
  FOR SELECT
  USING (approved = TRUE);

CREATE POLICY "Admins can manage all translations"
  ON translation_memory
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Policies for regional settings
CREATE POLICY "Anyone can view active regional settings"
  ON regional_settings
  FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage regional settings"
  ON regional_settings
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Policies for exchange rates
CREATE POLICY "Anyone can view active exchange rates"
  ON exchange_rates
  FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage exchange rates"
  ON exchange_rates
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_translation_memory_updated_at
  BEFORE UPDATE ON translation_memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regional_settings_updated_at
  BEFORE UPDATE ON regional_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exchange_rates_updated_at
  BEFORE UPDATE ON exchange_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE translation_memory IS 'Stores translation segments for reuse across the application';
COMMENT ON TABLE regional_settings IS 'Regional configuration for different countries';
COMMENT ON TABLE exchange_rates IS 'Currency exchange rates with validity period';
COMMENT ON COLUMN services.translations IS 'JSON object with translations in different languages';
COMMENT ON COLUMN service_content.translations IS 'Translated content for different languages';
COMMENT ON COLUMN profiles.preferred_language IS 'User''s preferred interface language';
COMMENT ON COLUMN profiles.preferred_currency IS 'User''s preferred currency for pricing';