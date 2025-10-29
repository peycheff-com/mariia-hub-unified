-- Seed data for development
-- Insert some sample services

INSERT INTO services (title, description, service_type, category, duration_minutes, price, location_type) VALUES
  ('Lip Enhancement', 'Professional lip enhancement treatment for natural-looking results', 'beauty', 'lips', 60, 800.00, 'studio'),
  ('Brow Shaping', 'Expert brow shaping and tinting for perfect definition', 'beauty', 'brows', 45, 250.00, 'studio'),
  ('Glutes Training', 'Intensive glutes training program for optimal results', 'fitness', 'strength', 60, 150.00, 'studio'),
  ('Fitness Starter', 'Introduction to fitness with personalized program', 'fitness', 'beginner', 45, 100.00, 'studio');

-- Insert some sample availability slots
INSERT INTO availability_slots (service_id, date, start_time, end_time, location_type, capacity) VALUES
  ((SELECT id FROM services WHERE title = 'Lip Enhancement' LIMIT 1), CURRENT_DATE + INTERVAL '1 day', '09:00', '10:00', 'studio', 1),
  ((SELECT id FROM services WHERE title = 'Lip Enhancement' LIMIT 1), CURRENT_DATE + INTERVAL '1 day', '10:00', '11:00', 'studio', 1),
  ((SELECT id FROM services WHERE title = 'Brow Shaping' LIMIT 1), CURRENT_DATE + INTERVAL '1 day', '11:00', '12:00', 'studio', 1),
  ((SELECT id FROM services WHERE title = 'Glutes Training' LIMIT 1), CURRENT_DATE + INTERVAL '1 day', '14:00', '15:00', 'studio', 1),
  ((SELECT id FROM services WHERE title = 'Fitness Starter' LIMIT 1), CURRENT_DATE + INTERVAL '1 day', '16:00', '17:00', 'studio', 1);

-- Note: Admin user profile will be created when user signs up
-- The profiles table references auth.users(id) so we can't insert without an auth user