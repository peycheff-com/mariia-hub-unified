-- Delete existing incorrect data
DELETE FROM service_faqs;
DELETE FROM service_content;

-- Seed Beauty Service Content
INSERT INTO service_content (service_id, aftercare_instructions, preparation_instructions, contraindications, what_to_expect)
SELECT 
  s.id,
  CASE s.slug
    WHEN 'permanent-makeup-lips' THEN 'Avoid water contact for 24h. Apply healing balm 3-4x daily. No makeup on treated area for 7 days. Avoid sun exposure, saunas, and swimming pools for 2 weeks.'
    WHEN 'permanent-makeup-eyebrows' THEN 'Keep dry for 24h. Apply healing ointment 2-3x daily. No makeup on brows for 7 days. Avoid sweating, sun, and water activities for 2 weeks.'
    WHEN 'microblading' THEN 'Keep dry for 24h. Apply prescribed ointment gently. No makeup on brows for 10 days. Avoid swimming, sauna, and intense exercise for 2 weeks.'
    WHEN 'lash-enhancement' THEN 'No eye makeup for 7 days. Keep dry for 24h. Apply prescribed ointment sparingly. No lash curlers or extensions for 2 weeks.'
  END,
  CASE s.slug
    WHEN 'permanent-makeup-lips' THEN 'No blood-thinning medications 48h before. Avoid alcohol 24h prior. Come with clean, makeup-free lips. Take antiviral medication if prone to cold sores.'
    WHEN 'permanent-makeup-eyebrows' THEN 'No blood thinners or alcohol 48h before. Avoid caffeine on treatment day. Come with clean face, no makeup. Don''t tweeze or wax for 2 weeks prior.'
    WHEN 'microblading' THEN 'Avoid Botox 2 weeks before. No blood thinners 48h prior. Clean face required. Don''t tweeze, tint, or wax brows for 1 week before.'
    WHEN 'lash-enhancement' THEN 'Remove contact lenses. No eye makeup on treatment day. Avoid blood thinners 48h before. Remove lash extensions before treatment.'
  END,
  CASE s.slug
    WHEN 'permanent-makeup-lips' THEN ARRAY['Pregnancy or breastfeeding', 'Active cold sores or herpes', 'Keloid scarring tendency', 'Blood clotting disorders', 'Recent lip fillers (wait 4 weeks)', 'Autoimmune conditions']
    WHEN 'permanent-makeup-eyebrows' THEN ARRAY['Pregnancy or breastfeeding', 'Active skin infections', 'Keloid scarring', 'Chemotherapy or radiation', 'Recent Botox in forehead (wait 2 weeks)', 'Uncontrolled diabetes']
    WHEN 'microblading' THEN ARRAY['Pregnancy/breastfeeding', 'Oily skin (powder brows recommended)', 'Keloid tendency', 'Blood thinners', 'Recent Botox (wait 2 weeks)', 'Active acne on brows']
    WHEN 'lash-enhancement' THEN ARRAY['Eye infections', 'Recent eye surgery', 'Extremely sensitive eyes', 'Alopecia in lash area', 'Pregnancy/breastfeeding', 'Keloid scarring']
  END,
  CASE s.slug
    WHEN 'permanent-makeup-lips' THEN ARRAY['Slight swelling for 24-48h', 'Color appears darker initially', 'Flaking after 3-5 days', '30-40% color fade after healing', 'Touch-up needed at 6-8 weeks']
    WHEN 'permanent-makeup-eyebrows' THEN ARRAY['Redness for a few hours', 'Color looks bold for first week', 'Scabbing days 3-5', 'Final color visible after 4 weeks', 'Touch-up recommended 6-8 weeks']
    WHEN 'microblading' THEN ARRAY['Hair-like strokes visible immediately', 'Some redness first day', 'Darker color first week', 'Strokes soften after healing', 'Touch-up at 6-8 weeks essential']
    WHEN 'lash-enhancement' THEN ARRAY['Subtle definition immediately', 'Minimal swelling possible', 'Slight crustiness days 2-3', 'Natural enhancement effect', 'Lasts 2-3 years']
  END
FROM services s
WHERE s.service_type = 'beauty';

