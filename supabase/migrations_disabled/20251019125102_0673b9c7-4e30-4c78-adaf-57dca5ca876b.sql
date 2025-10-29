-- Insert fitness services
INSERT INTO services (
  title, 
  slug, 
  description, 
  service_type, 
  price_from, 
  price_to, 
  duration_minutes,
  features,
  category,
  display_order,
  is_active
) VALUES
('Personal Training - 1 Session', 'personal-training-single', 'One-on-one personalized fitness training session tailored to your goals', 'fitness', 150, 200, 60, 
  ARRAY['Customized workout plan', 'Form correction', 'Goal tracking', 'Nutrition guidance'], 
  'Training', 1, true),
  
('Personal Training - 4 Sessions Pack', 'personal-training-4-pack', 'Four personal training sessions with progressive programming', 'fitness', 560, 760, 60,
  ARRAY['4 personalized sessions', '10% discount', 'Monthly progress tracking', 'Custom nutrition plan'],
  'Training', 2, true),
  
('Personal Training - 8 Sessions Pack', 'personal-training-8-pack', 'Eight personal training sessions with comprehensive fitness transformation', 'fitness', 1040, 1440, 60,
  ARRAY['8 personalized sessions', '20% discount', 'Body composition analysis', 'Meal planning support'],
  'Training', 3, true),
  
('Glute Sculpting Program', 'glute-sculpting', 'Specialized training program focused on glute development and lower body strength', 'fitness', 180, 220, 75,
  ARRAY['Targeted glute exercises', 'Progressive overload protocol', 'Video technique library', 'Weekly check-ins'],
  'Specialized', 4, true),
  
('Fitness Consultation', 'fitness-consultation', 'Initial fitness assessment and goal-setting session', 'fitness', 80, 100, 45,
  ARRAY['Body composition analysis', 'Goal setting', 'Program design overview', 'Nutrition basics'],
  'Assessment', 5, true),
  
('Couples Training', 'couples-training', 'Partner workout session for couples or friends', 'fitness', 220, 280, 60,
  ARRAY['Shared workout experience', 'Partner exercises', 'Motivation support', 'Flexible scheduling'],
  'Training', 6, true),
  
('Online Coaching - Monthly', 'online-coaching-monthly', 'Virtual personal training with weekly check-ins and program updates', 'fitness', 400, 600, NULL,
  ARRAY['Custom training plan', 'Weekly video calls', 'Meal planning', '24/7 message support', 'Monthly body assessments'],
  'Online', 7, true)
ON CONFLICT (slug) DO NOTHING;

-- Insert blog categories
INSERT INTO blog_categories (name, slug, description, icon, color) VALUES
('Beauty Tips', 'beauty-tips', 'Expert beauty and makeup advice', 'Sparkles', '#EC4899'),
('Fitness Guide', 'fitness-guide', 'Training and wellness tips', '#06B6D4', '#06B6D4'),
('Client Stories', 'client-stories', 'Success stories and transformations', 'Heart', '#8B5CF6'),
('Industry News', 'industry-news', 'Latest trends and updates', 'Newspaper', '#F59E0B')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample blog posts
INSERT INTO blog_posts (
  title,
  slug,
  excerpt,
  content,
  author_id,
  category_id,
  status,
  published_at
)
SELECT 
  'The Complete Guide to Permanent Makeup Aftercare',
  'permanent-makeup-aftercare-guide',
  'Everything you need to know about caring for your new permanent makeup to ensure the best results and longevity.',
  '# The Complete Guide to Permanent Makeup Aftercare

Permanent makeup is an investment in your beauty routine, and proper aftercare is essential for optimal results. Here''s everything you need to know about caring for your new permanent makeup.

## Immediate Aftercare (Days 1-7)

### Keep It Clean
- Gently clean the area with sterile water and mild soap
- Pat dry with a clean tissue
- Apply the provided aftercare ointment

### Avoid These
- Swimming pools and saunas
- Direct sun exposure
- Picking at scabs or flaking skin
- Heavy exercise that causes sweating

## Healing Process (Weeks 2-4)

The color will appear darker initially and will fade 30-50% during healing. This is completely normal!

### What to Expect
- Days 1-3: Color appears very bold
- Days 4-7: Light scabbing and flaking
- Week 2-4: True color emerges
- Week 6-8: Touch-up appointment

## Long-term Care

To maintain your permanent makeup for years:
- Use SPF 30+ on treated areas
- Avoid harsh chemical peels
- Schedule touch-ups every 1-2 years
- Keep skin moisturized

## When to Contact Me

Reach out immediately if you experience:
- Excessive swelling or redness
- Signs of infection
- Unusual discharge
- Severe pain

Remember, everyone heals differently. Following these guidelines will give you the best results!',
  (SELECT id FROM profiles LIMIT 1),
  (SELECT id FROM blog_categories WHERE slug = 'beauty-tips' LIMIT 1),
  'published',
  NOW() - INTERVAL '5 days'
WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'permanent-makeup-aftercare-guide');

