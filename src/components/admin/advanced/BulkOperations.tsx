import { useState, useEffect } from 'react';
import {
  Upload,
  Download,
  FileText,
  Database,
  Users,
  Calendar,
  Settings,
  Play,
  Pause,
  Square,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  Eye,
  Trash2,
  RefreshCw
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BulkOperation {
  id: string;
  operation_type: 'import' | 'export' | 'update' | 'delete';
  target_type: 'services' | 'bookings' | 'staff' | 'customers' | 'contacts';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  total_records: number;
  processed_records: number;
  failed_records: number;
  file_url?: string;
  parameters: any;
  error_details: any[];
  created_by?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

const BulkOperations = () => {
  const [operations, setOperations] = useState<BulkOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'operations' | 'import' | 'export'>('operations');
  const [selectedOperation, setSelectedOperation] = useState<BulkOperation | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [operationType, setOperationType] = useState<'import' | 'export' | 'update'>('import');
  const [targetType, setTargetType] = useState<string>('services');
  const { toast } = useToast();

  const [operationConfig, setOperationConfig] = useState({
    headers: true,
    skip_empty: true,
    update_mode: 'update_existing' as 'update_existing' | 'create_only',
    export_format: 'csv' as 'csv' | 'xlsx' | 'json',
    date_range: {
      from: '',
      to: ''
    },
    filters: {} as any
  });

  const TARGET_TYPES = [
    { value: 'services', label: 'Services', icon: <FileText className="w-4 h-4" /> },
    { value: 'bookings', label: 'Bookings', icon: <Calendar className="w-4 h-4" /> },
    { value: 'staff', label: 'Staff Members', icon: <Users className="w-4 h-4" /> },
    { value: 'customers', label: 'Customers', icon: <Users className="w-4 h-4" /> },
    { value: 'contacts', label: 'Contacts', icon: <Database className="w-4 h-4" /> }
  ];

  const SAMPLE_TEMPLATES = {
    services: [
      ['Title', 'Description', 'Category', 'Price From', 'Price To', 'Duration', 'Location'],
      ['Lip Blush', 'Natural lip enhancement', 'lips', '1500', '2000', '120', 'studio'],
      ['Microblading', 'Eyebrow enhancement', 'eyebrows', '1200', '1800', '180', 'studio']
    ],
    bookings: [
      ['Client Name', 'Client Email', 'Service', 'Date', 'Time', 'Status'],
      ['Anna Kowalska', 'anna@example.com', 'Lip Blush', '2024-01-25', '14:00', 'confirmed']
    ],
    staff: [
      ['First Name', 'Last Name', 'Email', 'Phone', 'Role', 'Skills', 'Employment Type'],
      ['John', 'Doe', 'john@example.com', '+48123456789', 'Staff', 'beauty,fitness', 'full_time']
    ]
  };

  useEffect(() => {
    loadOperations();
  }, []);

  const loadOperations = async () => {
    try {
      const { data, error } = await supabase
        .from('bulk_operations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOperations(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/json'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Error',
          description: 'Please upload a CSV, Excel, or JSON file',
          variant: 'destructive'
        });
        return;
      }
      setUploadFile(file);
    }
  };

  const handleStartOperation = async () => {
    if (operationType === 'import' && !uploadFile) {
      toast({
        title: 'Error',
        description: 'Please select a file to import',
        variant: 'destructive'
      });
      return;
    }

    try {
      const operationData = {
        operation_type: operationType,
        target_type: targetType,
        status: 'pending',
        total_records: 0,
        processed_records: 0,
        failed_records: 0,
        parameters: {
          ...operationConfig,
          file_name: uploadFile?.name,
          file_size: uploadFile?.size
        },
        error_details: []
      };

      const { data, error } = await supabase
        .from('bulk_operations')
        .insert(operationData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Bulk operation created successfully'
      });

      setDialogOpen(false);
      setUploadFile(null);
      loadOperations();

      // Start processing (in real implementation, this would trigger a background job)
      processOperation(data.id);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const processOperation = async (operationId: string) => {
    // Simulate processing
    let progress = 0;
    const totalRecords = Math.floor(Math.random() * 100) + 50;

    const interval = setInterval(async () => {
      progress += Math.floor(Math.random() * 10) + 1;
      const processedRecords = Math.min(progress, totalRecords);
      const status = processedRecords >= totalRecords ? 'completed' : 'processing';

      await supabase
        .from('bulk_operations')
        .update({
          status,
          total_records: totalRecords,
          processed_records: processedRecords,
          started_at: status === 'processing' ? new Date().toISOString() : undefined,
          completed_at: status === 'completed' ? new Date().toISOString() : undefined
        })
        .eq('id', operationId);

      if (status === 'completed') {
        clearInterval(interval);
        loadOperations();
      }
    }, 1000);
  };

  const handleCancelOperation = async (operationId: string) => {
    try {
      const { error } = await supabase
        .from('bulk_operations')
        .update({ status: 'cancelled' })
        .eq('id', operationId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Operation cancelled'
      });

      loadOperations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDeleteOperation = async (operationId: string) => {
    if (!confirm('Are you sure you want to delete this operation?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('bulk_operations')
        .delete()
        .eq('id', operationId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Operation deleted'
      });

      loadOperations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleExport = async () => {
    try {
      // Generate template or export data
      const template = SAMPLE_TEMPLATES[targetType as keyof typeof SAMPLE_TEMPLATES] || [];
      const csv = template.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template-${targetType}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Template downloaded successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-sage" />;
      case 'processing': return <RefreshCw className="w-4 h-4 text-champagne animate-spin" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'cancelled': return <Square className="w-4 h-4 text-pearl/40" />;
      default: return <Clock className="w-4 h-4 text-pearl/40" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-sage/20 text-sage border-sage/30';
      case 'processing': return 'bg-champagne/20 text-champagne border-champagne/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'cancelled': return 'bg-pearl/20 text-pearl border-pearl/30';
      default: return 'bg-graphite/20 text-pearl border-graphite/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-champagne" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-serif text-pearl flex items-center gap-3">
                <Zap className="w-6 h-6 text-champagne" />
                Bulk Operations
              </CardTitle>
              <p className="text-pearl/60 mt-2">
                Import, export, and update data in bulk with progress tracking
              </p>
            </div>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-champagne text-charcoal hover:bg-champagne/90"
            >
              <Upload className="w-4 h-4 mr-2" />
              New Operation
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="glass-card p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Database className="w-5 h-5 text-champagne" />
              <span className="text-2xl font-bold text-pearl">{operations.length}</span>
            </div>
            <p className="text-sm text-pearl/60">Total Operations</p>
            <p className="text-xs text-pearl/40">All time</p>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <RefreshCw className="w-5 h-5 text-champagne" />
              <span className="text-2xl font-bold text-pearl">
                {operations.filter(o => o.status === 'processing').length}
              </span>
            </div>
            <p className="text-sm text-pearl/60">Processing</p>
            <p className="text-xs text-pearl/40">In progress</p>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <CheckCircle className="w-5 h-5 text-sage" />
              <span className="text-2xl font-bold text-pearl">
                {operations.filter(o => o.status === 'completed').length}
              </span>
            </div>
            <p className="text-sm text-pearl/60">Completed</p>
            <p className="text-xs text-pearl/40">Successfully</p>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="text-2xl font-bold text-pearl">
                {operations.filter(o => o.status === 'failed').length}
              </span>
            </div>
            <p className="text-sm text-pearl/60">Failed</p>
            <p className="text-xs text-pearl/40">Need attention</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="glass-card p-1">
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Operations
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="space-y-4">
          <Card className="glass-card">
            <Table>
              <TableHeader>
                <TableRow className="border-pearl/10">
                  <TableHead className="text-pearl">Operation</TableHead>
                  <TableHead className="text-pearl">Type</TableHead>
                  <TableHead className="text-pearl">Target</TableHead>
                  <TableHead className="text-pearl">Progress</TableHead>
                  <TableHead className="text-pearl">Status</TableHead>
                  <TableHead className="text-pearl">Created</TableHead>
                  <TableHead className="text-pearl text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operations.map((operation) => (
                  <TableRow key={operation.id} className="border-pearl/5">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-pearl">
                          {operation.operation_type.charAt(0).toUpperCase() + operation.operation_type.slice(1)} Operation
                        </div>
                        {operation.parameters?.file_name && (
                          <div className="text-sm text-pearl/60">{operation.parameters.file_name}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {operation.operation_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {TARGET_TYPES.find(t => t.value === operation.target_type)?.icon}
                        <span className="capitalize text-pearl">
                          {operation.target_type}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-pearl/60">
                            {operation.processed_records} / {operation.total_records || 0}
                          </span>
                          <span className="text-pearl">
                            {operation.total_records > 0
                              ? Math.round((operation.processed_records / operation.total_records) * 100)
                              : 0}%
                          </span>
                        </div>
                        <Progress
                          value={operation.total_records > 0
                            ? (operation.processed_records / operation.total_records) * 100
                            : 0}
                          className="h-2"
                        />
                        {operation.failed_records > 0 && (
                          <div className="text-xs text-red-400">
                            {operation.failed_records} failed
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(operation.status)}
                        <Badge className={getStatusColor(operation.status)}>
                          {operation.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-pearl/60">
                        {new Date(operation.created_at).toLocaleDateString()}
                        <div className="text-xs">
                          {new Date(operation.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedOperation(operation);
                            setPreviewDialogOpen(true);
                          }}
                          className="text-pearl hover:bg-pearl/10"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {operation.status === 'processing' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancelOperation(operation.id)}
                            className="text-bronze hover:bg-bronze/10"
                          >
                            <Square className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteOperation(operation.id)}
                          className="text-red-400 hover:bg-red-400/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card className="glass-card p-6">
            <h3 className="text-lg font-medium text-pearl mb-4">Import Data</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-pearl/70">Target Type</Label>
                <Select value={targetType} onValueChange={setTargetType}>
                  <SelectTrigger className="bg-cocoa/20 border-pearl/20 text-pearl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          {type.icon}
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-pearl/70">Upload File</Label>
                <div className="mt-2 border-2 border-dashed border-pearl/20 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-pearl/40 mx-auto mb-2" />
                  <p className="text-pearl/60 mb-2">
                    Drop your CSV, Excel, or JSON file here
                  </p>
                  <Input
                    type="file"
                    accept=".csv,.xlsx,.xls,.json"
                    onChange={handleFileUpload}
                    className="max-w-xs mx-auto"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setDialogOpen(true)}
                  className="flex-1 bg-champagne text-charcoal hover:bg-champagne/90"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Start Import
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExport}
                  className="border-pearl/20 text-pearl hover:bg-cocoa/50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card className="glass-card p-6">
            <h3 className="text-lg font-medium text-pearl mb-4">Export Data</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-pearl/70">Export Type</Label>
                  <Select>
                    <SelectTrigger className="bg-cocoa/20 border-pearl/20 text-pearl">
                      <SelectValue placeholder="Select data to export" />
                    </SelectTrigger>
                    <SelectContent>
                      {TARGET_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            {type.icon}
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-pearl/70">Format</Label>
                  <Select defaultValue="csv">
                    <SelectTrigger className="bg-cocoa/20 border-pearl/20 text-pearl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">Excel</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-pearl/70">Date From</Label>
                  <Input
                    type="date"
                    className="bg-cocoa/20 border-pearl/20 text-pearl"
                  />
                </div>
                <div>
                  <Label className="text-pearl/70">Date To</Label>
                  <Input
                    type="date"
                    className="bg-cocoa/20 border-pearl/20 text-pearl"
                  />
                </div>
              </div>

              <Button className="w-full bg-champagne text-charcoal hover:bg-champagne/90">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Operation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif text-pearl">
              Create Bulk Operation
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <Label className="text-pearl/70">Operation Type</Label>
              <Select value={operationType} onValueChange={(v: any) => setOperationType(v)}>
                <SelectTrigger className="bg-cocoa/20 border-pearl/20 text-pearl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="import">Import Data</SelectItem>
                  <SelectItem value="export">Export Data</SelectItem>
                  <SelectItem value="update">Update Records</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-pearl/70">Target Type</Label>
              <Select value={targetType} onValueChange={setTargetType}>
                <SelectTrigger className="bg-cocoa/20 border-pearl/20 text-pearl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        {type.icon}
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {operationType === 'import' && (
              <div>
                <Label className="text-pearl/70">Select File</Label>
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls,.json"
                  onChange={handleFileUpload}
                  className="bg-cocoa/20 border-pearl/20 text-pearl"
                />
                {uploadFile && (
                  <p className="text-sm text-pearl/60 mt-2">
                    Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-pearl/70">Options</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={operationConfig.headers}
                    onChange={(e) => setOperationConfig({
                      ...operationConfig,
                      headers: e.target.checked
                    })}
                  />
                  <span className="text-sm text-pearl/80">First row contains headers</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={operationConfig.skip_empty}
                    onChange={(e) => setOperationConfig({
                      ...operationConfig,
                      skip_empty: e.target.checked
                    })}
                  />
                  <span className="text-sm text-pearl/80">Skip empty rows</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1 border-pearl/20 text-pearl hover:bg-cocoa/50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStartOperation}
                className="flex-1 bg-champagne text-charcoal hover:bg-champagne/90"
              >
                Start Operation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="glass-card max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif text-pearl">
              Operation Details
            </DialogTitle>
          </DialogHeader>

          {selectedOperation && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-pearl/70">Operation Type</Label>
                  <p className="text-pear capitalize">{selectedOperation.operation_type}</p>
                </div>
                <div>
                  <Label className="text-pearl/70">Target</Label>
                  <p className="text-pear capitalize">{selectedOperation.target_type}</p>
                </div>
                <div>
                  <Label className="text-pearl/70">Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedOperation.status)}
                    <span className="capitalize text-pearl">{selectedOperation.status}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-pearl/70">Created</Label>
                  <p className="text-pearl/80">
                    {new Date(selectedOperation.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-pearl/70">Progress</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-pearl/60">
                      {selectedOperation.processed_records} / {selectedOperation.total_records} records
                    </span>
                    <span className="text-pearl">
                      {selectedOperation.total_records > 0
                        ? Math.round((selectedOperation.processed_records / selectedOperation.total_records) * 100)
                        : 0}%
                    </span>
                  </div>
                  <Progress
                    value={selectedOperation.total_records > 0
                      ? (selectedOperation.processed_records / selectedOperation.total_records) * 100
                      : 0}
                    className="h-3"
                  />
                  {selectedOperation.failed_records > 0 && (
                    <p className="text-sm text-red-400">
                      {selectedOperation.failed_records} records failed
                    </p>
                  )}
                </div>
              </div>

              {selectedOperation.error_details && selectedOperation.error_details.length > 0 && (
                <div>
                  <Label className="text-pearl/70">Error Details</Label>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {selectedOperation.error_details.map((error, index) => (
                      <div key={index} className="p-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setPreviewDialogOpen(false)}
                  className="flex-1 border-pearl/20 text-pearl hover:bg-cocoa/50"
                >
                  Close
                </Button>
                {selectedOperation.status === 'processing' && (
                  <Button
                    onClick={() => handleCancelOperation(selectedOperation.id)}
                    className="flex-1 bg-bronze text-white hover:bg-bronze/90"
                  >
                    Cancel Operation
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BulkOperations;