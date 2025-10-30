/**
 * Client Recovery and VIP Feedback Service
 * Automated service recovery workflows and VIP client management
 */

import { supabase } from '@/integrations/supabase/client';
import {
  ServiceRecoveryCase,
  RecoveryTask,
  RecoveryCompensation,
  RecoveryPriority,
  RecoveryStatus,
  RecoveryTaskType,
  TaskStatus,
  CompensationType,
  CompensationStatus,
  VIPFeedbackPreferences,
  FeedbackType,
  SubmissionSource,
  SurveyType,
  PersonalizedQuestion,
  FeedbackTimingPreferences,
  IncentivePreferences,
  LogicCondition,
  AlertSeverity
} from '@/types/feedback';

export class ClientRecoveryService {
  private static instance: ClientRecoveryService;

  static getInstance(): ClientRecoveryService {
    if (!ClientRecoveryService.instance) {
      ClientRecoveryService.instance = new ClientRecoveryService();
    }
    return ClientRecoveryService.instance;
  }

  // =====================================================
  // SERVICE RECOVERY WORKFLOWS
  // =====================================================

  /**
   * Trigger service recovery based on feedback
   */
  async triggerServiceRecovery(
    feedbackId: string,
    feedbackType: FeedbackType,
    clientId: string,
    satisfactionScore?: number,
    context?: {
      bookingId?: string;
      serviceId?: string;
      staffId?: string;
      feedbackText?: string;
    }
  ): Promise<ServiceRecoveryCase> {
    try {
      // Determine recovery priority based on satisfaction score and content
      const priority = this.determineRecoveryPriority(satisfactionScore, context?.feedbackText);

      // Create recovery case
      const { data: recoveryCase, error } = await supabase
        .from('service_recovery_cases')
        .insert({
          client_id: clientId,
          trigger_feedback_id: feedbackId,
          booking_id: context?.bookingId,
          service_id: context?.serviceId,
          staff_id: context?.staffId,
          recovery_priority: priority,
          recovery_status: 'new',
          satisfaction_before: satisfactionScore,
          follow_up_required: true,
          case_notes: this.generateInitialCaseNotes(satisfactionScore, context?.feedbackText)
        })
        .select()
        .single();

      if (error) throw error;

      // Create recovery tasks
      await this.createRecoveryTasks(recoveryCase.id, priority, context);

      // Check for VIP client and apply special handling
      const isVIP = await this.checkIfVIPClient(clientId);
      if (isVIP) {
        await this.handleVIPRecovery(recoveryCase.id, clientId, priority);
      }

      // Trigger immediate alerts for high-priority cases
      if (priority === 'critical' || priority === 'high') {
        await this.triggerRecoveryAlerts(recoveryCase.id, priority);
      }

      return recoveryCase as ServiceRecoveryCase;

    } catch (error) {
      console.error('Error triggering service recovery:', error);
      throw new Error('Failed to trigger service recovery');
    }
  }

  /**
   * Update recovery case
   */
  async updateRecoveryCase(
    caseId: string,
    updates: Partial<ServiceRecoveryCase>
  ): Promise<ServiceRecoveryCase> {
    try {
      const { data, error } = await supabase
        .from('service_recovery_cases')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', caseId)
        .select()
        .single();

      if (error) throw error;

      // If case is resolved, calculate effectiveness
      if (updates.recovery_status === 'resolved' && updates.satisfaction_after) {
        await this.calculateRecoveryEffectiveness(caseId);
      }

      return data as ServiceRecoveryCase;

    } catch (error) {
      console.error('Error updating recovery case:', error);
      throw new Error('Failed to update recovery case');
    }
  }

  /**
   * Add recovery task
   */
  async addRecoveryTask(
    caseId: string,
    taskType: RecoveryTaskType,
    taskDescription: string,
    assignedTo?: string,
    dueDate?: string
  ): Promise<RecoveryTask> {
    try {
      const { data, error } = await supabase
        .from('recovery_tasks')
        .insert({
          recovery_case_id: caseId,
          task_type: taskType,
          task_description,
          task_status: 'pending',
          assigned_to: assignedTo,
          due_date: dueDate || this.calculateDueDate(taskType),
          task_metadata: {
            created_automatically: true,
            priority_weight: this.getTaskPriorityWeight(taskType)
          }
        })
        .select()
        .single();

      if (error) throw error;

      return data as RecoveryTask;

    } catch (error) {
      console.error('Error adding recovery task:', error);
      throw new Error('Failed to add recovery task');
    }
  }

