// Service Recovery System with Automated Workflows
// For luxury beauty/fitness platform client retention and satisfaction improvement

import { supabase } from '@/integrations/supabase/client';
import type {
  ServiceRecoveryCase,
  RecoveryTask,
  RecoveryCompensation,
  SatisfactionAlert,
  RecoveryPriority,
  RecoveryStatus,
  RecoveryTaskType,
  TaskStatus,
  CompensationType,
  CompensationStatus
} from '@/types/feedback';

export interface RecoveryWorkflow {
  id: string;
  name: string;
  description: string;
  triggerConditions: RecoveryTriggerCondition[];
  steps: RecoveryWorkflowStep[];
  escalationRules: EscalationRule[];
  isActive: boolean;
  successCriteria: RecoverySuccessCriteria;
}

export interface RecoveryTriggerCondition {
  alertType?: string;
  severity?: string;
  satisfactionScore?: number;
  sentimentScore?: number;
  clientType?: 'vip' | 'regular' | 'new';
  serviceType?: string;
  timeSinceIncident?: number; // hours
  multipleIncidents?: boolean;
}

export interface RecoveryWorkflowStep {
  id: string;
  name: string;
  description: string;
  type: RecoveryTaskType;
  assignedRole?: string;
  assignedUser?: string;
  deadlineOffset: number; // hours from trigger
  dependencies?: string[]; // other step IDs
  autoExecute?: boolean;
  templates: {
    email?: string;
    sms?: string;
    task?: string;
  };
  successConditions: string[];
}

export interface EscalationRule {
  condition: 'deadline_missed' | 'task_failed' | 'client_unsatisfied' | 'high_value_client';
  timeframe?: number; // hours
  action: 'notify_manager' | 'escalate_to_executive' | 'increase_compensation' | 'urgent_review';
  targetRole?: string;
  targetUser?: string;
}

export interface RecoverySuccessCriteria {
  clientSatisfactionImprovement: number; // minimum points improvement
  responseTime: number; // maximum hours
  resolutionRate: number; // minimum percentage (0-100)
  clientRetention: boolean; // must retain client
  followUpCompletion: boolean; // must complete follow-up
}

export interface RecoveryMetrics {
  totalCases: number;
  resolvedCases: number;
  inProgressCases: number;
  averageResolutionTime: number; // hours
  successRate: number; // percentage
  averageSatisfactionImprovement: number;
  totalCompensationCost: number;
  averageCompensationCost: number;
  casesByPriority: Record<RecoveryPriority, number>;
  casesByType: Record<RecoveryTaskType, number>;
  staffPerformance: Array<{
    staffId: string;
    name: string;
    casesHandled: number;
    averageResolutionTime: number;
    successRate: number;
    clientSatisfactionAfter: number;
  }>;
}

export interface RecoveryAction {
  type: 'contact_client' | 'assign_staff' | 'offer_compensation' | 'schedule_follow_up' | 'escalate' | 'close_case';
  config: Record<string, any>;
  deadline?: Date;
  assignedTo?: string;
  priority: RecoveryPriority;
}

export interface ClientRecoveryProfile {
  clientId: string;
  totalCases: number;
  successfulRecoveries: number;
  averageSatisfactionBefore: number;
  averageSatisfactionAfter: number;
  preferredContactMethod: string;
  effectiveInterventions: string[];
  riskFactors: string[];
  lastRecoveryDate?: string;
  recoveryCostTotal: number;
  lifetimeValue: number;
}

export class ServiceRecoveryService {
  private workflows: Map<string, RecoveryWorkflow> = new Map();
  private isProcessing: boolean = false;
  private processingInterval?: NodeJS.Timeout;

  constructor() {
    this.initializeDefaultWorkflows();
  }

  // ========================================
  // WORKFLOW MANAGEMENT
  // ========================================

