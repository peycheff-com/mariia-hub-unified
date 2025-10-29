-- Translation Glossary System
-- Stores approved terminology and company-specific terms

-- Translation Glossary Table
CREATE TABLE IF NOT EXISTS translation_glossary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_term TEXT NOT NULL,
  target_term TEXT NOT NULL,
  source_lang VARCHAR(10) NOT NULL,
  target_lang VARCHAR(10) NOT NULL,
  domain VARCHAR(100),
  definition TEXT,
  notes TEXT,
  approved BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_glossary_source_term ON translation_glossary(source_term, source_lang);
CREATE INDEX idx_glossary_target_term ON translation_glossary(target_term, target_lang);
CREATE INDEX idx_glossary_domain ON translation_glossary(domain);
CREATE INDEX idx_glossary_approved ON translation_glossary(approved);
CREATE INDEX idx_glossary_lang_pair ON translation_glossary(source_lang, target_lang);

-- RLS Policies
ALTER TABLE translation_glossary ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved glossary terms
CREATE POLICY "Anyone can view approved glossary terms" ON translation_glossary
  FOR SELECT USING (approved = true);

-- Translators can view all glossary terms
CREATE POLICY "Translators can view all glossary terms" ON translation_glossary
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles
      WHERE role IN ('translator', 'admin', 'super_admin')
    )
  );

-- Translators can insert glossary terms
CREATE POLICY "Translators can insert glossary terms" ON translation_glossary
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_roles
      WHERE role IN ('translator', 'admin', 'super_admin')
    )
  );

-- Translators can update glossary terms
CREATE POLICY "Translators can update glossary terms" ON translation_glossary
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles
      WHERE role IN ('translator', 'admin', 'super_admin')
    )
  );

-- Function to search glossary terms
CREATE OR REPLACE FUNCTION search_glossary_terms(
  search_term TEXT,
  source_lang VARCHAR(10),
  target_lang VARCHAR(10),
  domain_filter TEXT DEFAULT NULL,
  include_unapproved BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  source_term TEXT,
  target_term TEXT,
  domain VARCHAR(100),
  definition TEXT,
  approved BOOLEAN,
  score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.source_term,
    g.target_term,
    g.domain,
    g.definition,
    g.approved,
    CASE
      WHEN g.source_term = search_term THEN 1.0
      ELSE similarity(g.source_term, search_term)
    END as score
  FROM translation_glossary g
  WHERE g.source_lang = search_glossary_terms.source_lang
    AND g.target_lang = search_glossary_terms.target_lang
    AND (include_unapproved OR g.approved = true)
    AND (domain_filter IS NULL OR g.domain = domain_filter)
    AND (
      g.source_term = search_term OR
      similarity(g.source_term, search_term) > 0.3
    )
  ORDER BY
    CASE
      WHEN g.source_term = search_term THEN 1
      ELSE 2
    END,
    score DESC,
    g.approved DESC;
END;
$$ LANGUAGE plpgsql;

-- Initialize with common beauty and fitness terms
INSERT INTO translation_glossary (source_term, target_term, source_lang, target_lang, domain, definition, approved) VALUES
  -- Beauty terms
  ('Lip Enhancement', 'Powiększanie ust', 'en', 'pl', 'Beauty', 'Cosmetic procedure to enhance lip appearance', true),
  ('Brow Lamination', 'Laminacja brwi', 'en', 'pl', 'Beauty', 'Procedure to shape and set eyebrow hairs', true),
  ('Semi-permanent Makeup', 'Makijaż permanentny', 'en', 'pl', 'Beauty', 'Cosmetic tattooing for long-lasting makeup', true),
  ('Microblading', 'Mikroblading', 'en', 'pl', 'Beauty', 'Manual tattooing technique for eyebrows', true),
  ('Facial Treatment', 'Zabieg na twarz', 'en', 'pl', 'Beauty', 'Skincare procedure for the face', true),
  ('Anti-aging', 'Przeciwzmarszczkowy', 'en', 'pl', 'Beauty', 'Products or treatments that reduce signs of aging', true),
  ('Dermal Fillers', 'Wypełniacze skórne', 'en', 'pl', 'Beauty', 'Injectable substances to restore volume', true),
  ('Chemical Peel', 'Peeling chemiczny', 'en', 'pl', 'Beauty', 'Skin treatment using chemical solutions', true),

  -- Fitness terms
  ('Personal Training', 'Trening personalny', 'en', 'pl', 'Fitness', 'One-on-one fitness instruction', true),
  ('Group Fitness', 'Fitness grupowy', 'en', 'pl', 'Fitness', 'Exercise classes with multiple participants', true),
  ('Strength Training', 'Trening siłowy', 'en', 'pl', 'Fitness', 'Exercises to build muscle strength', true),
  ('Cardio Workout', 'Trening kardio', 'en', 'pl', 'Fitness', 'Exercise to improve cardiovascular health', true),
  ('Nutrition Plan', 'Plan żywieniowy', 'en', 'pl', 'Fitness', 'Structured diet for fitness goals', true),
  ('Body Transformation', 'Transformacja sylwetki', 'en', 'pl', 'Fitness', 'Complete physical change through diet and exercise', true),
  ('Fitness Assessment', 'Ocena sprawności fizycznej', 'en', 'pl', 'Fitness', 'Evaluation of physical fitness levels', true),

  -- General terms
  ('Appointment', 'Wizyta', 'en', 'pl', 'General', 'Scheduled meeting or booking', true),
  ('Consultation', 'Konsultacja', 'en', 'pl', 'General', 'Professional advice session', true),
  ('Cancellation Policy', 'Regulamin odwołań', 'en', 'pl', 'General', 'Rules for canceling appointments', true),
  ('Payment Method', 'Metoda płatności', 'en', 'pl', 'General', 'Way to pay for services', true),
  ('Opening Hours', 'Godziny otwarcia', 'en', 'pl', 'General', 'Business operating times', true),
  ('Booking System', 'System rezerwacji', 'en', 'pl', 'General', 'Software for managing appointments', true)
ON CONFLICT DO NOTHING;