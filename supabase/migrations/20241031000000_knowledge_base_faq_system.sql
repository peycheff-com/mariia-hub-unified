-- Knowledge Base and FAQ System Migration
-- Creates comprehensive knowledge base and FAQ system for luxury beauty/fitness platform

-- Knowledge Base Categories
CREATE TABLE IF NOT EXISTS kb_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- Icon name or URL
  color TEXT DEFAULT '#8B4513', -- Brand color
  parent_id UUID REFERENCES kb_categories(id) ON DELETE SET NULL,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  service_type service_type, -- Optional: link to beauty/fitness services
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Knowledge Base Articles
CREATE TABLE IF NOT EXISTS kb_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT, -- Brief summary for search results and previews
  content TEXT NOT NULL, -- Full article content (rich text/HTML)
  content_type TEXT DEFAULT 'article' CHECK (content_type IN ('article', 'tutorial', 'guide', 'faq_collection', 'video_tutorial')),
  category_id UUID REFERENCES kb_categories(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL, -- Optional: link to specific service
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- SEO and metadata
  meta_title TEXT,
  meta_description TEXT,
  focus_keywords TEXT[],
  tags TEXT[],

  -- Media and assets
  featured_image_url TEXT,
  video_url TEXT, -- For video tutorials
  gallery_urls TEXT[], -- Additional images
  attachments TEXT[], -- File attachments (PDFs, etc.)

  -- Content management
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  version INTEGER DEFAULT 1,
  parent_article_id UUID REFERENCES kb_articles(id) ON DELETE SET NULL, -- For version control
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'pl')),
  reading_time_minutes INTEGER GENERATED ALWAYS AS (
    CEIL(LENGTH(content) / 1000.0) -- Rough estimate: 1000 chars per minute
  ) STORED,

  -- Analytics and engagement
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  bookmark_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,

  -- Search optimization
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(summary, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(content, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(tags, ' '), '')), 'D')
  ) STORED,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

-- FAQ Categories
CREATE TABLE IF NOT EXISTS faq_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#8B4513',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  service_type service_type,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- FAQ Items
CREATE TABLE IF NOT EXISTS faq_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category_id UUID REFERENCES faq_categories(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  order_index INTEGER DEFAULT 0,

  -- Multilingual support
  question_pl TEXT,
  answer_pl TEXT,
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'pl')),

  -- Analytics
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,

  -- Status and management
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false, -- Show in highlights
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Knowledge Base Search Analytics
CREATE TABLE IF NOT EXISTS kb_search_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  search_query TEXT NOT NULL,
  results_count INTEGER,
  clicked_article_id UUID REFERENCES kb_articles(id) ON DELETE SET NULL,
  session_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  language TEXT,
  filters_used JSONB DEFAULT '{}', -- Search filters applied
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User Feedback on Articles
CREATE TABLE IF NOT EXISTS kb_article_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES kb_articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('helpful', 'not_helpful', 'report_issue', 'suggestion')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  contact_email TEXT, -- If user wants follow-up
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User Feedback on FAQs
CREATE TABLE IF NOT EXISTS faq_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  faq_id UUID NOT NULL REFERENCES faq_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('helpful', 'not_helpful')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User Bookmarks/Saved Content
CREATE TABLE IF NOT EXISTS kb_user_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES kb_articles(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'article', -- 'article', 'faq', 'category'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, article_id)
);

-- Knowledge Base Related Content Suggestions
CREATE TABLE IF NOT EXISTS kb_related_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES kb_articles(id) ON DELETE CASCADE,
  related_article_id UUID NOT NULL REFERENCES kb_articles(id) ON DELETE CASCADE,
  score DECIMAL(3,2) DEFAULT 1.0 CHECK (score >= 0 AND score <= 2), -- Relationship strength
  relationship_type TEXT DEFAULT 'manual' CHECK (relationship_type IN ('manual', 'automatic', 'category', 'tags')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(article_id, related_article_id),
  CHECK (article_id != related_article_id)
);

-- FAQ Related Suggestions
CREATE TABLE IF NOT EXISTS faq_related_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  faq_id UUID NOT NULL REFERENCES faq_items(id) ON DELETE CASCADE,
  related_faq_id UUID NOT NULL REFERENCES faq_items(id) ON DELETE CASCADE,
  score DECIMAL(3,2) DEFAULT 1.0 CHECK (score >= 0 AND score <= 2),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(faq_id, related_faq_id),
  CHECK (faq_id != related_faq_id)
);

-- Content Performance Metrics
CREATE TABLE IF NOT EXISTS kb_content_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'faq')),
  content_id UUID NOT NULL,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  helpful_votes INTEGER DEFAULT 0,
  not_helpful_votes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  bookmarks INTEGER DEFAULT 0,
  avg_time_on_page_seconds INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(content_type, content_id, date)
);

