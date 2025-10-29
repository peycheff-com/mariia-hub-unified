-- Add translations support to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{"title": {}, "description": {}, "features": {}}'::jsonb;

-- Add category field
ALTER TABLE services ADD COLUMN IF NOT EXISTS category TEXT;

-- Add metadata for flexible additional data
ALTER TABLE services ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for better translation queries
CREATE INDEX IF NOT EXISTS idx_services_translations ON services USING gin(translations);

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);

-- Populate translations with existing data as English
UPDATE services 
SET translations = jsonb_build_object(
  'title', jsonb_build_object('en', title),
  'description', jsonb_build_object('en', description),
  'features', jsonb_build_object('en', COALESCE(features, ARRAY[]::text[]))
)
WHERE translations = '{"title": {}, "description": {}, "features": {}}'::jsonb;