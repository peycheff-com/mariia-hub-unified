// Knowledge Base and FAQ System Types
// These types extend the main database types for the knowledge base system

export interface KBCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string;
  parent_id: string | null;
  order_index: number;
  is_active: boolean;
  service_type: 'beauty' | 'fitness' | 'lifestyle' | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface KBArticle {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  content_type: 'article' | 'tutorial' | 'guide' | 'faq_collection' | 'video_tutorial';
  category_id: string | null;
  service_id: string | null;
  author_id: string | null;

  // SEO and metadata
  meta_title: string | null;
  meta_description: string | null;
  focus_keywords: string[] | null;
  tags: string[] | null;

  // Media and assets
  featured_image_url: string | null;
  video_url: string | null;
  gallery_urls: string[] | null;
  attachments: string[] | null;

  // Content management
  status: 'draft' | 'review' | 'published' | 'archived';
  version: number;
  parent_article_id: string | null;
  language: 'en' | 'pl';
  reading_time_minutes: number;

  // Analytics and engagement
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  share_count: number;
  bookmark_count: number;
  last_viewed_at: string | null;

  // Relations
  category?: KBCategory | null;
  service?: any; // Service type from main schema
  author?: any; // Profile type from main schema
  related_articles?: KBArticle[];

  created_at: string | null;
  updated_at: string | null;
  published_at: string | null;
}

export interface FAQCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string;
  order_index: number;
  is_active: boolean;
  service_type: 'beauty' | 'fitness' | 'lifestyle' | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category_id: string | null;
  service_id: string | null;
  order_index: number;

  // Multilingual support
  question_pl: string | null;
  answer_pl: string | null;
  language: 'en' | 'pl';

  // Analytics
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  last_viewed_at: string | null;

  // Status and management
  is_active: boolean;
  is_featured: boolean;
  created_by: string | null;

  // Relations
  category?: FAQCategory | null;
  service?: any; // Service type from main schema
  created_by_profile?: any; // Profile type from main schema
  related_faqs?: FAQItem[];

  created_at: string | null;
  updated_at: string | null;
}

export interface KBSearchAnalytics {
  id: string;
  search_query: string;
  results_count: number | null;
  clicked_article_id: string | null;
  session_id: string | null;
  user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  language: string | null;
  filters_used: Record<string, any>;
  created_at: string | null;
}

export interface KBArticleFeedback {
  id: string;
  article_id: string;
  user_id: string | null;
  session_id: string | null;
  feedback_type: 'helpful' | 'not_helpful' | 'report_issue' | 'suggestion';
  rating: number | null;
  comment: string | null;
  contact_email: string | null;
  created_at: string | null;
}

export interface FAQFeedback {
  id: string;
  faq_id: string;
  user_id: string | null;
  session_id: string | null;
  feedback_type: 'helpful' | 'not_helpful';
  comment: string | null;
  created_at: string | null;
}

export interface KBUserBookmark {
  id: string;
  user_id: string;
  article_id: string;
  category: 'article' | 'faq' | 'category';
  notes: string | null;
  created_at: string | null;
}

export interface KBRelatedArticles {
  id: string;
  article_id: string;
  related_article_id: string;
  score: number;
  relationship_type: 'manual' | 'automatic' | 'category' | 'tags';
  created_at: string | null;
}

export interface FAQRelatedItems {
  id: string;
  faq_id: string;
  related_faq_id: string;
  score: number;
  created_at: string | null;
}

export interface KBContentPerformance {
  id: string;
  content_type: 'article' | 'faq';
  content_id: string;
  date: string;
  views: number;
  unique_views: number;
  helpful_votes: number;
  not_helpful_votes: number;
  shares: number;
  bookmarks: number;
  avg_time_on_page_seconds: number;
  bounce_rate: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface SupportTicketKBSuggestions {
  id: string;
  ticket_id: string;
  suggested_article_id: string | null;
  suggested_faq_id: string | null;
  suggestion_type: 'auto' | 'manual';
  was_helpful: boolean | null;
  resolved_with_kb: boolean | null;
  created_at: string | null;
}

export interface KBSettings {
  id: string;
  key: string;
  value: any;
  description: string | null;
  is_public: boolean;
  created_at: string | null;
  updated_at: string | null;
}

// Search and filter types
export interface KBSearchFilters {
  category?: string;
  service_type?: 'beauty' | 'fitness' | 'lifestyle';
  content_type?: string;
  tags?: string[];
  language?: 'en' | 'pl';
  date_range?: {
    from: string;
    to: string;
  };
}

export interface KBSearchRequest {
  query: string;
  filters?: KBSearchFilters;
  limit?: number;
  offset?: number;
  sort_by?: 'relevance' | 'published_at' | 'view_count' | 'helpful_count';
  sort_order?: 'asc' | 'desc';
}

export interface KBSearchResult {
  articles: (KBArticle & { relevance_score?: number })[];
  faqs: (FAQItem & { relevance_score?: number })[];
  total_count: number;
  search_time: number;
  suggestions?: string[];
}

// Analytics types
export interface KBDashboardMetrics {
  total_articles: number;
  total_faqs: number;
  total_views: number;
  total_searches: number;
  avg_rating: number;
  top_articles: KBArticle[];
  top_faqs: FAQItem[];
  recent_searches: KBSearchAnalytics[];
  performance_trend: KBContentPerformance[];
}

// Content management types
export interface KBCreateArticleRequest {
  title: string;
  summary?: string;
  content: string;
  content_type?: 'article' | 'tutorial' | 'guide' | 'faq_collection' | 'video_tutorial';
  category_id?: string;
  service_id?: string;
  meta_title?: string;
  meta_description?: string;
  focus_keywords?: string[];
  tags?: string[];
  featured_image_url?: string;
  video_url?: string;
  gallery_urls?: string[];
  attachments?: string[];
  language?: 'en' | 'pl';
  status?: 'draft' | 'review' | 'published';
}

export interface KBUpdateArticleRequest extends Partial<KBCreateArticleRequest> {
  id: string;
  version?: number;
}

export interface FAQCreateRequest {
  question: string;
  answer: string;
  question_pl?: string;
  answer_pl?: string;
  category_id?: string;
  service_id?: string;
  order_index?: number;
  is_featured?: boolean;
  language?: 'en' | 'pl';
}

export interface FAQUpdateRequest extends Partial<FAQCreateRequest> {
  id: string;
}

// Export all types
export type KnowledgeBaseTypes = {
  KBCategory;
  KBArticle;
  FAQCategory;
  FAQItem;
  KBSearchAnalytics;
  KBArticleFeedback;
  FAQFeedback;
  KBUserBookmark;
  KBRelatedArticles;
  FAQRelatedItems;
  KBContentPerformance;
  SupportTicketKBSuggestions;
  KBSettings;
  KBSearchFilters;
  KBSearchRequest;
  KBSearchResult;
  KBDashboardMetrics;
  KBCreateArticleRequest;
  KBUpdateArticleRequest;
  FAQCreateRequest;
  FAQUpdateRequest;
};