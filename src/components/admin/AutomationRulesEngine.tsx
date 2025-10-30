import React, { useState, useEffect } from 'react'
import {
  Bot,
  Plus,
  Edit,
  Trash2,
  Copy,
  Play,
  Pause,
  Clock,
  MessageSquare,
  Calendar,
  Tag,
  AlertTriangle,
  CheckCircle,
  Settings,
  Zap,
  Target,
  Filter,
  Timer,
  Mail,
  Smartphone,
  Facebook,
  Instagram
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast aria-live="polite" aria-atomic="true"'
import { supabase } from '@/integrations/supabase/client'
import { cn } from '@/lib/utils'

interface AutomationRule {
  id: string
  name: string
  description: string
  trigger_type: string
  trigger_config: Record<string, any>
  conditions: RuleCondition[]
  actions: RuleAction[]
  is_active: boolean
  priority: number
  run_at: string
  schedule_config: Record<string, any>
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

interface RuleCondition {
  field: string
  operator: string
  value: any
  type: 'text' | 'number' | 'date' | 'boolean' | 'select'
}

interface RuleAction {
  type: string
  config: Record<string, any>
  delay_minutes?: number
}

const TRIGGER_TYPES = [
  { value: 'booking_created', label: 'Booking Created', icon: Calendar },
  { value: 'booking_confirmed', label: 'Booking Confirmed', icon: CheckCircle },
  { value: 'booking_completed', label: 'Booking Completed', icon: CheckCircle },
  { value: 'booking_cancelled', label: 'Booking Cancelled', icon: AlertTriangle },
  { value: 'payment_completed', label: 'Payment Completed', icon: Tag },
  { value: 'aftercare_period', label: 'Aftercare Period', icon: Clock },
  { value: 'birthday', label: 'Birthday', icon: Calendar },
  { value: 'no_activity', label: 'No Activity', icon: Timer },
  { value: 'abandoned_cart', label: 'Abandoned Cart', icon: AlertTriangle },
  { value: 'message_received', label: 'Message Received', icon: MessageSquare },
  { value: 'review_received', label: 'Review Received', icon: MessageSquare }
]

const ACTION_TYPES = [
  { value: 'send_message', label: 'Send Message', icon: MessageSquare },
  { value: 'send_email', label: 'Send Email', icon: Mail },
  { value: 'send_sms', label: 'Send SMS', icon: Smartphone },
  { value: 'send_whatsapp', label: 'Send WhatsApp', icon: MessageSquare },
  { value: 'create_task', label: 'Create Task', icon: CheckCircle },
  { value: 'assign_agent', label: 'Assign Agent', icon: Users },
  { value: 'add_tag', label: 'Add Tag', icon: Tag },
  { value: 'update_priority', label: 'Update Priority', icon: AlertTriangle },
  { value: 'schedule_followup', label: 'Schedule Follow-up', icon: Calendar },
  { value: 'trigger_webhook', label: 'Trigger Webhook', icon: Zap }
]

const CONDITION_FIELDS = [
  { value: 'service_type', label: 'Service Type', type: 'select' },
  { value: 'total_value', label: 'Total Value', type: 'number' },
  { value: 'customer_type', label: 'Customer Type', type: 'select' },
  { value: 'channel', label: 'Channel', type: 'select' },
  { value: 'priority', label: 'Priority', type: 'select' },
  { value: 'tags', label: 'Tags', type: 'text' },
  { value: 'previous_bookings', label: 'Previous Bookings', type: 'number' },
  { value: 'days_since_last_booking', label: 'Days Since Last Booking', type: 'number' },
  { value: 'customer_segment', label: 'Customer Segment', type: 'select' }
]

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does not contain' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
  { value: 'in', label: 'In' },
  { value: 'not_in', label: 'Not in' }
]

export const AutomationRulesEngine: React.FC = () => {
  const { t } = useTranslation()
  const { toast aria-live="polite" aria-atomic="true" } = useToast()
  const supabase = createClient()

  const [rules, setRules] = useState<AutomationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)
  const [formData, setFormData] = useState<Partial<AutomationRule>>({
    name: '',
    description: '',
    trigger_type: 'booking_created',
    trigger_config: {},
    conditions: [],
    actions: [],
    is_active: true,
    priority: 1,
    run_at: 'immediate',
    schedule_config: {},
    metadata: {}
  })

  // Fetch automation rules
  const fetchRules = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .order('priority', { ascending: true })

      if (error) throw error
      setRules(data || [])
    } catch (error) {
      console.error('Error fetching automation rules:', error)
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: 'Failed to load automation rules',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Save rule
  const saveRule = async () => {
    try {
      const ruleData = {
        ...formData,
        updated_at: new Date().toISOString()
      }

      if (editingRule) {
        const { error } = await supabase
          .from('automation_rules')
          .update(ruleData)
          .eq('id', editingRule.id)

        if (error) throw error

        toast aria-live="polite" aria-atomic="true"({
          title: 'Success',
          description: 'Automation rule updated successfully'
        })
      } else {
        const { error } = await supabase
          .from('automation_rules')
          .insert({
            ...ruleData,
            created_at: new Date().toISOString()
          })

        if (error) throw error

        toast aria-live="polite" aria-atomic="true"({
          title: 'Success',
          description: 'Automation rule created successfully'
        })
      }

      setShowCreateDialog(false)
      setEditingRule(null)
      resetForm()
      fetchRules()
    } catch (error) {
      console.error('Error saving rule:', error)
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: 'Failed to save automation rule',
        variant: 'destructive'
      })
    }
  }

  // Delete rule
  const deleteRule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('automation_rules')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast aria-live="polite" aria-atomic="true"({
        title: 'Success',
        description: 'Automation rule deleted successfully'
      })

      fetchRules()
    } catch (error) {
      console.error('Error deleting rule:', error)
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: 'Failed to delete automation rule',
        variant: 'destructive'
      })
    }
  }

  // Toggle rule active status
  const toggleRule = async (rule: AutomationRule) => {
    try {
      const { error } = await supabase
        .from('automation_rules')
        .update({ is_active: !rule.is_active })
        .eq('id', rule.id)

      if (error) throw error

      toast aria-live="polite" aria-atomic="true"({
        title: 'Success',
        description: `Rule ${rule.is_active ? 'disabled' : 'enabled'} successfully`
      })

      fetchRules()
    } catch (error) {
      console.error('Error toggling rule:', error)
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: 'Failed to toggle rule',
        variant: 'destructive'
      })
    }
  }

  // Duplicate rule
  const duplicateRule = async (rule: AutomationRule) => {
    try {
      const { error } = await supabase
        .from('automation_rules')
        .insert({
          ...rule,
          id: undefined,
          name: `${rule.name} (Copy)`,
          is_active: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast aria-live="polite" aria-atomic="true"({
        title: 'Success',
        description: 'Automation rule duplicated successfully'
      })

      fetchRules()
    } catch (error) {
      console.error('Error duplicating rule:', error)
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: 'Failed to duplicate automation rule',
        variant: 'destructive'
      })
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trigger_type: 'booking_created',
      trigger_config: {},
      conditions: [],
      actions: [],
      is_active: true,
      priority: 1,
      run_at: 'immediate',
      schedule_config: {},
      metadata: {}
    })
  }

  // Add condition
  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [
        ...(prev.conditions || []),
        {
          field: 'service_type',
          operator: 'equals',
          value: '',
          type: 'select'
        }
      ]
    }))
  }

  // Update condition
  const updateCondition = (index: number, condition: RuleCondition) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions?.map((c, i) => i === index ? condition : c)
    }))
  }

  // Remove condition
  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions?.filter((_, i) => i !== index)
    }))
  }

  // Add action
  const addAction = () => {
    setFormData(prev => ({
      ...prev,
      actions: [
        ...(prev.actions || []),
        {
          type: 'send_message',
          config: {},
          delay_minutes: 0
        }
      ]
    }))
  }

  // Update action
  const updateAction = (index: number, action: RuleAction) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions?.map((a, i) => i === index ? action : a)
    }))
  }

  // Remove action
  const removeAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions?.filter((_, i) => i !== index)
    }))
  }

  useEffect(() => {
    fetchRules()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automation Rules</h2>
          <p className="text-muted-foreground">
            Create automated workflows for customer communications
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingRule(null) }}>
              <Plus className="h-4 w-4 mr-2" />
              New Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? 'Edit Automation Rule' : 'Create Automation Rule'}
              </DialogTitle>
              <DialogDescription>
                Configure when and how automated messages should be sent
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Rule Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Welcome Message for New Customers"
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority?.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 (Highest)</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5 (Lowest)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this rule does..."
                  rows={2}
                />
              </div>

              {/* Trigger */}
              <div>
                <Label>Trigger</Label>
                <Select
                  value={formData.trigger_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, trigger_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map(trigger => {
                      const Icon = trigger.icon
                      return (
                        <SelectItem key={trigger.value} value={trigger.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {trigger.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Schedule */}
              <div>
                <Label>Run At</Label>
                <Select
                  value={formData.run_at}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, run_at: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediately</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="recurring">Recurring</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Conditions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Conditions</Label>
                  <Button variant="outline" size="sm" onClick={addCondition}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Condition
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.conditions?.map((condition, index) => (
                    <Card key={index} className="p-3">
                      <div className="grid grid-cols-4 gap-2 items-end">
                        <div>
                          <Label className="text-xs">Field</Label>
                          <Select
                            value={condition.field}
                            onValueChange={(value) => updateCondition(index, {
                              ...condition,
                              field: value,
                              type: CONDITION_FIELDS.find(f => f.value === value)?.type || 'text'
                            })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CONDITION_FIELDS.map(field => (
                                <SelectItem key={field.value} value={field.value}>
                                  {field.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Operator</Label>
                          <Select
                            value={condition.operator}
                            onValueChange={(value) => updateCondition(index, { ...condition, operator: value })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {OPERATORS.map(op => (
                                <SelectItem key={op.value} value={op.value}>
                                  {op.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Value</Label>
                          <Input
                            value={condition.value}
                            onChange={(e) => updateCondition(index, { ...condition, value: e.target.value })}
                            className="h-8"
                            placeholder="Enter value..."
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCondition(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Actions</Label>
                  <Button variant="outline" size="sm" onClick={addAction}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Action
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.actions?.map((action, index) => (
                    <Card key={index} className="p-3">
                      <div className="space-y-2">
                        <div className="grid grid-cols-4 gap-2 items-end">
                          <div>
                            <Label className="text-xs">Action Type</Label>
                            <Select
                              value={action.type}
                              onValueChange={(value) => updateAction(index, { ...action, type: value })}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ACTION_TYPES.map(actionType => {
                                  const Icon = actionType.icon
                                  return (
                                    <SelectItem key={actionType.value} value={actionType.value}>
                                      <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4" />
                                        {actionType.label}
                                      </div>
                                    </SelectItem>
                                  )
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Delay (minutes)</Label>
                            <Input
                              type="number"
                              value={action.delay_minutes || 0}
                              onChange={(e) => updateAction(index, {
                                ...action,
                                delay_minutes: parseInt(e.target.value) || 0
                              })}
                              className="h-8"
                              placeholder="0"
                            />
                          </div>
                          <div className="col-span-2 flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAction(index)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {action.type === 'send_message' && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Template</Label>
                              <Select>
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select template..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {/* Load templates from database */}
                                  <SelectItem value="welcome">Welcome Message</SelectItem>
                                  <SelectItem value="reminder">Booking Reminder</SelectItem>
                                  <SelectItem value="followup">Follow-up</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Channel</Label>
                              <Select>
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="whatsapp">
                                    <div className="flex items-center gap-2">
                                      <MessageSquare className="h-4 w-4" />
                                      WhatsApp
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="sms">
                                    <div className="flex items-center gap-2">
                                      <Smartphone className="h-4 w-4" />
                                      SMS
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="email">
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-4 w-4" />
                                      Email
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="active">Enable this rule</Label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={saveRule}>
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rules List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No automation rules yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first automation rule to start sending personalized messages automatically
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => {
            const TriggerIcon = TRIGGER_TYPES.find(t => t.value === rule.trigger_type)?.icon || Bot
            return (
              <Card key={rule.id} className={cn(!rule.is_active && "opacity-60")}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        rule.is_active ? "bg-primary/10" : "bg-muted"
                      )}>
                        <TriggerIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{rule.name}</CardTitle>
                        <CardDescription>{rule.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={rule.is_active ? "default" : "secondary"}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">Priority {rule.priority}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        <span>Trigger: {TRIGGER_TYPES.find(t => t.value === rule.trigger_type)?.label}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Run: {rule.run_at}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Filter className="h-4 w-4" />
                        <span>{rule.conditions?.length || 0} condition(s)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-4 w-4" />
                        <span>{rule.actions?.length || 0} action(s)</span>
                      </div>
                    </div>

                    {rule.conditions && rule.conditions.length > 0 && (
                      <div className="border-t pt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Conditions:</p>
                        <div className="flex flex-wrap gap-1">
                          {rule.conditions.map((condition, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {condition.field} {condition.operator} {condition.value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {rule.actions && rule.actions.length > 0 && (
                      <div className="border-t pt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Actions:</p>
                        <div className="flex flex-wrap gap-1">
                          {rule.actions.map((action, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {ACTION_TYPES.find(a => a.value === action.type)?.label}
                              {action.delay_minutes && action.delay_minutes > 0 && (
                                <span className="ml-1">(+{action.delay_minutes}m)</span>
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(rule.created_at).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRule(rule)}
                        >
                          {rule.is_active ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingRule(rule)
                            setFormData(rule)
                            setShowCreateDialog(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicateRule(rule)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRule(rule.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}