  /**
   * Initialize default recovery workflows
   */
  private initializeDefaultWorkflows(): void {
    const workflows: RecoveryWorkflow[] = [
      {
        id: 'low_score_immediate',
        name: 'Immediate Low Score Recovery',
        description: 'Rapid response for critically low satisfaction scores',
        triggerConditions: [
          { satisfactionScore: 2.0, severity: 'critical' },
          { satisfactionScore: 1.5, severity: 'emergency' }
        ],
        steps: [
          {
            id: 'immediate_contact',
            name: 'Immediate Client Contact',
            description: 'Contact client within 1 hour to understand issues',
            type: 'client_contact',
            deadlineOffset: 1,
            autoExecute: true,
            templates: {
              email: 'immediate_low_score_email',
              task: 'contact_client_about_low_score'
            },
            successConditions: ['client_contacted', 'issues_identified']
          },
          {
            id: 'service_assessment',
            name: 'Service Assessment',
            description: 'Review service delivery and identify issues',
            type: 'process_improvement',
            deadlineOffset: 2,
            dependencies: ['immediate_contact'],
            templates: {
              task: 'assess_service_delivery_issues'
            },
            successConditions: ['root_cause_identified', 'improvement_plan_created']
          },
          {
            id: 'resolution_offer',
            name: 'Resolution Offer',
            description: 'Offer appropriate compensation or resolution',
            type: 'compensation',
            deadlineOffset: 4,
            dependencies: ['service_assessment'],
            assignedRole: 'manager',
            templates: {
              email: 'resolution_offer_email'
            },
            successConditions: ['offer_accepted', 'client_satisfied']
          },
          {
            id: 'follow_up',
            name: 'Follow Up',
            description: 'Follow up to ensure satisfaction',
            type: 'follow_up',
            deadlineOffset: 24,
            dependencies: ['resolution_offer'],
            autoExecute: true,
            templates: {
              email: 'follow_up_satisfaction_email'
            },
            successConditions: ['follow_up_completed', 'satisfaction_confirmed']
          }
        ],
        escalationRules: [
          {
            condition: 'deadline_missed',
            timeframe: 2,
            action: 'notify_manager',
            targetRole: 'manager'
          },
          {
            condition: 'client_unsatisfied',
            timeframe: 6,
            action: 'escalate_to_executive',
            targetRole: 'executive'
          }
        ],
        isActive: true,
        successCriteria: {
          clientSatisfactionImprovement: 1.5,
          responseTime: 2,
          resolutionRate: 85,
          clientRetention: true,
          followUpCompletion: true
        }
      },
      {
        id: 'negative_sentiment_recovery',
        name: 'Negative Sentiment Recovery',
        description: 'Recovery for negative sentiment in feedback',
        triggerConditions: [
          { sentimentScore: -0.5, alertType: 'negative_sentiment' },
          { sentimentScore: -0.8, severity: 'critical' }
        ],
        steps: [
          {
            id: 'sentiment_analysis',
            name: 'Detailed Sentiment Analysis',
            description: 'Analyze negative feedback themes',
            type: 'process_improvement',
            deadlineOffset: 2,
            templates: {
              task: 'analyze_negative_sentiment_themes'
            },
            successConditions: ['themes_identified', 'impact_assessed']
          },
          {
            id: 'personalized_outreach',
            name: 'Personalized Outreach',
            description: 'Personal contact based on specific issues',
            type: 'client_contact',
            deadlineOffset: 4,
            dependencies: ['sentiment_analysis'],
            templates: {
              email: 'personalized_sentiment_recovery'
            },
            successConditions: ['client_responded', 'concerns_addressed']
          },
          {
            id: 'service_improvement',
            name: 'Service Improvement',
            description: 'Implement improvements based on feedback',
            type: 'process_improvement',
            deadlineOffset: 48,
            dependencies: ['personalized_outreach'],
            assignedRole: 'quality_manager',
            successConditions: ['improvements_implemented', 'staff_trained']
          }
        ],
        escalationRules: [
          {
            condition: 'multiple_incidents',
            action: 'notify_manager',
            targetRole: 'manager'
          }
        ],
        isActive: true,
        successCriteria: {
          clientSatisfactionImprovement: 1.0,
          responseTime: 6,
          resolutionRate: 80,
          clientRetention: true,
          followUpCompletion: false
        }
      },
      {
        id: 'vip_client_recovery',
        name: 'VIP Client White Glove Recovery',
        description: 'Premium recovery for VIP clients',
        triggerConditions: [
          { clientType: 'vip', satisfactionScore: 3.5 },
          { clientType: 'vip', severity: 'warning' }
        ],
        steps: [
          {
            id: 'executive_notification',
            name: 'Executive Notification',
            description: 'Immediately notify executive team',
            type: 'escalate',
            deadlineOffset: 0.5,
            autoExecute: true,
            assignedRole: 'executive',
            templates: {
              email: 'vip_client_issue_notification'
            },
            successConditions: ['executive_notified', 'priority_assigned']
          },
          {
            id: 'personal_executive_contact',
            name: 'Executive Contact',
            description: 'Personal contact from senior staff',
            type: 'client_contact',
            deadlineOffset: 2,
            dependencies: ['executive_notification'],
            assignedRole: 'executive',
            templates: {
              task: 'executive_personal_contact'
            },
            successConditions: ['executive_contact_made', 'client_appreciated']
          },
          {
            id: 'premium_resolution',
            name: 'Premium Resolution',
            description: 'Offer premium compensation and service',
            type: 'compensation',
            deadlineOffset: 4,
            dependencies: ['personal_executive_contact'],
            templates: {
              email: 'vip_premium_resolution'
            },
            successConditions: ['premium_offers_accepted', 'client_delighted']
          },
          {
            id: 'exclusive_follow_up',
            name: 'Exclusive Follow Up',
            description: 'Personal follow up with exclusive offers',
            type: 'follow_up',
            deadlineOffset: 72,
            dependencies: ['premium_resolution'],
            templates: {
              email: 'vip_exclusive_follow_up'
            },
            successConditions: ['relationship_strengthened', 'loyalty_confirmed']
          }
        ],
        escalationRules: [
          {
            condition: 'high_value_client',
            action: 'increase_compensation',
            targetRole: 'executive'
          }
        ],
        isActive: true,
        successCriteria: {
          clientSatisfactionImprovement: 2.0,
          responseTime: 1,
          resolutionRate: 95,
          clientRetention: true,
          followUpCompletion: true
        }
      }
    ];

    workflows.forEach(workflow => {
      this.workflows.set(workflow.id, workflow);
    });
  }

