/**
 * Comprehensive Feedback Collection Service
 * Multi-channel feedback collection with intelligent survey distribution
 */

import { supabase } from '@/integrations/supabase/client';
import {
  FeedbackSurvey,
  SurveyQuestion,
  FeedbackSubmission,
  FeedbackResponse,
  SurveyType,
  ServiceType,
  SubmissionSource,
  QuestionType,
  CreateSurveyRequest,
  CreateSurveyQuestionRequest,
  SubmitFeedbackRequest,
  CreateFeedbackResponseRequest,
  DeviceInfo,
  SurveyConfig,
  ConditionalLogic,
  ValidationRules,
  FeedbackFormErrors,
  SurveyValidationResult
} from '@/types/feedback';

export class FeedbackCollectionService {
  private static instance: FeedbackCollectionService;

  static getInstance(): FeedbackCollectionService {
    if (!FeedbackCollectionService.instance) {
      FeedbackCollectionService.instance = new FeedbackCollectionService();
    }
    return FeedbackCollectionService.instance;
  }

  // =====================================================
  // SURVEY MANAGEMENT
  // =====================================================

  /**
   * Create a new feedback survey with questions
   */
  async createSurvey(request: CreateSurveyRequest): Promise<FeedbackSurvey> {
    try {
      // Start transaction
      const { data: survey, error: surveyError } = await supabase
        .from('feedback_surveys')
        .insert({
          title_en: request.title_en,
          title_pl: request.title_pl,
          description_en: request.description_en,
          description_pl: request.description_pl,
          survey_type: request.survey_type,
          service_type: request.service_type,
          trigger_events: request.trigger_events,
          config: request.config,
          is_active: true,
          is_template: false
        })
        .select()
        .single();

      if (surveyError) throw surveyError;

      // Create questions
      const questionsWithSurveyId = request.questions.map((q, index) => ({
        ...q,
        survey_id: survey.id,
        display_order: index + 1
      }));

      const { data: questions, error: questionsError } = await supabase
        .from('survey_questions')
        .insert(questionsWithSurveyId)
        .select();

      if (questionsError) throw questionsError;

      // Get complete survey with questions
      const completeSurvey = await this.getSurveyById(survey.id);
      return completeSurvey!;

    } catch (error) {
      console.error('Error creating survey:', error);
      throw new Error('Failed to create survey');
    }
  }

  /**
   * Get survey by ID with questions
   */
  async getSurveyById(surveyId: string): Promise<FeedbackSurvey | null> {
    try {
      const { data: survey, error } = await supabase
        .from('feedback_surveys')
        .select(`
          *,
          survey_questions (*)
        `)
        .eq('id', surveyId)
        .single();

      if (error) return null;

      // Sort questions by display order
      if (survey.survey_questions) {
        survey.survey_questions.sort((a, b) => a.display_order - b.display_order);
      }

      return survey as FeedbackSurvey;

    } catch (error) {
      console.error('Error fetching survey:', error);
      return null;
    }
  }

