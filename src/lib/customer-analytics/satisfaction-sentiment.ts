import { supabase } from '@/integrations/supabase/client-optimized';
import { Database } from '@/integrations/supabase/types';

type CustomerSatisfaction = Database['public']['Tables']['customer_satisfaction']['Row'];
type Booking = Database['public']['Tables']['bookings']['Row'];

export interface SatisfactionAnalysis {
  userId: string;
  overallSatisfactionScore: number;
  serviceSatisfactionScores: ServiceSatisfactionScore[];
  sentimentAnalysis: SentimentAnalysis;
  satisfactionTrends: SatisfactionTrend[];
  improvementAreas: ImprovementArea[];
  positiveHighlights: PositiveHighlight[];
  riskIndicators: RiskIndicator[];
  feedbackThemes: FeedbackTheme[];
  benchmarkComparison: BenchmarkComparison;
  actionableInsights: ActionableInsight[];
  lastUpdated: Date;
}

export interface ServiceSatisfactionScore {
  serviceId: string;
  serviceName: string;
  serviceType: string;
  satisfactionScore: number;
  qualityScore: number;
  valueScore: number;
  likelihoodToRecommend: number;
  feedbackCount: number;
  averageResponseTime: number;
  issueResolutionRate: number;
  sentimentTrend: 'improving' | 'stable' | 'declining';
  keyIssues: string[];
  keyPraises: string[];
}

export interface SentimentAnalysis {
  overallSentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number; // -1 to 1
  confidence: number;
  emotionalTone: EmotionalTone[];
  topicSentiment: TopicSentiment[];
  languageAnalysis: LanguageAnalysis;
  sentimentDrivers: SentimentDriver[];
  sentimentChangePoints: SentimentChangePoint[];
}

export interface EmotionalTone {
  emotion: 'joy' | 'trust' | 'anticipation' | 'surprise' | 'sadness' | 'anger' | 'fear' | 'disgust';
  intensity: number; // 0 to 1
  context: string;
  examples: string[];
}

export interface TopicSentiment {
  topic: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  relevance: number;
  frequency: number;
  examples: string[];
  impact: 'high' | 'medium' | 'low';
}

export interface LanguageAnalysis {
  language: 'pl' | 'en';
  complexity: 'simple' | 'moderate' | 'complex';
  formality: 'informal' | 'neutral' | 'formal';
  keyPhrases: string[];
  namedEntities: NamedEntity[];
  linguisticPatterns: LinguisticPattern[];
}

export interface NamedEntity {
  text: string;
  type: 'PERSON' | 'SERVICE' | 'LOCATION' | 'TIME' | 'MONEY' | 'ORGANIZATION';
  confidence: number;
  context: string;
}

export interface LinguisticPattern {
  pattern: string;
  frequency: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  examples: string[];
}

export interface SentimentDriver {
  driver: string;
  impact: number; // -1 to 1
  frequency: number;
  examples: string[];
  category: 'service_quality' | 'price' | 'staff' | 'environment' | 'convenience' | 'communication';
}

export interface SentimentChangePoint {
  date: Date;
  previousSentiment: number;
  newSentiment: number;
  changeMagnitude: number;
  likelyCauses: string[];
  relatedEvents: string[];
}

export interface SatisfactionTrend {
  period: string;
  overallScore: number;
  qualityScore: number;
  valueScore: number;
  recommendationScore: number;
  responseRate: number;
  trendDirection: 'increasing' | 'stable' | 'decreasing';
  significantEvents: string[];
}

export interface ImprovementArea {
  area: string;
  currentScore: number;
  targetScore: number;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  priority: 'critical' | 'high' | 'medium' | 'low';
  recommendations: string[];
  expectedROI: number;
  timeline: string;
}

export interface PositiveHighlight {
  highlight: string;
  category: 'service_excellence' | 'staff_quality' | 'value' | 'experience' | 'results';
  frequency: number;
  impact: number;
  quotes: string[];
  actionableInsights: string[];
}

export interface RiskIndicator {
  risk: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  probability: number;
  impact: number;
  earlyWarningSigns: string[];
  mitigationStrategies: string[];
  monitoringPlan: string;
}

export interface FeedbackTheme {
  theme: string;
  category: 'praise' | 'complaint' | 'suggestion' | 'question' | 'neutral';
  frequency: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  subThemes: string[];
  examples: string[];
  evolution: string[];
}

export interface BenchmarkComparison {
  category: string;
  userScore: number;
  benchmarkAverage: number;
  topQuartile: number;
  industryAverage: number;
  percentileRank: number;
  trend: 'above_average' | 'average' | 'below_average';
  gaps: string[];
  strengths: string[];
}

export interface ActionableInsight {
  insight: string;
  type: 'improvement' | 'opportunity' | 'risk_mitigation' | 'leverage_point';
  priority: 'critical' | 'high' | 'medium' | 'low';
  expectedImpact: number;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  responsibleParty: string;
  metrics: string[];
  dependencies: string[];
}

class SatisfactionSentimentEngine {
  private readonly sentimentThresholds = {
    positive: 0.1,
    negative: -0.1
  };

  private readonly satisfactionThresholds = {
    excellent: 9,
    good: 7,
    average: 5,
    poor: 3
  };

  private readonly polishStopWords = new Set([
    'i', 'w', 'na', 'do', 'od', 'dla', 'z', 'ze', 'o', 'po', 'pod', 'przez', 'przy',
    'bez', 'za', 'się', 'sie', 'jest', 'są', 'był', 'była', 'było', 'byli',
    'będę', 'będziesz', 'będzie', 'będziemy', 'będziecie', 'będą',
    'mam', 'masz', 'ma', 'mamy', 'macie', 'mają',
    'ten', 'ta', 'to', 'ci', 'te', 'ty', 'tamci', 'tamte', 'tamty',
    'mój', 'moja', 'moje', 'nasz', 'nasza', 'nasze',
    'jaki', 'jaka', 'jakie', 'który', 'która', 'które',
    'ale', 'i', 'oraz', 'czy', 'że', 'żeby', 'żeby', 'gdy', 'gdyby',
    'tak', 'nie', 'także', 'też', 'również',
    'jeden', 'dwa', 'trzy', 'cztery', 'pięć', 'sześć', 'siedem', 'osiem', 'dziewięć', 'dziesięć'
  ]);

