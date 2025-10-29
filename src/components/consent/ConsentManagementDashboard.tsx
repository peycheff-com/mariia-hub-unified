import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Download,
  Search,
  Filter,
  Plus,
  RefreshCw,
  BarChart3,
  User,
  Mail,
  MessageSquare,
  Trash2,
  Edit
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ModelConsent,
  ConsentRequest,
  ConsentUsageLog,
  ConsentAnalytics,
  consentStatusColors,
  usageTypeColors
} from '@/types/consent';
import { cn } from '@/lib/utils';

interface ConsentManagementDashboardProps {
  consents: ModelConsent[];
  requests: ConsentRequest[];
  usageLogs: ConsentUsageLog[];
  analytics: ConsentAnalytics;
  onRefresh: () => void;
  onViewConsent: (consent: ModelConsent) => void;
  onEditConsent: (consent: ModelConsent) => void;
  onRevokeConsent: (consentId: string, reason: string) => void;
  onLogUsage: (consentId: string, usageType: string, context: string) => void;
  onSendRequest: (clientId: string, bookingId?: string) => void;
  isLoading?: boolean;
}

const ConsentManagementDashboard: React.FC<ConsentManagementDashboardProps> = ({
  consents,
  requests,
  usageLogs,
  analytics,
  onRefresh,
  onViewConsent,
  onEditConsent,
  onRevokeConsent,
  onLogUsage,
  onSendRequest,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedConsent, setSelectedConsent] = useState<ModelConsent | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [showUsageDialog, setShowUsageDialog] = useState(false);
  const [usageData, setUsageData] = useState({ consentId: '', usageType: '', context: '' });

  // Filter consents
  const filteredConsents = consents.filter(consent => {
    const matchesSearch = !searchTerm ||
      consent.client_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consent.consent_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || consent.status === statusFilter;
    const matchesType = typeFilter === 'all' || consent.consent_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Get expiring consents
  const expiringConsents = consents.filter(consent =>
    consent.status === 'active' &&
    consent.expiry_date &&
    new Date(consent.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );

  // Get pending requests
  const pendingRequests = requests.filter(request => request.response_status === 'pending');

  const handleRevokeConsent = () => {
    if (selectedConsent && revokeReason.trim()) {
      onRevokeConsent(selectedConsent.id, revokeReason.trim());
      setShowRevokeDialog(false);
      setRevokeReason('');
      setSelectedConsent(null);
    }
  };

  const handleLogUsage = () => {
    if (usageData.consentId && usageData.usageType && usageData.context) {
      onLogUsage(usageData.consentId, usageData.usageType, usageData.context);
      setShowUsageDialog(false);
      setUsageData({ consentId: '', usageType: '', context: '' });
    }
  };

  const openRevokeDialog = (consent: ModelConsent) => {
    setSelectedConsent(consent);
    setShowRevokeDialog(true);
  };

  const openUsageDialog = (consent: ModelConsent) => {
    setUsageData({
      consentId: consent.id,
      usageType: '',
      context: ''
    });
    setShowUsageDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const colors = consentStatusColors[status as keyof typeof consentStatusColors] || 'text-gray-600 bg-gray-50';
    return (
      <Badge className={colors}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getUsageTypeBadge = (type: string) => {
    const colors = usageTypeColors[type as keyof typeof usageTypeColors] || 'text-gray-600 bg-gray-50';
    return (
      <Badge className={cn(colors, 'text-xs')}>
        {type.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Consents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_consent_records}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.active_consents} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringConsents.length}</div>
            <p className="text-xs text-muted-foreground">
              Within 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Usage</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.recent_usage.length}</div>
            <p className="text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expiration Alert */}
      {expiringConsents.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{expiringConsents.length}</strong> consent(s) are expiring within the next 30 days.
            Consider sending renewal requests to affected clients.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="consents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="consents">Consents ({consents.length})</TabsTrigger>
          <TabsTrigger value="requests">Requests ({requests.length})</TabsTrigger>
          <TabsTrigger value="usage">Usage Logs ({usageLogs.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Consents Tab */}
        <TabsContent value="consents" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Consent Records</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    disabled={isLoading}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onSendRequest('')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Request
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by client ID or type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="revoked">Revoked</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="photo">Photo</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="testimonial">Testimonial</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="case_study">Case Study</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Consents Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConsents.map((consent) => (
                      <TableRow key={consent.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            {consent.client_id?.substring(0, 8)}...
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {consent.consent_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(consent.status)}
                        </TableCell>
                        <TableCell>
                          {format(new Date(consent.consent_date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          {consent.expiry_date ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(consent.expiry_date), 'MMM dd, yyyy')}
                            </div>
                          ) : (
                            <span className="text-gray-500">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(consent.scope as any)
                              .filter(([_, selected]) => selected)
                              .slice(0, 2)
                              .map(([scope]) => (
                                <Badge key={scope} variant="outline" className="text-xs">
                                  {scope.replace('_', ' ')}
                                </Badge>
                              ))}
                            {Object.values(consent.scope as any).filter(Boolean).length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{Object.values(consent.scope as any).filter(Boolean).length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewConsent(consent)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openUsageDialog(consent)}
                              disabled={consent.status !== 'active'}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openRevokeDialog(consent)}
                              disabled={consent.status !== 'active'}
                            >
                              <XCircle className="w-4 h-4" />
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

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Consent Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Response</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.client_id?.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{request.request_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              request.response_status === 'approved' && 'bg-green-100 text-green-800',
                              request.response_status === 'declined' && 'bg-red-100 text-red-800',
                              request.response_status === 'pending' && 'bg-yellow-100 text-yellow-800',
                              request.response_status === 'expired' && 'bg-gray-100 text-gray-800'
                            )}
                          >
                            {request.response_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(request.created_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(request.expires_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          {request.response_date ? (
                            format(new Date(request.response_date), 'MMM dd, yyyy')
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {request.email_sent && (
                              <Mail className="w-4 h-4 text-blue-500" />
                            )}
                            {request.sms_sent && (
                              <MessageSquare className="w-4 h-4 text-green-500" />
                            )}
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
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

        {/* Usage Logs Tab */}
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Consent</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Context</TableHead>
                      <TableHead>Used By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usageLogs.slice(0, 20).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {log.consent_id?.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          {getUsageTypeBadge(log.usage_type)}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {log.usage_context}
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.used_by?.substring(0, 8) || 'System'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(log.used_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Consents by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Consents by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics.consents_by_type).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{type}</Badge>
                      </div>
                      <div className="text-2xl font-bold">{count}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Usage by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Usage by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics.usage_by_type).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getUsageTypeBadge(type)}
                      </div>
                      <div className="text-2xl font-bold">{count}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Used Content */}
          <Card>
            <CardHeader>
              <CardTitle>Most Used Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Consent ID</TableHead>
                      <TableHead>Usage Count</TableHead>
                      <TableHead>Last Used</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.top_used_content.map((item) => (
                      <TableRow key={item.consent_id}>
                        <TableCell className="font-medium">
                          {item.consent_id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>{item.usage_count}</TableCell>
                        <TableCell>
                          {format(new Date(item.last_used), 'MMM dd, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Revoke Consent Dialog */}
      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Consent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="revoke-reason">Reason for Revocation</Label>
              <Textarea
                id="revoke-reason"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Please provide a reason for revoking this consent..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRevokeDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRevokeConsent}
                disabled={!revokeReason.trim()}
              >
                Revoke Consent
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log Usage Dialog */}
      <Dialog open={showUsageDialog} onOpenChange={setShowUsageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Content Usage</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="usage-type">Usage Type</Label>
              <Select
                value={usageData.usageType}
                onValueChange={(value) => setUsageData(prev => ({ ...prev, usageType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select usage type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="portfolio">Portfolio</SelectItem>
                  <SelectItem value="advertisement">Advertisement</SelectItem>
                  <SelectItem value="print">Print</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="case_study">Case Study</SelectItem>
                  <SelectItem value="testimonial">Testimonial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="usage-context">Usage Context</Label>
              <Textarea
                id="usage-context"
                value={usageData.context}
                onChange={(e) => setUsageData(prev => ({ ...prev, context: e.target.value }))}
                placeholder="Describe where and how the content is being used..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowUsageDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleLogUsage}
                disabled={!usageData.usageType || !usageData.context}
              >
                Log Usage
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConsentManagementDashboard;