import { getAIService, isValidAPIKey, type AIConfig } from './service';

// Environment variables
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;

// Default configuration
export const DEFAULT_AI_CONFIG: AIConfig = {
  apiKey: OPENAI_API_KEY || '',
  model: 'gpt-4-turbo-preview',
  maxTokens: 2000,
  temperature: 0.7,
};

// Initialize AI service
export function initializeAIService(): boolean {
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not found in environment variables');
    return false;
  }

  if (!isValidAPIKey(OPENAI_API_KEY)) {
    console.error('Invalid OpenAI API key format');
    return false;
  }

  try {
    getAIService(DEFAULT_AI_CONFIG);
    return true;
  } catch (error) {
    console.error('Failed to initialize AI service:', error);
    return false;
  }
}

// Export configured service
export const aiService = OPENAI_API_KEY ? getAIService(DEFAULT_AI_CONFIG) : null;

// Feature flags for AI features
export const AI_FEATURES = {
  CONTENT_GENERATION: import.meta.env.VITE_AI_CONTENT_GENERATION !== 'false',
  SMART_SCHEDULING: import.meta.env.VITE_AI_SMART_SCHEDULING !== 'false',
  TRANSLATION: import.meta.env.VITE_AI_TRANSLATION !== 'false',
  RECOMMENDATIONS: import.meta.env.VITE_AI_RECOMMENDATIONS !== 'false',
  CHATBOT: import.meta.env.VITE_AI_CHATBOT !== 'false',
} as const;

// Check if AI features are enabled
export function isAIFeatureEnabled(feature: keyof typeof AI_FEATURES): boolean {
  return AI_FEATURES[feature] && !!aiService;
}

// Export all types and schemas
export * from './service';