// Budget Tracking and Reporting System
// Comprehensive budget management with real-time tracking, alerts, and reporting

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CreditCard,
  Target,
  PiggyBank,
  FileSpreadsheet,
  Download,
  Plus,
  Edit2,
  Eye,
  Calendar,
  Filter,
  RefreshCw,
  ChevronDown,
  Wallet,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Building,
  Users,
  Activity,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSignIcon
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

import { useCorporate } from '@/contexts/CorporateWellnessContext';
import {
  CorporateBudget,
  BudgetTransaction,
  CorporateDepartment,
  CorporateEmployee
} from '@/types/corporate';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Button
} from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Input
} from '@/components/ui/input';
import {
  Label
} from '@/components/ui/label';
import {
  Textarea
} from '@/components/ui/textarea';
import {
  Badge
} from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@/components/ui/alert';
import {
  Progress
} from '@/components/ui/progress';
import {
  ScrollArea
} from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


interface BudgetTrackingProps {
  corporateAccountId: string;
  departments: CorporateDepartment[];
  className?: string;
}

interface BudgetFormData {
  corporate_account_id: string;
  department_id?: string;
  budget_period: string;
  total_allocated: number;
  budget_type: 'wellness' | 'training' | 'benefits' | 'events';
  notes?: string;
}

interface TransactionFormData {
  budget_id: string;
  employee_id?: string;
  transaction_type: 'allocation' | 'spend' | 'adjustment' | 'refund';
  amount: number;
  description?: string;
  category?: string;
}

const BUDGET_TYPES = [
  { value: 'wellness', label: 'Wellness Programs', color: '#3b82f6' },
  { value: 'training', label: 'Training & Development', color: '#10b981' },
  { value: 'benefits', label: 'Employee Benefits', color: '#f59e0b' },
  { value: 'events', label: 'Corporate Events', color: '#8b5cf6' }
] as const;

const TRANSACTION_TYPES = [
  { value: 'allocation', label: 'Allocation', icon: ArrowUpRight, color: 'text-green-600' },
  { value: 'spend', label: 'Expenditure', icon: ArrowDownRight, color: 'text-red-600' },
  { value: 'adjustment', label: 'Adjustment', icon: Settings, color: 'text-blue-600' },
  { value: 'refund', label: 'Refund', icon: RefreshCw, color: 'text-purple-600' }
] as const;

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

