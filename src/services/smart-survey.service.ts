// Smart Survey System with Dynamic Logic
// For luxury beauty/fitness platform feedback collection

import { supabase } from '@/integrations/supabase/client';
import type {
  FeedbackSurvey,
  SurveyQuestion,
  FeedbackSubmission,
  SurveyResponseData,
  SurveyType,
  QuestionType,
  ServiceType,
  SubmissionSource,
  ConditionalLogic,
  QuestionConfig
} from '@/types/feedback';

export interface SurveyProgress {
  submissionId: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  completedQuestions: string[];
  responses: Record<string, any>;
  isComplete: boolean;
  timeSpent: number;
  estimatedTimeRemaining: number;
}

export interface SurveyDisplayQuestion extends SurveyQuestion {
  shouldShow: boolean;
  isAnswered: boolean;
  conditionalMet: boolean;
}

export interface SurveyTemplate {
  id: string;
  name: string;
  description: string;
  surveyType: SurveyType;
  targetServiceTypes: ServiceType[];
  triggerConditions: TriggerCondition[];
  questions: SurveyQuestion[];
  config: SurveyConfig;
}

export interface TriggerCondition {
  type: 'booking_completed' | 'service_completed' | 'time_delay' | 'client_segment' | 'service_type' | 'staff_type';
  value: any;
  operator?: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
  delayHours?: number;
}

export interface SurveyResponse {
  questionId: string;
  value: any;
  responseTime?: number;
  isValid: boolean;
  validationErrors?: string[];
}

export class SmartSurveyService {
  private activeSurveys: Map<string, SurveyProgress> = new Map();
  private surveyCache: Map<string, FeedbackSurvey> = new Map();
  private readonly DEFAULT_ESTIMATED_TIME_PER_QUESTION = 30; // seconds

  // ========================================
  // SURVEY CREATION AND MANAGEMENT
  // ========================================

  /**
   * Create smart survey with dynamic logic
   */
  async createSmartSurvey(surveyData: {
    title: { en: string; pl: string };
    description?: { en: string; pl: string };
    surveyType: SurveyType;
    serviceTypes: ServiceType[];
    triggerConditions: TriggerCondition[];
    questions: Array<{
      text: { en: string; pl: string };
      type: QuestionType;
      required: boolean;
      config: QuestionConfig;
      conditionalLogic?: ConditionalLogic;
      displayOrder: number;
    }>;
    config?: SurveyConfig;
  }): Promise<FeedbackSurvey> {
    try {
      // Create the survey
      const { data: survey, error: surveyError } = await supabase
        .from('feedback_surveys')
        .insert({
          title_en: surveyData.title.en,
          title_pl: surveyData.title.pl,
          description_en: surveyData.description?.en,
          description_pl: surveyData.description?.pl,
          survey_type: surveyData.surveyType,
          service_type: surveyData.serviceTypes.length === 1 ? surveyData.serviceTypes[0] : 'all',
          trigger_events: surveyData.triggerConditions.map(c => c.type),
          is_active: true,
          is_template: false,
          config: {
            ...surveyData.config,
            trigger_conditions: surveyData.triggerConditions,
            dynamic_logic: true,
            adaptive_questions: true
          }
        })
        .select()
        .single();

      if (surveyError) throw surveyError;

      // Create questions
      const questionsData = surveyData.questions.map(q => ({
        survey_id: survey.id,
        question_text_en: q.text.en,
        question_text_pl: q.text.pl,
        question_type: q.type,
        display_order: q.displayOrder,
        is_required: q.required,
        config: q.config,
        conditional_logic: q.conditionalLogic || {},
        validation_rules: this.generateValidationRules(q.type, q.config, q.required)
      }));

      const { error: questionsError } = await supabase
        .from('survey_questions')
        .insert(questionsData);

      if (questionsError) throw questionsError;

      // Clear cache
      this.surveyCache.clear();

      return survey;
    } catch (error) {
      console.error('Error creating smart survey:', error);
      throw error;
    }
  }

