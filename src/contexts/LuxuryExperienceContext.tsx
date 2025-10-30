import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ClientRelationshipService } from '@/services/client-relationship.service';
import { SupportService } from '@/services/support.service';

// Luxury client tiers and their corresponding benefits
export type ClientTier = 'vip_platinum' | 'vip_gold' | 'vip_silver' | 'premium' | 'standard';

export interface VIPClientProfile {
  id: string;
  tier: ClientTier;
  totalSpent: number;
  bookingCount: number;
  memberSince: string;
  preferences: {
    communicationChannel: 'email' | 'phone' | 'whatsapp' | 'video';
    language: 'en' | 'pl';
    contactHours: {
      start: string;
      end: string;
      timezone: string;
    };
    dedicatedAgent?: string;
  };
  benefits: {
    prioritySupport: boolean;
    dedicatedAgent: boolean;
    exclusiveAccess: boolean;
    premiumFeatures: boolean;
    personalizedService: boolean;
    whiteGloveService: boolean;
  };
  supportHistory: {
    totalTickets: number;
    satisfactionScore: number;
    lastInteraction: string;
    preferredResolution: string;
  };
}

export interface LuxuryServiceMetrics {
  avgResponseTime: number;
  satisfactionScore: number;
  resolutionRate: number;
  personalizationScore: number;
  whiteGloveServiceUsage: number;
  upsellConversion: number;
  clientRetention: number;
}

export interface LuxuryServiceStandard {
  tier: ClientTier;
  responseTime: {
    email: number; // hours
    phone: number; // minutes
    chat: number; // seconds
    whatsapp: number; // minutes
    video: number; // hours
  };
  availability: {
    hours: string;
    days: string[];
    support247: boolean;
  };
  communication: {
    personalizedGreeting: boolean;
    namePronunciation: boolean;
    preferredLanguage: boolean;
    culturalSensitivity: boolean;
  };
  serviceQuality: {
    whiteGloveService: boolean;
    proactiveOutreach: boolean;
    personalizedRecommendations: boolean;
    exclusiveBenefits: boolean;
    priorityAccess: boolean;
  };
}

interface LuxuryExperienceContextType {
  // Client tier management
  clientProfile: VIPClientProfile | null;
  currentTier: ClientTier;
  updateClientTier: (tier: ClientTier) => void;

  // Luxury service standards
  serviceStandards: LuxuryServiceStandard;
  getTierBenefits: (tier: ClientTier) => string[];
  calculateTierProgress: (client: VIPClientProfile) => number;

  // Personalization
  personalizedGreeting: () => string;
  getPreferredCommunicationChannel: () => string;
  isInPreferredContactHours: () => boolean;

  // VIP features
  hasDedicatedAgent: () => boolean;
  getDedicatedAgent: () => string | null;
  requestWhiteGloveService: () => Promise<boolean>;
  accessExclusiveFeatures: () => boolean;

  // Luxury communication
  generatePersonalizedMessage: (template: string, data?: any) => string;
  formatLuxuryResponse: (message: string, tier: ClientTier) => string;
  getCulturalPreferences: () => Record<string, any>;

  // Service metrics
  serviceMetrics: LuxuryServiceMetrics | null;
  updateServiceMetrics: (metrics: Partial<LuxuryServiceMetrics>) => void;

  // UI/UX enhancements
  luxuryTheme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
    animations: boolean;
  };
  enableLuxuryFeatures: () => boolean;

  // Language and localization
  currentLanguage: 'en' | 'pl';
  setLanguage: (lang: 'en' | 'pl') => void;
  getCulturalContext: () => Record<string, any>;
}

const LuxuryExperienceContext = createContext<LuxuryExperienceContextType | undefined>(undefined);

export const useLuxuryExperience = () => {
  const context = useContext(LuxuryExperienceContext);
  if (!context) {
    throw new Error('useLuxuryExperience must be used within a LuxuryExperienceProvider');
  }
  return context;
};

