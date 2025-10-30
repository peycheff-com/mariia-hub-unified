/**
 * Advanced Sentiment Analysis Engine
 * Natural language processing for feedback text with emotion detection
 */

import { supabase } from '@/integrations/supabase/client';
import {
  SentimentAnalysis,
  SentimentSourceType,
  SentimentLabel,
  FeedbackTheme,
  FeedbackThemeLink,
  FeedbackType,
  EmotionData,
  EntityData
} from '@/types/feedback';

export class SentimentAnalysisService {
  private static instance: SentimentAnalysisService;
  private emotionKeywords: Record<string, string[]> = {
    joy: ['happy', 'joyful', 'delighted', 'pleased', 'satisfied', 'wonderful', 'fantastic', 'amazing', 'excellent', 'great', 'love', 'perfect', 'brilliant', 'szczęśliwy', 'radość', 'zadowolony', 'wspaniały', 'fantastyczny', 'doskonały', 'kocham', 'idealny', 'genialny'],
    anger: ['angry', 'furious', 'mad', 'annoyed', 'frustrated', 'disappointed', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'wściekły', 'zirytowany', 'frustrowany', 'rozczarowany', 'okropny', 'straszny', 'najgorszy', 'nienawidzę'],
    fear: ['scared', 'afraid', 'worried', 'anxious', 'concerned', 'nervous', 'fearful', ' terrified', 'panicked', 'przerażony', 'zmartwiony', 'niespokojny', 'nerwowy', 'spanikowany'],
    sadness: ['sad', 'unhappy', 'depressed', 'disappointed', 'let down', 'bummed', 'down', 'miserable', 'smutny', 'nieszczęśliwy', 'rozczarowany', 'strapiony', 'nieszczęśliwy'],
    surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'stunned', 'bewildered', 'zaskoczony', 'szokowany', 'zdumiony', 'zwiedziony'],
    disgust: ['disgusted', 'revolted', 'repulsed', 'sickened', 'nauseated', 'obrzydzony', 'zniesmaczony', 'odrażający']
  };

  private luxuryKeywords = {
    positive: ['luxury', 'premium', 'elegant', 'sophisticated', 'exclusive', 'high-end', 'upscale', 'refined', 'classy', 'bougie', 'luksusowy', 'premium', 'elegancki', 'wyrafinowany', 'ekskluzywny', 'doskonały', 'klasyczny'],
    negative: ['cheap', 'tacky', 'low-quality', 'basic', 'ordinary', 'common', 'subpar', 'tani', 'kiczowaty', 'niskiej jakości', 'podstawowy', 'zwykły', 'słaby']
  };

  private serviceQualityKeywords = {
    positive: ['professional', 'expert', 'skilled', 'knowledgeable', 'experienced', 'master', 'specialist', 'profesjonalny', 'ekspert', 'biegły', 'specjalista', 'mistrzowski'],
    negative: ['unprofessional', 'inexperienced', 'amateur', 'unskilled', 'novice', 'beginner', 'nieprofesjonalny', 'niezdarny', 'amatorski', 'niedoświadczony']
  };

  private cleanlinessKeywords = {
    positive: ['clean', 'spotless', 'hygienic', 'sanitary', 'tidy', 'neat', 'pristine', 'immaculate', 'czysty', 'bez zarzutu', 'higieniczny', 'porządkowny', 'nieskazitelny'],
    negative: ['dirty', 'messy', 'unclean', 'filthy', 'grimy', 'unsanitary', 'brudny', 'bałaganiarski', 'nieczysty', 'brud', 'niehigieniczny']
  };

  private pricingKeywords = {
    positive: ['reasonable', 'fair', 'affordable', 'good value', 'worth it', 'reasonable price', 'rozsądny', 'uczciwy', 'przystępny', 'wart swojej ceny'],
    negative: ['expensive', 'overpriced', 'costly', 'pricey', 'too much', 'high price', 'drogi', 'przesadnie drogi', 'kosztowny', 'zbyt drogi']
  };

  static getInstance(): SentimentAnalysisService {
    if (!SentimentAnalysisService.instance) {
      SentimentAnalysisService.instance = new SentimentAnalysisService();
    }
    return SentimentAnalysisService.instance;
  }

  // =====================================================
  // MAIN SENTIMENT ANALYSIS
  // =====================================================

  /**
   * Analyze sentiment for text content
   */
  async analyzeSentiment(
    text: string,
    sourceId: string,
    sourceType: SentimentSourceType,
    language: string = 'en'
  ): Promise<SentimentAnalysis> {
    try {
      // Clean and preprocess text
      const cleanedText = this.preprocessText(text);

      // Calculate sentiment score
      const sentimentScore = this.calculateSentimentScore(cleanedText, language);

      // Determine sentiment label
      const sentimentLabel = this.getSentimentLabel(sentimentScore);

      // Detect emotions
      const emotions = this.detectEmotions(cleanedText, language);

      // Extract keywords
      const keywords = this.extractKeywords(cleanedText, language);

      // Identify themes
      const themes = await this.identifyThemes(cleanedText, keywords, language);

      // Extract entities
      const entities = this.extractEntities(cleanedText);

      // Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(sentimentScore, emotions, keywords);

      const analysis: Omit<SentimentAnalysis, 'id' | 'created_at' | 'processed_at'> = {
        source_id: sourceId,
        source_type: sourceType,
        text_content: text,
        sentiment_score: sentimentScore,
        sentiment_label: sentimentLabel,
        confidence_score: confidenceScore,
        emotions,
        keywords,
        themes,
        entities,
        language_detected: language,
        model_version: 'v2.0'
      };

      // Save to database
      const { data, error } = await supabase
        .from('sentiment_analysis')
        .insert(analysis)
        .select()
        .single();

      if (error) throw error;

      // Link to themes
      await this.linkToThemes(data.id, themes, sourceType);

      return data as SentimentAnalysis;

    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      throw new Error('Failed to analyze sentiment');
    }
  }

  /**
   * Batch analyze multiple texts
   */
  async batchAnalyzeSentiment(
    items: Array<{
      text: string;
      sourceId: string;
      sourceType: SentimentSourceType;
      language?: string;
    }>
  ): Promise<SentimentAnalysis[]> {
    const results: SentimentAnalysis[] = [];

    for (const item of items) {
      try {
        const analysis = await this.analyzeSentiment(
          item.text,
          item.sourceId,
          item.sourceType,
          item.language || 'en'
        );
        results.push(analysis);
      } catch (error) {
        console.error('Error in batch analysis:', error);
        // Continue with other items
      }
    }

    return results;
  }

  /**
   * Re-analyze text with updated model
   */
  async reanalyzeSentiment(analysisId: string): Promise<SentimentAnalysis> {
    try {
      // Get existing analysis
      const { data: existing, error } = await supabase
        .from('sentiment_analysis')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (error || !existing) throw new Error('Analysis not found');

      // Re-analyze with current model
      const updated = await this.analyzeSentiment(
        existing.text_content,
        existing.source_id,
        existing.source_type,
        existing.language_detected || 'en'
      );

      // Update original record
      await supabase
        .from('sentiment_analysis')
        .update({
          sentiment_score: updated.sentiment_score,
          sentiment_label: updated.sentiment_label,
          confidence_score: updated.confidence_score,
          emotions: updated.emotions,
          keywords: updated.keywords,
          themes: updated.themes,
          entities: updated.entities,
          model_version: updated.model_version,
          processed_at: new Date().toISOString()
        })
        .eq('id', analysisId);

      return updated;

    } catch (error) {
      console.error('Error reanalyzing sentiment:', error);
      throw new Error('Failed to reanalyze sentiment');
    }
  }

  // =====================================================
  // SENTIMENT CALCULATION
  // =====================================================

  /**
   * Calculate sentiment score from -1 to 1
   */
  private calculateSentimentScore(text: string, language: string): number {
    let positiveScore = 0;
    let negativeScore = 0;
    const words = text.toLowerCase().split(/\s+/);

    // Positive words (English + Polish)
    const positiveWords = [
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'perfect', 'love', 'like', 'enjoy', 'satisfied', 'happy', 'pleased', 'delighted', 'thrilled',
      'dobry', 'świetny', 'doskonały', 'fantastyczny', 'wspaniały', 'idealny', 'kocham', 'lubię', 'podoba mi się', 'zadowolony', 'szczęśliwy', 'zachwycony'
    ];

    // Negative words (English + Polish)
    const negativeWords = [
      'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'dislike', 'poor', 'disappointed', 'frustrated', 'angry', 'sad', 'unhappy', 'annoyed',
      'zły', 'okropny', 'straszny', 'najgorszy', 'nienawidzę', 'nie lubię', 'słaby', 'rozczarowany', 'frustrowany', 'wściekły', 'smutny', 'nieszczęśliwy', 'zirytowany'
    ];

    // Luxury-specific sentiment
    const luxuryPositive = this.luxuryKeywords.positive;
    const luxuryNegative = this.luxuryKeywords.negative;

    words.forEach(word => {
      // Basic sentiment
      if (positiveWords.some(pw => word.includes(pw) || pw.includes(word))) {
        positiveScore += 1;
      }
      if (negativeWords.some(nw => word.includes(nw) || nw.includes(word))) {
        negativeScore += 1;
      }

      // Luxury sentiment
      if (luxuryPositive.some(lw => word.includes(lw) || lw.includes(word))) {
        positiveScore += 1.5; // Weight luxury terms higher
      }
      if (luxuryNegative.some(lw => word.includes(lw) || lw.includes(word))) {
        negativeScore += 1.5;
      }

      // Service quality
      if (this.serviceQualityKeywords.positive.some(sw => word.includes(sw) || sw.includes(word))) {
        positiveScore += 1.2;
      }
      if (this.serviceQualityKeywords.negative.some(sw => word.includes(sw) || sw.includes(word))) {
        negativeScore += 1.2;
      }

      // Cleanliness
      if (this.cleanlinessKeywords.positive.some(cw => word.includes(cw) || cw.includes(word))) {
        positiveScore += 1;
      }
      if (this.cleanlinessKeywords.negative.some(cw => word.includes(cw) || cw.includes(word))) {
        negativeScore += 1.3;
      }

      // Pricing
      if (this.pricingKeywords.positive.some(pw => word.includes(pw) || pw.includes(word))) {
        positiveScore += 0.8;
      }
      if (this.pricingKeywords.negative.some(pw => word.includes(pw) || pw.includes(word))) {
        negativeScore += 0.8;
      }
    });

    // Handle negations
    const negationWords = ['not', 'no', 'never', 'none', 'without', 'nie', 'nie'];
    let negationMultiplier = 1;

    words.forEach((word, index) => {
      if (negationWords.includes(word)) {
        // Check next few words for sentiment
        for (let i = 1; i <= 3; i++) {
          if (index + i < words.length) {
            const nextWord = words[index + i];
            if (positiveWords.some(pw => nextWord.includes(pw))) {
              positiveScore -= 1;
              negationMultiplier = -1;
            }
            if (negativeWords.some(nw => nextWord.includes(nw))) {
              negativeScore -= 1;
              negationMultiplier = -1;
            }
          }
        }
      }
    });

    // Calculate final score
    const totalScore = positiveScore - negativeScore;
    const maxPossibleScore = Math.max(positiveScore + negativeScore, 1);
    const normalizedScore = totalScore / maxPossibleScore;

    return Math.max(-1, Math.min(1, normalizedScore));
  }

  /**
   * Get sentiment label from score
   */
  private getSentimentLabel(score: number): SentimentLabel {
    if (score > 0.1) return 'positive';
    if (score < -0.1) return 'negative';
    return 'neutral';
  }

  /**
   * Detect emotions in text
   */
  private detectEmotions(text: string, language: string): EmotionData {
    const emotions: EmotionData = {};
    const words = text.toLowerCase().split(/\s+/);

    Object.entries(this.emotionKeywords).forEach(([emotion, keywords]) => {
      let score = 0;
      keywords.forEach(keyword => {
        const occurrences = words.filter(word =>
          word.includes(keyword) || keyword.includes(word)
        ).length;
        score += occurrences;
      });

      if (score > 0) {
        emotions[emotion] = Math.min(score / 3, 1); // Normalize to 0-1
      }
    });

    return emotions;
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string, language: string): string[] {
    // Remove stop words and extract meaningful keywords
    const stopWords = {
      en: ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'],
      pl: ['i', 'a', 'w', 'o', 'na', 'do', 'od', 'dla', 'z', 'że', 'ale', 'czy', 'być', 'byłem', 'byłaś', 'byliśmy', 'mamy', 'miał', 'miała', 'mieli', 'jest', 'są', 'był', 'była', 'były', 'będzie', 'będą', 'ten', 'ta', 'to', 'te', 'tę', 'tym', 'tymi', 'ja', 'ty', 'on', 'ona', 'ono', 'my', 'wy', 'oni', 'one', 'mnie', 'ciebie', 'jego', 'ją', 'nas', 'was', 'ich', 'nie']
    };

    const stopWordsList = stopWords[language as keyof typeof stopWords] || stopWords.en;
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWordsList.includes(word));

    // Count word frequency
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    // Sort by frequency and return top keywords
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Identify themes in text
   */
  private async identifyThemes(
    text: string,
    keywords: string[],
    language: string
  ): Promise<string[]> {
    const themes: string[] = [];

    // Get all active themes
    const { data: allThemes } = await supabase
      .from('feedback_themes')
      .select('*')
      .eq('is_active', true);

    if (!allThemes) return [];

    allThemes.forEach(theme => {
      const themeKeywords = theme.keywords;
      const matchedKeywords = keywords.filter(keyword =>
        themeKeywords.some(themeKeyword =>
          keyword.includes(themeKeyword) || themeKeyword.includes(keyword)
        )
      );

      if (matchedKeywords.length > 0) {
        themes.push(theme.id);
      }
    });

    return themes;
  }

  /**
   * Extract entities (people, places, services)
   */
  private extractEntities(text: string): EntityData {
    const entities: EntityData = {
      persons: [],
      places: [],
      services: [],
      products: [],
      organizations: [],
      dates: []
    };

    // Simple pattern matching (in real implementation, use NLP library)
    const words = text.split(/\s+/);

    // People - look for titles and name patterns
    const personPatterns = ['dr', 'doctor', 'mgr', 'prof', 'professor', 'pan', 'pani'];
    words.forEach((word, index) => {
      if (personPatterns.some(pattern => word.toLowerCase().includes(pattern))) {
        // Assume next word is a name
        if (index + 1 < words.length) {
          entities.persons.push(words[index + 1]);
        }
      }
    });

    // Services - look for service-related terms
    const serviceTerms = ['massage', 'facial', 'manicure', 'pedicure', 'haircut', 'makeup', 'fitness', 'training', 'masaż', 'twarz', 'manicure', 'pedicure', 'fryzjer', 'makijaż', 'fitness', 'trening'];
    words.forEach(word => {
      if (serviceTerms.some(term => word.toLowerCase().includes(term))) {
        entities.services.push(word);
      }
    });

    // Dates - look for date patterns
    const datePattern = /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/;
    const dates = text.match(datePattern) || [];
    entities.dates = dates;

    return entities;
  }

  /**
   * Calculate confidence score for analysis
   */
  private calculateConfidenceScore(
    sentimentScore: number,
    emotions: EmotionData,
    keywords: string[]
  ): number {
    let confidence = 0.5; // Base confidence

    // Strong sentiment increases confidence
    if (Math.abs(sentimentScore) > 0.5) {
      confidence += 0.2;
    }

    // Detected emotions increase confidence
    if (Object.keys(emotions).length > 0) {
      confidence += 0.15;
    }

    // More keywords increase confidence
    if (keywords.length > 5) {
      confidence += 0.15;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Link analysis to themes
   */
  private async linkToThemes(
    analysisId: string,
    themeIds: string[],
    feedbackType: FeedbackType
  ): Promise<void> {
    const links = themeIds.map(themeId => ({
      feedback_id: analysisId,
      feedback_type: feedbackType,
      theme_id: themeId,
      relevance_score: 0.8, // Default relevance
      auto_detected: true,
      manually_verified: false
    }));

    if (links.length > 0) {
      await supabase
        .from('feedback_theme_links')
        .insert(links);
    }
  }

  /**
   * Preprocess text for analysis
   */
  private preprocessText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s\u0100-\u017F]/g, '') // Keep Unicode characters for Polish
      .replace(/\s+/g, ' ')
      .trim();
  }

  // =====================================================
  // ANALYTICS AND REPORTING
  // =====================================================

  /**
   * Get sentiment analytics for a period
   */
  async getSentimentAnalytics(
    startDate: Date,
    endDate: Date,
    filters?: {
      sourceType?: SentimentSourceType;
      sentimentLabel?: SentimentLabel;
      language?: string;
    }
  ): Promise<{
    totalAnalyzed: number;
    sentimentDistribution: Record<SentimentLabel, number>;
    averageSentimentScore: number;
    topEmotions: Array<{ emotion: string; count: number; percentage: number }>;
    topKeywords: Array<{ keyword: string; count: number }>;
    topThemes: Array<{ themeId: string; themeName: string; count: number }>;
    trendData: Array<{ date: string; score: number; count: number }>;
  }> {
    try {
      let query = supabase
        .from('sentiment_analysis')
        .select('*')
        .gte('processed_at', startDate.toISOString())
        .lte('processed_at', endDate.toISOString());

      if (filters?.sourceType) {
        query = query.eq('source_type', filters.sourceType);
      }
      if (filters?.sentimentLabel) {
        query = query.eq('sentiment_label', filters.sentimentLabel);
      }
      if (filters?.language) {
        query = query.eq('language_detected', filters.language);
      }

      const { data, error } = await query;
      if (error || !data) throw error;

      // Calculate sentiment distribution
      const sentimentDistribution = data.reduce((acc, item) => {
        acc[item.sentiment_label] = (acc[item.sentiment_label] || 0) + 1;
        return acc;
      }, {} as Record<SentimentLabel, number>);

      // Calculate average sentiment score
      const averageSentimentScore = data.reduce((sum, item) =>
        sum + (item.sentiment_score || 0), 0) / data.length;

      // Extract top emotions
      const emotionCounts: Record<string, number> = {};
      data.forEach(item => {
        Object.entries(item.emotions).forEach(([emotion, score]) => {
          if (score > 0.5) { // Only count strong emotions
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
          }
        });
      });

      const topEmotions = Object.entries(emotionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([emotion, count]) => ({
          emotion,
          count,
          percentage: Math.round((count / data.length) * 100)
        }));

      // Extract top keywords
      const keywordCounts: Record<string, number> = {};
      data.forEach(item => {
        item.keywords.forEach(keyword => {
          keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
        });
      });

      const topKeywords = Object.entries(keywordCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([keyword, count]) => ({ keyword, count }));

      // Get top themes with names
      const themeCounts: Record<string, number> = {};
      const themeNames: Record<string, string> = {};

      // Get theme names
      const uniqueThemeIds = [...new Set(data.flatMap(item => item.themes))];
      if (uniqueThemeIds.length > 0) {
        const { data: themes } = await supabase
          .from('feedback_themes')
          .select('id, theme_name_en')
          .in('id', uniqueThemeIds);

        themes?.forEach(theme => {
          themeNames[theme.id] = theme.theme_name_en;
        });
      }

      data.forEach(item => {
        item.themes.forEach(themeId => {
          themeCounts[themeId] = (themeCounts[themeId] || 0) + 1;
        });
      });

      const topThemes = Object.entries(themeCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([themeId, count]) => ({
          themeId,
          themeName: themeNames[themeId] || 'Unknown Theme',
          count
        }));

      // Calculate trend data (daily)
      const trendData = this.calculateTrendData(data, startDate, endDate);

      return {
        totalAnalyzed: data.length,
        sentimentDistribution,
        averageSentimentScore: Math.round(averageSentimentScore * 100) / 100,
        topEmotions,
        topKeywords,
        topThemes,
        trendData
      };

    } catch (error) {
      console.error('Error getting sentiment analytics:', error);
      throw new Error('Failed to get sentiment analytics');
    }
  }

  /**
   * Calculate trend data for sentiment over time
   */
  private calculateTrendData(
    data: SentimentAnalysis[],
    startDate: Date,
    endDate: Date
  ): Array<{ date: string; score: number; count: number }> {
    const dailyData: Record<string, { scores: number[]; count: number }> = {};

    // Initialize all dates in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dailyData[dateKey] = { scores: [], count: 0 };
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Populate with actual data
    data.forEach(item => {
      const dateKey = item.processed_at.split('T')[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].scores.push(item.sentiment_score || 0);
        dailyData[dateKey].count += 1;
      }
    });

    // Calculate daily averages
    return Object.entries(dailyData).map(([date, { scores, count }]) => ({
      date,
      score: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      count
    }));
  }

  /**
   * Get sentiment trend analysis
   */
  async getSentimentTrendAnalysis(
    days: number = 30
  ): Promise<{
    trend: 'improving' | 'declining' | 'stable';
    changePercentage: number;
    dataPoints: Array<{ date: string; score: number; volume: number }>;
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const analytics = await this.getSentimentAnalytics(startDate, endDate);

      const dataPoints = analytics.trendData;
      if (dataPoints.length < 2) {
        return {
          trend: 'stable',
          changePercentage: 0,
          dataPoints
        };
      }

      const firstScore = dataPoints[0].score;
      const lastScore = dataPoints[dataPoints.length - 1].score;
      const changePercentage = firstScore !== 0
        ? Math.round(((lastScore - firstScore) / Math.abs(firstScore)) * 100)
        : 0;

      let trend: 'improving' | 'declining' | 'stable';
      if (Math.abs(changePercentage) < 5) {
        trend = 'stable';
      } else if (changePercentage > 0) {
        trend = 'improving';
      } else {
        trend = 'declining';
      }

      return {
        trend,
        changePercentage,
        dataPoints: dataPoints.map(d => ({
          date: d.date,
          score: Math.round(d.score * 100) / 100,
          volume: d.count
        }))
      };

    } catch (error) {
      console.error('Error getting sentiment trend:', error);
      throw new Error('Failed to get sentiment trend analysis');
    }
  }
}

// Export singleton instance
export const sentimentAnalysisService = SentimentAnalysisService.getInstance();