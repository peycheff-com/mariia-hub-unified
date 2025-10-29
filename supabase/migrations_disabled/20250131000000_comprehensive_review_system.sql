-- Comprehensive Review System Migration
-- Creates tables for reviews, verification, fraud detection, and social media integration

-- Main reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  videos JSONB DEFAULT '[]'::jsonb,
  is_verified BOOLEAN DEFAULT false,
  verification_method TEXT, -- 'booking_confirmed', 'photo_metadata', 'email_verified', 'phone_verified'
  verification_data JSONB DEFAULT '{}'::jsonb, -- Stores verification metadata
  is_fraud_suspected BOOLEAN DEFAULT false,
  fraud_score DECIMAL(3,2) DEFAULT 0.00 CHECK (fraud_score >= 0 AND fraud_score <= 1),
  fraud_flags JSONB DEFAULT '[]'::jsonb, -- Array of fraud flag reasons
  ai_response TEXT,
  ai_response_sentiment TEXT, -- 'positive', 'negative', 'neutral'
  ai_confidence DECIMAL(3,2),
  response_requested BOOLEAN DEFAULT false,
  responded_at TIMESTAMP,
  responded_by UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'pending', 'hidden', 'flagged', 'removed')),
  featured BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  report_count INTEGER DEFAULT 0,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Review sources for social media integration
CREATE TABLE IF NOT EXISTS review_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('google', 'booksy', 'instagram', 'facebook', 'internal', 'yelp', 'trustpilot')),
  external_id TEXT,
  external_url TEXT,
  reviewer_name TEXT,
  reviewer_avatar TEXT,
  platform_rating INTEGER,
  sync_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'failed', 'deleted')),
  raw_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Review verification logs
CREATE TABLE IF NOT EXISTS review_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('booking_match', 'photo_metadata', 'email_domain', 'phone_verification', 'ip_analysis')),
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'pending')),
  details JSONB DEFAULT '{}'::jsonb,
  verified_by TEXT, -- 'system', 'admin', or user ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Review analytics for trends and insights
CREATE TABLE IF NOT EXISTS review_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  total_reviews INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  verified_reviews INTEGER DEFAULT 0,
  photo_reviews INTEGER DEFAULT 0,
  video_reviews INTEGER DEFAULT 0,
  response_rate DECIMAL(3,2) DEFAULT 0.00,
  average_response_time INTERVAL DEFAULT '0 minutes',
  sentiment_distribution JSONB DEFAULT '{"positive": 0, "neutral": 0, "negative": 0}'::jsonb,
  rating_distribution JSONB DEFAULT '{"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(date, service_id)
);

-- Review helpful votes
CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Review reports
CREATE TABLE IF NOT EXISTS review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL CHECK (reason IN ('fake', 'inappropriate', 'spam', 'offensive', 'conflict_of_interest', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Review response templates
CREATE TABLE IF NOT EXISTS review_response_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rating_range INT4RANGE, -- Range of ratings this template applies to
  template_text TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb, -- Array of variable names
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_service_id ON reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_is_verified ON reviews(is_verified);
CREATE INDEX IF NOT EXISTS idx_reviews_is_fraud_suspected ON reviews(is_fraud_suspected);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_featured ON reviews(featured);

CREATE INDEX IF NOT EXISTS idx_review_sources_review_id ON review_sources(review_id);
CREATE INDEX IF NOT EXISTS idx_review_sources_platform ON review_sources(platform);
CREATE INDEX IF NOT EXISTS idx_review_sources_sync_status ON review_sources(sync_status);

CREATE INDEX IF NOT EXISTS idx_review_verifications_review_id ON review_verifications(review_id);
CREATE INDEX IF NOT EXISTS idx_review_verifications_type ON review_verifications(verification_type);

CREATE INDEX IF NOT EXISTS idx_review_analytics_date ON review_analytics(date);
CREATE INDEX IF NOT EXISTS idx_review_analytics_service_id ON review_analytics(service_id);

-- RLS Policies
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_response_templates ENABLE ROW LEVEL SECURITY;

-- Reviews policies
CREATE POLICY "Public can view published reviews" ON reviews
  FOR SELECT USING (status = 'published');

CREATE POLICY "Users can view own reviews" ON reviews
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Users can insert own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = client_id);

CREATE POLICY "Admins full access to reviews" ON reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Review sources policies
CREATE POLICY "Public can view review sources" ON review_sources
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reviews
      WHERE reviews.id = review_sources.review_id
      AND reviews.status = 'published'
    )
  );

CREATE POLICY "Admins full access to review sources" ON review_sources
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Helpful votes policies
CREATE POLICY "Users can vote on reviews" ON review_helpful_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view helpful votes" ON review_helpful_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can delete own votes" ON review_helpful_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Reports policies
CREATE POLICY "Users can report reviews" ON review_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id OR reporter_id IS NULL);

CREATE POLICY "Admins full access to reports" ON review_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Functions for review management