  /**
   * Complete recovery task
   */
  async completeRecoveryTask(
    taskId: string,
    completionNotes?: string
  ): Promise<RecoveryTask> {
    try {
      const { data, error } = await supabase
        .from('recovery_tasks')
        .update({
          task_status: 'completed',
          completed_at: new Date().toISOString(),
          completion_notes
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      // Check if all tasks are completed
      await this.checkRecoveryCaseCompletion(data.recovery_case_id);

      return data as RecoveryTask;

    } catch (error) {
      console.error('Error completing recovery task:', error);
      throw new Error('Failed to complete recovery task');
    }
  }

  /**
   * Offer compensation
   */
  async offerCompensation(
    caseId: string,
    compensationType: CompensationType,
    compensationValue?: number,
    compensationDetails?: string,
    expiresAfterDays?: number
  ): Promise<RecoveryCompensation> {
    try {
      const { data, error } = await supabase
        .from('recovery_compensation')
        .insert({
          recovery_case_id: caseId,
          compensation_type: compensationType,
          compensation_value: compensationValue || this.getDefaultCompensationValue(compensationType),
          compensation_details,
          offer_status: 'offered',
          offered_at: new Date().toISOString(),
          expires_at: expiresAfterDays
            ? new Date(Date.now() + expiresAfterDays * 24 * 60 * 60 * 1000).toISOString()
            : undefined
        })
        .select()
        .single();

      if (error) throw error;

      // Send compensation notification
      await this.sendCompensationNotification(data.id, caseId);

      return data as RecoveryCompensation;

    } catch (error) {
      console.error('Error offering compensation:', error);
      throw new Error('Failed to offer compensation');
    }
  }

  /**
   * Handle client response to compensation
   */
  async handleCompensationResponse(
    compensationId: string,
    response: 'accepted' | 'declined',
    clientResponse?: string
  ): Promise<RecoveryCompensation> {
    try {
      const { data, error } = await supabase
        .from('recovery_compensation')
        .update({
          offer_status: response,
          client_response
        })
        .eq('id', compensationId)
        .select()
        .single();

      if (error) throw error;

      // Update recovery case if compensation was declined
      if (response === 'declined') {
        await this.updateRecoveryCase(data.recovery_case_id, {
          recovery_status: 'escalated',
          case_notes: `Compensation declined. Client response: ${clientResponse || 'No response provided'}`
        });
      }

      return data as RecoveryCompensation;

    } catch (error) {
      console.error('Error handling compensation response:', error);
      throw new Error('Failed to handle compensation response');
    }
  }

  // =====================================================
  // VIP CLIENT MANAGEMENT
  // =====================================================

  /**
   * Set up VIP feedback preferences
   */
  async setupVIPPreferences(
    clientId: string,
    preferences: Partial<VIPFeedbackPreferences>
  ): Promise<VIPFeedbackPreferences> {
    try {
      const { data, error } = await supabase
        .from('vip_feedback_preferences')
        .upsert({
          client_id: clientId,
          preferred_contact_methods: preferences.preferred_contact_methods || ['email', 'in_app'],
          preferred_survey_types: preferences.preferred_survey_types || ['post_service', 'nps'],
          personalized_questions: preferences.personalized_questions || [],
          white_glove_service: preferences.white_glove_service ?? true,
          executive_review_required: preferences.executive_review_required ?? true,
          feedback_timing: preferences.feedback_timing || this.getDefaultFeedbackTiming(),
          incentive_preferences: preferences.incentive_preferences || this.getDefaultIncentivePreferences(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return data as VIPFeedbackPreferences;

    } catch (error) {
      console.error('Error setting up VIP preferences:', error);
      throw new Error('Failed to set up VIP preferences');
    }
  }

  /**
   * Get VIP feedback preferences
   */
  async getVIPPreferences(clientId: string): Promise<VIPFeedbackPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('vip_feedback_preferences')
        .select('*')
        .eq('client_id', clientId)
        .single();

      if (error) return null;

      return data as VIPFeedbackPreferences;

    } catch (error) {
      console.error('Error getting VIP preferences:', error);
      return null;
    }
  }

  /**
   * Create personalized survey for VIP client
   */
  async createPersonalizedSurvey(
    clientId: string,
    surveyType: SurveyType,
    context: {
      serviceType?: string;
      staffId?: string;
      bookingId?: string;
    }
  ): Promise<string> {
    try {
      const preferences = await this.getVIPPreferences(clientId);
      const personalizedQuestions = preferences?.personalized_questions || [];

      // Create a custom survey with personalized questions
      const surveyTitle = `Exclusive Feedback Request - ${preferences?.white_glove_service ? 'VIP' : 'Valued'} Client`;

      // Generate personalized questions based on client history
      const clientSpecificQuestions = await this.generateClientSpecificQuestions(clientId, context);

      const surveyData = {
        title_en: surveyTitle,
        title_pl: `Ekskluzywna Prośba o Opinię - ${preferences?.white_glove_service ? 'VIP' : 'Szanowany'} Klient`,
        description_en: 'Your feedback is incredibly valuable to us. As a valued client, your insights help us continuously improve our premium services.',
        description_pl: 'Twoja opinia jest dla nas niezwykle cenna. Jako ceniony klient pomagasz nam nieustannie poprawiać nasze usługi premium.',
        survey_type: surveyType,
        service_type: context.serviceType || 'all',
        trigger_events: ['vip_request'],
        config: {
          auto_trigger: false,
          custom_branding: true,
          incentive_offered: true,
          white_glove_service: preferences?.white_glove_service || false
        },
        questions: [
          ...personalizedQuestions.map(q => ({
            question_text_en: q.question_text,
            question_text_pl: q.question_text,
            question_type: q.question_type,
            display_order: 1,
            is_required: true,
            config: {},
            conditional_logic: { show_if: q.trigger_conditions },
            validation_rules: { required: true }
          })),
          ...clientSpecificQuestions
        ]
      };

      // This would integrate with the feedback collection service
      // For now, return a mock survey ID
      const mockSurveyId = `vip_survey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Send personalized invitation
      await this.sendPersonalizedSurveyInvitation(clientId, mockSurveyId, preferences);

      return mockSurveyId;

    } catch (error) {
      console.error('Error creating personalized survey:', error);
      throw new Error('Failed to create personalized survey');
    }
  }

  /**
   * Handle VIP recovery with enhanced protocol
   */
  async handleVIPRecovery(
    caseId: string,
    clientId: string,
    priority: RecoveryPriority
  ): Promise<void> {
    try {
      const preferences = await this.getVIPPreferences(clientId);

      // Escalate to executive review if required
      if (preferences?.executive_review_required) {
        await this.escalateToExecutive(caseId, clientId);
      }

      // Apply white-glove service recovery
      if (preferences?.white_glove_service) {
        await this.initiateWhiteGloveRecovery(caseId, clientId, priority);
      }

      // Use preferred contact methods
      if (preferences?.preferred_contact_methods) {
        await this.notifyViaPreferredMethods(clientId, caseId, preferences.preferred_contact_methods);
      }

      // Update recovery case with VIP handling
      await this.updateRecoveryCase(caseId, {
        recovery_status: 'in_progress',
        case_notes: `VIP client recovery protocol initiated. Executive review: ${preferences?.executive_review_required}, White-glove service: ${preferences?.white_glove_service}`
      });

    } catch (error) {
      console.error('Error handling VIP recovery:', error);
      throw new Error('Failed to handle VIP recovery');
    }
  }

  // =====================================================
  // RECOVERY ANALYTICS
  // =====================================================

  /**
   * Get recovery effectiveness metrics
   */
  async getRecoveryEffectiveness(
    dateRange?: { start: string; end: string }
  ): Promise<{
    totalCases: number;
    resolvedCases: number;
    successRate: number;
    averageSatisfactionImprovement: number;
    averageResolutionTime: number;
    totalCompensationCost: number;
    casesByPriority: Record<RecoveryPriority, number>;
    successRateByPriority: Record<RecoveryPriority, number>;
  }> {
    try {
      let query = supabase
        .from('service_recovery_cases')
        .select('*');

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);
      }

      const { data, error } = await query;
      if (error || !data) throw error;

      const totalCases = data.length;
      const resolvedCases = data.filter(c => c.recovery_status === 'resolved').length;
      const successRate = totalCases > 0 ? (resolvedCases / totalCases) * 100 : 0;

      // Calculate satisfaction improvement
      const improvementCases = data.filter(c =>
        c.satisfaction_before !== null && c.satisfaction_after !== null
      );
      const averageImprovement = improvementCases.length > 0
        ? improvementCases.reduce((sum, c) =>
            sum + ((c.satisfaction_after || 0) - (c.satisfaction_before || 0)), 0
          ) / improvementCases.length
        : 0;

      // Calculate average resolution time
      const resolvedCasesWithTime = data.filter(c =>
        c.recovery_status === 'resolved' && c.created_at && c.updated_at
      );
      const averageResolutionTime = resolvedCasesWithTime.length > 0
        ? resolvedCasesWithTime.reduce((sum, c) => {
            const resolutionTime = new Date(c.updated_at).getTime() - new Date(c.created_at).getTime();
            return sum + resolutionTime;
          }, 0) / resolvedCasesWithTime.length / (1000 * 60 * 60) // Convert to hours
        : 0;

      // Get compensation costs
      const caseIds = data.map(c => c.id);
      const { data: compensations } = await supabase
        .from('recovery_compensation')
        .select('compensation_value')
        .in('recovery_case_id', caseIds);

      const totalCompensationCost = compensations?.reduce((sum, comp) =>
        sum + (comp.compensation_value || 0), 0) || 0;

      // Calculate metrics by priority
      const casesByPriority: Record<RecoveryPriority, number> = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      };

      const successRateByPriority: Record<RecoveryPriority, number> = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      };

      const casesByPriorityData: Record<RecoveryPriority, any[]> = {
        critical: [],
        high: [],
        medium: [],
        low: []
      };

      data.forEach(case_ => {
        casesByPriority[case_.recovery_priority]++;
        casesByPriorityData[case_.recovery_priority].push(case_);
      });

      Object.keys(casesByPriorityData).forEach(priority => {
        const priorityKey = priority as RecoveryPriority;
        const priorityCases = casesByPriorityData[priorityKey];
        const resolvedPriorityCases = priorityCases.filter(c => c.recovery_status === 'resolved');
        successRateByPriority[priorityKey] = priorityCases.length > 0
          ? (resolvedPriorityCases.length / priorityCases.length) * 100
          : 0;
      });

      return {
        totalCases,
        resolvedCases,
        successRate: Math.round(successRate),
        averageSatisfactionImprovement: Math.round(averageImprovement * 100) / 100,
        averageResolutionTime: Math.round(averageResolutionTime * 10) / 10,
        totalCompensationCost: Math.round(totalCompensationCost * 100) / 100,
        casesByPriority,
        successRateByPriority
      };

    } catch (error) {
      console.error('Error getting recovery effectiveness:', error);
      throw new Error('Failed to get recovery effectiveness');
    }
  }

  /**
   * Get VIP client satisfaction metrics
   */
  async getVIPSatisfactionMetrics(): Promise<{
    totalVIPClients: number;
    averageSatisfactionScore: number;
    responseRate: number;
    recoverySuccessRate: number;
    topIssues: Array<{ issue: string; count: number; vipImpact: 'high' | 'medium' | 'low' }>;
    retentionRate: number;
    lifetimeValue: number;
  }> {
    try {
      // Get VIP clients
      const { data: vipClients, error: vipError } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_vip', true);

      if (vipError) throw vipError;

      const totalVIPClients = vipClients?.length || 0;

      // Get VIP satisfaction scores
      const { data: vipMetrics } = await supabase
        .from('satisfaction_metrics')
        .select('score')
        .in('client_id', vipClients?.map(c => c.id) || [])
        .eq('metric_type', 'overall_satisfaction');

      const averageSatisfactionScore = vipMetrics?.length > 0
        ? vipMetrics.reduce((sum, m) => sum + m.score, 0) / vipMetrics.length
        : 0;

      // Mock other metrics for now
      return {
        totalVIPClients,
        averageSatisfactionScore: Math.round(averageSatisfactionScore * 100) / 100,
        responseRate: 78, // Mock data
        recoverySuccessRate: 92, // Mock data
        topIssues: [
          { issue: 'Service timing', count: 3, vipImpact: 'high' },
          { issue: 'Staff communication', count: 2, vipImpact: 'medium' },
          { issue: 'Facility cleanliness', count: 1, vipImpact: 'low' }
        ],
        retentionRate: 94, // Mock data
        lifetimeValue: 15420 // Mock data
      };

    } catch (error) {
      console.error('Error getting VIP satisfaction metrics:', error);
      throw new Error('Failed to get VIP satisfaction metrics');
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private determineRecoveryPriority(
    satisfactionScore?: number,
    feedbackText?: string
  ): RecoveryPriority {
    if (!satisfactionScore && !feedbackText) return 'medium';

    // Critical: Very low satisfaction or strong negative sentiment
    if (satisfactionScore !== undefined && satisfactionScore <= 1.5) return 'critical';
    if (feedbackText && this.containsStrongNegativeLanguage(feedbackText)) return 'critical';

    // High: Low satisfaction or moderate negative sentiment
    if (satisfactionScore !== undefined && satisfactionScore <= 2.5) return 'high';
    if (feedbackText && this.containsNegativeLanguage(feedbackText)) return 'high';

    // Medium: Moderate dissatisfaction
    if (satisfactionScore !== undefined && satisfactionScore <= 3.5) return 'medium';

    return 'low';
  }

  private containsStrongNegativeLanguage(text: string): boolean {
    const strongNegativeWords = [
      'terrible', 'awful', 'horrible', 'disgusting', 'never again',
      'worst experience', 'unacceptable', 'outraged', 'furious',
      'okropny', 'straszny', 'nigdy więcej', 'najgorsze doświadczenie'
    ];

    return strongNegativeWords.some(word =>
      text.toLowerCase().includes(word.toLowerCase())
    );
  }

  private containsNegativeLanguage(text: string): boolean {
    const negativeWords = [
      'bad', 'poor', 'disappointing', 'unhappy', 'unsatisfied',
      'not good', 'below expectations', 'could be better',
      'zły', 'słaby', 'rozczarowujący', 'nieszczęśliwy', 'niezadowolony'
    ];

    return negativeWords.some(word =>
      text.toLowerCase().includes(word.toLowerCase())
    );
  }

  private generateInitialCaseNotes(
    satisfactionScore?: number,
    feedbackText?: string
  ): string {
    let notes = 'Service recovery initiated. ';

    if (satisfactionScore !== undefined) {
      notes += `Initial satisfaction score: ${satisfactionScore}/5. `;
    }

    if (feedbackText) {
      notes += `Client feedback: "${feedbackText.substring(0, 100)}${feedbackText.length > 100 ? '...' : ''}"`;
    }

    return notes;
  }

  private async createRecoveryTasks(
    caseId: string,
    priority: RecoveryPriority,
    context?: any
  ): Promise<void> {
    const tasks = [];

    // Always add client contact task
    tasks.push({
      caseId,
      taskType: 'client_contact' as RecoveryTaskType,
      taskDescription: `Contact client regarding their feedback - Priority: ${priority}`,
      dueDate: priority === 'critical'
        ? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
        : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    });

    // Add follow-up task
    tasks.push({
      caseId,
      taskType: 'follow_up' as RecoveryTaskType,
      taskDescription: 'Follow up with client after initial contact',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days
    });

    // Add staff training if staff involved
    if (context?.staffId) {
      tasks.push({
        caseId,
        taskType: 'staff_training' as RecoveryTaskType,
        taskDescription: 'Review feedback with staff member and provide coaching',
        assignedTo: context.staffId,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week
      });
    }

    // Add compensation task for high-priority cases
    if (priority === 'critical' || priority === 'high') {
      tasks.push({
        caseId,
        taskType: 'compensation' as RecoveryTaskType,
        taskDescription: 'Evaluate and offer appropriate compensation',
        dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours
      });
    }

    // Create all tasks
    for (const task of tasks) {
      await this.addRecoveryTask(
        task.caseId,
        task.taskType,
        task.taskDescription,
        task.assignedTo,
        task.dueDate
      );
    }
  }

  private async checkIfVIPClient(clientId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_vip')
        .eq('id', clientId)
        .single();

      if (error) return false;
      return data?.is_vip || false;

    } catch (error) {
      console.error('Error checking VIP status:', error);
      return false;
    }
  }

  private async triggerRecoveryAlerts(
    caseId: string,
    priority: RecoveryPriority
  ): Promise<void> {
    try {
      const severity = priority === 'critical' ? 'emergency' : 'critical';

      await supabase
        .from('satisfaction_alerts')
        .insert({
          alert_type: 'multiple_complaints',
          severity,
          alert_title: `High Priority Service Recovery Case - ${priority.toUpperCase()}`,
          alert_description: `Service recovery case ${caseId} requires immediate attention due to ${priority} priority client feedback.`,
          trigger_data: { case_id: caseId, priority },
          alert_status: 'active'
        });

    } catch (error) {
      console.error('Error triggering recovery alerts:', error);
    }
  }

  private calculateDueDate(taskType: RecoveryTaskType): string {
    const now = new Date();

    switch (taskType) {
      case 'client_contact':
        return new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(); // 4 hours
      case 'compensation':
        return new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString(); // 8 hours
      case 'follow_up':
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days
      case 'staff_training':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 1 week
      case 'process_improvement':
        return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(); // 2 weeks
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 1 day
    }
  }

  private getTaskPriorityWeight(taskType: RecoveryTaskType): number {
    const weights = {
      client_contact: 10,
      compensation: 9,
      follow_up: 7,
      staff_training: 6,
      escalation: 8,
      process_improvement: 4
    };

    return weights[taskType] || 5;
  }

  private getDefaultCompensationValue(compensationType: CompensationType): number {
    const values = {
      discount: 20, // 20% discount
      free_service: 100, // $100 value
      refund: 50, // $50 refund
      gift: 25, // $25 gift
      upgrade: 30, // $30 upgrade value
      loyalty_points: 500 // 500 points
    };

    return values[compensationType] || 25;
  }

  private async sendCompensationNotification(
    compensationId: string,
    caseId: string
  ): Promise<void> {
    // This would integrate with your notification system
    console.log(`Compensation notification sent for case ${caseId}, compensation ${compensationId}`);
  }

  private getDefaultFeedbackTiming(): FeedbackTimingPreferences {
    return {
      preferred_days: [1, 2, 3, 4, 5], // Monday to Friday
      preferred_times: ['10:00', '14:00', '16:00'],
      timezone: 'Europe/Warsaw',
      avoid_periods: []
    };
  }

  private getDefaultIncentivePreferences(): IncentivePreferences {
    return {
      prefers_offers: true,
      offer_types: ['discount', 'upgrade', 'loyalty_points'],
      minimum_value_threshold: 20,
      prefers_early_access: true,
      prefers_exclusive_events: true
    };
  }

  private async generateClientSpecificQuestions(
    clientId: string,
    context: any
  ): Promise<any[]> {
    // This would analyze client history and generate personalized questions
    return [
      {
        question_text_en: 'How did we meet your expectations for this visit?',
        question_text_pl: 'Jak spełniliśmy Twoje oczekiwania podczas tej wizyty?',
        question_type: 'rating',
        display_order: 2,
        is_required: true,
        config: { scale: { min: 1, max: 5 } },
        conditional_logic: {},
        validation_rules: { required: true }
      }
    ];
  }

  private async sendPersonalizedSurveyInvitation(
    clientId: string,
    surveyId: string,
    preferences: VIPFeedbackPreferences | null
  ): Promise<void> {
    // This would send a personalized survey invitation
    console.log(`Personalized survey invitation sent to client ${clientId} for survey ${surveyId}`);
  }

  private async escalateToExecutive(caseId: string, clientId: string): Promise<void> {
    // Escalate to executive team
    await supabase
      .from('satisfaction_alerts')
      .insert({
        alert_type: 'vip_complaint',
        severity: 'emergency',
        alert_title: 'VIP Client Recovery - Executive Review Required',
        alert_description: `VIP client recovery case ${caseId} requires executive review and immediate attention.`,
        trigger_data: { case_id: caseId, client_id: clientId },
        alert_status: 'active'
      });
  }

  private async initiateWhiteGloveRecovery(
    caseId: string,
    clientId: string,
    priority: RecoveryPriority
  ): Promise<void> {
    // Initiate white-glove service recovery protocol
    await this.updateRecoveryCase(caseId, {
      recovery_status: 'in_progress',
      case_notes: 'White-glove recovery protocol initiated. Priority client handling with enhanced service recovery.'
    });
  }

  private async notifyViaPreferredMethods(
    clientId: string,
    caseId: string,
    preferredMethods: SubmissionSource[]
  ): Promise<void> {
    // Send notifications via client's preferred methods
    preferredMethods.forEach(method => {
      console.log(`VIP recovery notification sent via ${method} for case ${caseId}`);
    });
  }

  private async calculateRecoveryEffectiveness(caseId: string): Promise<void> {
    // This would calculate and store recovery effectiveness metrics
    console.log(`Recovery effectiveness calculated for case ${caseId}`);
  }

  private async checkRecoveryCaseCompletion(caseId: string): Promise<void> {
    try {
      const { data: tasks } = await supabase
        .from('recovery_tasks')
        .select('task_status')
        .eq('recovery_case_id', caseId);

      if (tasks?.every(task => task.task_status === 'completed')) {
        await this.updateRecoveryCase(caseId, {
          recovery_status: 'client_contacted'
        });
      }

    } catch (error) {
      console.error('Error checking recovery case completion:', error);
    }
  }
}

// Export singleton instance
export const clientRecoveryService = ClientRecoveryService.getInstance();