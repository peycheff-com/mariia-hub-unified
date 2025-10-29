import { z } from 'zod';

// Content type schemas
export const ContentTypeSchema = z.enum([
  'blog-post',
  'service-description',
  'email-template',
  'social-media',
  'page',
  'translation'
]);

export const ContentStatusSchema = z.enum([
  'draft',
  'review',
  'approved',
  'published',
  'scheduled',
  'archived'
]);

export const ContentVisibilitySchema = z.enum([
  'public',
  'private',
  'unlisted'
]);

export const LanguageSchema = z.enum(['en', 'pl', 'ua', 'ru']);

export const ToneSchema = z.enum([
  'professional',
  'friendly',
  'casual',
  'luxury',
  'promotional'
]);

// Base content types
export type ContentType = z.infer<typeof ContentTypeSchema>;
export type ContentStatus = z.infer<typeof ContentStatusSchema>;
export type ContentVisibility = z.infer<typeof ContentVisibilitySchema>;
export type Language = z.infer<typeof LanguageSchema>;
export type Tone = z.infer<typeof ToneSchema>;

// Content management interface
export const ContentManagementSchema = z.object({
  id: z.string().uuid(),
  type: ContentTypeSchema,
  title: z.string().min(1),
  slug: z.string().optional(),
  content: z.record(z.any()),
  excerpt: z.string().optional(),
  author_id: z.string().uuid().nullable(),

  // SEO fields
  seo_title: z.string().optional(),
  meta_description: z.string().optional(),
  meta_keywords: z.array(z.string()).optional(),
  focus_keyword: z.string().optional(),
  seo_score: z.number().min(0).max(100).optional(),

  // Language and translation
  language: LanguageSchema.default('en'),
  translation_group_id: z.string().uuid().nullable(),
  is_translation: z.boolean().default(false),
  source_language: LanguageSchema.nullable(),

  // Status and workflow
  status: ContentStatusSchema.default('draft'),
  visibility: ContentVisibilitySchema.default('public'),
  featured: z.boolean().default(false),

  // Scheduling
  published_at: z.string().datetime().nullable(),
  scheduled_for: z.string().datetime().nullable(),

  // Categorization
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  target_audience: z.string().optional(),

  // AI generation metadata
  ai_generated: z.boolean().default(false),
  ai_model: z.string().optional(),
  ai_prompt: z.string().optional(),
  ai_confidence: z.number().min(0).max(1).optional(),
  human_edited: z.boolean().default(false),

  // Analytics and engagement
  views: z.number().default(0),
  likes: z.number().default(0),
  shares: z.number().default(0),
  comments_count: z.number().default(0),
  conversion_rate: z.number().optional(),

  // Performance metrics
  read_time: z.number().optional(),
  readability_score: z.number().min(0).max(100).optional(),
  keyword_density: z.record(z.number()).optional(),

  // Social media integration
  auto_post_facebook: z.boolean().default(false),
  auto_post_instagram: z.boolean().default(false),
  auto_post_twitter: z.boolean().default(false),
  social_media_urls: z.record(z.string()).optional(),

  // Metadata
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  version: z.number().default(1),
  last_reviewed_at: z.string().datetime().nullable(),
  last_reviewed_by: z.string().uuid().nullable()
});

export type ContentManagement = z.infer<typeof ContentManagementSchema>;

// Content generation request types
export const BlogPostGenerationRequestSchema = z.object({
  topic: z.string().min(1),
  title: z.string().optional(),
  category: z.string().optional(),
  target_audience: z.string().optional(),
  tone: ToneSchema.default('luxury'),
  word_count: z.number().min(100).max(2000).default(800),
  language: LanguageSchema.default('en'),
  seo_keywords: z.array(z.string()).optional(),
  include_cta: z.boolean().default(true),
  include_images: z.boolean().default(true)
});

