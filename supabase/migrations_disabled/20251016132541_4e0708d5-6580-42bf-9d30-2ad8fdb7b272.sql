-- Seed FAQs for Permanent Makeup Lips
INSERT INTO service_faqs (service_id, question, answer, display_order)
SELECT s.id, q.question, q.answer, q.ord FROM services s,
LATERAL (VALUES
  ('Does it hurt?', 'Most clients rate it 3-4/10 with topical anesthetic. Multiple numbing applications ensure your comfort throughout.', 1),
  ('How long does it last?', 'Typically 2-3 years depending on skin type, lifestyle, and sun exposure. Annual touch-ups maintain optimal color.', 2),
  ('What if I have fillers?', 'Wait 4 weeks after filler injections before PMU. We can coordinate timing with your injector for best results.', 3),
  ('Can I choose any color?', 'We customize color to your natural lip tone and preferences during consultation. Bring inspiration photos!', 4),
  ('How long is healing?', 'Initial healing takes 7-10 days. Full color stabilization happens at 4-6 weeks. Touch-up scheduled at 6-8 weeks.', 5)
) q(question, answer, ord) WHERE s.slug = 'permanent-makeup-lips';

-- Seed FAQs for Permanent Makeup Eyebrows
INSERT INTO service_faqs (service_id, question, answer, display_order)
SELECT s.id, q.question, q.answer, q.ord FROM services s,
LATERAL (VALUES
  ('Microblading vs powder brows?', 'Microblading creates hair strokes, powder brows give soft makeup look. We recommend based on your skin type.', 1),
  ('How long does it last?', '1-3 years depending on technique and skin type. Oily skin fades faster. Touch-ups extend longevity.', 2),
  ('Will it look natural?', 'Yes! We map brows to your facial structure and use multiple color shades for dimension and natural appearance.', 3),
  ('Can I still tweeze?', 'Only outside the tattooed area. The PMU creates a shape template while you maintain edges.', 4),
  ('What about Botox?', 'Wait 2 weeks after Botox before PMU, or 2 weeks after PMU before Botox to avoid migration.', 5)
) q(question, answer, ord) WHERE s.slug = 'permanent-makeup-eyebrows';

-- Seed FAQs for Microblading
INSERT INTO service_faqs (service_id, question, answer, display_order)
SELECT s.id, q.question, q.answer, q.ord FROM services s,
LATERAL (VALUES
  ('Is microblading right for oily skin?', 'Powder brows are better for oily skin as microblading strokes may blur. We assess during consultation.', 1),
  ('How is it different from tattoo?', 'We use specialized pigments that fade naturally and techniques that mimic real brow hairs for realistic results.', 2),
  ('Will the strokes stay crisp?', 'With proper care and touch-ups, yes. Annual maintenance keeps them looking fresh and defined.', 3),
  ('Can I go swimming after?', 'No water activities for 2 weeks during healing. After that, use SPF to preserve color longevity.', 4),
  ('How do I maintain them?', 'Annual touch-ups, daily SPF, and avoiding harsh exfoliants on brows will keep them looking great.', 5)
) q(question, answer, ord) WHERE s.slug = 'microblading';

-- Seed FAQs for Lash Enhancement
INSERT INTO service_faqs (service_id, question, answer, display_order)
SELECT s.id, q.question, q.answer, q.ord FROM services s,
LATERAL (VALUES
  ('Is it safer than eyeliner?', 'Yes, we tattoo between lashes rather than on the lid, reducing sensitivity and looking more natural.', 1),
  ('Will I still need mascara?', 'Many clients skip mascara for daily wear. You can still use it for special occasions if desired.', 2),
  ('How subtle is it?', 'Very subtle - it defines your lash line without looking like obvious makeup. Perfect natural enhancement.', 3),
  ('What about lash extensions?', 'Wait 2 weeks after lash enhancement before applying extensions. Remove extensions before treatment.', 4),
  ('Can I wear contacts?', 'Remove contacts before treatment. You can resume wearing them 24h after the procedure.', 5)
) q(question, answer, ord) WHERE s.slug = 'lash-enhancement';

