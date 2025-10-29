-- Populate Beauty Services
INSERT INTO services (slug, title, description, service_type, duration_minutes, price_from, price_to, is_active, display_order) VALUES
('makijaz-permanentny-ust', 'Makijaż permanentny ust', 'Soft, even lip color that heals natural—no overlining needed. Faded lip tone, uneven contour, frequent lipstick users.', 'beauty', 150, 720, 900, true, 1),
('makijaz-permanentny-brwi', 'Makijaż permanentny brwi', 'Framing brows with soft definition; symmetry without harsh lines. For sparse/uneven brows, time-saving routine.', 'beauty', 150, 720, 900, true, 2),
('makijaz-permanentny-oczu', 'Makijaż permanentny oczu', 'Lash-line definition that survives workouts and rain.', 'beauty', 120, 600, 750, true, 3),
('brwi-laminacja-regulacja', 'Brwi laminacja+regulacją', 'Semi-permanent brow set + tidy regulation.', 'beauty', 60, 120, 180, true, 4),
('stylizacja-brwi-koloryzacja', 'Stylizacja brwi +koloryzacja', 'Shape, tint, and care consult in one visit.', 'beauty', 30, 100, 125, true, 5),
('rzesy-lifting-laminacja', 'Rzęsy Lifting +Laminacja (z koloryzacja)', 'Curled, tinted, conditioned lashes—no extensions.', 'beauty', 60, 124, 155, true, 6),
('komplet-laminacja-botox-brwi-rzes', 'KOMPLET Laminacja BOTOX BRWI &RZES', 'Brow + lash makeover with nourishing botox & keratin.', 'beauty', 70, 239, 299, true, 7),
('brwi-laminacja-stylizacja-koloryzacja-botox', 'Brwi laminacja+stylizacja +koloryzacja +botox', 'Set + tint + nourishing botox finish.', 'beauty', 60, 128, 160, true, 8),
('brwi-laminacja-regulacja-koloryzacja', 'Brwi Laminacja (regulacija+koloryzacja)', 'Lift + shape + tint refresh.', 'beauty', 45, 112, 140, true, 9),
('koloryzacja-rzes', 'Koloryzacja rzes', 'Lash darkening with nourishing tint.', 'beauty', 15, 48, 60, true, 10),
('makijaz-slubny', 'Makijaż Slubny', 'Bridal look trial + day-of application.', 'beauty', 90, 240, 300, true, 11),
('makijaz-dzienny', 'Makijaz Dzienny', 'Natural day makeup; skin-first finish.', 'beauty', 90, 208, 260, true, 12),
('makijaz-wieczorowy', 'Makijaz Wieczorowy', 'Long-wear evening glam; lashes optional.', 'beauty', 90, 224, 280, true, 13),
('makijaz-do-sesji-zdjeciowej', 'Makijaz do sesji zdjeciowej', 'Photo-ready base, controlled shine, set & seal.', 'beauty', 100, 232, 290, true, 14),
('prostowanie-wlosow', 'Prostowanie włosów', 'Sleek straight finish.', 'beauty', 40, 120, 150, true, 15),
('krecenia-lokow', 'Kręcenia loków', 'Soft curls or glam waves.', 'beauty', 30, 152, 190, true, 16)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration_minutes = EXCLUDED.duration_minutes,
  price_from = EXCLUDED.price_from,
  price_to = EXCLUDED.price_to,
  display_order = EXCLUDED.display_order;

-- Populate Fitness Programs
INSERT INTO services (slug, title, description, service_type, duration_minutes, price_from, price_to, is_active, display_order, is_package, package_sessions) VALUES
('glute-sculpt-8w', 'Glute Sculpt 8-Week Program', 'Lifted, fuller glutes with balanced quads/hamstrings; better hip drive and gait. 3 sessions/week for 8 weeks.', 'fitness', 60, 800, 1200, true, 1, true, 24),
('waist-core', 'Waist & Core (Anti-Rotation + TVA)', 'Deeper core control and a flatter look via anti-rotation and TVA activation. Better bracing for lifts and daily life.', 'fitness', 45, 600, 900, true, 2, true, 16),
('posture-mobility', 'Posture & Mobility for Desk Work', 'Less neck/upper-back tightness; better overhead and hip range; daily ease. Daily 20-30 min sessions.', 'fitness', 30, 400, 600, true, 3, true, 20),
('lean-toned-no-barbell', 'Lean & Toned (No Barbell)', 'Full-body strength, visible tone, better work capacity with minimal kit. 3×/week for 8 weeks.', 'fitness', 60, 700, 1000, true, 4, true, 24),
('rehab-friendly', 'Rehab-Friendly Reconditioning', 'Non-medical coaching with MD/PT clearance. RPE-guided, symptom-based progressions.', 'fitness', 45, 900, 1400, true, 5, true, 12),
('pre-post-natal', 'Pre/Post-natal Gentle Strength', 'Maintain strength & function; support posture; safe return after birth. Medical clearance required.', 'fitness', 45, 800, 1200, true, 6, true, 16),
('pt-1-1', '1:1 Personal Training', '30/45/60 min sessions with assessment, plan, and habit layer. Studio or Zdrofit gym.', 'fitness', 60, 150, 250, true, 7, false, NULL),
('online-coaching', 'Online Coaching', 'Weekly plan, check-ins, form feedback, and chat support.', 'fitness', NULL, 400, 600, true, 8, false, NULL)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration_minutes = EXCLUDED.duration_minutes,
  price_from = EXCLUDED.price_from,
  price_to = EXCLUDED.price_to,
  is_package = EXCLUDED.is_package,
  package_sessions = EXCLUDED.package_sessions,
  display_order = EXCLUDED.display_order;