export const ServiceDescriptionGenerationRequestSchema = z.object({
  service_name: z.string().min(1),
  category: z.string().optional(),
  features: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  target_audience: z.string().optional(),
  tone: ToneSchema.default('luxury'),
  word_count: z.number().min(100).max(1000).default(400),
  language: LanguageSchema.default('en'),
  include_preparation: z.boolean().default(true),
  include_aftercare: z.boolean().default(true),
  include_faq: z.boolean().default(true)
});

export const EmailTemplateGenerationRequestSchema = z.object({
  purpose: z.string().min(1),
  recipient_type: z.enum(['lead', 'client', 'prospect', 'vip']),
  tone: ToneSchema.default('professional'),
  language: LanguageSchema.default('en'),
  include_personalization: z.boolean().default(true),
  include_cta: z.boolean().default(true),
  brand_voice: z.string().optional()
});

export const SocialMediaGenerationRequestSchema = z.object({
  platform: z.enum(['facebook', 'instagram', 'twitter', 'linkedin']),
  content_type: z.enum(['post', 'story', 'reel', 'carousel']),
  topic: z.string().min(1),
  tone: ToneSchema.default('friendly'),
  language: LanguageSchema.default('en'),
  include_hashtags: z.boolean().default(true),
  include_emoji: z.boolean().default(true),
  character_limit: z.number().optional()
});

export type BlogPostGenerationRequest = z.infer<typeof BlogPostGenerationRequestSchema>;
export type ServiceDescriptionGenerationRequest = z.infer<typeof ServiceDescriptionGenerationRequestSchema>;
export type EmailTemplateGenerationRequest = z.infer<typeof EmailTemplateGenerationRequestSchema>;
export type SocialMediaGenerationRequest = z.infer<typeof SocialMediaGenerationRequestSchema>;

// SEO analysis types
export const SEOAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  title_score: z.number().min(0).max(100),
  meta_description_score: z.number().min(0).max(100),
  content_score: z.number().min(0).max(100),
  keyword_density: z.record(z.number()),
  readability_score: z.number().min(0).max(100),
  suggestions: z.array(z.string()),
  issues: z.array(z.object({
    type: z.enum(['error', 'warning', 'info']),
    message: z.string(),
    field: z.string()
  })),
  word_count: z.number(),
  reading_time: z.number()
});

export type SEOAnalysis = z.infer<typeof SEOAnalysisSchema>;

// Translation workflow types
export const TranslationRequestSchema = z.object({
  content_id: z.string().uuid(),
  target_language: LanguageSchema,
  source_language: LanguageSchema.optional(),
  use_ai: z.boolean().default(true),
  use_memory: z.boolean().default(true),
  preserve_formatting: z.boolean().default(true),
  context: z.string().optional(),
  category: z.string().optional()
});

export const TranslationTaskSchema = z.object({
  id: z.string().uuid(),
  content_id: z.string().uuid(),
  source_language: LanguageSchema,
  target_language: LanguageSchema,
  status: z.enum(['pending', 'in_progress', 'review', 'completed', 'failed']),
  progress: z.number().min(0).max(100).default(0),
  assigned_to: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable()
});

export type TranslationRequest = z.infer<typeof TranslationRequestSchema>;
export type TranslationTask = z.infer<typeof TranslationTaskSchema>;

