/**
 * Booksy Sync Dashboard Component
 *
 * Comprehensive admin dashboard for managing Booksy integration
 * Displays sync status, conflicts, and provides management controls
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Calendar,
  Activity,
  Settings,
  Download,
  Upload,
  Eye,
  Trash2,
  AlertCircle,
  Info,
  Zap,
  Database,
  Shield,
  FileText,
  TrendingUp,
  Sync,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

// Types
interface SyncStatus {
  lastFullSync: Date | null;
  totalSlots: number;
  syncedSlots: number;
  conflictedSlots: number;
  pendingConflicts: number;
  isProcessing: boolean;
}

interface SyncConflict {
  id: string;
  entityType: 'booking' | 'service' | 'client' | 'availability';
  entityId?: string;
  booksyEntityId?: string;
  conflictType: string;
  conflictData: any;
  resolutionStatus: 'pending' | 'resolved' | 'ignored' | 'manual_review';
  createdAt: Date;
}

interface SyncOperation {
  id: string;
  operationType: string;
  entityType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  error?: string;
  createdAt: Date;
}

interface ConsentRecord {
  id: string;
  userId: string;
  consentGiven: boolean;
  consentData: any;
  timestamp: Date;
  ipAddress: string;
}

interface RevenueReconciliation {
  date: string;
  platformRevenue: number;
  booksyRevenue: number;
  discrepancy: number;
  status: string;
}

export const BooksySyncDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [syncOperations, setSyncOperations] = useState<SyncOperation[]>([]);
  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([]);
  const [reconciliationData, setReconciliationData] = useState<RevenueReconciliation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load all dashboard data
      await Promise.all([
        loadSyncStatus(),
        loadConflicts(),
        loadSyncOperations(),
        loadConsentRecords(),
        loadReconciliationData()
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSyncStatus = async () => {
    try {
      const response = await fetch('/api/admin/booksy/sync-status');
      const data = await response.json();
      setSyncStatus(data);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  const loadConflicts = async () => {
    try {
      const response = await fetch('/api/admin/booksy/conflicts');
      const data = await response.json();
      setConflicts(data.conflicts || []);
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    }
  };

  const loadSyncOperations = async () => {
    try {
      const response = await fetch('/api/admin/booksy/sync-operations');
      const data = await response.json();
      setSyncOperations(data.operations || []);
    } catch (error) {
      console.error('Failed to load sync operations:', error);
    }
  };

  const loadConsentRecords = async () => {
    try {
      const response = await fetch('/api/admin/booksy/consent-records');
      const data = await response.json();
      setConsentRecords(data.records || []);
    } catch (error) {
      console.error('Failed to load consent records:', error);
    }
  };

  const loadReconciliationData = async () => {
    try {
      const response = await fetch('/api/admin/booksy/reconciliation');
      const data = await response.json();
      setReconciliationData(data.data || []);
    } catch (error) {
      console.error('Failed to load reconciliation data:', error);
    }
  };

  const handleFullSync = async () => {
    setSyncInProgress(true);
    try {
      const response = await fetch('/api/admin/booksy/full-sync', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        await loadSyncStatus();
        // Show success notification aria-live="polite" aria-atomic="true"
      } else {
        // Show error notification aria-live="polite" aria-atomic="true"
      }
    } catch (error) {
      console.error('Failed to start full sync:', error);
    } finally {
      setSyncInProgress(false);
    }
  };

  const handleResolveConflict = async (conflictId: string, resolution: 'platform' | 'booksy' | 'manual') => {
    try {
      const response = await fetch(`/api/admin/booksy/conflicts/${conflictId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution })
      });

      if (response.ok) {
        await loadConflicts();
        setSelectedConflict(null);
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      case 'conflict': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'synced': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'conflict': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'PLN') => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString('pl-PL');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Booksy Integration</h1>
          <p className="text-muted-foreground">
            Manage synchronization between platform and Booksy
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={autoSyncEnabled}
            onCheckedChange={setAutoSyncEnabled}
          />
          <Label>Auto Sync</Label>
          <Button
            onClick={handleFullSync}
            disabled={syncInProgress || syncStatus?.isProcessing}
          >
            {syncInProgress ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sync className="h-4 w-4 mr-2" />
            )}
            Full Sync
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="consent">Consent</TabsTrigger>
          <TabsTrigger value="reconciliation">Revenue</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {syncStatus?.isProcessing ? (
                    <span className="flex items-center">
                      <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                      Syncing
                    </span>
                  ) : syncStatus?.lastFullSync ? (
                    'Healthy'
                  ) : (
                    'Not Synced'
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last sync: {syncStatus?.lastFullSync ? formatDate(syncStatus.lastFullSync) : 'Never'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Slots</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{syncStatus?.totalSlots || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {syncStatus?.syncedSlots || 0} synced
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conflicts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {syncStatus?.pendingConflicts || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {syncStatus?.conflictedSlots || 0} total conflicts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Consent Rate</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {consentRecords.length > 0
                    ? Math.round((consentRecords.filter(r => r.consentGiven).length / consentRecords.length) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {consentRecords.filter(r => r.consentGiven).length} of {consentRecords.length} users
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Sync Operations</CardTitle>
                <CardDescription>Latest synchronization activities</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {syncOperations.slice(0, 10).map((operation) => (
                      <div key={operation.id} className="flex items-center space-x-2 p-2 border rounded">
                        {getStatusIcon(operation.status)}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{operation.operationType}</p>
                          <p className="text-xs text-muted-foreground">
                            {operation.entityType} • {formatDate(operation.createdAt)}
                          </p>
                        </div>
                        {operation.status === 'failed' && (
                          <Badge variant="destructive">{operation.attempts} attempts</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sync Health</CardTitle>
                <CardDescription>Overall system health and performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sync Success Rate</span>
                    <span>
                      {syncOperations.length > 0
                        ? Math.round((syncOperations.filter(o => o.status === 'completed').length / syncOperations.length) * 100)
                        : 0}%
                    </span>
                  </div>
                  <Progress
                    value={syncOperations.length > 0
                      ? (syncOperations.filter(o => o.status === 'completed').length / syncOperations.length) * 100
                      : 0}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Availability Sync</span>
                    <span>{syncStatus?.syncedSlots && syncStatus?.totalSlots
                      ? Math.round((syncStatus.syncedSlots / syncStatus.totalSlots) * 100)
                      : 0}%</span>
                  </div>
                  <Progress
                    value={syncStatus?.syncedSlots && syncStatus?.totalSlots
                      ? (syncStatus.syncedSlots / syncStatus.totalSlots) * 100
                      : 0}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-green-600">Healthy</p>
                    <p className="text-2xl font-bold">{syncOperations.filter(o => o.status === 'completed').length}</p>
                  </div>
                  <div>
                    <p className="font-medium text-red-600">Failed</p>
                    <p className="text-2xl font-bold">{syncOperations.filter(o => o.status === 'failed').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Conflicts Tab */}
        <TabsContent value="conflicts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync Conflicts</CardTitle>
              <CardDescription>
                Conflicts detected between platform and Booksy data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Conflict</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conflicts.map((conflict) => (
                    <TableRow key={conflict.id}>
                      <TableCell>
                        <Badge variant="outline">{conflict.entityType}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {conflict.entityId || conflict.booksyEntityId || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{conflict.conflictType.replace('_', ' ')}</span>
                      </TableCell>
                      <TableCell>{formatDate(conflict.createdAt)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={conflict.resolutionStatus === 'pending' ? 'destructive' : 'default'}
                        >
                          {conflict.resolutionStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedConflict(conflict)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {conflict.resolutionStatus === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResolveConflict(conflict.id, 'platform')}
                              >
                                Platform
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResolveConflict(conflict.id, 'booksy')}
                              >
                                Booksy
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync Operations Queue</CardTitle>
              <CardDescription>
                Pending and completed synchronization operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operation</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncOperations.map((operation) => (
                    <TableRow key={operation.id}>
                      <TableCell>{operation.operationType}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{operation.entityType}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(operation.status)}
                          <span>{operation.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>{operation.attempts}/{3}</TableCell>
                      <TableCell>{formatDate(operation.createdAt)}</TableCell>
                      <TableCell className="text-red-600 text-sm max-w-xs truncate">
                        {operation.error}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consent Tab */}
        <TabsContent value="consent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GDPR Consent Management</CardTitle>
              <CardDescription>
                User consent records for Booksy data synchronization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Consent Rate</span>
                  <span className="text-sm">
                    {consentRecords.length > 0
                      ? Math.round((consentRecords.filter(r => r.consentGiven).length / consentRecords.length) * 100)
                      : 0}%
                  </span>
                </div>
                <Progress
                  value={consentRecords.length > 0
                    ? (consentRecords.filter(r => r.consentGiven).length / consentRecords.length) * 100
                    : 0}
                />
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Consent Given</TableHead>
                    <TableHead>Data Types</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consentRecords.slice(0, 20).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono text-xs">
                        {record.userId.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {record.consentGiven ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span>{record.consentGiven ? 'Yes' : 'No'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {record.consentData?.dataSync && <Badge variant="outline" className="text-xs">Sync</Badge>}
                          {record.consentData?.appointmentHistory && <Badge variant="outline" className="text-xs">History</Badge>}
                          {record.consentData?.contactInfo && <Badge variant="outline" className="text-xs">Contact</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(record.timestamp)}</TableCell>
                      <TableCell className="font-mono text-xs">{record.ipAddress}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reconciliation Tab */}
        <TabsContent value="reconciliation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Reconciliation</CardTitle>
              <CardDescription>
                Daily revenue comparison between platform and Booksy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Platform Revenue</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(reconciliationData.reduce((sum, r) => sum + r.platformRevenue, 0))}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Booksy Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(reconciliationData.reduce((sum, r) => sum + r.booksyRevenue, 0))}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Discrepancy</p>
                  <p className={`text-2xl font-bold ${reconciliationData.reduce((sum, r) => sum + r.discrepancy, 0) >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                    {formatCurrency(reconciliationData.reduce((sum, r) => sum + r.discrepancy, 0))}
                  </p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Booksy</TableHead>
                    <TableHead>Discrepancy</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reconciliationData.map((row) => (
                    <TableRow key={row.date}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{formatCurrency(row.platformRevenue)}</TableCell>
                      <TableCell>{formatCurrency(row.booksyRevenue)}</TableCell>
                      <TableCell className={row.discrepancy !== 0 ? 'text-orange-600' : ''}>
                        {formatCurrency(Math.abs(row.discrepancy))}
                        {row.discrepancy !== 0 && (
                          <span className="ml-1 text-xs">
                            {row.discrepancy > 0 ? '(Platform higher)' : '(Booksy higher)'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={row.status === 'matched' ? 'default' : 'destructive'}
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sync Configuration</CardTitle>
                <CardDescription>
                  Configure synchronization behavior and intervals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-sync">Automatic Sync</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable automatic synchronization
                    </p>
                  </div>
                  <Switch
                    id="auto-sync"
                    checked={autoSyncEnabled}
                    onCheckedChange={setAutoSyncEnabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sync-interval">Sync Interval (minutes)</Label>
                  <Select defaultValue="5">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 minute</SelectItem>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-resolve">Auto-resolve Conflicts</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically resolve minor conflicts
                    </p>
                  </div>
                  <Switch id="auto-resolve" />
                </div>

                <Button className="w-full">Save Settings</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Retention</CardTitle>
                <CardDescription>
                  Configure data retention policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="consent-retention">Consent Records (days)</Label>
                  <Select defaultValue="365">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="1095">3 years</SelectItem>
                      <SelectItem value="1825">5 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audit-retention">Audit Logs (days)</Label>
                  <Select defaultValue="90">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full">Update Retention</Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Manual Actions</CardTitle>
              <CardDescription>
                Manual synchronization and maintenance operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button variant="outline" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </Button>
                <Button variant="outline" className="w-full">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Sync
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Conflict Resolution Dialog */}
      <Dialog open={!!selectedConflict} onOpenChange={() => setSelectedConflict(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Sync Conflict</DialogTitle>
            <DialogDescription>
              Review the conflict details and choose a resolution strategy
            </DialogDescription>
          </DialogHeader>

          {selectedConflict && (
            <div className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label>Conflict Type</Label>
                  <p className="text-sm font-medium">{selectedConflict.conflictType}</p>
                </div>

                <div>
                  <Label>Entity</Label>
                  <p className="text-sm">{selectedConflict.entityType}</p>
                </div>

                {selectedConflict.conflictData && (
                  <div>
                    <Label>Conflict Details</Label>
                    <Textarea
                      readOnly
                      value={JSON.stringify(selectedConflict.conflictData, null, 2)}
                      className="h-32 font-mono text-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedConflict(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedConflict && handleResolveConflict(selectedConflict.id, 'platform')}
            >
              Use Platform Data
            </Button>
            <Button
              onClick={() => selectedConflict && handleResolveConflict(selectedConflict.id, 'booksy')}
            >
              Use Booksy Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};