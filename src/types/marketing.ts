import { Database } from './supabase';

export type SocialMediaPlatform = Database['public']['Tables']['social_media_platforms']['Row'];
export type SocialMediaAccount = Database['public']['Tables']['social_media_accounts']['Row'];
export type MarketingCampaign = Database['public']['Tables']['marketing_campaigns']['Row'];
export type SocialMediaContent = Database['public']['Tables']['social_media_content']['Row'];
export type ContentSchedulingRule = Database['public']['Tables']['content_scheduling_rules']['Row'];
export type EmailCampaign = Database['public']['Tables']['email_campaigns']['Row'];
export type EmailTemplate = Database['public']['Tables']['email_templates']['Row'];
export type EmailList = Database['public']['Tables']['email_lists']['Row'];
export type EmailSubscriber = Database['public']['Tables']['email_subscribers']['Row'];
export type EmailCampaignSend = Database['public']['Tables']['email_campaign_sends']['Row'];
export type Influencer = Database['public']['Tables']['influencers']['Row'];
export type InfluencerCollaboration = Database['public']['Tables']['influencer_collaborations']['Row'];
export type AffiliateProgram = Database['public']['Tables']['affiliate_programs']['Row'];
export type AffiliatePartner = Database['public']['Tables']['affiliate_partners']['Row'];
export type AffiliateTracking = Database['public']['Tables']['affiliate_tracking']['Row'];
export type MarketingAnalytics = Database['public']['Tables']['marketing_analytics']['Row'];
export type CustomerTouchpoint = Database['public']['Tables']['customer_touchpoints']['Row'];
export type UserGeneratedContent = Database['public']['Tables']['user_generated_content']['Row'];
export type LoyaltyProgram = Database['public']['Tables']['loyalty_programs']['Row'];
export type CustomerLoyalty = Database['public']['Tables']['customer_loyalty']['Row'];
export type ReferralProgram = Database['public']['Tables']['referral_programs']['Row'];
export type Referral = Database['public']['Tables']['referrals']['Row'];
export type MarketingAutomationWorkflow = Database['public']['Tables']['marketing_automation_workflows']['Row'];
export type AutomationExecutionLog = Database['public']['Tables']['automation_execution_logs']['Row'];
export type MarketingABTest = Database['public']['Tables']['marketing_ab_tests']['Row'];

// Extended types for UI components and API responses
export interface SocialMediaPostRequest {
  content: string;
  mediaFiles?: File[];
  platforms: string[];
  scheduledFor?: Date;
  hashtags?: string[];
  mentions?: string[];
  callToAction?: string;
  campaignId?: string;
  contentType?: 'post' | 'story' | 'reel' | 'carousel' | 'video';
}

export interface SocialMediaAnalytics {
  platform: string;
  postId: string;
  metrics: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    reach: number;
    impressions: number;
    engagement: number;
    videoViews?: number;
    videoWatchTime?: number;
  };
  demographics?: {
    age: Record<string, number>;
    gender: Record<string, number>;
    location: Record<string, number>;
  };
  performance: {
    score: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export interface EmailCampaignMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  bounced: number;
  complained: number;
  revenue: number;
  conversionRate: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;
}

export interface InfluencerMetrics {
  followerGrowth: number;
  engagementRate: number;
  averageLikes: number;
  averageComments: number;
  bestPerformingContent: string[];
  audienceDemographics: {
    age: Record<string, number>;
    gender: Record<string, number>;
    location: Record<string, number>;
    interests: string[];
  };
}

export interface MarketingROI {
  campaignId: string;
  campaignName: string;
  totalSpend: number;
  totalRevenue: number;
  roi: number;
  cac: number; // Customer Acquisition Cost
  ltv: number; // Lifetime Value
  conversionRate: number;
  attributionData: {
    organic: number;
    paid: number;
    social: number;
    email: number;
    referral: number;
  };
}

export interface ContentCalendarEvent {
  id: string;
  title: string;
  type: 'social_post' | 'email_campaign' | 'influencer_post' | 'blog_post';
  platform?: string;
  scheduledFor: Date;
  status: 'scheduled' | 'posted' | 'sent' | 'failed';
  campaign?: string;
  metrics?: any;
}

