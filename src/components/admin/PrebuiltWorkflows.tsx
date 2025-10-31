import React, { useState } from 'react'
import {
  Mail,
  MessageSquare,
  Clock,
  Calendar,
  Heart,
  ShoppingCart,
  Users,
  Star,
  Zap,
  Play,
  Pause,
  Settings,
  Copy,
  Eye,
  BarChart3,
  Target,
  Gift,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  UserPlus,
  MessageSquare,
  Calendar as CalendarIcon,
  ShoppingBag
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'


import type { MarketingWorkflow, WorkflowType } from '@/types/marketing-automation'

interface PrebuiltWorkflowsProps {
  className?: string
}

interface WorkflowTemplate {
  id: string
  type: WorkflowType
  name: string
  description: string
  category: string
  icon: React.ReactNode
  color: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  triggers: string[]
  actions: string[]
  metrics: string[]
  setupSteps: string[]
  isActive: boolean
  performance?: {
    conversionRate: number
    openRate: number
    clickRate: number
    activeUsers: number
  }
}

const PREBUILT_WORKFLOWS: WorkflowTemplate[] = [
  {
    id: 'welcome-series',
    type: 'welcome_series',
    name: 'Welcome Series',
    description: 'Multi-step welcome sequence for new customers with personalized content and special offers',
    category: 'Onboarding',
    icon: <UserPlus className="h-6 w-6" />,
    color: 'bg-blue-500',
    difficulty: 'beginner',
    estimatedTime: '5 minutes',
    triggers: ['Customer Registration', 'First Purchase'],
    actions: ['Send Welcome Email', 'Wait 1 Day', 'Send Offers', 'Wait 3 Days', 'Send Follow-up'],
    metrics: ['Open Rate', 'Click Rate', 'Conversion Rate', 'Time to First Purchase'],
    setupSteps: [
      'Configure welcome email template',
      'Set up delay timing',
      'Define special offers',
      'Create follow-up content'
    ],
    isActive: true,
    performance: {
      conversionRate: 45,
      openRate: 68,
      clickRate: 23,
      activeUsers: 156
    }
  },
  {
    id: 'aftercare-reminders',
    type: 'aftercare_reminders',
    name: 'Aftercare Reminders',
    description: 'Automated aftercare instructions and follow-ups post-treatment to ensure customer satisfaction',
    category: 'Service Delivery',
    icon: <Heart className="h-6 w-6" />,
    color: 'bg-green-500',
    difficulty: 'intermediate',
    estimatedTime: '10 minutes',
    triggers: ['Service Completion', 'Treatment Type'],
    actions: ['Send Aftercare Instructions', 'Wait 24 Hours', 'Check-in Message', 'Wait 3 Days', 'Review Request'],
    metrics: ['Customer Satisfaction', 'Review Count', 'Repeat Booking Rate'],
    setupSteps: [
      'Create aftercare templates per service',
      'Set up check-in timing',
      'Configure review requests',
      'Map service types to templates'
    ],
    isActive: true,
    performance: {
      conversionRate: 78,
      openRate: 92,
      clickRate: 41,
      activeUsers: 234
    }
  },
  {
    id: 'review-requests',
    type: 'review_requests',
    name: 'Review Requests',
    description: 'Automated review requests sent at optimal times to maximize customer feedback',
    category: 'Reputation Management',
    icon: <Star className="h-6 w-6" />,
    color: 'bg-yellow-500',
    difficulty: 'beginner',
    estimatedTime: '3 minutes',
    triggers: ['Service Completion', 'Post-Service Delay'],
    actions: ['Wait 3 Days', 'Send Review Request', 'Wait 7 Days', 'Send Reminder'],
    metrics: ['Review Count', 'Average Rating', 'Response Rate'],
    setupSteps: [
      'Set review request delay',
      'Customize review template',
      'Configure reminder timing',
      'Set up review platforms'
    ],
    isActive: false,
    performance: {
      conversionRate: 35,
      openRate: 74,
      clickRate: 18,
      activeUsers: 89
    }
  },
  {
    id: 're-engagement',
    type: 're_engagement',
    name: 'Customer Re-engagement',
    description: 'Win back inactive customers with targeted offers and personalized messages',
    category: 'Retention',
    icon: <TrendingUp className="h-6 w-6" />,
    color: 'bg-purple-500',
    difficulty: 'advanced',
    estimatedTime: '15 minutes',
    triggers: ['Customer Inactivity', 'Scheduled Check'],
    actions: ['Identify Inactive Customers', 'Send We Miss You', 'Wait 7 Days', 'Send Special Offer', 'Wait 14 Days', 'Final Offer'],
    metrics: ['Re-engagement Rate', 'Reactivated Customers', 'Revenue from Reactivated'],
    setupSteps: [
      'Define inactivity period',
      'Create we miss you campaign',
      'Set up special offers',
          'Configure escalation rules'
    ],
    isActive: true,
    performance: {
      conversionRate: 22,
      openRate: 56,
      clickRate: 12,
      activeUsers: 67
    }
  },
  {
    id: 'birthday-anniversary',
    type: 'birthday_anniversary',
    name: 'Birthday & Anniversary',
    description: 'Celebrate special occasions with personalized messages and exclusive offers',
    category: 'Personalization',
    icon: <Gift className="h-6 w-6" />,
    color: 'bg-pink-500',
    difficulty: 'intermediate',
    estimatedTime: '8 minutes',
    triggers: ['Customer Birthday', 'Membership Anniversary'],
    actions: ['Send Birthday Wishes', 'Add Special Offer', 'Schedule Anniversary'],
    metrics: ['Redemption Rate', 'Customer Satisfaction', 'Loyalty Score'],
    setupSteps: [
      'Collect birth dates',
      'Create birthday templates',
      'Set up special offers',
      'Configure anniversary tracking'
    ],
    isActive: false,
    performance: {
      conversionRate: 52,
      openRate: 89,
      clickRate: 34,
      activeUsers: 123
    }
  },
  {
    id: 'abandoned-booking',
    type: 'abandoned_booking',
    name: 'Abandoned Booking Recovery',
    description: 'Recover abandoned bookings with timely reminders and incentives',
    category: 'Conversion',
    icon: <ShoppingCart className="h-6 w-6" />,
    color: 'bg-orange-500',
    difficulty: 'intermediate',
    estimatedTime: '10 minutes',
    triggers: ['Booking Started', 'Cart Abandoned'],
    actions: ['Wait 30 Minutes', 'Send Reminder', 'Wait 2 Hours', 'Send with Discount', 'Wait 24 Hours', 'Final Reminder'],
    metrics: ['Recovery Rate', 'Conversion Rate', 'Revenue Recovered'],
    setupSteps: [
      'Set up booking tracking',
      'Configure reminder timing',
      'Create discount offers',
      'Set up abandonment rules'
    ],
    isActive: true,
    performance: {
      conversionRate: 38,
      openRate: 71,
      clickRate: 25,
      activeUsers: 198
    }
  },
  {
    id: 'last-minute-booking',
    type: 'custom',
    name: 'Last Minute Booking Boost',
    description: 'Fill empty slots with last-minute offers to customers who prefer spontaneity',
    category: 'Revenue Optimization',
    icon: <Zap className="h-6 w-6" />,
    color: 'bg-red-500',
    difficulty: 'advanced',
    estimatedTime: '12 minutes',
    triggers: ['Available Slot Detection', 'Time-based Trigger'],
    actions: ['Detect Empty Slots', 'Find Matching Customers', 'Send Flash Offer', 'Track Conversions'],
    metrics: ['Fill Rate', 'Revenue per Slot', 'Customer Response Time'],
    setupSteps: [
      'Configure slot detection rules',
      'Define customer segments',
      'Create flash offer templates',
      'Set up targeting criteria'
    ],
    isActive: false,
    performance: {
      conversionRate: 28,
      openRate: 65,
      clickRate: 19,
      activeUsers: 45
    }
  },
  {
    id: 'loyalty-program',
    type: 'custom',
    name: 'Loyalty Program Nurturing',
    description: 'Keep loyalty members engaged with exclusive content and early access',
    category: 'Loyalty',
    icon: <Users className="h-6 w-6" />,
    color: 'bg-indigo-500',
    difficulty: 'advanced',
    estimatedTime: '20 minutes',
    triggers: ['Loyalty Milestone', 'Points Earned', 'Tier Change'],
    actions: ['Send Milestone Congratulations', 'Share Exclusive Offers', 'Provide Early Access', 'Monthly Summary'],
    metrics: ['Loyalty Engagement', 'Tier Progression', 'Redemption Rate'],
    setupSteps: [
      'Map loyalty milestones',
      'Create exclusive content',
      'Set up tier benefits',
      'Configure monthly summaries'
    ],
    isActive: false,
    performance: {
      conversionRate: 61,
      openRate: 83,
      clickRate: 37,
      activeUsers: 87
    }
  }
]

export const PrebuiltWorkflows: React.FC<PrebuiltWorkflowsProps> = ({ className }) => {
  const { t } = useTranslation()
  const { toast } = useToast()

  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowTemplate | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showSetupDialog, setShowSetupDialog] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const [setupConfig, setSetupConfig] = useState<Record<string, any>>({})

  // Get unique categories
  const categories = Array.from(new Set(PREBUILT_WORKFLOWS.map(w => w.category)))

  // Filter workflows
  const filteredWorkflows = PREBUILT_WORKFLOWS.filter(workflow => {
    const matchesCategory = filterCategory === 'all' || workflow.category === filterCategory
    const matchesDifficulty = filterDifficulty === 'all' || workflow.difficulty === filterDifficulty
    const matchesSearch = workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesDifficulty && matchesSearch
  })

  const handleActivateWorkflow = (workflow: WorkflowTemplate) => {
    // In a real implementation, this would activate the workflow
    toast({
      title: t('workflow_activated', 'Workflow Activated'),
      description: t('workflow_activated_description', `${workflow.name} has been activated and is now running`)
    })
  }

  const handleDeactivateWorkflow = (workflow: WorkflowTemplate) => {
    // In a real implementation, this would deactivate the workflow
    toast({
      title: t('workflow_deactivated', 'Workflow Deactivated'),
      description: t('workflow_deactivated_description', `${workflow.name} has been deactivated`)
    })
  }

  const handleDuplicateWorkflow = (workflow: WorkflowTemplate) => {
    // In a real implementation, this would duplicate the workflow
    toast({
      title: t('workflow_duplicated', 'Workflow Duplicated'),
      description: t('workflow_duplicated_description', `${workflow.name} has been duplicated for customization`)
    })
  }

  const handleSetupWorkflow = (workflow: WorkflowTemplate) => {
    setSelectedWorkflow(workflow)
    setShowSetupDialog(true)

    // Initialize setup configuration based on workflow type
    const initialConfig: Record<string, any> = {}

    if (workflow.type === 'welcome_series') {
      initialConfig.welcomeOffer = '20% off first service'
      initialConfig.firstDelay = '1 day'
      initialConfig.secondDelay = '3 days'
    } else if (workflow.type === 'aftercare_reminders') {
      initialConfig.checkInDelay = '24 hours'
      initialConfig.reviewDelay = '3 days'
      initialConfig.services = ['beauty', 'fitness']
    } else if (workflow.type === 'review_requests') {
      initialConfig.delayDays = 3
      initialConfig.reminderDays = 7
      initialConfig.reviewPlatforms = ['google', 'facebook']
    }

    setSetupConfig(initialConfig)
  }

  const handleSaveSetup = () => {
    if (!selectedWorkflow) return

    // In a real implementation, this would save the configuration and activate the workflow
    toast({
      title: t('workflow_configured', 'Workflow Configured'),
      description: t('workflow_configured_description', `${selectedWorkflow.name} has been configured and activated`)
    })

    setShowSetupDialog(false)
    setSelectedWorkflow(null)
    setSetupConfig({})
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-gray-400" />
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('prebuilt_workflows', 'Pre-built Workflows')}</h2>
          <p className="text-muted-foreground">
            {t('prebuilt_workflows_description', 'Choose from our library of proven automation workflows')}
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('active_workflows', 'Active Workflows')}</p>
                <p className="text-2xl font-bold">
                  {PREBUILT_WORKFLOWS.filter(w => w.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('avg_conversion_rate', 'Avg Conversion Rate')}</p>
                <p className="text-2xl font-bold">
                  {Math.round(
                    PREBUILT_WORKFLOWS
                      .filter(w => w.performance)
                      .reduce((acc, w) => acc + w.performance!.conversionRate, 0) /
                    PREBUILT_WORKFLOWS.filter(w => w.performance).length
                  )}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('active_users', 'Active Users')}</p>
                <p className="text-2xl font-bold">
                  {PREBUILT_WORKFLOWS
                    .filter(w => w.performance)
                    .reduce((acc, w) => acc + w.performance!.activeUsers, 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Target className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('total_workflows', 'Total Workflows')}</p>
                <p className="text-2xl font-bold">{PREBUILT_WORKFLOWS.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('search_workflows', 'Search workflows...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="all">{t('all_categories', 'All Categories')}</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>

        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="all">{t('all_difficulties', 'All Difficulties')}</option>
          <option value="beginner">{t('beginner', 'Beginner')}</option>
          <option value="intermediate">{t('intermediate', 'Intermediate')}</option>
          <option value="advanced">{t('advanced', 'Advanced')}</option>
        </select>
      </div>

      {/* Workflows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkflows.map((workflow) => (
          <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg text-white", workflow.color)}>
                    {workflow.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{workflow.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {workflow.category}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(workflow.isActive)}
                  <Switch
                    checked={workflow.isActive}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleActivateWorkflow(workflow)
                      } else {
                        handleDeactivateWorkflow(workflow)
                      }
                    }}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {workflow.description}
              </p>

              <div className="flex items-center gap-2 text-xs">
                <Badge className={getDifficultyColor(workflow.difficulty)}>
                  {t(workflow.difficulty, workflow.difficulty)}
                </Badge>
                <span className="text-muted-foreground">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {workflow.estimatedTime}
                </span>
              </div>

              {workflow.performance && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t('conversion_rate', 'Conversion Rate')}</span>
                    <span className="font-medium">{workflow.performance.conversionRate}%</span>
                  </div>
                  <Progress value={workflow.performance.conversionRate} className="h-2" />

                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div className="text-center">
                      <Mail className="h-3 w-3 mx-auto mb-1" />
                      <p>{workflow.performance.openRate}%</p>
                    </div>
                    <div className="text-center">
                      <Target className="h-3 w-3 mx-auto mb-1" />
                      <p>{workflow.performance.clickRate}%</p>
                    </div>
                    <div className="text-center">
                      <Users className="h-3 w-3 mx-auto mb-1" />
                      <p>{workflow.performance.activeUsers}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => {
                  setSelectedWorkflow(workflow)
                  setShowDetailsDialog(true)
                }}>
                  <Eye className="h-3 w-3 mr-1" />
                  {t('details', 'Details')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDuplicateWorkflow(workflow)}>
                  <Copy className="h-3 w-3" />
                </Button>
                <Button size="sm" onClick={() => handleSetupWorkflow(workflow)}>
                  <Settings className="h-3 w-3 mr-1" />
                  {t('setup', 'Setup')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workflow Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedWorkflow && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={cn("p-3 rounded-lg text-white", selectedWorkflow.color)}>
                    {selectedWorkflow.icon}
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{selectedWorkflow.name}</DialogTitle>
                    <DialogDescription className="text-base">
                      {selectedWorkflow.description}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">{t('workflow_overview', 'Workflow Overview')}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('category', 'Category')}</span>
                        <Badge>{selectedWorkflow.category}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('difficulty', 'Difficulty')}</span>
                        <Badge className={getDifficultyColor(selectedWorkflow.difficulty)}>
                          {t(selectedWorkflow.difficulty, selectedWorkflow.difficulty)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('estimated_setup_time', 'Estimated Setup Time')}</span>
                        <span>{selectedWorkflow.estimatedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('status', 'Status')}</span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(selectedWorkflow.isActive)}
                          <span>{selectedWorkflow.isActive ? t('active', 'Active') : t('inactive', 'Inactive')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">{t('triggers', 'Triggers')}</h3>
                    <div className="space-y-2">
                      {selectedWorkflow.triggers.map((trigger, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <Zap className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{trigger}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">{t('setup_steps', 'Setup Steps')}</h3>
                    <ol className="space-y-2">
                      {selectedWorkflow.setupSteps.map((step, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <span className="text-sm">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">{t('actions_flow', 'Actions Flow')}</h3>
                    <div className="space-y-2">
                      {selectedWorkflow.actions.map((action, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs", selectedWorkflow.color)}>
                            {index + 1}
                          </div>
                          <span className="text-sm">{action}</span>
                          {index < selectedWorkflow.actions.length - 1 && (
                            <div className="w-px h-4 bg-border ml-4" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">{t('key_metrics', 'Key Metrics')}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedWorkflow.metrics.map((metric, index) => (
                        <div key={index} className="p-3 border rounded">
                          <BarChart3 className="h-4 w-4 text-muted-foreground mb-1" />
                          <p className="text-sm font-medium">{metric}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedWorkflow.performance && (
                    <div>
                      <h3 className="font-semibold mb-3">{t('performance', 'Performance')}</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{t('conversion_rate', 'Conversion Rate')}</span>
                            <span>{selectedWorkflow.performance.conversionRate}%</span>
                          </div>
                          <Progress value={selectedWorkflow.performance.conversionRate} />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{t('open_rate', 'Open Rate')}</span>
                            <span>{selectedWorkflow.performance.openRate}%</span>
                          </div>
                          <Progress value={selectedWorkflow.performance.openRate} />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{t('click_rate', 'Click Rate')}</span>
                            <span>{selectedWorkflow.performance.clickRate}%</span>
                          </div>
                          <Progress value={selectedWorkflow.performance.clickRate} />
                        </div>
                        <div className="pt-2 text-sm">
                          <span className="text-muted-foreground">{t('active_users', 'Active Users')}: </span>
                          <span className="font-medium">{selectedWorkflow.performance.activeUsers.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  {t('close', 'Close')}
                </Button>
                <Button onClick={() => handleSetupWorkflow(selectedWorkflow)}>
                  <Settings className="h-4 w-4 mr-2" />
                  {t('setup_workflow', 'Setup Workflow')}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('setup_workflow', 'Setup Workflow')}: {selectedWorkflow?.name}</DialogTitle>
            <DialogDescription>
              {t('configure_workflow_settings', 'Configure the settings for your automation workflow')}
            </DialogDescription>
          </DialogHeader>

          {selectedWorkflow && (
            <div className="space-y-6">
              {selectedWorkflow.type === 'welcome_series' && (
                <>
                  <div>
                    <Label>{t('welcome_offer', 'Welcome Offer')}</Label>
                    <Input
                      value={setupConfig.welcomeOffer || ''}
                      onChange={(e) => setSetupConfig(prev => ({ ...prev, welcomeOffer: e.target.value }))}
                      placeholder="20% off first service"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t('first_email_delay', 'First Email Delay')}</Label>
                      <select
                        value={setupConfig.firstDelay || ''}
                        onChange={(e) => setSetupConfig(prev => ({ ...prev, firstDelay: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="immediately">Immediately</option>
                        <option value="1 hour">1 Hour</option>
                        <option value="1 day">1 Day</option>
                        <option value="3 days">3 Days</option>
                      </select>
                    </div>
                    <div>
                      <Label>{t('follow_up_delay', 'Follow-up Delay')}</Label>
                      <select
                        value={setupConfig.secondDelay || ''}
                        onChange={(e) => setSetupConfig(prev => ({ ...prev, secondDelay: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="1 day">1 Day</option>
                        <option value="3 days">3 Days</option>
                        <option value="5 days">5 Days</option>
                        <option value="1 week">1 Week</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {selectedWorkflow.type === 'aftercare_reminders' && (
                <>
                  <div>
                    <Label>{t('check_in_timing', 'Check-in Timing')}</Label>
                    <select
                      value={setupConfig.checkInDelay || ''}
                      onChange={(e) => setSetupConfig(prev => ({ ...prev, checkInDelay: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="2 hours">2 Hours</option>
                      <option value="6 hours">6 Hours</option>
                      <option value="12 hours">12 Hours</option>
                      <option value="24 hours">24 Hours</option>
                      <option value="48 hours">48 Hours</option>
                    </select>
                  </div>
                  <div>
                    <Label>{t('review_request_timing', 'Review Request Timing')}</Label>
                    <select
                      value={setupConfig.reviewDelay || ''}
                      onChange={(e) => setSetupConfig(prev => ({ ...prev, reviewDelay: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="1 day">1 Day</option>
                      <option value="3 days">3 Days</option>
                      <option value="5 days">5 Days</option>
                      <option value="1 week">1 Week</option>
                    </select>
                  </div>
                </>
              )}

              {selectedWorkflow.type === 'review_requests' && (
                <>
                  <div>
                    <Label>{t('days_after_service', 'Days After Service')}</Label>
                    <Input
                      type="number"
                      value={setupConfig.delayDays || ''}
                      onChange={(e) => setSetupConfig(prev => ({ ...prev, delayDays: parseInt(e.target.value) }))}
                      placeholder="3"
                    />
                  </div>
                  <div>
                    <Label>{t('reminder_days', 'Reminder Days')}</Label>
                    <Input
                      type="number"
                      value={setupConfig.reminderDays || ''}
                      onChange={(e) => setSetupConfig(prev => ({ ...prev, reminderDays: parseInt(e.target.value) }))}
                      placeholder="7"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowSetupDialog(false)}>
                  {t('cancel', 'Cancel')}
                </Button>
                <Button onClick={handleSaveSetup}>
                  {t('activate_workflow', 'Activate Workflow')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}