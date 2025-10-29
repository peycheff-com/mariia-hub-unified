-- Update social posts with real Instagram content
-- This migration adds more sample posts and updates URLs to point to the real Instagram profile

-- Clear existing sample data
DELETE FROM social_posts WHERE post_url LIKE '%example%';

-- Insert updated sample posts with real Instagram profile link
INSERT INTO social_posts (platform, post_url, image_url, caption, posted_at, is_featured) VALUES
('instagram', 'https://www.instagram.com/p/DPG22YxiCwj/', 'https://www.instagram.com/bm.beauty.permanent/', 'Fresh permanent makeup transformation 💋✨ Natural, healed results that enhance your beauty. Book your consultation today! #PMU #PermanentMakeup #BeautyWarsaw', NOW() - INTERVAL '2 days', true),
('instagram', 'https://www.instagram.com/bm.beauty.permanent/', '/src/assets/social-beauty-1.jpg', 'Soft, natural brows that last 💫 The healed-first approach means beautiful results that stand the test of time. #BrowArtist #MicrobladdingWarsaw #NaturalBrows', NOW() - INTERVAL '5 days', true),
('instagram', 'https://www.instagram.com/bm.beauty.permanent/', '/src/assets/social-fitness-1.jpg', 'Progress over perfection 💪 Building strength and confidence one session at a time. Proud of my amazing clients! #PersonalTraining #FitnessWarsaw #WomensFitness', NOW() - INTERVAL '1 week', true),
('instagram', 'https://www.instagram.com/bm.beauty.permanent/', 'https://www.instagram.com/bm.beauty.permanent/', 'Studio days ✨ Creating beautiful, natural permanent makeup in the heart of Warsaw. Smolna 8 - where artistry meets precision. #BMBeauty #WarsawBeauty #PermanentMakeupArtist', NOW() - INTERVAL '10 days', true),
('instagram', 'https://www.instagram.com/bm.beauty.permanent/', 'https://www.instagram.com/bm.beauty.permanent/', 'Glute gains and strong foundations 🍑💪 8-week transformation program showing real results! #GluteSculpt #StrengthTraining #FitnessJourney', NOW() - INTERVAL '2 weeks', true),
('instagram', 'https://www.instagram.com/bm.beauty.permanent/', 'https://www.instagram.com/bm.beauty.permanent/', 'Lip blush perfection 💋 Soft, natural color that enhances your natural beauty. Healed results you''ll love! #LipBlush #PermanentLips #BeautyEnhancement', NOW() - INTERVAL '3 weeks', true)
ON CONFLICT DO NOTHING;

-- Note: For production, integrate with Instagram Basic Display API or Instagram Graph API
-- to fetch real posts automatically. This requires:
-- 1. Instagram Business Account
-- 2. Facebook App with Instagram Basic Display API enabled
-- 3. Access token stored in integration_settings
-- 4. Edge function to periodically fetch and update posts
