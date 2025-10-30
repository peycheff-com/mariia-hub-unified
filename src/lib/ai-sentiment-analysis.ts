/**
 * Advanced Natural Language Processing for Customer Feedback Analysis
 * Multilingual sentiment analysis with emotion detection and topic modeling
 */

import { CustomerFeedback, SentimentScore } from './ai-analytics-engine';

export interface EmotionScore {
  joy: number;
  anger: number;
  fear: number;
  sadness: number;
  disgust: number;
  surprise: number;
  trust: number;
  anticipation: number;
  dominant: string;
  confidence: number;
}

export interface TopicModel {
  topic: string;
  keywords: string[];
  probability: number;
  feedbackIds: string[];
}

export interface FeedbackInsight {
  feedbackId: string;
  sentiment: SentimentScore;
  emotions: EmotionScore;
  topics: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  actionableInsights: string[];
  recommendedActions: string[];
  summary: string;
}

export interface SentimentTrend {
  date: Date;
  avgSentiment: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  emotionDistribution: Record<string, number>;
  topTopics: TopicModel[];
  volume: number;
}

export interface LanguageModel {
  language: 'en' | 'pl';
  positiveWords: string[];
  negativeWords: string[];
  emotionWords: Record<string, string[]>;
  topicKeywords: Record<string, string[]>;
  intensifiers: string[];
  negators: string[];
}

export interface FeedbackAnalytics {
  totalFeedback: number;
  averageSentiment: number;
  sentimentTrend: 'improving' | 'declining' | 'stable';
  topPositivePoints: string[];
  topNegativePoints: string[];
  emotionTrends: Record<string, 'increasing' | 'decreasing' | 'stable'>;
  topicTrends: Record<string, 'increasing' | 'decreasing' | 'stable'>;
  actionableInsights: string[];
  urgentIssues: string[];
}

export class AdvancedSentimentAnalysis {
  private languageModels: Map<string, LanguageModel> = new Map();
  private emotionWeights: Record<string, number> = {
    joy: 0.3,
    anger: -0.4,
    fear: -0.2,
    sadness: -0.3,
    disgust: -0.5,
    surprise: 0.1,
    trust: 0.2,
    anticipation: 0.1
  };

  constructor() {
    this.initializeLanguageModels();
  }

  // Main analysis method
  async analyzeFeedback(feedback: CustomerFeedback): Promise<FeedbackInsight> {
    // Preprocess text
    const cleanedText = this.preprocessText(feedback.comment);
    const tokens = this.tokenize(cleanedText);
    const language = feedback.language || this.detectLanguage(tokens);

    // Get appropriate language model
    const langModel = this.languageModels.get(language);
    if (!langModel) {
      throw new Error(`Unsupported language: ${language}`);
    }

    // Perform sentiment analysis
    const sentiment = await this.analyzeSentiment(tokens, langModel, cleanedText);

    // Perform emotion detection
    const emotions = await this.detectEmotions(tokens, langModel);

    // Extract topics
    const topics = await this.extractTopics(tokens, langModel);

    // Determine urgency
    const urgency = this.calculateUrgency(sentiment, emotions, topics);

    // Generate actionable insights
    const actionableInsights = this.generateActionableInsights(sentiment, emotions, topics);
    const recommendedActions = this.generateRecommendedActions(sentiment, emotions, topics, language);

    // Create summary
    const summary = this.generateSummary(sentiment, emotions, topics, language);

    return {
      feedbackId: feedback.id,
      sentiment,
      emotions,
      topics,
      urgency,
      actionableInsights,
      recommendedActions,
      summary
    };
  }

  // Batch analysis for multiple feedback items
  async analyzeBatchFeedback(feedbackList: CustomerFeedback[]): Promise<FeedbackInsight[]> {
    const insights: FeedbackInsight[] = [];

    // Process in parallel for efficiency
    const batchSize = 10;
    for (let i = 0; i < feedbackList.length; i += batchSize) {
      const batch = feedbackList.slice(i, i + batchSize);
      const batchPromises = batch.map(feedback => this.analyzeFeedback(feedback));
      const batchResults = await Promise.all(batchPromises);
      insights.push(...batchResults);
    }

    return insights;
  }

