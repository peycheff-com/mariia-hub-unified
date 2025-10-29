import { supabase } from '@/integrations/supabase/client';
import {
  TranslationEntry,
  TranslationMatch,
  TranslationAutomationRule,
  TMImportResult
} from '@/types/translation';

import { translationMemory } from './TranslationMemory';
import { translationWorkflow } from './TranslationWorkflow';

export interface UntranslatedContent {
  id: string;
  type: 'ui_text' | 'content' | 'service' | 'blog_post' | 'email_template' | 'api_response';
  sourceText: string;
  context: string;
  location: string;
  sourceLang: string;
  targetLangs: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  detectedAt: string;
  tmMatches?: TranslationMatch[];
  suggestions?: string[];
}

export interface TranslationConsistencyIssue {
  id: string;
  type: 'terminology' | 'style' | 'formatting' | 'inconsistency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  sourceText: string;
  conflictingTranslations: {
    text: string;
    location: string;
    id: string;
  }[];
  description: string;
  suggestion: string;
  detectedAt: string;
}

export class TranslationAutomation {
  /**
   * Scan for untranslated content across the application
   */
  async scanForUntranslatedContent(
    sourceLang: string = 'en',
    targetLangs: string[] = ['pl', 'ua', 'ru']
  ): Promise<UntranslatedContent[]> {
    const untranslatedContent: UntranslatedContent[] = [];

    try {
      // 1. Scan i18n locale files for missing translations
      await this.scanI18nFiles(sourceLang, targetLangs, untranslatedContent);

      // 2. Scan database content for missing translations
      await this.scanDatabaseContent(sourceLang, targetLangs, untranslatedContent);

      // 3. Scan service descriptions
      await this.scanServicesContent(sourceLang, targetLangs, untranslatedContent);

      // 4. Scan blog posts
      await this.scanBlogContent(sourceLang, targetLangs, untranslatedContent);

      // 5. Find TM matches for each detected untranslated content
      for (const item of untranslatedContent) {
        item.tmMatches = await this.findTMMatches(item.sourceText, sourceLang, item.targetLangs);
        item.suggestions = this.generateSuggestions(item);
      }

      return untranslatedContent.sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    } catch (error) {
      console.error('Error scanning for untranslated content:', error);
      return [];
    }
  }

  /**
   * Check translation consistency issues
   */
  async checkTranslationConsistency(
    sourceLang: string = 'en',
    targetLangs: string[] = ['pl', 'ua', 'ru']
  ): Promise<TranslationConsistencyIssue[]> {
    const issues: TranslationConsistencyIssue[] = [];

    try {
      // 1. Check for inconsistent terminology
      await this.checkTerminologyConsistency(sourceLang, targetLangs, issues);

      // 2. Check for style inconsistencies
      await this.checkStyleConsistency(sourceLang, targetLangs, issues);

      // 3. Check for formatting inconsistencies
      await this.checkFormattingConsistency(sourceLang, targetLangs, issues);

      return issues.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
    } catch (error) {
      console.error('Error checking translation consistency:', error);
      return [];
    }
  }

  /**
   * Auto-suggest translations using AI or pattern matching
   */
  async autoSuggestTranslations(
    untranslatedContent: UntranslatedContent[],
    useAI: boolean = false
  ): Promise<{ [key: string]: string[] }> {
    const suggestions: { [key: string]: string[] } = {};

    for (const item of untranslatedContent) {
      const itemSuggestions: string[] = [];

      // 1. Use TM matches
      if (item.tmMatches && item.tmMatches.length > 0) {
        item.tmMatches.forEach(match => {
          if (match.score >= 0.8) {
            itemSuggestions.push(match.text);
          }
        });
      }

      // 2. Use pattern matching for common phrases
      const patternSuggestions = this.getPatternBasedSuggestions(item.sourceText, item.targetLangs);
      itemSuggestions.push(...patternSuggestions);

      // 3. Use AI if enabled (placeholder for future AI integration)
      if (useAI) {
        // const aiSuggestions = await this.getAISuggestions(item.sourceText, item.sourceLang, item.targetLangs);
        // itemSuggestions.push(...aiSuggestions);
      }

      suggestions[item.id] = [...new Set(itemSuggestions)]; // Remove duplicates
    }

    return suggestions;
  }

  /**
   * Create translation tasks from detected content
   */
  async createTasksFromUntranslatedContent(
    projectId: string,
    untranslatedContent: UntranslatedContent[]
  ): Promise<number> {
    let createdTasks = 0;

    try {
      const tasks = untranslatedContent.map(item => ({
        source_text: item.sourceText,
        context: item.context,
        category: this.categorizeContent(item),
        priority: item.priority,
        notes: `Auto-detected from ${item.type}: ${item.location}`
      }));

      const result = await translationWorkflow.addTasks(projectId, tasks);
      createdTasks = result.created;
    } catch (error) {
      console.error('Error creating tasks from untranslated content:', error);
    }

    return createdTasks;
  }

