/**
 * AI-Powered Alternative Text Generation
 *
 * Comprehensive AI-powered alt text generation for images,
 * with validation, management, and quality control.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types for AI alt text generation
export interface AltTextConfig {
  enabled: boolean;
  autoGenerate: boolean;
  aiProvider: 'openai' | 'google' | 'anthropic' | 'local';
  language: string;
  quality: 'basic' | 'detailed' | 'comprehensive';
  includeContext: boolean;
  maxLength: number;
  minQualityScore: number;
  batchSize: number;
  apiKeys: {
    openai?: string;
    google?: string;
    anthropic?: string;
  };
}

export interface AltTextGeneration {
  id: string;
  imageUrl: string;
  originalAlt: string;
  generatedAlt: string;
  confidence: number;
  qualityScore: number;
  timestamp: Date;
  provider: string;
  metadata: {
    detectedObjects: string[];
    sceneType: string;
    colors: string[];
    textInImage: string[];
    emotions?: string[];
    style?: string;
  };
  status: 'pending' | 'generated' | 'approved' | 'rejected';
  reviewed: boolean;
  reviewerId?: string;
}

export interface AltTextValidation {
  score: number;
  issues: string[];
  suggestions: string[];
  meetsWCAG: boolean;
  readability: 'poor' | 'fair' | 'good' | 'excellent';
  completeness: number; // 0-100
}

export interface ImageContext {
  surroundingText: string;
  pageSection: string;
  contentType: 'article' | 'product' | 'gallery' | 'profile' | 'decoration';
  relatedImages: string[];
  userPurpose: 'informational' | 'navigation' | 'decoration' | 'identification';
}

interface AIAltTextStore {
  // Configuration
  config: AltTextConfig;

  // State
  isProcessing: boolean;
  processingQueue: AltTextGeneration[];
  completedGenerations: AltTextGeneration[];
  validationResults: Map<string, AltTextValidation>;
  contextualData: Map<string, ImageContext>;

  // Actions
  initialize: () => void;
  updateConfiguration: (config: Partial<AltTextConfig>) => void;
  generateAltText: (imageUrl: string, context?: ImageContext) => Promise<AltTextGeneration>;
  generateBatch: (imageUrls: string[]) => Promise<AltTextGeneration[]>;
  validateAltText: (altText: string, imageUrl: string) => AltTextValidation;
  approveGeneration: (generationId: string, reviewerId: string) => void;
  rejectGeneration: (generationId: string, reason: string) => void;
  updateGeneration: (generationId: string, updates: Partial<AltTextGeneration>) => void;
  getContextualData: (imageUrl: string) => ImageContext;
  analyzeImage: (imageUrl: string) => Promise<any>;
  optimizeForWCAG: (altText: string) => string;
  getQualityMetrics: () => any;
  exportData: () => any;
  reset: () => void;
}

export const useAIAltText = create<AIAltTextStore>()(
  persist(
    (set, get) => ({
      // Default configuration
      config: {
        enabled: true,
        autoGenerate: true,
        aiProvider: 'openai',
        language: 'pl',
        quality: 'detailed',
        includeContext: true,
        maxLength: 250,
        minQualityScore: 0.7,
        batchSize: 5,
        apiKeys: {}
      },

      // Initial state
      isProcessing: false,
      processingQueue: [],
      completedGenerations: [],
      validationResults: new Map(),
      contextualData: new Map(),

      // Initialize AI alt text system
      initialize: () => {
        const store = get();

        // Set up automatic image detection
        store.setupImageDetection();

        // Set up keyboard shortcuts for alt text management
        store.setupKeyboardShortcuts();

        // Initialize analytics
        store.initializeAnalytics();

        // Scan existing images
        store.scanExistingImages();
      },

      // Update configuration
      updateConfiguration: (newConfig: Partial<AltTextConfig>) => {
        set(state => ({
          config: { ...state.config, ...newConfig }
        }));
      },

      // Generate alt text for single image
      generateAltText: async (imageUrl: string, context?: ImageContext): Promise<AltTextGeneration> => {
        const store = get();
        const { config } = store;

        if (!config.enabled) {
          throw new Error('AI alt text generation is disabled');
        }

        const generation: AltTextGeneration = {
          id: `alt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          imageUrl,
          originalAlt: store.extractOriginalAlt(imageUrl),
          generatedAlt: '',
          confidence: 0,
          qualityScore: 0,
          timestamp: new Date(),
          provider: config.aiProvider,
          metadata: {
            detectedObjects: [],
            sceneType: '',
            colors: [],
            textInImage: []
          },
          status: 'pending',
          reviewed: false
        };

        // Add to processing queue
        set(state => ({
          processingQueue: [...state.processingQueue, generation]
        }));

        try {
          set({ isProcessing: true });

          // Get contextual data if not provided
          const imageContext = context || store.getContextualData(imageUrl);

          // Analyze image
          const analysis = await store.analyzeImage(imageUrl);

          // Generate alt text using AI
          const generatedText = await store.callAIGeneration(analysis, imageContext);

          // Validate generated text
          const validation = store.validateAltText(generatedText, imageUrl);

          // Update generation
          const updatedGeneration: AltTextGeneration = {
            ...generation,
            generatedAlt: generatedText,
            confidence: analysis.confidence || 0.8,
            qualityScore: validation.score,
            metadata: {
              detectedObjects: analysis.objects || [],
              sceneType: analysis.sceneType || 'unknown',
              colors: analysis.colors || [],
              textInImage: analysis.text || [],
              emotions: analysis.emotions,
              style: analysis.style
            },
            status: validation.score >= config.minQualityScore ? 'generated' : 'pending'
          };

          // Update state
          set(state => ({
            processingQueue: state.processingQueue.filter(g => g.id !== generation.id),
            completedGenerations: [...state.completedGenerations, updatedGeneration],
            validationResults: new Map(state.validationResults).set(generation.id, validation)
          }));

          return updatedGeneration;

        } catch (error) {
          console.error('Failed to generate alt text:', error);

          // Update generation with error
          const errorGeneration: AltTextGeneration = {
            ...generation,
            status: 'rejected',
            generatedAlt: 'Unable to generate alternative text'
          };

          set(state => ({
            processingQueue: state.processingQueue.filter(g => g.id !== generation.id),
            completedGenerations: [...state.completedGenerations, errorGeneration]
          }));

          throw error;
        } finally {
          set({ isProcessing: false });
        }
      },

      // Generate alt text for batch of images
      generateBatch: async (imageUrls: string[]): Promise<AltTextGeneration[]> => {
        const store = get();
        const { config } = store;

        const results: AltTextGeneration[] = [];
        const batches = store.chunkArray(imageUrls, config.batchSize);

        for (const batch of batches) {
          const batchPromises = batch.map(url => store.generateAltText(url));
          const batchResults = await Promise.allSettled(batchPromises);

          batchResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              results.push(result.value);
            } else {
              console.error(`Failed to process image ${batch[index]}:`, result.reason);
            }
          });
        }

        return results;
      },

      // Validate alt text quality
      validateAltText: (altText: string, imageUrl: string): AltTextValidation => {
        const store = get();

        const issues: string[] = [];
        const suggestions: string[] = [];
        let score = 0;

        // Length validation
        if (altText.length < 10) {
          issues.push('Alt text is too short (minimum 10 characters)');
          score -= 0.3;
        } else if (altText.length > 250) {
          issues.push('Alt text is too long (maximum 250 characters)');
          score -= 0.2;
        } else {
          score += 0.2;
        }

        // Content quality checks
        if (!store.containsMeaningfulContent(altText)) {
          issues.push('Alt text lacks meaningful description');
          score -= 0.4;
        } else {
          score += 0.3;
        }

        // Avoid redundant phrases
        if (store.hasRedundantPhrases(altText)) {
          issues.push('Alt text contains redundant phrases like "image of"');
          score -= 0.2;
          suggestions.push('Remove redundant phrases and describe the content directly');
        }

        // Context relevance
        const context = store.getContextualData(imageUrl);
        if (store.isContextRelevant(altText, context)) {
          score += 0.2;
        } else {
          suggestions.push('Consider adding context about how this image relates to the surrounding content');
        }

        // Readability assessment
        const readability = store.assessReadability(altText);
        score += readability === 'excellent' ? 0.1 : readability === 'good' ? 0.05 : 0;

        // Completeness calculation
        const completeness = store.calculateCompleteness(altText, imageUrl);

        // Final score
        score = Math.max(0, Math.min(1, score));

        return {
          score,
          issues,
          suggestions,
          meetsWCAG: score >= 0.7 && altText.length >= 10 && altText.length <= 250,
          readability,
          completeness
        };
      },

      // Approve generation
      approveGeneration: (generationId: string, reviewerId: string) => {
        set(state => ({
          completedGenerations: state.completedGenerations.map(g =>
            g.id === generationId
              ? { ...g, status: 'approved', reviewed: true, reviewerId }
              : g
          )
        }));
      },

      // Reject generation
      rejectGeneration: (generationId: string, reason: string) => {
        set(state => ({
          completedGenerations: state.completedGenerations.map(g =>
            g.id === generationId
              ? { ...g, status: 'rejected', reviewed: true }
              : g
          )
        }));
      },

      // Update generation
      updateGeneration: (generationId: string, updates: Partial<AltTextGeneration>) => {
        set(state => ({
          completedGenerations: state.completedGenerations.map(g =>
            g.id === generationId
              ? { ...g, ...updates }
              : g
          )
        }));
      },

      // Get contextual data for image
      getContextualData: (imageUrl: string): ImageContext => {
        const store = get();

        // Check if we have cached contextual data
        const cached = store.contextualData.get(imageUrl);
        if (cached) {
          return cached;
        }

        // Find the image element
        const img = store.findImageElement(imageUrl);
        if (!img) {
          return {
            surroundingText: '',
            pageSection: 'unknown',
            contentType: 'decoration',
            relatedImages: [],
            userPurpose: 'informational'
          };
        }

        // Extract contextual information
        const context: ImageContext = {
          surroundingText: store.extractSurroundingText(img),
          pageSection: store.identifyPageSection(img),
          contentType: store.identifyContentType(img),
          relatedImages: store.findRelatedImages(img),
          userPurpose: store.inferUserPurpose(img)
        };

        // Cache the context
        set(state => ({
          contextualData: new Map(state.contextualData).set(imageUrl, context)
        }));

        return context;
      },

      // Analyze image using AI
      analyzeImage: async (imageUrl: string): Promise<any> => {
        const store = get();
        const { config } = store;

        // Try different AI providers based on configuration
        switch (config.aiProvider) {
          case 'openai':
            return store.analyzeWithOpenAI(imageUrl);
          case 'google':
            return store.analyzeWithGoogle(imageUrl);
          case 'anthropic':
            return store.analyzeWithAnthropic(imageUrl);
          case 'local':
            return store.analyzeWithLocalModel(imageUrl);
          default:
            return store.analyzeWithOpenAI(imageUrl);
        }
      },

      // Optimize alt text for WCAG compliance
      optimizeForWCAG: (altText: string): string => {
        let optimized = altText;

        // Remove redundant phrases
        optimized = optimized.replace(/^(image of|picture of|photo of)\s+/i, '');

        // Ensure proper capitalization
        optimized = optimized.charAt(0).toUpperCase() + optimized.slice(1);

        // Add period at end if missing
        if (!optimized.match(/[.!?]$/)) {
          optimized += '.';
        }

        // Remove excessive whitespace
        optimized = optimized.replace(/\s+/g, ' ').trim();

        return optimized;
      },

      // Get quality metrics
      getQualityMetrics: () => {
        const store = get();
        const { completedGenerations } = store;

        const total = completedGenerations.length;
        const approved = completedGenerations.filter(g => g.status === 'approved').length;
        const rejected = completedGenerations.filter(g => g.status === 'rejected').length;
        const pending = completedGenerations.filter(g => g.status === 'pending').length;

        const avgQualityScore = completedGenerations.length > 0
          ? completedGenerations.reduce((sum, g) => sum + g.qualityScore, 0) / completedGenerations.length
          : 0;

        const avgConfidence = completedGenerations.length > 0
          ? completedGenerations.reduce((sum, g) => sum + g.confidence, 0) / completedGenerations.length
          : 0;

        return {
          total,
          approved,
          rejected,
          pending,
          approvalRate: total > 0 ? approved / total : 0,
          avgQualityScore,
          avgConfidence
        };
      },

      // Export data
      exportData: () => {
        const store = get();
        const metrics = store.getQualityMetrics();

        return {
          config: store.config,
          metrics,
          generations: store.completedGenerations,
          validations: Array.from(store.validationResults.entries()),
          exportDate: new Date().toISOString()
        };
      },

      // Reset all data
      reset: () => {
        set({
          isProcessing: false,
          processingQueue: [],
          completedGenerations: [],
          validationResults: new Map(),
          contextualData: new Map()
        });
      },

      // Internal methods
      setupImageDetection: () => {
        // Monitor for new images added to the page
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const images = (node as Element).querySelectorAll('img');
                images.forEach(img => {
                  if (!img.alt || img.alt.trim() === '') {
                    // Auto-generate alt text for images without alt text
                    const store = get();
                    if (store.config.autoGenerate) {
                      store.generateAltText(img.src);
                    }
                  }
                });
              }
            });
          });
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true
        });

        (get() as any).observer = observer;
      },

      setupKeyboardShortcuts: () => {
        document.addEventListener('keydown', (e) => {
          // Ctrl + Alt + A: Generate alt text for focused image
          if (e.ctrlKey && e.altKey && e.key === 'a') {
            const focusedElement = document.activeElement;
            if (focusedElement && focusedElement.tagName === 'IMG') {
              const store = get();
              store.generateAltText((focusedElement as HTMLImageElement).src);
            }
          }
        });
      },

      initializeAnalytics: () => {
        // Track alt text generation metrics
        const store = get();

        setInterval(() => {
          const metrics = store.getQualityMetrics();
          console.log('AI Alt Text Metrics:', metrics);
        }, 60000); // Log metrics every minute
      },

      scanExistingImages: () => {
        const store = get();
        const images = document.querySelectorAll('img:not([data-alt-processed])');

        images.forEach(img => {
          img.setAttribute('data-alt-processed', 'true');

          if (!img.alt || img.alt.trim() === '') {
            if (store.config.autoGenerate) {
              store.generateAltText(img.src);
            }
          }
        });
      },

      extractOriginalAlt: (imageUrl: string): string => {
        const img = store.findImageElement(imageUrl);
        return img?.alt || '';
      },

      findImageElement: (imageUrl: string): HTMLImageElement | null => {
        const images = document.querySelectorAll(`img[src="${imageUrl}"]`);
        return images.length > 0 ? images[0] as HTMLImageElement : null;
      },

      extractSurroundingText: (img: HTMLElement): string => {
        // Extract text from surrounding elements
        const parent = img.parentElement;
        if (!parent) return '';

        const textContent = parent.textContent || '';
        return textContent.replace(img.alt || '', '').trim();
      },

      identifyPageSection: (img: HTMLElement): string => {
        // Identify which section of the page the image is in
        const section = img.closest('section, header, main, article, aside, footer');
        if (section) {
          return section.tagName.toLowerCase();
        }

        return 'unknown';
      },

      identifyContentType: (img: HTMLElement): 'article' | 'product' | 'gallery' | 'profile' | 'decoration' => {
        // Identify the content type based on context and attributes
        const classList = Array.from(img.classList);

        if (classList.some(c => c.includes('product'))) return 'product';
        if (classList.some(c => c.includes('gallery'))) return 'gallery';
        if (classList.some(c => c.includes('profile'))) return 'profile';
        if (img.closest('article')) return 'article';

        return 'decoration';
      },

      findRelatedImages: (img: HTMLElement): string[] => {
        // Find related images in the same section
        const section = img.closest('section, article, div');
        if (!section) return [];

        const relatedImages = Array.from(section.querySelectorAll('img'))
          .filter(i => i !== img)
          .map(i => i.src);

        return relatedImages;
      },

      inferUserPurpose: (img: HTMLElement): 'informational' | 'navigation' | 'decoration' | 'identification' => {
        // Infer the likely purpose of this image for users
        if (img.closest('a')) return 'navigation';
        if (img.closest('button')) return 'navigation';
        if (img.classList.contains('decoration')) return 'decoration';
        if (img.closest('header, nav')) return 'identification';

        return 'informational';
      },

      callAIGeneration: async (analysis: any, context: ImageContext): Promise<string> => {
        const store = get();
        const { config } = store;

        // Build prompt for AI
        const prompt = store.buildPrompt(analysis, context);

        // Call appropriate AI provider
        switch (config.aiProvider) {
          case 'openai':
            return store.generateWithOpenAI(prompt);
          case 'google':
            return store.generateWithGoogle(prompt);
          case 'anthropic':
            return store.generateWithAnthropic(prompt);
          default:
            return store.generateWithOpenAI(prompt);
        }
      },

      buildPrompt: (analysis: any, context: ImageContext): string => {
        let prompt = `Generate descriptive alternative text for this image in ${context.pageSection} section.\n\n`;

        prompt += `Image analysis:\n`;
        prompt += `- Objects detected: ${analysis.objects?.join(', ') || 'none'}\n`;
        prompt += `- Scene type: ${analysis.sceneType || 'unknown'}\n`;
        prompt += `- Colors: ${analysis.colors?.join(', ') || 'various'}\n`;

        if (analysis.text && analysis.text.length > 0) {
          prompt += `- Text in image: ${analysis.text.join(', ')}\n`;
        }

        if (context.surroundingText) {
          prompt += `\nContext: ${context.surroundingText}\n`;
        }

        prompt += `\nRequirements:\n`;
        prompt += `- Length: 10-250 characters\n`;
        prompt += `- Be descriptive but concise\n`;
        prompt += `- Include important visual details\n`;
        prompt += `- Consider the context and purpose\n`;
        prompt += `- Write in Polish\n`;
        prompt += `- Don't start with "Image of" or similar phrases\n`;
        prompt += `- End with a period\n\n`;

        prompt += `Alternative text:`;

        return prompt;
      },

      generateWithOpenAI: async (prompt: string): Promise<string> => {
        // Simulate OpenAI API call
        // In production, would make actual API call
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve('Profesjonalne zabiegi kosmetyczne w luksusowym salonie w Warszawie.');
          }, 1000);
        });
      },

      generateWithGoogle: async (prompt: string): Promise<string> => {
        // Simulate Google Vision AI call
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve('Eleganckie wnętrze salonu beauty z profesjonalnym sprzętem.');
          }, 1000);
        });
      },

      generateWithAnthropic: async (prompt: string): Promise<string> => {
        // Simulate Anthropic Claude call
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve('Nowoczesne centrum beauty i fitness w sercu Warszawy.');
          }, 1000);
        });
      },

      analyzeWithOpenAI: async (imageUrl: string): Promise<any> => {
        // Simulate OpenAI Vision analysis
        return {
          objects: ['person', 'makeup', 'brush'],
          sceneType: 'beauty salon',
          colors: ['white', 'gold', 'pink'],
          text: [],
          confidence: 0.85,
          emotions: ['professional', 'calm'],
          style: 'modern luxury'
        };
      },

      analyzeWithGoogle: async (imageUrl: string): Promise<any> => {
        // Simulate Google Vision analysis
        return {
          objects: ['cosmetics', 'treatment', 'spa'],
          sceneType: 'cosmetic treatment room',
          colors: ['beige', 'brown', 'cream'],
          text: [],
          confidence: 0.82,
          style: 'minimalist'
        };
      },

      analyzeWithAnthropic: async (imageUrl: string): Promise<any> => {
        // Simulate Anthropic analysis
        return {
          objects: ['therapist', 'client', 'treatment'],
          sceneType: 'beauty treatment',
          colors: ['soft white', 'gold accents'],
          text: [],
          confidence: 0.88,
          emotions: ['relaxed', 'professional'],
          style: 'luxury spa'
        };
      },

      analyzeWithLocalModel: async (imageUrl: string): Promise<any> => {
        // Simulate local AI model analysis
        return {
          objects: ['treatment', 'equipment', 'room'],
          sceneType: 'treatment room',
          colors: ['neutral', 'professional'],
          text: [],
          confidence: 0.75
        };
      },

      containsMeaningfulContent: (text: string): boolean => {
        const meaningfulWords = ['zabieg', 'kosmetyczny', 'pielęgnacja', 'salon', 'terapia', 'leczenie', 'pielęgnacja', 'profesjonalny'];
        return meaningfulWords.some(word => text.toLowerCase().includes(word));
      },

      hasRedundantPhrases: (text: string): boolean => {
        const redundantPatterns = /^(image of|picture of|photo of|grafika|zdjęcie obraz)/i;
        return redundantPatterns.test(text);
      },

      assessReadability: (text: string): 'poor' | 'fair' | 'good' | 'excellent' => {
        const words = text.split(' ').length;
        const sentences = text.split(/[.!?]/).length - 1;

        if (words < 5 || words > 30) return 'poor';
        if (words < 10 || words > 25) return 'fair';
        if (words < 15 || words > 22) return 'good';
        return 'excellent';
      },

      calculateCompleteness: (altText: string, imageUrl: string): number => {
        let score = 0;

        // Has content (30%)
        if (altText.trim().length > 0) score += 30;

        // Describes subject (30%)
        if (store.containsMeaningfulContent(altText)) score += 30;

        // Appropriate length (20%)
        if (altText.length >= 10 && altText.length <= 250) score += 20;

        // Includes context (20%)
        const context = store.getContextualData(imageUrl);
        if (store.isContextRelevant(altText, context)) score += 20;

        return Math.min(100, score);
      },

      isContextRelevant: (altText: string, context: ImageContext): boolean => {
        // Simple relevance check based on context
        if (context.pageSection === 'header' && altText.includes('logo')) return true;
        if (context.pageSection === 'main' && context.contentType === 'product') return true;
        if (context.contentType === 'gallery' && altText.includes('galeria')) return true;

        return false;
      },

      chunkArray: <T>(array: T[], size: number): T[][] => {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
          chunks.push(array.slice(i, i + size));
        }
        return chunks;
      }
    }),
    {
      name: 'ai-alt-text-store',
      partialize: (state) => ({
        config: state.config,
        completedGenerations: state.completedGenerations.slice(-100), // Keep last 100
      }),
    }
  )
);

// React hook for AI alt text
export const useAIAltTextControls = () => {
  const store = useAIAltText();

  const initialize = () => {
    store.initialize();
  };

  const generateForCurrentImage = async () => {
    // Generate alt text for currently focused or selected image
    const focusedElement = document.activeElement;
    if (focusedElement && focusedElement.tagName === 'IMG') {
      return await store.generateAltText((focusedElement as HTMLImageElement).src);
    }
    throw new Error('No image is currently focused');
  };

  const generateForAllImages = async () => {
    const images = Array.from(document.querySelectorAll('img')).map(img => img.src);
    return await store.generateBatch(images);
  };

  const validateImageAltText = (imageUrl: string, altText: string) => {
    return store.validateAltText(altText, imageUrl);
  };

  const getPendingGenerations = () => {
    return store.completedGenerations.filter(g => g.status === 'pending' && !g.reviewed);
  };

  const getApprovedGenerations = () => {
    return store.completedGenerations.filter(g => g.status === 'approved');
  };

  return {
    ...store,
    initialize,
    generateForCurrentImage,
    generateForAllImages,
    validateImageAltText,
    getPendingGenerations,
    getApprovedGenerations,
  };
};

export default useAIAltText;