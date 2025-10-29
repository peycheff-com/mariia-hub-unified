import { ContentType } from '@/integrations/ai/service';

export interface ContentItem {
  id: string;
  type: ContentType;
  title: Record<string, string>;
  content: Record<string, string>;
  slug: string;
  status: 'draft' | 'review' | 'scheduled' | 'published' | 'archived';
  author: string;
  authorId: string;
  authorAvatar?: string;
  language: string;
  translations?: Record<string, ContentTranslation>;
  seoTitle?: Record<string, string>;
  metaDescription?: Record<string, string>;
  tags?: string[];
  category?: string;
  featuredImage?: string;
  gallery?: string[];
  publishedAt?: string;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  analytics?: ContentAnalytics;
  approvals?: ContentApproval[];
  aiGenerated: boolean;
  aiPrompt?: string;
}

export interface ContentTranslation {
  title: string;
  content: string;
  status: 'draft' | 'review' | 'approved';
  translatorId?: string;
  translatedAt?: string;
}

export interface ContentAnalytics {
  views: number;
  uniqueViews: number;
  engagement: number;
  shares: number;
  comments: number;
  likes: number;
  conversionRate?: number;
  readTime: number;
  bounceRate: number;
}

export interface ContentApproval {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  createdAt: string;
}

export interface ContentCalendar {
  id: string;
  contentId: string;
  publishDate: string;
  status: 'scheduled' | 'published' | 'missed';
  channels: string[];
  promotionSettings: PromotionSettings;
}

export interface PromotionSettings {
  email: boolean;
  social: boolean;
  push: boolean;
  sms: boolean;
  schedule: string[];
}

export interface AIImageSuggestion {
  prompt: string;
  style: 'photorealistic' | 'illustration' | 'abstract' | 'luxury';
  keywords: string[];
  composition: string;
}

export interface ContentGenerationOptions {
  tone: 'professional' | 'friendly' | 'casual' | 'luxury';
  length: number;
  keywords: string[];
  category: string;
  audience: string;
  includeImages: boolean;
  generateSeo: boolean;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  flag: string;
}

export interface AIContentManagerProps {
  className?: string;
}