-- Seed FAQs for Personal Training Single
INSERT INTO service_faqs (service_id, question, answer, display_order)
SELECT s.id, q.question, q.answer, q.ord FROM services s,
LATERAL (VALUES
  ('What happens in first session?', 'Fitness assessment, goal discussion, sample workout, and form coaching. We create your personalized plan.', 1),
  ('Do I need gym experience?', 'No! We work with all fitness levels from complete beginners to advanced athletes.', 2),
  ('Can I book just one session?', 'Yes, perfect for form checks, new exercise learning, or trying personal training before committing to package.', 3),
  ('Where do we train?', 'At my private studio in Warsaw Śródmieście. Fully equipped with professional training equipment.', 4),
  ('What should I bring?', 'Comfortable athletic clothes, water bottle, and positive attitude. I provide all equipment.', 5)
) q(question, answer, ord) WHERE s.slug = 'personal-training-single';

-- Seed FAQs for Personal Training Package
INSERT INTO service_faqs (service_id, question, answer, display_order)
SELECT s.id, q.question, q.answer, q.ord FROM services s,
LATERAL (VALUES
  ('How long is the program?', '10 sessions typically span 5-10 weeks depending on your schedule. Consistency brings best results.', 1),
  ('Can I pause my package?', 'Yes, communicate if you need a break. Sessions are valid for 6 months from purchase.', 2),
  ('What results can I expect?', 'Depends on goals and consistency. Most clients see visible changes in 4-6 weeks with proper nutrition.', 3),
  ('Is nutrition included?', 'Yes! Basic nutrition guidance and meal planning principles are included in all packages.', 4),
  ('Can I train with a friend?', 'Semi-private training available for 2 people. Contact me to discuss pricing and availability.', 5)
) q(question, answer, ord) WHERE s.slug = 'personal-training-package';

-- Seed FAQs for Online Coaching
INSERT INTO service_faqs (service_id, question, answer, display_order)
SELECT s.id, q.question, q.answer, q.ord FROM services s,
LATERAL (VALUES
  ('How does online coaching work?', 'Custom workout plans via app, weekly check-ins, form reviews through video, and ongoing chat support.', 1),
  ('Do I need a gym?', 'Depends on your goals. I create programs for gym, home equipment, or bodyweight-only training.', 2),
  ('How often do we communicate?', 'Weekly check-ins required. Unlimited messaging for questions. Monthly video calls available.', 3),
  ('What if I travel?', 'I adapt your program for hotel gyms or no equipment. Flexibility is a key benefit of online coaching.', 4),
  ('Is it as effective as in-person?', 'Yes, when you''re self-motivated and follow the program. Many clients prefer the flexibility and cost.', 5)
) q(question, answer, ord) WHERE s.slug = 'online-coaching';

-- Seed FAQs for Post-Pregnancy Recovery
INSERT INTO service_faqs (service_id, question, answer, display_order)
SELECT s.id, q.question, q.answer, q.ord FROM services s,
LATERAL (VALUES
  ('When can I start?', 'Minimum 6 weeks postpartum (vaginal) or 8-10 weeks (C-section). Doctor clearance required first.', 1),
  ('Will it help diastasis recti?', 'Yes! We focus on core reconnection and safe exercises to help close abdominal separation gradually.', 2),
  ('Can I bring my baby?', 'Private studio allows babies to join if needed. We work around feeding and nap schedules flexibly.', 3),
  ('Is it different from regular training?', 'Completely. We avoid crunches, heavy lifting initially, and focus on pelvic floor-safe progressions.', 4),
  ('How long until I see results?', 'Core strength improves in 4-6 weeks. Full recovery varies but most see significant progress in 3 months.', 5)
) q(question, answer, ord) WHERE s.slug = 'post-pregnancy-recovery';