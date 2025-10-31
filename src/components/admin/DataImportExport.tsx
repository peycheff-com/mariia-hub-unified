import React, { useState, useRef } from 'react';
import { CalendarIcon, DownloadIcon, UploadIcon, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { format, subDays, addDays } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { dataImportExportService, ImportResult, ExportOptions } from '@/services/dataImportExport.service';
import { cn } from '@/lib/utils';

interface DataImportExportProps {
  className?: string;
}

export const DataImportExport: React.FC<DataImportExportProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setImportFile(file);
      setImportResult(null);
    } else {
      toast({
        title: 'Invalid file type',
        description: 'Please select a CSV file',
        variant: 'destructive'
      });
    }
  };

  // Handle import
  const handleImport = async (dryRun = false) => {
    if (!importFile) return;

    setIsImporting(true);
    try {
      const result = await dataImportExportService.importBookings(importFile, {
        skipDuplicates: true,
        updateExisting: true,
        dryRun
      });

      setImportResult(result);

      // Show summary toast
      toast({
        title: dryRun ? 'Import Preview' : 'Import Complete',
        description: dryRun
          ? `Found ${result.totalRows} records ready to import`
          : `Successfully imported ${result.successful} of ${result.totalRows} records`,
        variant: result.failed > 0 ? 'destructive' : 'default'
      });
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await dataImportExportService.exportBookings(exportOptions);

      // Download file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookings-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Export complete',
        description: 'Bookings exported successfully'
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Download template
  const downloadTemplate = () => {
    const blob = dataImportExportService.generateImportTemplate();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'booking-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn('space-y-6', className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Data Import/Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'import' | 'export')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="import" className="flex items-center gap-2">
                <UploadIcon className="w-4 h-4" />
                Import from CSV
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center gap-2">
                <DownloadIcon className="w-4 h-4" />
                Export to CSV
              </TabsTrigger>
            </TabsList>

            {/* Import Tab */}
            <TabsContent value="import" className="space-y-4 mt-4">
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertTitle>Import Instructions</AlertTitle>
                <AlertDescription>
                  1. Download the template below<br />
                  2. Fill in your booking data<br />
                  3. Save as CSV file<br />
                  4. Upload and import
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="template">Step 1: Download Template</Label>
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="w-full sm:w-auto"
                >
                  <DownloadIcon className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Step 2: Upload Your CSV File</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
              </div>

              {importFile && (
                <div className="space-y-3">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">
                      Selected file: <strong>{importFile.name}</strong> ({(importFile.size / 1024).toFixed(1)} KB)
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      onClick={() => handleImport(true)}
                      disabled={isImporting}
                    >
                      Preview Import
                    </Button>
                    <Button
                      onClick={() => handleImport(false)}
                      disabled={isImporting}
                    >
                      {isImporting ? 'Importing...' : 'Import Bookings'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Import Results */}
              {importResult && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {importResult.successful}
                        </p>
                        <p className="text-sm text-muted-foreground">Successful</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {importResult.duplicates}
                        </p>
                        <p className="text-sm text-muted-foreground">Duplicates</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-red-600">
                          {importResult.failed}
                        </p>
                        <p className="text-sm text-muted-foreground">Failed</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold">
                          {importResult.totalRows}
                        </p>
                        <p className="text-sm text-muted-foreground">Total</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Errors */}
                  {importResult.errors.length > 0 && (
                    <Alert variant="destructive">
                      <XCircle className="w-4 h-4" />
                      <AlertTitle>Import Errors</AlertTitle>
                      <AlertDescription>
                        <div className="mt-2 max-h-60 overflow-y-auto">
                          {importResult.errors.slice(0, 10).map((error, index) => (
                            <div key={index} className="text-sm">
                              Row {error.row}: {error.field} - {error.error}
                            </div>
                          ))}
                          {importResult.errors.length > 10 && (
                            <p className="text-sm mt-2">
                              ... and {importResult.errors.length - 10} more errors
                            </p>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Warnings */}
                  {importResult.warnings.length > 0 && (
                    <Alert>
                      <AlertTriangle className="w-4 h-4" />
                      <AlertTitle>Import Warnings</AlertTitle>
                      <AlertDescription>
                        <div className="mt-2 max-h-60 overflow-y-auto">
                          {importResult.warnings.slice(0, 10).map((warning, index) => (
                            <div key={index} className="text-sm">
                              Row {warning.row}: {warning.field} - {warning.warning}
                            </div>
                          ))}
                          {importResult.warnings.length > 10 && (
                            <p className="text-sm mt-2">
                              ... and {importResult.warnings.length - 10} more warnings
                            </p>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Export Tab */}
            <TabsContent value="export" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Calendar
                    mode="single"
                    selected={exportOptions.startDate}
                    onSelect={(date) => setExportOptions(prev => ({ ...prev, startDate: date }))}
                    className="rounded-md border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Calendar
                    mode="single"
                    selected={exportOptions.endDate}
                    onSelect={(date) => setExportOptions(prev => ({ ...prev, endDate: date }))}
                    className="rounded-md border"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="includeClients"
                    checked={exportOptions.includeClients}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeClients: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="includeClients">Include client information</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="includeServices"
                    checked={exportOptions.includeServices}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeServices: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="includeServices">Include service details</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="includeWaitlist"
                    checked={exportOptions.includeWaitlist}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeWaitlist: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="includeWaitlist">Include waitlist entries</Label>
                </div>
              </div>

              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full sm:w-auto"
              >
                {isExporting ? 'Exporting...' : 'Export Bookings'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};