  /**
   * Start automated recovery processing
   */
  startAutomatedProcessing(): void {
    if (this.isProcessing) {
      console.log('Automated recovery processing is already running');
      return;
    }

    console.log('Starting automated recovery processing...');
    this.isProcessing = true;

    // Process every 5 minutes
    this.processingInterval = setInterval(() => {
      this.processPendingRecoveries();
    }, 5 * 60 * 1000);

    // Initial processing
    this.processPendingRecoveries();
  }

  /**
   * Stop automated processing
   */
  stopAutomatedProcessing(): void {
    if (!this.isProcessing) {
      console.log('Automated recovery processing is not running');
      return;
    }

    console.log('Stopping automated recovery processing...');
    this.isProcessing = false;

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
  }

  // ========================================
  // RECOVERY CASE MANAGEMENT
  // ========================================

  /**
   * Create recovery case from alert
   */
  async createRecoveryCase(alert: SatisfactionAlert): Promise<ServiceRecoveryCase> {
    try {
      // Determine appropriate workflow
      const workflow = this.selectWorkflow(alert);

      // Determine priority
      const priority = this.determinePriority(alert);

      // Create recovery case
      const { data, error } = await supabase
        .from('service_recovery_cases')
        .insert({
          client_id: alert.client_id,
          trigger_feedback_id: alert.source_feedback_id,
          booking_id: this.extractBookingIdFromAlert(alert),
          service_id: alert.service_id,
          staff_id: alert.staff_id,
          recovery_priority: priority,
          recovery_status: 'new',
          satisfaction_before: this.extractSatisfactionScore(alert),
          recovery_actions: {
            alert_id: alert.id,
            workflow_id: workflow?.id,
            trigger_data: alert.trigger_data
          },
          follow_up_required: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Initialize workflow tasks
      if (workflow) {
        await this.initializeWorkflowTasks(data.id, workflow, alert);
      }

      // Update alert status
      await supabase
        .from('satisfaction_alerts')
        .update({
          alert_status: 'acknowledged',
          updated_at: new Date().toISOString()
        })
        .eq('id', alert.id);

      console.log(`Recovery case created: ${data.id} for alert ${alert.id}`);
      return data;
    } catch (error) {
      console.error('Error creating recovery case:', error);
      throw error;
    }
  }

  /**
   * Select appropriate workflow for alert
   */
  private selectWorkflow(alert: SatisfactionAlert): RecoveryWorkflow | null {
    for (const workflow of this.workflows.values()) {
      if (!workflow.isActive) continue;

      for (const condition of workflow.triggerConditions) {
        if (this.matchesTriggerCondition(condition, alert)) {
          return workflow;
        }
      }
    }

    // Default workflow
    return this.workflows.get('low_score_immediate') || null;
  }

  /**
   * Check if alert matches trigger condition
   */
  private matchesTriggerCondition(condition: RecoveryTriggerCondition, alert: SatisfactionAlert): boolean {
    if (condition.satisfactionScore) {
      const score = this.extractSatisfactionScore(alert);
      if (score > condition.satisfactionScore) return false;
    }

    if (condition.severity && alert.severity !== condition.severity) return false;
    if (condition.alertType && alert.alert_type !== condition.alertType) return false;
    if (condition.sentimentScore) {
      const sentimentScore = this.extractSentimentScore(alert);
      if (sentimentScore > condition.sentimentScore) return false;
    }

    return true;
  }

  /**
   * Determine recovery priority
   */
  private determinePriority(alert: SatisfactionAlert): RecoveryPriority {
    if (alert.severity === 'emergency') return 'critical';
    if (alert.severity === 'critical') return 'high';
    if (alert.severity === 'warning') return 'medium';
    return 'low';
  }

  /**
   * Initialize workflow tasks
   */
  private async initializeWorkflowTasks(
    caseId: string,
    workflow: RecoveryWorkflow,
    alert: SatisfactionAlert
  ): Promise<void> {
    try {
      const tasks = workflow.steps.map(step => ({
        recovery_case_id: caseId,
        task_type: step.type,
        task_description: step.description,
        task_status: 'pending',
        assigned_to: step.assignedUser || this.resolveAssignee(step.assignedRole, alert),
        due_date: new Date(Date.now() + step.deadlineOffset * 60 * 60 * 1000).toISOString(),
        task_metadata: {
          workflow_id: workflow.id,
          step_id: step.id,
          dependencies: step.dependencies,
          templates: step.templates,
          auto_execute: step.autoExecute
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('recovery_tasks')
        .insert(tasks);

      if (error) throw error;

      // Execute auto-executable tasks
      for (const step of workflow.steps) {
        if (step.autoExecute && !step.dependencies?.length) {
          await this.executeTask(caseId, step.id);
        }
      }
    } catch (error) {
      console.error('Error initializing workflow tasks:', error);
    }
  }

  /**
   * Resolve assignee for task
   */
  private resolveAssignee(role: string | undefined, alert: SatisfactionAlert): string | null {
    // In a real implementation, this would resolve role to actual user ID
    // For now, return null (unassigned)
    return null;
  }

  /**
   * Execute task
   */
  private async executeTask(caseId: string, stepId: string): Promise<void> {
    try {
      const { data: task, error } = await supabase
        .from('recovery_tasks')
        .select('*')
        .eq('recovery_case_id', caseId)
        .contains('task_metadata', { step_id: stepId })
        .single();

      if (error || !task) return;

      // Update task status
      await supabase
        .from('recovery_tasks')
        .update({
          task_status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      // Execute task based on type
      switch (task.task_type) {
        case 'client_contact':
          await this.executeClientContactTask(task);
          break;
        case 'compensation':
          await this.executeCompensationTask(task);
          break;
        case 'follow_up':
          await this.executeFollowUpTask(task);
          break;
        case 'process_improvement':
          await this.executeProcessImprovementTask(task);
          break;
        case 'escalate':
          await this.executeEscalationTask(task);
          break;
      }

      // Check for dependent tasks
      await this.checkDependentTasks(caseId, stepId);
    } catch (error) {
      console.error('Error executing task:', error);
    }
  }

  /**
   * Execute client contact task
   */
  private async executeClientContactTask(task: RecoveryTask): Promise<void> {
    try {
      const templates = task.task_metadata?.templates;

      if (templates?.email) {
        await this.sendEmailTemplate(templates.email, task);
      }

      if (templates?.sms) {
        await this.sendSMSTemplate(templates.sms, task);
      }

      // Mark task as completed
      await supabase
        .from('recovery_tasks')
        .update({
          task_status: 'completed',
          completed_at: new Date().toISOString(),
          completion_notes: 'Client contact initiated automatically'
        })
        .eq('id', task.id);
    } catch (error) {
      console.error('Error executing client contact task:', error);
    }
  }

  /**
   * Execute compensation task
   */
  private async executeCompensationTask(task: RecoveryTask): Promise<void> {
    try {
      // This would handle compensation offers
      // For now, just mark as completed
      await supabase
        .from('recovery_tasks')
        .update({
          task_status: 'completed',
          completed_at: new Date().toISOString(),
          completion_notes: 'Compensation offer prepared'
        })
        .eq('id', task.id);
    } catch (error) {
      console.error('Error executing compensation task:', error);
    }
  }

  /**
   * Execute follow-up task
   */
  private async executeFollowUpTask(task: RecoveryTask): Promise<void> {
    try {
      const templates = task.task_metadata?.templates;

      if (templates?.email) {
        await this.sendEmailTemplate(templates.email, task);
      }

      await supabase
        .from('recovery_tasks')
        .update({
          task_status: 'completed',
          completed_at: new Date().toISOString(),
          completion_notes: 'Follow-up initiated'
        })
        .eq('id', task.id);
    } catch (error) {
      console.error('Error executing follow-up task:', error);
    }
  }

  /**
   * Execute process improvement task
   */
  private async executeProcessImprovementTask(task: RecoveryTask): Promise<void> {
    try {
      // This would handle process improvements
      await supabase
        .from('recovery_tasks')
        .update({
          task_status: 'completed',
          completed_at: new Date().toISOString(),
          completion_notes: 'Process improvement review completed'
        })
        .eq('id', task.id);
    } catch (error) {
      console.error('Error executing process improvement task:', error);
    }
  }

  /**
   * Execute escalation task
   */
  private async executeEscalationTask(task: RecoveryTask): Promise<void> {
    try {
      // This would handle escalation procedures
      await supabase
        .from('recovery_tasks')
        .update({
          task_status: 'completed',
          completed_at: new Date().toISOString(),
          completion_notes: 'Escalation completed'
        })
        .eq('id', task.id);
    } catch (error) {
      console.error('Error executing escalation task:', error);
    }
  }

  /**
   * Check for dependent tasks
   */
  private async checkDependentTasks(caseId: string, completedStepId: string): Promise<void> {
    try {
      const { data: dependentTasks, error } = await supabase
        .from('recovery_tasks')
        .select('*')
        .eq('recovery_case_id', caseId)
        .contains('task_metadata', { dependencies: [completedStepId] })
        .eq('task_status', 'pending');

      if (error || !dependentTasks) return;

      for (const task of dependentTasks) {
        // Check if all dependencies are completed
        const dependencies = task.task_metadata?.dependencies || [];
        const { data: completedDeps } = await supabase
          .from('recovery_tasks')
          .select('id')
          .eq('recovery_case_id', caseId)
          .contains('task_metadata', { step_id: dependencies[0] }) // Simplified check
          .eq('task_status', 'completed');

        if (completedDeps && completedDeps.length === dependencies.length) {
          // Execute auto-executable dependent tasks
          if (task.task_metadata?.auto_execute) {
            const stepId = task.task_metadata.step_id;
            await this.executeTask(caseId, stepId);
          }
        }
      }
    } catch (error) {
      console.error('Error checking dependent tasks:', error);
    }
  }

  // ========================================
  // AUTOMATED PROCESSING
  // ========================================

  /**
   * Process pending recoveries
   */
  private async processPendingRecoveries(): Promise<void> {
    try {
      // Check for overdue tasks
      await this.checkOverdueTasks();

      // Check for escalation triggers
      await this.checkEscalationTriggers();

      // Check for case completion
      await this.checkCaseCompletion();

      // Process workflow logic
      await this.processWorkflowLogic();
    } catch (error) {
      console.error('Error in automated recovery processing:', error);
    }
  }

  /**
   * Check for overdue tasks
   */
  private async checkOverdueTasks(): Promise<void> {
    try {
      const { data: overdueTasks, error } = await supabase
        .from('recovery_tasks')
        .select('*')
        .eq('task_status', 'pending')
        .lt('due_date', new Date().toISOString());

      if (error || !overdueTasks) return;

      for (const task of overdueTasks) {
        await this.handleOverdueTask(task);
      }
    } catch (error) {
      console.error('Error checking overdue tasks:', error);
    }
  }

  /**
   * Handle overdue task
   */
  private async handleOverdueTask(task: RecoveryTask): Promise<void> {
    try {
      // Get case details for escalation
      const { data: recoveryCase } = await supabase
        .from('service_recovery_cases')
        .select('*')
        .eq('id', task.recovery_case_id)
        .single();

      if (!recoveryCase) return;

      // Update task status
      await supabase
        .from('recovery_tasks')
        .update({
          task_status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      // Apply escalation rules
      await this.applyEscalationRules(recoveryCase, 'deadline_missed', task);
    } catch (error) {
      console.error('Error handling overdue task:', error);
    }
  }

  /**
   * Check escalation triggers
   */
  private async checkEscalationTriggers(): Promise<void> {
    try {
      const { data: activeCases, error } = await supabase
        .from('service_recovery_cases')
        .select('*')
        .in('recovery_status', ['new', 'assigned', 'in_progress']);

      if (error || !activeCases) return;

      for (const case_ of activeCases) {
        await this.checkCaseEscalation(case_);
      }
    } catch (error) {
      console.error('Error checking escalation triggers:', error);
    }
  }

  /**
   * Check if case needs escalation
   */
  private async checkCaseEscalation(case_: ServiceRecoveryCase): Promise<void> {
    try {
      const now = new Date();
      const caseAge = (now.getTime() - new Date(case_.created_at).getTime()) / (1000 * 60 * 60); // hours

      // Check for high-value client
      const { data: clientProfile } = await supabase
        .from('profiles')
        .select('vip_status, lifetime_value')
        .eq('id', case_.client_id)
        .single();

      if (clientProfile?.vip_status) {
        await this.applyEscalationRules(case_, 'high_value_client');
        return;
      }

      // Check for case age
      if (caseAge > 24 && case_.recovery_status === 'new') {
        await this.applyEscalationRules(case_, 'deadline_missed');
      }
    } catch (error) {
      console.error('Error checking case escalation:', error);
    }
  }

  /**
   * Apply escalation rules
   */
  private async applyEscalationRules(
    case_: ServiceRecoveryCase,
    condition: string,
    task?: RecoveryTask
  ): Promise<void> {
    try {
      const workflowId = case_.recovery_actions?.workflow_id;
      if (!workflowId) return;

      const workflow = this.workflows.get(workflowId);
      if (!workflow) return;

      const applicableRules = workflow.escalationRules.filter(rule => rule.condition === condition);

      for (const rule of applicableRules) {
        await this.executeEscalationRule(rule, case_, task);
      }
    } catch (error) {
      console.error('Error applying escalation rules:', error);
    }
  }

  /**
   * Execute escalation rule
   */
  private async executeEscalationRule(
    rule: EscalationRule,
    case_: ServiceRecoveryCase,
    task?: RecoveryTask
  ): Promise<void> {
    try {
      switch (rule.action) {
        case 'notify_manager':
          await this.notifyManager(rule.targetRole, case_, task);
          break;
        case 'escalate_to_executive':
          await this.escalateToExecutive(rule.targetRole, case_, task);
          break;
        case 'increase_compensation':
          await this.increaseCompensation(case_);
          break;
        case 'urgent_review':
          await this.urgentReview(case_);
          break;
      }
    } catch (error) {
      console.error('Error executing escalation rule:', error);
    }
  }

  /**
   * Notify manager
   */
  private async notifyManager(role: string | undefined, case_: ServiceRecoveryCase, task?: RecoveryTask): Promise<void> {
    try {
      console.log(`Notifying manager about case ${case_.id}`);
      // Implementation would send actual notification
    } catch (error) {
      console.error('Error notifying manager:', error);
    }
  }

  /**
   * Escalate to executive
   */
  private async escalateToExecutive(role: string | undefined, case_: ServiceRecoveryCase, task?: RecoveryTask): Promise<void> {
    try {
      console.log(`Escalating case ${case_.id} to executive`);
      // Implementation would send actual escalation
    } catch (error) {
      console.error('Error escalating to executive:', error);
    }
  }

  /**
   * Increase compensation
   */
  private async increaseCompensation(case_: ServiceRecoveryCase): Promise<void> {
    try {
      console.log(`Increasing compensation for case ${case_.id}`);
      // Implementation would adjust compensation
    } catch (error) {
      console.error('Error increasing compensation:', error);
    }
  }

  /**
   * Urgent review
   */
  private async urgentReview(case_: ServiceRecoveryCase): Promise<void> {
    try {
      console.log(`Initiating urgent review for case ${case_.id}`);
      // Implementation would initiate review process
    } catch (error) {
      console.error('Error initiating urgent review:', error);
    }
  }

  /**
   * Check case completion
   */
  private async checkCaseCompletion(): Promise<void> {
    try {
      const { data: activeCases, error } = await supabase
        .from('service_recovery_cases')
        .select('id, recovery_status')
        .in('recovery_status', ['assigned', 'in_progress', 'client_contacted']);

      if (error || !activeCases) return;

      for (const case_ of activeCases) {
        await this.checkIfCaseCompletable(case_.id);
      }
    } catch (error) {
      console.error('Error checking case completion:', error);
    }
  }

  /**
   * Check if case can be completed
   */
  private async checkIfCaseCompletable(caseId: string): Promise<void> {
    try {
      const { data: tasks, error } = await supabase
        .from('recovery_tasks')
        .select('task_status')
        .eq('recovery_case_id', caseId);

      if (error || !tasks) return;

      const allTasksCompleted = tasks.every(task => task.task_status === 'completed');

      if (allTasksCompleted) {
        await this.completeRecoveryCase(caseId);
      }
    } catch (error) {
      console.error('Error checking if case is completable:', error);
    }
  }

  /**
   * Complete recovery case
   */
  private async completeRecoveryCase(caseId: string): Promise<void> {
    try {
      // Calculate final satisfaction score
      const satisfactionAfter = await this.calculatePostRecoverySatisfaction(caseId);

      await supabase
        .from('service_recovery_cases')
        .update({
          recovery_status: 'resolved',
          satisfaction_after: satisfactionAfter,
          updated_at: new Date().toISOString()
        })
        .eq('id', caseId);

      console.log(`Recovery case ${caseId} completed successfully`);
    } catch (error) {
      console.error('Error completing recovery case:', error);
    }
  }

  /**
   * Process workflow logic
   */
  private async processWorkflowLogic(): Promise<void> {
    try {
      // This would contain advanced workflow processing logic
      // For now, just log that processing occurred
      console.log('Workflow logic processing completed');
    } catch (error) {
      console.error('Error processing workflow logic:', error);
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Send email template
   */
  private async sendEmailTemplate(template: string, task: RecoveryTask): Promise<void> {
    try {
      console.log(`Sending email template ${template} for task ${task.id}`);
      // Implementation would send actual email
    } catch (error) {
      console.error('Error sending email template:', error);
    }
  }

  /**
   * Send SMS template
   */
  private async sendSMSTemplate(template: string, task: RecoveryTask): Promise<void> {
    try {
      console.log(`Sending SMS template ${template} for task ${task.id}`);
      // Implementation would send actual SMS
    } catch (error) {
      console.error('Error sending SMS template:', error);
    }
  }

  /**
   * Extract booking ID from alert
   */
  private extractBookingIdFromAlert(alert: SatisfactionAlert): string | null {
    return alert.trigger_data?.bookingId || null;
  }

  /**
   * Extract satisfaction score from alert
   */
  private extractSatisfactionScore(alert: SatisfactionAlert): number {
    return alert.trigger_data?.score || alert.trigger_data?.satisfactionBefore || 0;
  }

  /**
   * Extract sentiment score from alert
   */
  private extractSentimentScore(alert: SatisfactionAlert): number {
    return alert.trigger_data?.sentimentScore || 0;
  }

  /**
   * Calculate post-recovery satisfaction
   */
  private async calculatePostRecoverySatisfaction(caseId: string): Promise<number | null> {
    try {
      // Get recent satisfaction metrics for the client
      const { data: case_, error: caseError } = await supabase
        .from('service_recovery_cases')
        .select('client_id')
        .eq('id', caseId)
        .single();

      if (caseError || !case_) return null;

      const { data: metrics, error: metricsError } = await supabase
        .from('satisfaction_metrics')
        .select('score')
        .eq('client_id', case_.client_id)
        .gte('measurement_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('measurement_date', { ascending: false })
        .limit(3);

      if (metricsError || !metrics || metrics.length === 0) return null;

      return metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length;
    } catch (error) {
      console.error('Error calculating post-recovery satisfaction:', error);
      return null;
    }
  }

  // ========================================
  // PUBLIC API METHODS
  // ========================================

  /**
   * Get recovery metrics
   */
  async getRecoveryMetrics(dateRange?: { start: string; end: string }): Promise<RecoveryMetrics> {
    try {
      const baseQuery = supabase.from('service_recovery_cases').select('*');

      if (dateRange) {
        baseQuery
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);
      }

      const { data: cases, error } = await baseQuery;

      if (error || !cases) {
        return this.getEmptyMetrics();
      }

      const resolvedCases = cases.filter(c => c.recovery_status === 'resolved');
      const inProgressCases = cases.filter(c => ['new', 'assigned', 'in_progress', 'client_contacted'].includes(c.recovery_status));

      // Calculate average resolution time
      const resolvedCasesWithTime = resolvedCases.filter(c => c.created_at && c.updated_at);
      const averageResolutionTime = resolvedCasesWithTime.length > 0
        ? resolvedCasesWithTime.reduce((sum, c) => {
            const hours = (new Date(c.updated_at).getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60);
            return sum + hours;
          }, 0) / resolvedCasesWithTime.length
        : 0;

      // Calculate success rate
      const successRate = cases.length > 0 ? (resolvedCases.length / cases.length) * 100 : 0;

      // Calculate average satisfaction improvement
      const casesWithImprovement = resolvedCases.filter(c => c.satisfaction_before && c.satisfaction_after);
      const averageSatisfactionImprovement = casesWithImprovement.length > 0
        ? casesWithImprovement.reduce((sum, c) => sum + (c.satisfaction_after! - c.satisfaction_before!), 0) / casesWithImprovement.length
        : 0;

      // Get compensation data
      const { data: compensations } = await supabase
        .from('recovery_compensation')
        .select('compensation_value')
        .in('recovery_case_id', cases.map(c => c.id));

      const totalCompensationCost = compensations?.reduce((sum, c) => sum + (c.compensation_value || 0), 0) || 0;
      const averageCompensationCost = compensations?.length > 0 ? totalCompensationCost / compensations.length : 0;

      // Cases by priority
      const casesByPriority = {
        critical: cases.filter(c => c.recovery_priority === 'critical').length,
        high: cases.filter(c => c.recovery_priority === 'high').length,
        medium: cases.filter(c => c.recovery_priority === 'medium').length,
        low: cases.filter(c => c.recovery_priority === 'low').length
      };

      // Get staff performance
      const staffPerformance = await this.getStaffPerformanceMetrics();

      return {
        totalCases: cases.length,
        resolvedCases: resolvedCases.length,
        inProgressCases: inProgressCases.length,
        averageResolutionTime: Math.round(averageResolutionTime * 100) / 100,
        successRate: Math.round(successRate * 100) / 100,
        averageSatisfactionImprovement: Math.round(averageSatisfactionImprovement * 100) / 100,
        totalCompensationCost,
        averageCompensationCost: Math.round(averageCompensationCost * 100) / 100,
        casesByPriority,
        casesByType: {}, // Would calculate from task data
        staffPerformance
      };
    } catch (error) {
      console.error('Error getting recovery metrics:', error);
      return this.getEmptyMetrics();
    }
  }

  /**
   * Get empty metrics
   */
  private getEmptyMetrics(): RecoveryMetrics {
    return {
      totalCases: 0,
      resolvedCases: 0,
      inProgressCases: 0,
      averageResolutionTime: 0,
      successRate: 0,
      averageSatisfactionImprovement: 0,
      totalCompensationCost: 0,
      averageCompensationCost: 0,
      casesByPriority: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      casesByType: {},
      staffPerformance: []
    };
  }

  /**
   * Get staff performance metrics
   */
  private async getStaffPerformanceMetrics(): Promise<Array<{
    staffId: string;
    name: string;
    casesHandled: number;
    averageResolutionTime: number;
    successRate: number;
    clientSatisfactionAfter: number;
  }>> {
    try {
      const { data: tasks, error } = await supabase
        .from('recovery_tasks')
        .select('assigned_to, recovery_case_id, task_status, completed_at, created_at')
        .not('assigned_to', 'is', null);

      if (error || !tasks) return [];

      const staffMetrics: Record<string, any> = {};

      // Group tasks by staff
      tasks.forEach(task => {
        const staffId = task.assigned_to!;
        if (!staffMetrics[staffId]) {
          staffMetrics[staffId] = {
            staffId,
            casesHandled: new Set(),
            totalResolutionTime: 0,
            completedCases: 0,
            satisfactionScores: []
          };
        }

        if (task.task_status === 'completed') {
          staffMetrics[staffId].casesHandled.add(task.recovery_case_id);
          staffMetrics[staffId].completedCases++;

          if (task.created_at && task.completed_at) {
            const hours = (new Date(task.completed_at).getTime() - new Date(task.created_at).getTime()) / (1000 * 60 * 60);
            staffMetrics[staffId].totalResolutionTime += hours;
          }
        }
      });

      // Convert to array and get staff names
      const staffIds = Object.keys(staffMetrics);
      const { data: staffProfiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', staffIds);

      return Object.values(staffMetrics).map((metric: any) => {
        const profile = staffProfiles?.find(p => p.id === metric.staffId);
        const averageResolutionTime = metric.completedCases > 0 ? metric.totalResolutionTime / metric.completedCases : 0;
        const successRate = metric.casesHandled.size > 0 ? (metric.completedCases / metric.casesHandled.size) * 100 : 0;

        return {
          staffId: metric.staffId,
          name: profile?.display_name || 'Unknown',
          casesHandled: metric.casesHandled.size,
          averageResolutionTime: Math.round(averageResolutionTime * 100) / 100,
          successRate: Math.round(successRate * 100) / 100,
          clientSatisfactionAfter: 0 // Would calculate from actual data
        };
      });
    } catch (error) {
      console.error('Error getting staff performance metrics:', error);
      return [];
    }
  }

  /**
   * Get active recovery cases
   */
  async getActiveRecoveryCases(): Promise<ServiceRecoveryCase[]> {
    try {
      const { data, error } = await supabase
        .from('service_recovery_cases')
        .select('*')
        .in('recovery_status', ['new', 'assigned', 'in_progress', 'client_contacted'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting active recovery cases:', error);
      return [];
    }
  }

  /**
   * Get recovery case with tasks
   */
  async getRecoveryCaseWithTasks(caseId: string): Promise<{
    case: ServiceRecoveryCase;
    tasks: RecoveryTask[];
    compensations: RecoveryCompensation[];
  } | null> {
    try {
      const [caseResult, tasksResult, compensationsResult] = await Promise.all([
        supabase.from('service_recovery_cases').select('*').eq('id', caseId).single(),
        supabase.from('recovery_tasks').select('*').eq('recovery_case_id', caseId).order('created_at', { ascending: true }),
        supabase.from('recovery_compensation').select('*').eq('recovery_case_id', caseId).order('created_at', { ascending: true })
      ]);

      if (caseResult.error || tasksResult.error || compensationsResult.error) {
        throw new Error('Error fetching recovery case data');
      }

      return {
        case: caseResult.data,
        tasks: tasksResult.data || [],
        compensations: compensationsResult.data || []
      };
    } catch (error) {
      console.error('Error getting recovery case with tasks:', error);
      return null;
    }
  }

  /**
   * Update recovery task
   */
  async updateRecoveryTask(
    taskId: string,
    updates: {
      task_status?: TaskStatus;
      assigned_to?: string;
      completion_notes?: string;
    }
  ): Promise<RecoveryTask | null> {
    try {
      const { data, error } = await supabase
        .from('recovery_tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          ...(updates.task_status === 'completed' ? { completed_at: new Date().toISOString() } : {})
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      // Check for dependent tasks
      if (updates.task_status === 'completed') {
        const { data: task } = await supabase
          .from('recovery_tasks')
          .select('recovery_case_id, task_metadata')
          .eq('id', taskId)
          .single();

        if (task) {
          await this.checkDependentTasks(task.recovery_case_id, task.task_metadata?.step_id);
        }
      }

      return data;
    } catch (error) {
      console.error('Error updating recovery task:', error);
      return null;
    }
  }

  /**
   * Offer compensation
   */
  async offerCompensation(
    caseId: string,
    compensation: {
      type: CompensationType;
      value?: number;
      details?: string;
      expiresAt?: string;
    }
  ): Promise<RecoveryCompensation | null> {
    try {
      const { data, error } = await supabase
        .from('recovery_compensation')
        .insert({
          recovery_case_id: caseId,
          compensation_type: compensation.type,
          compensation_value: compensation.value,
          compensation_details: compensation.details,
          offer_status: 'offered',
          offered_at: new Date().toISOString(),
          expires_at: compensation.expiresAt
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error offering compensation:', error);
      return null;
    }
  }

  /**
   * Get client recovery profile
   */
  async getClientRecoveryProfile(clientId: string): Promise<ClientRecoveryProfile | null> {
    try {
      const { data: cases, error } = await supabase
        .from('service_recovery_cases')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error || !cases) return null;

      const resolvedCases = cases.filter(c => c.recovery_status === 'resolved');
      const totalCompensation = await this.calculateTotalCompensation(clientId);

      return {
        clientId,
        totalCases: cases.length,
        successfulRecoveries: resolvedCases.length,
        averageSatisfactionBefore: this.calculateAverageSatisfaction(cases, 'before'),
        averageSatisfactionAfter: this.calculateAverageSatisfaction(cases, 'after'),
        preferredContactMethod: 'email', // Would get from actual data
        effectiveInterventions: this.identifyEffectiveInterventions(resolvedCases),
        riskFactors: this.identifyRiskFactors(cases),
        lastRecoveryDate: cases[0]?.created_at,
        recoveryCostTotal: totalCompensation,
        lifetimeValue: 0 // Would calculate from actual data
      };
    } catch (error) {
      console.error('Error getting client recovery profile:', error);
      return null;
    }
  }

  /**
   * Calculate average satisfaction
   */
  private calculateAverageSatisfaction(cases: ServiceRecoveryCase[], type: 'before' | 'after'): number {
    const scores = cases
      .map(c => type === 'before' ? c.satisfaction_before : c.satisfaction_after)
      .filter(score => score !== null && score !== undefined) as number[];

    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }

  /**
   * Identify effective interventions
   */
  private identifyEffectiveInterventions(cases: ServiceRecoveryCase[]): string[] {
    // This would analyze which interventions were most effective
    return ['Personal contact', 'Service improvement', 'Compensation offer'];
  }

  /**
   * Identify risk factors
   */
  private identifyRiskFactors(cases: ServiceRecoveryCase[]): string[] {
    // This would identify common risk factors
    return ['Service quality issues', 'Communication problems', 'Staff performance'];
  }

  /**
   * Calculate total compensation
   */
  private async calculateTotalCompensation(clientId: string): Promise<number> {
    try {
      const { data: compensations } = await supabase
        .from('recovery_compensation')
        .select('compensation_value')
        .in('recovery_case_id',
          (await supabase
            .from('service_recovery_cases')
            .select('id')
            .eq('client_id', clientId)
          ).data?.map(c => c.id) || []
        );

      return compensations?.reduce((sum, c) => sum + (c.compensation_value || 0), 0) || 0;
    } catch (error) {
      console.error('Error calculating total compensation:', error);
      return 0;
    }
  }

  /**
   * Get processing status
   */
  getProcessingStatus(): {
    isProcessing: boolean;
    activeWorkflows: number;
    pendingTasks: number;
  } {
    return {
      isProcessing: this.isProcessing,
      activeWorkflows: Array.from(this.workflows.values()).filter(w => w.isActive).length,
      pendingTasks: 0 // Would calculate from actual data
    };
  }
}

// Export singleton instance
export const serviceRecoveryService = new ServiceRecoveryService();