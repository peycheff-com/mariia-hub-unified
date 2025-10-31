import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useTranslation } from 'react-i18next'
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  Target,
  Zap,
  Info,
  Check,
  ArrowRight,
  ArrowLeft
} from 'lucide-react'
import { format, addDays } from 'date-fns'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { pricingService, PricingRuleInsert, PricingRuleConditions } from '@/services/pricing.service'
import { servicesService } from '@/services/services.service'
import { useToast } from '@/hooks/use-toast'

const ruleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  service_id: z.string().min(1, 'Service is required'),
  rule_type: z.enum(['seasonal', 'demand', 'group', 'custom', 'time_based', 'event']),
  modifier_type: z.enum(['percentage', 'fixed', 'multiply']),
  modifier_value: z.number(),
  priority: z.number().min(1).max(100),
  is_active: z.boolean().default(true),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
  max_uses: z.number().optional(),
  conditions: z.object({
    time_range: z.object({
      time_start: z.string().optional(),
      time_end: z.string().optional()
    }).optional(),
    date_range: z.object({
      start_date: z.string().optional(),
      end_date: z.string().optional()
    }).optional(),
    days_of_week: z.array(z.number()).optional(),
    min_demand_level: z.number().optional(),
    max_demand_level: z.number().optional(),
    min_group_size: z.number().optional(),
    max_group_size: z.number().optional(),
    season: z.enum(['spring', 'summer', 'autumn', 'winter']).optional(),
    holiday_period: z.boolean().optional(),
    event_type: z.enum(['concert', 'festival', 'holiday', 'special_event']).optional(),
    event_proximity: z.number().optional()
  })
})

type RuleFormData = z.infer<typeof ruleSchema>

interface PricingRuleWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule?: PricingRuleInsert | null
  onSuccess?: () => void
}

const RULE_TYPE_DESCRIPTIONS = {
  seasonal: 'Adjust prices based on seasons or specific date ranges',
  demand: 'Change prices based on booking demand and occupancy',
  group: 'Apply discounts or surcharges for group bookings',
  time_based: 'Modify prices based on time of day or day of week',
  event: 'Adjust prices during special events or holidays',
  custom: 'Create custom pricing rules with specific conditions'
}

