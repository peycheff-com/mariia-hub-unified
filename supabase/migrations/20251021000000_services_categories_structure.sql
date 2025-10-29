-- Create service categories table
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  service_type TEXT NOT NULL CHECK (service_type IN ('beauty', 'fitness', 'lifestyle')),
  display_order INT DEFAULT 0,
  icon TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create service subcategories table
CREATE TABLE IF NOT EXISTS service_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  display_order INT DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

-- Update services table to include category references
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES service_categories(id),
ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES service_subcategories(id),
ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS preparation_time INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS recovery_time INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS sessions_recommended INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS price_to INT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'PLN';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_subcategory ON services(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_services_type ON services(service_type);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);
CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON service_categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_type ON service_categories(service_type);

-- Add RLS policies
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_subcategories ENABLE ROW LEVEL SECURITY;

-- Everyone can read categories
CREATE POLICY "Categories are viewable by everyone" 
ON service_categories FOR SELECT 
USING (true);

CREATE POLICY "Subcategories are viewable by everyone" 
ON service_subcategories FOR SELECT 
USING (true);

-- Only admins can modify categories
CREATE POLICY "Only admins can insert categories" 
ON service_categories FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update categories" 
ON service_categories FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete categories" 
ON service_categories FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Same for subcategories
CREATE POLICY "Only admins can insert subcategories" 
ON service_subcategories FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update subcategories" 
ON service_subcategories FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete subcategories" 
ON service_subcategories FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