-- Seed Fitness Service Content
INSERT INTO service_content (service_id, aftercare_instructions, preparation_instructions, contraindications, what_to_expect)
SELECT 
  s.id,
  CASE s.slug
    WHEN 'personal-training-single' THEN 'Rest 24-48h if sore. Stay hydrated. Stretch gently. Book next session within 1 week for momentum.'
    WHEN 'personal-training-package' THEN 'Follow provided recovery protocols. Track workouts in app. Schedule sessions consistently. Maintain protein intake.'
    WHEN 'online-coaching' THEN 'Complete weekly check-ins. Submit progress photos monthly. Follow meal plans. Message for form checks.'
    WHEN 'post-pregnancy-recovery' THEN 'Listen to your body. Stop if pain occurs. Gradual progression only. Clear with doctor before starting.'
  END,
  CASE s.slug
    WHEN 'personal-training-single' THEN 'Wear comfortable athletic clothing. Bring water bottle. Eat light meal 1-2h before. Arrive 5min early.'
    WHEN 'personal-training-package' THEN 'Medical clearance if needed. Baseline fitness assessment. Set clear goals. Commit to schedule.'
    WHEN 'online-coaching' THEN 'Access to gym or home equipment. Smartphone for app. Clear goal definition. Before photos required.'
    WHEN 'post-pregnancy-recovery' THEN 'Doctor clearance required. At least 6 weeks postpartum. Pelvic floor assessment recommended. Realistic expectations.'
  END,
  CASE s.slug
    WHEN 'personal-training-single' THEN ARRAY['Recent surgery (wait 6+ weeks)', 'Uncontrolled heart conditions', 'Severe injuries without medical clearance', 'Acute illness or fever']
    WHEN 'personal-training-package' THEN ARRAY['Uncontrolled chronic conditions', 'Recent surgery without clearance', 'Pregnancy complications', 'Severe joint issues']
    WHEN 'online-coaching' THEN ARRAY['Unable to access equipment', 'Eating disorders (get medical support first)', 'Severe mobility limitations', 'No internet access']
    WHEN 'post-pregnancy-recovery' THEN ARRAY['Less than 6 weeks postpartum', 'Unhealed C-section', 'Diastasis recti without clearance', 'Pelvic organ prolapse']
  END,
  CASE s.slug
    WHEN 'personal-training-single' THEN ARRAY['Assessment of current fitness', 'Customized workout plan', 'Form correction', 'Motivation and accountability', 'Immediate feedback']
    WHEN 'personal-training-package' THEN ARRAY['Progressive program design', 'Regular progress tracking', 'Nutrition guidance', 'Consistent accountability', 'Measurable results']
    WHEN 'online-coaching' THEN ARRAY['Weekly customized programs', 'Meal planning guidance', 'Progress photo analysis', 'Form checks via video', 'Flexible schedule']
    WHEN 'post-pregnancy-recovery' THEN ARRAY['Gentle core reconnection', 'Pelvic floor-safe exercises', 'Gradual strength building', 'Diastasis recti guidance', 'Energy level improvement']
  END
FROM services s
WHERE s.service_type = 'fitness';

-- Seed Lifestyle Service Content
INSERT INTO service_content (service_id, aftercare_instructions, preparation_instructions, contraindications, what_to_expect)
SELECT 
  s.id,
  CASE s.slug
    WHEN 'lifestyle-coaching-monthly' THEN 'Implement weekly action steps. Journal daily. Complete homework assignments. Schedule monthly check-ins.'
    WHEN 'wellness-consultation' THEN 'Review provided resources. Implement 1-2 suggestions. Book follow-up if needed. Reflect on discussed topics.'
  END,
  CASE s.slug
    WHEN 'lifestyle-coaching-monthly' THEN 'List current challenges. Define goals clearly. Commit to weekly calls. Be open and honest.'
    WHEN 'wellness-consultation' THEN 'Write down main concerns. List current habits. Bring health history. Set aside 60-90min.'
  END,
  CASE s.slug
    WHEN 'lifestyle-coaching-monthly' THEN ARRAY['Severe mental health conditions (seek therapy first)', 'Unable to commit weekly', 'Expecting quick fixes', 'Not ready for change']
    WHEN 'wellness-consultation' THEN ARRAY['Acute medical emergencies', 'Expecting medical diagnosis', 'Not open to lifestyle changes', 'Looking for supplements only']
  END,
  CASE s.slug
    WHEN 'lifestyle-coaching-monthly' THEN ARRAY['Goal clarity', 'Weekly action plans', 'Accountability support', 'Habit formation strategies', 'Mindset coaching']
    WHEN 'wellness-consultation' THEN ARRAY['Comprehensive assessment', 'Personalized recommendations', 'Lifestyle optimization tips', 'Resource sharing', 'Q&A session']
  END
FROM services s
WHERE s.service_type = 'lifestyle';