-- Seed service content for beauty services
INSERT INTO service_content (service_id, aftercare_instructions, preparation_instructions, contraindications, what_to_expect)
SELECT 
  s.id,
  CASE s.slug
    WHEN 'lips-permanent-makeup' THEN 'Avoid water contact for 24h. Apply healing balm 3-4x daily. No makeup on treated area for 7 days. Avoid sun exposure, saunas, and swimming pools for 2 weeks.'
    WHEN 'brows-permanent-makeup' THEN 'Keep dry for 24h. Apply healing ointment 2-3x daily. No makeup on brows for 7 days. Avoid sweating, sun, and water activities for 2 weeks.'
    WHEN 'eyeliner-permanent-makeup' THEN 'No eye makeup for 7 days. Apply prescribed ointment as directed. Avoid water contact for 24h. No swimming, sauna, or intense workouts for 2 weeks.'
    WHEN 'laser-hair-removal' THEN 'Avoid sun exposure for 2 weeks. Use SPF 50+ daily. No hot showers, saunas, or intense exercise for 48h. Moisturize treated area daily.'
    WHEN 'bbl-photofacial' THEN 'Use SPF 50+ daily. Avoid direct sun for 2 weeks. Moisturize well. No harsh skincare products for 48h. Pigmentation may darken before flaking off.'
    WHEN 'carbon-peel' THEN 'Gentle cleansing only for 24h. Use SPF 50+ daily. Avoid active ingredients for 48h. Hydrate skin well. No exfoliation for 3 days.'
  END,
  CASE s.slug
    WHEN 'lips-permanent-makeup' THEN 'No blood-thinning medications 48h before. Avoid alcohol 24h prior. Come with clean, makeup-free lips. Bring your favorite lip color for reference.'
    WHEN 'brows-permanent-makeup' THEN 'No blood thinners or alcohol 48h before. Avoid caffeine on treatment day. Come with clean face, no makeup. Don''t tweeze or wax for 2 weeks prior.'
    WHEN 'eyeliner-permanent-makeup' THEN 'Remove contact lenses before treatment. No eye makeup on treatment day. Avoid blood thinners 48h before. No lash extensions during healing.'
    WHEN 'laser-hair-removal' THEN 'Shave treated area 24h before. No waxing or plucking for 4 weeks prior. Avoid sun exposure for 2 weeks before. Clean skin, no lotions on treatment day.'
    WHEN 'bbl-photofacial' THEN 'No sun exposure or tanning for 2 weeks before. Avoid retinol 1 week prior. Clean face, no makeup. Inform us of any new medications.'
    WHEN 'carbon-peel' THEN 'Avoid active ingredients 48h before. No recent chemical peels. Clean face required. Inform us about any recent laser treatments.'
  END,
  CASE s.slug
    WHEN 'lips-permanent-makeup' THEN ARRAY['Pregnancy or breastfeeding', 'Active cold sores or herpes', 'Keloid scarring tendency', 'Blood clotting disorders', 'Recent lip fillers (wait 4 weeks)', 'Autoimmune conditions']
    WHEN 'brows-permanent-makeup' THEN ARRAY['Pregnancy or breastfeeding', 'Active skin infections', 'Keloid scarring', 'Chemotherapy or radiation', 'Recent Botox in forehead (wait 2 weeks)', 'Uncontrolled diabetes']
    WHEN 'eyeliner-permanent-makeup' THEN ARRAY['Eye infections or styes', 'Recent eye surgery', 'Glaucoma', 'Pregnancy/breastfeeding', 'Keloid scarring', 'Autoimmune eye conditions']
    WHEN 'laser-hair-removal' THEN ARRAY['Pregnancy', 'Active tan or sunburn', 'Photosensitizing medications', 'Recent waxing', 'Skin cancer history in treated area', 'Active infections']
    WHEN 'bbl-photofacial' THEN ARRAY['Pregnancy', 'Active tan', 'Melasma', 'Recent isotretinoin use', 'Photosensitive conditions', 'Dark skin types (consult required)']
    WHEN 'carbon-peel' THEN ARRAY['Active acne breakouts', 'Open wounds', 'Recent chemical peels', 'Pregnancy', 'Rosacea (severe)', 'Eczema in treatment area']
  END,
  CASE s.slug
    WHEN 'lips-permanent-makeup' THEN ARRAY['Slight swelling for 24-48h', 'Color appears darker initially', 'Flaking after 3-5 days', '30-40% color fade after healing', 'Touch-up needed at 6-8 weeks']
    WHEN 'brows-permanent-makeup' THEN ARRAY['Redness for a few hours', 'Color looks bold for first week', 'Scabbing days 3-5', 'Final color visible after 4 weeks', 'Touch-up recommended 6-8 weeks']
    WHEN 'eyeliner-permanent-makeup' THEN ARRAY['Mild swelling 24h', 'Liner appears darker initially', 'Slight crustiness days 2-4', 'Color softens after healing', 'Minimal downtime']
    WHEN 'laser-hair-removal' THEN ARRAY['Slight redness immediately', 'Hair sheds in 1-2 weeks', 'Results visible after 2-3 sessions', 'Some regrowth between sessions', '6-8 sessions for best results']
    WHEN 'bbl-photofacial' THEN ARRAY['Slight redness 2-4h', 'Brown spots darken before fading', 'Flaking possible days 5-7', 'Brighter skin in 1-2 weeks', 'Progressive results over 3-5 sessions']
    WHEN 'carbon-peel' THEN ARRAY['Instant glow', 'Slight warmth during treatment', 'No downtime', 'Tighter pores immediately', 'Best results with series of 4-6']
  END