  /**
   * Generate validation rules for question
   */
  private generateValidationRules(
    questionType: QuestionType,
    config: QuestionConfig,
    required: boolean
  ): any {
    const rules: any = { required };

    switch (questionType) {
      case 'text':
        if (config.max_length) {
          rules.max_length = config.max_length;
        }
        if (config.min_length) {
          rules.min_length = config.min_length;
        }
        break;
      case 'rating':
      case 'star_rating':
        if (config.scale) {
          rules.min_value = config.scale.min;
          rules.max_value = config.scale.max;
        }
        break;
      case 'multiple_choice':
        if (!config.allow_multiple && config.options) {
          rules.pattern = `^(${config.options.en.map(o => o.value).join('|')})$`;
        }
        break;
    }

    return rules;
  }

  /**
   * Get survey with dynamic question evaluation
   */
  async getSurveyForDisplay(
    surveyId: string,
    submissionId?: string,
    currentResponses: Record<string, any> = {}
  ): Promise<{
    survey: FeedbackSurvey;
    questions: SurveyDisplayQuestion[];
    progress: {
      currentIndex: number;
      totalVisible: number;
      completed: number;
      percentage: number;
    };
  }> {
    try {
      // Get survey with cache
      let survey = this.surveyCache.get(surveyId);
      if (!survey) {
        const { data, error } = await supabase
          .from('feedback_surveys')
          .select('*')
          .eq('id', surveyId)
          .single();

        if (error) throw error;
        survey = data;
        this.surveyCache.set(surveyId, survey);
      }

      // Get questions
      const { data: questions, error: questionsError } = await supabase
        .from('survey_questions')
        .select('*')
        .eq('survey_id', surveyId)
        .order('display_order', { ascending: true });

      if (questionsError) throw questionsError;

      // Evaluate conditional logic for each question
      const displayQuestions: SurveyDisplayQuestion[] = (questions || []).map(question => {
        const shouldShow = this.evaluateConditionalLogic(question.conditional_logic, currentResponses);
        const isAnswered = currentResponses[question.id] !== undefined;

        return {
          ...question,
          shouldShow,
          isAnswered,
          conditionalMet: shouldShow
        };
      });

      // Calculate progress
      const visibleQuestions = displayQuestions.filter(q => q.shouldShow);
      const completedCount = visibleQuestions.filter(q => q.isAnswered).length;
      const currentIndex = this.findNextUnansweredQuestion(visibleQuestions);

      return {
        survey,
        questions: displayQuestions,
        progress: {
          currentIndex,
          totalVisible: visibleQuestions.length,
          completed: completedCount,
          percentage: visibleQuestions.length > 0 ? Math.round((completedCount / visibleQuestions.length) * 100) : 0
        }
      };
    } catch (error) {
      console.error('Error getting survey for display:', error);
      throw error;
    }
  }

  /**
   * Evaluate conditional logic for question display
   */
  private evaluateConditionalLogic(
    conditionalLogic: ConditionalLogic,
    responses: Record<string, any>
  ): boolean {
    // If no conditional logic, always show
    if (!conditionalLogic || (!conditionalLogic.show_if && !conditionalLogic.hide_if)) {
      return true;
    }

    // Check show conditions
    if (conditionalLogic.show_if && conditionalLogic.show_if.length > 0) {
      const showConditionsMet = conditionalLogic.show_if.some(condition =>
        this.evaluateCondition(condition, responses)
      );
      if (!showConditionsMet) return false;
    }

    // Check hide conditions
    if (conditionalLogic.hide_if && conditionalLogic.hide_if.length > 0) {
      const hideConditionsMet = conditionalLogic.hide_if.some(condition =>
        this.evaluateCondition(condition, responses)
      );
      if (hideConditionsMet) return false;
    }

    return true;
  }