// Luxury service standards by tier
const LUXURY_SERVICE_STANDARDS: Record<ClientTier, LuxuryServiceStandard> = {
  vip_platinum: {
    tier: 'vip_platinum',
    responseTime: {
      email: 0.5, // 30 minutes
      phone: 1, // 1 minute
      chat: 5, // 5 seconds
      whatsapp: 2, // 2 minutes
      video: 0.25 // 15 minutes
    },
    availability: {
      hours: '24/7',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      support247: true
    },
    communication: {
      personalizedGreeting: true,
      namePronunciation: true,
      preferredLanguage: true,
      culturalSensitivity: true
    },
    serviceQuality: {
      whiteGloveService: true,
      proactiveOutreach: true,
      personalizedRecommendations: true,
      exclusiveBenefits: true,
      priorityAccess: true
    }
  },
  vip_gold: {
    tier: 'vip_gold',
    responseTime: {
      email: 1, // 1 hour
      phone: 2, // 2 minutes
      chat: 10, // 10 seconds
      whatsapp: 5, // 5 minutes
      video: 1 // 1 hour
    },
    availability: {
      hours: '6AM - 10PM',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      support247: false
    },
    communication: {
      personalizedGreeting: true,
      namePronunciation: true,
      preferredLanguage: true,
      culturalSensitivity: true
    },
    serviceQuality: {
      whiteGloveService: true,
      proactiveOutreach: true,
      personalizedRecommendations: true,
      exclusiveBenefits: true,
      priorityAccess: true
    }
  },
  vip_silver: {
    tier: 'vip_silver',
    responseTime: {
      email: 2, // 2 hours
      phone: 5, // 5 minutes
      chat: 15, // 15 seconds
      whatsapp: 10, // 10 minutes
      video: 2 // 2 hours
    },
    availability: {
      hours: '8AM - 8PM',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      support247: false
    },
    communication: {
      personalizedGreeting: true,
      namePronunciation: true,
      preferredLanguage: true,
      culturalSensitivity: false
    },
    serviceQuality: {
      whiteGloveService: false,
      proactiveOutreach: true,
      personalizedRecommendations: true,
      exclusiveBenefits: true,
      priorityAccess: true
    }
  },
  premium: {
    tier: 'premium',
    responseTime: {
      email: 6, // 6 hours
      phone: 10, // 10 minutes
      chat: 30, // 30 seconds
      whatsapp: 30, // 30 minutes
      video: 4 // 4 hours
    },
    availability: {
      hours: '9AM - 6PM',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      support247: false
    },
    communication: {
      personalizedGreeting: true,
      namePronunciation: false,
      preferredLanguage: true,
      culturalSensitivity: false
    },
    serviceQuality: {
      whiteGloveService: false,
      proactiveOutreach: false,
      personalizedRecommendations: true,
      exclusiveBenefits: false,
      priorityAccess: true
    }
  },
  standard: {
    tier: 'standard',
    responseTime: {
      email: 24, // 24 hours
      phone: 15, // 15 minutes
      chat: 60, // 60 seconds
      whatsapp: 60, // 60 minutes
      video: 24 // 24 hours
    },
    availability: {
      hours: '9AM - 5PM',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      support247: false
    },
    communication: {
      personalizedGreeting: false,
      namePronunciation: false,
      preferredLanguage: true,
      culturalSensitivity: false
    },
    serviceQuality: {
      whiteGloveService: false,
      proactiveOutreach: false,
      personalizedRecommendations: false,
      exclusiveBenefits: false,
      priorityAccess: false
    }
  }
};