export interface MarketingDashboard {
  overview: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalSpend: number;
    totalRevenue: number;
    averageROI: number;
    totalSubscribers: number;
    socialFollowers: number;
    engagementRate: number;
  };
  topPerforming: {
    campaigns: MarketingCampaign[];
    content: SocialMediaContent[];
    influencers: Influencer[];
    emailTemplates: EmailTemplate[];
  };
  recentActivity: {
    posts: SocialMediaContent[];
    campaigns: EmailCampaign[];
    collaborations: InfluencerCollaboration[];
    analytics: MarketingAnalytics[];
  };
  trends: {
    engagement: Array<{ date: string; value: number }>;
    conversions: Array<{ date: string; value: number }>;
    revenue: Array<{ date: string; value: number }>;
    followers: Array<{ date: string; value: number }>;
  };
}

export interface WorkflowTrigger {
  type: 'event' | 'time' | 'behavior' | 'segment';
  config: Record<string, any>;
}

export interface WorkflowAction {
  type: 'send_email' | 'create_social_post' | 'add_to_list' | 'remove_from_list' | 'update_profile' | 'send_notification' | 'create_task';
  config: Record<string, any>;
  delay?: number; // minutes
}

export interface EmailTemplateBuilder {
  template: EmailTemplate;
  variables: Record<string, any>;
  sections: {
    header: string;
    body: string;
    footer: string;
    sidebar?: string;
    cta?: string;
  };
  styling: {
    colors: {
      primary: string;
      secondary: string;
      background: string;
      text: string;
    };
    fonts: {
      heading: string;
      body: string;
    };
    layout: {
      width: number;
      spacing: number;
    };
  };
}

export interface ContentOptimization {
  score: number;
  suggestions: {
    title: string[];
    content: string[];
    hashtags: string[];
    timing: string[];
    media: string[];
  };
  bestPractices: {
    length: { min: number; max: number; optimal: number };
    hashtags: { count: number; popular: string[] };
    timing: { best: string[]; avoid: string[] };
    media: { types: string[]; specs: Record<string, any> };
  };
}

export interface MarketingSegment {
  id: string;
  name: string;
  description: string;
  type: 'static' | 'dynamic';
  rules: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
    value: any;
  }};
  count: number;
  performance: {
    conversionRate: number;
    engagementRate: number;
    revenue: number;
  };
}

export interface LeadScoring {
  score: number;
  factors: Array<{
    type: string;
    weight: number;
    value: number;
    description: string;
  }>;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  nextActions: string[];
}

export interface MarketingFunnel {
  stage: 'awareness' | 'interest' | 'consideration' | 'conversion' | 'retention' | 'advocacy';
  count: number;
  conversionRate: number;
  dropOffRate: number;
  averageTime: number; // minutes
  optimization: {
    suggestions: string[];
    potentialImprovement: number;
  };
}

export interface CompetitiveAnalysis {
  competitors: Array<{
    name: string;
    handle: string;
    platform: string;
    followers: number;
    engagementRate: number;
    postingFrequency: number;
    topContent: string[];
    strengths: string[];
    weaknesses: string[];
  }>;
  marketPosition: {
    followersRank: number;
    engagementRank: number;
    contentQualityRank: number;
    overallRank: number;
  };
  opportunities: string[];
  threats: string[];
}

export interface InfluencerOpportunity {
  influencer: Influencer;
  collaborationType: string;
  estimatedCost: number;
  estimatedReach: number;
  estimatedEngagement: number;
  fitScore: number;
  recommendedActions: string[];
}

export interface MarketingAutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
    logic?: 'AND' | 'OR';
  }>;
  actions: WorkflowAction[];
  isActive: boolean;
  executionCount: number;
  lastExecution?: Date;
  performance: {
    successRate: number;
    averageExecutionTime: number;
    errorRate: number;
  };
}

export interface ContentPerformanceInsight {
  contentId: string;
  contentType: string;
  platform: string;
  score: number;
  insights: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    recommendations: string[];
  };
  comparisons: {
    vsAverage: number;
    vsPrevious: number;
    vsGoal: number;
  };
}