-- Support Ticket Integration
CREATE TABLE IF NOT EXISTS support_ticket_kb_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id TEXT NOT NULL, -- Reference to external support system
  suggested_article_id UUID REFERENCES kb_articles(id) ON DELETE SET NULL,
  suggested_faq_id UUID REFERENCES faq_items(id) ON DELETE SET NULL,
  suggestion_type TEXT DEFAULT 'auto' CHECK (suggestion_type IN ('auto', 'manual')),
  was_helpful BOOLEAN,
  resolved_with_kb BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Knowledge Base Settings and Configuration
CREATE TABLE IF NOT EXISTS kb_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false, -- Whether setting affects public-facing features
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_kb_categories_parent ON kb_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_kb_categories_active ON kb_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_kb_categories_service_type ON kb_categories(service_type);

CREATE INDEX IF NOT EXISTS idx_kb_articles_category ON kb_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_service ON kb_articles(service_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_status ON kb_articles(status);
CREATE INDEX IF NOT EXISTS idx_kb_articles_published ON kb_articles(published_at) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_kb_articles_language ON kb_articles(language);
CREATE INDEX IF NOT EXISTS idx_kb_articles_service_type ON kb_articles(service_type);
CREATE INDEX IF NOT EXISTS idx_kb_articles_featured ON kb_articles(view_count) WHERE status = 'published';

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_kb_articles_search ON kb_articles USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_kb_articles_title_search ON kb_articles USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_kb_articles_content_search ON kb_articles USING GIN(to_tsvector('english', content));

CREATE INDEX IF NOT EXISTS idx_faq_categories_active ON faq_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_faq_items_category ON faq_items(category_id);
CREATE INDEX IF NOT EXISTS idx_faq_items_service ON faq_items(service_id);
CREATE INDEX IF NOT EXISTS idx_faq_items_active ON faq_items(is_active);
CREATE INDEX IF NOT EXISTS idx_faq_items_featured ON faq_items(is_featured) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_faq_items_language ON faq_items(language);

CREATE INDEX IF NOT EXISTS idx_kb_search_query ON kb_search_analytics(search_query);
CREATE INDEX IF NOT EXISTS idx_kb_search_session ON kb_search_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_kb_search_created ON kb_search_analytics(created_at);

CREATE INDEX IF NOT EXISTS idx_kb_feedback_article ON kb_article_feedback(article_id);
CREATE INDEX IF NOT EXISTS idx_kb_feedback_user ON kb_article_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_faq_feedback_faq ON faq_feedback(faq_id);

CREATE INDEX IF NOT EXISTS idx_kb_bookmarks_user ON kb_user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_kb_related_articles_source ON kb_related_articles(article_id);
CREATE INDEX IF NOT EXISTS idx_kb_related_articles_target ON kb_related_articles(related_article_id);
CREATE INDEX IF NOT EXISTS idx_faq_related_source ON faq_related_items(faq_id);
CREATE INDEX IF NOT EXISTS idx_faq_related_target ON faq_related_items(related_faq_id);

CREATE INDEX IF NOT EXISTS idx_kb_performance_content ON kb_content_performance(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_kb_performance_date ON kb_content_performance(date);

-- Trigger for updating search vector
CREATE OR REPLACE FUNCTION update_kb_article_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kb_articles_search_vector
  BEFORE INSERT OR UPDATE ON kb_articles
  FOR EACH ROW EXECUTE FUNCTION update_kb_article_search_vector();

-- Trigger for updating view counts
CREATE OR REPLACE FUNCTION increment_article_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE kb_articles
  SET view_count = view_count + 1,
      last_viewed_at = NOW()
  WHERE id = NEW.article_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_kb_article_views
  AFTER INSERT ON kb_article_feedback
  FOR EACH ROW EXECUTE FUNCTION increment_article_view_count();

-- Function for automatic article suggestions based on tags and categories
CREATE OR REPLACE FUNCTION suggest_related_articles(article_uuid UUID)
RETURNS TABLE(
  related_article_id UUID,
  title TEXT,
  score DECIMAL(3,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH article_data AS (
    SELECT category_id, tags, service_id, service_type
    FROM kb_articles
    WHERE id = article_uuid AND status = 'published'
  )
  SELECT
    a.id,
    a.title,
    CASE
      WHEN a.category_id = ad.category_id THEN 1.5
      WHEN a.service_id = ad.service_id THEN 1.3
      WHEN a.tags && ad.tags THEN
        CASE
          WHEN array_length(a.tags & ad.tags, 1) > 2 THEN 1.4
          WHEN array_length(a.tags & ad.tags, 1) > 1 THEN 1.2
          ELSE 1.0
        END
      ELSE 0.8
    END as score
  FROM kb_articles a, article_data ad
  WHERE a.id != article_uuid
    AND a.status = 'published'
    AND (
      a.category_id = ad.category_id
      OR a.service_id = ad.service_id
      OR a.tags && ad.tags
    )
  ORDER BY score DESC, a.view_count DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger for new tables
CREATE TRIGGER update_kb_categories_updated_at BEFORE UPDATE ON kb_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kb_articles_updated_at BEFORE UPDATE ON kb_articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faq_categories_updated_at BEFORE UPDATE ON faq_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faq_items_updated_at BEFORE UPDATE ON faq_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kb_settings_updated_at BEFORE UPDATE ON kb_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kb_content_performance_updated_at BEFORE UPDATE ON kb_content_performance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE kb_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_article_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_related_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_related_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_content_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_kb_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- KB Categories - Public read, admin manage
CREATE POLICY "Anyone can view active KB categories" ON kb_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage KB categories" ON kb_categories
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- KB Articles - Public read published, authenticated create feedback
CREATE POLICY "Anyone can view published KB articles" ON kb_articles
    FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage all KB articles" ON kb_articles
    FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authors can manage own KB articles" ON kb_articles
    FOR ALL USING (author_id = auth.uid());

-- FAQ Categories - Public read, admin manage
CREATE POLICY "Anyone can view active FAQ categories" ON faq_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage FAQ categories" ON faq_categories
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- FAQ Items - Public read active, admin manage
CREATE POLICY "Anyone can view active FAQ items" ON faq_items
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all FAQ items" ON faq_items
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Analytics - Admin only
CREATE POLICY "Admins can view KB search analytics" ON kb_search_analytics
    FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view content performance" ON kb_content_performance
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Feedback - Users can create own feedback
CREATE POLICY "Users can create KB article feedback" ON kb_article_feedback
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR session_id IS NOT NULL);

CREATE POLICY "Users can create FAQ feedback" ON faq_feedback
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR session_id IS NOT NULL);

-- Bookmarks - Users manage own bookmarks
CREATE POLICY "Users can manage own KB bookmarks" ON kb_user_bookmarks
    FOR ALL USING (user_id = auth.uid());

-- Related content - Public read, admin manage
CREATE POLICY "Anyone can view related KB articles" ON kb_related_articles
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view related FAQ items" ON faq_related_items
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage related KB articles" ON kb_related_articles
    FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage related FAQ items" ON faq_related_items
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Support integration - Admin manage
CREATE POLICY "Admins can manage support KB suggestions" ON support_ticket_kb_suggestions
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Insert default KB settings
INSERT INTO kb_settings (key, value, description, is_public) VALUES
('site_title', '"Mariia Hub Knowledge Base"', 'Main title for the knowledge base', true),
('enable_search_analytics', 'true', 'Enable search analytics tracking', true),
('max_search_results', '20', 'Maximum number of search results to return', true),
('enable_feedback', 'true', 'Enable user feedback on articles and FAQs', true),
('auto_suggest_related', 'true', 'Automatically suggest related articles', false),
('featured_article_count', '5', 'Number of featured articles to show on homepage', true),
('enable_bookmarks', 'true', 'Enable user bookmark functionality', true),
('default_language', '"en"', 'Default language for content', true),
('search_min_length', '2', 'Minimum search query length', true)
ON CONFLICT (key) DO NOTHING;

-- Insert default categories
INSERT INTO kb_categories (name, slug, description, icon, service_type, order_index) VALUES
('Beauty Services', 'beauty-services', 'Everything about our beauty treatments and services', 'sparkles', 'beauty', 1),
('Fitness Programs', 'fitness-programs', 'Guides and tutorials for our fitness programs', 'activity', 'fitness', 2),
('Before & After Care', 'before-after-care', 'Preparation and aftercare instructions', 'heart', null, 3),
('Policies & Procedures', 'policies-procedures', 'Booking policies, cancellations, and procedures', 'file-text', null, 4),
('General Help', 'general-help', 'General help and frequently asked questions', 'help-circle', null, 5)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO faq_categories (name, slug, description, icon, service_type, order_index) VALUES
('Booking & Appointments', 'booking-appointments', 'Questions about booking and managing appointments', 'calendar', null, 1),
('Beauty Services FAQ', 'beauty-services-faq', 'Frequently asked questions about beauty treatments', 'sparkles', 'beauty', 2),
('Fitness Programs FAQ', 'fitness-programs-faq', 'Common questions about fitness programs', 'activity', 'fitness', 3),
('Payment & Pricing', 'payment-pricing', 'Questions about pricing, payments, and refunds', 'credit-card', null, 4),
('Policies & Safety', 'policies-safety', 'Policy questions and safety information', 'shield', null, 5)
ON CONFLICT (slug) DO NOTHING;