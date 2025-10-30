// Luxury Support System Integration
// World-class support experience for Mariia Hub

export { default as LuxurySupportOrchestrator } from './LuxurySupportOrchestrator';
export { default as UnifiedSupportDashboard } from './UnifiedSupportDashboard';
export { default as VIPExperienceEnhancement } from './VIPExperienceEnhancement';
export { default as AISupportIntelligence } from './AISupportIntelligence';
export { default as ComprehensiveAnalytics } from './ComprehensiveAnalytics';

// Re-export types for external use
export type {
  LuxurySupportOrchestratorProps,
  SystemHealth,
  ComponentHealth,
  IntegrationStatus,
  OrchestrationMetrics
} from './LuxurySupportOrchestrator';

export type {
  UnifiedSupportDashboardProps,
  OmnichannelConversation,
  UnifiedContext,
  ClientProfile,
  AgentPerformance,
  SystemMetrics
} from './UnifiedSupportDashboard';

export type {
  VIPExperienceEnhancementProps,
  VIPClientProfile,
  VIPService,
  VIPExperience,
  VIPPreference,
  VIPInsight,
  VIPMilestone
} from './VIPExperienceEnhancement';

export type {
  AISupportIntelligenceProps,
  AIRoutingDecision,
  AIPrediction,
  AIInsight,
  AIAutomationRule,
  AIQualityMetric,
  AIModel
} from './AISupportIntelligence';

export type {
  ComprehensiveAnalyticsProps,
  AnalyticsMetric,
  AnalyticsInsight,
  VisualizationConfig,
  Dashboard,
  Report
} from './ComprehensiveAnalytics';

// Support System Configuration
export const SUPPORT_SYSTEM_CONFIG = {
  version: '1.0.0',
  name: 'Luxury Support Experience',
  description: 'World-class integrated support system for premium beauty and fitness services',

  // System capabilities
  capabilities: {
    omnichannel: true,
    vipManagement: true,
    aiIntelligence: true,
    realTimeAnalytics: true,
    qualityAssurance: true,
    multiLanguage: true,
    mobileOptimized: true,
    whiteGloveService: true
  },

  // Supported channels
  channels: [
    'chat',
    'email',
    'phone',
    'video',
    'whatsapp',
    'facebook',
    'instagram',
    'twitter',
    'linkedin'
  ],

  // Client tiers
  clientTiers: [
    'vip_platinum',
    'vip_gold',
    'vip_silver',
    'premium',
    'standard'
  ],

  // Languages supported
  languages: [
    'pl', // Polish
    'en', // English
    'de', // German
    'fr', // French
    'ru', // Russian
    'uk'  // Ukrainian
  ],

  // Integration endpoints
  integrations: {
    database: 'Supabase',
    payments: 'Stripe',
    communications: [
      'WhatsApp Business API',
      'SendGrid Email Service',
      'Google Analytics'
    ],
    crm: 'Custom CRM Integration',
    booking: 'Internal Booking System',
    analytics: 'Custom Analytics Engine'
  },

  // Performance targets
  performanceTargets: {
    responseTime: {
      vip: 60, // seconds
      premium: 120,
      standard: 300
    },
    satisfaction: {
      vip: 4.8, // out of 5
      premium: 4.5,
      standard: 4.2
    },
    resolution: {
      firstContact: 85, // percentage
      overall: 95
    },
    uptime: 99.9 // percentage
  },

  // Security features
  security: {
    encryption: 'AES-256',
    authentication: 'Multi-factor',
    dataPrivacy: 'GDPR Compliant',
    auditLogging: true,
    roleBasedAccess: true
  },

  // AI capabilities
  aiFeatures: {
    smartRouting: true,
    sentimentAnalysis: true,
    predictiveInsights: true,
    automationRules: true,
    naturalLanguageProcessing: true,
    machineLearningModels: true
  }
};

// Default export for easy importing
export default LuxurySupportOrchestrator;