export interface MarketingCalendar {
  events: ContentCalendarEvent[];
  filters: {
    platforms: string[];
    campaignTypes: string[];
    dateRange: { start: Date; end: Date };
    status: string[];
  };
  views: 'month' | 'week' | 'day' | 'list';
  analytics: {
    postingFrequency: Record<string, number>;
    bestPerformingTimes: Array<{ day: string; time: string; engagement: number }>;
    contentMix: Record<string, number>;
  };
}

export interface EmailPersonalization {
  subscriberId: string;
  personalizationData: Record<string, any>;
  dynamicContent: Record<string, string[]>;
  recommendations: {
    products: string[];
    content: string[];
    timing: string;
    frequency: string;
  };
  behavior: {
    lastActivity: Date;
    engagementLevel: 'high' | 'medium' | 'low';
    preferences: string[];
    purchaseHistory: any[];
  };
}

export interface MarketingKPI {
  name: string;
  value: number;
  target: number;
  previousValue: number;
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
  status: 'excellent' | 'good' | 'average' | 'poor';
  lastUpdated: Date;
}

export interface MarketingReport {
  id: string;
  title: string;
  dateRange: { start: Date; end: Date };
  kpis: MarketingKPI[];
  sections: Array<{
    title: string;
    type: 'chart' | 'table' | 'text' | 'metrics';
    data: any;
    insights: string[];
  }>;
  summary: {
    highlights: string[];
    concerns: string[];
    recommendations: string[];
    nextSteps: string[];
  };
  generatedAt: Date;
  generatedBy: string;
}

// API Request/Response types
export interface CreateCampaignRequest {
  name: string;
  description?: string;
  campaignType: string;
  startDate: Date;
  endDate?: Date;
  budget?: number;
  targetAudience: Record<string, any>;
  goals: Record<string, any>;
  tags?: string[];
}

export interface ScheduleContentRequest {
  content: SocialMediaPostRequest;
  platforms: string[];
  schedulingRule?: string;
  optimizeTiming?: boolean;
}

export interface EmailCampaignRequest {
  name: string;
  subjectLine: string;
  previewText?: string;
  fromName: string;
  fromEmail: string;
  templateId?: string;
  contentHtml: string;
  contentText?: string;
  listIds: string[];
  personalizationVars?: Record<string, any>;
  segmentationRules?: Record<string, any>;
  scheduledFor?: Date;
  abTestConfig?: Record<string, any>;
}

export interface InfluencerCollaborationRequest {
  influencerId: string;
  collaborationType: string;
  brief: string;
  deliverables: Record<string, any>;
  compensationType: string;
  compensationAmount?: number;
  startDate: Date;
  endDate?: Date;
  contentReviewRequired?: boolean;
  usageRights?: string;
}

export interface AnalyticsQuery {
  dateRange: { start: Date; end: Date };
  platforms?: string[];
  campaigns?: string[];
  metrics: string[];
  groupBy?: string[];
  filters?: Record<string, any>;
}

// Error types
export class MarketingError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'MarketingError';
  }
}

// Integration types
export interface SocialMediaIntegration {
  platform: string;
  authenticate(): Promise<boolean>;
  postContent(content: SocialMediaPostRequest): Promise<string>;
  getAnalytics(postId: string): Promise<SocialMediaAnalytics>;
  getAccountMetrics(): Promise<any>;
  schedulePost(content: SocialMediaPostRequest, scheduledFor: Date): Promise<string>;
}

export interface EmailServiceIntegration {
  sendCampaign(campaign: EmailCampaign, subscribers: EmailSubscriber[]): Promise<EmailCampaignSend[]>;
  getTemplates(): Promise<EmailTemplate[]>;
  createCampaign(campaign: EmailCampaignRequest): Promise<EmailCampaign>;
  getAnalytics(campaignId: string): Promise<EmailCampaignMetrics>;
  addSubscribers(subscribers: EmailSubscriber[], listId: string): Promise<void>;
}

export interface AnalyticsIntegration {
  getMetrics(query: AnalyticsQuery): Promise<any>;
  trackEvent(event: string, data: Record<string, any>): Promise<void>;
  createReport(config: Record<string, any>): Promise<MarketingReport>;
  getRealTimeData(metrics: string[]): Promise<Record<string, number>>;
}