-- Function to update review analytics
CREATE OR REPLACE FUNCTION update_review_analytics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO review_analytics (
    date,
    service_id,
    total_reviews,
    average_rating,
    verified_reviews,
    photo_reviews,
    video_reviews,
    sentiment_distribution,
    rating_distribution
  )
  SELECT
    CURRENT_DATE,
    NEW.service_id,
    COUNT(*),
    ROUND(AVG(rating)::numeric, 2),
    COUNT(*) FILTER (WHERE is_verified = true),
    COUNT(*) FILTER (WHERE jsonb_array_length(photos) > 0),
    COUNT(*) FILTER (WHERE jsonb_array_length(videos) > 0),
    jsonb_build_object(
      'positive', COUNT(*) FILTER (rating >= 4),
      'neutral', COUNT(*) FILTER (rating = 3),
      'negative', COUNT(*) FILTER (rating <= 2)
    ),
    jsonb_build_object(
      '5', COUNT(*) FILTER (rating = 5),
      '4', COUNT(*) FILTER (rating = 4),
      '3', COUNT(*) FILTER (rating = 3),
      '2', COUNT(*) FILTER (rating = 2),
      '1', COUNT(*) FILTER (rating = 1)
    )
  FROM reviews
  WHERE service_id = NEW.service_id
    AND status = 'published'
    AND created_at >= CURRENT_DATE
  ON CONFLICT (date, service_id)
  DO UPDATE SET
    total_reviews = EXCLUDED.total_reviews,
    average_rating = EXCLUDED.average_rating,
    verified_reviews = EXCLUDED.verified_reviews,
    photo_reviews = EXCLUDED.photo_reviews,
    video_reviews = EXCLUDED.video_reviews,
    sentiment_distribution = EXCLUDED.sentiment_distribution,
    rating_distribution = EXCLUDED.rating_distribution,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_review_analytics_trigger
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_review_analytics();

-- Function to calculate fraud score
CREATE OR REPLACE FUNCTION calculate_review_fraud_score(review_data JSONB)
RETURNS DECIMAL AS $$
DECLARE
  score DECIMAL := 0.0;
BEGIN
  -- Check for rapid consecutive reviews from same IP
  IF EXISTS (
    SELECT 1 FROM reviews
    WHERE ip_address = (review_data->>'ip_address')::inet
      AND created_at > now() - interval '1 hour'
      AND id != (review_data->>'id')::uuid
  ) THEN
    score := score + 0.3;
  END IF;

  -- Check for identical comments
  IF EXISTS (
    SELECT 1 FROM reviews
    WHERE comment = review_data->>'comment'
      AND id != (review_data->>'id')::uuid
  ) THEN
    score := score + 0.4;
  END IF;

  -- Check for suspicious patterns (all 5-star or all 1-star from same user)
  IF EXISTS (
    SELECT 1 FROM reviews
    WHERE client_id = (review_data->>'client_id')::uuid
      AND rating = (review_data->>'rating')::integer
      AND COUNT(*) >= 3
  ) THEN
    score := score + 0.2;
  END IF;

  RETURN LEAST(score, 1.0);
END;
$$ LANGUAGE plpgsql;

-- View for review statistics
CREATE OR REPLACE VIEW review_statistics AS
SELECT
  COUNT(*) as total_reviews,
  ROUND(AVG(rating), 2) as average_rating,
  COUNT(*) FILTER (WHERE is_verified = true) as verified_reviews,
  COUNT(*) FILTER (WHERE jsonb_array_length(photos) > 0) as photo_reviews,
  COUNT(*) FILTER (WHERE jsonb_array_length(videos) > 0) as video_reviews,
  COUNT(*) FILTER (WHERE is_fraud_suspected = true) as suspected_fraud,
  jsonb_build_object(
    '5', COUNT(*) FILTER (rating = 5),
    '4', COUNT(*) FILTER (rating = 4),
    '3', COUNT(*) FILTER (rating = 3),
    '2', COUNT(*) FILTER (rating = 2),
    '1', COUNT(*) FILTER (rating = 1)
  ) as rating_distribution
FROM reviews
WHERE status = 'published';

-- Insert default response templates
INSERT INTO review_response_templates (name, rating_range, template_text, variables) VALUES
  ('Positive Response', '[4,6)', 'Thank you so much for your wonderful review! We''re thrilled that you had a great experience. We look forward to welcoming you back soon!', '["customer_name", "service_name"]'),
  ('Neutral Response', '[3,4)', 'Thank you for your feedback. We appreciate you taking the time to share your experience. We''re always looking to improve and would love to hear more about how we can make your next visit even better.', '["customer_name", "service_name"]'),
  ('Negative Response', '[0,3)', 'We''re sorry to hear that your experience didn''t meet expectations. We take all feedback seriously and would like to understand more about what went wrong. Please reach out to us directly so we can make this right.', '["customer_name", "service_name", "contact_info"]')
ON CONFLICT DO NOTHING;