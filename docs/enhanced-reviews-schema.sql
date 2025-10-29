-- ============================================
-- ENHANCED REVIEWS SYSTEM DATABASE SCHEMA
-- ============================================

-- Additional columns for existing reviews table
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS videos TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS response_content TEXT,
ADD COLUMN IF NOT EXISTS response_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS response_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_method TEXT, -- 'photo', 'service', 'manual'
ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS source_platform TEXT DEFAULT 'mariia_hub', -- 'mariia_hub', 'google', 'booksy', 'instagram', etc.
ADD COLUMN IF NOT EXISTS external_review_id TEXT,
ADD COLUMN IF NOT EXISTS external_platform_url TEXT,
ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL(3,2), -- -1.00 to 1.00
ADD COLUMN IF NOT EXISTS ai_generated_summary TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Review photos table for detailed photo management
CREATE TABLE IF NOT EXISTS review_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_caption TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMP WITH TIME ZONE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Review verification logs
CREATE TABLE IF NOT EXISTS review_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL, -- 'photo', 'service', 'manual', 'ai'
  verification_status TEXT NOT NULL, -- 'pending', 'approved', 'rejected'
  verified_by UUID REFERENCES auth.users(id),
  verification_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Review reports for moderation
CREATE TABLE IF NOT EXISTS review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users(id),
  reason TEXT NOT NULL, -- 'fake', 'inappropriate', 'spam', 'offensive', 'irrelevant'
  description TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed'
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Review helpful votes
CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- Review analytics for sentiment tracking
CREATE TABLE IF NOT EXISTS review_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  views INTEGER DEFAULT 0,
  click_through_rate DECIMAL(5,2) DEFAULT 0.00,
  engagement_score DECIMAL(5,2) DEFAULT 0.00,
  sentiment_trend JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- External review sync logs
CREATE TABLE IF NOT EXISTS external_review_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL, -- 'google', 'booksy', 'instagram', 'facebook'
  sync_type TEXT NOT NULL, -- 'import', 'export', 'update'
  status TEXT NOT NULL, -- 'pending', 'success', 'failed'
  total_reviews INTEGER DEFAULT 0,
  imported_reviews INTEGER DEFAULT 0,
  updated_reviews INTEGER DEFAULT 0,
  error_message TEXT,
  sync_data JSONB DEFAULT '{}',
  last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Review templates for automated responses
CREATE TABLE IF NOT EXISTS review_response_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rating_range_start INTEGER DEFAULT 1,
  rating_range_end INTEGER DEFAULT 5,
  service_type TEXT, -- 'beauty', 'fitness', 'lifestyle', NULL for all
  template_content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Review flags for automated moderation
CREATE TABLE IF NOT EXISTS review_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL, -- 'spam', 'fake', 'inappropriate', 'duplicate'
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  auto_action TEXT, -- 'hide', 'flag_for_review', 'approve'
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_source_platform ON reviews(source_platform);
CREATE INDEX IF NOT EXISTS idx_reviews_is_verified ON reviews(is_verified);
CREATE INDEX IF NOT EXISTS idx_reviews_verification_method ON reviews(verification_method);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

CREATE INDEX IF NOT EXISTS idx_review_photos_review_id ON review_photos(review_id);
CREATE INDEX IF NOT EXISTS idx_review_photos_order ON review_photos(review_id, order_index);

CREATE INDEX IF NOT EXISTS idx_review_verifications_review_id ON review_verifications(review_id);
CREATE INDEX IF NOT EXISTS idx_review_verifications_status ON review_verifications(verification_status);

CREATE INDEX IF NOT EXISTS idx_review_reports_review_id ON review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_status ON review_reports(status);

CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_review_id ON review_helpful_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_helpful ON review_helpful_votes(is_helpful);

CREATE INDEX IF NOT EXISTS idx_external_review_syncs_platform ON external_review_syncs(platform);
CREATE INDEX IF NOT EXISTS idx_external_review_syncs_status ON external_review_syncs(status);

-- Row Level Security (RLS) Policies

-- Reviews table RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved reviews" ON reviews
  FOR SELECT USING (is_approved = TRUE);

CREATE POLICY "Users can view their own reviews" ON reviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reviews" ON reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all reviews" ON reviews
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Review photos RLS
ALTER TABLE review_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view photos of approved reviews" ON review_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reviews
      WHERE reviews.id = review_photos.review_id
      AND reviews.is_approved = TRUE
    )
  );

-- Review reports RLS
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all reports" ON review_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Users can create reports" ON review_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Helpful votes RLS
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view helpful votes" ON review_helpful_votes
  FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can vote" ON review_helpful_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their votes" ON review_helpful_votes
  FOR UPDATE USING (auth.uid() = user_id);

-- Functions for automated sentiment analysis
CREATE OR REPLACE FUNCTION analyze_review_sentiment(review_text TEXT)
RETURNS DECIMAL AS $$
DECLARE
  sentiment DECIMAL := 0.0;
  positive_words TEXT[] := ARRAY['excellent', 'amazing', 'perfect', 'great', 'wonderful', 'fantastic', 'love', 'loved', 'best', 'awesome'];
  negative_words TEXT[] := ARRAY['terrible', 'awful', 'horrible', 'bad', 'worst', 'hate', 'hated', 'disappointing', 'poor', 'unacceptable'];
  word_count INTEGER := 0;
  positive_count INTEGER := 0;
  negative_count INTEGER := 0;