  /**
   * Apply automation rules to translations
   */
  async applyAutomationRules(
    rules: TranslationAutomationRule[],
    sourceText: string,
    sourceLang: string,
    targetLang: string
  ): Promise<{
    shouldApprove: boolean;
    category?: string;
    translator?: string;
    priority?: string;
  }> {
    const result = {
      shouldApprove: false,
      category: undefined as string | undefined,
      translator: undefined as string | undefined,
      priority: undefined as string | undefined
    };

    for (const rule of rules) {
      if (this.matchesRule(rule, sourceText, sourceLang, targetLang)) {
        if (rule.actions.auto_approve && result.shouldApprove !== false) {
          result.shouldApprove = true;
        }
        if (rule.actions.category_assignment) {
          result.category = rule.actions.category_assignment;
        }
        if (rule.actions.translator_assignment) {
          result.translator = rule.actions.translator_assignment;
        }
        if (rule.actions.priority_level) {
          result.priority = rule.actions.priority_level;
        }
      }
    }

    return result;
  }

  /**
   * Import translations from detected content
   */
  async importDetectedTranslations(
    untranslatedContent: UntranslatedContent[],
    translations: { [key: string]: string }
  ): Promise<TMImportResult> {
    const translationsToImport: any[] = [];
    const errors: string[] = [];

    for (const item of untranslatedContent) {
      const translation = translations[item.id];
      if (translation) {
        translationsToImport.push({
          source_text: item.sourceText,
          target_text: translation,
          source_lang: item.sourceLang,
          target_lang: item.targetLangs[0], // Simplified - should handle multiple
          context: item.context,
          category: this.categorizeContent(item),
          approved: false,
          usage_count: 0,
          quality_score: 4.0 // Default score for detected translations
        });
      }
    }

    if (translationsToImport.length > 0) {
      return await translationMemory.import(translationsToImport, 'json', {
        skipExisting: true
      });
    }

    return { success: 0, failed: 0, duplicates: 0, errors };
  }

  // Private helper methods

  private async scanI18nFiles(
    sourceLang: string,
    targetLangs: string[],
    results: UntranslatedContent[]
  ): Promise<void> {
    // This would scan the actual i18n locale files
    // For now, return placeholder implementation
    const commonPhrases = [
      'Book Now',
      'Learn More',
      'Contact Us',
      'Our Services',
      'About Us',
      'Privacy Policy',
      'Terms of Service'
    ];

    for (const phrase of commonPhrases) {
      for (const targetLang of targetLangs) {
        // Check if translation exists (placeholder logic)
        const translationExists = false; // Would check actual files

        if (!translationExists) {
          results.push({
            id: `i18n-${phrase}-${targetLang}`,
            type: 'ui_text',
            sourceText: phrase,
            context: 'UI Interface',
            location: `i18n/locales/${targetLang}.json`,
            sourceLang,
            targetLangs: [targetLang],
            priority: phrase.includes('Book') ? 'high' : 'medium',
            detectedAt: new Date().toISOString()
          });
        }
      }
    }
  }

