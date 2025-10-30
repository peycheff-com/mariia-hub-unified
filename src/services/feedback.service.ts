// Comprehensive Client Feedback and Satisfaction Measurement Service
// For luxury beauty/fitness platform

import { supabase } from '@/integrations/supabase/client';
import type {
  FeedbackSurvey,
  SurveyQuestion,
  FeedbackSubmission,
  FeedbackResponse,
  SatisfactionMetric,
  NPSMeasurement,
  CESMeasurement,
  SentimentAnalysis,
  FeedbackTheme,
  ServiceRecoveryCase,
  SatisfactionAlert,
  ClientSatisfactionPrediction,
  FeedbackDashboard,
  SurveyResponseData,
  SurveyType,
  SatisfactionMetricType,
  RecoveryPriority,
  AlertSeverity,
  AlertType,
  ServiceType,
  SubmissionSource
} from '@/types/feedback';

export class FeedbackService {
  // ========================================
  // SURVEY MANAGEMENT
  // ========================================

  /**
   * Get active surveys for a specific service type
   */
  async getActiveSurveys(serviceType?: ServiceType): Promise<FeedbackSurvey[]> {
    try {
      let query = supabase
        .from('feedback_surveys')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (serviceType && serviceType !== 'all') {
        query = query.or(`service_type.eq.${serviceType},service_type.eq.all`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active surveys:', error);
      throw error;
    }
  }

  /**
   * Get survey with questions
   */
  async getSurveyWithQuestions(surveyId: string): Promise<{
    survey: FeedbackSurvey;
    questions: SurveyQuestion[];
  }> {
    try {
      const { data: survey, error: surveyError } = await supabase
        .from('feedback_surveys')
        .select('*')
        .eq('id', surveyId)
        .single();

      if (surveyError) throw surveyError;

      const { data: questions, error: questionsError } = await supabase
        .from('survey_questions')
        .select('*')
        .eq('survey_id', surveyId)
        .order('display_order', { ascending: true });

      if (questionsError) throw questionsError;

      return {
        survey,
        questions: questions || []
      };
    } catch (error) {
      console.error('Error fetching survey with questions:', error);
      throw error;
    }
  }

  /**
   * Create new feedback submission
   */
  async createSubmission(
    surveyId: string,
    clientId: string,
    submissionData: {
      bookingId?: string;
      serviceId?: string;
      staffId?: string;
      source: SubmissionSource;
      sessionId?: string;
      deviceInfo: any;
    }
  ): Promise<FeedbackSubmission> {
    try {
      const { data, error } = await supabase
        .from('feedback_submissions')
        .insert({
          survey_id: surveyId,
          client_id: clientId,
          booking_id: submissionData.bookingId,
          service_id: submissionData.serviceId,
          staff_id: submissionData.staffId,
          submission_source: submissionData.source,
          submission_channel: 'online',
          session_id: submissionData.sessionId,
          is_complete: false,
          completion_rate: 0,
          device_info: submissionData.deviceInfo
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating feedback submission:', error);
      throw error;
    }
  }

  /**
   * Save survey responses
   */
  async saveResponses(
    submissionId: string,
    responses: Array<{
      questionId: string;
      response: any;
      responseTime?: number;
    }>
  ): Promise<FeedbackResponse[]> {
    try {
      const responsesData = responses.map(response => ({
        submission_id: submissionId,
        question_id: response.questionId,
        response_value: typeof response.response === 'string' ? response.response : null,
        response_number: typeof response.response === 'number' ? response.response : null,
        response_array: Array.isArray(response.response) ? response.response : null,
        response_time_seconds: response.responseTime,
        answered_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('feedback_responses')
        .insert(responsesData)
        .select();

      if (error) throw error;

      // Update submission completion status
      await this.updateSubmissionProgress(submissionId);

      return data || [];
    } catch (error) {
      console.error('Error saving survey responses:', error);
      throw error;
    }
  }

  /**
   * Complete feedback submission
   */
  async completeSubmission(submissionId: string): Promise<FeedbackSubmission> {
    try {
      const { data, error } = await supabase
        .from('feedback_submissions')
        .update({
          is_complete: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', submissionId)
        .select()
        .single();

      if (error) throw error;

      // Process the completed submission for analytics and alerts
      await this.processCompletedSubmission(data);

      return data;
    } catch (error) {
      console.error('Error completing feedback submission:', error);
      throw error;
    }
  }

  /**
   * Update submission progress
   */
  private async updateSubmissionProgress(submissionId: string): Promise<void> {
    try {
      const { data: questions, error: questionsError } = await supabase
        .from('survey_questions')
        .select('id')
        .eq('survey_id', (await supabase
          .from('feedback_submissions')
          .select('survey_id')
          .eq('id', submissionId)
          .single()
        ).data?.survey_id);

      if (questionsError) throw questionsError;

      const { data: responses, error: responsesError } = await supabase
        .from('feedback_responses')
        .select('question_id')
        .eq('submission_id', submissionId);

      if (responsesError) throw responsesError;

      const completionRate = questions ? Math.round((responses?.length || 0) / questions.length * 100) : 0;

      await supabase
        .from('feedback_submissions')
        .update({
          completion_rate: completionRate
        })
        .eq('id', submissionId);
    } catch (error) {
      console.error('Error updating submission progress:', error);
    }
  }

  /**
   * Process completed submission for analytics and alerts
   */
  private async processCompletedSubmission(submission: FeedbackSubmission): Promise<void> {
    try {
      // Calculate and save satisfaction metrics
      await this.calculateSatisfactionMetrics(submission.id);

      // Check for sentiment analysis
      await this.analyzeSentiment(submission.id);

      // Check for service recovery triggers
      await this.checkServiceRecoveryTriggers(submission.id);

      // Update client satisfaction predictions
      await this.updateClientPredictions(submission.client_id);
    } catch (error) {
      console.error('Error processing completed submission:', error);
    }
  }

  // ========================================
  // SATISFACTION METRICS
  // ========================================

  /**
   * Calculate satisfaction metrics from submission
   */
  private async calculateSatisfactionMetrics(submissionId: string): Promise<void> {
    try {
      const { data: submission, error: submissionError } = await supabase
        .from('feedback_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (submissionError) throw submissionError;

      const { data: responses, error: responsesError } = await supabase
        .from('feedback_responses')
        .select(`
          *,
          survey_questions!inner(
            question_type,
            question_text_en,
            question_text_pl
          )
        `)
        .eq('submission_id', submissionId);

      if (responsesError) throw responsesError;

      // Insert satisfaction metrics
      const metricsToInsert = responses
        ?.filter(r => r.response_number !== null)
        .map(response => ({
          client_id: submission.client_id,
          service_id: submission.service_id,
          booking_id: submission.booking_id,
          staff_id: submission.staff_id,
          metric_type: this.mapQuestionTypeToMetric(response.survey_questions.question_type),
          score: response.response_number,
          max_score: 5,
          measurement_source: 'survey',
          created_at: new Date().toISOString()
        })) || [];

      if (metricsToInsert.length > 0) {
        await supabase
          .from('satisfaction_metrics')
          .insert(metricsToInsert);
      }
    } catch (error) {
      console.error('Error calculating satisfaction metrics:', error);
    }
  }

  /**
   * Map survey question types to satisfaction metric types
   */
  private mapQuestionTypeToMetric(questionType: string): SatisfactionMetricType {
    const mapping: Record<string, SatisfactionMetricType> = {
      'overall_satisfaction': 'overall_satisfaction',
      'service_quality': 'service_quality',
      'staff_professionalism': 'staff_professionalism',
      'facility_cleanliness': 'facility_cleanliness',
      'value_for_money': 'value_for_money',
      'likelihood_to_return': 'likelihood_to_return',
      'likelihood_to_recommend': 'likelihood_to_recommend'
    };

    return mapping[questionType] || 'overall_satisfaction';
  }

  /**
   * Get client satisfaction metrics
   */
  async getClientSatisfactionMetrics(
    clientId: string,
    dateRange?: { start: string; end: string }
  ): Promise<SatisfactionMetric[]> {
    try {
      let query = supabase
        .from('satisfaction_metrics')
        .select('*')
        .eq('client_id', clientId)
        .order('measurement_date', { ascending: false });

      if (dateRange) {
        query = query
          .gte('measurement_date', dateRange.start)
          .lte('measurement_date', dateRange.end);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching client satisfaction metrics:', error);
      throw error;
    }
  }

  // ========================================
  // NPS AND CES
  // ========================================

  /**
   * Record NPS measurement
   */
  async recordNPSMeasurement(
    clientId: string,
    score: number,
    feedbackText?: string,
    reason?: string,
    serviceCategory?: ServiceType
  ): Promise<NPSMeasurement> {
    try {
      const promoterCategory = score >= 9 ? 'promoter' : score >= 7 ? 'passive' : 'detractor';

      const { data, error } = await supabase
        .from('nps_measurements')
        .insert({
          client_id: clientId,
          service_category: serviceCategory,
          score,
          promoter_category: promoterCategory,
          feedback_text: feedbackText,
          reason: reason,
          measurement_date: new Date().toISOString(),
          measurement_source: 'survey'
        })
        .select()
        .single();

      if (error) throw error;

      // Check for service recovery if detractor
      if (score <= 6) {
        await this.triggerNPSServiceRecovery(clientId, data.id, score, feedbackText);
      }

      return data;
    } catch (error) {
      console.error('Error recording NPS measurement:', error);
      throw error;
    }
  }

  /**
   * Record CES measurement
   */
  async recordCESMeasurement(
    clientId: string,
    interactionType: string,
    effortScore: number,
    feedbackText?: string
  ): Promise<CESMeasurement> {
    try {
      const effortLevel = this.calculateCESEffortLevel(effortScore);

      const { data, error } = await supabase
        .from('ces_measurements')
        .insert({
          client_id: clientId,
          interaction_type: interactionType,
          effort_score: effortScore,
          effort_level: effortLevel,
          feedback_text: feedbackText,
          measurement_date: new Date().toISOString(),
          measurement_source: 'survey'
        })
        .select()
        .single();

      if (error) throw error;

      // Check for service recovery if high effort
      if (effortScore >= 5) {
        await this.triggerCESServiceRecovery(clientId, data.id, effortScore, interactionType);
      }

      return data;
    } catch (error) {
      console.error('Error recording CES measurement:', error);
      throw error;
    }
  }

  /**
   * Calculate CES effort level
   */
  private calculateCESEffortLevel(score: number): string {
    if (score <= 2) return 'very_easy';
    if (score <= 3) return 'easy';
    if (score <= 5) return 'neutral';
    if (score <= 6) return 'difficult';
    return 'very_difficult';
  }

  /**
   * Get NPS trend data
   */
  async getNPSTrend(dateRange: { start: string; end: string }): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('nps_trend')
        .select('*')
        .gte('month', dateRange.start)
        .lte('month', dateRange.end)
        .order('month', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching NPS trend:', error);
      throw error;
    }
  }

  // ========================================
  // SENTIMENT ANALYSIS
  // ========================================

  /**
   * Analyze sentiment of text feedback
   */
  async analyzeSentiment(submissionId: string): Promise<void> {
    try {
      const { data: responses, error: responsesError } = await supabase
        .from('feedback_responses')
        .select('*')
        .eq('submission_id', submissionId)
        .not('response_value', 'is', null);

      if (responsesError) throw responsesError;

      for (const response of responses || []) {
        if (response.response_value && response.response_value.length > 10) {
          const sentimentResult = await this.performSentimentAnalysis(
            response.response_value,
            'feedback_response',
            response.id
          );

          if (sentimentResult) {
            await supabase
              .from('sentiment_analysis')
              .insert(sentimentResult);
          }
        }
      }
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
    }
  }

  /**
   * Perform sentiment analysis on text
   */
  private async performSentimentAnalysis(
    text: string,
    sourceType: string,
    sourceId: string
  ): Promise<Partial<SentimentAnalysis> | null> {
    try {
      // Simple sentiment analysis - in production, use a proper NLP service
      const sentimentScore = this.calculateSimpleSentiment(text);
      const sentimentLabel = sentimentScore > 0.1 ? 'positive' : sentimentScore < -0.1 ? 'negative' : 'neutral';

      return {
        source_id: sourceId,
        source_type: sourceType as any,
        text_content: text,
        sentiment_score: sentimentScore,
        sentiment_label: sentimentLabel as any,
        confidence_score: 0.8,
        emotions: this.extractEmotions(text),
        keywords: this.extractKeywords(text),
        processed_at: new Date().toISOString(),
        model_version: 'v1.0'
      };
    } catch (error) {
      console.error('Error performing sentiment analysis:', error);
      return null;
    }
  }

  /**
   * Simple sentiment calculation (replace with proper NLP in production)
   */
  private calculateSimpleSentiment(text: string): number {
    const positiveWords = ['excellent', 'amazing', 'fantastic', 'great', 'wonderful', 'perfect', 'love', 'brilliant', 'outstanding', 'superb', 'świetny', 'doskonały', 'fantastyczny', 'wspaniały', 'kocham', 'świetlnie'];
    const negativeWords = ['terrible', 'awful', 'horrible', 'bad', 'poor', 'disappointing', 'hate', 'worst', 'disgusting', 'okropny', 'straszny', 'zły', 'nędzny', 'rozczarowujący', 'nienawidzę'];

    const words = text.toLowerCase().split(/\s+/);
    let score = 0;

    positiveWords.forEach(word => {
      if (words.includes(word)) score += 1;
    });

    negativeWords.forEach(word => {
      if (words.includes(word)) score -= 1;
    });

    return Math.max(-1, Math.min(1, score / Math.max(words.length, 1) * 10));
  }

  /**
   * Extract emotions from text
   */
  private extractEmotions(text: string): Record<string, number> {
    const emotionKeywords = {
      joy: ['happy', 'joy', 'delighted', 'pleased', 'satisfied', 'szczęśliwy', 'radość', 'zadowolony'],
      anger: ['angry', 'furious', 'irritated', 'annoyed', 'wściekły', 'irytowany', 'zły'],
      disappointment: ['disappointed', 'letdown', 'unsatisfied', 'rozczarowany', ' niezadowolony'],
      gratitude: ['thankful', 'grateful', 'appreciate', 'wdzięczny', 'dziękuję']
    };

    const emotions: Record<string, number> = {};
    const words = text.toLowerCase().split(/\s+/);

    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      const matches = keywords.filter(keyword => words.includes(keyword)).length;
      if (matches > 0) {
        emotions[emotion] = matches / words.length;
      }
    });

    return emotions;
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    // Remove common stop words
    const stopWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'its', 'did', 'yes', 'she', 'may', 'say'];

    return words.filter(word => !stopWords.includes(word)).slice(0, 10);
  }

  // ========================================
  // SERVICE RECOVERY
  // ========================================

  /**
   * Check for service recovery triggers
   */
  private async checkServiceRecoveryTriggers(submissionId: string): Promise<void> {
    try {
      const { data: submission, error: submissionError } = await supabase
        .from('feedback_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (submissionError) throw submissionError;

      const { data: responses, error: responsesError } = await supabase
        .from('feedback_responses')
        .select('response_number, response_value')
        .eq('submission_id', submissionId);

      if (responsesError) throw responsesError;

      // Check for low scores
      const hasLowScore = responses?.some(r => r.response_number && r.response_number <= 2.5) || false;

      // Check for negative sentiment
      const { data: sentiment, error: sentimentError } = await supabase
        .from('sentiment_analysis')
        .select('sentiment_score, sentiment_label')
        .eq('source_id', submissionId)
        .eq('source_type', 'feedback_response');

      if (sentimentError) throw sentimentError;

      const hasNegativeSentiment = sentiment?.some(s => s.sentiment_label === 'negative' && s.sentiment_score < -0.3) || false;

      if (hasLowScore || hasNegativeSentiment) {
        await this.createServiceRecoveryCase(submission, responses, sentiment);
      }
    } catch (error) {
      console.error('Error checking service recovery triggers:', error);
    }
  }

  /**
   * Create service recovery case
   */
  private async createServiceRecoveryCase(
    submission: FeedbackSubmission,
    responses: any[],
    sentiment: any[]
  ): Promise<void> {
    try {
      const lowestScore = Math.min(...responses.map(r => r.response_number || 5));
      const avgSentiment = sentiment.length > 0
        ? sentiment.reduce((sum, s) => sum + s.sentiment_score, 0) / sentiment.length
        : 0;

      const priority = lowestScore <= 1.5 || avgSentiment < -0.6 ? 'critical' :
                      lowestScore <= 2 || avgSentiment < -0.3 ? 'high' : 'medium';

      const { error } = await supabase
        .from('service_recovery_cases')
        .insert({
          client_id: submission.client_id,
          trigger_feedback_id: submission.id,
          booking_id: submission.booking_id,
          service_id: submission.service_id,
          staff_id: submission.staff_id,
          recovery_priority: priority as RecoveryPriority,
          recovery_status: 'new',
          satisfaction_before: lowestScore,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating service recovery case:', error);
    }
  }

  /**
   * Trigger service recovery for NPS detractors
   */
  private async triggerNPSServiceRecovery(
    clientId: string,
    npsId: string,
    score: number,
    feedbackText?: string
  ): Promise<void> {
    try {
      const priority = score <= 3 ? 'critical' : score <= 6 ? 'high' : 'medium';

      await supabase
        .from('service_recovery_cases')
        .insert({
          client_id: clientId,
          trigger_feedback_id: npsId,
          recovery_priority: priority as RecoveryPriority,
          recovery_status: 'new',
          case_notes: `NPS Score: ${score}. Feedback: ${feedbackText || 'No feedback provided'}`,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error triggering NPS service recovery:', error);
    }
  }

  /**
   * Trigger service recovery for high CES scores
   */
  private async triggerCESServiceRecovery(
    clientId: string,
    cesId: string,
    effortScore: number,
    interactionType: string
  ): Promise<void> {
    try {
      const priority = effortScore >= 6 ? 'critical' : effortScore >= 5 ? 'high' : 'medium';

      await supabase
        .from('service_recovery_cases')
        .insert({
          client_id: clientId,
          trigger_feedback_id: cesId,
          recovery_priority: priority as RecoveryPriority,
          recovery_status: 'new',
          case_notes: `High effort score (${effortScore}) for ${interactionType}`,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error triggering CES service recovery:', error);
    }
  }

  // ========================================
  // ALERTS AND MONITORING
  // ========================================

  /**
   * Create satisfaction alert
   */
  async createAlert(alertData: {
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    description?: string;
    triggerData: any;
    sourceFeedbackId?: string;
    clientId?: string;
    serviceId?: string;
    staffId?: string;
  }): Promise<SatisfactionAlert> {
    try {
      const { data, error } = await supabase
        .from('satisfaction_alerts')
        .insert({
          alert_type: alertData.type,
          severity: alertData.severity,
          alert_title: alertData.title,
          alert_description: alertData.description,
          trigger_data: alertData.triggerData,
          source_feedback_id: alertData.sourceFeedbackId,
          client_id: alertData.clientId,
          service_id: alertData.serviceId,
          staff_id: alertData.staffId,
          alert_status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Notify recipients
      await this.notifyAlertRecipients(data);

      return data;
    } catch (error) {
      console.error('Error creating satisfaction alert:', error);
      throw error;
    }
  }

  /**
   * Notify alert recipients
   */
  private async notifyAlertRecipients(alert: SatisfactionAlert): Promise<void> {
    try {
      const { data: recipients, error } = await supabase
        .from('alert_recipients')
        .select('*')
        .eq('is_active', true)
        .contains('alert_types', [alert.alert_type])
        .contains('severity_levels', [alert.severity]);

      if (error) throw error;

      // In a real implementation, this would send actual notifications
      console.log('Notifying alert recipients:', recipients?.length, 'recipients for alert:', alert.id);
    } catch (error) {
      console.error('Error notifying alert recipients:', error);
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(filters?: {
    type?: AlertType;
    severity?: AlertSeverity;
    assignedTo?: string;
  }): Promise<SatisfactionAlert[]> {
    try {
      let query = supabase
        .from('satisfaction_alerts')
        .select('*')
        .eq('alert_status', 'active')
        .order('created_at', { ascending: false });

      if (filters?.type) {
        query = query.eq('alert_type', filters.type);
      }

      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }

      if (filters?.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active alerts:', error);
      throw error;
    }
  }

  // ========================================
  // CLIENT PREDICTIONS
  // ========================================

  /**
   * Update client satisfaction predictions
   */
  private async updateClientPredictions(clientId: string): Promise<void> {
    try {
      const predictions = await this.generateClientPredictions(clientId);

      for (const prediction of predictions) {
        await supabase
          .from('client_satisfaction_predictions')
          .upsert({
            client_id: clientId,
            prediction_type: prediction.type,
            prediction_score: prediction.score,
            risk_level: prediction.riskLevel,
            confidence_level: prediction.confidence,
            influencing_factors: prediction.factors,
            recommended_actions: prediction.actions,
            prediction_date: new Date().toISOString(),
            valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            model_version: 'v1.0',
            created_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error updating client predictions:', error);
    }
  }

  /**
   * Generate client predictions based on recent feedback
   */
  private async generateClientPredictions(clientId: string): Promise<Array<{
    type: string;
    score: number;
    riskLevel: string;
    confidence: number;
    factors: any;
    actions: string[];
  }>> {
    try {
      // Get recent satisfaction metrics
      const { data: metrics, error: metricsError } = await supabase
        .from('satisfaction_metrics')
        .select('*')
        .eq('client_id', clientId)
        .gte('measurement_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('measurement_date', { ascending: false });

      if (metricsError) throw metricsError;

      const predictions = [];

      // Calculate churn risk
      if (metrics && metrics.length > 0) {
        const avgScore = metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length;
        const trend = this.calculateTrend(metrics.map(m => m.score));

        let churnRisk = 0;
        if (avgScore < 2) churnRisk = 0.8;
        else if (avgScore < 3) churnRisk = 0.6;
        else if (avgScore < 4) churnRisk = 0.3;
        else if (trend < -0.5) churnRisk = 0.5;

        predictions.push({
          type: 'churn_risk',
          score: churnRisk,
          riskLevel: churnRisk > 0.7 ? 'critical' : churnRisk > 0.4 ? 'high' : churnRisk > 0.2 ? 'medium' : 'low',
          confidence: 0.7,
          factors: { avgScore, trend, recentMetrics: metrics.slice(0, 5) },
          actions: churnRisk > 0.4 ? ['Personal outreach', 'Service recovery', 'Special offer'] : ['Monitor closely']
        });
      }

      return predictions;
    } catch (error) {
      console.error('Error generating client predictions:', error);
      return [];
    }
  }

  /**
   * Calculate trend from array of scores
   */
  private calculateTrend(scores: number[]): number {
    if (scores.length < 2) return 0;

    const recent = scores.slice(0, Math.min(3, scores.length));
    const older = scores.slice(Math.min(3, scores.length), Math.min(6, scores.length));

    if (older.length === 0) return 0;

    const recentAvg = recent.reduce((sum, s) => sum + s, 0) / recent.length;
    const olderAvg = older.reduce((sum, s) => sum + s, 0) / older.length;

    return recentAvg - olderAvg;
  }

  // ========================================
  // DASHBOARD AND ANALYTICS
  // ========================================

  /**
   * Get comprehensive feedback dashboard data
   */
  async getFeedbackDashboard(dateRange?: { start: string; end: string }): Promise<FeedbackDashboard> {
    try {
      const endDate = dateRange?.end || new Date().toISOString();
      const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Get summary statistics
      const summary = await this.getDashboardSummary(startDate, endDate);

      // Get trends
      const trends = await this.getDashboardTrends(startDate, endDate);

      // Get top issues
      const topIssues = await this.getTopIssues(startDate, endDate);

      // Get staff rankings
      const staffRankings = await this.getStaffRankings();

      // Get recent alerts
      const recentAlerts = await this.getActiveAlerts();

      // Get recovery cases
      const recoveryCases = await this.getRecoveryCases(startDate, endDate);

      return {
        summary,
        trends,
        top_issues: topIssues,
        staff_rankings: staffRankings,
        recent_alerts: recentAlerts.slice(0, 10),
        recovery_cases: recoveryCases.slice(0, 10)
      };
    } catch (error) {
      console.error('Error fetching feedback dashboard:', error);
      throw error;
    }
  }

  /**
   * Get dashboard summary statistics
   */
  private async getDashboardSummary(startDate: string, endDate: string): Promise<any> {
    try {
      const [
        { count: totalSubmissions },
        { data: satisfactionData },
        { data: npsData },
        { data: cesData },
        { count: activeAlerts },
        { count: recoveryCases }
      ] = await Promise.all([
        supabase
          .from('feedback_submissions')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startDate)
          .lte('created_at', endDate)
          .eq('is_complete', true),
        supabase
          .from('satisfaction_metrics')
          .select('score')
          .gte('measurement_date', startDate)
          .lte('measurement_date', endDate),
        supabase
          .from('nps_measurements')
          .select('score')
          .gte('measurement_date', startDate)
          .lte('measurement_date', endDate),
        supabase
          .from('ces_measurements')
          .select('effort_score')
          .gte('measurement_date', startDate)
          .lte('measurement_date', endDate),
        supabase
          .from('satisfaction_alerts')
          .select('*', { count: 'exact', head: true })
          .eq('alert_status', 'active'),
        supabase
          .from('service_recovery_cases')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startDate)
          .lte('created_at', endDate)
          .in('recovery_status', ['new', 'in_progress'])
      ]);

      const averageSatisfaction = satisfactionData && satisfactionData.length > 0
        ? satisfactionData.reduce((sum, m) => sum + m.score, 0) / satisfactionData.length
        : 0;

      const npsScore = npsData && npsData.length > 0
        ? this.calculateNPSFromData(npsData)
        : 0;

      const cesScore = cesData && cesData.length > 0
        ? cesData.reduce((sum, m) => sum + (8 - m.effort_score), 0) / cesData.length // Invert for better score
        : 0;

      return {
        total_submissions: totalSubmissions || 0,
        average_satisfaction: Math.round(averageSatisfaction * 100) / 100,
        nps_score: Math.round(npsScore),
        ces_score: Math.round(cesScore * 100) / 100,
        active_alerts: activeAlerts || 0,
        recovery_cases: recoveryCases || 0
      };
    } catch (error) {
      console.error('Error getting dashboard summary:', error);
      return {
        total_submissions: 0,
        average_satisfaction: 0,
        nps_score: 0,
        ces_score: 0,
        active_alerts: 0,
        recovery_cases: 0
      };
    }
  }

  /**
   * Calculate NPS score from NPS measurements
   */
  private calculateNPSFromData(npsData: any[]): number {
    const promoters = npsData.filter(m => m.score >= 9).length;
    const detractors = npsData.filter(m => m.score <= 6).length;
    const total = npsData.length;

    if (total === 0) return 0;

    return Math.round(((promoters - detractors) / total) * 100);
  }

  /**
   * Get dashboard trends
   */
  private async getDashboardTrends(startDate: string, endDate: string): Promise<any> {
    try {
      // Get daily satisfaction trends
      const { data: satisfactionTrend } = await supabase
        .from('satisfaction_metrics')
        .select('measurement_date, score')
        .gte('measurement_date', startDate)
        .lte('measurement_date', endDate)
        .order('measurement_date', { ascending: true });

      // Get daily NPS trends
      const { data: npsTrend } = await supabase
        .from('nps_measurements')
        .select('measurement_date, score')
        .gte('measurement_date', startDate)
        .lte('measurement_date', endDate)
        .order('measurement_date', { ascending: true });

      // Get submission volume
      const { data: submissionVolume } = await supabase
        .from('feedback_submissions')
        .select('created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('is_complete', true)
        .order('created_at', { ascending: true });

      return {
        satisfaction_trend: this.aggregateTrendData(satisfactionTrend, 'score'),
        nps_trend: this.aggregateTrendData(npsTrend, 'score'),
        submission_volume: this.aggregateVolumeData(submissionVolume)
      };
    } catch (error) {
      console.error('Error getting dashboard trends:', error);
      return {
        satisfaction_trend: [],
        nps_trend: [],
        submission_volume: []
      };
    }
  }

  /**
   * Aggregate trend data by day
   */
  private aggregateTrendData(data: any[], valueField: string): Array<{ date: string; score: number }> {
    const aggregated: Record<string, number[]> = {};

    data.forEach(item => {
      const date = item.measurement_date.split('T')[0];
      if (!aggregated[date]) aggregated[date] = [];
      aggregated[date].push(item[valueField]);
    });

    return Object.entries(aggregated).map(([date, values]) => ({
      date,
      score: values.reduce((sum, val) => sum + val, 0) / values.length
    }));
  }

  /**
   * Aggregate submission volume by day
   */
  private aggregateVolumeData(data: any[]): Array<{ date: string; count: number }> {
    const aggregated: Record<string, number> = {};

    data.forEach(item => {
      const date = item.created_at.split('T')[0];
      aggregated[date] = (aggregated[date] || 0) + 1;
    });

    return Object.entries(aggregated).map(([date, count]) => ({ date, count }));
  }

  /**
   * Get top issues from feedback
   */
  private async getTopIssues(startDate: string, endDate: string): Promise<any[]> {
    try {
      const { data: themes } = await supabase
        .from('feedback_theme_links')
        .select(`
          relevance_score,
          feedback_themes!inner(
            theme_name_en,
            theme_name_pl,
            theme_category,
            is_positive
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      const themeCounts: Record<string, { count: number; sentiment: string }> = {};

      themes?.forEach(link => {
        const themeName = link.feedback_themes.theme_name_en;
        if (!themeCounts[themeName]) {
          themeCounts[themeName] = { count: 0, sentiment: link.feedback_themes.is_positive ? 'positive' : 'negative' };
        }
        themeCounts[themeName].count++;
      });

      return Object.entries(themeCounts)
        .map(([theme, data]) => ({
          theme,
          count: data.count,
          sentiment: data.sentiment,
          trend: 'stable' // In a real implementation, calculate trend
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    } catch (error) {
      console.error('Error getting top issues:', error);
      return [];
    }
  }

  /**
   * Get staff performance rankings
   */
  private async getStaffRankings(): Promise<any[]> {
    try {
      const { data } = await supabase
        .from('staff_performance_ranking')
        .select('*')
        .order('average_satisfaction_score', { ascending: false })
        .limit(10);

      return data || [];
    } catch (error) {
      console.error('Error getting staff rankings:', error);
      return [];
    }
  }

  /**
   * Get recovery cases
   */
  private async getRecoveryCases(startDate: string, endDate: string): Promise<ServiceRecoveryCase[]> {
    try {
      const { data, error } = await supabase
        .from('service_recovery_cases')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting recovery cases:', error);
      return [];
    }
  }

  // ========================================
  // FEEDBACK THEMES MANAGEMENT
  // ========================================

  /**
   * Get all feedback themes
   */
  async getFeedbackThemes(): Promise<FeedbackTheme[]> {
    try {
      const { data, error } = await supabase
        .from('feedback_themes')
        .select('*')
        .eq('is_active', true)
        .order('theme_name_en', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching feedback themes:', error);
      throw error;
    }
  }

  /**
   * Link feedback to themes
   */
  async linkFeedbackToThemes(
    feedbackId: string,
    feedbackType: string,
    themeIds: string[]
  ): Promise<void> {
    try {
      const links = themeIds.map(themeId => ({
        feedback_id: feedbackId,
        feedback_type: feedbackType,
        theme_id: themeId,
        relevance_score: 0.8,
        auto_detected: true,
        manually_verified: false,
        created_at: new Date().toISOString()
      }));

      await supabase
        .from('feedback_theme_links')
        .insert(links);
    } catch (error) {
      console.error('Error linking feedback to themes:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const feedbackService = new FeedbackService();