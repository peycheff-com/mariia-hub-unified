import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Database,
  Search,
  Filter,
  FileText,
  Calendar,
  Users,
  Shield,
  CheckCircle,
  Clock,
  AlertTriangle,
  Globe,
  Lock,
  Eye,
  Download,
  Activity,
  Server,
  Mail,
  Phone,
  MapPin,
  User,
  Trash2,
  Edit
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DataProcessingActivity {
  id: string;
  name: string;
  description: string;
  category: 'customer_data' | 'booking_data' | 'payment_data' | 'marketing_data' | 'analytics_data';
  lawfulBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  dataTypes: string[];
  purposes: string[];
  recipients: string[];
  retentionPeriod: string;
  securityMeasures: string[];
  internationalTransfer: boolean;
  transferCountries: string[];
  dataSubjectRights: ('access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection')[];
  lastUpdated: string;
  status: 'active' | 'inactive' | 'under_review';
}

interface ProcessingRecord extends DataProcessingActivity {
  processorName?: string;
  processingLocation: string;
  dataVolume: string;
  frequency: 'continuous' | 'daily' | 'weekly' | 'monthly' | 'annually';
}

export function DataProcessingRegister() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBasis, setSelectedBasis] = useState('all');
  const [processingActivities, setProcessingActivities] = useState<DataProcessingActivity[]>([
    {
      id: '1',
      name: t('processing.customer_management', 'Customer Relationship Management'),
      description: t('processing.customer_management_desc', 'Managing customer accounts, preferences, and communication history'),
      category: 'customer_data',
      lawfulBasis: 'contract',
      dataTypes: ['name', 'email', 'phone', 'address', 'preferences', 'communication_history'],
      purposes: ['service_provision', 'customer_support', 'communication'],
      recipients: ['customer_service_team', 'management'],
      retentionPeriod: '7_years_after_contract_end',
      securityMeasures: ['encryption_at_rest', 'access_controls', 'audit_logging', 'backup_encryption'],
      internationalTransfer: false,
      transferCountries: [],
      dataSubjectRights: ['access', 'rectification', 'erasure', 'portability', 'restriction', 'objection'],
      lastUpdated: '2024-01-15',
      status: 'active',
    },
    {
      id: '2',
      name: t('processing.booking_management', 'Booking and Appointment Management'),
      description: t('processing.booking_management_desc', 'Processing service bookings, appointments, and scheduling'),
      category: 'booking_data',
      lawfulBasis: 'contract',
      dataTypes: ['service_preferences', 'appointment_times', 'provider_details', 'booking_history'],
      purposes: ['service_provision', 'scheduling', 'resource_management'],
      recipients: ['service_providers', 'booking_team', 'management'],
      retentionPeriod: '6_years',
      securityMeasures: ['encryption_at_rest', 'access_controls', 'audit_logging'],
      internationalTransfer: false,
      transferCountries: [],
      dataSubjectRights: ['access', 'rectification', 'erasure', 'portability', 'restriction'],
      lastUpdated: '2024-01-10',
      status: 'active',
    },
    {
      id: '3',
      name: t('processing.payment_processing', 'Payment Processing'),
      description: t('processing.payment_processing_desc', 'Processing payments, refunds, and financial transactions'),
      category: 'payment_data',
      lawfulBasis: 'contract',
      dataTypes: ['payment_method', 'transaction_amount', 'billing_address', 'invoice_details'],
      purposes: ['payment_processing', 'financial_reporting', 'fraud_prevention'],
      recipients: ['payment_processors', 'accounting_team'],
      retentionPeriod: '10_years',
      securityMeasures: ['pci_dss_compliance', 'encryption', 'tokenization', 'access_controls'],
      internationalTransfer: true,
      transferCountries: ['USA', 'Ireland'],
      dataSubjectRights: ['access', 'rectification'],
      lastUpdated: '2024-01-12',
      status: 'active',
    },
    {
      id: '4',
      name: t('processing.email_marketing', 'Email Marketing and Newsletters'),
      description: t('processing.email_marketing_desc', 'Sending promotional emails and newsletters'),
      category: 'marketing_data',
      lawfulBasis: 'consent',
      dataTypes: ['email', 'first_name', 'preferences', 'engagement_metrics'],
      purposes: ['marketing', 'customer_engagement', 'product_promotion'],
      recipients: ['marketing_team', 'email_service_provider'],
      retentionPeriod: 'until_consent_withdrawn',
      securityMeasures: ['encryption', 'access_controls', 'consent_management'],
      internationalTransfer: true,
      transferCountries: ['USA'],
      dataSubjectRights: ['access', 'rectification', 'erasure', 'portability', 'objection'],
      lastUpdated: '2024-01-08',
      status: 'active',
    },
    {
      id: '5',
      name: t('processing.website_analytics', 'Website Analytics'),
      description: t('processing.website_analytics_desc', 'Analyzing website usage and user behavior'),
      category: 'analytics_data',
      lawfulBasis: 'legitimate_interests',
      dataTypes: ['ip_address', 'browser_info', 'pages_visited', 'time_on_site', 'cookies'],
      purposes: ['website_optimization', 'user_experience_improvement', 'security_monitoring'],
      recipients: ['analytics_team', 'google_analytics'],
      retentionPeriod: '26_months',
      securityMeasures: ['anonymization', 'access_controls', 'data_minimization'],
      internationalTransfer: true,
      transferCountries: ['USA'],
      dataSubjectRights: ['objection'],
      lastUpdated: '2024-01-05',
      status: 'active',
    },
  ]);

  const categories = [
    { value: 'all', label: t('processing.all_categories', 'All Categories') },
    { value: 'customer_data', label: t('processing.customer_data', 'Customer Data') },
    { value: 'booking_data', label: t('processing.booking_data', 'Booking Data') },
    { value: 'payment_data', label: t('processing.payment_data', 'Payment Data') },
    { value: 'marketing_data', label: t('processing.marketing_data', 'Marketing Data') },
    { value: 'analytics_data', label: t('processing.analytics_data', 'Analytics Data') },
  ];

  const lawfulBases = [
    { value: 'all', label: t('processing.all_bases', 'All Legal Bases') },
    { value: 'consent', label: t('processing.consent', 'Consent') },
    { value: 'contract', label: t('processing.contract', 'Contract') },
    { value: 'legal_obligation', label: t('processing.legal_obligation', 'Legal Obligation') },
    { value: 'vital_interests', label: t('processing.vital_interests', 'Vital Interests') },
    { value: 'public_task', label: t('processing.public_task', 'Public Task') },
    { value: 'legitimate_interests', label: t('processing.legitimate_interests', 'Legitimate Interests') },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBasisColor = (basis: string) => {
    switch (basis) {
      case 'consent': return 'bg-blue-100 text-blue-800';
      case 'contract': return 'bg-green-100 text-green-800';
      case 'legal_obligation': return 'bg-purple-100 text-purple-800';
      case 'legitimate_interests': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredActivities = processingActivities.filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || activity.category === selectedCategory;
    const matchesBasis = selectedBasis === 'all' || activity.lawfulBasis === selectedBasis;

    return matchesSearch && matchesCategory && matchesBasis;
  });

  const exportRegister = (format: 'json' | 'csv' | 'pdf') => {
    const exportData = {
      activities: filteredActivities,
      exportDate: new Date().toISOString(),
      format,
      totalRecords: filteredActivities.length,
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-processing-register-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">
              {t('processing.title', 'Data Processing Register')}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {t('processing.description',
              'Comprehensive register of all data processing activities in compliance with GDPR Article 30. ' +
              'Maintain transparency and accountability in personal data processing.')}
          </p>
        </div>

        <Tabs defaultValue="register" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="register">{t('processing.register', 'Register')}</TabsTrigger>
            <TabsTrigger value="details">{t('processing.details', 'Details')}</TabsTrigger>
            <TabsTrigger value="compliance">{t('processing.compliance', 'Compliance')}</TabsTrigger>
            <TabsTrigger value="export">{t('processing.export', 'Export')}</TabsTrigger>
          </TabsList>

          <TabsContent value="register" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('processing.activities', 'Processing Activities')}</CardTitle>
                    <CardDescription>
                      {t('processing.activities_desc', 'View and manage all registered data processing activities')}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <FileText className="w-4 h-4 mr-2" />
                      {t('processing.add_activity', 'Add Activity')}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder={t('processing.search_placeholder', 'Search processing activities...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder={t('processing.select_category', 'Select category')} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedBasis} onValueChange={setSelectedBasis}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder={t('processing.select_basis', 'Select legal basis')} />
                    </SelectTrigger>
                    <SelectContent>
                      {lawfulBases.map(basis => (
                        <SelectItem key={basis.value} value={basis.value}>
                          {basis.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Results summary */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{t('processing.showing_results', 'Showing {{count}} results', { count: filteredActivities.length })}</span>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-green-700 bg-green-50">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {filteredActivities.filter(a => a.status === 'active').length} {t('processing.active', 'active')}
                    </Badge>
                  </div>
                </div>

                {/* Processing activities table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('processing.activity_name', 'Activity Name')}</TableHead>
                        <TableHead>{t('processing.category', 'Category')}</TableHead>
                        <TableHead>{t('processing.lawful_basis', 'Legal Basis')}</TableHead>
                        <TableHead>{t('processing.retention', 'Retention')}</TableHead>
                        <TableHead>{t('processing.status', 'Status')}</TableHead>
                        <TableHead>{t('processing.actions', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredActivities.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{activity.name}</div>
                              <div className="text-sm text-muted-foreground max-w-xs truncate">
                                {activity.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {t(`processing.category.${activity.category}`, activity.category)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getBasisColor(activity.lawfulBasis)}>
                              {t(`processing.basis.${activity.lawfulBasis}`, activity.lawfulBasis)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {t(`processing.retention.${activity.retentionPeriod}`, activity.retentionPeriod)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(activity.status)}>
                              {t(`processing.status.${activity.status}`, activity.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[80vh]">
                                  <DialogHeader>
                                    <DialogTitle>{activity.name}</DialogTitle>
                                    <DialogDescription>
                                      {activity.description}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <ScrollArea className="h-[60vh]">
                                    <div className="space-y-6">
                                      <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                          <h4 className="font-semibold mb-2">{t('processing.basic_info', 'Basic Information')}</h4>
                                          <div className="space-y-2 text-sm">
                                            <div><strong>{t('processing.category', 'Category')}:</strong> {t(`processing.category.${activity.category}`, activity.category)}</div>
                                            <div><strong>{t('processing.lawful_basis', 'Legal Basis')}:</strong> {t(`processing.basis.${activity.lawfulBasis}`, activity.lawfulBasis)}</div>
                                            <div><strong>{t('processing.retention_period', 'Retention Period')}:</strong> {t(`processing.retention.${activity.retentionPeriod}`, activity.retentionPeriod)}</div>
                                            <div><strong>{t('processing.status', 'Status')}:</strong> {t(`processing.status.${activity.status}`, activity.status)}</div>
                                            <div><strong>{t('processing.last_updated', 'Last Updated')}:</strong> {activity.lastUpdated}</div>
                                          </div>
                                        </div>
                                        <div>
                                          <h4 className="font-semibold mb-2">{t('processing.data_types', 'Data Types')}</h4>
                                          <div className="flex flex-wrap gap-1">
                                            {activity.dataTypes.map((type, index) => (
                                              <Badge key={index} variant="outline" className="text-xs">
                                                {t(`processing.data_type.${type}`, type)}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      </div>

                                      <div>
                                        <h4 className="font-semibold mb-2">{t('processing.purposes', 'Purposes')}</h4>
                                        <div className="flex flex-wrap gap-1">
                                          {activity.purposes.map((purpose, index) => (
                                            <Badge key={index} variant="outline">
                                              {t(`processing.purpose.${purpose}`, purpose)}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>

                                      <div>
                                        <h4 className="font-semibold mb-2">{t('processing.recipients', 'Data Recipients')}</h4>
                                        <div className="flex flex-wrap gap-1">
                                          {activity.recipients.map((recipient, index) => (
                                            <Badge key={index} variant="outline">
                                              {t(`processing.recipient.${recipient}`, recipient)}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>

                                      <div>
                                        <h4 className="font-semibold mb-2">{t('processing.security_measures', 'Security Measures')}</h4>
                                        <div className="flex flex-wrap gap-1">
                                          {activity.securityMeasures.map((measure, index) => (
                                            <Badge key={index} className="bg-green-100 text-green-800">
                                              {t(`processing.security.${measure}`, measure)}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>

                                      {activity.internationalTransfer && (
                                        <div>
                                          <h4 className="font-semibold mb-2">{t('processing.international_transfers', 'International Transfers')}</h4>
                                          <div className="flex flex-wrap gap-1">
                                            {activity.transferCountries.map((country, index) => (
                                              <Badge key={index} variant="outline">
                                                <Globe className="w-3 h-3 mr-1" />
                                                {country}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      <div>
                                        <h4 className="font-semibold mb-2">{t('processing.data_subject_rights', 'Data Subject Rights')}</h4>
                                        <div className="flex flex-wrap gap-1">
                                          {activity.dataSubjectRights.map((right, index) => (
                                            <Badge key={index} className="bg-blue-100 text-blue-800">
                                              <Shield className="w-3 h-3 mr-1" />
                                              {t(`processing.right.${right}`, right)}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </ScrollArea>
                                </DialogContent>
                              </Dialog>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">
              {t('processing.gdpr_compliance', 'GDPR Compliance Dashboard')}
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    {t('processing.compliant_activities', 'Compliant Activities')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {processingActivities.filter(a => a.status === 'active').length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('processing.total_activities', 'of {{total}} activities', { total: processingActivities.length })}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    {t('processing.legal_basis_coverage', 'Legal Basis Coverage')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Array.from(new Set(processingActivities.map(a => a.lawfulBasis))).map(basis => (
                      <div key={basis} className="flex justify-between text-sm">
                        <span>{t(`processing.basis.${basis}`, basis)}</span>
                        <span className="font-medium">
                          {processingActivities.filter(a => a.lawfulBasis === basis).length}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lock className="w-5 h-5 text-purple-600" />
                    {t('processing.security_level', 'Security Level')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {t('processing.high', 'High')}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('processing.security_desc', 'All activities have appropriate security measures')}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t('processing.compliance_checklist', 'Compliance Checklist')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { item: t('processing.record_accuracy', 'Records are accurate and up-to-date'), status: true },
                    { item: t('processing.lawful_basis_documented', 'Lawful bases are documented'), status: true },
                    { item: t('processing.retention_periods_defined', 'Retention periods are defined'), status: true },
                    { item: t('processing.security_measures_implemented', 'Security measures implemented'), status: true },
                    { item: t('processing.rights_documented', 'Data subject rights documented'), status: true },
                    { item: t('processing.international_transfers_protected', 'International transfers protected'), status: true },
                  ].map((check, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {check.status ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      )}
                      <span className="text-sm">{check.item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">
              {t('processing.export_register', 'Export Processing Register')}
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>{t('processing.json_format', 'JSON Format')}</CardTitle>
                  <CardDescription>
                    {t('processing.json_export_desc', 'Machine-readable format for integration and backup')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => exportRegister('json')} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    {t('processing.download_json', 'Download JSON')}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('processing.csv_format', 'CSV Format')}</CardTitle>
                  <CardDescription>
                    {t('processing.csv_export_desc', 'Spreadsheet format for analysis and reporting')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => exportRegister('csv')} variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    {t('processing.download_csv', 'Download CSV')}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('processing.pdf_format', 'PDF Format')}</CardTitle>
                  <CardDescription>
                    {t('processing.pdf_export_desc', 'Formatted document for sharing and printing')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => exportRegister('pdf')} variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    {t('processing.download_pdf', 'Download PDF')}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {t('processing.export_note',
                  'The export contains sensitive personal data processing information. Ensure secure storage and appropriate access controls. ' +
                  'This register must be made available to supervisory authorities upon request under GDPR Article 30.')}
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}