  private readonly sentimentLexicon = {
    // Polish sentiment words
    positive: [
      'świetnie', 'doskonale', 'fantastycznie', 'wspaniale', 'idealnie', 'perfect',
      'zadowolony', 'zadowolona', 'bardzo dobry', 'bardzo dobra', 'bardzo dobre',
      'polecam', 'recommend', 'super', 'świetny', 'świetna', 'świetne',
      'profesjonalny', 'profesjonalna', 'profesjonalne', 'profesjonalizm',
      'miło', 'przyjemnie', 'ciekawie', 'interesująco', 'udany', 'udana', 'udane',
      'pomocny', 'pomocna', 'pomocne', 'pomoc', 'empatyczny', 'empatyczna',
      'ładnie', 'pięknie', 'estetycznie', 'stylowo', 'elegancko',
      'szybko', 'sprawnie', 'efektywnie', 'skutecznie', 'dokładnie',
      'warto', 'cena/jakość', 'dobrze', 'lepiej', 'najlepiej'
    ],
    negative: [
      'źle', 'słabo', 'nieudane', 'nieudany', 'nieudana', 'problem', 'problemy',
      'rezygnacja', 'anulować', 'brak', 'brakuje', 'pusta', 'puste',
      'drogo', 'zbyt drogie', 'za drogie', 'niewarto', 'nie polecam',
      'niedobry', 'niedobra', 'niedobre', 'słaby', 'słaba', 'słabe',
      'wolno', 'powoli', 'opóźnienie', 'spóźnienie', 'termin',
      'nieprofesjonalny', 'nieprofesjonalna', 'nieprofesjonalne',
      'niemiło', 'nieprzyjemnie', 'brudno', 'bałagan', 'zaniedbane',
      'niesatysfakcjonujący', 'niesatysfakcjonująca', 'rozczarowujący',
      'kiepsko', 'fatalnie', 'beznadziejnie', 'ogromny', 'ogromna', 'ogromne'
    ]
  };

  async analyzeSatisfaction(
    userId: string,
    dateRange?: { start: Date; end: Date },
    includeBenchmarks: boolean = true
  ): Promise<SatisfactionAnalysis> {
    // Get satisfaction data
    const satisfactionData = await this.getSatisfactionData(userId, dateRange);

    // Get booking data for context
    const bookingData = await this.getBookingData(userId, dateRange);

    // Calculate overall satisfaction score
    const overallSatisfactionScore = this.calculateOverallSatisfaction(satisfactionData);

    // Analyze service-specific satisfaction
    const serviceSatisfactionScores = await this.analyzeServiceSatisfaction(satisfactionData, bookingData);

    // Perform sentiment analysis
    const sentimentAnalysis = await this.performSentimentAnalysis(satisfactionData);

    // Analyze satisfaction trends
    const satisfactionTrends = this.analyzeSatisfactionTrends(satisfactionData);

    // Identify improvement areas
    const improvementAreas = this.identifyImprovementAreas(serviceSatisfactionScores, sentimentAnalysis);

    // Extract positive highlights
    const positiveHighlights = this.extractPositiveHighlights(satisfactionData, sentimentAnalysis);

    // Identify risk indicators
    const riskIndicators = this.identifyRiskIndicators(satisfactionData, sentimentAnalysis, satisfactionTrends);

    // Analyze feedback themes
    const feedbackThemes = this.analyzeFeedbackThemes(satisfactionData);

    // Generate benchmark comparison
    const benchmarkComparison = includeBenchmarks ?
      await this.generateBenchmarkComparison(userId, serviceSatisfactionScores) :
      this.getEmptyBenchmarkComparison();

    // Generate actionable insights
    const actionableInsights = this.generateActionableInsights(
      improvementAreas, riskIndicators, positiveHighlights, feedbackThemes
    );

    return {
      userId,
      overallSatisfactionScore,
      serviceSatisfactionScores,
      sentimentAnalysis,
      satisfactionTrends,
      improvementAreas,
      positiveHighlights,
      riskIndicators,
      feedbackThemes,
      benchmarkComparison,
      actionableInsights,
      lastUpdated: new Date()
    };
  }

