// Comprehensive Review System Types

export interface Review {
  id: string;
  booking_id?: string;
  client_id?: string;
  service_id?: string;
  rating: number; // 1-5
  title?: string;
  comment?: string;
  photos: ReviewMedia[];
  videos: ReviewMedia[];
  is_verified: boolean;
  verification_method?: 'booking_confirmed' | 'photo_metadata' | 'email_verified' | 'phone_verified';
  verification_data: Record<string, any>;
  is_fraud_suspected: boolean;
  fraud_score: number; // 0.00-1.00
  fraud_flags: string[];
  ai_response?: string;
  ai_response_sentiment?: 'positive' | 'negative' | 'neutral';
  ai_confidence?: number;
  response_requested: boolean;
  responded_at?: string;
  responded_by?: string;
  status: 'published' | 'pending' | 'hidden' | 'flagged' | 'removed';
  featured: boolean;
  helpful_count: number;
  report_count: number;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewMedia {
  id: string;
  url: string;
  thumbnail_url?: string;
  caption?: string;
  metadata?: {
    width: number;
    height: number;
    size: number;
    format: string;
    exif?: Record<string, any>;
    verified: boolean;
  };
}

export interface ReviewSource {
  id: string;
  review_id: string;
  platform: 'google' | 'booksy' | 'instagram' | 'facebook' | 'internal' | 'yelp' | 'trustpilot';
  external_id?: string;
  external_url?: string;
  reviewer_name?: string;
  reviewer_avatar?: string;
  platform_rating?: number;
  sync_date: string;
  last_synced_at: string;
  sync_status: 'synced' | 'pending' | 'failed' | 'deleted';
  raw_data: Record<string, any>;
  created_at: string;
}

export interface ReviewVerification {
  id: string;
  review_id: string;
  verification_type: 'booking_match' | 'photo_metadata' | 'email_domain' | 'phone_verification' | 'ip_analysis';
  status: 'passed' | 'failed' | 'pending';
  details: Record<string, any>;
  verified_by?: string;
  created_at: string;
}

export interface ReviewAnalytics {
  id: string;
  date: string;
  service_id?: string;
  total_reviews: number;
  average_rating: number;
  verified_reviews: number;
  photo_reviews: number;
  video_reviews: number;
  response_rate: number;
  average_response_time: string;
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  created_at: string;
  updated_at: string;
}

export interface ReviewHelpfulVote {
  id: string;
  review_id: string;
  user_id?: string;
  is_helpful: boolean;
  ip_address?: string;
  created_at: string;
}

export interface ReviewReport {
  id: string;
  review_id: string;
  reporter_id?: string;
  reason: 'fake' | 'inappropriate' | 'spam' | 'offensive' | 'conflict_of_interest' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'actioned';
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface ReviewResponseTemplate {
  id: string;
  name: string;
  rating_range?: {
    start: number;
    end: number;
  };
  template_text: string;
  variables: string[];
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewStatistics {
  total_reviews: number;
  average_rating: number;
  verified_reviews: number;
  photo_reviews: number;
  video_reviews: number;
  suspected_fraud: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface ReviewFilters {
  rating?: number[];
  verified?: boolean;
  has_photos?: boolean;
  has_videos?: boolean;
  date_range?: {
    start: string;
    end: string;
  };
  service_id?: string;
  status?: Review['status'];
  source?: ReviewSource['platform'][];
}

export interface ReviewFormData {
  booking_id?: string;
  service_id?: string;
  rating: number;
  title?: string;
  comment?: string;
  photos?: File[];
  videos?: File[];
  client_consent?: boolean;
  data_processing_consent?: boolean;
}

export interface ReviewAggregatorConfig {
  google: {
    api_key?: string;
    place_id?: string;
    enabled: boolean;
  };
  booksy: {
    api_key?: string;
    salon_id?: string;
    enabled: boolean;
  };
  instagram: {
    access_token?: string;
    business_account_id?: string;
    hashtag?: string;
    enabled: boolean;
  };
  facebook: {
    page_id?: string;
    access_token?: string;
    enabled: boolean;
  };
  sync_interval: number; // in minutes
}

export interface FraudDetectionConfig {
  ip_analysis: {
    enabled: boolean;
    max_reviews_per_hour: number;
    suspicious_ip_ranges: string[];
  };
  content_analysis: {
    enabled: boolean;
    spam_keywords: string[];
    duplicate_threshold: number;
  };
  behavior_analysis: {
    enabled: boolean;
    rating_consistency_check: boolean;
    timing_pattern_analysis: boolean;
  };
  auto_flag_threshold: number; // 0-1
}

export interface ReviewWidgetConfig {
  show_rating_breakdown: boolean;
  show_verification_badges: boolean;
  show_photos: boolean;
  show_videos: boolean;
  allow_sorting: boolean;
  allow_filtering: boolean;
  max_reviews_per_page: number;
  auto_refresh: boolean;
  theme: 'light' | 'dark' | 'auto';
}

// Supabase Types Extensions
export type DatabaseReviewTables = {
  reviews: Review;
  review_sources: ReviewSource;
  review_verifications: ReviewVerification;
  review_analytics: ReviewAnalytics;
  review_helpful_votes: ReviewHelpfulVote;
  review_reports: ReviewReport;
  review_response_templates: ReviewResponseTemplate;
};

// API Response Types
export interface ReviewListResponse {
  reviews: Review[];
  total: number;
  page: number;
  per_page: number;
  statistics: ReviewStatistics;
}

export interface ReviewDetailResponse extends Review {
  sources: ReviewSource[];
  verifications: ReviewVerification[];
  helpful_votes: ReviewHelpfulVote[];
  reports: ReviewReport[];
}

// Event Types
export interface ReviewCreatedEvent {
  type: 'review.created';
  review_id: string;
  service_id?: string;
  rating: number;
  client_id?: string;
}

export interface ReviewUpdatedEvent {
  type: 'review.updated';
  review_id: string;
  changes: Partial<Review>;
}

export interface ReviewFlaggedEvent {
  type: 'review.flagged';
  review_id: string;
  fraud_score: number;
  flags: string[];
}