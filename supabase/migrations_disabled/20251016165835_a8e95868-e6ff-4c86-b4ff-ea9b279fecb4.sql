-- Add categories to existing services based on their titles
UPDATE services 
SET category = CASE 
  WHEN title ILIKE '%eyebrow%' OR title ILIKE '%brow%' THEN 'eyebrows'
  WHEN title ILIKE '%lips%' OR title ILIKE '%lip%' THEN 'lips'
  WHEN title ILIKE '%eye%' OR title ILIKE '%lash%' THEN 'eyes'
  WHEN title ILIKE '%microblading%' THEN 'microblading'
  WHEN title ILIKE '%personal training%' OR title ILIKE '%single session%' THEN 'personal_training'
  WHEN title ILIKE '%10 session%' OR title ILIKE '%package%' THEN 'training_packages'
  WHEN title ILIKE '%post-pregnancy%' OR title ILIKE '%recovery%' THEN 'specialized_programs'
  WHEN title ILIKE '%glute%' OR title ILIKE '%8-week%' THEN 'specialized_programs'
  WHEN title ILIKE '%wellness%' OR title ILIKE '%consultation%' THEN 'wellness'
  WHEN title ILIKE '%lifestyle%' OR title ILIKE '%coaching%' THEN 'coaching'
  ELSE 'general'
END
WHERE category IS NULL;

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_service_type_category ON services(service_type, category);

-- Create index on bookings mirror_status for faster filtering
CREATE INDEX IF NOT EXISTS idx_bookings_mirror_status ON bookings(mirror_status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_type_mirror_status ON bookings(booking_type, mirror_status);