  /**
   * Evaluate individual condition
   */
  private evaluateCondition(
    condition: {
      question_id: string;
      operator: string;
      value: any;
    },
    responses: Record<string, any>
  ): boolean {
    const responseValue = responses[condition.question_id];

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
        if (Array.isArray(responseValue)) {
          return responseValue.includes(condition.value);
        }
        return String(responseValue).toLowerCase().includes(String(condition.value).toLowerCase());
      case 'not_contains':
        if (Array.isArray(responseValue)) {
          return !responseValue.includes(condition.value);
        }
        return !String(responseValue).toLowerCase().includes(String(condition.value).toLowerCase());
      case 'in':
        if (Array.isArray(condition.value)) {
          return condition.value.includes(responseValue);
        }
        return false;
      default:
        return false;
    }
  }

  /**
   * Find next unanswered question index
   */
  private findNextUnansweredQuestion(questions: SurveyDisplayQuestion[]): number {
    const unansweredIndex = questions.findIndex(q => q.shouldShow && !q.isAnswered);
    return unansweredIndex >= 0 ? unansweredIndex : questions.length - 1;
  }

  // ========================================
  // SURVEY PROGRESS MANAGEMENT
  // ========================================

  /**
   * Initialize survey progress
   */
  async initializeSurveyProgress(
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
  ): Promise<SurveyProgress> {
    try {
      // Create submission
      const submission = await supabase
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

      if (submission.error) throw submission.error;

      // Get total visible questions
      const { data: questions } = await supabase
        .from('survey_questions')
        .select('*')
        .eq('survey_id', surveyId);

      const totalVisible = questions?.filter(q => this.evaluateConditionalLogic(q.conditional_logic, {})).length || 0;

      const progress: SurveyProgress = {
        submissionId: submission.data.id,
        currentQuestionIndex: 0,
        totalQuestions: totalVisible,
        completedQuestions: [],
        responses: {},
        isComplete: false,
        timeSpent: 0,
        estimatedTimeRemaining: totalVisible * this.DEFAULT_ESTIMATED_TIME_PER_QUESTION
      };

      this.activeSurveys.set(submission.data.id, progress);
      return progress;
    } catch (error) {
      console.error('Error initializing survey progress:', error);
      throw error;
    }
  }

  /**
   * Get survey progress
   */
  getSurveyProgress(submissionId: string): SurveyProgress | null {
    return this.activeSurveys.get(submissionId) || null;
  }

  /**
   * Update survey response
   */
  async updateSurveyResponse(
    submissionId: string,
    questionId: string,
    response: any,
    responseTime?: number
  ): Promise<{
    progress: SurveyProgress;
    nextQuestion: SurveyDisplayQuestion | null;
    shouldComplete: boolean;
  }> {
    try {
      let progress = this.activeSurveys.get(submissionId);
      if (!progress) {
        throw new Error('Survey progress not found');
      }

      // Update response
      progress.responses[questionId] = response;
      progress.timeSpent += responseTime || 0;

      if (!progress.completedQuestions.includes(questionId)) {
        progress.completedQuestions.push(questionId);
      }

      // Get updated survey with conditional logic
      const { questions } = await this.getSurveyForDisplay(
        (await supabase
          .from('feedback_submissions')
          .select('survey_id')
          .eq('id', submissionId)
          .single()
        ).data?.survey_id || '',
        submissionId,
        progress.responses
      );

      // Find next unanswered question
      const visibleQuestions = questions.filter(q => q.shouldShow);
      const nextUnansweredIndex = visibleQuestions.findIndex(q => !q.isAnswered);
      const nextQuestion = nextUnansweredIndex >= 0 ? visibleQuestions[nextUnansweredIndex] : null;

      // Update progress
      progress.currentQuestionIndex = nextUnansweredIndex >= 0 ? nextUnansweredIndex : visibleQuestions.length - 1;
      progress.totalQuestions = visibleQuestions.length;
      progress.estimatedTimeRemaining = (visibleQuestions.length - progress.completedQuestions.length) * this.DEFAULT_ESTIMATED_TIME_PER_QUESTION;

      // Save response to database
      await supabase
        .from('feedback_responses')
        .upsert({
          submission_id: submissionId,
          question_id: questionId,
          response_value: typeof response === 'string' ? response : null,
          response_number: typeof response === 'number' ? response : null,
          response_array: Array.isArray(response) ? response : null,
          response_time_seconds: responseTime,
          answered_at: new Date().toISOString()
        }, {
          onConflict: 'submission_id,question_id'
        });

      // Update submission completion rate
      const completionRate = Math.round((progress.completedQuestions.length / progress.totalQuestions) * 100);
      await supabase
        .from('feedback_submissions')
        .update({
          completion_rate: completionRate
        })
        .eq('id', submissionId);

      this.activeSurveys.set(submissionId, progress);

      return {
        progress,
        nextQuestion,
        shouldComplete: !nextQuestion
      };
    } catch (error) {
      console.error('Error updating survey response:', error);
      throw error;
    }
  }

  /**
   * Complete survey
   */
  async completeSurvey(submissionId: string): Promise<void> {
    try {
      const progress = this.activeSurveys.get(submissionId);
      if (!progress) {
        throw new Error('Survey progress not found');
      }

      // Mark submission as complete
      await supabase
        .from('feedback_submissions')
        .update({
          is_complete: true,
          completed_at: new Date().toISOString(),
          time_to_complete: progress.timeSpent
        })
        .eq('id', submissionId);

      // Update progress
      progress.isComplete = true;
      this.activeSurveys.set(submissionId, progress);

      // Process completed submission (analytics, alerts, etc.)
      // This would call the feedback service processing logic
    } catch (error) {
      console.error('Error completing survey:', error);
      throw error;
    }
  }

  // ========================================
  // ADAPTIVE SURVEY LOGIC
  // ========================================

  /**
   * Get adaptive next question based on previous responses
   */
  async getAdaptiveNextQuestion(
    submissionId: string,
    currentQuestionId: string,
    response: any
  ): Promise<SurveyDisplayQuestion | null> {
    try {
      const progress = this.activeSurveys.get(submissionId);
      if (!progress) {
        throw new Error('Survey progress not found');
      }

      // Analyze response sentiment for adaptive logic
      const sentiment = this.analyzeResponseSentiment(response);

      // Get survey data
      const surveyData = await this.getSurveyForDisplay(
        (await supabase
          .from('feedback_submissions')
          .select('survey_id')
          .eq('id', submissionId)
          .single()
        ).data?.survey_id || '',
        submissionId,
        { ...progress.responses, [currentQuestionId]: response }
      );

      // Apply adaptive logic
      const nextQuestion = this.applyAdaptiveLogic(surveyData.questions, sentiment, response);

      return nextQuestion;
    } catch (error) {
      console.error('Error getting adaptive next question:', error);
      return null;
    }
  }

  /**
   * Analyze response sentiment for adaptive logic
   */
  private analyzeResponseSentiment(response: any): 'positive' | 'negative' | 'neutral' {
    if (typeof response === 'number') {
      if (response >= 4) return 'positive';
      if (response <= 2) return 'negative';
      return 'neutral';
    }

    if (typeof response === 'string') {
      const positiveWords = ['excellent', 'great', 'amazing', 'fantastic', 'love', 'perfect', 'wonderful'];
      const negativeWords = ['terrible', 'awful', 'bad', 'poor', 'hate', 'disappointing', 'horrible'];

      const text = response.toLowerCase();
      const hasPositive = positiveWords.some(word => text.includes(word));
      const hasNegative = negativeWords.some(word => text.includes(word));

      if (hasPositive && !hasNegative) return 'positive';
      if (hasNegative && !hasPositive) return 'negative';
      return 'neutral';
    }

    return 'neutral';
  }

  /**
   * Apply adaptive logic to determine next question
   */
  private applyAdaptiveLogic(
    questions: SurveyDisplayQuestion[],
    sentiment: 'positive' | 'negative' | 'neutral',
    response: any
  ): SurveyDisplayQuestion | null {
    // If negative sentiment, prioritize follow-up questions for recovery
    if (sentiment === 'negative') {
      const followUpQuestions = questions.filter(q =>
        q.shouldShow &&
        !q.isAnswered &&
        q.question_text_en.toLowerCase().includes('improve') ||
        q.question_text_en.toLowerCase().includes('issue') ||
        q.question_text_en.toLowerCase().includes('problem')
      );

      if (followUpQuestions.length > 0) {
        return followUpQuestions[0];
      }
    }

    // If positive sentiment, prioritize referral/promoter questions
    if (sentiment === 'positive') {
      const referralQuestions = questions.filter(q =>
        q.shouldShow &&
        !q.isAnswered &&
        (q.question_text_en.toLowerCase().includes('recommend') ||
         q.question_text_en.toLowerCase().includes('friend'))
      );

      if (referralQuestions.length > 0) {
        return referralQuestions[0];
      }
    }

    // Default to next unanswered question
    return questions.find(q => q.shouldShow && !q.isAnswered) || null;
  }

  // ========================================
  // SURVEY TRIGGERING AND AUTOMATION
  // ========================================

  /**
   * Check and trigger surveys based on conditions
   */
  async checkAndTriggerSurveys(eventData: {
    type: string;
    clientId: string;
    bookingId?: string;
    serviceId?: string;
    staffId?: string;
    timestamp: string;
    metadata?: any;
  }): Promise<FeedbackSurvey[]> {
    try {
      // Get active surveys
      const { data: surveys, error } = await supabase
        .from('feedback_surveys')
        .select('*')
        .eq('is_active', true)
        .contains('trigger_events', [eventData.type]);

      if (error) throw error;

      const triggeredSurveys: FeedbackSurvey[] = [];

      for (const survey of surveys || []) {
        if (await this.shouldTriggerSurvey(survey, eventData)) {
          triggeredSurveys.push(survey);
          await this.scheduleSurveyTrigger(survey, eventData);
        }
      }

      return triggeredSurveys;
    } catch (error) {
      console.error('Error checking and triggering surveys:', error);
      return [];
    }
  }

  /**
   * Check if survey should be triggered for specific event
   */
  private async shouldTriggerSurvey(
    survey: FeedbackSurvey,
    eventData: any
  ): Promise<boolean> {
    const triggerConditions = survey.config?.trigger_conditions || [];

    for (const condition of triggerConditions) {
      if (!this.evaluateTriggerCondition(condition, eventData)) {
        return false;
      }
    }

    // Check if client already received similar survey recently
    const recentSubmission = await this.checkRecentSubmission(survey.id, eventData.clientId);
    if (recentSubmission) {
      return false;
    }

    return true;
  }

  /**
   * Evaluate trigger condition
   */
  private evaluateTriggerCondition(condition: TriggerCondition, eventData: any): boolean {
    switch (condition.type) {
      case 'booking_completed':
        return eventData.type === 'booking_completed';
      case 'service_completed':
        return eventData.type === 'service_completed';
      case 'service_type':
        return eventData.serviceId ? this.checkServiceType(eventData.serviceId, condition.value) : false;
      case 'time_delay':
        const timeDiff = new Date().getTime() - new Date(eventData.timestamp).getTime();
        const delayHours = condition.delayHours || 24;
        return timeDiff >= delayHours * 60 * 60 * 1000;
      case 'client_segment':
        return this.checkClientSegment(eventData.clientId, condition.value);
      default:
        return false;
    }
  }

  /**
   * Check service type condition
   */
  private async checkServiceType(serviceId: string, expectedTypes: ServiceType[]): Promise<boolean> {
    try {
      const { data: service, error } = await supabase
        .from('services')
        .select('type')
        .eq('id', serviceId)
        .single();

      if (error || !service) return false;
      return expectedTypes.includes(service.type);
    } catch (error) {
      console.error('Error checking service type:', error);
      return false;
    }
  }

  /**
   * Check client segment condition
   */
  private async checkClientSegment(clientId: string, expectedSegments: string[]): Promise<boolean> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('client_segment, vip_status')
        .eq('id', clientId)
        .single();

      if (error || !profile) return false;

      const segments = [];
      if (profile.client_segment) segments.push(profile.client_segment);
      if (profile.vip_status) segments.push('vip');

      return expectedSegments.some(segment => segments.includes(segment));
    } catch (error) {
      console.error('Error checking client segment:', error);
      return false;
    }
  }

  /**
   * Check for recent submission to avoid survey fatigue
   */
  private async checkRecentSubmission(surveyId: string, clientId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('feedback_submissions')
        .select('id')
        .eq('survey_id', surveyId)
        .eq('client_id', clientId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // 7 days
        .single();

      return !error && data !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Schedule survey trigger (send email, SMS, etc.)
   */
  private async scheduleSurveyTrigger(survey: FeedbackSurvey, eventData: any): Promise<void> {
    try {
      const delayHours = survey.config?.trigger_delay_hours || 2;
      const triggerTime = new Date(Date.now() + delayHours * 60 * 60 * 1000);

      // In a real implementation, this would schedule actual notifications
      console.log(`Survey ${survey.id} scheduled for ${eventData.clientId} at ${triggerTime}`);

      // Store trigger record for tracking
      await supabase
        .from('survey_triggers')
        .insert({
          survey_id: survey.id,
          client_id: eventData.client_id,
          booking_id: eventData.booking_id,
          service_id: eventData.service_id,
          staff_id: eventData.staff_id,
          trigger_type: eventData.type,
          scheduled_at: triggerTime.toISOString(),
          status: 'scheduled',
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error scheduling survey trigger:', error);
    }
  }

  // ========================================
  // SURVEY VALIDATION
  // ========================================

  /**
   * Validate survey response
   */
  validateResponse(question: SurveyQuestion, response: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Required validation
    if (question.is_required && (response === null || response === undefined || response === '')) {
      errors.push('This field is required');
    }

    // Type-specific validation
    switch (question.question_type) {
      case 'text':
        this.validateTextResponse(question, response, errors);
        break;
      case 'rating':
      case 'star_rating':
        this.validateRatingResponse(question, response, errors);
        break;
      case 'multiple_choice':
        this.validateMultipleChoiceResponse(question, response, errors);
        break;
      case 'nps':
        this.validateNPSResponse(question, response, errors);
        break;
      case 'ces':
        this.validateCESResponse(question, response, errors);
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate text response
   */
  private validateTextResponse(question: SurveyQuestion, response: any, errors: string[]): void {
    if (typeof response !== 'string') {
      errors.push('Response must be text');
      return;
    }

    if (question.validation_rules?.min_length && response.length < question.validation_rules.min_length) {
      errors.push(`Response must be at least ${question.validation_rules.min_length} characters`);
    }

    if (question.validation_rules?.max_length && response.length > question.validation_rules.max_length) {
      errors.push(`Response must be no more than ${question.validation_rules.max_length} characters`);
    }

    if (question.validation_rules?.pattern) {
      const regex = new RegExp(question.validation_rules.pattern);
      if (!regex.test(response)) {
        errors.push('Response format is invalid');
      }
    }
  }

  /**
   * Validate rating response
   */
  private validateRatingResponse(question: SurveyQuestion, response: any, errors: string[]): void {
    if (typeof response !== 'number') {
      errors.push('Response must be a number');
      return;
    }

    const min = question.config?.scale?.min || 1;
    const max = question.config?.scale?.max || 5;

    if (response < min || response > max) {
      errors.push(`Response must be between ${min} and ${max}`);
    }
  }

  /**
   * Validate multiple choice response
   */
  private validateMultipleChoiceResponse(question: SurveyQuestion, response: any, errors: string[]): void {
    const validOptions = question.config?.options?.en?.map(o => o.value) || [];

    if (Array.isArray(response)) {
      // Multiple selection
      if (!question.config?.allow_multiple) {
        errors.push('Only one option can be selected');
        return;
      }

      const invalidOptions = response.filter(r => !validOptions.includes(r));
      if (invalidOptions.length > 0) {
        errors.push('Invalid options selected');
      }
    } else {
      // Single selection
      if (!validOptions.includes(response)) {
        errors.push('Invalid option selected');
      }
    }
  }

  /**
   * Validate NPS response
   */
  private validateNPSResponse(question: SurveyQuestion, response: any, errors: string[]): void {
    if (typeof response !== 'number') {
      errors.push('Response must be a number');
      return;
    }

    if (response < 0 || response > 10) {
      errors.push('Response must be between 0 and 10');
    }
  }

  /**
   * Validate CES response
   */
  private validateCESResponse(question: SurveyQuestion, response: any, errors: string[]): void {
    if (typeof response !== 'number') {
      errors.push('Response must be a number');
      return;
    }

    if (response < 1 || response > 7) {
      errors.push('Response must be between 1 and 7');
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Clear active survey progress
   */
  clearSurveyProgress(submissionId: string): void {
    this.activeSurveys.delete(submissionId);
  }

  /**
   * Clear survey cache
   */
  clearSurveyCache(): void {
    this.surveyCache.clear();
  }

  /**
   * Get active surveys count
   */
  getActiveSurveysCount(): number {
    return this.activeSurveys.size;
  }
}

// Export singleton instance
export const smartSurveyService = new SmartSurveyService();