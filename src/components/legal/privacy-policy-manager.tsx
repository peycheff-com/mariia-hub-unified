import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  Eye,
  Download,
  History,
  Shield,
  Database,
  Globe,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PolicySection {
  id: string;
  title: string;
  content: string;
  lastUpdated: string;
  required: boolean;
}

interface PolicyVersion {
  id: string;
  version: string;
  effectiveDate: string;
  changes: string[];
  createdBy: string;
  approvedBy: string;
  status: 'draft' | 'review' | 'approved' | 'active' | 'archived';
}

interface ConsentRecord {
  id: string;
  policyVersion: string;
  userId?: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  consentDate: string;
  accepted: boolean;
}

export function PrivacyPolicyManager() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('content');
  const [policySections, setPolicySections] = useState<PolicySection[]>([
    {
      id: 'data-collection',
      title: t('privacy.data_collection', 'Data Collection'),
      content: `# ${t('privacy.data_collection', 'Data Collection')}

## ${t('privacy.personal_data', 'Personal Data We Collect')}

### ${t('privacy.contact_info', 'Contact Information')}
- ${t('privacy.name', 'Full name')}
- ${t('privacy.email', 'Email address')}
- ${t('privacy.phone', 'Phone number')}
- ${t('privacy.address', 'Physical address')}

### ${t('privacy.booking_info', 'Booking Information')}
- ${t('privacy.service_preferences', 'Service preferences and history')}
- ${t('privacy.appointment_data', 'Appointment dates and times')}
- ${t('privacy.payment_info', 'Payment information (processed securely)')}

### ${t('privacy.technical_data', 'Technical Data')}
- ${t('privacy.ip_address', 'IP address')}
- ${t('privacy.browser_info', 'Browser and device information')}
- ${t('privacy.usage_data', 'Site usage and interaction data')}`,
      lastUpdated: '2024-01-15',
      required: true,
    },
    {
      id: 'data-usage',
      title: t('privacy.data_usage', 'How We Use Your Data'),
      content: `# ${t('privacy.data_usage', 'How We Use Your Data')}

## ${t('privacy.legal_bases', 'Legal Bases for Processing')}

### ${t('privacy.consent', 'Consent')} (${t('privacy.gdpr_art_6_1_a', 'GDPR Art. 6(1)(a)')})
- ${t('privacy.marketing_consent', 'Marketing communications')}
- ${t('privacy.analytics_consent', 'Analytics and tracking')}

### ${t('privacy.contract', 'Contract')} (${t('privacy.gdpr_art_6_1_b', 'GDPR Art. 6(1)(b)')})
- ${t('privacy.booking_fulfillment', 'Booking service fulfillment')}
- ${t('privacy.customer_support', 'Customer support')}

### ${t('privacy.legal_obligation', 'Legal Obligation')} (${t('privacy.gdpr_art_6_1_c', 'GDPR Art. 6(1)(c)')})
- ${t('privacy.tax_records', 'Tax and accounting records')}
- ${t('privacy.safety_compliance', 'Health and safety compliance')}

### ${t('privacy.legitimate_interest', 'Legitimate Interest')} (${t('privacy.gdpr_art_6_1_f', 'GDPR Art. 6(1)(f)')})
- ${t('privacy.security_monitoring', 'Security monitoring')}
- ${t('privacy.service_improvement', 'Service improvement')}`,
      lastUpdated: '2024-01-15',
      required: true,
    },
    {
      id: 'data-sharing',
      title: t('privacy.data_sharing', 'Data Sharing'),
      content: `# ${t('privacy.data_sharing', 'Data Sharing')}

## ${t('privacy.third_parties', 'Third-Party Service Providers')}

### ${t('privacy.payment_processors', 'Payment Processors')}
- **Stripe**: ${t('privacy.payment_processing', 'Secure payment processing')}
- ${t('privacy.data_locations', 'Data locations: EU/US with Privacy Shield')}

### ${t('privacy.booking_systems', 'Booking Systems')}
- **Booksy**: ${t('privacy.appointment_management', 'Appointment management')}
- ${t('privacy.sync_description', 'Real-time synchronization of booking data')}

### ${t('privacy.analytics', 'Analytics Services')}
- **Google Analytics**: ${t('privacy.website_analytics', 'Website usage analytics')}
- ${t('privacy.anonymized_data', 'Anonymized and aggregated data only')}

## ${t('privacy.data_transfers', 'International Data Transfers')}
- ${t('privacy.eu_compliance', 'All data processing complies with EU GDPR')}
- ${t('privacy.appropriate_safeguards', 'Appropriate safeguards in place for all transfers')}`,
      lastUpdated: '2024-01-15',
      required: true,
    },
    {
      id: 'rights',
      title: t('privacy.your_rights', 'Your Rights'),
      content: `# ${t('privacy.your_rights', 'Your GDPR Rights')}

## ${t('privacy.data_subject_rights', 'Data Subject Rights')}

### ${t('privacy.right_to_access', 'Right to Access')} (${t('privacy.gdpr_art_15', 'GDPR Art. 15')})
- ${t('privacy.access_description', 'Request copy of your personal data')}
- ${t('privacy.access_timeline', 'Response within 30 days')}

### ${t('privacy.right_to_rectification', 'Right to Rectification')} (${t('privacy.gdpr_art_16', 'GDPR Art. 16')})
- ${t('privacy.rectification_description', 'Correct inaccurate personal data')}

### ${t('privacy.right_to_erasure', 'Right to Erasure')} (${t('privacy.gdpr_art_17', 'GDPR Art. 17')})
- ${t('privacy.erasure_description', 'Request deletion of your personal data')}
- ${t('privacy.erasure_exceptions', 'Subject to legal and contractual obligations')}

### ${t('privacy.right_to_portability', 'Right to Portability')} (${t('privacy.gdpr_art_20', 'GDPR Art. 20')})
- ${t('privacy.portability_description', 'Request data in machine-readable format')}

### ${t('privacy.right_to_objection', 'Right to Object')} (${t('privacy.gdpr_art_21', 'GDPR Art. 21')})
- ${t('privacy.objection_description', 'Object to processing based on legitimate interest')}

## ${t('privacy.exercise_rights', 'How to Exercise Your Rights')}
- ${t('privacy.email_request', 'Email: privacy@mariaborysevych.com')}
- ${t('privacy.phone_request', 'Phone: +48 123 456 789')}
- ${t('privacy.address_request', 'Address: ul. Jana Pawła II 43/15, 00-001 Warszawa')}`,
      lastUpdated: '2024-01-15',
      required: true,
    },
  ]);

  const [versions] = useState<PolicyVersion[]>([
    {
      id: '1',
      version: '2.1',
      effectiveDate: '2024-01-15',
      changes: [
        t('privacy.change_cookie_policy', 'Updated cookie policy for new consent requirements'),
        t('privacy.change_data_retention', 'Clarified data retention periods'),
        t('privacy.change_contact_info', 'Updated contact information'),
      ],
      createdBy: 'Legal Team',
      approvedBy: 'DPO - Anna Kowalska',
      status: 'active',
    },
    {
      id: '2',
      version: '2.0',
      effectiveDate: '2023-12-01',
      changes: [
        t('privacy.change_gdpr_compliance', 'Full GDPR compliance update'),
        t('privacy.change_polish_regulations', 'Added Polish-specific regulations'),
      ],
      createdBy: 'Legal Team',
      approvedBy 'DPO - Jan Nowak',
      status: 'archived',
    },
  ]);

  const [consentRecords] = useState<ConsentRecord[]>([
    {
      id: '1',
      policyVersion: '2.1',
      email: 'user@example.com',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...',
      consentDate: '2024-01-16T10:30:00Z',
      accepted: true,
    },
  ]);

  const getVersionStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportPolicy = (format: 'json' | 'pdf') => {
    const policyData = {
      sections: policySections,
      version: versions.find(v => v.status === 'active'),
      exportDate: new Date().toISOString(),
      format,
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(policyData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `privacy-policy-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">
              {t('privacy.title', 'Privacy Policy Management')}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {t('privacy.description',
              'Manage privacy policy content, versions, and compliance with GDPR requirements.')}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="content">{t('privacy.content', 'Content')}</TabsTrigger>
            <TabsTrigger value="versions">{t('privacy.versions', 'Versions')}</TabsTrigger>
            <TabsTrigger value="consents">{t('privacy.consents', 'Consents')}</TabsTrigger>
            <TabsTrigger value="compliance">{t('privacy.compliance', 'Compliance')}</TabsTrigger>
            <TabsTrigger value="export">{t('privacy.export', 'Export')}</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">
                {t('privacy.policy_content', 'Policy Content')}
              </h2>
              <div className="flex gap-2">
                <Button variant="outline">
                  {t('privacy.preview', 'Preview')}
                </Button>
                <Button>
                  {t('privacy.publish', 'Publish Changes')}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {policySections.map((section) => (
                <Card key={section.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        {section.required && (
                          <Badge variant="secondary">
                            {t('privacy.required', 'Required')}
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {t('privacy.last_updated', 'Last updated')}: {section.lastUpdated}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={section.content}
                      onChange={(e) => {
                        setPolicySections(prev =>
                          prev.map(s => s.id === section.id ? { ...s, content: e.target.value } : s)
                        );
                      }}
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="versions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">
                {t('privacy.version_history', 'Version History')}
              </h2>
              <Button>
                {t('privacy.create_version', 'Create New Version')}
              </Button>
            </div>

            <div className="space-y-4">
              {versions.map((version) => (
                <Card key={version.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-semibold text-lg">
                            {t('privacy.version', 'Version')} {version.version}
                          </h3>
                          <Badge className={getVersionStatusColor(version.status)}>
                            {t(`privacy.status.${version.status}`, version.status)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {t('privacy.effective_date', 'Effective')}: {version.effectiveDate}
                          </span>
                        </div>

                        <div className="space-y-2 mb-4">
                          <p className="text-sm font-medium">
                            {t('privacy.changes', 'Changes')}:
                          </p>
                          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            {version.changes.map((change, index) => (
                              <li key={index}>{change}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {t('privacy.created_by', 'Created by')}: {version.createdBy}
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            {t('privacy.approved_by', 'Approved by')}: {version.approvedBy}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              {t('privacy.view', 'View')}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle>
                                {t('privacy.version_preview', 'Version')} {version.version} {t('privacy.preview', 'Preview')}
                              </DialogTitle>
                              <DialogDescription>
                                {t('privacy.effective_from', 'Effective from')} {version.effectiveDate}
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="h-[60vh] p-4">
                              <div className="space-y-6">
                                {policySections.map((section) => (
                                  <div key={section.id}>
                                    <h3 className="font-semibold text-lg mb-2">{section.title}</h3>
                                    <div className="prose prose-sm max-w-none">
                                      {section.content.split('\n').map((line, index) => (
                                        <p key={index}>{line}</p>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="consents" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">
                {t('privacy.consent_records', 'Consent Records')}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {t('privacy.total_records', 'Total records')}: {consentRecords.length}
                </span>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  {t('privacy.export_consents', 'Export')}
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {consentRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{record.email}</span>
                          <Badge className={record.accepted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {record.accepted ? t('privacy.accepted', 'Accepted') : t('privacy.declined', 'Declined')}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {record.ipAddress}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(record.consentDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {t('privacy.version', 'Version')} {record.policyVersion}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">
              {t('privacy.gdpr_compliance', 'GDPR Compliance')}
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    {t('privacy.data_processing', 'Data Processing')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t('privacy.lawful_basis', 'Lawful Basis Documentation')}</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t('privacy.purpose_limitation', 'Purpose Limitation')}</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t('privacy.data_minimisation', 'Data Minimisation')}</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t('privacy.accuracy', 'Accuracy')}</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t('privacy.retention_limits', 'Retention Limits')}</span>
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    {t('privacy.data_subject_rights', 'Data Subject Rights')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t('privacy.access_implementation', 'Access Request Process')}</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t('privacy.deletion_process', 'Deletion Implementation')}</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t('privacy.portability_format', 'Portability Format')}</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t('privacy.consent_management', 'Consent Management')}</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t('privacy.objection_process', 'Objection Process')}</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {t('privacy.compliance_note',
                  'Regular audits and reviews are conducted to ensure ongoing GDPR compliance. ' +
                  'All data processing activities are documented and reviewed quarterly.')}
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">
              {t('privacy.export_policy', 'Export Privacy Policy')}
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t('privacy.json_export', 'JSON Export')}</CardTitle>
                  <CardDescription>
                    {t('privacy.json_export_description', 'Structured format for developers and system integration')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => exportPolicy('json')} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    {t('privacy.download_json', 'Download JSON')}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('privacy.pdf_export', 'PDF Export')}</CardTitle>
                  <CardDescription>
                    {t('privacy.pdf_export_description', 'Formatted document for printing and sharing')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => exportPolicy('pdf')} variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    {t('privacy.download_pdf', 'Download PDF')}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t('privacy.company_information', 'Company Information')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{t('privacy.company_name', 'mariiaborysevych Sp. z o.o.')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{t('privacy.company_address', 'ul. Jana Pawła II 43/15, 00-001 Warszawa, Polska')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>privacy@mariaborysevych.com</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>+48 123 456 789</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      <span>{t('privacy.dpo_contact', 'DPO: dpo@mariaborysevych.com')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Database className="w-4 h-4 text-muted-foreground" />
                      <span>{t('privacy.tax_id', 'NIP: 1234567890')}</span>
                    </div>
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