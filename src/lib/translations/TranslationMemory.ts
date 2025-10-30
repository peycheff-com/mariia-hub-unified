// Translation Memory - Advanced translation consistency and reuse system
// For beauty and fitness industry terminology management

import { supabase } from '@/integrations/supabase/client';

export interface TranslationMemoryEntry {
  id: string;
  sourceText: string;
  sourceLanguage: string;
  targetText: string;
  targetLanguage: string;
  context?: string;
  domain: 'beauty' | 'fitness' | 'legal' | 'marketing' | 'general';
  usageCount: number;
  qualityScore?: number;
  lastUsed: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  similarity?: number; // Calculated for search results
}

export interface TranslationSuggestion {
  text: string;
  confidence: number;
  source: 'memory' | 'terminology' | 'machine' | 'human';
  context?: string;
  domain: string;
  metadata?: Record<string, any>;
}

export interface TerminologyMatch {
  term: string;
  translation: string;
  definition?: string;
  context?: string;
  synonyms: string[];
  industry: string;
  isPremium: boolean;
  confidence: number;
}

export interface TranslationMemoryStats {
  totalEntries: number;
  entriesByDomain: Record<string, number>;
  entriesByLanguage: Record<string, number>;
  averageQualityScore: number;
  mostUsedEntries: TranslationMemoryEntry[];
  recentlyAdded: TranslationMemoryEntry[];
}

class TranslationMemory {
  private cache = new Map<string, TranslationMemoryEntry[]>();
  private cacheTimeout = new Map<string, NodeJS.Timeout>();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  // =============================================
  // SEARCH AND MATCHING
  // =============================================

  /**
   * Search translation memory for exact or similar matches
   */
  async searchMemory(
    sourceText: string,
    sourceLanguage: string,
    targetLanguage: string,
    options: {
      domain?: string;
      minQualityScore?: number;
      includeUnapproved?: boolean;
      limit?: number;
    } = {}
  ): Promise<TranslationMemoryEntry[]> {
    try {
      const cacheKey = `${sourceLanguage}-${targetLanguage}-${this.hashText(sourceText)}`;

      // Check cache first
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)!;
      }

      // Build search query
      let query = supabase
        .from('translation_memory')
        .select('*', { count: 'exact' })
        .eq('source_language', sourceLanguage)
        .eq('target_language', targetLanguage);

      if (options.domain) {
        query = query.eq('domain', options.domain);
      }

      if (options.minQualityScore) {
        query = query.gte('quality_score', options.minQualityScore);
      }