// Tier benefits mapping
const TIER_BENEFITS: Record<ClientTier, string[]> = {
  vip_platinum: [
    '24/7 Dedicated Personal Assistant',
    'Priority Access to All Services',
    'Exclusive VIP Events Access',
    'Complimentary Upgrades',
    'White-Glove Concierge Service',
    'Personalized Service Recommendations',
    'Priority Phone Support (1-minute response)',
    'Exclusive Product Previews',
    'Personal Beauty/Fitness Consultant',
    'Flexible Scheduling Priority'
  ],
  vip_gold: [
    'Extended Support Hours (6AM-10PM)',
    'Priority Booking Access',
    'Exclusive Events Invitation',
    'Personalized Recommendations',
    'Priority Phone Support (2-minute response)',
    'Service Upgrades (when available)',
    'Personalized Consultations',
    'Advance Booking Priority'
  ],
  vip_silver: [
    'Extended Support Hours (8AM-8PM)',
    'Priority Response Times',
    'Personalized Service Recommendations',
    'Access to Premium Features',
    'Priority Email Support (2-hour response)',
    'Service Customization Options'
  ],
  premium: [
    'Priority Response Times',
    'Personalized Communication',
    'Access to Premium Features',
    'Priority Booking System',
    'Enhanced Customer Support'
  ],
  standard: [
    'Standard Customer Support',
    'Access to All Basic Features',
    'Regular Booking System'
  ]
};

// Luxury theme configurations
const LUXURY_THEMES: Record<ClientTier, any> = {
  vip_platinum: {
    primaryColor: '#8B4513',      // Deep cocoa
    secondaryColor: '#DAA520',     // Gold
    accentColor: '#FFD700',        // Bright gold
    fontFamily: 'Playfair Display',
    animations: true,
    specialEffects: true,
    exclusiveBackgrounds: true
  },
  vip_gold: {
    primaryColor: '#B8860B',       // Dark gold
    secondaryColor: '#8B4513',     // Cocoa
    accentColor: '#F5DEB3',        // Wheat
    fontFamily: 'Playfair Display',
    animations: true,
    specialEffects: true,
    exclusiveBackgrounds: false
  },
  vip_silver: {
    primaryColor: '#C0C0C0',       // Silver
    secondaryColor: '#8B4513',     // Cocoa
    accentColor: '#E5E5E5',        // Light silver
    fontFamily: 'Inter',
    animations: true,
    specialEffects: false,
    exclusiveBackgrounds: false
  },
  premium: {
    primaryColor: '#8B4513',       // Cocoa
    secondaryColor: '#F5DEB3',     // Wheat
    accentColor: '#DEB887',        // Burlywood
    fontFamily: 'Inter',
    animations: true,
    specialEffects: false,
    exclusiveBackgrounds: false
  },
  standard: {
    primaryColor: '#8B4513',       // Cocoa
    secondaryColor: '#F5DEB3',     // Wheat
    accentColor: '#DEB887',        // Burlywood
    fontFamily: 'Inter',
    animations: false,
    specialEffects: false,
    exclusiveBackgrounds: false
  }
};

interface LuxuryExperienceProviderProps {
  children: ReactNode;
  clientProfile?: VIPClientProfile | null;
}

