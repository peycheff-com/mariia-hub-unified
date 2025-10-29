import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { depositService, DepositRule, DepositCalculation } from '@/services/depositService';
import { depositRefundService } from '@/services/depositRefundService';


interface DepositAnalytics {
  totalDeposits: number;
  totalRefunded: number;
  totalForfeited: number;
  depositCount: number;
  refundCount: number;
  forfeitCount: number;
  byServiceType: Record<string, {
    total: number;
    refunded: number;
    forfeited: number;
    count: number;
  }>;
  averageDepositAmount: number;
  refundRate: number;
}

export const DepositManagement: React.FC = () => {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState<DepositAnalytics | null>(null);
  const [rules, setRules] = useState<DepositRule[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRule, setSelectedRule] = useState<DepositRule | null>(null);
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  // Form state for new/edit rule
  const [ruleForm, setRuleForm] = useState({
    service_type: 'beauty' as const,
    price_min: '',
    price_max: '',
    deposit_type: 'percentage' as const,
    deposit_amount: '',
    max_deposit_amount: '',
    refund_policy: 'refundable' as const,
    days_before_refund: '7',
    apply_within_days: '',
    min_group_size: '',
    priority: '0'
  });

  useEffect(() => {
    loadAnalytics();
    loadRules();
    loadTransactions();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      const data = await depositService.getDepositAnalytics({
        start: new Date(dateRange.start),
        end: new Date(dateRange.end)
      });
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const loadRules = async () => {
    try {
      const data = await depositService.getDepositRules();
      setRules(data);
    } catch (error) {
      console.error('Failed to load rules:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      // Load recent deposit transactions
      const { data, error } = await supabase
        .from('deposit_transactions')
        .select(`
          *,
          bookings!inner(
            client_name,
            client_email,
            booking_date,
            services!inner(
              title,
              service_type
            )
          )
        `)
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end + 'T23:59:59')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setTransactions(data);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async () => {
    try {
      const ruleData = {
        ...ruleForm,
        price_min: ruleForm.price_min ? parseFloat(ruleForm.price_min) : null,
        price_max: ruleForm.price_max ? parseFloat(ruleForm.price_max) : null,
        deposit_amount: parseFloat(ruleForm.deposit_amount),
        max_deposit_amount: ruleForm.max_deposit_amount ? parseFloat(ruleForm.max_deposit_amount) : null,
        days_before_refund: parseInt(ruleForm.days_before_refund),
        apply_within_days: ruleForm.apply_within_days ? parseInt(ruleForm.apply_within_days) : null,
        min_group_size: ruleForm.min_group_size ? parseInt(ruleForm.min_group_size) : null,
        priority: parseInt(ruleForm.priority)
      };

      if (selectedRule) {
        await depositService.upsertDepositRule({ ...ruleData, id: selectedRule.id });
      } else {
        await depositService.upsertDepositRule(ruleData);
      }

      setShowRuleDialog(false);
      setSelectedRule(null);
      resetRuleForm();
      loadRules();
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      try {
        await depositService.deleteDepositRule(ruleId);
        loadRules();
      } catch (error) {
        console.error('Failed to delete rule:', error);
      }
    }
  };

  const resetRuleForm = () => {
    setRuleForm({
      service_type: 'beauty',
      price_min: '',
      price_max: '',
      deposit_type: 'percentage',
      deposit_amount: '',
      max_deposit_amount: '',
      refund_policy: 'refundable',
      days_before_refund: '7',
      apply_within_days: '',
      min_group_size: '',
      priority: '0'
    });
  };

  const handleEditRule = (rule: DepositRule) => {
    setSelectedRule(rule);
    setRuleForm({
      service_type: rule.service_type,
      price_min: rule.price_min?.toString() || '',
      price_max: rule.price_max?.toString() || '',
      deposit_type: rule.deposit_type,
      deposit_amount: rule.deposit_amount.toString(),
      max_deposit_amount: rule.max_deposit_amount?.toString() || '',
      refund_policy: rule.refund_policy,
      days_before_refund: rule.days_before_refund.toString(),
      apply_within_days: rule.apply_within_days?.toString() || '',
      min_group_size: rule.min_group_size?.toString() || '',
      priority: rule.priority.toString()
    });
    setShowRuleDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-pearl">Deposit Management</h1>
          <p className="text-pearl/60 mt-1">Manage deposit rules and track transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAnalytics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { setSelectedRule(null); resetRuleForm(); }}>
                <Shield className="w-4 h-4 mr-2" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedRule ? 'Edit Deposit Rule' : 'Create Deposit Rule'}
                </DialogTitle>
                <DialogDescription>
                  Configure when and how deposits are applied to bookings
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Service Type</Label>
                  <Select
                    value={ruleForm.service_type}
                    onValueChange={(value: any) => setRuleForm(prev => ({ ...prev, service_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beauty">Beauty</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="lifestyle">Lifestyle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Priority</Label>
                  <Input
                    type="number"
                    value={ruleForm.priority}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, priority: e.target.value }))}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label>Minimum Price (PLN)</Label>
                  <Input
                    type="number"
                    value={ruleForm.price_min}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, price_min: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <Label>Maximum Price (PLN)</Label>
                  <Input
                    type="number"
                    value={ruleForm.price_max}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, price_max: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <Label>Deposit Type</Label>
                  <Select
                    value={ruleForm.deposit_type}
                    onValueChange={(value: any) => setRuleForm(prev => ({ ...prev, deposit_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>
                    {ruleForm.deposit_type === 'fixed' ? 'Deposit Amount (PLN)' : 'Deposit (%)'}
                  </Label>
                  <Input
                    type="number"
                    value={ruleForm.deposit_amount}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, deposit_amount: e.target.value }))}
                    placeholder={ruleForm.deposit_type === 'fixed' ? '200' : '20'}
                  />
                </div>

                {ruleForm.deposit_type === 'percentage' && (
                  <div>
                    <Label>Maximum Deposit (PLN)</Label>
                    <Input
                      type="number"
                      value={ruleForm.max_deposit_amount}
                      onChange={(e) => setRuleForm(prev => ({ ...prev, max_deposit_amount: e.target.value }))}
                      placeholder="Optional cap"
                    />
                  </div>
                )}

                <div>
                  <Label>Refund Policy</Label>
                  <Select
                    value={ruleForm.refund_policy}
                    onValueChange={(value: any) => setRuleForm(prev => ({ ...prev, refund_policy: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="refundable">Fully Refundable</SelectItem>
                      <SelectItem value="partial">Partial Refund</SelectItem>
                      <SelectItem value="non_refundable">Non-refundable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Days Before Refund</Label>
                  <Input
                    type="number"
                    value={ruleForm.days_before_refund}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, days_before_refund: e.target.value }))}
                    placeholder="7"
                  />
                </div>

                <div>
                  <Label>Apply Within Days</Label>
                  <Input
                    type="number"
                    value={ruleForm.apply_within_days}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, apply_within_days: e.target.value }))}
                    placeholder="Only for last-minute bookings"
                  />
                </div>

                <div>
                  <Label>Minimum Group Size</Label>
                  <Input
                    type="number"
                    value={ruleForm.min_group_size}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, min_group_size: e.target.value }))}
                    placeholder="For group bookings"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowRuleDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveRule}>
                  {selectedRule ? 'Update' : 'Create'} Rule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div>
              <Label>From</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div>
              <Label>To</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Deposits</CardDescription>
              <CardTitle className="text-2xl">
                {depositService.formatDepositAmount(analytics.totalDeposits)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-pearl/60">
                {analytics.depositCount} transactions
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Refunded</CardDescription>
              <CardTitle className="text-2xl text-green-600">
                {depositService.formatDepositAmount(analytics.totalRefunded)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-pearl/60">
                {analytics.refundCount} refunds
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Forfeited</CardDescription>
              <CardTitle className="text-2xl text-red-600">
                {depositService.formatDepositAmount(analytics.totalForfeited)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-pearl/60">
                {analytics.forfeitCount} forfeited
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Refund Rate</CardDescription>
              <CardTitle className="text-2xl">
                {analytics.refundRate.toFixed(1)}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-pearl/60">
                Avg deposit: {depositService.formatDepositAmount(analytics.averageDepositAmount)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="rules" className="w-full">
        <TabsList>
          <TabsTrigger value="rules">Deposit Rules</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Active Deposit Rules</CardTitle>
              <CardDescription>
                Rules are applied in order of priority (highest first)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Price Range</TableHead>
                    <TableHead>Deposit</TableHead>
                    <TableHead>Refund Policy</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="capitalize">{rule.service_type}</TableCell>
                      <TableCell>
                        {rule.price_min && rule.price_max
                          ? `${rule.price_min} - ${rule.price_max} PLN`
                          : rule.price_min
                          ? `≥ ${rule.price_min} PLN`
                          : 'All prices'
                        }
                      </TableCell>
                      <TableCell>
                        {rule.deposit_type === 'fixed'
                          ? `${rule.deposit_amount} PLN`
                          : `${rule.deposit_amount}%`
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          rule.refund_policy === 'refundable' ? 'default' :
                          rule.refund_policy === 'partial' ? 'secondary' : 'destructive'
                        }>
                          {rule.refund_policy}
                        </Badge>
                      </TableCell>
                      <TableCell>{rule.priority}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleEditRule(rule)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteRule(rule.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Deposit Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Deposit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Refund</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(new Date(transaction.created_at), 'dd MMM yyyy', { locale: pl })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.bookings.client_name}</div>
                          <div className="text-sm text-pearl/60">{transaction.bookings.client_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.bookings.services.title}</div>
                          <div className="text-sm text-pearl/60 capitalize">
                            {transaction.bookings.services.service_type}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {depositService.formatDepositAmount(transaction.deposit_amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          transaction.deposit_status === 'paid' ? 'default' :
                          transaction.deposit_status === 'refunded' ? 'secondary' :
                          transaction.deposit_status === 'forfeited' ? 'destructive' : 'outline'
                        }>
                          {transaction.deposit_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transaction.refund_amount > 0
                          ? depositService.formatDepositAmount(transaction.refund_amount)
                          : '-'
                        }
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Deposit Analytics by Service Type</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics && Object.entries(analytics.byServiceType).map(([serviceType, data]) => (
                <div key={serviceType} className="mb-4">
                  <h3 className="text-lg font-semibold capitalize mb-2">{serviceType}</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-pearl/60">Total Deposits</div>
                      <div className="font-semibold">
                        {depositService.formatDepositAmount(data.total)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-pearl/60">Refunded</div>
                      <div className="font-semibold text-green-600">
                        {depositService.formatDepositAmount(data.refunded)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-pearl/60">Forfeited</div>
                      <div className="font-semibold text-red-600">
                        {depositService.formatDepositAmount(data.forfeited)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-pearl/60">Transactions</div>
                      <div className="font-semibold">{data.count}</div>
                    </div>
                  </div>
                  <Separator className="mt-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};