FROM services s
WHERE s.slug IN ('lips-permanent-makeup', 'brows-permanent-makeup', 'eyeliner-permanent-makeup', 'laser-hair-removal', 'bbl-photofacial', 'carbon-peel')
ON CONFLICT (service_id) DO UPDATE SET
  aftercare_instructions = EXCLUDED.aftercare_instructions,
  preparation_instructions = EXCLUDED.preparation_instructions,
  contraindications = EXCLUDED.contraindications,
  what_to_expect = EXCLUDED.what_to_expect;

-- Seed FAQs for lips permanent makeup
INSERT INTO service_faqs (service_id, question, answer, display_order)
SELECT s.id, q.question, q.answer, q.ord
FROM services s,
LATERAL (VALUES
  ('Does it hurt?', 'Most clients rate it 3-4/10 with topical anesthetic. We use multiple numbing applications for your comfort.', 1),
  ('How long does it last?', 'Typically 2-3 years depending on skin type, lifestyle, and sun exposure. Annual touch-ups maintain optimal color.', 2),
  ('What if I have fillers?', 'Wait 4 weeks after filler injections before permanent makeup. We can coordinate timing with your injector.', 3),
  ('Can I choose any color?', 'We customize the color to your natural lip tone and preferences during consultation. Bring inspiration photos!', 4),
  ('How long is healing?', 'Initial healing is 7-10 days. Full color stabilization takes 4-6 weeks. Touch-up scheduled at 6-8 weeks.', 5)
) q(question, answer, ord)
WHERE s.slug = 'lips-permanent-makeup';

-- Seed FAQs for brows permanent makeup
INSERT INTO service_faqs (service_id, question, answer, display_order)
SELECT s.id, q.question, q.answer, q.ord
FROM services s,
LATERAL (VALUES
  ('Microblading vs powder brows?', 'Microblading creates hair strokes, powder brows give a soft makeup look. We recommend based on your skin type and desired result.', 1),
  ('How long does it last?', '1-3 years depending on technique, skin type, and lifestyle. Oily skin fades faster. Touch-ups extend longevity.', 2),
  ('Will it look natural?', 'Yes! We map your brows to your facial structure and use multiple color shades for dimension and natural appearance.', 3),
  ('Can I still tweeze?', 'Only outside the tattooed area. The PMU creates a shape template, but you can maintain edges.', 4),
  ('What about Botox?', 'Wait 2 weeks after Botox before PMU, or 2 weeks after PMU before Botox to avoid migration.', 5)
) q(question, answer, ord)
WHERE s.slug = 'brows-permanent-makeup';

-- Seed FAQs for laser hair removal
INSERT INTO service_faqs (service_id, question, answer, display_order)
SELECT s.id, q.question, q.answer, q.ord
FROM services s,
LATERAL (VALUES
  ('How many sessions needed?', 'Most clients need 6-8 sessions for 80-90% reduction. Hair grows in cycles, so multiple treatments target all follicles.', 1),
  ('Is it permanent?', 'Most hair is permanently reduced, but hormonal changes may cause some regrowth. Maintenance sessions keep you smooth.', 2),
  ('Does it work on all skin types?', 'Our technology is safe for most skin tones. Consultation required for very dark skin to ensure safe, effective treatment.', 3),
  ('Can I wax between sessions?', 'No! Shave only. Waxing removes the hair root that laser targets. Shave 24h before each appointment.', 4),
  ('When will I see results?', 'Hair sheds 1-2 weeks post-treatment. After 2-3 sessions, you''ll notice significant reduction and slower regrowth.', 5)
) q(question, answer, ord)
WHERE s.slug = 'laser-hair-removal';