export const LuxuryExperienceProvider: React.FC<LuxuryExperienceProviderProps> = ({
  children,
  clientProfile: initialClientProfile
}) => {
  const { t, i18n } = useTranslation();
  const [clientProfile, setClientProfile] = useState<VIPClientProfile | null>(initialClientProfile || null);
  const [serviceMetrics, setServiceMetrics] = useState<LuxuryServiceMetrics | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'pl'>(i18n.language as 'en' | 'pl');

  // Determine current tier
  const currentTier = clientProfile?.tier || 'standard';
  const serviceStandards = LUXURY_SERVICE_STANDARDS[currentTier];
  const luxuryTheme = LUXURY_THEMES[currentTier];

  // Initialize client profile if not provided
  useEffect(() => {
    if (!clientProfile && initialClientProfile) {
      setClientProfile(initialClientProfile);
    }
  }, [initialClientProfile, clientProfile]);

  // Client tier management
  const updateClientTier = (tier: ClientTier) => {
    if (clientProfile) {
      const updatedProfile = {
        ...clientProfile,
        tier,
        benefits: getTierBenefitsObject(tier)
      };
      setClientProfile(updatedProfile);
    }
  };

  const getTierBenefitsObject = (tier: ClientTier): VIPClientProfile['benefits'] => {
    switch (tier) {
      case 'vip_platinum':
        return {
          prioritySupport: true,
          dedicatedAgent: true,
          exclusiveAccess: true,
          premiumFeatures: true,
          personalizedService: true,
          whiteGloveService: true
        };
      case 'vip_gold':
        return {
          prioritySupport: true,
          dedicatedAgent: true,
          exclusiveAccess: true,
          premiumFeatures: true,
          personalizedService: true,
          whiteGloveService: true
        };
      case 'vip_silver':
        return {
          prioritySupport: true,
          dedicatedAgent: false,
          exclusiveAccess: true,
          premiumFeatures: true,
          personalizedService: true,
          whiteGloveService: false
        };
      case 'premium':
        return {
          prioritySupport: true,
          dedicatedAgent: false,
          exclusiveAccess: false,
          premiumFeatures: true,
          personalizedService: true,
          whiteGloveService: false
        };
      default:
        return {
          prioritySupport: false,
          dedicatedAgent: false,
          exclusiveAccess: false,
          premiumFeatures: false,
          personalizedService: false,
          whiteGloveService: false
        };
    }
  };

  const getTierBenefits = (tier: ClientTier): string[] => {
    return TIER_BENEFITS[tier] || [];
  };

  const calculateTierProgress = (client: VIPClientProfile): number => {
    // Simple calculation based on spending and booking count
    const spendingWeight = 0.7;
    const bookingWeight = 0.3;

    const maxSpending = 50000; // Example maximum for VIP Platinum
    const maxBookings = 100; // Example maximum bookings

    const spendingScore = Math.min((client.totalSpent / maxSpending) * 100, 100);
    const bookingScore = Math.min((client.bookingCount / maxBookings) * 100, 100);

    return Math.round((spendingScore * spendingWeight) + (bookingScore * bookingWeight));
  };

  // Personalization functions
  const personalizedGreeting = (): string => {
    if (!clientProfile) return t('greetings.default');

    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    const name = clientProfile.preferences?.dedicatedAgent ? clientProfile.preferences.dedicatedAgent : 'Valued Client';

    return t(`greetings.${timeOfDay}`, {
      name,
      tier: currentTier.replace('_', ' ').toUpperCase()
    });
  };

  const getPreferredCommunicationChannel = (): string => {
    return clientProfile?.preferences?.communicationChannel || 'email';
  };

  const isInPreferredContactHours = (): boolean => {
    if (!clientProfile || !clientProfile.preferences.contactHours) return true;

    const now = new Date();
    const currentTime = now.getHours() + now.getMinutes() / 60;
    const startTime = parseFloat(clientProfile.preferences.contactHours.start);
    const endTime = parseFloat(clientProfile.preferences.contactHours.end);

    return currentTime >= startTime && currentTime <= endTime;
  };

  // VIP features
  const hasDedicatedAgent = (): boolean => {
    return clientProfile?.benefits?.dedicatedAgent || false;
  };

  const getDedicatedAgent = (): string | null => {
    return clientProfile?.preferences?.dedicatedAgent || null;
  };

  const requestWhiteGloveService = async (): Promise<boolean> => {
    if (!clientProfile?.benefits?.whiteGloveService) return false;

    try {
      // Log the white glove service request
      await SupportService.createTicket({
        user_id: clientProfile.id,
        subject: 'White Glove Service Request',
        description: `VIP ${currentTier} client requesting white glove service`,
        category: 'service_request',
        priority: 'urgent',
        channel: 'web',
        white_glove_request: true
      });

      return true;
    } catch (error) {
      console.error('Error requesting white glove service:', error);
      return false;
    }
  };

  const accessExclusiveFeatures = (): boolean => {
    return clientProfile?.benefits?.exclusiveAccess || false;
  };

  // Luxury communication
  const generatePersonalizedMessage = (template: string, data?: any): string => {
    if (!clientProfile) return template;

    let message = template;

    // Replace personalization tokens
    message = message.replace(/\{clientName\}/g, data?.clientName || 'Valued Client');
    message = message.replace(/\{tier\}/g, currentTier.replace('_', ' ').toUpperCase());
    message = message.replace(/\{agentName\}/g, data?.agentName || getDedicatedAgent() || 'Support Specialist');
    message = message.replace(/\{personalizedGreeting\}/g, personalizedGreeting());

    return message;
  };

  const formatLuxuryResponse = (message: string, tier: ClientTier): string => {
    const prefixes = {
      vip_platinum: 'With utmost pleasure and our premium white-glove service, ',
      vip_gold: 'As our valued VIP Gold member, ',
      vip_silver: 'As our VIP Silver member, ',
      premium: 'Thank you for being a premium member. ',
      standard: 'Thank you for contacting us. '
    };

    const suffixes = {
      vip_platinum: ' Is there anything else we can assist you with today? We\'re here 24/7 for your convenience.',
      vip_gold: ' Is there anything else we can help you with today?',
      vip_silver: ' Please let us know if you need any additional assistance.',
      premium: ' We appreciate your business and are here to help.',
      standard: ' Please let us know if you have any other questions.'
    };

    return prefixes[tier] + message + suffixes[tier];
  };

  const getCulturalPreferences = (): Record<string, any> => {
    // Polish cultural preferences
    if (currentLanguage === 'pl') {
      return {
        formalAddress: true,
        titleUsage: true,
        nameOrder: 'familyFirst',
        dateFormats: 'DD.MM.YYYY',
        timeFormats: '24hour',
        businessHours: '9:00-17:00',
        preferredCommunicationStyle: 'formal'
      };
    }

    return {
      formalAddress: false,
      titleUsage: false,
      nameOrder: 'givenFirst',
      dateFormats: 'MM/DD/YYYY',
      timeFormats: '12hour',
      businessHours: '9:00-17:00',
      preferredCommunicationStyle: 'friendly'
    };
  };

  // Service metrics
  const updateServiceMetrics = (metrics: Partial<LuxuryServiceMetrics>) => {
    setServiceMetrics(prev => prev ? { ...prev, ...metrics } : metrics as LuxuryServiceMetrics);
  };

  // UI/UX enhancements
  const enableLuxuryFeatures = (): boolean => {
    return ['vip_platinum', 'vip_gold', 'vip_silver'].includes(currentTier);
  };

  // Language and localization
  const setLanguage = (lang: 'en' | 'pl') => {
    setCurrentLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const getCulturalContext = (): Record<string, any> => {
    return {
      language: currentLanguage,
      timezone: clientProfile?.preferences?.contactHours?.timezone || 'Europe/Warsaw',
      culturalPreferences: getCulturalPreferences(),
      localHolidays: currentLanguage === 'pl' ? [
        '01-01', '01-06', '05-01', '05-03', '08-15', '11-01', '11-11', '12-25', '12-26'
      ] : [
        '01-01', '07-04', '12-25'
      ]
    };
  };

  const contextValue: LuxuryExperienceContextType = {
    // Client tier management
    clientProfile,
    currentTier,
    updateClientTier,

    // Luxury service standards
    serviceStandards,
    getTierBenefits,
    calculateTierProgress,

    // Personalization
    personalizedGreeting,
    getPreferredCommunicationChannel,
    isInPreferredContactHours,

    // VIP features
    hasDedicatedAgent,
    getDedicatedAgent,
    requestWhiteGloveService,
    accessExclusiveFeatures,

    // Luxury communication
    generatePersonalizedMessage,
    formatLuxuryResponse,
    getCulturalPreferences,

    // Service metrics
    serviceMetrics,
    updateServiceMetrics,

    // UI/UX enhancements
    luxuryTheme,
    enableLuxuryFeatures,

    // Language and localization
    currentLanguage,
    setLanguage,
    getCulturalContext
  };

  return (
    <LuxuryExperienceContext.Provider value={contextValue}>
      {children}
    </LuxuryExperienceContext.Provider>
  );
};