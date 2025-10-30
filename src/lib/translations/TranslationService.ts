// Translation Service - Comprehensive translation management system
// For beauty and fitness booking platform with Polish and English support

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types for translation management
export interface TranslationKey {
  id: string;
  key_name: string;
  namespace: string;
  category: string;
  context?: string;
  description?: string;
  is_html: boolean;
  has_placeholders: boolean;
  max_length?: number;
  is_sensitive: boolean;
  source: 'manual' | 'automated' | 'import' | 'api';
  priority: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface TranslationValue {
  id: string;
  key_id: string;
  language_code: string;
  value: string;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected';
  quality_score?: number;
  translator_notes?: string;
  reviewer_notes?: string;
  word_count: number;
  character_count: number;
  translation_method: 'manual' | 'ai' | 'machine' | 'hybrid';
  translator_id?: string;
  reviewer_id?: string;
  reviewed_at?: string;
  approved_at?: string;
  version: number;
  parent_version_id?: string;
  created_at: string;
  updated_at: string;
}

export interface IndustryTerminology {
  id: string;
  term: string;
  language_code: string;
  industry: 'beauty' | 'fitness' | 'medical' | 'general';
  definition?: string;
  context_usage?: string;
  synonyms: string[];
  related_terms: string[];
  is_premium: boolean;
  difficulty_level: number;
  pronunciation_guide?: string;
  etymology?: string;
  usage_notes?: string;
  cultural_notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface TranslationMemory {
  id: string;
  source_text: string;
  source_language: string;
  target_text: string;
  target_language: string;
  context?: string;
  domain: 'beauty' | 'fitness' | 'legal' | 'marketing' | 'general';
  usage_count: number;
  quality_score?: number;
  last_used: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface EmailTemplate {
  id: string;
  template_name: string;
  category: 'booking' | 'confirmation' | 'reminder' | 'cancellation' | 'marketing' | 'newsletter' | 'support';
  language_code: string;
  subject: string;
  body_html: string;
  body_text?: string;
  variables: Record<string, any>;
  is_active: boolean;
  is_default: boolean;
  from_name?: string;
  from_email?: string;
  reply_to?: string;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected';
  approved_at?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface LegalDocument {
  id: string;
  document_type: 'privacy_policy' | 'terms_of_service' | 'gdpr_compliance' | 'consent_form' | 'disclaimer' | 'refund_policy' | 'cancellation_policy' | 'data_protection';
  version: string;
  language_code: string;
  title: string;
  content: string;
  html_content?: string;
  jurisdiction: string;
  is_legally_binding: boolean;
  legal_review_status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'requires_changes';
  legal_reviewer_id?: string;
  legal_review_date?: string;
  legal_review_notes?: string;
  translation_method: 'professional' | 'machine' | 'hybrid';
  translator_qualification?: string;
  qa_passed: boolean;
  parent_document_id?: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface TranslationStats {
  totalKeys: number;
  translatedKeys: Record<string, number>;
  completionPercentage: Record<string, number>;
  averageQualityScore: Record<string, number>;
  pendingReviews: number;
  recentlyUpdated: number;
}

export interface QualityCheckResult {
  checkType: string;
  status: 'passed' | 'failed' | 'warning';
  score: number;
  details: Record<string, any>;
  autoFixable: boolean;
  message: string;
}

class TranslationService {
  // Cache for translations
  private translationCache = new Map<string, Record<string, string>>();
  private cacheTimestamp = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Real-time subscription
  private realtimeSubscription: any = null;

  // =============================================
  // TRANSLATION MANAGEMENT
  // =============================================

  /**
   * Get all translation keys with optional filtering
   */
  async getTranslationKeys(filters?: {
    namespace?: string;
    category?: string;
    priority?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: TranslationKey[]; count: number }> {
    try {
      let query = supabase
        .from('translation_keys')
        .select('*', { count: 'exact' });

      if (filters?.namespace) {
        query = query.eq('namespace', filters.namespace);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.search) {
        query = query.or(`key_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error, count } = await query.order('priority', { ascending: true });

      if (error) throw error;

      return { data: data || [], count: count || 0 };
    } catch (error) {
      console.error('Error fetching translation keys:', error);
      toast.error('Failed to load translation keys');
      return { data: [], count: 0 };
    }
  }

  /**
   * Get translation values for a specific language
   */
  async getTranslationValues(
    languageCode: string,
    filters?: {
      status?: string;
      category?: string;
      namespace?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ data: any[]; count: number }> {
    try {
      const cacheKey = `translations_${languageCode}_${JSON.stringify(filters)}`;

      // Check cache
      if (this.isCacheValid(cacheKey)) {
        const cached = this.translationCache.get(cacheKey);
        return {
          data: Object.entries(cached || {}).map(([key, value]) => ({
            key_name: key,
            value,
            language_code: languageCode
          })),
          count: Object.keys(cached || {}).length
        };
      }

      let query = supabase
        .from('approved_translations')
        .select('*', { count: 'exact' })
        .eq('language_code', languageCode);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.namespace) {
        query = query.eq('namespace', filters.namespace);
      }
      if (filters?.search) {
        query = query.or(`key_name.ilike.%${filters.search}%,value.ilike.%${filters.search}%`);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Format into key-value format for caching
      const translations: Record<string, string> = {};
      data?.forEach(item => {
        translations[item.key_name] = item.value;
      });

      // Cache the results
      this.translationCache.set(cacheKey, translations);
      this.cacheTimestamp.set(cacheKey, Date.now());

      return { data: data || [], count: count || 0 };
    } catch (error) {
      console.error('Error fetching translation values:', error);
      toast.error('Failed to load translations');
      return { data: [], count: 0 };
    }
  }

  /**
   * Create or update a translation key
   */
  async upsertTranslationKey(keyData: Partial<TranslationKey>): Promise<TranslationKey | null> {
    try {
      const { data, error } = await supabase
        .from('translation_keys')
        .upsert(keyData, { onConflict: 'key_name' })
        .select()
        .single();

      if (error) throw error;

      // Invalidate cache
      this.invalidateCache();

      toast.success('Translation key saved successfully');
      return data;
    } catch (error) {
      console.error('Error saving translation key:', error);
      toast.error('Failed to save translation key');
      return null;
    }
  }

  /**
   * Create or update a translation value
   */
  async upsertTranslationValue(valueData: Partial<TranslationValue>): Promise<TranslationValue | null> {
    try {
      const { data, error } = await supabase
        .from('translation_values')
        .upsert(valueData, { onConflict: 'key_id,language_code,version' })
        .select()
        .single();

      if (error) throw error;

      // Invalidate cache for affected language
      this.invalidateCacheForLanguage(valueData.language_code!);

      toast.success('Translation saved successfully');
      return data;
    } catch (error) {
      console.error('Error saving translation value:', error);
      toast.error('Failed to save translation');
      return null;
    }
  }

  /**
   * Get translation statistics
   */
  async getTranslationStats(): Promise<TranslationStats> {
    try {
      const { data: stats, error } = await supabase
        .from('translation_statistics')
        .select('*');

      if (error) throw error;

      // Calculate additional stats
      const { data: pendingReviews } = await supabase
        .from('translation_values')
        .select('id', { count: 'exact' })
        .eq('status', 'pending_review');

      const { data: recentlyUpdated } = await supabase
        .from('translation_values')
        .select('id', { count: 'exact' })
        .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const result: TranslationStats = {
        totalKeys: 0,
        translatedKeys: {},
        completionPercentage: {},
        averageQualityScore: {},
        pendingReviews: pendingReviews?.length || 0,
        recentlyUpdated: recentlyUpdated?.length || 0
      };

      stats?.forEach(stat => {
        if (stat.metric_type === 'translations_completed') {
          result.translatedKeys[stat.language_code] = Number(stat.metric_value);
        } else if (stat.metric_type === 'quality_score') {
          result.averageQualityScore[stat.language_code] = Number(stat.metric_value);
        }
      });

      // Calculate completion percentages
      const totalKeys = result.translatedKeys['en'] || 0;
      Object.keys(result.translatedKeys).forEach(lang => {
        result.completionPercentage[lang] = Math.round((result.translatedKeys[lang] / totalKeys) * 100);
      });

      result.totalKeys = totalKeys;

      return result;
    } catch (error) {
      console.error('Error fetching translation stats:', error);
      return {
        totalKeys: 0,
        translatedKeys: {},
        completionPercentage: {},
        averageQualityScore: {},
        pendingReviews: 0,
        recentlyUpdated: 0
      };
    }
  }

  // =============================================
  // INDUSTRY TERMINOLOGY
  // =============================================

  /**
   * Get industry-specific terminology
   */
  async getIndustryTerminology(filters?: {
    industry?: string;
    language_code?: string;
    search?: string;
    is_premium?: boolean;
  }): Promise<IndustryTerminology[]> {
    try {
      let query = supabase
        .from('industry_terminology')
        .select('*');

      if (filters?.industry) {
        query = query.eq('industry', filters.industry);
      }
      if (filters?.language_code) {
        query = query.eq('language_code', filters.language_code);
      }
      if (filters?.is_premium !== undefined) {
        query = query.eq('is_premium', filters.is_premium);
      }
      if (filters?.search) {
        query = query.or(`term.ilike.%${filters.search}%,definition.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('difficulty_level', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching industry terminology:', error);
      return [];
    }
  }

  /**
   * Add new terminology
   */
  async addTerminology(terminology: Partial<IndustryTerminology>): Promise<IndustryTerminology | null> {
    try {
      const { data, error } = await supabase
        .from('industry_terminology')
        .insert(terminology)
        .select()
        .single();

      if (error) throw error;

      toast.success('Terminology added successfully');
      return data;
    } catch (error) {
      console.error('Error adding terminology:', error);
      toast.error('Failed to add terminology');
      return null;
    }
  }

  // =============================================
  // TRANSLATION MEMORY
  // =============================================

  /**
   * Search translation memory for similar translations
   */
  async searchTranslationMemory(
    sourceText: string,
    sourceLanguage: string,
    targetLanguage: string,
    domain?: string
  ): Promise<TranslationMemory[]> {
    try {
      const { data, error } = await supabase
        .rpc('search_translation_memory', {
          p_source_text: sourceText,
          p_source_language: sourceLanguage,
          p_target_language: targetLanguage,
          p_domain: domain || null
        });

      if (error) throw error;

      // Update usage count for returned results
      if (data && data.length > 0) {
        await supabase.rpc('increment_memory_usage', {
          p_ids: data.map((item: any) => item.id)
        });
      }

      return data || [];
    } catch (error) {
      console.error('Error searching translation memory:', error);
      return [];
    }
  }

  /**
   * Add to translation memory
   */
  async addToTranslationMemory(memory: Partial<TranslationMemory>): Promise<TranslationMemory | null> {
    try {
      const { data, error } = await supabase
        .from('translation_memory')
        .upsert(memory, { onConflict: 'source_text,source_language,target_language,context' })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error adding to translation memory:', error);
      return null;
    }
  }

  // =============================================
  // EMAIL TEMPLATES
  // =============================================

  /**
   * Get email templates
   */
  async getEmailTemplates(
    languageCode: string,
    category?: string
  ): Promise<EmailTemplate[]> {
    try {
      let query = supabase
        .from('email_templates')
        .select('*')
        .eq('language_code', languageCode)
        .eq('is_active', true);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('template_name');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching email templates:', error);
      return [];
    }
  }

  /**
   * Save email template
   */
  async saveEmailTemplate(template: Partial<EmailTemplate>): Promise<EmailTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .upsert(template, { onConflict: 'template_name,language_code' })
        .select()
        .single();

      if (error) throw error;

      toast.success('Email template saved successfully');
      return data;
    } catch (error) {
      console.error('Error saving email template:', error);
      toast.error('Failed to save email template');
      return null;
    }
  }

  // =============================================
  // LEGAL DOCUMENTS
  // =============================================

  /**
   * Get legal documents
   */
  async getLegalDocuments(
    languageCode: string,
    documentType?: string,
    currentOnly: boolean = true
  ): Promise<LegalDocument[]> {
    try {
      let query = supabase
        .from('legal_documents')
        .select('*')
        .eq('language_code', languageCode);

      if (documentType) {
        query = query.eq('document_type', documentType);
      }
      if (currentOnly) {
        query = query.eq('is_current', true);
      }

      const { data, error } = await query.order('document_type');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching legal documents:', error);
      return [];
    }
  }

  /**
   * Save legal document
   */
  async saveLegalDocument(document: Partial<LegalDocument>): Promise<LegalDocument | null> {
    try {
      // If this is a new version, mark previous versions as not current
      if (document.id) {
        await supabase
          .from('legal_documents')
          .update({ is_current: false })
          .eq('document_type', document.document_type)
          .eq('language_code', document.language_code)
          .neq('id', document.id);
      }

      const { data, error } = await supabase
        .from('legal_documents')
        .upsert({ ...document, is_current: true })
        .select()
        .single();

      if (error) throw error;

      toast.success('Legal document saved successfully');
      return data;
    } catch (error) {
      console.error('Error saving legal document:', error);
      toast.error('Failed to save legal document');
      return null;
    }
  }

  // =============================================
  // QUALITY ASSURANCE
  // =============================================

  /**
   * Run quality checks on a translation
   */
  async runQualityChecks(translationValueId: string): Promise<QualityCheckResult[]> {
    try {
      const { data, error } = await supabase
        .rpc('run_translation_quality_checks', {
          p_translation_value_id: translationValueId
        });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error running quality checks:', error);
      return [];
    }
  }

  /**
   * Get quality check results for a translation
   */
  async getQualityCheckResults(translationValueId: string): Promise<QualityCheckResult[]> {
    try {
      const { data, error } = await supabase
        .from('translation_quality_checks')
        .select('*')
        .eq('translation_value_id', translationValueId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(check => ({
        checkType: check.check_type,
        status: check.status,
        score: check.score,
        details: check.details,
        autoFixable: check.auto_fixable,
        message: this.getQualityCheckMessage(check.check_type, check.status, check.details)
      })) || [];
    } catch (error) {
      console.error('Error fetching quality check results:', error);
      return [];
    }
  }

  // =============================================
  // REAL-TIME TRANSLATION UPDATES
  // =============================================

  /**
   * Subscribe to real-time translation updates
   */
  subscribeToTranslationUpdates(callback: (event: string, data: any) => void) {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
    }

    this.realtimeSubscription = supabase
      .channel('translation_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'translation_values'
        },
        (payload) => {
          callback('translation_updated', payload);
          // Invalidate cache for the affected language
          if (payload.new?.language_code) {
            this.invalidateCacheForLanguage(payload.new.language_code);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'translation_keys'
        },
        (payload) => {
          callback('key_updated', payload);
          this.invalidateCache();
        }
      )
      .subscribe();

    return this.realtimeSubscription;
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribeFromTranslationUpdates() {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
      this.realtimeSubscription = null;
    }
  }

  // =============================================
  // IMPORT/EXPORT FUNCTIONALITY
  // =============================================

  /**
   * Export translations for a language
   */
  async exportTranslations(
    languageCode: string,
    format: 'json' | 'xliff' | 'csv' = 'json'
  ): Promise<Blob | null> {
    try {
      const { data, error } = await supabase
        .rpc('export_translations', {
          p_language_code: languageCode,
          p_format: format
        });

      if (error) throw error;

      // Convert to blob
      let mimeType = 'application/json';
      if (format === 'xliff') mimeType = 'application/xliff+xml';
      if (format === 'csv') mimeType = 'text/csv';

      return new Blob([data], { type: mimeType });
    } catch (error) {
      console.error('Error exporting translations:', error);
      toast.error('Failed to export translations');
      return null;
    }
  }

  /**
   * Import translations from file
   */
  async importTranslations(
    languageCode: string,
    file: File,
    options: {
      overwriteExisting?: boolean;
      markForReview?: boolean;
      createMissingKeys?: boolean;
    } = {}
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language_code', languageCode);
      formData.append('options', JSON.stringify(options));

      const { data, error } = await supabase.functions.invoke('import-translations', {
        body: formData
      });

      if (error) throw error;

      // Invalidate cache
      this.invalidateCache();

      toast.success(`Imported ${data.imported} translations successfully`);
      return data;
    } catch (error) {
      console.error('Error importing translations:', error);
      toast.error('Failed to import translations');
      return { imported: 0, skipped: 0, errors: [error.message] };
    }
  }

  // =============================================
  // CACHE MANAGEMENT
  // =============================================

  private isCacheValid(cacheKey: string): boolean {
    const timestamp = this.cacheTimestamp.get(cacheKey);
    return timestamp !== undefined && (Date.now() - timestamp) < this.CACHE_TTL;
  }

  private invalidateCache() {
    this.translationCache.clear();
    this.cacheTimestamp.clear();
  }

  private invalidateCacheForLanguage(languageCode: string) {
    for (const [key] of this.translationCache) {
      if (key.includes(`_${languageCode}_`)) {
        this.translationCache.delete(key);
        this.cacheTimestamp.delete(key);
      }
    }
  }

  private getQualityCheckMessage(checkType: string, status: string, details: any): string {
    const messages = {
      completeness: {
        passed: 'Translation is complete',
        failed: 'Translation is incomplete',
        warning: 'Translation may be incomplete'
      },
      grammar: {
        passed: 'Grammar check passed',
        failed: 'Grammar issues detected',
        warning: 'Potential grammar issues'
      },
      terminology: {
        passed: 'Industry terminology used correctly',
        failed: 'Incorrect terminology detected',
        warning: 'Terminology could be improved'
      },
      length: {
        passed: 'Length constraints satisfied',
        failed: 'Translation exceeds length limit',
        warning: 'Translation is approaching length limit'
      },
      placeholders: {
        passed: 'All placeholders are present',
        failed: 'Missing or incorrect placeholders',
        warning: 'Placeholder format issues detected'
      }
    };

    return messages[checkType as keyof typeof messages]?.[status as keyof typeof messages[keyof typeof messages]] ||
           `Quality check: ${checkType} - ${status}`;
  }
}

// Create singleton instance
export const translationService = new TranslationService();

// Export convenience functions
export const {
  getTranslationKeys,
  getTranslationValues,
  upsertTranslationKey,
  upsertTranslationValue,
  getTranslationStats,
  getIndustryTerminology,
  addTerminology,
  searchTranslationMemory,
  addToTranslationMemory,
  getEmailTemplates,
  saveEmailTemplate,
  getLegalDocuments,
  saveLegalDocument,
  runQualityChecks,
  getQualityCheckResults,
  subscribeToTranslationUpdates,
  unsubscribeFromTranslationUpdates,
  exportTranslations,
  importTranslations
} = translationService;

export default translationService;