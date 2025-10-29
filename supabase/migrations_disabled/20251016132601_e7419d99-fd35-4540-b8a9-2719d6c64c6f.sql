-- Seed FAQs for Lifestyle Coaching Monthly
INSERT INTO service_faqs (service_id, question, answer, display_order)
SELECT s.id, q.question, q.answer, q.ord FROM services s,
LATERAL (VALUES
  ('What areas do you cover?', 'Nutrition, fitness, sleep, stress management, habit formation, and work-life balance. Holistic approach to wellness.', 1),
  ('How long is the commitment?', 'Minimum 3 months recommended for lasting change. Monthly subscription allows flexibility after initial commitment.', 2),
  ('What if I miss a call?', 'We reschedule within the same week. Consistent participation is key to success, so I help you stay accountable.', 3),
  ('Is it just advice or accountability?', 'Both! Weekly action plans, progress tracking, obstacle troubleshooting, and consistent support between calls.', 4),
  ('Can you help with specific goals?', 'Yes! Whether it''s weight management, energy improvement, or lifestyle redesign - we create a customized roadmap.', 5)
) q(question, answer, ord) WHERE s.slug = 'lifestyle-coaching-monthly';

-- Seed FAQs for Wellness Consultation
INSERT INTO service_faqs (service_id, question, answer, display_order)
SELECT s.id, q.question, q.answer, q.ord FROM services s,
LATERAL (VALUES
  ('What happens in the consultation?', 'Comprehensive health history review, lifestyle assessment, goal setting, and personalized recommendations.', 1),
  ('Is this medical advice?', 'No, I provide lifestyle and wellness guidance. Always consult your doctor for medical concerns or diagnoses.', 2),
  ('How long is the session?', '60-90 minutes depending on complexity of your situation. Includes follow-up summary document.', 3),
  ('Do I need labs or tests?', 'Not required, but bring any recent lab work if you have it. We can discuss what additional info might be helpful.', 4),
  ('Will you create a meal plan?', 'I provide nutrition principles and sample ideas. Full meal plans are part of ongoing coaching, not single consultation.', 5)
) q(question, answer, ord) WHERE s.slug = 'wellness-consultation';