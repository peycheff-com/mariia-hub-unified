// Payment History Detail View
// Comprehensive payment history with filtering, search, and export capabilities

import React, { useState, useEffect } from 'react';
import {
  CalendarIcon,
  DownloadIcon,
  FilterIcon,
  SearchIcon,
  EyeIcon,
  ReceiptIcon,
  CreditCardIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { formatCurrency, formatDate } from '@/lib/email-templates';

interface PaymentRecord {
  id: string;
  type: 'payment' | 'refund' | 'credit_note';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  method: string;
  created_at: string;
  updated_at?: string;
  invoice_number?: string;
  booking_id?: string;
  service_name?: string;
  customer_name?: string;
  customer_email?: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface PaymentStats {
  totalRevenue: number;
  totalRefunds: number;
  netRevenue: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  averageTransactionValue: number;
}

export function PaymentHistoryView() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30');
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  // Load payment history
  useEffect(() => {
    loadPaymentHistory();
    loadPaymentStats();
  }, [dateRange]);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [payments, searchTerm, statusFilter, typeFilter, methodFilter]);

  const loadPaymentHistory = async () => {
    try {
      setLoading(true);
      const daysBack = parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data, error } = await supabase
        .from('payment_history_view')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to load payment history:', error);
        return;
      }

      setPayments(data || []);
    } catch (error) {
      logger.error('Error loading payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentStats = async () => {
    try {
      const daysBack = parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      // Calculate stats from payments data
      const { data: paymentData } = await supabase
        .from('payment_history_view')
        .select('amount, type, status')
        .gte('created_at', startDate.toISOString());

      if (!paymentData) return;

      const stats: PaymentStats = {
        totalRevenue: 0,
        totalRefunds: 0,
        netRevenue: 0,
        successfulPayments: 0,
        failedPayments: 0,
        pendingPayments: 0,
        averageTransactionValue: 0,
      };

      let successfulCount = 0;

      paymentData.forEach((payment) => {
        if (payment.type === 'payment' && payment.status === 'completed') {
          stats.totalRevenue += payment.amount;
          stats.successfulPayments++;
          successfulCount++;
        } else if (payment.type === 'refund' && payment.status === 'completed') {
          stats.totalRefunds += payment.amount;
        } else if (payment.status === 'failed') {
          stats.failedPayments++;
        } else if (payment.status === 'pending' || payment.status === 'processing') {
          stats.pendingPayments++;
        }
      });

      stats.netRevenue = stats.totalRevenue - stats.totalRefunds;
      stats.averageTransactionValue = successfulCount > 0 ? stats.totalRevenue / successfulCount : 0;

      setStats(stats);
    } catch (error) {
      logger.error('Error loading payment stats:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...payments];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (payment) =>
          payment.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((payment) => payment.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((payment) => payment.type === typeFilter);
    }

    // Apply method filter
    if (methodFilter !== 'all') {
      filtered = filtered.filter((payment) => payment.method === methodFilter);
    }

    setFilteredPayments(filtered);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, icon: ClockIcon, label: 'Pending' },
      processing: { variant: 'secondary' as const, icon: ClockIcon, label: 'Processing' },
      completed: { variant: 'default' as const, icon: CheckCircleIcon, label: 'Completed' },
      failed: { variant: 'destructive' as const, icon: XCircleIcon, label: 'Failed' },
      cancelled: { variant: 'outline' as const, icon: XCircleIcon, label: 'Cancelled' },
    };

    const config = variants[status as keyof typeof variants] || variants.pending;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <config.icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      payment: { variant: 'default' as const, icon: CreditCardIcon, label: 'Payment' },
      refund: { variant: 'secondary' as const, icon: ReceiptIcon, label: 'Refund' },
      credit_note: { variant: 'outline' as const, icon: ReceiptIcon, label: 'Credit Note' },
    };

    const config = variants[type as keyof typeof variants] || variants.payment;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <config.icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const exportData = async (format: 'csv' | 'json') => {
    try {
      setExportLoading(true);

      const data = filteredPayments;
      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'csv') {
        // Convert to CSV
        const headers = [
          'Date',
          'Type',
          'Status',
          'Method',
          'Amount',
          'Currency',
          'Invoice',
          'Customer',
          'Description',
        ];

        const rows = data.map((payment) => [
          formatDate(new Date(payment.created_at), 'en'),
          payment.type,
          payment.status,
          payment.method,
          payment.amount.toString(),
          payment.currency,
          payment.invoice_number || '',
          payment.customer_name || '',
          payment.description || '',
        ]);

        content = [headers, ...rows].map((row) => row.join(',')).join('\n');
        filename = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      } else {
        // JSON format
        content = JSON.stringify(
          {
            exportDate: new Date().toISOString(),
            dateRange: dateRange,
            totalRecords: data.length,
            payments: data,
          },
          null,
          2
        );
        filename = `payment-history-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      }

      // Download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      logger.info(`Payment history exported as ${format.toUpperCase()}`, {
        records: data.length,
        filename,
      });
    } catch (error) {
      logger.error('Failed to export payment history:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const PaymentDetailsDialog = ({ payment }: { payment: PaymentRecord }) => {
    return (
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeBadge(payment.type)}
            Payment Details
          </DialogTitle>
          <DialogDescription>
            {payment.invoice_number && `Invoice: ${payment.invoice_number}`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh]">
          <div className="space-y-6">
            {/* Status and Amount */}
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium">Status</p>
                {getStatusBadge(payment.status)}
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm font-medium">Amount</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(payment.amount, payment.currency, 'en')}
                </p>
              </div>
            </div>

            <Separator />

            {/* Payment Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date</p>
                <p>{formatDate(new Date(payment.created_at), 'en')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Method</p>
                <p className="capitalize">{payment.method.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment ID</p>
                <p className="font-mono text-xs">{payment.id}</p>
              </div>
              {payment.updated_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p>{formatDate(new Date(payment.updated_at), 'en')}</p>
                </div>
              )}
            </div>

            {/* Customer Information */}
            {(payment.customer_name || payment.customer_email) && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Customer Information</h4>
                  <div className="space-y-1">
                    {payment.customer_name && (
                      <p className="text-sm">{payment.customer_name}</p>
                    )}
                    {payment.customer_email && (
                      <p className="text-sm text-muted-foreground">{payment.customer_email}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Service Information */}
            {(payment.service_name || payment.description) && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Service Information</h4>
                  <div className="space-y-1">
                    {payment.service_name && (
                      <p className="text-sm">{payment.service_name}</p>
                    )}
                    {payment.description && (
                      <p className="text-sm text-muted-foreground">{payment.description}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Metadata */}
            {payment.metadata && Object.keys(payment.metadata).length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Additional Information</h4>
                  <div className="space-y-1">
                    {Object.entries(payment.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground capitalize">
                          {key.replace('_', ' ')}
                        </span>
                        <span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalRevenue, 'PLN', 'en')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-muted-foreground">Net Revenue</p>
              <p className="text-2xl font-bold">
                {formatCurrency(stats.netRevenue, 'PLN', 'en')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-muted-foreground">Refunds</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.totalRefunds, 'PLN', 'en')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-muted-foreground">Avg. Transaction</p>
              <p className="text-2xl font-bold">
                {formatCurrency(stats.averageTransactionValue, 'PLN', 'en')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-muted-foreground">Successful</p>
              <p className="text-2xl font-bold text-green-600">{stats.successfulPayments}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingPayments}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold text-red-600">{stats.failedPayments}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilterIcon className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="payment">Payments</SelectItem>
                <SelectItem value="refund">Refunds</SelectItem>
                <SelectItem value="credit_note">Credit Notes</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="account_credit">Account Credit</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <CalendarIcon className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportData('csv')}
                disabled={exportLoading || filteredPayments.length === 0}
              >
                <DownloadIcon className="w-4 h-4 mr-1" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportData('json')}
                disabled={exportLoading || filteredPayments.length === 0}
              >
                <DownloadIcon className="w-4 h-4 mr-1" />
                JSON
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            Showing {filteredPayments.length} of {payments.length} payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs">
                      {formatDate(new Date(payment.created_at), 'en')}
                    </TableCell>
                    <TableCell>{getTypeBadge(payment.type)}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="capitalize">
                      {payment.method.replace('_', ' ')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(payment.amount, payment.currency, 'en')}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {payment.invoice_number || '-'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{payment.customer_name || '-'}</p>
                        {payment.customer_email && (
                          <p className="text-xs text-muted-foreground">
                            {payment.customer_email}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {payment.description || payment.service_name || '-'}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPayment(payment)}
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        {selectedPayment && (
                          <PaymentDetailsDialog payment={selectedPayment} />
                        )}
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default PaymentHistoryView;