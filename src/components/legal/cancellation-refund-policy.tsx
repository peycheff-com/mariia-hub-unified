import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Clock,
  Calendar,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Percent,
  Timer,
  RefreshCw,
  Sparkles,
  Dumbbell,
  Users,
  Mail,
  Phone,
  MessageCircle,
  FileText
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface RefundPolicy {
  serviceType: 'beauty' | 'fitness' | 'general';
  timeFrame: string;
  refundPercentage: number;
  conditions: string[];
  processingTime: string;
}

interface CancellationRule {
  id: string;
  serviceType: 'beauty' | 'fitness' | 'general';
  noticePeriod: string;
  refundAmount: string;
  description: string;
  exceptions: string[];
}

export function CancellationRefundPolicy() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('cancellation');
  const [refundRequest, setRefundRequest] = useState({
    bookingId: '',
    reason: '',
    email: '',
    phone: '',
  });

  const cancellationRules: CancellationRule[] = [
    {
      id: '1',
      serviceType: 'beauty',
      noticePeriod: '48+ hours',
      refundAmount: '100%',
      description: t('cancellation.beauty_48h', 'Full refund for beauty services cancelled 48+ hours in advance'),
      exceptions: [
        t('cancellation.deposit_exception', 'Non-refundable deposits may apply for premium services'),
        t('cancellation.materials_exception', 'Custom materials fees may be deducted')
      ]
    },
    {
      id: '2',
      serviceType: 'beauty',
      noticePeriod: '24-48 hours',
      refundAmount: '50%',
      description: t('cancellation.beauty_24h', '50% refund for beauty services cancelled 24-48 hours in advance'),
      exceptions: [
        t('cancellation.admin_fee', '10 PLN administration fee applies'),
        t('cancellation.materials_deducted', 'Material costs may be deducted')
      ]
    },
    {
      id: '3',
      serviceType: 'beauty',
      noticePeriod: 'less than 24 hours',
      refundAmount: '0%',
      description: t('cancellation.beauty_less_24h', 'No refund for beauty services cancelled less than 24 hours in advance'),
      exceptions: [
        t('cancellation.medical_exception', 'Medical emergencies with documentation'),
        t('cancellation.extreme_weather', 'Extreme weather conditions')
      ]
    },
    {
      id: '4',
      serviceType: 'fitness',
      noticePeriod: '24+ hours',
      refundAmount: '100%',
      description: t('cancellation.fitness_24h', 'Full refund for fitness sessions cancelled 24+ hours in advance'),
      exceptions: [
        t('cancellation.group_class', 'Group classes may have different policies'),
        t('cancellation.packages', 'Package sessions may have different rules')
      ]
    },
    {
      id: '5',
      serviceType: 'fitness',
      noticePeriod: '12-24 hours',
      refundAmount: '50%',
      description: t('cancellation.fitness_12h', '50% refund for fitness sessions cancelled 12-24 hours in advance'),
      exceptions: [
        t('cancellation.credit_note', 'May be offered as credit note instead of refund'),
        t('cancellation.reschedule', 'Free reschedule option available')
      ]
    },
    {
      id: '6',
      serviceType: 'fitness',
      noticePeriod: 'less than 12 hours',
      refundAmount: '0%',
      description: t('cancellation.fitness_less_12h', 'No refund for fitness sessions cancelled less than 12 hours in advance'),
      exceptions: [
        t('cancellation.injury_exception', 'Medical injuries with documentation'),
        t('cancellation.emergency', 'Personal emergencies reviewed case by case')
      ]
    },
  ];

  const refundPolicies: RefundPolicy[] = [
    {
      serviceType: 'beauty',
      timeFrame: '48+ hours',
      refundPercentage: 100,
      conditions: [
        t('refund.condition1', 'Original payment method will be used for refund'),
        t('refund.condition2', 'Processing time: 5-7 business days'),
        t('refund.condition3', 'No administration fee applies'),
      ],
      processingTime: '5-7 business days'
    },
    {
      serviceType: 'beauty',
      timeFrame: '24-48 hours',
      refundPercentage: 50,
      conditions: [
        t('refund.condition4', '10 PLN administration fee applies'),
        t('refund.condition5', 'Material costs may be deducted'),
        t('refund.condition6', 'Processing time: 7-10 business days'),
      ],
      processingTime: '7-10 business days'
    },
    {
      serviceType: 'fitness',
      timeFrame: '24+ hours',
      refundPercentage: 100,
      conditions: [
        t('refund.condition7', 'Full refund to original payment method'),
        t('refund.condition8', 'Processing time: 3-5 business days'),
        t('refund.condition9', 'Option for credit note instead of refund'),
      ],
      processingTime: '3-5 business days'
    },
  ];

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'beauty': return <Sparkles className="w-4 h-4" />;
      case 'fitness': return <Dumbbell className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getRefundColor = (percentage: number) => {
    if (percentage === 100) return 'bg-green-100 text-green-800';
    if (percentage === 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const handleRefundRequest = () => {
    // In a real implementation, this would submit to backend
    console.log('Refund request submitted:', refundRequest);
    alert(t('refund.request_submitted', 'Refund request submitted successfully. We will contact you within 24 hours.'));
    setRefundRequest({ bookingId: '', reason: '', email: '', phone: '' });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">
              {t('cancellation.title', 'Cancellation & Refund Policy')}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {t('cancellation.description',
              'Clear and fair cancellation and refund policies for all beauty and fitness services. ' +
              'Designed to protect both clients and service providers while ensuring transparency.')}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="cancellation">{t('cancellation.cancellation_policy', 'Cancellation')}</TabsTrigger>
            <TabsTrigger value="refund">{t('cancellation.refund_policy', 'Refunds')}</TabsTrigger>
            <TabsTrigger value="request">{t('cancellation.request_refund', 'Request Refund')}</TabsTrigger>
            <TabsTrigger value="exceptions">{t('cancellation.exceptions', 'Exceptions')}</TabsTrigger>
          </TabsList>

          <TabsContent value="cancellation" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-pink-500" />
                    {t('cancellation.beauty_services', 'Beauty Services')}
                  </CardTitle>
                  <CardDescription>
                    {t('cancellation.beauty_description', 'Cancellation policies for beauty treatments and procedures')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cancellationRules.filter(rule => rule.serviceType === 'beauty').map((rule) => (
                    <div key={rule.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{rule.noticePeriod}</span>
                        </div>
                        <Badge className={getRefundColor(parseInt(rule.refundAmount))}>
                          {rule.refundAmount} {t('cancellation.refund', 'refund')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                      {rule.exceptions.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <strong>{t('cancellation.exceptions', 'Exceptions')}:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {rule.exceptions.map((exception, index) => (
                              <li key={index}>{exception}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-blue-500" />
                    {t('cancellation.fitness_services', 'Fitness Services')}
                  </CardTitle>
                  <CardDescription>
                    {t('cancellation.fitness_description', 'Cancellation policies for fitness classes and personal training')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cancellationRules.filter(rule => rule.serviceType === 'fitness').map((rule) => (
                    <div key={rule.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{rule.noticePeriod}</span>
                        </div>
                        <Badge className={getRefundColor(parseInt(rule.refundAmount))}>
                          {rule.refundAmount} {t('cancellation.refund', 'refund')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                      {rule.exceptions.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <strong>{t('cancellation.exceptions', 'Exceptions')}:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {rule.exceptions.map((exception, index) => (
                              <li key={index}>{exception}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {t('cancellation.timezone_note',
                  'All cancellation times are based on Warsaw, Poland timezone (CET/CEST). ' +
                  'Cancellations must be made through the online platform or by calling our customer service.')}
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="refund" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {refundPolicies.map((policy, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getServiceIcon(policy.serviceType)}
                        <CardTitle className="text-lg">
                          {t(`cancellation.service_type.${policy.serviceType}`, policy.serviceType)}
                        </CardTitle>
                      </div>
                      <Badge className={getRefundColor(policy.refundPercentage)}>
                        {policy.refundPercentage}%
                      </Badge>
                    </div>
                    <CardDescription>
                      {t('cancellation.notice_period', 'Notice period')}: {policy.timeFrame}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Timer className="w-4 h-4 text-muted-foreground" />
                        <span>{t('cancellation.processing_time', 'Processing')}: {policy.processingTime}</span>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">{t('cancellation.conditions', 'Conditions')}:</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {policy.conditions.map((condition, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                              {condition}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t('cancellation.refund_process', 'Refund Process')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="font-bold text-primary">1</span>
                    </div>
                    <h4 className="font-medium text-sm">{t('refund.step1', 'Request Submitted')}</h4>
                    <p className="text-xs text-muted-foreground">
                      {t('refund.step1_desc', 'Submit cancellation through platform or contact support')}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="font-bold text-primary">2</span>
                    </div>
                    <h4 className="font-medium text-sm">{t('refund.step2', 'Review Process')}</h4>
                    <p className="text-xs text-muted-foreground">
                      {t('refund.step2_desc', 'Team reviews request within 24 hours')}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="font-bold text-primary">3</span>
                    </div>
                    <h4 className="font-medium text-sm">{t('refund.step3', 'Approval')}</h4>
                    <p className="text-xs text-muted-foreground">
                      {t('refund.step3_desc', 'Refund approved and processed according to policy')}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="font-bold text-primary">4</span>
                    </div>
                    <h4 className="font-medium text-sm">{t('refund.step4', 'Refund Issued')}</h4>
                    <p className="text-xs text-muted-foreground">
                      {t('refund.step4_desc', 'Funds returned to original payment method')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="request" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('refund.request_title', 'Request a Refund')}</CardTitle>
                <CardDescription>
                  {t('refund.request_description', 'Submit your refund request and we will process it according to our policies')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="booking-id">{t('refund.booking_id', 'Booking ID')}</Label>
                    <Input
                      id="booking-id"
                      value={refundRequest.bookingId}
                      onChange={(e) => setRefundRequest(prev => ({ ...prev, bookingId: e.target.value }))}
                      placeholder={t('refund.booking_id_placeholder', 'Enter your booking ID')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('refund.email', 'Email Address')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={refundRequest.email}
                      onChange={(e) => setRefundRequest(prev => ({ ...prev, email: e.target.value }))}
                      placeholder={t('refund.email_placeholder', 'your@email.com')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('refund.phone', 'Phone Number')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={refundRequest.phone}
                    onChange={(e) => setRefundRequest(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+48 123 456 789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">{t('refund.reason', 'Reason for Cancellation')}</Label>
                  <Textarea
                    id="reason"
                    value={refundRequest.reason}
                    onChange={(e) => setRefundRequest(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder={t('refund.reason_placeholder', 'Please explain why you need to cancel...')}
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleRefundRequest} disabled={!refundRequest.bookingId || !refundRequest.email}>
                    {t('refund.submit_request', 'Submit Request')}
                  </Button>
                  <Button variant="outline">
                    {t('refund.contact_support', 'Contact Support')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  {t('refund.contact_options', 'Contact Options')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-medium">{t('refund.phone_support', 'Phone Support')}</div>
                      <div className="text-sm text-muted-foreground">+48 123 456 789</div>
                      <div className="text-xs text-muted-foreground">{t('refund.phone_hours', 'Mon-Fri 9AM-6PM')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-medium">{t('refund.email_support', 'Email Support')}</div>
                      <div className="text-sm text-muted-foreground">support@mariaborysevych.com</div>
                      <div className="text-xs text-muted-foreground">{t('refund.email_response', 'Response within 24 hours')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-medium">{t('refund.live_chat', 'Live Chat')}</div>
                      <div className="text-sm text-muted-foreground">{t('refund.chat_available', 'Available on website')}</div>
                      <div className="text-xs text-muted-foreground">{t('refund.chat_hours', 'Mon-Fri 10AM-7PM')}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exceptions" className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">
              {t('cancellation.policy_exceptions', 'Policy Exceptions')}
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    {t('cancellation.valid_exceptions', 'Valid Exceptions')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { title: t('exception.medical_emergency', 'Medical Emergency'), desc: t('exception.medical_desc', 'With doctor\'s note or medical documentation') },
                    { title: t('exception.family_emergency', 'Family Emergency'), desc: t('exception.family_desc', 'Death or serious illness of immediate family member') },
                    { title: t('exception.extreme_weather', 'Extreme Weather'), desc: t('exception.weather_desc', 'Severe weather warnings affecting travel') },
                    { title: t('exception.provider_cancellation', 'Provider Cancellation'), desc: t('exception.provider_desc', 'If service provider cancels the appointment') },
                    { title: t('exception.covid_restrictions', 'COVID-19 Restrictions'), desc: t('exception.covid_desc', 'Government-mandated restrictions or quarantine') },
                    { title: t('exception.power_outage', 'Power/Utility Outage'), desc: t('exception.power_desc', 'Extended power outages affecting service delivery') },
                  ].map((exception, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-sm">{exception.title}</h4>
                        <p className="text-xs text-muted-foreground">{exception.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    {t('cancellation.non_valid_exceptions', 'Non-Valid Exceptions')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { title: t('exception.change_mind', 'Change of Mind'), desc: t('exception.mind_desc', 'General change of mind without specific reason') },
                    { title: t('exception.double_booking', 'Double Booking'), desc: t('exception.double_desc', 'Booking with another provider at same time') },
                    { title: t('exception.work_commitments', 'Work Commitments'), desc: t('exception.work_desc', 'Regular work schedule or meetings') },
                    { title: t('exception.social_plans', 'Social Plans'), desc: t('exception.social_desc', 'Social events or gatherings') },
                    { title: t('exception.transport_issues', 'Minor Transport Issues'), desc: t('exception.transport_desc', 'Traffic delays or public transport disruptions') },
                    { title: t('exception.forgetfulness', 'Forgot Appointment'), desc: t('exception.forget_desc', 'Simply forgetting about the appointment') },
                  ].map((exception, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-sm">{exception.title}</h4>
                        <p className="text-xs text-muted-foreground">{exception.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {t('cancellation.documentation_required',
                  'All exceptions require appropriate documentation (medical certificates, official weather warnings, etc.). ' +
                  'Decisions on exceptions are made at the discretion of management and are final.')}
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>{t('cancellation.special_circumstances', 'Special Circumstances')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">{t('cancellation.pregnancy', 'Pregnancy')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('cancellation.pregnancy_desc',
                        'Many beauty treatments are not recommended during pregnancy. ' +
                        'Full refund provided with medical documentation.')}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">{t('cancellation.allergic_reactions', 'Allergic Reactions')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('cancellation.allergic_desc',
                        'If allergic reaction occurs during patch test or treatment, ' +
                        'full refund for remaining sessions.')}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">{t('cancellation.injury', 'Injury or Illness')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('cancellation.injury_desc',
                        'Fitness sessions cancelled due to injury may be converted ' +
                        'to recovery sessions when medically appropriate.')}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">{t('cancellation.moving', 'Relocation')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('cancellation.moving_desc',
                        'Customers moving out of area may receive credit for remaining ' +
                        'sessions or package value.')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}