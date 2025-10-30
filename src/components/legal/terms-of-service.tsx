import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Calendar,
  User,
  CreditCard,
  Clock,
  AlertTriangle,
  CheckCircle,
  Users,
  Shield,
  Heart,
  Dumbbell,
  Sparkles
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ServiceTerms {
  id: string;
  type: 'beauty' | 'fitness' | 'general';
  title: string;
  content: string;
  lastUpdated: string;
  version: string;
}

export function TermsOfService() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('general');

  const serviceTerms: ServiceTerms[] = [
    {
      id: 'general',
      type: 'general',
      title: t('terms.general_title', 'General Terms of Service'),
      content: `# ${t('terms.general_title', 'General Terms of Service')}

## ${t('terms.agreement', 'Service Agreement')}

${t('terms.agreement_text',
  'By accessing and using Mariia Hub services, you accept and agree to be bound by the terms and provision of this agreement. ' +
  'If you do not agree to abide by the above, please do not use this service.')}

## ${t('terms.description', 'Service Description')}

${t('terms.service_description',
  'Mariia Hub is a premium beauty and fitness booking platform that connects clients with professional service providers in Warsaw, Poland. ' +
  'We offer a curated selection of beauty treatments and fitness programs through our online booking system.')}

## ${t('terms.eligibility', 'Eligibility')}

${t('terms.eligibility_text',
  'You must be at least 18 years old to use our services. By using this service, you represent and warrant that you are at least 18 years of age ' +
  'and have the legal capacity to enter into this agreement.')}

## ${t('terms.user_account', 'User Account')}

${t('terms.user_account_text',
  'To access certain features of our service, you must register for an account. You agree to provide accurate, current, and complete information ' +
  'during registration and to update such information to keep it accurate, current, and complete.')}

## ${t('terms.Booking_Bookings', 'Bookings and Appointments')}

### ${t('terms.booking_process', 'Booking Process')}
- ${t('terms.booking_online', 'Bookings can be made online through our platform')}
- ${t('terms.booking_confirmation', 'Confirmation is sent via email and SMS')}
- ${t('terms.booking_availability', 'Availability is subject to service provider schedules')}

### ${t('terms.cancellation_policy', 'Cancellation Policy')}
- ${t('terms.cancellation_24h', 'Cancellations made 24+ hours in advance: Full refund')}
- ${t('terms.cancellation_12h', 'Cancellations made 12-24 hours in advance: 50% refund')}
- ${t('terms.cancellation_less_12h', 'Cancellations made less than 12 hours in advance: No refund')}

## ${t('terms.payments', 'Payments')}

${t('terms.payment_text',
  'All payments are processed securely through Stripe. We accept major credit cards, bank transfers, and other payment methods as specified. ' +
  'Prices are displayed in PLN with EUR and USD equivalents for reference.')}

## ${t('terms.liability', 'Limitation of Liability')}

${t('terms.liability_text',
  'Mariia Hub acts as an intermediary between service providers and clients. While we vet our service providers, we are not responsible for ' +
  'the quality of services provided. Any claims regarding service quality should be addressed directly with the service provider.')}

## ${t('terms.refund_policy', 'Refund Policy')}

${t('terms.refund_text',
  'Refunds are processed according to our cancellation policy. Refunds for service quality issues must be submitted within 48 hours of ' +
  'the service appointment and will be reviewed on a case-by-case basis.')}

## ${t('terms.termination', 'Termination')}

${t('terms.termination_text',
  'We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, ' +
  'for any reason whatsoever and without limitation.')}

## ${t('terms.governing_law', 'Governing Law')}

${t('terms.governing_law_text',
  'These Terms of Service and any separate agreements whereby we provide you services shall be governed by and construed in accordance ' +
  'with the laws of Poland, without regard to its conflict of law provisions.')}

## ${t('terms.contact', 'Contact Information')}

**Mariia Hub Sp. z o.o.**
${t('terms.address', 'ul. Jana Pawła II 43/15, 00-001 Warszawa, Polska')}
${t('terms.email', 'Email')}: legal@mariaborysevych.com
${t('terms.phone', 'Phone')}: +48 123 456 789
${t('terms.nip', 'NIP')}: 1234567890`,
      lastUpdated: '2024-01-15',
      version: '3.1',
    },
    {
      id: 'beauty',
      type: 'beauty',
      title: t('terms.beauty_title', 'Beauty Services Terms'),
      content: `# ${t('terms.beauty_title', 'Beauty Services Terms')}

## ${t('terms.beauty_scope', 'Scope of Beauty Services')}

${t('terms.beauty_services_offered',
  'Our beauty services include but are not limited to: lip enhancements, eyebrow treatments, eyelash extensions, facial treatments, ' +
  'and other cosmetic procedures performed by licensed professionals.')}

## ${t('terms.beauty_health_safety', 'Health and Safety Requirements')}

### ${t('terms.beauty_contraindications', 'Contraindications')}
${t('terms.beauty_contraindications_text',
  'Clients must disclose any medical conditions, allergies, or medications that may affect treatment. ' +
  'These include but are not limited to: pregnancy, skin conditions, autoimmune disorders, blood thinners, and recent cosmetic procedures.')}

### ${t('terms.beauty_aftercare', 'Aftercare Instructions')}
${t('terms.beauty_aftercare_text',
  'Detailed aftercare instructions will be provided for each treatment. Following these instructions is essential for optimal results ' +
  'and to prevent complications. Failure to follow aftercare instructions may affect treatment longevity.')}

## ${t('terms.beauty_age_restrictions', 'Age Restrictions')}

${t('terms.beauty_age_text',
  'Certain beauty services have age restrictions. Clients under 18 must provide parental consent for most treatments. ' +
  'Some services may require clients to be 21 or older.')}

## ${t('terms.beauty_allergies', 'Allergy and Sensitivity Testing')}

${t('terms.beauty_allergies_text',
  'Patch testing may be required for certain treatments, especially those involving pigments or chemicals. ' +
  'This should be done at least 48 hours before the scheduled treatment.')}

## ${t('terms.beauty_results', 'Treatment Results')}

${t('terms.beauty_results_text',
  'Individual results may vary. While our professionals strive to achieve the best possible results, we cannot guarantee specific outcomes. ' +
  'Results depend on various factors including skin type, lifestyle, and adherence to aftercare instructions.')}

## ${t('terms.beauty_photos', 'Photography and Marketing')}

${t('terms.beauty_photos_text',
  'Before and after photos may be taken for treatment documentation. These will only be used for marketing purposes with explicit consent. ' +
  'All photos are taken in compliance with GDPR and privacy regulations.')}

## ${t('terms.beauty_touch_ups', 'Touch-up and Maintenance')}

${t('terms.beauty_touch_ups_text',
  'Some treatments may require touch-up sessions for optimal results. Touch-up appointments and pricing will be discussed during the initial consultation. ' +
  'Touch-up sessions must be booked within the specified timeframe.')}`,
      lastUpdated: '2024-01-15',
      version: '2.4',
    },
    {
      id: 'fitness',
      type: 'fitness',
      title: t('terms.fitness_title', 'Fitness Programs Terms'),
      content: `# ${t('terms.fitness_title', 'Fitness Programs Terms')}

## ${t('terms.fitness_scope', 'Scope of Fitness Services')}

${t('terms.fitness_programs_offered',
  'Our fitness programs include personal training, group classes, specialized workout programs, and fitness assessments ' +
  'conducted by certified fitness professionals.')}

## ${t('terms.fitness_health_assessment', 'Health Assessment and Screening')}

### ${t('terms.fitness_medical_screening', 'Medical Screening')}
${t('terms.fitness_medical_screening_text',
  'All participants must complete a health screening questionnaire before starting any fitness program. ' +
  'Participants with pre-existing medical conditions may require medical clearance from a physician.')}

### ${t('terms.fitness_physical_limitations', 'Physical Limitations')}
${t('terms.fitness_physical_limitations_text',
  'Participants must inform instructors of any physical limitations, injuries, or health conditions that may affect their ability ' +
  'to safely participate in fitness activities.')}

## ${t('terms.fitness_safety', 'Safety Guidelines')}

### ${t('terms.fitness_proper_technique', 'Proper Technique')}
${t('terms.fitness_proper_technique_text',
  'All exercises must be performed with proper technique as demonstrated by instructors. Participants should stop immediately if they experience ' +
  'pain, dizziness, or unusual discomfort.')}

### ${t('terms.fitness_equipment', 'Equipment Use')}
${t('terms.fitness_equipment_text',
  'Participants must use all fitness equipment according to instructions and safety guidelines. Equipment should be inspected before use, ' +
  'and any issues should be reported immediately.')}

## ${t('terms.fitness_medical_emergency', 'Medical Emergency Procedures')}

${t('terms.fitness_medical_emergency_text',
  'In case of medical emergency, staff are trained in first aid and CPR. Emergency services will be contacted immediately. ' +
  'Participants with known medical conditions should carry necessary medications and inform staff of their location.')}

## ${t('terms.fitness_participant_responsibility', 'Participant Responsibility')}

${t('terms.fitness_participant_responsibility_text',
  'Participants are responsible for: maintaining appropriate hydration, wearing suitable exercise attire, arriving on time, ' +
  'and following all safety instructions provided by instructors.')}

## ${t('terms.fitness_nutrition', 'Nutrition and Lifestyle Advice')}

${t('terms.fitness_nutrition_text',
  'Nutrition advice provided is general guidance and not medical nutrition therapy. Participants with specific dietary requirements ' +
  'should consult with a registered dietitian or physician.')}

## ${t('terms.fitness_progress_tracking', 'Progress Tracking')}

${t('terms.fitness_progress_tracking_text',
  'Progress assessments and measurements may be conducted periodically to track fitness improvements. ' +
  'All personal data collected is handled in compliance with privacy regulations.')}

## ${t('terms.fitness_class_policies', 'Class and Session Policies')}

### ${t('terms.fitness_class_cancellation', 'Class Cancellation')}
${t('terms.fitness_class_cancellation_text',
  'Classes may be cancelled due to insufficient enrollment, instructor unavailability, or facility issues. ' +
  'Participants will be notified in advance and offered rescheduling or refund options.')}

### ${t('terms.fitness_attendance', 'Attendance Policy')}
${t('terms.fitness_attendance_text',
  'Participants are expected to arrive on time. Late arrivals may not be admitted to ensure safety and class continuity. ' +
  'No-shows and late cancellations are subject to the general cancellation policy.')}`,
      lastUpdated: '2024-01-15',
      version: '2.2',
    },
  ];

  const currentTerms = serviceTerms.find(terms => terms.id === activeTab) || serviceTerms[0];

  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.startsWith('# ')) {
        return <h2 key={index} className="text-2xl font-bold mt-6 mb-4">{line.substring(2)}</h2>;
      } else if (line.startsWith('## ')) {
        return <h3 key={index} className="text-xl font-semibold mt-4 mb-3">{line.substring(3)}</h3>;
      } else if (line.startsWith('### ')) {
        return <h4 key={index} className="text-lg font-medium mt-3 mb-2">{line.substring(4)}</h4>;
      } else if (line.startsWith('- ')) {
        return <li key={index} className="ml-6 text-muted-foreground">{line.substring(2)}</li>;
      } else if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={index} className="font-semibold mt-3 mb-2">{line.replace(/\*\*/g, '')}</p>;
      } else if (line.trim() === '') {
        return <br key={index} />;
      } else {
        return <p key={index} className="text-muted-foreground mb-3">{line}</p>;
      }
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">
              {t('terms.title', 'Terms of Service')}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {t('terms.description',
              'Comprehensive terms and conditions for all beauty and fitness services offered through Mariia Hub platform.')}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t('terms.general', 'General')}
            </TabsTrigger>
            <TabsTrigger value="beauty" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {t('terms.beauty', 'Beauty')}
            </TabsTrigger>
            <TabsTrigger value="fitness" className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              {t('terms.fitness', 'Fitness')}
            </TabsTrigger>
          </TabsList>

          {serviceTerms.map((terms) => (
            <TabsContent key={terms.id} value={terms.id} className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">{terms.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {t('terms.version', 'Version')} {terms.version} • {t('terms.last_updated', 'Last updated')}: {terms.lastUpdated}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {terms.type === 'beauty' && <Sparkles className="w-6 h-6 text-pink-500" />}
                      {terms.type === 'fitness' && <Dumbbell className="w-6 h-6 text-blue-500" />}
                      {terms.type === 'general' && <FileText className="w-6 h-6 text-green-500" />}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="prose prose-sm max-w-none">
                      {formatContent(terms.content)}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      {t('terms.consumer_protection', 'Consumer Protection')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      {t('terms.right_to_withdrawal', '14-day withdrawal right for digital services')}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      {t('terms.transparent_pricing', 'Transparent pricing with no hidden fees')}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      {t('terms.quality_assurance', 'Service provider quality assurance')}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Heart className="w-5 h-5 text-primary" />
                      {t('terms.health_safety', 'Health & Safety')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      {t('terms.licensed_professionals', 'Licensed and insured professionals')}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      {t('terms.hygiene_standards', 'Strict hygiene and safety standards')}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      {t('terms.emergency_procedures', 'Emergency procedures in place')}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {t('terms.legal_advice',
                    'This document is a legal agreement between you and Mariia Hub Sp. z o.o. If you have any questions about these terms, ' +
                    'please contact our legal department at legal@mariaborysevych.com before using our services.')}
                </AlertDescription>
              </Alert>

              <div className="flex justify-center gap-4 pt-4">
                <Button variant="outline">
                  {t('terms.print', 'Print Terms')}
                </Button>
                <Button>
                  {t('terms.download_pdf', 'Download PDF')}
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}