  // Generate comprehensive analytics from feedback data
  async generateAnalytics(feedbackInsights: FeedbackInsight[]): Promise<FeedbackAnalytics> {
    if (feedbackInsights.length === 0) {
      return this.getEmptyAnalytics();
    }

    const totalFeedback = feedbackInsights.length;
    const averageSentiment = this.calculateAverageSentiment(feedbackInsights);
    const sentimentTrend = this.calculateSentimentTrend(feedbackInsights);
    const topPositivePoints = this.extractTopPositivePoints(feedbackInsights);
    const topNegativePoints = this.extractTopNegativePoints(feedbackInsights);
    const emotionTrends = this.calculateEmotionTrends(feedbackInsights);
    const topicTrends = this.calculateTopicTrends(feedbackInsights);
    const actionableInsights = this.generateGlobalActionableInsights(feedbackInsights);
    const urgentIssues = this.extractUrgentIssues(feedbackInsights);

    return {
      totalFeedback,
      averageSentiment,
      sentimentTrend,
      topPositivePoints,
      topNegativePoints,
      emotionTrends,
      topicTrends,
      actionableInsights,
      urgentIssues
    };
  }

  // Track sentiment trends over time
  async trackSentimentTrends(
    feedbackInsights: FeedbackInsight[],
    period: 'daily' | 'weekly' | 'monthly'
  ): Promise<SentimentTrend[]> {
    const groupedByPeriod = this.groupFeedbackByPeriod(feedbackInsights, period);
    const trends: SentimentTrend[] = [];

    for (const [dateStr, groupInsights] of Object.entries(groupedByPeriod)) {
      const date = new Date(dateStr);
      const avgSentiment = this.calculateAverageSentiment(groupInsights);
      const sentimentDistribution = this.calculateSentimentDistribution(groupInsights);
      const emotionDistribution = this.calculateEmotionDistribution(groupInsights);
      const topTopics = this.extractTopTopics(groupInsights);
      const volume = groupInsights.length;

      trends.push({
        date,
        avgSentiment,
        sentimentDistribution,
        emotionDistribution,
        topTopics,
        volume
      });
    }

    return trends.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // Language model initialization
  private initializeLanguageModels(): void {
    // English language model
    const englishModel: LanguageModel = {
      language: 'en',
      positiveWords: [
        'excellent', 'amazing', 'fantastic', 'wonderful', 'great', 'good', 'nice', 'love',
        'perfect', 'outstanding', 'superb', 'brilliant', 'awesome', 'spectacular', 'phenomenal',
        'satisfied', 'happy', 'pleased', 'delighted', 'thrilled', 'impressed', 'recommend',
        'professional', 'friendly', 'welcoming', 'comfortable', 'clean', 'beautiful', 'stunning'
      ],
      negativeWords: [
        'terrible', 'awful', 'horrible', 'bad', 'poor', 'disappointing', 'unhappy', 'sad',
        'angry', 'frustrated', 'annoyed', 'disgusting', 'disgusted', 'hate', 'worst', 'never',
        'unprofessional', 'rude', 'unfriendly', 'dirty', 'messy', 'uncomfortable', 'painful',
        'expensive', 'overpriced', 'waste', 'regret', 'mistake', 'error', 'problem', 'issue'
      ],
      emotionWords: {
        joy: ['happy', 'joyful', 'excited', 'delighted', 'thrilled', 'ecstatic', 'cheerful'],
        anger: ['angry', 'furious', 'enraged', 'irritated', 'annoyed', 'mad', 'livid'],
        fear: ['scared', 'afraid', 'terrified', 'anxious', 'worried', 'nervous', 'fearful'],
        sadness: ['sad', 'depressed', 'disappointed', 'unhappy', 'miserable', 'heartbroken'],
        disgust: ['disgusted', 'revolted', 'repulsed', 'sickened', 'nauseated'],
        surprise: ['surprised', 'amazed', 'astonished', 'shocked', 'stunned'],
        trust: ['trust', 'confident', 'reliable', 'dependable', 'secure', 'safe'],
        anticipation: ['excited', 'eager', 'looking forward', 'anticipating', 'expecting']
      },
      topicKeywords: {
        service: ['service', 'treatment', 'procedure', 'appointment', 'booking'],
        staff: ['staff', 'employee', 'therapist', 'beautician', 'trainer', 'professional'],
        price: ['price', 'cost', 'expensive', 'cheap', 'value', 'money', 'payment'],
        environment: ['environment', 'atmosphere', 'ambiance', 'clean', 'decor', 'location'],
        quality: ['quality', 'result', 'outcome', 'effectiveness', 'skill', 'technique'],
        time: ['time', 'duration', 'schedule', 'waiting', 'punctual', 'late', 'early']
      },
      intensifiers: ['very', 'extremely', 'really', 'absolutely', 'completely', 'totally', 'incredibly'],
      negators: ['not', 'no', 'never', 'nothing', 'neither', 'nobody', 'none', 'without']
    };

    // Polish language model
    const polishModel: LanguageModel = {
      language: 'pl',
      positiveWords: [
        'świetny', 'doskonały', 'fantastyczny', 'wspaniały', 'świetnie', 'super', 'polecam',
        'zadowolony', 'zadowolona', 'szczęśliwy', 'szczęśliwa', 'profesjonalny', 'profesjonalna',
        'miły', 'miła', 'przyjemny', 'przyjemna', 'czysty', 'czysta', 'ładny', 'ładna',
        'piękny', 'piękna', 'doskonała', 'doskonały', ' rewelacyjny', 'rewelacyjna'
      ],
      negativeWords: [
        'straszny', 'okropny', 'zły', 'zła', 'słaby', 'słaba', 'rozczarowany', 'rozczarowana',
        'nieszczęśliwy', 'nieszczęśliwa', 'wściekły', 'wściekła', 'zirytowany', 'zirytowana',
        'brudny', 'brudna', 'drogi', 'droga', 'niedrogi', 'niedroga', 'niewarto', 'nigdy',
        'nieprofesjonalny', 'nieprofesjonalna', 'niemiły', 'niemiła', 'okropieństwo'
      ],
      emotionWords: {
        joy: ['szczęśliwy', 'radosny', 'wesoły', 'zadowolony', 'radość', 'uciecha'],
        anger: ['wściekły', 'zły', 'gniewny', 'irytowany', 'furia', 'złość'],
        fear: ['przerażony', 'wystraszony', 'zmartwiony', 'nervous', 'lęk', 'strach'],
        sadness: ['smutny', 'przygnębiony', 'rozczarowany', 'smutek', 'żałoba'],
        disgust: ['obrzydzony', 'zniesmaczony', 'wstrętny', 'obrzydzenie'],
        surprise: ['zdziwiony', 'zaskoczony', 'zdumiony', 'niespodzianka', 'szok'],
        trust: ['ufny', 'pewny', 'zaufanie', 'pewność', 'bezpieczeństwo'],
        anticipation: ['oczekujący', 'ekscytowany', 'oczekiwanie', 'nadzieja']
      },
      topicKeywords: {
        service: ['usługa', 'zabieg', 'traktament', 'wizyta', 'rezerwacja', 'termin'],
        staff: ['personel', 'pracownik', 'terapeuta', 'kosmetyczka', 'trener', 'profesjonalista'],
        price: ['cena', 'koszt', 'drogi', 'tani', 'wartość', 'pieniądze', 'płatność'],
        environment: ['środowisko', 'atmosfera', 'klimat', 'czystość', 'wystrój', 'lokalizacja'],
        quality: ['jakość', 'wynik', 'efekt', 'skuteczność', 'umiejętności', 'technika'],
        time: ['czas', 'czas trwania', 'harmonogram', 'oczekiwanie', 'punktualny', 'późno', 'wcześniej']
      },
      intensifiers: ['bardzo', 'strasznie', 'niewiarygodnie', 'całkowicie', 'absolutnie', 'ekstremalnie'],
      negators: ['nie', 'żaden', 'nigdy', 'nic', 'nikt', 'bez', 'ani', 'ani jeden']
    };

    this.languageModels.set('en', englishModel);
    this.languageModels.set('pl', polishModel);
  }

  // Text preprocessing
  private preprocessText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private tokenize(text: string): string[] {
    return text.split(/\s+/).filter(token => token.length > 0);
  }

  private detectLanguage(tokens: string[]): 'en' | 'pl' {
    // Simple language detection based on common words
    const polishWords = ['i', 'w', 'na', 'z', 'do', 'od', 'dla', 'o', 'ale', 'lub', 'czy', 'się', 'nie'];
    const englishWords = ['the', 'and', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'or', 'but', 'not'];

    let polishScore = 0;
    let englishScore = 0;

    tokens.forEach(token => {
      if (polishWords.includes(token)) polishScore++;
      if (englishWords.includes(token)) englishScore++;
    });

    return polishScore > englishScore ? 'pl' : 'en';
  }

  // Sentiment analysis
  private async analyzeSentiment(
    tokens: string[],
    langModel: LanguageModel,
    originalText: string
  ): Promise<SentimentScore> {
    let positiveScore = 0;
    let negativeScore = 0;
    let intensifierActive = false;
    let negatorActive = false;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const prevToken = tokens[i - 1] || '';
      const nextToken = tokens[i + 1] || '';

      // Check for negators
      if (langModel.negators.includes(token)) {
        negatorActive = true;
        continue;
      }

      // Check for intensifiers
      if (langModel.intensifiers.includes(token)) {
        intensifierActive = true;
        continue;
      }

      // Check for positive words
      if (langModel.positiveWords.includes(token)) {
        let score = 1;
        if (intensifierActive) score *= 1.5;
        if (negatorActive) score *= -1;
        positiveScore += score;
      }

      // Check for negative words
      if (langModel.negativeWords.includes(token)) {
        let score = 1;
        if (intensifierActive) score *= 1.5;
        if (negatorActive) score *= -1;
        negativeScore += score;
      }

      // Reset modifiers
      intensifierActive = false;
      negatorActive = false;
    }

    // Normalize scores
    const totalTokens = tokens.length;
    const normalizedPositive = positiveScore / totalTokens;
    const normalizedNegative = negativeScore / totalTokens;
    const normalizedNeutral = Math.max(0, 1 - normalizedPositive - normalizedNegative);

    // Determine overall sentiment
    let overall: 'positive' | 'negative' | 'neutral';
    const sentimentScore = normalizedPositive - normalizedNegative;

    if (sentimentScore > 0.1) overall = 'positive';
    else if (sentimentScore < -0.1) overall = 'negative';
    else overall = 'neutral';

    // Calculate confidence based on the strength of sentiment
    const confidence = Math.min(1, Math.abs(sentimentScore) * 2);

    return {
      positive: normalizedPositive,
      negative: normalizedNegative,
      neutral: normalizedNeutral,
      overall,
      confidence
    };
  }

