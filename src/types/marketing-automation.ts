// Marketing Automation System Types
// Comprehensive type definitions for automated marketing workflows

export interface MarketingWorkflow {
  id: string
  name: string
  description?: string
  type: WorkflowType
  status: WorkflowStatus
  trigger_config: TriggerConfig
  workflow_nodes: WorkflowNode[]
  workflow_edges: WorkflowEdge[]
  segment_criteria: SegmentCriteria
  ab_test_config?: ABTestConfig
  created_by?: string
  created_at: string
  updated_at: string
  metadata: Record<string, any>
}

export type WorkflowType =
  | 'welcome_series'
  | 'aftercare_reminders'
  | 'review_requests'
  | 're_engagement'
  | 'birthday_anniversary'
  | 'abandoned_booking'
  | 'custom'

export type WorkflowStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'archived'

export interface TriggerConfig {
  trigger_type: TriggerType
  delay_minutes?: number
  schedule?: string // Cron expression
  segment_criteria?: SegmentCriteria
  event_filters?: Record<string, any>
}

export type TriggerType =
  | 'customer_created'
  | 'booking_created'
  | 'booking_completed'
  | 'booking_cancelled'
  | 'payment_completed'
  | 'review_submitted'
  | 'customer_birthday'
  | 'scheduled'
  | 'webhook_received'
  | 'manual'

export interface WorkflowNode {
  id: string
  type: NodeType
  config: Record<string, any>
  position: Position
  data?: Record<string, any>
}

export type NodeType =
  | 'trigger'
  | 'send_email'
  | 'send_sms'
  | 'send_whatsapp'
  | 'send_push'
  | 'wait'
  | 'branch'
  | 'condition'
  | 'update_data'
  | 'add_to_segment'
  | 'remove_from_segment'
  | 'ab_test'
  | 'webhook'
  | 'analytics_event'
  | 'tag_customer'
  | 'untag_customer'

export interface Position {
  x: number
  y: number
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  condition?: EdgeCondition
}

export interface EdgeCondition {
  type: 'always' | 'percentage' | 'criteria' | 'a_test'
  value?: any
  criteria?: SegmentCriteria
}

export interface ABTestConfig {
  enabled: boolean
  variants: ABTestVariant[]
  success_metric: ABTestMetric
  confidence_level: number
  test_duration_days: number
}

export interface ABTestVariant {
  id: string
  name: string
  percentage: number
  config: Record<string, any>
}

export type ABTestMetric =
  | 'open_rate'
  | 'click_rate'
  | 'conversion_rate'
  | 'revenue_per_recipient'

export interface MarketingTemplate {
  id: string
  name: string
  description?: string
  channel: ChannelType
  type: TemplateType
  subject_template?: string
  body_template: string
  variables: TemplateVariable[]
  styles?: Record<string, any>
  language: string
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
  metadata: Record<string, any>
}

export type ChannelType =
  | 'email'
  | 'sms'
  | 'whatsapp'
  | 'push'

export type TemplateType =
  | 'marketing'
  | 'transactional'
  | 'automation'

export interface TemplateVariable {
  name: string
  type: VariableType
  description?: string
  required: boolean
  default_value?: any
}

export type VariableType =
  | 'string'
  | 'number'
  | 'date'
  | 'boolean'
  | 'url'
  | 'currency'
  | 'object'
  | 'array'

export interface MarketingCampaign {
  id: string
  workflow_id?: string
  name: string
  type: CampaignType
  status: CampaignStatus
  template_id?: string
  segment_criteria: SegmentCriteria
  total_recipients: number
  sent_count: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  failed_count: number
  unsubscribed_count: number
  schedule_at?: string
  send_time_optimization: boolean
  timezone: string
  created_by?: string
  created_at: string
  updated_at: string
  metadata: Record<string, any>
}

export type CampaignType =
  | 'email'
  | 'sms'
  | 'whatsapp'
  | 'multi'

export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'running'
  | 'paused'
  | 'completed'
  | 'cancelled'

