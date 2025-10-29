import { lazy } from 'react';

// Lazy load AI SDKs only when needed
export const loadOpenAI = () => import('openai').then(module => module.default);
export const loadAnthropic = () => import('@anthropic-ai/sdk').then(module => module.Anthropic);
export const loadGoogleAI = () => import('@google/generative-ai').then(module => module.GoogleGenerativeAI);

// Lazy load AI components
export const LazyChatbotInterface = lazy(() =>
  import('@/components/ai/ChatbotInterface').then(module => ({
    default: module.ChatbotInterface
  }))
);

export const LazyAIInsights = lazy(() =>
  import('@/components/ai/AIInsights').then(module => ({
    default: module.AIInsights
  }))
);

export const LazyRecommendationEngine = lazy(() =>
  import('@/components/ai/RecommendationEngine').then(module => ({
    default: module.RecommendationEngine
  }))
);

export const LazyAIContentManager = lazy(() =>
  import('@/components/admin/content/AIContentManager').then(module => ({
    default: module.AIContentManager
  }))
);

export const LazyBlogAutomator = lazy(() =>
  import('@/components/admin/content/BlogAutomator').then(module => ({
    default: module.BlogAutomator
  }))
);

// AI Service Factory with lazy loading
class AIServiceFactory {
  private openAI: any = null;
  private anthropic: any = null;
  private googleAI: any = null;

  async getOpenAI() {
    if (!this.openAI) {
      const OpenAI = await loadOpenAI();
      this.openAI = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
      });
    }
    return this.openAI;
  }

  async getAnthropic() {
    if (!this.anthropic) {
      const Anthropic = await loadAnthropic();
      this.anthropic = new Anthropic({
        apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
        dangerouslyAllowBrowser: true,
      });
    }
    return this.anthropic;
  }

  async getGoogleAI() {
    if (!this.googleAI) {
      const GoogleGenerativeAI = await loadGoogleAI();
      this.googleAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY);
    }
    return this.googleAI;
  }

  // Check if AI is enabled
  isAIEnabled() {
    return import.meta.env.VITE_ENABLE_AI === 'true';
  }

  // Get available AI providers
  getAvailableProviders() {
    const providers: string[] = [];
    if (import.meta.env.VITE_OPENAI_API_KEY) providers.push('openai');
    if (import.meta.env.VITE_ANTHROPIC_API_KEY) providers.push('anthropic');
    if (import.meta.env.VITE_GOOGLE_AI_API_KEY) providers.push('google');
    return providers;
  }

  // Reset all cached instances (useful for testing or config changes)
  reset() {
    this.openAI = null;
    this.anthropic = null;
    this.googleAI = null;
  }
}

// Export singleton instance
export const aiServiceFactory = new AIServiceFactory();

// Helper function to check if we're on an admin page
export function isAdminPage(): boolean {
  return window.location.pathname.startsWith('/admin');
}

// Hook to lazy load AI services only on admin pages
export function useAIServices() {
  const shouldLoadAI = aiServiceFactory.isAIEnabled() && isAdminPage();

  return {
    shouldLoadAI,
    loadOpenAI: shouldLoadAI ? () => aiServiceFactory.getOpenAI() : null,
    loadAnthropic: shouldLoadAI ? () => aiServiceFactory.getAnthropic() : null,
    loadGoogleAI: shouldLoadAI ? () => aiServiceFactory.getGoogleAI() : null,
    availableProviders: shouldLoadAI ? aiServiceFactory.getAvailableProviders() : [],
  };
}