export function PricingRuleWizard({ open, onOpenChange, rule, onSuccess }: PricingRuleWizardProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [services, setServices] = useState<any[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [previewPrice, setPreviewPrice] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<RuleFormData>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      name: '',
      description: '',
      service_id: '',
      rule_type: 'time_based',
      modifier_type: 'percentage',
      modifier_value: 10,
      priority: 50,
      is_active: true,
      conditions: {}
    }
  })

  useEffect(() => {
    if (open) {
      loadServices()
      if (rule) {
        form.reset(rule)
        setCurrentStep(4) // Go straight to review if editing
      } else {
        form.reset()
        setCurrentStep(0)
      }
    }
  }, [open, rule])

  const loadServices = async () => {
    try {
      const data = await servicesService.getServices()
      setServices(data)
    } catch (error) {
      console.error('Error loading services:', error)
    }
  }

  const watchServiceId = form.watch('service_id')
  const watchRuleType = form.watch('rule_type')
  const watchModifierType = form.watch('modifier_type')
  const watchModifierValue = form.watch('modifier_value')

  useEffect(() => {
    if (watchServiceId && watchModifierValue !== undefined) {
      simulatePriceChange()
    }
  }, [watchServiceId, watchRuleType, watchModifierType, watchModifierValue])

  const simulatePriceChange = async () => {
    if (!watchServiceId) return

    try {
      const service = services.find(s => s.id === watchServiceId)
      if (!service) return

      let simulatedPrice = service.price

      if (watchModifierType === 'percentage') {
        simulatedPrice = service.price * (1 + watchModifierValue / 100)
      } else if (watchModifierType === 'fixed') {
        simulatedPrice = service.price + watchModifierValue
      } else if (watchModifierType === 'multiply') {
        simulatedPrice = service.price * watchModifierValue
      }

      setPreviewPrice(Math.round(simulatedPrice * 100) / 100)
    } catch (error) {
      console.error('Error simulating price:', error)
    }
  }

  const steps = [
    {
      id: 'basic',
      title: t('pricing.basicInfo'),
      icon: Info,
      description: t('pricing.basicInfoDescription')
    },
    {
      id: 'conditions',
      title: t('pricing.conditions'),
      icon: Target,
      description: t('pricing.conditionsDescription')
    },
    {
      id: 'modifier',
      title: t('pricing.modifier'),
      icon: Zap,
      description: t('pricing.modifierDescription')
    },
    {
      id: 'schedule',
      title: t('pricing.schedule'),
      icon: Calendar,
      description: t('pricing.scheduleDescription')
    },
    {
      id: 'review',
      title: t('pricing.review'),
      icon: Check,
      description: t('pricing.reviewDescription')
    }
  ]

  const onSubmit = async (data: RuleFormData) => {
    setIsLoading(true)
    try {
      if (rule?.id) {
        await pricingService.updatePricingRule(rule.id, data)
        toast({
          title: t('pricing.ruleUpdated'),
          description: t('pricing.ruleUpdatedDescription')
        })
      } else {
        await pricingService.createPricingRule(data)
        toast({
          title: t('pricing.ruleCreated'),
          description: t('pricing.ruleCreatedDescription')
        })
      }

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving rule:', error)
      toast({
        title: t('pricing.error'),
        description: t('pricing.saveError'),
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pricing.ruleName')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('pricing.enterRuleName')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pricing.description')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t('pricing.enterDescription')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="service_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pricing.service')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('pricing.selectService')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - ${service.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rule_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pricing.ruleType')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('pricing.selectRuleType')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(RULE_TYPE_DESCRIPTIONS).map(([type, description]) => (
                        <SelectItem key={type} value={type}>
                          <div>
                            <div className="font-medium">{t(`pricing.ruleTypes.${type}`)}</div>
                            <div className="text-sm text-muted-foreground">{description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {RULE_TYPE_DESCRIPTIONS[watchRuleType as keyof typeof RULE_TYPE_DESCRIPTIONS]}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )

      case 1:
        return (
          <div className="space-y-6">
            {watchRuleType === 'time_based' && (
              <>
                <FormField
                  control={form.control}
                  name="conditions.days_of_week"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('pricing.daysOfWeek')}</FormLabel>
                      <div className="grid grid-cols-7 gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                          <label key={day} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={field.value?.includes(index) || false}
                              onChange={(e) => {
                                const values = field.value || []
                                if (e.target.checked) {
                                  field.onChange([...values, index])
                                } else {
                                  field.onChange(values.filter((v: number) => v !== index))
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{day}</span>
                          </label>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="conditions.time_range.time_start"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('pricing.startTime')}</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="conditions.time_range.time_end"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('pricing.endTime')}</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            {watchRuleType === 'demand' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="conditions.min_demand_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('pricing.minDemandLevel')}</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="10" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormDescription>
                        {t('pricing.demandScale')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="conditions.max_demand_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('pricing.maxDemandLevel')}</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="10" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {watchRuleType === 'group' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="conditions.min_group_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('pricing.minGroupSize')}</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="conditions.max_group_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('pricing.maxGroupSize')}</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {watchRuleType === 'seasonal' && (
              <FormField
                control={form.control}
                name="conditions.season"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pricing.season')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('pricing.selectSeason')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="spring">{t('pricing.spring')}</SelectItem>
                        <SelectItem value="summer">{t('pricing.summer')}</SelectItem>
                        <SelectItem value="autumn">{t('pricing.autumn')}</SelectItem>
                        <SelectItem value="winter">{t('pricing.winter')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="modifier_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pricing.modifierType')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('pricing.selectModifierType')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="percentage">
                        {t('pricing.percentage')} (%)
                      </SelectItem>
                      <SelectItem value="fixed">
                        {t('pricing.fixed')} ($)
                      </SelectItem>
                      <SelectItem value="multiply">
                        {t('pricing.multiply')} (x)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {watchModifierType === 'percentage' && t('pricing.percentageDescription')}
                    {watchModifierType === 'fixed' && t('pricing.fixedDescription')}
                    {watchModifierType === 'multiply' && t('pricing.multiplyDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="modifier_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pricing.modifierValue')}</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        min={watchModifierType === 'multiply' ? 0.5 : -100}
                        max={watchModifierType === 'multiply' ? 3 : 100}
                        step={watchModifierType === 'multiply' ? 0.1 : 1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="w-full"
                      />
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pricing.priority')}</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        min={1}
                        max={100}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{t('pricing.highPriority')}</span>
                        <span>{field.value}</span>
                        <span>{t('pricing.lowPriority')}</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    {t('pricing.priorityDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {previewPrice !== null && (
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  {t('pricing.pricePreview')}: ${previewPrice}
                  {watchServiceId && (
                    <span className="ml-2">
                      ({watchModifierValue > 0 ? '+' : ''}{watchModifierValue}{watchModifierType === 'percentage' ? '%' : watchModifierType === 'multiply' ? 'x' : '$'})
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valid_from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pricing.validFrom')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valid_until"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pricing.validUntil')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="max_uses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pricing.maxUses')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder={t('pricing.unlimited')}
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('pricing.maxUsesDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{t('pricing.activateRule')}</FormLabel>
                    <FormDescription>
                      {t('pricing.activateRuleDescription')}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('pricing.ruleSummary')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('pricing.name')}</p>
                    <p className="font-medium">{form.getValues('name')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('pricing.type')}</p>
                    <Badge variant="outline">{form.getValues('rule_type')}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('pricing.modifier')}</p>
                    <p className="font-medium">
                      {form.getValues('modifier_type')} {form.getValues('modifier_value')}
                      {form.getValues('modifier_type') === 'percentage' ? '%' : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('pricing.priority')}</p>
                    <p className="font-medium">{form.getValues('priority')}</p>
                  </div>
                </div>
                {form.getValues('description') && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('pricing.description')}</p>
                    <p className="text-sm">{form.getValues('description')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('pricing.expectedImpact')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  {previewPrice !== null && (
                    <div className="text-3xl font-bold text-[#8B4513]">
                      ${previewPrice}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('pricing.expectedPrice')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {React.createElement(steps[currentStep].icon, { className: "w-5 h-5" })}
            <span>{rule ? t('pricing.editRule') : t('pricing.createRule')}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep
                      ? 'bg-[#8B4513] text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      index < currentStep ? 'bg-[#8B4513]' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h3 className="font-medium">{steps[currentStep].title}</h3>
            <p className="text-sm text-muted-foreground">{steps[currentStep].description}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="min-h-[300px]">
              {renderStepContent()}
            </div>

            <DialogFooter className="mt-6">
              <div className="flex justify-between w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  {t('common.cancel')}
                </Button>
                <div className="space-x-2">
                  {currentStep > 0 && currentStep < steps.length - 1 && (
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      {t('common.previous')}
                    </Button>
                  )}
                  {currentStep < steps.length - 1 && (
                    <Button type="button" onClick={nextStep}>
                      {t('common.next')}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                  {currentStep === steps.length - 1 && (
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? t('common.saving') : rule ? t('common.update') : t('common.create')}
                    </Button>
                  )}
                </div>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}