INSERT INTO blog_posts (
  title,
  slug,
  excerpt,
  content,
  author_id,
  category_id,
  status,
  published_at
)
SELECT 
  'Building Your Dream Glutes: A Science-Based Approach',
  'building-dream-glutes-science',
  'Learn the science behind effective glute training and how to build strong, shapely glutes with progressive programming.',
  '# Building Your Dream Glutes: A Science-Based Approach

Want to build strong, shapely glutes? Understanding the science behind glute training is key to seeing real results.

## Understanding Glute Anatomy

The glutes consist of three main muscles:
- **Gluteus Maximus**: The largest muscle, responsible for hip extension
- **Gluteus Medius**: Provides stability and hip abduction  
- **Gluteus Minimus**: Works with medius for stability

## Key Principles for Glute Growth

### 1. Progressive Overload
Consistently increase the challenge by:
- Adding weight
- Increasing reps
- Improving time under tension
- Decreasing rest periods

### 2. Exercise Selection
Best exercises for glute development:
- Hip thrusts (the king of glute exercises)
- Bulgarian split squats
- Romanian deadlifts
- Cable pull-throughs
- Glute bridges

### 3. Training Frequency
Train glutes 2-3 times per week with:
- 48 hours rest between sessions
- Variety in rep ranges (6-20 reps)
- Mix of compound and isolation exercises

## Sample Glute Workout

**Workout A (Heavy)**
1. Barbell Hip Thrusts: 4x6-8
2. Bulgarian Split Squats: 3x8-10 each
3. Romanian Deadlifts: 3x8-10
4. Cable Pull-throughs: 3x12-15

**Workout B (Volume)**  
1. Hip Thrusts: 3x12-15
2. Walking Lunges: 3x12 each
3. Glute Bridges: 3x15-20
4. Cable Kickbacks: 3x15-20 each

## Nutrition Matters

Building muscle requires:
- Caloric surplus (200-300 calories above maintenance)
- 1.6-2.2g protein per kg bodyweight
- Adequate carbs for training energy
- Healthy fats for hormone production

## Common Mistakes

Avoid these pitfalls:
- Not feeling glutes working (check your form!)
- Doing too much cardio
- Insufficient protein intake
- Neglecting progressive overload

Results take time—stay consistent and trust the process!',
  (SELECT id FROM profiles LIMIT 1),
  (SELECT id FROM blog_categories WHERE slug = 'fitness-guide' LIMIT 1),
  'published',
  NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'building-dream-glutes-science');

-- Insert social posts
INSERT INTO social_posts (platform, post_url, image_url, caption, posted_at, is_featured) VALUES
('instagram', 'https://instagram.com/p/example1', '/src/assets/social-beauty-1.jpg', 'Fresh brow transformation ✨ Swipe to see the before and after! #PermanentMakeup #BrowGoals', NOW() - INTERVAL '3 days', true),
('instagram', 'https://instagram.com/p/example2', '/src/assets/social-fitness-1.jpg', 'Crushing goals with my amazing clients 💪 Progress over perfection! #FitnessJourney #PersonalTraining', NOW() - INTERVAL '1 day', true)
ON CONFLICT DO NOTHING;

-- Populate availability slots for studio (beauty services)
INSERT INTO availability_slots (day_of_week, start_time, end_time, service_type, location, is_available, notes)
VALUES
-- Monday-Friday Studio hours
(1, '09:00', '17:00', 'beauty', 'studio', true, 'Studio - Beauty services'),
(2, '09:00', '17:00', 'beauty', 'studio', true, 'Studio - Beauty services'),
(3, '09:00', '17:00', 'beauty', 'studio', true, 'Studio - Beauty services'),
(4, '09:00', '17:00', 'beauty', 'studio', true, 'Studio - Beauty services'),
(5, '09:00', '17:00', 'beauty', 'studio', true, 'Studio - Beauty services'),
-- Saturday reduced hours
(6, '10:00', '15:00', 'beauty', 'studio', true, 'Studio - Beauty services (Weekend)')
ON CONFLICT DO NOTHING;

-- Populate availability slots for gym (fitness services)
INSERT INTO availability_slots (day_of_week, start_time, end_time, service_type, location, is_available, notes)
VALUES
-- Monday-Friday Gym hours
(1, '17:00', '21:00', 'fitness', 'gym', true, 'Zdrofit - Fitness training'),
(2, '17:00', '21:00', 'fitness', 'gym', true, 'Zdrofit - Fitness training'),
(3, '17:00', '21:00', 'fitness', 'gym', true, 'Zdrofit - Fitness training'),
(4, '17:00', '21:00', 'fitness', 'gym', true, 'Zdrofit - Fitness training'),
(5, '17:00', '21:00', 'fitness', 'gym', true, 'Zdrofit - Fitness training'),
-- Weekend gym hours
(6, '09:00', '14:00', 'fitness', 'gym', true, 'Zdrofit - Fitness training (Weekend)'),
(0, '09:00', '14:00', 'fitness', 'gym', true, 'Zdrofit - Fitness training (Weekend)')
ON CONFLICT DO NOTHING;