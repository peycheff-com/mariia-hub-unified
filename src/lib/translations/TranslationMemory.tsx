import { supabase } from '@/integrations/supabase/client';
import {
  TranslationEntry,
  TranslationMatch,
  TMSearchOptions,
  TMExportOptions,
  TMImportResult,
  TranslationMemoryStats,
  ConcordanceSearchOptions,
  ConcordanceResult,
  TMXImportOptions
} from '@/types/translation';

export class TranslationMemory {
  private cache = new Map<string, TranslationEntry[]>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Search for translations in the memory
   */
  async search(
    text: string,
    sourceLang: string,
    targetLang: string,
    options: TMSearchOptions = {}
  ): Promise<TranslationMatch[]> {
    const {
      minScore = 0.7,
      maxResults = 10,
      includeUnapproved = false,
      category
    } = options;

    // Check cache first
    const cacheKey = `${sourceLang}-${targetLang}-${text}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return cached
        .filter(entry => includeUnapproved || entry.approved)
        .filter(entry => !category || entry.category === category)
        .slice(0, maxResults)
        .map(entry => ({
          text: entry.target_text,
          score: this.calculateSimilarity(text, entry.source_text),
          entry
        }))
        .filter(match => match.score >= minScore)
        .sort((a, b) => b.score - a.score);
    }

    try {
      let query = supabase
        .from('translation_memory')
        .select('*')
        .eq('source_lang', sourceLang)
        .eq('target_lang', targetLang);

      if (!includeUnapproved) {
        query = query.eq('approved', true);
      }

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;

      const matches: TranslationMatch[] = (data || [])
        .map(entry => ({
          text: entry.target_text,
          score: this.calculateSimilarity(text, entry.source_text),
          entry
        }))
        .filter(match => match.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);

      // Cache results
      this.cache.set(cacheKey, data || []);

      return matches;
    } catch (error) {
      console.error('Error searching translation memory:', error);
      return [];
    }
  }

  /**
   * Add a new translation to memory
   */
  async add(
    sourceText: string,
    targetText: string,
    sourceLang: string,
    targetLang: string,
    metadata: Partial<TranslationEntry> = {}
  ): Promise<TranslationEntry | null> {
    try {
      // Check if exact translation already exists
      const existing = await this.findExact(sourceText, targetText, sourceLang, targetLang);
      if (existing) {
        // Update usage count
        await this.updateUsage(existing.id);
        return existing;
      }

      const { data, error } = await supabase
        .from('translation_memory')
        .insert({
          source_text: sourceText,
          target_text: targetText,
          source_lang: sourceLang,
          target_lang: targetLang,
          usage_count: 1,
          last_used: new Date().toISOString(),
          ...metadata
        })
        .select()
        .single();

      if (error) throw error;

      // Clear cache
      this.clearCache();

      return data;
    } catch (error) {
      console.error('Error adding translation:', error);
      return null;
    }
  }

  /**
   * Update an existing translation
   */
  async update(
    id: string,
    updates: Partial<TranslationEntry>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('translation_memory')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Clear cache
      this.clearCache();

      return true;
    } catch (error) {
      console.error('Error updating translation:', error);
      return false;
    }
  }

  /**
   * Approve a translation
   */
  async approve(id: string, approvedBy?: string): Promise<boolean> {
    return this.update(id, {
      approved: true,
      created_by: approvedBy
    });
  }

  /**
   * Update usage statistics
   */
  async updateUsage(id: string): Promise<void> {
    try {
      await supabase.rpc('increment_translation_usage', { translation_id: id });
    } catch (error) {
      console.error('Error updating usage:', error);
    }
  }

  /**
   * Get translation statistics
   */
  async getStats(): Promise<{
    total: number;
    approved: number;
    pending: number;
    byLanguage: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from('translation_memory')
        .select('*');

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        approved: data?.filter(t => t.approved).length || 0,
        pending: data?.filter(t => !t.approved).length || 0,
        byLanguage: {} as Record<string, number>,
        byCategory: {} as Record<string, number>
      };

      // Calculate language pairs
      data?.forEach(entry => {
        const pair = `${entry.source_lang}-${entry.target_lang}`;
        stats.byLanguage[pair] = (stats.byLanguage[pair] || 0) + 1;

        if (entry.category) {
          stats.byCategory[entry.category] = (stats.byCategory[entry.category] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        total: 0,
        approved: 0,
        pending: 0,
        byLanguage: {},
        byCategory: {}
      };
    }
  }

  /**
   * Export translations in various formats
   */
  async export(options: TMExportOptions = {}): Promise<{ data: string; filename: string }> {
    const {
      format = 'json',
      sourceLang,
      targetLang,
      category,
      includeUnapproved = false,
      dateRange
    } = options;

    try {
      let query = supabase.from('translation_memory').select('*');

      if (sourceLang) {
        query = query.eq('source_lang', sourceLang);
      }

      if (targetLang) {
        query = query.eq('target_lang', targetLang);
      }

      if (category) {
        query = query.eq('category', category);
      }

      if (!includeUnapproved) {
        query = query.eq('approved', true);
      }

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);
      }

      const { data, error } = await query;
      if (error) throw error;

      const translations = data || [];
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `translations-${timestamp}`;

      switch (format) {
        case 'json':
          return {
            data: JSON.stringify(translations, null, 2),
            filename: `${filename}.json`
          };

        case 'csv':
          const headers = ['source_text', 'target_text', 'source_lang', 'target_lang', 'category', 'approved', 'quality_score', 'usage_count'];
          const rows = translations.map(t => [
            t.source_text.replace(/"/g, '""'),
            t.target_text.replace(/"/g, '""'),
            t.source_lang,
            t.target_lang,
            t.category || '',
            t.approved ? 'Yes' : 'No',
            t.quality_score || '',
            t.usage_count
          ]);
          const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
          return {
            data: csvContent,
            filename: `${filename}.csv`
          };

        case 'xliff':
          return {
            data: this.generateXLIFF(translations),
            filename: `${filename}.xliff`
          };

        case 'tmx':
          return {
            data: this.generateTMX(translations),
            filename: `${filename}.tmx`
          };

        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Error exporting translations:', error);
      throw error;
    }
  }

  /**
   * Import translations from various formats
   */
  async import(
    content: string,
    format: 'json' | 'csv' | 'xliff' | 'tmx',
    options: TMXImportOptions & { skipExisting?: boolean } = {}
  ): Promise<TMImportResult> {
    const { skipExisting = true } = options;
    let translations: Omit<TranslationEntry, 'id' | 'created_at' | 'updated_at'>[] = [];
    const errors: string[] = [];

    try {
      switch (format) {
        case 'json':
          translations = JSON.parse(content);
          break;

        case 'csv':
          translations = this.parseCSV(content);
          break;

        case 'xliff':
          translations = this.parseXLIFF(content, options);
          break;

        case 'tmx':
          translations = this.parseTMX(content, options);
          break;

        default:
          throw new Error(`Unsupported import format: ${format}`);
      }

      let success = 0;
      let failed = 0;
      let duplicates = 0;

      for (const translation of translations) {
        try {
          if (skipExisting) {
            const existing = await this.findExact(
              translation.source_text,
              translation.target_text,
              translation.source_lang,
              translation.target_lang
            );

            if (existing) {
              duplicates++;
              continue;
            }
          }

          await supabase.from('translation_memory').insert(translation);
          success++;
        } catch (error) {
          console.error('Error importing translation:', error);
          failed++;
          errors.push(`Failed to import: ${translation.source_text.substring(0, 50)}...`);
        }
      }

      this.clearCache();
      return { success, failed, duplicates, errors };
    } catch (error) {
      console.error('Error parsing import content:', error);
      throw error;
    }
  }

  /**
   * Find exact translation match
   */
  private async findExact(
    sourceText: string,
    targetText: string,
    sourceLang: string,
    targetLang: string
  ): Promise<TranslationEntry | null> {
    try {
      const { data, error } = await supabase
        .from('translation_memory')
        .select('*')
        .eq('source_text', sourceText)
        .eq('target_text', targetText)
        .eq('source_lang', sourceLang)
        .eq('target_lang', targetLang)
        .single();

      return data;
    } catch {
      return null;
    }
  }

  /**
   * Calculate similarity between two texts
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Generate TMX format
   */
  private generateTMX(translations: TranslationEntry[]): string {
    const now = new Date().toISOString();
    return `<?xml version="1.0" encoding="UTF-8"?>
<tmx version="1.4">
  <header
    creationtool="Mariia Hub Translation Memory"
    creationtoolversion="1.0"
    datatype="plaintext"
    segtype="sentence"
    adminlang="en"
    srclang="${translations[0]?.source_lang || 'en'}"
    o-tmf="unknown"
    creationdate="${now}"
    changedate="${now}"
  />
  <body>
${translations.map(t => `    <tu tuid="${t.id}">
      <tuv xml:lang="${t.source_lang}">
        <seg>${this.escapeXML(t.source_text)}</seg>
      </tuv>
      <tuv xml:lang="${t.target_lang}">
        <seg>${this.escapeXML(t.target_text)}</seg>
      </tuv>
      ${t.category ? `<prop type="category">${this.escapeXML(t.category)}</prop>` : ''}
      ${t.context ? `<prop type="context">${this.escapeXML(t.context)}</prop>` : ''}
      ${t.quality_score ? `<prop type="quality">${t.quality_score}</prop>` : ''}
    </tu>`).join('\n')}
  </body>
</tmx>`;
  }

  /**
   * Generate XLIFF format
   */
  private generateXLIFF(translations: TranslationEntry[]): string {
    const now = new Date().toISOString();
    const languagePairs = [...new Set(translations.map(t => `${t.source_lang}-${t.target_lang}`))];

    return languagePairs.map(pair => {
      const [sourceLang, targetLang] = pair.split('-');
      const pairTranslations = translations.filter(t =>
        t.source_lang === sourceLang && t.target_lang === targetLang
      );

      return `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2">
  <file
    source-language="${sourceLang}"
    target-language="${targetLang}"
    datatype="plaintext"
    original="not.available"
    product-name="Mariia Hub"
    product-version="1.0"
    build-num="1"
    date="${now}"
  >
    <header>
      <tool tool-id="mariia-hub" tool-name="Mariia Hub Translation System" tool-version="1.0" />
    </header>
    <body>
${pairTranslations.map((t, index) => `      <trans-unit id="${t.id}" approved="${t.approved ? 'yes' : 'no'}">
        <source xml:lang="${sourceLang}">${this.escapeXML(t.source_text)}</source>
        <target xml:lang="${targetLang}" state="${t.approved ? 'final' : 'needs-translation'}">${this.escapeXML(t.target_text)}</target>
        ${t.category ? `<note category="context">${this.escapeXML(t.category)}</note>` : ''}
        ${t.context ? `<note category="description">${this.escapeXML(t.context)}</note>` : ''}
      </trans-unit>`).join('\n')}
    </body>
  </file>
</xliff>`;
    }).join('\n\n');
  }

  /**
   * Parse CSV content
   */
  private parseCSV(content: string): Omit<TranslationEntry, 'id' | 'created_at' | 'updated_at'>[] {
    const lines = content.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.replace(/"/g, '').trim());
      const entry: any = {};

      headers.forEach((header, index) => {
        const value = values[index] || '';
        switch (header) {
          case 'source_text':
            entry.source_text = value;
            break;
          case 'target_text':
            entry.target_text = value;
            break;
          case 'source_lang':
            entry.source_lang = value;
            break;
          case 'target_lang':
            entry.target_lang = value;
            break;
          case 'category':
            entry.category = value || undefined;
            break;
          case 'approved':
            entry.approved = value.toLowerCase() === 'yes';
            break;
          case 'quality_score':
            entry.quality_score = parseFloat(value) || undefined;
            break;
          case 'usage_count':
            entry.usage_count = parseInt(value) || 0;
            break;
        }
      });

      return entry;
    });
  }

  /**
   * Parse TMX content
   */
  private parseTMX(content: string, options: TMXImportOptions): Omit<TranslationEntry, 'id' | 'created_at' | 'updated_at'>[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/xml');
    const tus = doc.getElementsByTagName('tu');
    const translations: Omit<TranslationEntry, 'id' | 'created_at' | 'updated_at'>[] = [];

    for (let i = 0; i < tus.length; i++) {
      const tu = tus[i];
      const tuvs = tu.getElementsByTagName('tuv');
      let sourceText = '';
      let targetText = '';
      const sourceLang = options.sourceLanguage;
      const targetLang = options.targetLanguage;

      for (let j = 0; j < tuvs.length; j++) {
        const tuv = tuvs[j];
        const lang = tuv.getAttribute('xml:lang');
        const seg = tuv.getElementsByTagName('seg')[0];
        const text = seg ? seg.textContent || '' : '';

        if (lang === sourceLang) {
          sourceText = text;
        } else if (lang === targetLang) {
          targetText = text;
        }
      }

      if (sourceText && targetText) {
        const props = tu.getElementsByTagName('prop');
        let category = options.defaultCategory;
        let context: string | undefined;

        for (let k = 0; k < props.length; k++) {
          const prop = props[k];
          const type = prop.getAttribute('type');
          const value = prop.textContent || '';

          if (type === 'category') category = value;
          if (type === 'context') context = value;
        }

        translations.push({
          source_text: sourceText,
          target_text: targetText,
          source_lang: sourceLang,
          target_lang: targetLang,
          category,
          context,
          approved: options.approveOnImport || false,
          usage_count: 0,
          quality_score: 5.0
        });
      }
    }

    return translations;
  }

  /**
   * Parse XLIFF content
   */
  private parseXLIFF(content: string, options: TMXImportOptions): Omit<TranslationEntry, 'id' | 'created_at' | 'updated_at'>[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/xml');
    const transUnits = doc.getElementsByTagName('trans-unit');
    const translations: Omit<TranslationEntry, 'id' | 'created_at' | 'updated_at'>[] = [];

    for (let i = 0; i < transUnits.length; i++) {
      const unit = transUnits[i];
      const source = unit.getElementsByTagName('source')[0];
      const target = unit.getElementsByTagName('target')[0];
      const notes = unit.getElementsByTagName('note');

      if (source && target) {
        let category = options.defaultCategory;
        let context: string | undefined;

        for (let j = 0; j < notes.length; j++) {
          const note = notes[j];
          const noteCategory = note.getAttribute('category');
          const noteText = note.textContent || '';

          if (noteCategory === 'context') category = noteText;
          if (noteCategory === 'description') context = noteText;
        }

        translations.push({
          source_text: source.textContent || '',
          target_text: target.textContent || '',
          source_lang: options.sourceLanguage,
          target_lang: options.targetLanguage,
          category,
          context,
          approved: options.approveOnImport || false,
          usage_count: 0,
          quality_score: 5.0
        });
      }
    }

    return translations;
  }

  /**
   * Escape XML entities
   */
  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Search for concordance (context around terms)
   */
  async concordanceSearch(options: ConcordanceSearchOptions): Promise<ConcordanceResult[]> {
    const {
      term,
      source_lang,
      target_lang,
      context,
      max_results = 20,
      include_source = true,
      include_target = true
    } = options;

    try {
      let query = supabase
        .from('translation_memory')
        .select('*')
        .eq('approved', true);

      if (source_lang) query = query.eq('source_lang', source_lang);
      if (target_lang) query = query.eq('target_lang', target_lang);
      if (context) query = query.eq('context', context);

      const { data, error } = await query;
      if (error) throw error;

      const results: ConcordanceResult[] = [];
      const searchTerm = term.toLowerCase();

      (data || []).forEach(entry => {
        const sourceIndex = entry.source_text.toLowerCase().indexOf(searchTerm);
        const targetIndex = entry.target_text.toLowerCase().indexOf(searchTerm);

        if ((include_source && sourceIndex >= 0) || (include_target && targetIndex >= 0)) {
          results.push({
            text: sourceIndex >= 0 ? entry.source_text : entry.target_text,
            source_text: include_source ? entry.source_text : undefined,
            target_text: include_target ? entry.target_text : undefined,
            context: entry.context,
            score: sourceIndex >= 0 ? 1.0 : 0.8,
            entry
          });
        }
      });

      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, max_results);
    } catch (error) {
      console.error('Error in concordance search:', error);
      return [];
    }
  }

  /**
   * Get detailed statistics
   */
  async getDetailedStats(): Promise<TranslationMemoryStats> {
    try {
      const { data, error } = await supabase
        .from('translation_memory')
        .select('*')
        .order('usage_count', { ascending: false });

      if (error) throw error;

      const translations = data || [];
      const approved = translations.filter(t => t.approved);
      const pending = translations.filter(t => !t.approved);

      const languagePairs: Record<string, number> = {};
      const categories: Record<string, number> = {};

      translations.forEach(t => {
        const pair = `${t.source_lang}-${t.target_lang}`;
        languagePairs[pair] = (languagePairs[pair] || 0) + 1;

        if (t.category) {
          categories[t.category] = (categories[t.category] || 0) + 1;
        }
      });

      const qualityDistribution = {
        excellent: approved.filter(t => (t.quality_score || 0) >= 4.5).length,
        good: approved.filter(t => (t.quality_score || 0) >= 3.5 && (t.quality_score || 0) < 4.5).length,
        fair: approved.filter(t => (t.quality_score || 0) >= 2.5 && (t.quality_score || 0) < 3.5).length,
        poor: approved.filter(t => (t.quality_score || 0) < 2.5).length
      };

      return {
        totalEntries: translations.length,
        approvedEntries: approved.length,
        pendingEntries: pending.length,
        languagePairs,
        categories,
        topUsedEntries: translations.slice(0, 10),
        recentEntries: translations
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10),
        qualityDistribution,
        usageTrends: [] // NOTE: Usage trends functionality pending - requires time series data analysis
      };
    } catch (error) {
      console.error('Error getting detailed stats:', error);
      return {
        totalEntries: 0,
        approvedEntries: 0,
        pendingEntries: 0,
        languagePairs: {},
        categories: {},
        topUsedEntries: [],
        recentEntries: [],
        qualityDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
        usageTrends: []
      };
    }
  }

  /**
   * Clear cache
   */
  private clearCache(): void {
    this.cache.clear();
  }
}

// Create singleton instance
export const translationMemory = new TranslationMemory();