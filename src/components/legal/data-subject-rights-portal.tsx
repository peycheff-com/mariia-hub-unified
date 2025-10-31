import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, FileText, User, Mail, Phone, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DataSubjectRequest {
  id: string;
  type: 'access' | 'deletion' | 'rectification' | 'portability' | 'restriction' | 'objection';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  createdAt: string;
  completedAt?: string;
  description: string;
  email: string;
}

export function DataSubjectRightsPortal() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [requestType, setRequestType] = useState<string>('');
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    description: '',
    identityDocument: null as File | null,
  });
  const [requests, setRequests] = useState<DataSubjectRequest[]>([
    {
      id: '1',
      type: 'access',
      status: 'completed',
      createdAt: '2024-01-15T10:00:00Z',
      completedAt: '2024-01-16T14:30:00Z',
      description: t('data_rights.sample_request', 'Request for copy of all personal data'),
      email: 'user@example.com',
    },
  ]);

  const requestTypes = [
    { value: 'access', label: t('data_rights.right_to_access', 'Right to Access'), icon: FileText },
    { value: 'deletion', label: t('data_rights.right_to_deletion', 'Right to Deletion'), icon: Trash2 },
    { value: 'rectification', label: t('data_rights.right_to_rectification', 'Right to Rectification'), icon: FileText },
    { value: 'portability', label: t('data_rights.right_to_portability', 'Right to Portability'), icon: Download },
    { value: 'restriction', label: t('data_rights.right_to_restriction', 'Right to Restriction'), icon: AlertCircle },
    { value: 'objection', label: t('data_rights.right_to_objection', 'Right to Object'), icon: AlertCircle },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSubmitRequest = async () => {
    if (!requestType || !formData.email || !formData.description) {
      return;
    }

    const newRequest: DataSubjectRequest = {
      id: Date.now().toString(),
      type: requestType as DataSubjectRequest['type'],
      status: 'pending',
      createdAt: new Date().toISOString(),
      description: formData.description,
      email: formData.email,
    };

    setRequests(prev => [newRequest, ...prev]);
    setFormData({ email: '', phone: '', description: '', identityDocument: null });
    setRequestType('');
    setActiveTab('history');

    // In a real implementation, this would send to backend
    console.log('Data subject request submitted:', newRequest);
  };

  const handleDownloadData = () => {
    // Simulate data download in JSON format (portability)
    const userData = {
      personalData: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+48 123 456 789',
        address: 'Warsaw, Poland',
      },
      bookings: [
        {
          id: '1',
          service: 'Beauty Treatment',
          date: '2024-01-15',
          status: 'completed',
        },
      ],
      preferences: {
        language: 'en',
        notifications: true,
        marketing: false,
      },
      exportDate: new Date().toISOString(),
      format: 'JSON',
    };

    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personal-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">
            {t('data_rights.title', 'Your Data Rights')}
          </h1>
          <p className="text-muted-foreground">
            {t('data_rights.description',
              'Under GDPR, you have fundamental rights regarding your personal data. ' +
              'Use this portal to exercise your rights and manage your data.')}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">{t('data_rights.overview', 'Overview')}</TabsTrigger>
            <TabsTrigger value="request">{t('data_rights.new_request', 'New Request')}</TabsTrigger>
            <TabsTrigger value="history">{t('data_rights.history', 'Request History')}</TabsTrigger>
            <TabsTrigger value="export">{t('data_rights.export', 'Export Data')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {requestTypes.map(({ value, label, icon: Icon }) => (
                <Card key={value} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg">{label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      {t(`data_rights.${value}_description`, `Description for ${label}`)}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('data_rights.response_time',
                  'We respond to all data subject requests within 30 days as required by GDPR Article 12.')}
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="request" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('data_rights.submit_request', 'Submit Data Subject Request')}</CardTitle>
                <CardDescription>
                  {t('data_rights.request_description',
                    'Fill out the form below to submit your request regarding your personal data.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="request-type">{t('data_rights.request_type', 'Request Type')}</Label>
                  <Select value={requestType} onValueChange={setRequestType}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('data_rights.select_type', 'Select request type')} />
                    </SelectTrigger>
                    <SelectContent>
                      {requestTypes.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('data_rights.email', 'Email Address')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder={t('data_rights.email_placeholder', 'your@email.com')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('data_rights.phone', 'Phone Number (Optional)')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+48 123 456 789"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t('data_rights.description', 'Request Description')}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t('data_rights.description_placeholder',
                      'Please describe your request in detail...')}
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSubmitRequest} disabled={!requestType || !formData.email}>
                    {t('data_rights.submit', 'Submit Request')}
                  </Button>
                  <Button variant="outline">
                    {t('data_rights.upload_identity', 'Upload Identity Document')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="space-y-4">
              {requests.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {t('data_rights.no_requests', 'No data subject requests yet')}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                requests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getStatusColor(request.status)}>
                              {t(`data_rights.status.${request.status}`, request.status)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="font-medium mb-1">
                            {t(`data_rights.${request.type}`, request.type)}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {request.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {request.email}
                            </div>
                            {request.completedAt && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                {t('data_rights.completed', 'Completed')} {new Date(request.completedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                        {request.status === 'completed' && request.type === 'access' && (
                          <Button size="sm" variant="outline" onClick={handleDownloadData}>
                            <Download className="w-4 h-4 mr-2" />
                            {t('data_rights.download', 'Download')}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('data_rights.export_data', 'Export Your Data')}</CardTitle>
                <CardDescription>
                  {t('data_rights.export_description',
                    'Download all your personal data in a machine-readable format as required by GDPR Article 20.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t('data_rights.export_note',
                      'This download contains all personal data we have stored about you, including booking history, preferences, and account information.')}
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{t('data_rights.json_format', 'JSON Format')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        {t('data_rights.json_description', 'Structured data format suitable for importing into other systems')}
                      </p>
                      <Button onClick={handleDownloadData} className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        {t('data_rights.download_json', 'Download JSON')}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{t('data_rights.pdf_format', 'PDF Format')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        {t('data_rights.pdf_description', 'Human-readable format for easy review')}
                      </p>
                      <Button variant="outline" className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        {t('data_rights.download_pdf', 'Download PDF')}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}