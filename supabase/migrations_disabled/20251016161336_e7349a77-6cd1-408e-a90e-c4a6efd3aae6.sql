-- Update Booksy integration settings with correct business information
-- Business ID from URL: https://booksy.com/pl-pl/173111_b-m-beauty-studio_brwi-i-rzesy_3_warszawa

-- Upsert Booksy Business ID
INSERT INTO integration_settings (key, value, description, is_configured)
VALUES (
  'booksy_business_id',
  '173111',
  'B&M Beauty Studio - Booksy Business ID',
  true
)
ON CONFLICT (key) 
DO UPDATE SET 
  value = '173111',
  description = 'B&M Beauty Studio - Booksy Business ID',
  is_configured = true,
  updated_at = now();

-- Upsert Booksy Business URL
INSERT INTO integration_settings (key, value, description, is_configured)
VALUES (
  'booksy_business_url',
  'https://booksy.com/pl-pl/173111_b-m-beauty-studio_brwi-i-rzesy_3_warszawa',
  'B&M Beauty Studio - Full Booksy URL',
  true
)
ON CONFLICT (key) 
DO UPDATE SET 
  value = 'https://booksy.com/pl-pl/173111_b-m-beauty-studio_brwi-i-rzesy_3_warszawa',
  description = 'B&M Beauty Studio - Full Booksy URL',
  is_configured = true,
  updated_at = now();

-- Upsert Booksy Business Name
INSERT INTO integration_settings (key, value, description, is_configured)
VALUES (
  'booksy_business_name',
  'B&M Beauty Studio',
  'Business name on Booksy',
  true
)
ON CONFLICT (key) 
DO UPDATE SET 
  value = 'B&M Beauty Studio',
  description = 'Business name on Booksy',
  is_configured = true,
  updated_at = now();

-- Upsert Booksy Location
INSERT INTO integration_settings (key, value, description, is_configured)
VALUES (
  'booksy_location',
  'Warszawa',
  'Business location on Booksy',
  true
)
ON CONFLICT (key) 
DO UPDATE SET 
  value = 'Warszawa',
  description = 'Business location on Booksy',
  is_configured = true,
  updated_at = now();