export interface CustomerSegment {
  id: string
  name: string
  description?: string
  criteria: SegmentCriteria
  is_dynamic: boolean
  customer_count: number
  last_calculated_at?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface SegmentCriteria {
  // Demographic filters
  age_min?: number
  age_max?: number
  gender?: string[]
  location?: string[]
  language?: string[]

  // Behavioral filters
  service_types?: string[]
  total_bookings_min?: number
  total_bookings_max?: number
  total_spent_min?: number
  total_spent_max?: number
  last_booking_after?: string
  last_booking_before?: string
  days_since_last_booking?: number
  has_active_booking?: boolean
  booking_status?: string[]

  // Engagement filters
  email_engaged?: boolean
  sms_engaged?: boolean
  last_email_opened_after?: string
  last_sms_clicked_after?: string
  unsubscribe_status?: 'all' | 'email' | 'sms' | 'none'

  // Preference filters
  marketing_consent?: boolean
  email_consent?: boolean
  sms_consent?: boolean
  whatsapp_consent?: boolean

  // Custom filters
  tags?: string[]
  custom_attributes?: Record<string, any>

  // Advanced filters
  ltv_range?: [number, number]
  booking_frequency?: string
  preferred_time_of_day?: string[]
  preferred_days?: string[]

  // Exclusions
  exclude_segments?: string[]
  exclude_tags?: string[]
}

export interface CampaignRecipient {
  id: string
  campaign_id: string
  customer_id: string
  email_address?: string
  phone_number?: string
  whatsapp_number?: string
  status: RecipientStatus
  sent_at?: string
  delivered_at?: string
  opened_at?: string
  clicked_at?: string
  failed_at?: string
  failure_reason?: string
  variables: Record<string, any>
  tracking_data: Record<string, any>
  created_at: string
  updated_at: string
}

export type RecipientStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'failed'
  | 'unsubscribed'
  | 'bounced'

export interface WorkflowExecution {
  id: string
  workflow_id: string
  customer_id: string
  trigger_event: string
  trigger_data: Record<string, any>
  current_node_id?: string
  status: ExecutionStatus
  started_at: string
  completed_at?: string
  error_message?: string
  execution_data: Record<string, any>
  metadata: Record<string, any>
}

export type ExecutionStatus =
  | 'running'
  | 'completed'
  | 'failed'
  | 'paused'

export interface WorkflowNodeExecution {
  id: string
  execution_id: string
  node_id: string
  node_type: NodeType
  status: NodeExecutionStatus
  started_at?: string
  completed_at?: string
  input_data: Record<string, any>
  output_data: Record<string, any>
  error_message?: string
  metadata: Record<string, any>
}

export type NodeExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'

export interface MarketingAnalytics {
  id: string
  campaign_id?: string
  workflow_id?: string
  template_id?: string
  event_type: AnalyticsEventType
  event_data: Record<string, any>
  customer_id?: string
  timestamp: string
  metadata: Record<string, any>
}

export type AnalyticsEventType =
  | 'campaign_sent'
  | 'email_delivered'
  | 'email_opened'
  | 'email_clicked'
  | 'sms_delivered'
  | 'sms_clicked'
  | 'whatsapp_delivered'
  | 'whatsapp_clicked'
  | 'unsubscribed'
  | 'bounced'
  | 'complained'
  | 'workflow_started'
  | 'workflow_completed'
  | 'workflow_failed'
  | 'node_executed'
  | 'conversion'

export interface MarketingPreferences {
  id: string
  customer_id: string
  email_consent: boolean
  sms_consent: boolean
  whatsapp_consent: boolean
  push_consent: boolean
  consent_updated_at: string
  consent_source: string
  unsubscribe_reason?: string
  unsubscribe_all_at?: string
  created_at: string
  updated_at: string
}

export interface EmailDeliverability {
  id: string
  campaign_id: string
  recipient_id: string
  delivery_status: string
  provider_response?: string
  bounce_type?: string
  complaint_feedback?: string
  spam_complaint: boolean
  delivery_attempts: number
  last_attempt_at?: string
  created_at: string
}

// Visual Workflow Designer Types
export interface WorkflowDesignerState {
  nodes: WorkflowDesignerNode[]
  edges: WorkflowDesignerEdge[]
  selectedNodeId?: string
  selectedEdgeId?: string
  isDragging: boolean
  dragOffset: Position
  scale: number
  pan: Position
}

export interface WorkflowDesignerNode extends WorkflowNode {
  isEditing?: boolean
  isValid: boolean
  errors: string[]
}

export interface WorkflowDesignerEdge extends WorkflowEdge {
  isValid: boolean
  errors: string[]
}

// Template Editor Types
export interface TemplateEditorState {
  template: Partial<MarketingTemplate>
  isPreviewMode: boolean
  previewData: Record<string, any>
  validationErrors: ValidationError[]
  isSaving: boolean
  hasUnsavedChanges: boolean
}

export interface ValidationError {
  field: string
  message: string
  type: 'error' | 'warning'
}

// Campaign Builder Types
export interface CampaignBuilderState {
  campaign: Partial<MarketingCampaign>
  currentStep: CampaignBuilderStep
  segmentPreview?: CustomerSegment[]
  templatePreview?: MarketingTemplate
  isTestSending: boolean
  testResults: TestResult[]
}

export type CampaignBuilderStep =
  | 'details'
  | 'audience'
  | 'content'
  | 'schedule'
  | 'review'

export interface TestResult {
  id: string
  recipient: string
  channel: ChannelType
  status: RecipientStatus
  sent_at?: string
  delivered_at?: string
  error?: string
}

// Analytics Dashboard Types
export interface CampaignAnalytics {
  campaign_id: string
  metrics: CampaignMetrics
  timeline: TimelineData[]
  device_breakdown: DeviceBreakdown[]
  location_breakdown: LocationBreakdown[]
  performance: PerformanceMetrics
}

export interface CampaignMetrics {
  total_sent: number
  total_delivered: number
  total_opened: number
  total_clicked: number
  total_converted: number
  total_revenue: number
  delivery_rate: number
  open_rate: number
  click_rate: number
  conversion_rate: number
  unsubscribe_rate: number
  bounce_rate: number
  spam_rate: number
  revenue_per_recipient: number
  revenue_per_conversion: number
}

export interface TimelineData {
  date: string
  sent: number
  delivered: number
  opened: number
  clicked: number
  converted: number
}

export interface DeviceBreakdown {
  device: string
  count: number
  percentage: number
}

export interface LocationBreakdown {
  location: string
  count: number
  percentage: number
}

export interface PerformanceMetrics {
  best_performing_time: string
  best_performing_day: string
  average_engagement_time: number
  peak_engagement_hour: number
  subject_line_performance: SubjectLinePerformance[]
}

export interface SubjectLinePerformance {
  subject: string
  open_rate: number
  count: number
}

// Integration Types
export interface EmailProviderConfig {
  provider: 'sendgrid' | 'ses' | 'mailgun' | 'postmark'
  api_key: string
  from_email: string
  from_name: string
  reply_to?: string
  settings: Record<string, any>
}

export interface SMSProviderConfig {
  provider: 'twilio' | 'messagebird' | 'sinch' | 'vonage'
  account_sid?: string
  auth_token?: string
  api_key?: string
  from_number: string
  settings: Record<string, any>
}

export interface WhatsAppProviderConfig {
  provider: 'twilio' | 'messagebird' | 'meta'
  phone_number_id: string
  access_token: string
  webhook_url: string
  templates: WhatsAppTemplate[]
}

export interface WhatsAppTemplate {
  name: string
  category: string
  language: string
  components: WhatsAppTemplateComponent[]
}

export interface WhatsAppTemplateComponent {
  type: 'header' | 'body' | 'footer' | 'buttons'
  text?: string
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  buttons?: WhatsAppButton[]
}

export interface WhatsAppButton {
  type: 'quick_reply' | 'url' | 'phone_number'
  text: string
  url?: string
  phone_number?: string
}

// API Request/Response Types
export interface CreateWorkflowRequest {
  name: string
  description?: string
  type: WorkflowType
  trigger_config: TriggerConfig
  workflow_nodes: WorkflowNode[]
  workflow_edges: WorkflowEdge[]
  segment_criteria?: SegmentCriteria
}

export interface UpdateWorkflowRequest extends Partial<CreateWorkflowRequest> {
  id: string
}

export interface CreateCampaignRequest {
  name: string
  type: CampaignType
  template_id?: string
  segment_criteria: SegmentCriteria
  schedule_at?: string
  send_time_optimization?: boolean
  timezone?: string
}

export interface UpdateCampaignRequest extends Partial<CreateCampaignRequest> {
  id: string
  status?: CampaignStatus
}

export interface CreateTemplateRequest {
  name: string
  description?: string
  channel: ChannelType
  type: TemplateType
  subject_template?: string
  body_template: string
  variables?: TemplateVariable[]
  language?: string
}

export interface TestTemplateRequest {
  template_id: string
  test_data: Record<string, any>
  recipients: string[]
}

export interface LaunchCampaignRequest {
  campaign_id: string
  test_mode?: boolean
  send_percentage?: number
}

// Real-time Event Types
export interface MarketingWebSocketEvent {
  type: MarketingEventType
  data: any
  timestamp: string
}

export type MarketingEventType =
  | 'campaign_status_changed'
  | 'campaign_progress_updated'
  | 'workflow_execution_started'
  | 'workflow_execution_completed'
  | 'recipient_status_updated'
  | 'real_time_analytics'
  | 'template_rendered'
  | 'segment_calculated'

// Utility Types
export interface PersonalizationData {
  customer_name: string
  business_name: string
  service_type?: string
  appointment_time?: string
  booking_reference?: string
  custom_fields?: Record<string, any>
}

export interface RenderTemplateResult {
  rendered_subject?: string
  rendered_body: string
  used_variables: string[]
  missing_variables: string[]
  errors: string[]
}

export interface ValidateWorkflowResult {
  is_valid: boolean
  errors: WorkflowValidationError[]
  warnings: WorkflowValidationWarning[]
}

export interface WorkflowValidationError {
  node_id?: string
  edge_id?: string
  type: 'missing_connection' | 'invalid_config' | 'circular_reference' | 'missing_trigger'
  message: string
}

export interface WorkflowValidationWarning {
  node_id?: string
  edge_id?: string
  type: 'unused_node' | 'missing_ab_test' | 'potential_spam'
  message: string
}

// Compliance Types
export interface ComplianceRecord {
  id: string
  campaign_id: string
  customer_id: string
  consent_type: string
  consent_given: boolean
  consent_timestamp: string
  consent_source: string
  ip_address?: string
  user_agent?: string
  gdpr_compliant: boolean
  marketing_preferences: MarketingPreferences
}

export interface UnsubscribeRequest {
  campaign_id: string
  recipient_id: string
  reason?: string
  feedback?: string
  channel_preferences?: Partial<MarketingPreferences>
}

export interface ConsentManagementConfig {
  require_double_opt_in: boolean
  consent_expiry_days: number
  default_consent_preferences: Partial<MarketingPreferences>
  gdpr_compliance_enabled: boolean
  ccpa_compliance_enabled: boolean
  data_retention_days: number
}