  // Emotion detection
  private async detectEmotions(tokens: string[], langModel: LanguageModel): Promise<EmotionScore> {
    const emotions: Record<string, number> = {
      joy: 0,
      anger: 0,
      fear: 0,
      sadness: 0,
      disgust: 0,
      surprise: 0,
      trust: 0,
      anticipation: 0
    };

    // Count emotion words
    Object.entries(langModel.emotionWords).forEach(([emotion, words]) => {
      words.forEach(word => {
        const count = tokens.filter(token => token.includes(word) || word.includes(token)).length;
        emotions[emotion] += count;
      });
    });

    // Normalize emotions
    const totalEmotions = Object.values(emotions).reduce((sum, val) => sum + val, 0);
    if (totalEmotions === 0) {
      // Default to neutral if no emotion words found
      return {
        joy: 0.125,
        anger: 0.125,
        fear: 0.125,
        sadness: 0.125,
        disgust: 0.125,
        surprise: 0.125,
        trust: 0.125,
        anticipation: 0.125,
        dominant: 'neutral',
        confidence: 0.3
      };
    }

    const normalizedEmotions: Record<string, number> = {};
    Object.entries(emotions).forEach(([emotion, count]) => {
      normalizedEmotions[emotion] = count / totalEmotions;
    });

    // Find dominant emotion
    const dominantEmotion = Object.entries(normalizedEmotions).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0];

