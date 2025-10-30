import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  Shield,
  Clock,
  Users,
  Mail,
  Phone,
  Send,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Download,
  Bell,
  Activity,
  Calendar,
  MessageSquare,
  Globe,
  Lock,
  UserCheck,
  Zap,
  Radio
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BreachIncident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'unauthorized_access' | 'data_loss' | 'malware' | 'phishing' | 'physical_theft' | 'human_error';
  status: 'detected' | 'investigating' | 'contained' | 'notified' | 'resolved';
  detectedAt: string;
  discoveredAt: string;
  affectedUsers: number;
  dataTypes: string[];
  mitigationActions: string[];
  notification aria-live="polite" aria-atomic="true"sSent: {
    supervisory_authority: boolean;
    affected_users: boolean;
    staff: boolean;
    media: boolean;
  };
  assignedTo: string;
  estimatedRisk: string;
}

interface BreachTemplate {
  id: string;
  name: string;
  type: 'supervisory_authority' | 'affected_users' | 'staff' | 'media';
  language: 'en' | 'pl';
  subject: string;
  content: string;
  requiredFields: string[];
}

export function DataBreachNotificationSystem() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('incidents');
  const [selectedIncident, setSelectedIncident] = useState<BreachIncident | null>(null);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    severity: '',
    type: '',
    assignedTo: '',
  });

  const breachIncidents: BreachIncident[] = [
    {
      id: '1',
      title: t('breach.unauthorized_access_title', 'Unauthorized Access to Customer Database'),
      description: t('breach.unauthorized_access_desc', 'Detected unauthorized access attempts to customer database through compromised admin credentials'),
      severity: 'high',
      type: 'unauthorized_access',
      status: 'contained',
      detectedAt: '2024-01-14T14:30:00Z',
      discoveredAt: '2024-01-14T15:45:00Z',
      affectedUsers: 150,
      dataTypes: ['names', 'email_addresses', 'phone_numbers', 'booking_history'],
      mitigationActions: [
        t('breach.action1', 'Immediate password reset for all admin accounts'),
        t('breach.action2', 'Implementation of multi-factor authentication'),
        t('breach.action3', 'System security audit and penetration testing'),
      ],
      notification aria-live="polite" aria-atomic="true"sSent: {
        supervisory_authority: true,
        affected_users: false,
        staff: true,
        media: false,
      },
      assignedTo: 'security@mariaborysevych.com',
      estimatedRisk: t('breach.risk_high', 'High - potential for identity theft and fraud'),
    },
    {
      id: '2',
      title: t('breach.phishing_title', 'Phishing Attack Targeting Staff'),
      description: t('breach.phishing_desc', 'Sophisticated phishing campaign targeting staff email accounts'),
      severity: 'medium',
      type: 'phishing',
      status: 'resolved',
      detectedAt: '2024-01-12T09:15:00Z',
      discoveredAt: '2024-01-12T10:30:00Z',
      affectedUsers: 12,
      dataTypes: ['email_addresses', 'internal_communications'],
      mitigationActions: [
        t('breach.action4', 'Email filtering and security awareness training'),
        t('breach.action5', 'Implementation of advanced email security'),
        t('breach.action6', 'Password policy enforcement'),
      ],
      notification aria-live="polite" aria-atomic="true"sSent: {
        supervisory_authority: false,
        affected_users: false,
        staff: true,
        media: false,
      },
      assignedTo: 'it@mariaborysevych.com',
      estimatedRisk: t('breach.risk_medium', 'Medium - potential for data harvesting'),
    },
  ];

  const breachTemplates: BreachTemplate[] = [
    {
      id: '1',
      name: t('template.supervisory_authority', 'Supervisory Authority Notification (GDPR)'),
      type: 'supervisory_authority',
      language: 'en',
      subject: t('template.gdpr_subject', 'Personal Data Breach Notification - GDPR Article 33'),
      content: `Dear Data Protection Authority,

We are writing to notify you of a personal data breach that occurred at our organization.

**Breach Details:**
- Date of breach: {{breach_date}}
- Date of discovery: {{discovery_date}}
- Type of breach: {{breach_type}}
- Categories of data affected: {{data_categories}}
- Approximate number of affected individuals: {{affected_count}}

**Description:**
{{breach_description}}

**Potential Consequences:**
{{potential_consequences}}

**Measures Taken:**
{{mitigation_measures}}

**Contact Information:**
{{contact_details}}

This notification aria-live="polite" aria-atomic="true" is being sent within 72 hours of becoming aware of the breach as required by GDPR Article 33.

Sincerely,
{{dpo_name}}
Data Protection Officer
Mariia Hub Sp. z o.o.`,
      requiredFields: ['breach_date', 'discovery_date', 'breach_type', 'data_categories', 'affected_count'],
    },
    {
      id: '2',
      name: t('template.affected_users', 'Affected Users Notification (GDPR)'),
      type: 'affected_users',
      language: 'en',
      subject: t('template.users_subject', 'Important Security Information Regarding Your Personal Data'),
      content: `Dear {{customer_name}},

We are writing to inform you about a security incident that may have affected your personal data.

**What happened:**
{{incident_description}}

**What information was affected:**
{{affected_data}}

**What we are doing:**
{{protective_measures}}

**What we recommend you do:**
{{user_recommendations}}

**Contact Information:**
If you have any questions or concerns, please contact us at:
Email: privacy@mariaborysevych.com
Phone: +48 123 456 789

We sincerely apologize for any inconvenience this may cause.

Sincerely,
The Mariia Hub Team`,
      requiredFields: ['customer_name', 'incident_description', 'affected_data', 'protective_measures'],
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'contained': return <Shield className="w-4 h-4 text-blue-600" />;
      case 'investigating': return <Eye className="w-4 h-4 text-yellow-600" />;
      case 'notified': return <Send className="w-4 h-4 text-purple-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getBreachTypeIcon = (type: string) => {
    switch (type) {
      case 'unauthorized_access': return <Lock className="w-4 h-4" />;
      case 'data_loss': return <XCircle className="w-4 h-4" />;
      case 'malware': return <Zap className="w-4 h-4" />;
      case 'phishing': return <MessageSquare className="w-4 h-4" />;
      case 'physical_theft': return <AlertTriangle className="w-4 h-4" />;
      case 'human_error': return <Users className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleCreateIncident = () => {
    // In a real implementation, this would create a new incident
    console.log('Creating incident:', newIncident);
    alert(t('breach.incident_created', 'Incident created successfully. Investigation team has been notified.'));
    setNewIncident({ title: '', description: '', severity: '', type: '', assignedTo: '' });
  };

  const handleSendNotification = (incident: BreachIncident, recipientType: string) => {
    // In a real implementation, this would send notification aria-live="polite" aria-atomic="true"s
    console.log(`Sending ${recipientType} notification aria-live="polite" aria-atomic="true" for incident:`, incident.id);
    alert(t('breach.notification aria-live="polite" aria-atomic="true"_sent', 'Notification sent successfully.'));
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">
                {t('breach.title', 'Data Breach Notification System')}
              </h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Radio className="w-4 h-4 mr-2" />
                {t('breach.test_system', 'Test System')}
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    {t('breach.report_incident', 'Report Incident')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{t('breach.report_new_incident', 'Report New Security Incident')}</DialogTitle>
                    <DialogDescription>
                      {t('breach.incident_report_desc', 'Report a potential security incident for immediate investigation')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="incident-title">{t('breach.incident_title', 'Incident Title')}</Label>
                      <Input
                        id="incident-title"
                        value={newIncident.title}
                        onChange={(e) => setNewIncident(prev => ({ ...prev, title: e.target.value }))}
                        placeholder={t('breach.title_placeholder', 'Brief description of the incident')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="incident-description">{t('breach.description', 'Detailed Description')}</Label>
                      <Textarea
                        id="incident-description"
                        value={newIncident.description}
                        onChange={(e) => setNewIncident(prev => ({ ...prev, description: e.target.value }))}
                        placeholder={t('breach.description_placeholder', 'Provide detailed information about the incident...')}
                        rows={4}
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="severity">{t('breach.severity', 'Severity Level')}</Label>
                        <Select value={newIncident.severity} onValueChange={(value) => setNewIncident(prev => ({ ...prev, severity: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('breach.select_severity', 'Select severity')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">{t('breach.severity_low', 'Low')}</SelectItem>
                            <SelectItem value="medium">{t('breach.severity_medium', 'Medium')}</SelectItem>
                            <SelectItem value="high">{t('breach.severity_high', 'High')}</SelectItem>
                            <SelectItem value="critical">{t('breach.severity_critical', 'Critical')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="incident-type">{t('breach.type', 'Incident Type')}</Label>
                        <Select value={newIncident.type} onValueChange={(value) => setNewIncident(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('breach.select_type', 'Select type')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unauthorized_access">{t('breach.type_unauthorized', 'Unauthorized Access')}</SelectItem>
                            <SelectItem value="data_loss">{t('breach.type_data_loss', 'Data Loss')}</SelectItem>
                            <SelectItem value="malware">{t('breach.type_malware', 'Malware/Ransomware')}</SelectItem>
                            <SelectItem value="phishing">{t('breach.type_phishing', 'Phishing')}</SelectItem>
                            <SelectItem value="physical_theft">{t('breach.type_theft', 'Physical Theft')}</SelectItem>
                            <SelectItem value="human_error">{t('breach.type_human_error', 'Human Error')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assigned-to">{t('breach.assigned_to', 'Assign To')}</Label>
                      <Input
                        id="assigned-to"
                        value={newIncident.assignedTo}
                        onChange={(e) => setNewIncident(prev => ({ ...prev, assignedTo: e.target.value }))}
                        placeholder="security@mariaborysevych.com"
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleCreateIncident}>
                        <Send className="w-4 h-4 mr-2" />
                        {t('breach.submit_incident', 'Submit Incident')}
                      </Button>
                      <Button variant="outline">
                        <Phone className="w-4 h-4 mr-2" />
                        {t('breach.emergency_contact', 'Emergency Contact')}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <p className="text-muted-foreground mt-2">
            {t('breach.description',
              'GDPR-compliant data breach notification aria-live="polite" aria-atomic="true" system with 72-hour supervisory authority reporting, ' +
              'affected user notification aria-live="polite" aria-atomic="true"s, and comprehensive incident management.')}
          </p>
        </div>

        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('breach.legal_requirement',
              'Under GDPR Article 33, data breaches must be reported to supervisory authorities within 72 hours ' +
              'of becoming aware of the breach. Affected individuals must be notified without undue delay if the breach ' +
              'is likely to result in high risk to their rights and freedoms.')}
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="incidents">{t('breach.incidents', 'Incidents')}</TabsTrigger>
            <TabsTrigger value="notification aria-live="polite" aria-atomic="true"s">{t('breach.notification aria-live="polite" aria-atomic="true"s', 'Notifications')}</TabsTrigger>
            <TabsTrigger value="templates">{t('breach.templates', 'Templates')}</TabsTrigger>
            <TabsTrigger value="procedures">{t('breach.procedures', 'Procedures')}</TabsTrigger>
            <TabsTrigger value="contacts">{t('breach.contacts', 'Contacts')}</TabsTrigger>
          </TabsList>

          <TabsContent value="incidents" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    {t('breach.critical_incidents', 'Critical')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">
                    {breachIncidents.filter(i => i.severity === 'critical').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    {t('breach.under_investigation', 'Under Investigation')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">
                    {breachIncidents.filter(i => i.status === 'investigating').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    {t('breach.total_affected', 'Total Affected')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {breachIncidents.reduce((sum, i) => sum + i.affectedUsers, 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    {t('breach.resolved', 'Resolved')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {breachIncidents.filter(i => i.status === 'resolved').length}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t('breach.incident_log', 'Security Incident Log')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('breach.incident', 'Incident')}</TableHead>
                      <TableHead>{t('breach.severity', 'Severity')}</TableHead>
                      <TableHead>{t('breach.type', 'Type')}</TableHead>
                      <TableHead>{t('breach.status', 'Status')}</TableHead>
                      <TableHead>{t('breach.affected', 'Affected Users')}</TableHead>
                      <TableHead>{t('breach.discovered', 'Discovered')}</TableHead>
                      <TableHead>{t('breach.actions', 'Actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {breachIncidents.map((incident) => (
                      <TableRow key={incident.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium max-w-xs truncate">{incident.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {t('breach.assigned', 'Assigned to')}: {incident.assignedTo}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(incident.severity)}>
                            {t(`breach.severity_${incident.severity}`, incident.severity)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getBreachTypeIcon(incident.type)}
                            <span className="text-sm">
                              {t(`breach.type_${incident.type}`, incident.type)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(incident.status)}
                            <Badge variant="outline">
                              {t(`breach.status_${incident.status}`, incident.status)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {incident.affectedUsers.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(incident.discoveredAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedIncident(incident)}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh]">
                                <DialogHeader>
                                  <DialogTitle>{selectedIncident?.title}</DialogTitle>
                                  <DialogDescription>
                                    {t('breach.incident_details', 'Detailed incident information and response actions')}
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedIncident && (
                                  <div className="space-y-6">
                                    <div className="grid gap-4 md:grid-cols-2">
                                      <div>
                                        <h4 className="font-semibold mb-2">{t('breach.basic_info', 'Basic Information')}</h4>
                                        <div className="space-y-1 text-sm">
                                          <div><strong>{t('breach.severity', 'Severity')}:</strong> {t(`breach.severity_${selectedIncident.severity}`, selectedIncident.severity)}</div>
                                          <div><strong>{t('breach.type', 'Type')}:</strong> {t(`breach.type_${selectedIncident.type}`, selectedIncident.type)}</div>
                                          <div><strong>{t('breach.status', 'Status')}:</strong> {t(`breach.status_${selectedIncident.status}`, selectedIncident.status)}</div>
                                          <div><strong>{t('breach.affected_users', 'Affected Users')}:</strong> {selectedIncident.affectedUsers}</div>
                                        </div>
                                      </div>
                                      <div>
                                        <h4 className="font-semibold mb-2">{t('breach.timeline', 'Timeline')}</h4>
                                        <div className="space-y-1 text-sm">
                                          <div><strong>{t('breach.detected', 'Detected')}:</strong> {new Date(selectedIncident.detectedAt).toLocaleString()}</div>
                                          <div><strong>{t('breach.discovered', 'Discovered')}:</strong> {new Date(selectedIncident.discoveredAt).toLocaleString()}</div>
                                          <div><strong>{t('breach.assigned_to', 'Assigned to')}:</strong> {selectedIncident.assignedTo}</div>
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold mb-2">{t('breach.description', 'Description')}</h4>
                                      <p className="text-sm text-muted-foreground">{selectedIncident.description}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold mb-2">{t('breach.affected_data_types', 'Affected Data Types')}</h4>
                                      <div className="flex flex-wrap gap-1">
                                        {selectedIncident.dataTypes.map((type, index) => (
                                          <Badge key={index} variant="outline">{type}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold mb-2">{t('breach.mitigation_actions', 'Mitigation Actions')}</h4>
                                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                        {selectedIncident.mitigationActions.map((action, index) => (
                                          <li key={index}>{action}</li>
                                        ))}
                                      </ul>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold mb-2">{t('breach.notification aria-live="polite" aria-atomic="true"s', 'Notifications Sent')}</h4>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                        <div className="flex items-center gap-2">
                                          {selectedIncident.notification aria-live="polite" aria-atomic="true"sSent.supervisory_authority ? (
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                          ) : (
                                            <XCircle className="w-4 h-4 text-red-600" />
                                          )}
                                          {t('breach.supervisory_authority', 'Supervisory Authority')}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {selectedIncident.notification aria-live="polite" aria-atomic="true"sSent.affected_users ? (
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                          ) : (
                                            <XCircle className="w-4 h-4 text-red-600" />
                                          )}
                                          {t('breach.affected_users', 'Affected Users')}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {selectedIncident.notification aria-live="polite" aria-atomic="true"sSent.staff ? (
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                          ) : (
                                            <XCircle className="w-4 h-4 text-red-600" />
                                          )}
                                          {t('breach.staff', 'Staff')}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {selectedIncident.notification aria-live="polite" aria-atomic="true"sSent.media ? (
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                          ) : (
                                            <XCircle className="w-4 h-4 text-red-600" />
                                          )}
                                          {t('breach.media', 'Media')}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendNotification(incident, 'supervisory_authority')}
                              disabled={incident.notification aria-live="polite" aria-atomic="true"sSent.supervisory_authority}
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notification aria-live="polite" aria-atomic="true"s" className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">
              {t('breach.notification aria-live="polite" aria-atomic="true"_management', 'Notification Management')}
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    {t('breach.gdpr_notification aria-live="polite" aria-atomic="true"s', 'GDPR Notifications')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {[
                      { title: t('breach.supervisory_authority', 'Supervisory Authority'), desc: t('breach.authority_desc', '72-hour notification aria-live="polite" aria-atomic="true" requirement'), icon: <Globe className="w-4 h-4" /> },
                      { title: t('breach.affected_individuals', 'Affected Individuals'), desc: t('breach.individuals_desc', 'High-risk breach notification aria-live="polite" aria-atomic="true"s'), icon: <Users className="w-4 h-4" /> },
                    ].map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        {item.icon}
                        <div>
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    {t('breach.notification aria-live="polite" aria-atomic="true"_timeline', 'Notification Timeline')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {[
                      { time: '0-1 hour', action: t('breach.immediate_assessment', 'Immediate risk assessment') },
                      { time: '1-24 hours', action: t('breach.containment', 'Containment and investigation') },
                      { time: '24-48 hours', action: t('breach.authority_notification aria-live="polite" aria-atomic="true"', 'Supervisory authority notification aria-live="polite" aria-atomic="true"') },
                      { time: '48-72 hours', action: t('breach.individual_notification aria-live="polite" aria-atomic="true"', 'Individual notification aria-live="polite" aria-atomic="true" if required') },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="text-sm font-medium text-primary">{item.time}</div>
                        <div className="flex-1 text-sm">{item.action}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t('breach.notification aria-live="polite" aria-atomic="true"_channels', 'Notification Channels')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-medium">{t('breach.email_notification aria-live="polite" aria-atomic="true"s', 'Email Notifications')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('breach.email_desc', 'Primary channel for formal notification aria-live="polite" aria-atomic="true"s')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-medium">{t('breach.phone_notification aria-live="polite" aria-atomic="true"s', 'Phone Calls')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('breach.phone_desc', 'For high-priority incidents')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-medium">{t('breach.website_notification aria-live="polite" aria-atomic="true"s', 'Website Notifications')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('breach.website_desc', 'Public announcements and notices')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">
                {t('breach.notification aria-live="polite" aria-atomic="true"_templates', 'Notification Templates')}
              </h2>
              <Button>
                <FileText className="w-4 h-4 mr-2" />
                {t('breach.create_template', 'Create Template')}
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {breachTemplates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <div className="flex gap-1">
                        <Badge variant="outline">
                          {template.language.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {t(`breach.template_type_${template.type}`, template.type)}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>{template.subject}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-2">{t('breach.template_preview', 'Preview')}</h4>
                        <div className="text-sm text-muted-foreground max-h-32 overflow-y-auto p-3 bg-muted rounded">
                          {template.content.substring(0, 200)}...
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2">{t('breach.required_fields', 'Required Fields')}</h4>
                        <div className="flex flex-wrap gap-1">
                          {template.requiredFields.map((field, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="w-4 h-4 mr-2" />
                          {t('breach.preview', 'Preview')}
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Download className="w-4 h-4 mr-2" />
                          {t('breach.download', 'Download')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="procedures" className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">
              {t('breach.response_procedures', 'Breach Response Procedures')}
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    {t('breach.immediate_actions', 'Immediate Actions')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    t('breach.action_immediate_1', 'Activate incident response team'),
                    t('breach.action_immediate_2', 'Assess breach scope and impact'),
                    t('breach.action_immediate_3', 'Implement containment measures'),
                    t('breach.action_immediate_4', 'Document all actions taken'),
                    t('breach.action_immediate_5', 'Preserve evidence for investigation'),
                  ].map((action, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{action}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-purple-600" />
                    {t('breach.notification aria-live="polite" aria-atomic="true"_procedures', 'Notification Procedures')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    t('breach.action_notify_1', 'Determine if supervisory authority notification aria-live="polite" aria-atomic="true" is required'),
                    t('breach.action_notify_2', 'Prepare GDPR Article 33 notification aria-live="polite" aria-atomic="true" within 72 hours'),
                    t('breach.action_notify_3', 'Assess if individual notification aria-live="polite" aria-atomic="true" is required'),
                    t('breach.action_notify_4', 'Prepare clear communication for affected individuals'),
                    t('breach.action_notify_5', 'Document all notification aria-live="polite" aria-atomic="true" activities'),
                  ].map((action, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{action}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t('breach.escalation_matrix', 'Escalation Matrix')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('breach.severity_level', 'Severity Level')}</TableHead>
                      <TableHead>{t('breach.response_time', 'Response Time')}</TableHead>
                      <TableHead>{t('breach.notification aria-live="polite" aria-atomic="true"_required', 'Notification Required')}</TableHead>
                      <TableHead>{t('breach.escalation_level', 'Escalation Level')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <Badge className={getSeverityColor('critical')}>{t('breach.critical', 'Critical')}</Badge>
                      </TableCell>
                      <TableCell>{t('breach.immediate', 'Immediate')}</TableCell>
                      <TableCell>{t('breach.all_channels', 'All channels')}</TableCell>
                      <TableCell>{t('breach.c_level', 'C-Level Management')}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Badge className={getSeverityColor('high')}>{t('breach.high', 'High')}</Badge>
                      </TableCell>
                      <TableCell>{t('breach.within_1_hour', 'Within 1 hour')}</TableCell>
                      <TableCell>{t('breach.authority_required', 'Authority + Individuals')}</TableCell>
                      <TableCell>{t('breach.department_head', 'Department Head')}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Badge className={getSeverityColor('medium')}>{t('breach.medium', 'Medium')}</Badge>
                      </TableCell>
                      <TableCell>{t('breach.within_4_hours', 'Within 4 hours')}</TableCell>
                      <TableCell>{t('breach.authority_only', 'Authority only if required')}</TableCell>
                      <TableCell>{t('breach.team_lead', 'Team Lead')}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Badge className={getSeverityColor('low')}>{t('breach.low', 'Low')}</Badge>
                      </TableCell>
                      <TableCell>{t('breach.within_24_hours', 'Within 24 hours')}</TableCell>
                      <TableCell>{t('breach.internal_only', 'Internal documentation')}</TableCell>
                      <TableCell>{t('breach.standard_procedure', 'Standard procedure')}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">
              {t('breach.emergency_contacts', 'Emergency Contacts')}
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    {t('breach.internal_contacts', 'Internal Response Team')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { role: t('breach.dpo', 'Data Protection Officer'), name: 'Anna Kowalska', email: 'dpo@mariaborysevych.com', phone: '+48 123 456 789' },
                    { role: t('breach.security_lead', 'Security Lead'), name: 'Piotr Nowak', email: 'security@mariaborysevych.com', phone: '+48 123 456 788' },
                    { role: t('breach.legal_counsel', 'Legal Counsel'), name: 'Ewa Wiśniewska', email: 'legal@mariaborysevych.com', phone: '+48 123 456 787' },
                    { role: t('breach.pr_manager', 'PR Manager'), name: 'Tomasz Lewandowski', email: 'pr@mariaborysevych.com', phone: '+48 123 456 786' },
                  ].map((contact, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{contact.role}</h4>
                        <p className="text-sm text-muted-foreground">{contact.name}</p>
                      </div>
                      <div className="text-right text-sm">
                        <div>{contact.email}</div>
                        <div>{contact.phone}</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    {t('breach.external_contacts', 'External Authorities')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { role: t('breach.polish_dpo', 'Polish DPO'), name: 'UODO', email: 'kontakt@uodo.gov.pl', phone: '+48 22 531 03 00' },
                    { role: t('breach.cybersecurity', 'Cybersecurity Unit'), name: 'CERT Polska', email: 'cert@cert.pl', phone: '+48 22 531 03 44' },
                    { role: t('breach.data_protection', 'Data Protection Authority'), name: 'GIODO', email: 'info@giodo.gov.pl', phone: '+48 22 531 03 00' },
                    { role: t('breach.emergency_services', 'Emergency Services'), name: '112', email: '', phone: '112' },
                  ].map((contact, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{contact.role}</h4>
                        <p className="text-sm text-muted-foreground">{contact.name}</p>
                      </div>
                      <div className="text-right text-sm">
                        {contact.email && <div>{contact.email}</div>}
                        {contact.phone && <div>{contact.phone}</div>}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {t('breach.contact_note',
                  'All emergency contacts should be available 24/7. Regular contact verification and testing ' +
                  'of communication channels should be conducted quarterly.')}
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}