BEGIN
  -- Simple sentiment analysis based on keyword matching
  FOR word IN SELECT regexp_split_to_table(lower(review_text), E'\\s+') LOOP
    word_count := word_count + 1;
    IF word = ANY(positive_words) THEN
      positive_count := positive_count + 1;
    ELSIF word = ANY(negative_words) THEN
      negative_count := negative_count + 1;
    END IF;
  END LOOP;

  IF word_count > 0 THEN
    sentiment := (positive_count::DECIMAL - negative_count::DECIMAL) / word_count::DECIMAL;
  END IF;

  -- Clamp between -1 and 1
  sentiment := GREATEST(-1.0, LEAST(1.0, sentiment));

  RETURN sentiment;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic sentiment analysis
CREATE OR REPLACE FUNCTION update_review_sentiment()
RETURNS TRIGGER AS $$
BEGIN
  NEW.sentiment_score := analyze_review_sentiment(NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_review_sentiment
  BEFORE INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_review_sentiment();

-- Function to update review helpful count
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reviews
    SET helpful_count = helpful_count + (CASE WHEN NEW.is_helpful THEN 1 ELSE 0 END)
    WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE reviews
    SET helpful_count = helpful_count +
      (CASE WHEN NEW.is_helpful AND NOT OLD.is_helpful THEN 1
            WHEN NOT NEW.is_helpful AND OLD.is_helpful THEN -1
            ELSE 0 END)
    WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reviews
    SET helpful_count = helpful_count - (CASE WHEN OLD.is_helpful THEN 1 ELSE 0 END)
    WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_review_helpful_count
  AFTER INSERT OR UPDATE OR DELETE ON review_helpful_votes
  FOR EACH ROW EXECUTE FUNCTION update_review_helpful_count();

-- Function to update review report count
CREATE OR REPLACE FUNCTION update_review_report_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reviews
    SET report_count = report_count + 1
    WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reviews
    SET report_count = report_count - 1
    WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_review_report_count
  AFTER INSERT OR DELETE ON review_reports
  FOR EACH ROW EXECUTE FUNCTION update_review_report_count();

-- View for comprehensive review data
CREATE OR REPLACE VIEW comprehensive_reviews AS
SELECT
  r.*,
  p.full_name as reviewer_name,
  p.avatar_url as reviewer_avatar,
  s.title as service_title,
  s.service_type,
  rp.photos,
  rv.response_content,
  rv.response_date,
  resp.full_name as responder_name,
  COALESCE(h.helpful_votes, 0) as helpful_votes,
  COALESCE(rep.report_count, 0) as report_count,
  ra.views,
  ra.engagement_score,
  rv_template.template_content as suggested_response
FROM reviews r
LEFT JOIN profiles p ON r.user_id = p.id
LEFT JOIN services s ON r.service_id = s.id
LEFT JOIN (
  SELECT
    review_id,
    array_agg(photo_url ORDER BY order_index) as photos
  FROM review_photos
  GROUP BY review_id
) rp ON r.id = rp.review_id
LEFT JOIN (
  SELECT
    review_id,
    response_content,
    response_date,
    response_by
  FROM reviews
  WHERE response_content IS NOT NULL
) rv ON r.id = rv.review_id
LEFT JOIN profiles resp ON rv.response_by = resp.id
LEFT JOIN (
  SELECT
    review_id,
    COUNT(*) FILTER (WHERE is_helpful = true) as helpful_votes
  FROM review_helpful_votes
  GROUP BY review_id
) h ON r.id = h.review_id
LEFT JOIN (
  SELECT
    review_id,
    COUNT(*) as report_count
  FROM review_reports
  WHERE status != 'dismissed'
  GROUP BY review_id
) rep ON r.id = rep.review_id
LEFT JOIN review_analytics ra ON r.id = ra.review_id
LEFT JOIN review_response_templates rv_template ON
  rv_template.rating_range_start <= r.rating
  AND rv_template.rating_range_end >= r.rating
  AND (rv_template.service_type = s.service_type OR rv_template.service_type IS NULL)
  AND rv_template.is_active = true;

-- Insert default response templates
INSERT INTO review_response_templates (name, rating_range_start, rating_range_end, template_content) VALUES
  ('5-Star Response', 5, 5, 'Thank you so much for your wonderful 5-star review! We''re thrilled to hear you had such a great experience. Your feedback motivates us to continue providing the best service possible. We look forward to seeing you again soon!'),
  ('4-Star Response', 4, 4, 'Thank you for your positive feedback! We''re glad you had a good experience. If there''s anything we could do to make it a 5-star experience next time, please let us know. We appreciate your business!'),
  ('3-Star Response', 3, 3, 'Thank you for your feedback. We''re sorry we didn''t exceed your expectations this time. We''d love to hear more about how we can improve your experience in the future. Please feel free to reach out to us directly.'),
  ('Low Rating Response', 1, 2, 'Thank you for bringing this to our attention. We sincerely apologize that we didn''t meet your expectations. Your feedback is important to us, and we''d like to understand more about what went wrong. Please contact us so we can make things right.')
ON CONFLICT DO NOTHING;