    const confidence = Math.max(0.3, Math.min(1, totalEmotions / tokens.length * 5));

    return {
      ...normalizedEmotions,
      dominant: dominantEmotion,
      confidence
    };
  }

  // Topic extraction
  private async extractTopics(tokens: string[], langModel: LanguageModel): Promise<string[]> {
    const topicScores: Record<string, number> = {};

    // Count topic keywords
    Object.entries(langModel.topicKeywords).forEach(([topic, keywords]) => {
      let score = 0;
      keywords.forEach(keyword => {
        score += tokens.filter(token => token.includes(keyword) || keyword.includes(token)).length;
      });
      topicScores[topic] = score;
    });

    // Sort topics by score and return top 3
    const sortedTopics = Object.entries(topicScores)
      .sort((a, b) => b[1] - a[1])
      .filter(([_, score]) => score > 0)
      .slice(0, 3)
      .map(([topic]) => topic);

    return sortedTopics.length > 0 ? sortedTopics : ['general'];
  }

  // Urgency calculation
  private calculateUrgency(
    sentiment: SentimentScore,
    emotions: EmotionScore,
    topics: string[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    let urgencyScore = 0;

    // Sentiment-based urgency
    if (sentiment.overall === 'negative') {
      urgencyScore += sentiment.confidence * 3;
    }

    // Emotion-based urgency
    if (emotions.dominant === 'anger') urgencyScore += emotions.confidence * 2;
    if (emotions.dominant === 'fear') urgencyScore += emotions.confidence * 1.5;
    if (emotions.dominant === 'disgust') urgencyScore += emotions.confidence * 2.5;

    // Topic-based urgency
    if (topics.includes('staff')) urgencyScore += 1;
    if (topics.includes('service')) urgencyScore += 1.5;

    if (urgencyScore >= 4) return 'critical';
    if (urgencyScore >= 2.5) return 'high';
    if (urgencyScore >= 1) return 'medium';
    return 'low';
  }

  // Insight generation
  private generateActionableInsights(
    sentiment: SentimentScore,
    emotions: EmotionScore,
    topics: string[]
  ): string[] {
    const insights: string[] = [];

    if (sentiment.overall === 'negative') {
      if (sentiment.confidence > 0.7) {
        insights.push('Strong negative sentiment detected - immediate attention required');
      }
      if (topics.includes('staff')) {
        insights.push('Staff-related issues need to be addressed');
      }
      if (topics.includes('service')) {
        insights.push('Service quality improvements needed');
      }
    }

    if (emotions.dominant === 'anger' && emotions.confidence > 0.6) {
      insights.push('Customer anger detected - consider immediate follow-up');
    }

    if (emotions.dominant === 'fear') {
      insights.push('Customer concerns need to be addressed for reassurance');
    }

    if (sentiment.overall === 'positive' && sentiment.confidence > 0.7) {
      insights.push('Highly satisfied customer - consider for testimonials');
    }

    return insights;
  }

  private generateRecommendedActions(
    sentiment: SentimentScore,
    emotions: EmotionScore,
    topics: string[],
    language: 'en' | 'pl'
  ): string[] {
    const actions: string[] = [];
    const isEnglish = language === 'en';

    if (sentiment.overall === 'negative') {
      if (topics.includes('staff')) {
        actions.push(isEnglish ? 'Review staff training' : 'Przejrzyj szkolenia personelu');
      }
      if (topics.includes('service')) {
        actions.push(isEnglish ? 'Improve service protocols' : 'Popraw procedury serwisowe');
      }
      if (topics.includes('environment')) {
        actions.push(isEnglish ? 'Enhance facility maintenance' : 'Popraw utrzymanie obiektu');
      }
      actions.push(isEnglish ? 'Contact customer for resolution' : 'Skontaktuj się z klientem w celu rozwiązania');
    }

    if (emotions.dominant === 'anger') {
      actions.push(isEnglish ? 'Immediate management intervention' : 'Natychmiastowa interwencja zarządu');
    }

    if (sentiment.overall === 'positive') {
      actions.push(isEnglish ? 'Thank customer for feedback' : 'Podziękuj klientowi za opinię');
      if (sentiment.confidence > 0.8) {
        actions.push(isEnglish ? 'Request testimonial permission' : 'Poproś o zgodę na opinie');
      }
    }

    return actions;
  }

  private generateSummary(
    sentiment: SentimentScore,
    emotions: EmotionScore,
    topics: string[],
    language: 'en' | 'pl'
  ): string {
    const isEnglish = language === 'en';

    if (sentiment.overall === 'negative') {
      if (emotions.dominant === 'anger') {
        return isEnglish
          ? `Customer expressed strong negative sentiment with ${emotions.dominant} regarding ${topics.join(', ')}`
          : `Klient wyraził silnie negatywną opinię z ${emotions.dominant} dotyczącą ${topics.join(', ')}`;
      }
      return isEnglish
        ? `Customer reported issues with ${topics.join(', ')} showing ${sentiment.overall} sentiment`
        : `Klient zgłosił problemy z ${topics.join(', ')} wykazując ${sentiment.overall} nastroje`;
    }

    if (sentiment.overall === 'positive') {
      return isEnglish
        ? `Customer expressed ${sentiment.overall} feedback about ${topics.join(', ')} with ${emotions.dominant} emotions`
        : `Klient wyraził ${sentiment.overall} opinie o ${topics.join(', ')} z emocjami ${emotions.dominant}`;
    }

    return isEnglish
      ? `Customer provided ${sentiment.overall} feedback regarding ${topics.join(', ')}`
      : `Klient dostarczył ${sentiment.overall} opinie dotyczącą ${topics.join(', ')}`;
  }

  // Analytics helper methods
  private calculateAverageSentiment(insights: FeedbackInsight[]): number {
    const totalSentiment = insights.reduce((sum, insight) => {
      return sum + (insight.sentiment.positive - insight.sentiment.negative);
    }, 0);
    return (totalSentiment / insights.length + 1) / 2; // Normalize to 0-1
  }

  private calculateSentimentTrend(insights: FeedbackInsight[]): 'improving' | 'declining' | 'stable' {
    if (insights.length < 2) return 'stable';

    // Sort by feedback date (assuming feedback IDs contain timestamps)
    const sortedInsights = [...insights].sort((a, b) => a.feedbackId.localeCompare(b.feedbackId));
    const firstHalf = sortedInsights.slice(0, Math.floor(sortedInsights.length / 2));
    const secondHalf = sortedInsights.slice(Math.floor(sortedInsights.length / 2));

    const firstAvg = this.calculateAverageSentiment(firstHalf);
    const secondAvg = this.calculateAverageSentiment(secondHalf);

    const difference = secondAvg - firstAvg;
    if (difference > 0.05) return 'improving';
    if (difference < -0.05) return 'declining';
    return 'stable';
  }

  private extractTopPositivePoints(insights: FeedbackInsight[]): string[] {
    const positiveInsights = insights.filter(i => i.sentiment.overall === 'positive');
    const topicCounts: Record<string, number> = {};

    positiveInsights.forEach(insight => {
      insight.topics.forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });

    return Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  private extractTopNegativePoints(insights: FeedbackInsight[]): string[] {
    const negativeInsights = insights.filter(i => i.sentiment.overall === 'negative');
    const topicCounts: Record<string, number> = {};

    negativeInsights.forEach(insight => {
      insight.topics.forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });

    return Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  private calculateEmotionTrends(insights: FeedbackInsight[]): Record<string, 'increasing' | 'decreasing' | 'stable'> {
    const trends: Record<string, 'increasing' | 'decreasing' | 'stable'> = {};
    const emotions = ['joy', 'anger', 'fear', 'sadness', 'disgust', 'surprise', 'trust', 'anticipation'];

    emotions.forEach(emotion => {
      const sortedInsights = [...insights].sort((a, b) => a.feedbackId.localeCompare(b.feedbackId));
      const firstHalf = sortedInsights.slice(0, Math.floor(sortedInsights.length / 2));
      const secondHalf = sortedInsights.slice(Math.floor(sortedInsights.length / 2));

      const firstAvg = firstHalf.reduce((sum, i) => sum + (i.emotions as any)[emotion], 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, i) => sum + (i.emotions as any)[emotion], 0) / secondHalf.length;

      const difference = secondAvg - firstAvg;
      if (difference > 0.02) trends[emotion] = 'increasing';
      else if (difference < -0.02) trends[emotion] = 'decreasing';
      else trends[emotion] = 'stable';
    });

    return trends;
  }

  private calculateTopicTrends(insights: FeedbackInsight[]): Record<string, 'increasing' | 'decreasing' | 'stable'> {
    const trends: Record<string, 'increasing' | 'decreasing' | 'stable'> = {};
    const allTopics = [...new Set(insights.flatMap(i => i.topics))];

    allTopics.forEach(topic => {
      const sortedInsights = [...insights].sort((a, b) => a.feedbackId.localeCompare(b.feedbackId));
      const firstHalf = sortedInsights.slice(0, Math.floor(sortedInsights.length / 2));
      const secondHalf = sortedInsights.slice(Math.floor(sortedInsights.length / 2));

      const firstCount = firstHalf.filter(i => i.topics.includes(topic)).length;
      const secondCount = secondHalf.filter(i => i.topics.includes(topic)).length;

      const firstRate = firstCount / firstHalf.length;
      const secondRate = secondCount / secondHalf.length;

      const difference = secondRate - firstRate;
      if (difference > 0.05) trends[topic] = 'increasing';
      else if (difference < -0.05) trends[topic] = 'decreasing';
      else trends[topic] = 'stable';
    });

    return trends;
  }

  private generateGlobalActionableInsights(insights: FeedbackInsight[]): string[] {
    const actionableInsights: string[] = [];
    const sentimentIssues = insights.filter(i => i.sentiment.overall === 'negative' && i.sentiment.confidence > 0.6);
    const urgentIssues = insights.filter(i => i.urgency === 'high' || i.urgency === 'critical');

    if (sentimentIssues.length > insights.length * 0.3) {
      actionableInsights.push('High percentage of negative feedback requires immediate attention');
    }

    if (urgentIssues.length > 0) {
      actionableInsights.push(`${urgentIssues.length} urgent issues require immediate resolution`);
    }

    const staffIssues = insights.filter(i => i.topics.includes('staff') && i.sentiment.overall === 'negative');
    if (staffIssues.length > 3) {
      actionableInsights.push('Multiple staff-related issues detected - review training and management');
    }

    return actionableInsights;
  }

  private extractUrgentIssues(insights: FeedbackInsight[]): string[] {
    const urgentInsights = insights.filter(i => i.urgency === 'high' || i.urgency === 'critical');
    return urgentInsights.map(i => i.summary);
  }

  private getEmptyAnalytics(): FeedbackAnalytics {
    return {
      totalFeedback: 0,
      averageSentiment: 0.5,
      sentimentTrend: 'stable',
      topPositivePoints: [],
      topNegativePoints: [],
      emotionTrends: {},
      topicTrends: {},
      actionableInsights: [],
      urgentIssues: []
    };
  }

  private groupFeedbackByPeriod(
    insights: FeedbackInsight[],
    period: 'daily' | 'weekly' | 'monthly'
  ): Record<string, FeedbackInsight[]> {
    const grouped: Record<string, FeedbackInsight[]> = {};

    insights.forEach(insight => {
      // Extract date from feedback ID (assuming format contains timestamp)
      const date = new Date(); // This should be extracted from feedback data
      let key: string;

      if (period === 'daily') {
        key = date.toISOString().split('T')[0];
      } else if (period === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(insight);
    });

    return grouped;
  }

  private calculateSentimentDistribution(insights: FeedbackInsight[]) {
    const distribution = {
      positive: 0,
      neutral: 0,
      negative: 0
    };

    insights.forEach(insight => {
      distribution[insight.sentiment.overall]++;
    });

    return distribution;
  }

  private calculateEmotionDistribution(insights: FeedbackInsight[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    const emotions = ['joy', 'anger', 'fear', 'sadness', 'disgust', 'surprise', 'trust', 'anticipation'];

    emotions.forEach(emotion => {
      distribution[emotion] = insights.reduce((sum, i) => sum + (i.emotions as any)[emotion], 0) / insights.length;
    });

    return distribution;
  }

  private extractTopTopics(insights: FeedbackInsight[]): TopicModel[] {
    const topicCounts: Record<string, { count: number; feedbackIds: string[] }> = {};

    insights.forEach(insight => {
      insight.topics.forEach(topic => {
        if (!topicCounts[topic]) {
          topicCounts[topic] = { count: 0, feedbackIds: [] };
        }
        topicCounts[topic].count++;
        topicCounts[topic].feedbackIds.push(insight.feedbackId);
      });
    });

    return Object.entries(topicCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([topic, data]) => ({
        topic,
        keywords: [topic], // Would be expanded with actual keywords
        probability: data.count / insights.length,
        feedbackIds: data.feedbackIds
      }));
  }
}

export default AdvancedSentimentAnalysis;