// Content scheduling types
export const ContentScheduleSchema = z.object({
  id: z.string().uuid(),
  content_id: z.string().uuid(),
  scheduled_for: z.string().datetime(),
  channels: z.array(z.enum(['blog', 'facebook', 'instagram', 'twitter', 'email'])),
  timezone: z.string().default('Europe/Warsaw'),
  auto_publish: z.boolean().default(true),
  repeat_pattern: z.enum(['none', 'daily', 'weekly', 'monthly']).optional(),
  repeat_until: z.string().datetime().optional(),
  status: z.enum(['scheduled', 'published', 'failed', 'cancelled']),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export type ContentSchedule = z.infer<typeof ContentScheduleSchema>;

// Content template types
export const ContentTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: ContentTypeSchema,
  structure: z.record(z.any()),
  placeholders: z.record(z.string()).optional(),
  is_system: z.boolean().default(false),
  created_by: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export type ContentTemplate = z.infer<typeof ContentTemplateSchema>;

// AI generation log types
export const AIGenerationLogSchema = z.object({
  id: z.string().uuid(),
  content_id: z.string().uuid().nullable(),
  user_id: z.string().uuid(),
  request_type: z.string(),
  prompt: z.string(),
  model: z.string(),
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
  response: z.record(z.any()).optional(),
  tokens_used: z.number().optional(),
  cost: z.number().optional(),
  duration_ms: z.number().optional(),
  quality_score: z.number().min(0).max(1).optional(),
  user_rating: z.number().min(1).max(5).optional(),
  feedback: z.string().optional(),
  created_at: z.string().datetime()
});

export type AIGenerationLog = z.infer<typeof AIGenerationLogSchema>;

// Content analytics types
export const ContentAnalyticsSchema = z.object({
  id: z.string().uuid(),
  content_id: z.string().uuid(),
  date: z.string().date(),
  views: z.number().default(0),
  unique_views: z.number().default(0),
  avg_time_on_page: z.number().default(0), // seconds
  bounce_rate: z.number().default(0), // percentage
  conversions: z.number().default(0),
  revenue: z.number().default(0),
  social_shares: z.number().default(0),
  comments: z.number().default(0),
  created_at: z.string().datetime()
});

export type ContentAnalytics = z.infer<typeof ContentAnalyticsSchema>;

// Content version types
export const ContentVersionSchema = z.object({
  id: z.string().uuid(),
  content_id: z.string().uuid(),
  version: z.number(),
  content: z.record(z.any()),
  title: z.string().optional(),
  excerpt: z.string().optional(),
  changes_summary: z.string().optional(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string().datetime()
});

export type ContentVersion = z.infer<typeof ContentVersionSchema>;

// Content review types
export const ContentReviewSchema = z.object({
  id: z.string().uuid(),
  content_id: z.string().uuid(),
  reviewer_id: z.string().uuid().nullable(),
  status: z.enum(['pending', 'approved', 'rejected', 'changes_requested']),
  review_text: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  reviewed_at: z.string().datetime().nullable(),
  created_at: z.string().datetime()
});

export type ContentReview = z.infer<typeof ContentReviewSchema>;

// Content performance summary
export const ContentPerformanceSummarySchema = z.object({
  content_id: z.string().uuid(),
  total_views: z.number(),
  avg_time_on_page: z.number(),
  total_conversions: z.number(),
  total_revenue: z.number(),
  conversion_rate: z.number(),
  engagement_rate: z.number(),
  social_shares: z.number(),
  comments_count: z.number(),
  trend: z.enum(['up', 'down', 'stable']),
  trend_percentage: z.number()
});

export type ContentPerformanceSummary = z.infer<typeof ContentPerformanceSummarySchema>;

// Content search filters
export const ContentSearchFiltersSchema = z.object({
  type: ContentTypeSchema.optional(),
  status: ContentStatusSchema.optional(),
  language: LanguageSchema.optional(),
  category: z.string().optional(),
  author_id: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  featured: z.boolean().optional(),
  ai_generated: z.boolean().optional(),
  search_query: z.string().optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'published_at', 'views', 'seo_score']).default('updated_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().default(20),
  offset: z.number().default(0)
});

export type ContentSearchFilters = z.infer<typeof ContentSearchFiltersSchema>;

// Export all types
export type {
  // Core types
  ContentType,
  ContentStatus,
  ContentVisibility,
  Language,
  Tone,

  // Main entities
  ContentManagement,
  ContentTemplate,
  ContentVersion,
  ContentReview,
  ContentAnalytics,
  AIGenerationLog,
  ContentSchedule,
  ContentPerformanceSummary,

  // Request types
  BlogPostGenerationRequest,
  ServiceDescriptionGenerationRequest,
  EmailTemplateGenerationRequest,
  SocialMediaGenerationRequest,
  TranslationRequest,
  TranslationTask,

  // Analysis types
  SEOAnalysis,

  // Utility types
  ContentSearchFilters
};