  /**
   * Get active surveys for specific service type and trigger event
   */
  async getActiveSurveys(
    serviceType: ServiceType | 'all' = 'all',
    triggerEvent?: string
  ): Promise<FeedbackSurvey[]> {
    try {
      let query = supabase
        .from('feedback_surveys')
        .select(`
          *,
          survey_questions (*)
        `)
        .eq('is_active', true);

      if (serviceType !== 'all') {
        query = query.or(`service_type.eq.${serviceType},service_type.eq.all`);
      }

      if (triggerEvent) {
        query = query.contains('trigger_events', [triggerEvent]);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Sort questions for each survey
      return data.map(survey => ({
        ...survey,
        survey_questions: survey.survey_questions?.sort((a, b) => a.display_order - b.display_order) || []
      })) as FeedbackSurvey[];

    } catch (error) {
      console.error('Error fetching active surveys:', error);
      return [];
    }
  }

  /**
   * Update survey
   */
  async updateSurvey(
    surveyId: string,
    updates: Partial<FeedbackSurvey>
  ): Promise<FeedbackSurvey> {
    try {
      const { data, error } = await supabase
        .from('feedback_surveys')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', surveyId)
        .select()
        .single();

      if (error) throw error;

      return data as FeedbackSurvey;

    } catch (error) {
      console.error('Error updating survey:', error);
      throw new Error('Failed to update survey');
    }
  }

  /**
   * Delete survey (soft delete by deactivating)
   */
  async deleteSurvey(surveyId: string): Promise<void> {
    try {
      await supabase
        .from('feedback_surveys')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', surveyId);

    } catch (error) {
      console.error('Error deleting survey:', error);
      throw new Error('Failed to delete survey');
    }
  }

  // =====================================================
  // FEEDBACK SUBMISSION
  // =====================================================

  /**
   * Submit feedback with responses
   */
  async submitFeedback(request: SubmitFeedbackRequest): Promise<FeedbackSubmission> {
    try {
      // Create submission
      const { data: submission, error: submissionError } = await supabase
        .from('feedback_submissions')
        .insert({
          survey_id: request.survey_id,
          booking_id: request.booking_id,
          service_id: request.service_id,
          staff_id: request.staff_id,
          submission_source: request.submission_source,
          submission_channel: 'online',
          is_complete: true,
          completion_rate: 100,
          device_info: request.device_info || this.getDeviceInfo(),
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          time_to_complete: 0 // Will be calculated
        })
        .select()
        .single();

      if (submissionError) throw submissionError;

      // Create responses
      const responsesWithMetadata = request.responses.map(response => ({
        submission_id: submission.id,
        question_id: response.question_id,
        response_value: response.response_value,
        response_number: response.response_number,
        response_array: response.response_array,
        response_metadata: response.response_metadata || {},
        answered_at: new Date().toISOString(),
        response_time_seconds: 0
      }));

      const { error: responsesError } = await supabase
        .from('feedback_responses')
        .insert(responsesWithMetadata);

      if (responsesError) throw responsesError;

      // Trigger post-submission processes
      await this.processFeedbackSubmission(submission.id);

      return submission as FeedbackSubmission;

    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw new Error('Failed to submit feedback');
    }
  }

  /**
   * Start feedback submission (for multi-step surveys)
   */
  async startSubmission(
    surveyId: string,
    clientId?: string,
    submissionSource: SubmissionSource = 'in_app'
  ): Promise<FeedbackSubmission> {
    try {
      const { data, error } = await supabase
        .from('feedback_submissions')
        .insert({
          survey_id: surveyId,
          client_id: clientId,
          submission_source: submissionSource,
          submission_channel: 'online',
          is_complete: false,
          completion_rate: 0,
          device_info: this.getDeviceInfo(),
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return data as FeedbackSubmission;

    } catch (error) {
      console.error('Error starting submission:', error);
      throw new Error('Failed to start feedback submission');
    }
  }

  /**
   * Save partial response
   */
  async savePartialResponse(
    submissionId: string,
    questionId: string,
    response: CreateFeedbackResponseRequest
  ): Promise<void> {
    try {
      // Check if response already exists
      const { data: existing } = await supabase
        .from('feedback_responses')
        .select('id')
        .eq('submission_id', submissionId)
        .eq('question_id', questionId)
        .single();

      if (existing) {
        // Update existing response
        await supabase
          .from('feedback_responses')
          .update({
            response_value: response.response_value,
            response_number: response.response_number,
            response_array: response.response_array,
            response_metadata: response.response_metadata || {},
            answered_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        // Create new response
        await supabase
          .from('feedback_responses')
          .insert({
            submission_id: submissionId,
            question_id: questionId,
            response_value: response.response_value,
            response_number: response.response_number,
            response_array: response.response_array,
            response_metadata: response.response_metadata || {},
            answered_at: new Date().toISOString()
          });
      }

      // Update completion rate
      await this.updateCompletionRate(submissionId);

    } catch (error) {
      console.error('Error saving partial response:', error);
      throw new Error('Failed to save response');
    }
  }

  /**
   * Complete submission
   */
  async completeSubmission(submissionId: string): Promise<FeedbackSubmission> {
    try {
      const { data, error } = await supabase
        .from('feedback_submissions')
        .update({
          is_complete: true,
          completion_rate: 100,
          completed_at: new Date().toISOString(),
          time_to_complete: await this.calculateCompletionTime(submissionId)
        })
        .eq('id', submissionId)
        .select()
        .single();

      if (error) throw error;

      // Trigger post-submission processes
      await this.processFeedbackSubmission(submissionId);

      return data as FeedbackSubmission;

    } catch (error) {
      console.error('Error completing submission:', error);
      throw new Error('Failed to complete submission');
    }
  }

  // =====================================================
  // SURVEY LOGIC AND VALIDATION
  // =====================================================

  /**
   * Get next question based on conditional logic
   */
  async getNextQuestion(
    surveyId: string,
    currentQuestionId: string,
    responses: Record<string, any>
  ): Promise<SurveyQuestion | null> {
    try {
      const survey = await this.getSurveyById(surveyId);
      if (!survey) return null;

      const questions = survey.survey_questions || [];
      const currentIndex = questions.findIndex(q => q.id === currentQuestionId);

      if (currentIndex === -1 || currentIndex === questions.length - 1) {
        return null; // No more questions
      }

      // Check each subsequent question for conditional logic
      for (let i = currentIndex + 1; i < questions.length; i++) {
        const question = questions[i];
        if (this.shouldShowQuestion(question, responses)) {
          return question;
        }
      }

      return null;

    } catch (error) {
      console.error('Error getting next question:', error);
      return null;
    }
  }

  /**
   * Check if question should be shown based on conditional logic
   */
  shouldShowQuestion(question: SurveyQuestion, responses: Record<string, any>): boolean {
    const logic = question.conditional_logic;

    if (!logic || (!logic.show_if && !logic.hide_if)) {
      return true; // Show if no conditional logic
    }

    // Check show_if conditions
    if (logic.show_if && logic.show_if.length > 0) {
      const shouldShow = logic.show_if.every(condition =>
        this.evaluateCondition(condition, responses)
      );
      if (!shouldShow) return false;
    }

    // Check hide_if conditions
    if (logic.hide_if && logic.hide_if.length > 0) {
      const shouldHide = logic.hide_if.some(condition =>
        this.evaluateCondition(condition, responses)
      );
      if (shouldHide) return false;
    }

    return true;
  }

  /**
   * Evaluate conditional logic condition
   */
  private evaluateCondition(
    condition: any,
    responses: Record<string, any>
  ): boolean {
    const responseValue = responses[condition.question_id];

    if (responseValue === undefined || responseValue === null) {
      return false;
    }

    switch (condition.operator) {
      case 'equals':
        return responseValue === condition.value;
      case 'not_equals':
        return responseValue !== condition.value;
      case 'greater_than':
        return Number(responseValue) > Number(condition.value);
      case 'less_than':
        return Number(responseValue) < Number(condition.value);
      case 'contains':
        return String(responseValue).toLowerCase().includes(String(condition.value).toLowerCase());
      case 'not_contains':
        return !String(responseValue).toLowerCase().includes(String(condition.value).toLowerCase());
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(responseValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(responseValue);
      default:
        return false;
    }
  }

  /**
   * Validate response against question rules
   */
  validateResponse(
    question: SurveyQuestion,
    response: any
  ): { isValid: boolean; error?: string } {
    const rules = question.validation_rules;

    // Check required
    if (rules.required && (response === undefined || response === null || response === '')) {
      return { isValid: false, error: 'This field is required' };
    }

    // Skip validation if not required and empty
    if (!rules.required && (response === undefined || response === null || response === '')) {
      return { isValid: true };
    }

    // Type-specific validation
    switch (question.question_type) {
      case 'rating':
      case 'nps':
      case 'ces':
      case 'star_rating':
        if (isNaN(Number(response))) {
          return { isValid: false, error: 'Please provide a valid number' };
        }
        if (rules.min_value && Number(response) < rules.min_value) {
          return { isValid: false, error: `Value must be at least ${rules.min_value}` };
        }
        if (rules.max_value && Number(response) > rules.max_value) {
          return { isValid: false, error: `Value must be at most ${rules.max_value}` };
        }
        break;

      case 'text':
        const textValue = String(response);
        if (rules.min_length && textValue.length < rules.min_length) {
          return { isValid: false, error: `Text must be at least ${rules.min_length} characters` };
        }
        if (rules.max_length && textValue.length > rules.max_length) {
          return { isValid: false, error: `Text must be at most ${rules.max_length} characters` };
        }
        if (rules.pattern && !new RegExp(rules.pattern).test(textValue)) {
          return { isValid: false, error: 'Invalid format' };
        }
        break;

      case 'multiple_choice':
        if (Array.isArray(response)) {
          if (rules.min_value && response.length < rules.min_value) {
            return { isValid: false, error: `Please select at least ${rules.min_value} options` };
          }
          if (rules.max_value && response.length > rules.max_value) {
            return { isValid: false, error: `Please select at most ${rules.max_value} options` };
          }
        }
        break;
    }

    return { isValid: true };
  }

  /**
   * Validate entire survey
   */
  validateSurvey(survey: FeedbackSurvey): SurveyValidationResult {
    const errors: FeedbackFormErrors = {};
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validate survey title
    if (!survey.title_en?.trim()) {
      errors.title_en = 'English title is required';
    }
    if (!survey.title_pl?.trim()) {
      errors.title_pl = 'Polish title is required';
    }

    // Validate questions
    if (!survey.survey_questions || survey.survey_questions.length === 0) {
      errors.questions = 'At least one question is required';
    } else {
      // Check for required questions
      const hasRequiredQuestion = survey.survey_questions.some(q => q.is_required);
      if (!hasRequiredQuestion) {
        warnings.push('Consider adding at least one required question');
      }

      // Check question types
      const questionTypes = survey.survey_questions.map(q => q.question_type);
      if (survey.survey_type === 'nps' && !questionTypes.includes('nps')) {
        errors.nps_question = 'NPS survey must include an NPS question';
      }
      if (survey.survey_type === 'ces' && !questionTypes.includes('ces')) {
        errors.ces_question = 'CES survey must include a CES question';
      }

      // Check display orders
      const orders = survey.survey_questions.map(q => q.display_order);
      const uniqueOrders = new Set(orders);
      if (orders.length !== uniqueOrders.size) {
        errors.question_order = 'Question display orders must be unique';
      }
    }

    // Check configuration
    if (survey.config?.auto_trigger && !survey.config.trigger_delay_hours) {
      warnings.push('Auto-trigger enabled but no delay specified, using default 2 hours');
    }

    // Suggestions
    if (survey.survey_questions && survey.survey_questions.length > 10) {
      suggestions.push('Consider breaking long surveys into multiple shorter ones for better response rates');
    }

    if (!survey.config?.thank_you_message) {
      suggestions.push('Add a custom thank you message for better user experience');
    }

    const isValid = Object.keys(errors).length === 0;

    return {
      isValid,
      errors,
      warnings,
      suggestions
    };
  }

  // =====================================================
  // MULTI-CHANNEL DISTRIBUTION
  // =====================================================

  /**
   * Trigger survey distribution based on events
   */
  async triggerSurveyDistribution(
    triggerEvent: string,
    clientId: string,
    context: {
      bookingId?: string;
      serviceId?: string;
      staffId?: string;
      serviceType?: ServiceType;
    }
  ): Promise<void> {
    try {
      // Find matching active surveys
      const surveys = await this.getActiveSurveys(
        context.serviceType || 'all',
        triggerEvent
      );

      for (const survey of surveys) {
        const config = survey.config;

        // Check auto-trigger
        if (config?.auto_trigger) {
          const delayHours = config.trigger_delay_hours || 2;
          const scheduleTime = new Date(Date.now() + delayHours * 60 * 60 * 1000);

          // Schedule survey delivery
          await this.scheduleSurveyDelivery({
            surveyId: survey.id,
            clientId,
            context,
            scheduledFor: scheduleTime.toISOString(),
            deliveryMethods: this.getPreferredDeliveryMethods(clientId, survey.survey_type)
          });
        }
      }

    } catch (error) {
      console.error('Error triggering survey distribution:', error);
    }
  }

  /**
   * Schedule survey delivery via multiple channels
   */
  private async scheduleSurveyDelivery(params: {
    surveyId: string;
    clientId: string;
    context: any;
    scheduledFor: string;
    deliveryMethods: SubmissionSource[];
  }): Promise<void> {
    // This would integrate with your notification system
    // For now, we'll just log the scheduling
    console.log('Survey delivery scheduled:', params);

    // In a real implementation, you would:
    // 1. Add to a queue system (Redis, Bull, etc.)
    // 2. Send email via your email service
    // 3. Send SMS via your SMS service
    // 4. Create in-app notifications
    // 5. Generate QR codes for physical locations
  }

  /**
   * Get client's preferred feedback channels
   */
  private async getPreferredDeliveryMethods(
    clientId: string,
    surveyType: SurveyType
  ): Promise<SubmissionSource[]> {
    try {
      // Check for VIP preferences
      const { data: vipPrefs } = await supabase
        .from('vip_feedback_preferences')
        .select('preferred_contact_methods, preferred_survey_types')
        .eq('client_id', clientId)
        .single();

      if (vipPrefs && vipPrefs.preferred_survey_types.includes(surveyType)) {
        return vipPrefs.preferred_contact_methods as SubmissionSource[];
      }

      // Default preferences based on survey type
      switch (surveyType) {
        case 'nps':
          return ['email', 'sms'];
        case 'ces':
          return ['in_app', 'email'];
        case 'post_service':
          return ['email', 'sms', 'in_app'];
        default:
          return ['email'];
      }

    } catch (error) {
      console.error('Error getting delivery preferences:', error);
      return ['email']; // Default fallback
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  /**
   * Get device information from browser
   */
  private getDeviceInfo(): DeviceInfo {
    if (typeof window === 'undefined') {
      return { device_type: 'desktop' };
    }

    const userAgent = navigator.userAgent;
    const screen = window.screen;

    return {
      device_type: this.detectDeviceType(userAgent),
      operating_system: this.detectOS(userAgent),
      browser: this.detectBrowser(userAgent),
      screen_resolution: `${screen.width}x${screen.height}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  private detectDeviceType(userAgent: string): 'desktop' | 'tablet' | 'mobile' {
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  }

  private detectOS(userAgent: string): string {
    if (/windows/i.test(userAgent)) return 'Windows';
    if (/mac/i.test(userAgent)) return 'macOS';
    if (/linux/i.test(userAgent)) return 'Linux';
    if (/android/i.test(userAgent)) return 'Android';
    if (/ios|iphone|ipad|ipod/i.test(userAgent)) return 'iOS';
    return 'Unknown';
  }

  private detectBrowser(userAgent: string): string {
    if (/chrome/i.test(userAgent)) return 'Chrome';
    if (/firefox/i.test(userAgent)) return 'Firefox';
    if (/safari/i.test(userAgent)) return 'Safari';
    if (/edge/i.test(userAgent)) return 'Edge';
    if (/opera/i.test(userAgent)) return 'Opera';
    return 'Unknown';
  }

  /**
   * Update submission completion rate
   */
  private async updateCompletionRate(submissionId: string): Promise<void> {
    try {
      // Get total questions for this submission
      const { data: submission } = await supabase
        .from('feedback_submissions')
        .select('survey_id')
        .eq('id', submissionId)
        .single();

      if (!submission) return;

      const { data: survey } = await supabase
        .from('feedback_surveys')
        .select(`
          survey_questions (id)
        `)
        .eq('id', submission.survey_id)
        .single();

      if (!survey) return;

      const totalQuestions = survey.survey_questions?.length || 0;
      if (totalQuestions === 0) return;

      // Get answered questions
      const { count: answeredQuestions } = await supabase
        .from('feedback_responses')
        .select('*', { count: 'exact', head: true })
        .eq('submission_id', submissionId);

      const completionRate = Math.round((answeredQuestions || 0) / totalQuestions * 100);

      await supabase
        .from('feedback_submissions')
        .update({ completion_rate: completionRate })
        .eq('id', submissionId);

    } catch (error) {
      console.error('Error updating completion rate:', error);
    }
  }

  /**
   * Calculate completion time for submission
   */
  private async calculateCompletionTime(submissionId: string): Promise<number> {
    try {
      const { data: submission } = await supabase
        .from('feedback_submissions')
        .select('started_at, completed_at')
        .eq('id', submissionId)
        .single();

      if (!submission?.started_at) return 0;

      const endTime = submission.completed_at ? new Date(submission.completed_at) : new Date();
      const startTime = new Date(submission.started_at);

      return Math.round((endTime.getTime() - startTime.getTime()) / 1000);

    } catch (error) {
      console.error('Error calculating completion time:', error);
      return 0;
    }
  }

  /**
   * Process feedback submission (trigger analytics, alerts, etc.)
   */
  private async processFeedbackSubmission(submissionId: string): Promise<void> {
    try {
      // This will trigger database functions for:
      // 1. Satisfaction metrics calculation
      // 2. Service recovery triggers
      // 3. Sentiment analysis
      // 4. Alert generation

      // The database triggers will handle most of this automatically
      // based on the schema we created

      console.log('Feedback submission processed:', submissionId);

    } catch (error) {
      console.error('Error processing feedback submission:', error);
    }
  }

  /**
   * Get survey statistics
   */
  async getSurveyStatistics(surveyId: string): Promise<{
    totalSubmissions: number;
    completionRate: number;
    averageTimeToComplete: number;
    responseRate: number;
  }> {
    try {
      const { data: submissions } = await supabase
        .from('feedback_submissions')
        .select('*')
        .eq('survey_id', surveyId);

      if (!submissions || submissions.length === 0) {
        return {
          totalSubmissions: 0,
          completionRate: 0,
          averageTimeToComplete: 0,
          responseRate: 0
        };
      }

      const totalSubmissions = submissions.length;
      const completedSubmissions = submissions.filter(s => s.is_complete).length;
      const completionRate = Math.round((completedSubmissions / totalSubmissions) * 100);

      const averageTime = submissions.reduce((sum, s) =>
        sum + (s.time_to_complete || 0), 0) / totalSubmissions;

      // Response rate would need to be calculated based on invitations sent
      // This is a placeholder
      const responseRate = completionRate;

      return {
        totalSubmissions,
        completionRate,
        averageTimeToComplete: Math.round(averageTime),
        responseRate
      };

    } catch (error) {
      console.error('Error getting survey statistics:', error);
      return {
        totalSubmissions: 0,
        completionRate: 0,
        averageTimeToComplete: 0,
        responseRate: 0
      };
    }
  }
}

// Export singleton instance
export const feedbackCollectionService = FeedbackCollectionService.getInstance();