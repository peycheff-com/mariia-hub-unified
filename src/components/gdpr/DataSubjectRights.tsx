import React, { useState } from 'react';
import { Download, Trash2, Edit3, FileText, Shield, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGDPR } from '@/contexts/GDPRContext';
import { DataSubjectRequestType } from '@/types/gdpr';

interface DataRequest {
  id: string;
  request_type: DataSubjectRequestType;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  created_at: string;
  processed_at?: string;
  notes?: string;
}

const REQUEST_TYPES = [
  {
    value: 'access' as DataSubjectRequestType,
    label: 'Right to Access',
    description: 'Request a copy of all your personal data we hold',
    icon: <Download className="w-4 h-4" />,
  },
  {
    value: 'rectification' as DataSubjectRequestType,
    label: 'Right to Rectification',
    description: 'Request correction of inaccurate personal data',
    icon: <Edit3 className="w-4 h-4" />,
  },
  {
    value: 'erasure' as DataSubjectRequestType,
    label: 'Right to Erasure (Right to be Forgotten)',
    description: 'Request deletion of your personal data',
    icon: <Trash2 className="w-4 h-4" />,
  },
  {
    value: 'portability' as DataSubjectRequestType,
    label: 'Right to Data Portability',
    description: 'Request your data in a machine-readable format',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    value: 'restriction' as DataSubjectRequestType,
    label: 'Right to Restriction',
    description: 'Request restriction of processing your data',
    icon: <Shield className="w-4 h-4" />,
  },
  {
    value: 'objection' as DataSubjectRequestType,
    label: 'Right to Object',
    description: 'Object to processing of your personal data',
    icon: <AlertCircle className="w-4 h-4" />,
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
    case 'processing':
      return <Badge variant="default" className="flex items-center gap-1"><Shield className="w-3 h-3" /> Processing</Badge>;
    case 'completed':
      return <Badge variant="outline" className="flex items-center gap-1 text-green-600"><CheckCircle className="w-3 h-3" /> Completed</Badge>;
    case 'rejected':
      return <Badge variant="destructive" className="flex items-center gap-1">Rejected</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export function DataSubjectRights() {
  const {
    submitDataRequest,
    exportUserData,
    requestAccountDeletion,
    complianceStatus,
  } = useGDPR();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRequestType, setSelectedRequestType] = useState<DataSubjectRequestType | ''>('');
  const [requestDescription, setRequestDescription] = useState('');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleSubmitRequest = async () => {
    if (!selectedRequestType || !requestDescription.trim()) return;

    try {
      setIsSubmitting(true);
      await submitDataRequest(selectedRequestType, requestDescription.trim());
      setSelectedRequestType('');
      setRequestDescription('');
      setShowRequestDialog(false);
    } catch (error) {
      console.error('Error submitting data request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportData = async () => {
    try {
      await exportUserData();
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const handleAccountDeletion = async () => {
    try {
      await requestAccountDeletion();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error requesting account deletion:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Your Data Rights</h2>
        <p className="text-muted-foreground">
          Under GDPR, you have several rights regarding your personal data. Use the options below to exercise these rights.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Export Your Data
            </CardTitle>
            <CardDescription>
              Download all your personal data in a machine-readable format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExportData} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-600">
              <Trash2 className="w-5 h-5" />
              Delete Account
            </CardTitle>
            <CardDescription>
              Request permanent deletion of your account and all personal data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Request Deletion
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    Confirm Account Deletion Request
                  </DialogTitle>
                  <DialogDescription>
                    This action will submit a request to permanently delete your account and all associated personal data.
                    This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Important:</strong> Once your data is deleted, it cannot be recovered. This includes:
                      <ul className="mt-2 ml-4 list-disc text-sm">
                        <li>Your profile and account information</li>
                        <li>Booking history and preferences</li>
                        <li>Communication history</li>
                        <li>Any other personal data we hold</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleAccountDeletion}>
                      Confirm Deletion Request
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Other Requests
            </CardTitle>
            <CardDescription>
              Submit other data subject rights requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  New Request
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Submit Data Request
                  </DialogTitle>
                  <DialogDescription>
                    Choose the type of request and provide details about what you need.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="request-type">Request Type</Label>
                    <Select value={selectedRequestType} onValueChange={(value) => setSelectedRequestType(value as DataSubjectRequestType)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a request type" />
                      </SelectTrigger>
                      <SelectContent>
                        {REQUEST_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              {type.icon}
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-sm text-muted-foreground">{type.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="request-description">Description</Label>
                    <Textarea
                      id="request-description"
                      placeholder="Please provide details about your request..."
                      value={requestDescription}
                      onChange={(e) => setRequestDescription(e.target.value)}
                      rows={4}
                    />
                    <p className="text-sm text-muted-foreground">
                      Be as specific as possible about what data or actions you're requesting.
                    </p>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmitRequest}
                      disabled={!selectedRequestType || !requestDescription.trim() || isSubmitting}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Request'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Existing Requests */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Your Data Requests</h3>

        {complianceStatus?.pendingRequests && complianceStatus.pendingRequests.length > 0 ? (
          <div className="space-y-4">
            {complianceStatus.pendingRequests.map((request: DataRequest) => (
              <Card key={request.id} className="border">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {REQUEST_TYPES.find(t => t.value === request.request_type)?.icon}
                        {REQUEST_TYPES.find(t => t.value === request.request_type)?.label}
                      </CardTitle>
                      <CardDescription>
                        Requested on {new Date(request.created_at).toLocaleDateString()}
                        {request.processed_at && (
                          <span> • Processed on {new Date(request.processed_at).toLocaleDateString()}</span>
                        )}
                      </CardDescription>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>

                {(request.description || request.notes) && (
                  <CardContent className="pt-0">
                    {request.description && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium mb-1">Description:</h4>
                        <p className="text-sm text-muted-foreground">{request.description}</p>
                      </div>
                    )}
                    {request.notes && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Notes:</h4>
                        <p className="text-sm text-muted-foreground">{request.notes}</p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>You haven't submitted any data requests yet.</p>
                <p className="text-sm mt-1">Use the options above to exercise your data rights.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Your Rights Under GDPR
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REQUEST_TYPES.map((type) => (
              <div key={type.value} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{type.icon}</div>
                <div>
                  <h4 className="font-medium text-sm">{type.label}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                </div>
              </div>
            ))}
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Response Time:</strong> We will respond to your request within one month of receipt.
              For complex requests, this period may be extended by two additional months.
              We will notify you of any extension within one month of receiving your request.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}