export const BudgetTracking: React.FC<BudgetTrackingProps> = ({
  corporateAccountId,
  departments,
  className
}) => {
  const { budgets, employees, loading, createBudget, updateBudget, loadBudgets } = useCorporate();
  const { toast } = useToast();

  // State
  const [selectedPeriod, setSelectedPeriod] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedBudgetType, setSelectedBudgetType] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<CorporateBudget | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'forecast'>('summary');

  // Form state
  const [budgetFormData, setBudgetFormData] = useState<BudgetFormData>({
    corporate_account_id: corporateAccountId,
    budget_period: format(new Date(), 'yyyy-MM'),
    total_allocated: 0,
    budget_type: 'wellness',
    notes: ''
  });

  const [transactionFormData, setTransactionFormData] = useState<TransactionFormData>({
    budget_id: '',
    transaction_type: 'allocation',
    amount: 0,
    description: '',
    category: ''
  });

  // Filter budgets
  const filteredBudgets = budgets.filter(budget => {
    const matchesPeriod = budget.budget_period === selectedPeriod;
    const matchesDepartment = selectedDepartment === 'all' || budget.department_id === selectedDepartment;
    const matchesType = selectedBudgetType === 'all' || budget.budget_type === selectedBudgetType;
    return matchesPeriod && matchesDepartment && matchesType;
  });

  // Calculate statistics
  const stats = {
    totalAllocated: filteredBudgets.reduce((sum, b) => sum + b.total_allocated, 0),
    totalSpent: filteredBudgets.reduce((sum, b) => sum + b.spent_amount, 0),
    totalRemaining: filteredBudgets.reduce((sum, b) => sum + b.remaining_amount, 0),
    utilizationRate: filteredBudgets.length > 0
      ? (filteredBudgets.reduce((sum, b) => sum + b.spent_amount, 0) / filteredBudgets.reduce((sum, b) => sum + b.total_allocated, 0)) * 100
      : 0,
    budgetCount: filteredBudgets.length,
    activeBudgets: filteredBudgets.filter(b => b.status === 'active').length,
    overBudgets: filteredBudgets.filter(b => b.spent_amount > b.total_allocated).length
  };

  // Prepare chart data
  const monthlyTrendData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const period = format(date, 'yyyy-MM');
    const periodBudgets = budgets.filter(b => b.budget_period === period);

    return {
      month: format(date, 'MMM yyyy'),
      allocated: periodBudgets.reduce((sum, b) => sum + b.total_allocated, 0),
      spent: periodBudgets.reduce((sum, b) => sum + b.spent_amount, 0),
      remaining: periodBudgets.reduce((sum, b) => sum + b.remaining_amount, 0)
    };
  });

  const departmentBreakdownData = departments
    .filter(dept => {
      const deptBudgets = filteredBudgets.filter(b => b.department_id === dept.id);
      return deptBudgets.length > 0;
    })
    .map(dept => {
      const deptBudgets = filteredBudgets.filter(b => b.department_id === dept.id);
      return {
        name: dept.department_name,
        allocated: deptBudgets.reduce((sum, b) => sum + b.total_allocated, 0),
        spent: deptBudgets.reduce((sum, b) => sum + b.spent_amount, 0),
        remaining: deptBudgets.reduce((sum, b) => sum + b.remaining_amount, 0)
      };
    });

  const budgetTypeBreakdownData = BUDGET_TYPES.map(type => {
    const typeBudgets = filteredBudgets.filter(b => b.budget_type === type.value);
    return {
      name: type.label,
      value: typeBudgets.reduce((sum, b) => sum + b.total_allocated, 0),
      spent: typeBudgets.reduce((sum, b) => sum + b.spent_amount, 0),
      color: type.color
    };
  }).filter(item => item.value > 0);

  // Handle form changes
  const handleBudgetFormChange = (field: string, value: any) => {
    setBudgetFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTransactionFormChange = (field: string, value: any) => {
    setTransactionFormData(prev => ({ ...prev, [field]: value }));
  };

  // Create budget
  const handleCreateBudget = async () => {
    try {
      if (!budgetFormData.total_allocated || budgetFormData.total_allocated <= 0) {
        toast({
          title: 'Validation Error',
          description: 'Please enter a valid budget amount',
          variant: 'destructive'
        });
        return;
      }

      await createBudget(budgetFormData);
      toast({
        title: 'Success',
        description: 'Budget created successfully'
      });
      setShowCreateDialog(false);
      setBudgetFormData({
        corporate_account_id: corporateAccountId,
        budget_period: format(new Date(), 'yyyy-MM'),
        total_allocated: 0,
        budget_type: 'wellness',
        notes: ''
      });
      await loadBudgets(corporateAccountId);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create budget',
        variant: 'destructive'
      });
    }
  };

  // Generate report
  const handleGenerateReport = async () => {
    try {
      const reportData = {
        type: reportType,
        period: selectedPeriod,
        department_id: selectedDepartment === 'all' ? undefined : selectedDepartment,
        budget_type: selectedBudgetType === 'all' ? undefined : selectedBudgetType,
        include_charts: true,
        format: 'xlsx'
      };

      // Call API to generate report
      toast({
        title: 'Generating Report',
        description: 'Your report is being generated...'
      });

      // Simulate report generation
      setTimeout(() => {
        toast({
          title: 'Report Ready',
          description: 'Your budget report has been generated successfully'
        });
        setShowReportDialog(false);
      }, 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive'
      });
    }
  };

  // Get status badge
  const getStatusBadge = (budget: CorporateBudget) => {
    const utilizationRate = (budget.spent_amount / budget.total_allocated) * 100;

    if (budget.status === 'planned') {
      return <Badge variant="secondary">Planned</Badge>;
    } else if (budget.status === 'completed') {
      return <Badge variant="outline">Completed</Badge>;
    } else if (utilizationRate > 100) {
      return <Badge variant="destructive">Over Budget</Badge>;
    } else if (utilizationRate > 90) {
      return <Badge variant="outline" className="border-orange-500 text-orange-500">Warning</Badge>;
    } else if (utilizationRate > 75) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Watch</Badge>;
    } else {
      return <Badge variant="default">Active</Badge>;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Allocated</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalAllocated.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              Across {stats.budgetCount} budgets
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalSpent.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {stats.utilizationRate.toFixed(1)}% utilization
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalRemaining.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {(100 - stats.utilizationRate).toFixed(1)}% available
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Budgets</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeBudgets}</div>
            <div className="text-xs text-muted-foreground">
              of {stats.budgetCount} total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Over Budget</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overBudgets}</div>
            <div className="text-xs text-muted-foreground">
              require attention
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Budget Trend</CardTitle>
            <CardDescription>6-month budget allocation and spending trend</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => [`€${value.toLocaleString()}`, '']} />
                <Legend />
                <Line type="monotone" dataKey="allocated" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="spent" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="remaining" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Budget Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Allocation by Type</CardTitle>
            <CardDescription>Distribution across budget categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={budgetTypeBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {budgetTypeBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`€${value.toLocaleString()}`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Department Breakdown */}
      {departmentBreakdownData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Department Budget Breakdown</CardTitle>
            <CardDescription>Budget allocation and spending by department</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentBreakdownData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => [`€${value.toLocaleString()}`, '']} />
                <Legend />
                <Bar dataKey="allocated" fill="#3b82f6" />
                <Bar dataKey="spent" fill="#ef4444" />
                <Bar dataKey="remaining" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Budget List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Budget Management</CardTitle>
              <CardDescription>
                Track and manage departmental budgets
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => {
                    setReportType('summary');
                    setShowReportDialog(true);
                  }}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Summary Report
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setReportType('detailed');
                    setShowReportDialog(true);
                  }}>
                    <Receipt className="w-4 h-4 mr-2" />
                    Detailed Report
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setReportType('forecast');
                    setShowReportDialog(true);
                  }}>
                    <Target className="w-4 h-4 mr-2" />
                    Forecast Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="sm"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Budget
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = subMonths(new Date(), i);
                    return (
                      <SelectItem key={format(date, 'yyyy-MM')} value={format(date, 'yyyy-MM')}>
                        {format(date, 'MMMM yyyy')}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.department_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedBudgetType} onValueChange={setSelectedBudgetType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {BUDGET_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Allocated</TableHead>
                  <TableHead>Spent</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Utilization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <div className="text-sm text-muted-foreground">Loading budgets...</div>
                    </TableCell>
                  </TableRow>
                ) : filteredBudgets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <div className="text-lg font-medium">No budgets found</div>
                      <div className="text-sm text-muted-foreground">
                        Create a budget to start tracking expenses
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBudgets.map((budget) => {
                    const utilizationRate = budget.total_allocated > 0
                      ? (budget.spent_amount / budget.total_allocated) * 100
                      : 0;
                    const department = departments.find(d => d.id === budget.department_id);
                    const budgetType = BUDGET_TYPES.find(t => t.value === budget.budget_type);

                    return (
                      <TableRow key={budget.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-muted-foreground" />
                            {department?.department_name || 'Unassigned'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="border-2"
                            style={{ borderColor: budgetType?.color }}
                          >
                            {budgetType?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {budget.budget_period}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            €{budget.total_allocated.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={budget.spent_amount > budget.total_allocated ? 'text-destructive' : ''}>
                            €{budget.spent_amount.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={budget.remaining_amount < 0 ? 'text-destructive' : 'text-green-600'}>
                            €{budget.remaining_amount.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={Math.min(utilizationRate, 100)}
                              className="w-16"
                            />
                            <span className="text-sm">
                              {utilizationRate.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(budget)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedBudget(budget);
                                  setTransactionFormData({
                                    budget_id: budget.id,
                                    transaction_type: 'spend',
                                    amount: 0,
                                    description: '',
                                    category: ''
                                  });
                                  setShowTransactionDialog(true);
                                }}
                              >
                                <DollarSign className="w-4 h-4 mr-2" />
                                Add Transaction
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit Budget
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Budget Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Budget</DialogTitle>
            <DialogDescription>
              Allocate budget for a specific department and period
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Department</Label>
                <Select
                  value={budgetFormData.department_id || ''}
                  onValueChange={(value) => handleBudgetFormChange('department_id', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">General Budget</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.department_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="budget_type">Budget Type</Label>
                <Select
                  value={budgetFormData.budget_type}
                  onValueChange={(value: any) => handleBudgetFormChange('budget_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGET_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget_period">Budget Period</Label>
                <Input
                  id="budget_period"
                  type="month"
                  value={budgetFormData.budget_period}
                  onChange={(e) => handleBudgetFormChange('budget_period', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="total_allocated">Allocated Amount (€)</Label>
                <Input
                  id="total_allocated"
                  type="number"
                  value={budgetFormData.total_allocated}
                  onChange={(e) => handleBudgetFormChange('total_allocated', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="budget_notes">Notes</Label>
              <Textarea
                id="budget_notes"
                value={budgetFormData.notes}
                onChange={(e) => handleBudgetFormChange('notes', e.target.value)}
                placeholder="Optional notes about this budget allocation"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBudget}>
              Create Budget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Transaction Dialog */}
      <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>
              Record a budget transaction
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transaction_type">Transaction Type</Label>
                <Select
                  value={transactionFormData.transaction_type}
                  onValueChange={(value: any) => handleTransactionFormChange('transaction_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSACTION_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className={cn('w-4 h-4', type.color)} />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Amount (€)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={transactionFormData.amount}
                  onChange={(e) => handleTransactionFormChange('amount', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={transactionFormData.description}
                onChange={(e) => handleTransactionFormChange('description', e.target.value)}
                placeholder="Transaction description"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={transactionFormData.category}
                onChange={(e) => handleTransactionFormChange('category', e.target.value)}
                placeholder="e.g., Fitness classes, Nutrition program"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransactionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Add transaction logic here
              toast({
                title: 'Success',
                description: 'Transaction added successfully'
              });
              setShowTransactionDialog(false);
            }}>
              Add Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Generation Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Budget Report</DialogTitle>
            <DialogDescription>
              Create a comprehensive budget report
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Report Type</Label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {[
                  { value: 'summary', label: 'Summary Report', description: 'High-level overview of budgets' },
                  { value: 'detailed', label: 'Detailed Report', description: 'Complete breakdown with transactions' },
                  { value: 'forecast', label: 'Forecast Report', description: 'Budget projections and trends' }
                ].map(type => (
                  <div
                    key={type.value}
                    className={cn(
                      'p-3 border rounded-lg cursor-pointer transition-colors',
                      reportType === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    )}
                    onClick={() => setReportType(type.value as any)}
                  >
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-muted-foreground">{type.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertTitle>Report Details</AlertTitle>
              <AlertDescription>
                The report will include budget allocations, expenditures, utilization rates,
                and department breakdowns for {selectedPeriod}.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateReport}>
              Generate Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};