  private async getSatisfactionData(userId: string, dateRange?: { start: Date; end: Date }) {
    let query = supabase
      .from('customer_satisfaction')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());
    } else {
      // Default to last 12 months
      const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      query = query.gte('created_at', twelveMonthsAgo.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch satisfaction data: ${error.message}`);
    }

    return data || [];
  }

  private async getBookingData(userId: string, dateRange?: { start: Date; end: Date }) {
    let query = supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch booking data: ${error.message}`);
    }

    return data || [];
  }

  private calculateOverallSatisfaction(satisfactionData: CustomerSatisfaction[]): number {
    if (satisfactionData.length === 0) return 5; // Neutral score

    const weightedScores = satisfactionData.map(data => {
      let weight = 1;

      // More recent feedback gets higher weight
      const daysAgo = (Date.now() - new Date(data.created_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysAgo < 7) weight = 1.5;
      else if (daysAgo < 30) weight = 1.2;
      else if (daysAgo < 90) weight = 1.0;
      else weight = 0.8;

      return (data.overall_satisfaction || 5) * weight;
    });

    const totalWeight = satisfactionData.reduce((sum, data) => {
      const daysAgo = (Date.now() - new Date(data.created_at).getTime()) / (1000 * 60 * 60 * 24);
      let weight = 1;
      if (daysAgo < 7) weight = 1.5;
      else if (daysAgo < 30) weight = 1.2;
      else if (daysAgo < 90) weight = 1.0;
      else weight = 0.8;
      return sum + weight;
    }, 0);

    return totalWeight > 0 ? weightedScores.reduce((a, b) => a + b, 0) / totalWeight : 5;
  }

  private async analyzeServiceSatisfaction(
    satisfactionData: CustomerSatisfaction[],
    bookingData: Booking[]
  ): Promise<ServiceSatisfactionScore[]> {
    const serviceScores: { [serviceId: string]: ServiceSatisfactionScore } = {};

    // Group satisfaction data by service
    satisfactionData.forEach(data => {
      const serviceId = data.service_id;
      if (!serviceId) return;

      if (!serviceScores[serviceId]) {
        serviceScores[serviceId] = {
          serviceId,
          serviceName: `Service ${serviceId}`, // Would fetch actual service name
          serviceType: 'unknown', // Would fetch from services table
          satisfactionScore: 0,
          qualityScore: 0,
          valueScore: 0,
          likelihoodToRecommend: 0,
          feedbackCount: 0,
          averageResponseTime: 0,
          issueResolutionRate: 0,
          sentimentTrend: 'stable',
          keyIssues: [],
          keyPraises: []
        };
      }

      const score = serviceScores[serviceId];
      score.feedbackCount++;
      score.satisfactionScore += data.overall_satisfaction || 5;
      score.qualityScore += data.service_quality_score || 5;
      score.valueScore += data.value_for_money_score || 5;
      score.likelihoodToRecommend += data.likelihood_to_recommend || 5;
    });

    // Calculate averages and analyze sentiment
    for (const serviceId in serviceScores) {
      const score = serviceScores[serviceId];
      const count = score.feedbackCount;

      if (count > 0) {
        score.satisfactionScore /= count;
        score.qualityScore /= count;
        score.valueScore /= count;
        score.likelihoodToRecommend /= count;
      }

      // Analyze feedback for key issues and praises
      const serviceFeedback = satisfactionData.filter(d => d.service_id === serviceId);
      const sentimentAnalysis = await this.analyzeFeedbackSentiment(serviceFeedback);

      score.keyIssues = sentimentAnalysis.issues;
      score.keyPraises = sentimentAnalysis.praises;
      score.sentimentTrend = sentimentAnalysis.trend;

      // Calculate metrics (simplified)
      score.averageResponseTime = 24; // hours - would calculate from actual response times
      score.issueResolutionRate = 0.85; // would calculate from actual resolution data
    }

    return Object.values(serviceScores).sort((a, b) => b.satisfactionScore - a.satisfactionScore);
  }

  private async analyzeFeedbackSentiment(feedback: CustomerSatisfaction[]) {
    const issues: string[] = [];
    const praises: string[] = [];
    let trend: 'improving' | 'stable' | 'declining' = 'stable';

    feedback.forEach(data => {
      if (data.feedback_text) {
        const text = data.feedback_text.toLowerCase();

        // Extract key phrases and sentiment
        if (data.overall_satisfaction && data.overall_satisfaction < 6) {
          issues.push(...this.extractKeyPhrases(text, 'negative'));
        } else if (data.overall_satisfaction && data.overall_satisfaction > 8) {
          praises.push(...this.extractKeyPhrases(text, 'positive'));
        }
      }
    });

    // Analyze trend
    if (feedback.length >= 2) {
      const recent = feedback.slice(0, Math.ceil(feedback.length / 2));
      const older = feedback.slice(Math.ceil(feedback.length / 2));

      const recentAvg = recent.reduce((sum, f) => sum + (f.overall_satisfaction || 5), 0) / recent.length;
      const olderAvg = older.reduce((sum, f) => sum + (f.overall_satisfaction || 5), 0) / older.length;

      if (recentAvg > olderAvg + 0.5) trend = 'improving';
      else if (recentAvg < olderAvg - 0.5) trend = 'declining';
    }

    return { issues, praises, trend };
  }

  private extractKeyPhrases(text: string, sentiment: 'positive' | 'negative'): string[] {
    const words = text.split(/\s+/).filter(word => word.length > 3);
    const keyPhrases: string[] = [];

    // Simple phrase extraction - in production, would use NLP libraries
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      if (this.isSentimentPhrase(phrase, sentiment)) {
        keyPhrases.push(phrase);
      }
    }

    return [...new Set(keyPhrases)].slice(0, 5); // Top 5 unique phrases
  }

  private isSentimentPhrase(phrase: string, sentiment: 'positive' | 'negative'): boolean {
    const lexicon = sentiment === 'positive' ? this.sentimentLexicon.positive : this.sentimentLexicon.negative;
    return lexicon.some(word => phrase.includes(word));
  }

  private async performSentimentAnalysis(satisfactionData: CustomerSatisfaction[]): Promise<SentimentAnalysis> {
    if (satisfactionData.length === 0) {
      return this.getEmptySentimentAnalysis();
    }

    const allFeedbackText = satisfactionData
      .map(d => d.feedback_text)
      .filter(Boolean)
      .join(' ');

    // Calculate overall sentiment
    const sentimentScore = this.calculateSentimentScore(allFeedbackText);
    const overallSentiment = this.determineSentimentLabel(sentimentScore);

    // Analyze emotional tones
    const emotionalTone = this.analyzeEmotionalTones(allFeedbackText);

    // Analyze topic sentiment
    const topicSentiment = this.analyzeTopicSentiment(satisfactionData);

    // Analyze language patterns
    const languageAnalysis = this.analyzeLanguage(allFeedbackText);

    // Identify sentiment drivers
    const sentimentDrivers = this.identifySentimentDrivers(satisfactionData);

    // Find sentiment change points
    const sentimentChangePoints = this.findSentimentChangePoints(satisfactionData);

    return {
      overallSentiment,
      sentimentScore,
      confidence: Math.min(0.95, 0.7 + (satisfactionData.length * 0.05)), // Confidence increases with more data
      emotionalTone,
      topicSentiment,
      languageAnalysis,
      sentimentDrivers,
      sentimentChangePoints
    };
  }

  private getEmptySentimentAnalysis(): SentimentAnalysis {
    return {
      overallSentiment: 'neutral',
      sentimentScore: 0,
      confidence: 0,
      emotionalTone: [],
      topicSentiment: [],
      languageAnalysis: {
        language: 'pl',
        complexity: 'moderate',
        formality: 'neutral',
        keyPhrases: [],
        namedEntities: [],
        linguisticPatterns: []
      },
      sentimentDrivers: [],
      sentimentChangePoints: []
    };
  }

  private calculateSentimentScore(text: string): number {
    if (!text || text.trim().length === 0) return 0;

    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      // Remove punctuation
      const cleanWord = word.replace(/[.,!?;:()]/g, '');

      if (this.sentimentLexicon.positive.includes(cleanWord)) {
        positiveCount++;
      } else if (this.sentimentLexicon.negative.includes(cleanWord)) {
        negativeCount++;
      }
    });

    const totalSentimentWords = positiveCount + negativeCount;
    if (totalSentimentWords === 0) return 0;

    // Calculate normalized sentiment score (-1 to 1)
    return (positiveCount - negativeCount) / Math.sqrt(totalSentimentWords);
  }

  private determineSentimentLabel(score: number): 'positive' | 'neutral' | 'negative' {
    if (score > this.sentimentThresholds.positive) return 'positive';
    if (score < this.sentimentThresholds.negative) return 'negative';
    return 'neutral';
  }

  private analyzeEmotionalTones(text: string): EmotionalTone[] {
    // Simplified emotion detection - in production, would use sophisticated emotion analysis
    const emotionPatterns = {
      joy: ['świetnie', 'fantastycznie', 'wspaniale', 'cieszyć', 'radość', 'szczęście'],
      trust: ['profesjonalny', 'zaufanie', 'pewnie', 'rzetelny', 'dokładnie'],
      anticipation: ['ciekawie', 'oczekiwać', 'nadzieja', 'wkrótce'],
      surprise: ['niespodzianka', 'zaskoczenie', 'niespodziewanie'],
      sadness: ['smutny', 'smutno', 'żal', 'przykro'],
      anger: ['złość', 'wściekły', 'denerwować', 'irytować'],
      fear: ['strach', 'obawiać', 'niepokój', 'lęk'],
      disgust: ['odpychać', 'brzydki', 'okropny', 'niesmak']
    };

    const tones: EmotionalTone[] = [];
    const words = text.toLowerCase().split(/\s+/);

    Object.entries(emotionPatterns).forEach(([emotion, patterns]) => {
      let matches = 0;
      let examples: string[] = [];

      patterns.forEach(pattern => {
        if (text.includes(pattern)) {
          matches++;
          examples.push(pattern);
        }
      });

      if (matches > 0) {
        tones.push({
          emotion: emotion as EmotionalTone['emotion'],
          intensity: Math.min(1, matches / 3), // Normalize intensity
          context: `Detected ${matches} instances of ${emotion} in feedback`,
          examples
        });
      }
    });

    return tones.sort((a, b) => b.intensity - a.intensity);
  }

  private analyzeTopicSentiment(satisfactionData: CustomerSatisfaction[]): TopicSentiment[] {
    const topics = [
      { name: 'service quality', keywords: ['jakość', 'profesjonalny', 'dokładny', 'starannie'] },
      { name: 'price value', keywords: ['cena', 'wartość', 'drogo', 'taniej', 'opłacalny'] },
      { name: 'staff', keywords: ['personel', 'obsługa', 'miły', 'pomocny', 'uprzejmy'] },
      { name: 'environment', keywords: ['salon', 'wnętrze', 'czysto', 'estetyka', 'atmosfera'] },
      { name: 'convenience', keywords: ['dogodnie', 'szybko', 'łatwo', 'blisko', 'dostępny'] },
      { name: 'results', keywords: ['efekt', 'wynik', 'rezultat', 'poprawa', 'skuteczność'] }
    ];

    const topicAnalysis: TopicSentiment[] = [];

    topics.forEach(topic => {
      let sentimentSum = 0;
      let frequency = 0;
      let examples: string[] = [];

      satisfactionData.forEach(data => {
        if (data.feedback_text) {
          const text = data.feedback_text.toLowerCase();
          const hasKeyword = topic.keywords.some(keyword => text.includes(keyword));

          if (hasKeyword) {
            frequency++;
            sentimentSum += this.calculateSentimentScore(text);
            if (examples.length < 3) {
              examples.push(data.feedback_text.substring(0, 100) + '...');
            }
          }
        }
      });

      if (frequency > 0) {
        const avgSentiment = sentimentSum / frequency;
        topicAnalysis.push({
          topic: topic.name,
          sentiment: this.determineSentimentLabel(avgSentiment),
          relevance: frequency / satisfactionData.length,
          frequency,
          examples,
          impact: Math.abs(avgSentiment) > 0.3 ? 'high' :
                  Math.abs(avgSentiment) > 0.1 ? 'medium' : 'low'
        });
      }
    });

    return topicAnalysis.sort((a, b) => b.relevance - a.relevance);
  }

  private analyzeLanguage(text: string): LanguageAnalysis {
    // Detect language (simplified)
    const polishWords = text.match(/\b[aąbcćdeęfghijklłmnoópqrsśtuwxyzźż]+\b/gi)?.length || 0;
    const englishWords = text.match(/\b[a-zA-Z]+\b/gi)?.length || 0;
    const language = polishWords > englishWords ? 'pl' : 'en';

    // Analyze complexity
    const avgWordLength = text.split(/\s+/).reduce((sum, word) => sum + word.length, 0) / text.split(/\s+/).length;
    const complexity = avgWordLength > 7 ? 'complex' : avgWordLength > 5 ? 'moderate' : 'simple';

    // Analyze formality
    const formalIndicators = ['proszę', 'dziękuję', 'szanowny', 'pań', 'pani'];
    const informalIndicators = ['cześć', 'hej', 'super', 'świetnie'];
    const formalCount = formalIndicators.filter(ind => text.toLowerCase().includes(ind)).length;
    const informalCount = informalIndicators.filter(ind => text.toLowerCase().includes(ind)).length;
    const formality = formalCount > informalCount ? 'formal' :
                     informalCount > formalCount ? 'informal' : 'neutral';

    // Extract key phrases
    const keyPhrases = this.extractKeyPhrases(text, 'positive')
      .concat(this.extractKeyPhrases(text, 'negative'))
      .slice(0, 10);

    // Extract named entities (simplified)
    const namedEntities = this.extractNamedEntities(text);

    // Analyze linguistic patterns
    const linguisticPatterns = this.analyzeLinguisticPatterns(text);

    return {
      language,
      complexity,
      formality,
      keyPhrases,
      namedEntities,
      linguisticPatterns
    };
  }

  private extractNamedEntities(text: string): NamedEntity[] {
    const entities: NamedEntity[] = [];

    // Simple pattern matching for entities
    const patterns = {
      MONEY: /\b\d+\s*(zł|pln|euro|€)\b/gi,
      TIME: /\b(\d{1,2}:\d{2}|\d+\s*(godz|godzin|minut))\b/gi,
      PERSON: /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g,
      LOCATION: /\b([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)?)\b/g
    };

    Object.entries(patterns).forEach(([type, pattern]) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          entities.push({
            text: match,
            type: type as NamedEntity['type'],
            confidence: 0.7, // Simplified confidence
            context: text.substring(Math.max(0, text.indexOf(match) - 20),
                                   text.indexOf(match) + match.length + 20)
          });
        });
      }
    });

    return entities.slice(0, 10); // Limit to top 10 entities
  }

  private analyzeLinguisticPatterns(text: string): LinguisticPattern[] {
    const patterns: LinguisticPattern[] = [];

    // Analyze common patterns
    const commonPatterns = [
      { pattern: 'nie polecam', sentiment: 'negative' as const },
      { pattern: 'polecam', sentiment: 'positive' as const },
      { pattern: 'profesjonalny', sentiment: 'positive' as const },
      { pattern: 'problem', sentiment: 'negative' as const },
      { pattern: 'polecam', sentiment: 'positive' as const },
      { pattern: 'brak', sentiment: 'negative' as const },
      { pattern: 'świetnie', sentiment: 'positive' as const },
      { pattern: 'źle', sentiment: 'negative' as const }
    ];

    commonPatterns.forEach(({ pattern, sentiment }) => {
      const regex = new RegExp(pattern, 'gi');
      const matches = text.match(regex);
      if (matches) {
        patterns.push({
          pattern,
          frequency: matches.length,
          sentiment,
          examples: matches.slice(0, 3)
        });
      }
    });

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  private identifySentimentDrivers(satisfactionData: CustomerSatisfaction[]): SentimentDriver[] {
    const drivers: SentimentDriver[] = [];
    const categories = ['service_quality', 'price', 'staff', 'environment', 'convenience', 'communication'];

    categories.forEach(category => {
      let totalImpact = 0;
      let frequency = 0;
      let examples: string[] = [];

      satisfactionData.forEach(data => {
        if (data.feedback_text) {
          const text = data.feedback_text.toLowerCase();
          const categoryKeywords = this.getCategoryKeywords(category);
          const hasCategoryKeyword = categoryKeywords.some(keyword => text.includes(keyword));

          if (hasCategoryKeyword) {
            frequency++;
            const sentiment = this.calculateSentimentScore(text);
            totalImpact += sentiment;

            if (examples.length < 3) {
              examples.push(data.feedback_text.substring(0, 100) + '...');
            }
          }
        }
      });

      if (frequency > 0) {
        drivers.push({
          driver: category,
          impact: totalImpact / frequency,
          frequency,
          examples,
          category: category as SentimentDriver['category']
        });
      }
    });

    return drivers.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  }

  private getCategoryKeywords(category: string): string[] {
    const keywords = {
      service_quality: ['jakość', 'profesjonalny', 'dokładny', 'starannie', 'precyzyjny'],
      price: ['cena', 'wartość', 'drogo', 'taniej', 'opłacalny', 'koszt'],
      staff: ['personel', 'obsługa', 'miły', 'pomocny', 'uprzejmy', 'fachowiec'],
      environment: ['salon', 'wnętrze', 'czysto', 'estetyka', 'atmosfera', 'wystrój'],
      convenience: ['dogodnie', 'szybko', 'łatwo', 'blisko', 'dostępny', 'wygodnie'],
      communication: ['komunikacja', 'informacja', 'kontakt', 'powiedziano', 'wyjaśniono']
    };

    return keywords[category as keyof typeof keywords] || [];
  }

  private findSentimentChangePoints(satisfactionData: CustomerSatisfaction[]): SentimentChangePoint[] {
    const changePoints: SentimentChangePoint[] = [];

    if (satisfactionData.length < 3) return changePoints;

    // Sort by date
    const sortedData = satisfactionData.sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Find significant changes
    for (let i = 1; i < sortedData.length; i++) {
      const current = sortedData[i];
      const previous = sortedData[i - 1];

      const currentSentiment = this.calculateSentimentScore(current.feedback_text || '');
      const previousSentiment = this.calculateSentimentScore(previous.feedback_text || '');

      const changeMagnitude = Math.abs(currentSentiment - previousSentiment);

      if (changeMagnitude > 0.5) { // Significant change threshold
        changePoints.push({
          date: new Date(current.created_at),
          previousSentiment,
          newSentiment: currentSentiment,
          changeMagnitude,
          likelyCauses: this.inferChangeCauses(current, previous),
          relatedEvents: [current.service_id || 'unknown', previous.service_id || 'unknown']
        });
      }
    }

    return changePoints;
  }

  private inferChangeCauses(current: CustomerSatisfaction, previous: CustomerSatisfaction): string[] {
    const causes: string[] = [];

    // Compare scores
    if (current.overall_satisfaction && previous.overall_satisfaction) {
      const scoreChange = current.overall_satisfaction - previous.overall_satisfaction;

      if (scoreChange > 2) {
        causes.push('significant_improvement');
      } else if (scoreChange < -2) {
        causes.push('significant_decline');
      }
    }

    // Analyze feedback text changes
    if (current.feedback_text && previous.feedback_text) {
      const currentIssues = this.extractKeyPhrases(current.feedback_text, 'negative');
      const previousIssues = this.extractKeyPhrases(previous.feedback_text, 'negative');

      if (currentIssues.length > previousIssues.length) {
        causes.push('new_issues_emerged');
      } else if (currentIssues.length < previousIssues.length) {
        causes.push('issues_resolved');
      }
    }

    return causes;
  }

  private analyzeSatisfactionTrends(satisfactionData: CustomerSatisfaction[]): SatisfactionTrend[] {
    const trends: SatisfactionTrend[] = [];

    // Group by month
    const monthlyData: { [month: string]: CustomerSatisfaction[] } = {};

    satisfactionData.forEach(data => {
      const date = new Date(data.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = [];
      }
      monthlyData[monthKey].push(data);
    });

    // Calculate monthly metrics
    Object.entries(monthlyData).forEach(([month, data]) => {
      const overallScore = data.reduce((sum, d) => sum + (d.overall_satisfaction || 5), 0) / data.length;
      const qualityScore = data.reduce((sum, d) => sum + (d.service_quality_score || 5), 0) / data.length;
      const valueScore = data.reduce((sum, d) => sum + (d.value_for_money_score || 5), 0) / data.length;
      const recommendationScore = data.reduce((sum, d) => sum + (d.likelihood_to_recommend || 5), 0) / data.length;
      const responseRate = data.length / 10; // Simplified - would calculate based on total requests

      trends.push({
        period: month,
        overallScore,
        qualityScore,
        valueScore,
        recommendationScore,
        responseRate,
        trendDirection: 'stable', // Would calculate based on previous months
        significantEvents: [] // Would add notable events
      });
    });

    return trends.sort((a, b) => a.period.localeCompare(b.period));
  }

  private identifyImprovementAreas(
    serviceScores: ServiceSatisfactionScore[],
    sentimentAnalysis: SentimentAnalysis
  ): ImprovementArea[] {
    const improvements: ImprovementArea[] = [];

    // Find services with low satisfaction
    serviceScores.forEach(service => {
      if (service.satisfactionScore < 6) {
        improvements.push({
          area: `${service.serviceName} - Overall Quality`,
          currentScore: service.satisfactionScore,
          targetScore: 8,
          impact: service.satisfactionScore < 4 ? 'high' : 'medium',
          effort: 'medium',
          priority: service.satisfactionScore < 4 ? 'critical' : 'high',
          recommendations: this.generateServiceImprovementRecommendations(service),
          expectedROI: this.calculateExpectedROI(service.satisfactionScore, 8),
          timeline: '3_months'
        });
      }

      if (service.valueScore < 6) {
        improvements.push({
          area: `${service.serviceName} - Price Value`,
          currentScore: service.valueScore,
          targetScore: 8,
          impact: 'medium',
          effort: 'low',
          priority: 'medium',
          recommendations: ['Review pricing structure', 'Add value packages', 'Communicate benefits better'],
          expectedROI: this.calculateExpectedROI(service.valueScore, 8),
          timeline: '1_month'
        });
      }
    });

    // Add improvements based on sentiment drivers
    sentimentAnalysis.sentimentDrivers
      .filter(driver => driver.impact < -0.3)
      .forEach(driver => {
        improvements.push({
          area: driver.driver,
          currentScore: (driver.impact + 1) * 5, // Convert to 0-10 scale
          targetScore: 8,
          impact: driver.impact < -0.6 ? 'high' : 'medium',
          effort: 'medium',
          priority: 'high',
          recommendations: this.generateDriverImprovementRecommendations(driver),
          expectedROI: this.calculateExpectedROI((driver.impact + 1) * 5, 8),
          timeline: '2_months'
        });
      });

    return improvements.sort((a, b) => {
      const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  }

  private generateServiceImprovementRecommendations(service: ServiceSatisfactionScore): string[] {
    const recommendations: string[] = [];

    if (service.keyIssues.includes('quality')) {
      recommendations.push('Enhance quality control procedures');
      recommendations.push('Provide additional staff training');
    }

    if (service.keyIssues.includes('time') || service.keyIssues.includes('speed')) {
      recommendations.push('Optimize service delivery time');
      recommendations.push('Improve scheduling efficiency');
    }

    if (service.keyIssues.includes('communication')) {
      recommendations.push('Improve staff communication skills');
      recommendations.push('Enhance pre-service information');
    }

    if (service.keyIssues.includes('price')) {
      recommendations.push('Review pricing strategy');
      recommendations.push('Create value-added packages');
    }

    if (recommendations.length === 0) {
      recommendations.push('Conduct detailed service review');
      recommendations.push('Gather specific customer feedback');
    }

    return recommendations;
  }

  private generateDriverImprovementRecommendations(driver: SentimentDriver): string[] {
    const recommendations: { [key: string]: string[] } = {
      service_quality: [
        'Implement quality assurance protocols',
        'Enhance staff training programs',
        'Improve service delivery processes'
      ],
      price: [
        'Review pricing structure',
        'Create tiered service options',
        'Improve value communication'
      ],
      staff: [
        'Provide customer service training',
        'Improve staff selection process',
        'Implement performance incentives'
      ],
      environment: [
        'Upgrade facility aesthetics',
        'Improve cleanliness protocols',
        'Enhance ambient atmosphere'
      ],
      convenience: [
        'Streamline booking process',
        'Improve location accessibility',
        'Extend service hours'
      ],
      communication: [
        'Enhance pre-service communication',
        'Improve information clarity',
        'Implement regular follow-ups'
      ]
    };

    return recommendations[driver.category] || ['Conduct detailed analysis', 'Gather specific feedback'];
  }

  private calculateExpectedROI(currentScore: number, targetScore: number): number {
    // Simplified ROI calculation
    const scoreImprovement = targetScore - currentScore;
    const expectedRetentionIncrease = scoreImprovement * 0.05; // 5% retention increase per point
    const expectedRevenueIncrease = scoreImprovement * 0.03; // 3% revenue increase per point

    return Math.round((expectedRetentionIncrease + expectedRevenueIncrease) * 100);
  }

  private extractPositiveHighlights(
    satisfactionData: CustomerSatisfaction[],
    sentimentAnalysis: SentimentAnalysis
  ): PositiveHighlight[] {
    const highlights: PositiveHighlight[] = [];

    // Extract positive feedback
    satisfactionData
      .filter(data => data.overall_satisfaction && data.overall_satisfaction > 8)
      .forEach(data => {
        if (data.feedback_text) {
          const positivePhrases = this.extractKeyPhrases(data.feedback_text, 'positive');

          positivePhrases.forEach(phrase => {
            const existingHighlight = highlights.find(h => h.highlight === phrase);

            if (existingHighlight) {
              existingHighlight.frequency++;
              if (existingHighlight.quotes.length < 3) {
                existingHighlight.quotes.push(data.feedback_text.substring(0, 100) + '...');
              }
            } else {
              highlights.push({
                highlight: phrase,
                category: this.categorizeHighlight(phrase),
                frequency: 1,
                impact: 0.8, // Simplified impact
                quotes: [data.feedback_text.substring(0, 100) + '...'],
                actionableInsights: this.generateHighlightInsights(phrase)
              });
            }
          });
        }
      });

    return highlights.sort((a, b) => b.frequency - a.frequency).slice(0, 10);
  }

  private categorizeHighlight(phrase: string): PositiveHighlight['category'] {
    if (phrase.includes('profesjonaln') || phrase.includes('jakość')) return 'service_excellence';
    if (phrase.includes('miły') || phrase.includes('pomocn') || phrase.includes('obsług')) return 'staff_quality';
    if (phrase.includes('cena') || phrase.includes('wartość')) return 'value';
    if (phrase.includes('atmosfera') || phrase.includes('salon')) return 'experience';
    if (phrase.includes('efekt') || phrase.includes('wynik')) return 'results';
    return 'experience';
  }

  private generateHighlightInsights(phrase: string): string[] {
    const insights: { [key: string]: string[] } = {
      'service_excellence': [
        'Emphasize quality in marketing materials',
        'Train staff on maintaining high standards',
        'Use as testimonial material'
      ],
      'staff_quality': [
        'Recognize staff achievements',
        'Use in recruitment materials',
        'Leverage for customer trust building'
      ],
      'value': [
        'Highlight value proposition',
        'Use in pricing communication',
        'Create value-focused marketing campaigns'
      ],
      'experience': [
        'Enhance experience marketing',
        'Use in social media content',
        'Share in customer testimonials'
      ],
      'results': [
        'Showcase before/after results',
        'Use in case studies',
        'Feature in success stories'
      ]
    };

    // Find matching category
    for (const [category, categoryInsights] of Object.entries(insights)) {
      if (phrase.includes('profesjonaln') || phrase.includes('jakość')) {
        return insights['service_excellence'];
      }
      if (phrase.includes('miły') || phrase.includes('obsług')) {
        return insights['staff_quality'];
      }
      if (phrase.includes('cena') || phrase.includes('wartość')) {
        return insights['value'];
      }
    }

    return ['Use in marketing materials', 'Share in customer testimonials', 'Leverage for brand building'];
  }

  private identifyRiskIndicators(
    satisfactionData: CustomerSatisfaction[],
    sentimentAnalysis: SentimentAnalysis,
    trends: SatisfactionTrend[]
  ): RiskIndicator[] {
    const risks: RiskIndicator[] = [];

    // Low satisfaction scores
    const recentLowScores = satisfactionData.filter(data =>
      data.overall_satisfaction && data.overall_satisfaction < 5 &&
      (Date.now() - new Date(data.created_at).getTime()) < 30 * 24 * 60 * 60 * 1000 // Last 30 days
    );

    if (recentLowScores.length > 0) {
      risks.push({
        risk: 'Recent Low Satisfaction Scores',
        severity: recentLowScores.length > 2 ? 'critical' : 'high',
        probability: 0.8,
        impact: 0.9,
        earlyWarningSigns: ['Decreasing satisfaction scores', 'Negative feedback patterns'],
        mitigationStrategies: [
          'Immediate follow-up with affected customers',
          'Service quality review',
          'Staff coaching and training'
        ],
        monitoringPlan: 'Daily satisfaction monitoring, Weekly trend analysis'
      });
    }

    // Declining trends
    const decliningTrends = trends.filter(trend => trend.trendDirection === 'decreasing');
    if (decliningTrends.length > 1) {
      risks.push({
        risk: 'Declining Satisfaction Trend',
        severity: 'high',
        probability: 0.7,
        impact: 0.8,
        earlyWarningSigns: ['Consistent decline in scores', 'Negative sentiment increase'],
        mitigationStrategies: [
          'Comprehensive service review',
          'Customer feedback analysis',
          'Process improvement initiatives'
        ],
        monitoringPlan: 'Weekly trend monitoring, Monthly comprehensive reviews'
      });
    }

    // Negative sentiment drivers
    const strongNegativeDrivers = sentimentAnalysis.sentimentDrivers.filter(
      driver => driver.impact < -0.5
    );

    if (strongNegativeDrivers.length > 0) {
      risks.push({
        risk: 'Strong Negative Sentiment Drivers',
        severity: 'medium',
        probability: 0.6,
        impact: 0.7,
        earlyWarningSigns: ['Consistent negative feedback patterns', 'Specific issue areas'],
        mitigationStrategies: [
          'Address specific driver issues',
          'Implement targeted improvements',
          'Monitor related metrics closely'
        ],
        monitoringPlan: 'Continuous sentiment analysis, Driver-specific monitoring'
      });
    }

    return risks;
  }

  private analyzeFeedbackThemes(satisfactionData: CustomerSatisfaction[]): FeedbackTheme[] {
    const themes: { [key: string]: FeedbackTheme } = {};

    satisfactionData.forEach(data => {
      if (data.feedback_text) {
        const text = data.feedback_text.toLowerCase();
        const sentiment = this.calculateSentimentScore(text);
        const category = sentiment > 0.1 ? 'praise' :
                        sentiment < -0.1 ? 'complaint' :
                        'neutral';

        // Extract potential themes (simplified)
        const potentialThemes = this.extractPotentialThemes(text);

        potentialThemes.forEach(theme => {
          if (!themes[theme]) {
            themes[theme] = {
              theme,
              category,
              frequency: 0,
              sentiment: this.determineSentimentLabel(sentiment),
              subThemes: [],
              examples: [],
              evolution: []
            };
          }

          themes[theme].frequency++;
          if (themes[theme].examples.length < 3) {
            themes[theme].examples.push(data.feedback_text.substring(0, 100) + '...');
          }
        });
      }
    });

    return Object.values(themes).sort((a, b) => b.frequency - a.frequency);
  }

  private extractPotentialThemes(text: string): string[] {
    const themes: string[] = [];

    // Common theme keywords
    const themeKeywords = {
      'cleanliness': ['czysto', 'czysty', 'brudno', 'dezynfekcja', 'porządek'],
      'timing': ['czas', 'termin', 'opóźnienie', 'punktualność', 'szybko'],
      'communication': ['komunikacja', 'informacja', 'kontakt', 'wyjaśnienie'],
      'professionalism': ['profesjonalny', 'fachowiec', 'ekspert', 'kompetencje'],
      'results': ['efekt', 'wynik', 'rezultat', 'poprawa', 'skuteczność'],
      'price': ['cena', 'koszt', 'wartość', 'drogi', 'tani'],
      'environment': ['atmosfera', 'wnętrze', 'salon', 'wystrój', 'komfort']
    };

    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        themes.push(theme);
      }
    });

    return themes;
  }

  private async generateBenchmarkComparison(
    userId: string,
    serviceScores: ServiceSatisfactionScore[]
  ): Promise<BenchmarkComparison> {
    // In production, this would fetch actual benchmark data
    const mockBenchmarkData = {
      service_quality: { average: 7.8, topQuartile: 9.2, industryAverage: 7.5 },
      price_value: { average: 7.2, topQuartile: 8.5, industryAverage: 7.0 },
      staff_service: { average: 8.1, topQuartile: 9.4, industryAverage: 7.8 },
      environment: { average: 8.3, topQuartile: 9.3, industryAverage: 8.0 }
    };

    const comparisons: BenchmarkComparison[] = [];

    Object.entries(mockBenchmarkData).forEach(([category, benchmark]) => {
      let userScore = 7.5; // Default user score

      // Get actual user score for this category
      if (category === 'service_quality') {
        userScore = serviceScores.length > 0 ?
          serviceScores.reduce((sum, s) => sum + s.qualityScore, 0) / serviceScores.length : 7.5;
      }

      const percentileRank = this.calculatePercentileRank(userScore, benchmark.average, benchmark.topQuartile);
      const trend = userScore >= benchmark.topQuartile ? 'above_average' :
                    userScore >= benchmark.average ? 'average' : 'below_average';

      comparisons.push({
        category,
        userScore,
        benchmarkAverage: benchmark.average,
        topQuartile: benchmark.topQuartile,
        industryAverage: benchmark.industryAverage,
        percentileRank,
        trend,
        gaps: trend === 'below_average' ? [`Below average by ${(benchmark.average - userScore).toFixed(1)} points`] : [],
        strengths: trend === 'above_average' ? [`Exceeds benchmark by ${(userScore - benchmark.average).toFixed(1)} points`] : []
      });
    });

    return comparisons[0]; // Return the first comparison as per interface
  }

  private getEmptyBenchmarkComparison(): BenchmarkComparison {
    return {
      category: 'overall',
      userScore: 0,
      benchmarkAverage: 0,
      topQuartile: 0,
      industryAverage: 0,
      percentileRank: 0,
      trend: 'average',
      gaps: [],
      strengths: []
    };
  }

  private calculatePercentileRank(userScore: number, average: number, topQuartile: number): number {
    if (userScore >= topQuartile) return 75 + ((userScore - topQuartile) / (10 - topQuartile)) * 25;
    if (userScore >= average) return 50 + ((userScore - average) / (topQuartile - average)) * 25;
    return (userScore / average) * 50;
  }

  private generateActionableInsights(
    improvementAreas: ImprovementArea[],
    riskIndicators: RiskIndicator[],
    positiveHighlights: PositiveHighlight[],
    feedbackThemes: FeedbackTheme[]
  ): ActionableInsight[] {
    const insights: ActionableInsight[] = [];

    // Generate insights from improvement areas
    improvementAreas.slice(0, 3).forEach(area => {
      insights.push({
        insight: `Improve ${area.area} from ${area.currentScore.toFixed(1)} to ${area.targetScore}`,
        type: 'improvement',
        priority: area.priority,
        expectedImpact: area.expectedROI,
        effort: area.effort,
        timeline: area.timeline,
        responsibleParty: 'Service Management Team',
        metrics: ['Satisfaction Score', 'Customer Feedback', 'Service Quality Metrics'],
        dependencies: ['Staff Training', 'Process Review', 'Quality Assurance']
      });
    });

    // Generate insights from risk indicators
    riskIndicators.slice(0, 2).forEach(risk => {
      insights.push({
        insight: `Address risk: ${risk.risk}`,
        type: 'risk_mitigation',
        priority: risk.severity === 'critical' ? 'critical' : 'high',
        expectedImpact: Math.round(risk.impact * 100),
        effort: 'medium',
        timeline: '1_month',
        responsibleParty: 'Quality Assurance Team',
        metrics: ['Risk Indicator Score', 'Customer Complaint Rate', 'Satisfaction Trends'],
        dependencies: ['Monitoring Systems', 'Response Protocols', 'Staff Training']
      });
    });

    // Generate insights from positive highlights
    positiveHighlights.slice(0, 2).forEach(highlight => {
      insights.push({
        insight: `Leverage positive feedback: ${highlight.highlight}`,
        type: 'leverage_point',
        priority: 'medium',
        expectedImpact: Math.round(highlight.impact * 50),
        effort: 'low',
        timeline: '2_weeks',
        responsibleParty: 'Marketing Team',
        metrics: ['Marketing Engagement', 'Customer Referrals', 'Brand Perception'],
        dependencies: ['Content Creation', 'Testimonial Collection', 'Social Media Management']
      });
    });

    return insights.sort((a, b) => {
      const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  }

  async recordSatisfaction(
    userId: string,
    bookingId: string,
    serviceId: string,
    satisfactionData: {
      overallSatisfaction: number;
      serviceQualityScore?: number;
      valueForMoneyScore?: number;
      likelihoodToRecommend?: number;
      feedbackText?: string;
    }
  ): Promise<void> {
    // Analyze sentiment of feedback text
    let sentimentScore = 0;
    let sentimentLabel = 'neutral';
    let sentimentConfidence = 0.5;

    if (satisfactionData.feedbackText) {
      sentimentScore = this.calculateSentimentScore(satisfactionData.feedbackText);
      sentimentLabel = this.determineSentimentLabel(sentimentScore);
      sentimentConfidence = Math.min(0.95, 0.7 + Math.abs(sentimentScore));
    }

    // Extract keywords from feedback
    const feedbackKeywords = satisfactionData.feedbackText ?
      this.extractKeyPhrases(satisfactionData.feedbackText, 'positive')
        .concat(this.extractKeyPhrases(satisfactionData.feedbackText, 'negative')) : [];

    // Generate feedback summary
    const feedbackSummary = satisfactionData.feedbackText ?
      satisfactionData.feedbackText.substring(0, 200) + (satisfactionData.feedbackText.length > 200 ? '...' : '') : '';

    const { error } = await supabase
      .from('customer_satisfaction')
      .insert({
        user_id: userId,
        booking_id: bookingId,
        service_id: serviceId,
        overall_satisfaction: satisfactionData.overallSatisfaction,
        service_quality_score: satisfactionData.serviceQualityScore,
        value_for_money_score: satisfactionData.valueForMoneyScore,
        likelihood_to_recommend: satisfactionData.likelihoodToRecommend,
        feedback_text: satisfactionData.feedbackText,
        sentiment_score: sentimentScore,
        sentiment_label: sentimentLabel,
        sentiment_confidence: sentimentConfidence,
        feedback_keywords: feedbackKeywords,
        feedback_summary: feedbackSummary,
        requires_follow_up: satisfactionData.overallSatisfaction < 6,
        follow_up_status: 'pending',
        auto_response_sent: false
      });

    if (error) {
      throw new Error(`Failed to record satisfaction: ${error.message}`);
    }
  }

  async triggerFollowUpActions(
    satisfactionId: string,
    followUpType: 'immediate' | 'scheduled' | 'manual' = 'scheduled'
  ): Promise<void> {
    // Get satisfaction data
    const { data: satisfaction, error: fetchError } = await supabase
      .from('customer_satisfaction')
      .select('*')
      .eq('id', satisfactionId)
      .single();

    if (fetchError || !satisfaction) {
      throw new Error('Failed to fetch satisfaction data');
    }

    // Determine follow-up actions based on satisfaction score
    const actions: string[] = [];

    if (satisfaction.overall_satisfaction && satisfaction.overall_satisfaction < 4) {
      actions.push('immediate_manager_contact');
      actions.push('service_recovery_offer');
      actions.push('detailed_feedback_request');
    } else if (satisfaction.overall_satisfaction && satisfaction.overall_satisfaction < 6) {
      actions.push('service_improvement_notification');
      actions.push('follow_up_survey');
    } else if (satisfaction.overall_satisfaction && satisfaction.overall_satisfaction > 9) {
      actions.push('thank_you_message');
      actions.push('referral_request');
      actions.push('testimonial_request');
    }

    // Update satisfaction record
    const { error: updateError } = await supabase
      .from('customer_satisfaction')
      .update({
        follow_up_status: 'initiated',
        follow_up_date: new Date().toISOString(),
        auto_response_sent: true
      })
      .eq('id', satisfactionId);

    if (updateError) {
      throw new Error(`Failed to update satisfaction record: ${updateError.message}`);
    }

    // Here you would integrate with your communication system to send the actual follow-ups
    console.log(`Triggering follow-up actions for satisfaction ${satisfactionId}:`, actions);
  }

  async getSatisfactionMetrics(
    dateRange?: { start: Date; end: Date },
    serviceId?: string
  ): Promise<any> {
    let query = supabase
      .from('customer_satisfaction')
      .select('*');

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());
    }

    if (serviceId) {
      query = query.eq('service_id', serviceId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch satisfaction metrics: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return {
        totalResponses: 0,
        averageSatisfaction: 0,
        satisfactionDistribution: {},
        sentimentDistribution: {},
        trends: []
      };
    }

    // Calculate metrics
    const totalResponses = data.length;
    const averageSatisfaction = data.reduce((sum, d) => sum + (d.overall_satisfaction || 5), 0) / totalResponses;

    const satisfactionDistribution = data.reduce((acc, d) => {
      const score = d.overall_satisfaction || 5;
      const range = this.getSatisfactionRange(score);
      acc[range] = (acc[range] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sentimentDistribution = data.reduce((acc, d) => {
      const sentiment = d.sentiment_label || 'neutral';
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalResponses,
      averageSatisfaction,
      satisfactionDistribution,
      sentimentDistribution,
      trends: [] // Would calculate trends if we have more data
    };
  }

  private getSatisfactionRange(score: number): string {
    if (score >= 9) return '9-10';
    if (score >= 8) return '8-8.9';
    if (score >= 7) return '7-7.9';
    if (score >= 6) return '6-6.9';
    if (score >= 5) return '5-5.9';
    if (score >= 4) return '4-4.9';
    if (score >= 3) return '3-3.9';
    if (score >= 2) return '2-2.9';
    return '1-1.9';
  }
}

export const satisfactionSentimentEngine = new SatisfactionSentimentEngine();