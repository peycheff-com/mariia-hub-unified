export interface ContentItem {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  type: 'blog' | 'service' | 'social' | 'newsletter';
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  language: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  scheduledAt?: string;
  tags: string[];
  categories: string[];
  featuredImage?: string;
  images?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  readingTime?: number;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  promotionSettings?: PromotionSettings;
  translations?: ContentTranslation[];
  analytics?: ContentAnalytics;
  approvals?: ContentApproval[];
  calendarEvents?: ContentCalendar[];
}

export interface ContentTranslation {
  id: string;
  contentId: string;
  language: string;
  title: string;
  content: string;
  excerpt: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  status: 'draft' | 'published' | 'needs_review';
  createdAt: string;
  updatedAt: string;
  translatedBy?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  autoTranslated: boolean;
  qualityScore?: number;
}

export interface ContentAnalytics {
  id: string;
  contentId: string;
  date: string;
  views: number;
  uniqueViews: number;
  averageReadTime: number;
  bounceRate: number;
  engagementRate: number;
  shares: number;
  likes: number;
  comments: number;
  conversions: number;
  revenue?: number;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  sourceBreakdown: {
    organic: number;
    social: number;
    email: number;
    direct: number;
    referral: number;
  };
  locationBreakdown: Record<string, number>;
  ageDemographics: Record<string, number>;
  genderDemographics: {
    male: number;
    female: number;
    other: number;
  };
}

export interface ContentApproval {
  id: string;
  contentId: string;
  reviewerId: string;
  reviewerName: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_changes';
  comment: string;
  createdAt: string;
  reviewedAt?: string;
  changesRequested?: string[];
}

export interface ContentCalendar {
  id: string;
  contentId: string;
  scheduledDate: string;
  publishDate?: string;
  status: 'scheduled' | 'published' | 'cancelled';
  channels: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: string;
  };
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionSettings {
  priorityLevel: number;
  targetAudience: 'all' | 'new' | 'existing' | 'vip';
  channels: string[];
  budget?: number;
  startDate?: string;
  endDate?: string;
  customTargeting?: {
    ageRange: [number, number];
    locations: string[];
    interests: string[];
    behaviors: string[];
  };
  aBTestEnabled: boolean;
  performanceTracking: boolean;
}

export interface AIImageSuggestion {
  id: string;
  prompt: string;
  style: string;
  aspectRatio: string;
  generatedImages: string[];
  selectedImage?: string;
  status: 'generating' | 'completed' | 'failed';
  createdAt: string;
}