  private async scanDatabaseContent(
    sourceLang: string,
    targetLangs: string[],
    results: UntranslatedContent[]
  ): Promise<void> {
    try {
      // Scan services table
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id, title, description, category')
        .eq('lang', sourceLang);

      if (!servicesError && services) {
        for (const service of services) {
          for (const targetLang of targetLangs) {
            // Check if translation exists
            const { data: translation, error: translationError } = await supabase
              .from('services')
              .select('id')
              .eq('original_id', service.id)
              .eq('lang', targetLang)
              .single();

            if (translationError || !translation) {
              results.push({
                id: `service-${service.id}-${targetLang}`,
                type: 'service',
                sourceText: `${service.title}: ${service.description}`,
                context: `Service: ${service.category}`,
                location: `services table, ID: ${service.id}`,
                sourceLang,
                targetLangs: [targetLang],
                priority: 'high',
                detectedAt: new Date().toISOString()
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error scanning database content:', error);
    }
  }

  private async scanServicesContent(
    sourceLang: string,
    targetLangs: string[],
    results: UntranslatedContent[]
  ): Promise<void> {
    // Similar to scanDatabaseContent but more focused on services
    // Implementation would scan service_content table
  }

  private async scanBlogContent(
    sourceLang: string,
    targetLangs: string[],
    results: UntranslatedContent[]
  ): Promise<void> {
    try {
      const { data: blogPosts, error: blogError } = await supabase
        .from('blog_posts')
        .select('id, title, excerpt, content')
        .eq('lang', sourceLang)
        .limit(10);

      if (!blogError && blogPosts) {
        for (const post of blogPosts) {
          for (const targetLang of targetLangs) {
            results.push({
              id: `blog-${post.id}-${targetLang}`,
              type: 'blog_post',
              sourceText: `${post.title}: ${post.excerpt}`,
              context: 'Blog Content',
              location: `blog_posts table, ID: ${post.id}`,
              sourceLang,
              targetLangs: [targetLang],
              priority: 'medium',
              detectedAt: new Date().toISOString()
            });
          }
        }
      }
    } catch (error) {
      console.error('Error scanning blog content:', error);
    }
  }

  private async findTMMatches(
    sourceText: string,
    sourceLang: string,
    targetLangs: string[]
  ): Promise<TranslationMatch[]> {
    const allMatches: TranslationMatch[] = [];

    for (const targetLang of targetLangs) {
      try {
        const matches = await translationMemory.search(sourceText, sourceLang, targetLang, {
          minScore: 0.6,
          maxResults: 3
        });
        allMatches.push(...matches);
      } catch (error) {
        console.error('Error finding TM matches:', error);
      }
    }

    return allMatches.sort((a, b) => b.score - a.score).slice(0, 3);
  }

  private generateSuggestions(item: UntranslatedContent): string[] {
    const suggestions: string[] = [];

    // Add category-based suggestions
    if (item.context.includes('Beauty')) {
      suggestions.push('Consider using established beauty industry terminology');
    }
    if (item.context.includes('Fitness')) {
      suggestions.push('Use fitness industry standard terms');
    }

    // Add length-based suggestions
    if (item.sourceText.length > 100) {
      suggestions.push('Long text - consider breaking into segments');
    }

    // Add format suggestions
    if (item.sourceText.includes('{') && item.sourceText.includes('}')) {
      suggestions.push('Contains variables - ensure proper formatting');
    }

    return suggestions;
  }

  private categorizeContent(item: UntranslatedContent): string {
    if (item.context.includes('Beauty')) return 'beauty';
    if (item.context.includes('Fitness')) return 'fitness';
    if (item.type === 'ui_text') return 'ui';
    if (item.type === 'blog_post') return 'content';
    return 'general';
  }

  private matchesRule(
    rule: TranslationAutomationRule,
    sourceText: string,
    sourceLang: string,
    targetLang: string
  ): boolean {
    // Check source pattern
    if (rule.conditions.source_pattern) {
      const pattern = new RegExp(rule.conditions.source_pattern, 'i');
      if (!pattern.test(sourceText)) return false;
    }

    // Check target pattern
    if (rule.conditions.target_pattern) {
      // This would check against potential target text
      // For now, just check if pattern exists
    }

    // Check category
    if (rule.conditions.category) {
      // This would require category information
    }

    // Check confidence score
    if (rule.conditions.confidence_min) {
      // This would require confidence calculation
    }

    return true;
  }

  private getPatternBasedSuggestions(
    sourceText: string,
    targetLangs: string[]
  ): string[] {
    const suggestions: string[] = [];

    // Common phrase patterns
    const patterns: { [key: string]: { [key: string]: string } } = {
      'Book Now': { pl: 'Zarezerwuj teraz', ua: 'Забронювати зараз', ru: 'Забронировать сейчас' },
      'Learn More': { pl: 'Dowiedz się więcej', ua: 'Дізнатися більше', ru: 'Узнать больше' },
      'Contact Us': { pl: 'Skontaktuj się z nami', ua: "Зв'яжіться з нами", ru: 'Свяжитесь с нами' },
      'Privacy Policy': { pl: 'Polityka prywatności', ua: 'Політика конфіденційності', ru: 'Политика конфиденциальности' },
      'Terms of Service': { pl: 'Regulamin', ua: 'Умови використання', ru: 'Условия использования' }
    };

    for (const [sourcePhrase, translations] of Object.entries(patterns)) {
      if (sourceText.toLowerCase().includes(sourcePhrase.toLowerCase())) {
        for (const targetLang of targetLangs) {
          if (translations[targetLang]) {
            suggestions.push(translations[targetLang]);
          }
        }
      }
    }

    return suggestions;
  }

  private async checkTerminologyConsistency(
    sourceLang: string,
    targetLangs: string[],
    issues: TranslationConsistencyIssue[]
  ): Promise<void> {
    // Implementation would check for inconsistent terminology
    // across different translations of the same source term
  }

  private async checkStyleConsistency(
    sourceLang: string,
    targetLangs: string[],
    issues: TranslationConsistencyIssue[]
  ): Promise<void> {
    // Implementation would check for style inconsistencies
    // (formal vs informal tone, punctuation, etc.)
  }

  private async checkFormattingConsistency(
    sourceLang: string,
    targetLangs: string[],
    issues: TranslationConsistencyIssue[]
  ): Promise<void> {
    // Implementation would check for formatting inconsistencies
    // (date formats, number formats, etc.)
  }
}

// Create singleton instance
export const translationAutomation = new TranslationAutomation();