      if (!options.includeUnapproved) {
        query = query.eq('is_approved', true);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      // Perform full-text search with similarity ranking
      const { data, error } = await query
        .or(`source_text.ilike.%${sourceText}%,source_text.cs.${sourceText}`)
        .order('usage_count', { ascending: false })
        .order('quality_score', { ascending: false });

      if (error) throw error;

      // Calculate similarity scores and filter
      const entries = (data || []).map(entry => ({
        ...entry,
        similarity: this.calculateSimilarity(sourceText, entry.source_text)
      })).filter(entry => entry.similarity! > 0.3) // Only include reasonably similar matches
        .sort((a, b) => (b.similarity! - a.similarity!));

      // Cache results
      this.setCache(cacheKey, entries);

      // Update usage count for found entries
      if (entries.length > 0) {
        await this.updateUsageCount(entries.map(e => e.id));
      }

      return entries;
    } catch (error) {
      console.error('Error searching translation memory:', error);
      return [];
    }
  }

  /**
   * Get exact match from translation memory
   */
  async getExactMatch(
    sourceText: string,
    sourceLanguage: string,
    targetLanguage: string,
    context?: string
  ): Promise<TranslationMemoryEntry | null> {
    try {
      const { data, error } = await supabase
        .from('translation_memory')
        .select('*')
        .eq('source_text', sourceText)
        .eq('source_language', sourceLanguage)
        .eq('target_language', targetLanguage)
        .eq('context', context || '')
        .eq('is_approved', true)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
      }

      if (data) {
        await this.updateUsageCount([data.id]);
      }

      return data;
    } catch (error) {
      console.error('Error getting exact match:', error);
      return null;
    }
  }

  /**
   * Find similar translations using fuzzy matching
   */
  async findSimilarTranslations(
    sourceText: string,
    sourceLanguage: string,
    targetLanguage: string,
    threshold: number = 0.7
  ): Promise<TranslationMemoryEntry[]> {
    try {
      // First, get more results than we need
      const candidates = await this.searchMemory(sourceText, sourceLanguage, targetLanguage, {
        limit: 50,
        includeUnapproved: false
      });

      // Filter by similarity threshold
      return candidates.filter(entry => entry.similarity! >= threshold);
    } catch (error) {
      console.error('Error finding similar translations:', error);
      return [];
    }
  }

  // =============================================
  // TERMINOLOGY MANAGEMENT
  // =============================================

  /**
   * Search industry-specific terminology
   */
  async searchTerminology(
    term: string,
    languageCode: string,
    industry: 'beauty' | 'fitness' | 'medical' | 'general' = 'general'
  ): Promise<TerminologyMatch[]> {
    try {
      const { data, error } = await supabase
        .from('industry_terminology')
        .select(`
          *,
          standardized_translations!inner(
            standard_translation,
            usage_context,
            is_preferred
          )
        `)
        .eq('language_code', languageCode)
        .eq('industry', industry)
        .or(`term.ilike.%${term}%,synonyms.cs.{${term}}`)
        .order('difficulty_level', { ascending: true });

      if (error) throw error;

      return (data || []).map(item => ({
        term: item.term,
        translation: item.standardized_translations[0]?.standard_translation || '',
        definition: item.definition,
        context: item.context_usage,
        synonyms: item.synonyms || [],
        industry: item.industry,
        isPremium: item.is_premium,
        confidence: this.calculateTerminologyConfidence(term, item.term, item.synonyms || [])
      }));
    } catch (error) {
      console.error('Error searching terminology:', error);
      return [];
    }
  }

  /**
   * Get standardized translations for industry terms
   */
  async getStandardizedTranslations(
    term: string,
    targetLanguage: string,
    industry: string
  ): Promise<TerminologyMatch[]> {
    try {
      const { data, error } = await supabase
        .from('standardized_translations')
        .select(`
          *,
          industry_terminology!inner(
            term,
            definition,
            context_usage,
            synonyms,
            is_premium,
            industry
          )
        `)
        .eq('language_code', targetLanguage)
        .eq('industry_terminology.industry', industry)
        .eq('industry_terminology.term', term)
        .order('is_preferred', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        term: item.industry_terminology.term,
        translation: item.standard_translation,
        definition: item.industry_terminology.definition,
        context: item.usage_context,
        synonyms: item.industry_terminology.synonyms || [],
        industry: item.industry_terminology.industry,
        isPremium: item.industry_terminology.is_premium,
        confidence: item.is_preferred ? 1.0 : 0.8
      }));
    } catch (error) {
      console.error('Error getting standardized translations:', error);
      return [];
    }
  }

  /**
   * Add new terminology to the database
   */
  async addTerminology(terminology: {
    term: string;
    languageCode: string;
    industry: string;
    definition?: string;
    contextUsage?: string;
    synonyms?: string[];
    relatedTerms?: string[];
    isPremium?: boolean;
    difficultyLevel?: number;
    pronunciationGuide?: string;
    usageNotes?: string;
    culturalNotes?: string;
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('industry_terminology')
        .insert({
          term: terminology.term,
          language_code: terminology.languageCode,
          industry: terminology.industry,
          definition: terminology.definition,
          context_usage: terminology.contextUsage,
          synonyms: terminology.synonyms || [],
          related_terms: terminology.relatedTerms || [],
          is_premium: terminology.isPremium || false,
          difficulty_level: terminology.difficultyLevel || 1,
          pronunciation_guide: terminology.pronunciationGuide,
          usage_notes: terminology.usageNotes,
          cultural_notes: terminology.culturalNotes
        });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error adding terminology:', error);
      return false;
    }
  }

  // =============================================
  // TRANSLATION SUGGESTIONS
  // =============================================

  /**
   * Get translation suggestions combining memory, terminology, and AI
   */
  async getTranslationSuggestions(
    sourceText: string,
    sourceLanguage: string,
    targetLanguage: string,
    context?: string,
    domain: string = 'general'
  ): Promise<TranslationSuggestion[]> {
    const suggestions: TranslationSuggestion[] = [];

    try {
      // 1. Check for exact matches in memory
      const exactMatch = await this.getExactMatch(sourceText, sourceLanguage, targetLanguage, context);
      if (exactMatch) {
        suggestions.push({
          text: exactMatch.target_text,
          confidence: 0.95,
          source: 'memory',
          context: exactMatch.context,
          domain: exactMatch.domain,
          metadata: {
            usageCount: exactMatch.usage_count,
            qualityScore: exactMatch.quality_score,
            isApproved: exactMatch.is_approved
          }
        });
      }

      // 2. Search for similar translations in memory
      const similarMatches = await this.findSimilarTranslations(sourceText, sourceLanguage, targetLanguage, 0.8);
      similarMatches.forEach(match => {
        suggestions.push({
          text: match.target_text,
          confidence: 0.7 + (match.similarity! * 0.2),
          source: 'memory',
          context: match.context,
          domain: match.domain,
          metadata: {
            similarity: match.similarity,
            usageCount: match.usage_count,
            qualityScore: match.quality_score
          }
        });
      });

      // 3. Check for industry terminology
      if (domain === 'beauty' || domain === 'fitness') {
        const terminologyMatches = await this.searchTerminology(sourceText, targetLanguage, domain as any);
        terminologyMatches.forEach(match => {
          suggestions.push({
            text: match.translation,
            confidence: match.confidence,
            source: 'terminology',
            context: match.context,
            domain: match.industry,
            metadata: {
              isPremium: match.isPremium,
              definition: match.definition,
              synonyms: match.synonyms
            }
          });
        });
      }

      // 4. Sort by confidence and remove duplicates
      const uniqueSuggestions = this.deduplicateSuggestions(suggestions);
      return uniqueSuggestions.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Error getting translation suggestions:', error);
      return [];
    }
  }

  // =============================================
  // MEMORY MANAGEMENT
  // =============================================

  /**
   * Add or update translation memory entry
   */
  async addToMemory(entry: {
    sourceText: string;
    sourceLanguage: string;
    targetText: string;
    targetLanguage: string;
    context?: string;
    domain: string;
    qualityScore?: number;
    isApproved?: boolean;
  }): Promise<TranslationMemoryEntry | null> {
    try {
      const { data, error } = await supabase
        .from('translation_memory')
        .upsert({
          source_text: entry.sourceText,
          source_language: entry.sourceLanguage,
          target_text: entry.targetText,
          target_language: entry.targetLanguage,
          context: entry.context || '',
          domain: entry.domain,
          quality_score: entry.qualityScore,
          is_approved: entry.isApproved || false
        }, {
          onConflict: 'source_text,source_language,target_language,context'
        })
        .select()
        .single();

      if (error) throw error;

      // Clear relevant cache entries
      this.clearCacheForLanguagePair(entry.sourceLanguage, entry.targetLanguage);

      return data;
    } catch (error) {
      console.error('Error adding to translation memory:', error);
      return null;
    }
  }

  /**
   * Update usage count for memory entries
   */
  private async updateUsageCount(ids: string[]): Promise<void> {
    try {
      await supabase.rpc('increment_memory_usage', {
        entry_ids: ids
      });
    } catch (error) {
      console.error('Error updating usage count:', error);
    }
  }

  /**
   * Batch import translations to memory
   */
  async batchImportToMemory(
    entries: Array<{
      sourceText: string;
      sourceLanguage: string;
      targetText: string;
      targetLanguage: string;
      context?: string;
      domain: string;
      qualityScore?: number;
    }>
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const entry of entries) {
      try {
        await this.addToMemory(entry);
        success++;
      } catch (error) {
        console.error('Failed to import entry:', error);
        failed++;
      }
    }

    return { success, failed };
  }

  // =============================================
  // ANALYTICS AND STATISTICS
  // =============================================

  /**
   * Get translation memory statistics
   */
  async getStats(): Promise<TranslationMemoryStats> {
    try {
      // Get total entries by domain
      const { data: domainStats, error: domainError } = await supabase
        .from('translation_memory')
        .select('domain')
        .then(({ data, error }) => {
          const stats = data?.reduce((acc, item) => {
            acc[item.domain] = (acc[item.domain] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) || {};
          return { data: stats, error };
        });

      if (domainError) throw domainError;

      // Get entries by language pair
      const { data: languageStats, error: languageError } = await supabase
        .from('translation_memory')
        .select('source_language, target_language')
        .then(({ data, error }) => {
          const stats = data?.reduce((acc, item) => {
            const pair = `${item.source_language}-${item.target_language}`;
            acc[pair] = (acc[pair] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) || {};
          return { data: stats, error };
        });

      if (languageError) throw languageError;

      // Get average quality score
      const { data: qualityData, error: qualityError } = await supabase
        .from('translation_memory')
        .select('quality_score')
        .not('quality_score', 'is', null);

      if (qualityError) throw qualityError;

      const averageQualityScore = qualityData && qualityData.length > 0
        ? qualityData.reduce((sum, item) => sum + item.quality_score!, 0) / qualityData.length
        : 0;

      // Get most used entries
      const { data: mostUsed, error: mostUsedError } = await supabase
        .from('translation_memory')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(10);

      if (mostUsedError) throw mostUsedError;

      // Get recently added entries
      const { data: recentlyAdded, error: recentError } = await supabase
        .from('translation_memory')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentError) throw recentError;

      return {
        totalEntries: Object.values(domainStats).reduce((sum, count) => sum + count, 0),
        entriesByDomain: domainStats,
        entriesByLanguage: languageStats,
        averageQualityScore,
        mostUsedEntries: mostUsed || [],
        recentlyAdded: recentlyAdded || []
      };
    } catch (error) {
      console.error('Error getting translation memory stats:', error);
      return {
        totalEntries: 0,
        entriesByDomain: {},
        entriesByLanguage: {},
        averageQualityScore: 0,
        mostUsedEntries: [],
        recentlyAdded: []
      };
    }
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  /**
   * Calculate text similarity using Levenshtein distance
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const normalize = (text: string) => text.toLowerCase().trim();
    const t1 = normalize(text1);
    const t2 = normalize(text2);

    if (t1 === t2) return 1.0;
    if (t1.length === 0 || t2.length === 0) return 0.0;

    const matrix = Array(t2.length + 1).fill(null).map(() => Array(t1.length + 1).fill(null));

    for (let i = 0; i <= t1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= t2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= t2.length; j++) {
      for (let i = 1; i <= t1.length; i++) {
        const indicator = t1[i - 1] === t2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    const distance = matrix[t2.length][t1.length];
    const maxLength = Math.max(t1.length, t2.length);
    return (maxLength - distance) / maxLength;
  }

  /**
   * Calculate terminology confidence score
   */
  private calculateTerminologyConfidence(searchTerm: string, term: string, synonyms: string[]): number {
    if (term.toLowerCase() === searchTerm.toLowerCase()) return 1.0;
    if (synonyms.some(syn => syn.toLowerCase() === searchTerm.toLowerCase())) return 0.9;
    if (term.toLowerCase().includes(searchTerm.toLowerCase())) return 0.8;
    if (searchTerm.toLowerCase().includes(term.toLowerCase())) return 0.7;
    return 0.5;
  }

  /**
   * Remove duplicate suggestions
   */
  private deduplicateSuggestions(suggestions: TranslationSuggestion[]): TranslationSuggestion[] {
    const seen = new Set<string>();
    return suggestions.filter(suggestion => {
      const key = `${suggestion.text}-${suggestion.source}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Generate hash for caching
   */
  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Set cache with TTL
   */
  private setCache(key: string, data: TranslationMemoryEntry[]): void {
    // Clear existing timeout
    if (this.cacheTimeout.has(key)) {
      clearTimeout(this.cacheTimeout.get(key)!);
    }

    // Set new cache entry
    this.cache.set(key, data);

    // Set expiration timeout
    const timeout = setTimeout(() => {
      this.cache.delete(key);
      this.cacheTimeout.delete(key);
    }, this.CACHE_TTL);

    this.cacheTimeout.set(key, timeout);
  }

  /**
   * Clear cache for specific language pair
   */
  private clearCacheForLanguagePair(sourceLanguage: string, targetLanguage: string): void {
    for (const [key] of this.cache) {
      if (key.includes(`${sourceLanguage}-${targetLanguage}`)) {
        this.cache.delete(key);
        if (this.cacheTimeout.has(key)) {
          clearTimeout(this.cacheTimeout.get(key)!);
          this.cacheTimeout.delete(key);
        }
      }
    }
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.clear();
    for (const timeout of this.cacheTimeout.values()) {
      clearTimeout(timeout);
    }
    this.cacheTimeout.clear();
  }
}

// Create singleton instance
export const translationMemory = new TranslationMemory();

// Export convenience functions
export const {
  searchMemory,
  getExactMatch,
  findSimilarTranslations,
  searchTerminology,
  getStandardizedTranslations,
  addTerminology,
  getTranslationSuggestions,
  addToMemory,
  batchImportToMemory,
  getStats,
  clearAllCache
} = translationMemory;

export default translationMemory;