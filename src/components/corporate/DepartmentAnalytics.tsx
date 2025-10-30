// Department Analytics Dashboard
// Comprehensive analytics for departments with KPIs, trends, and insights

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import {
  Building,
  Users,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  DollarSign,
  Heart,
  Calendar,
  Clock,
  Award,
  BookOpen,
  Star,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  Filter,
  RefreshCw,
  ChevronDown,
  Eye,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Zap,
  Trophy,
  Shield,
  Flame,
  Sparkles,
  Brain,
  Smile,
  Moon
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns';

import { useCorporate } from '@/contexts/CorporateWellnessContext';
import {
  CorporateDepartment,
  CorporateEmployee,
  DepartmentPerformance,
  CorporateAnalytics
} from '@/types/corporate';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Badge
} from '@/components/ui/badge';
import {
  Progress
} from '@/components/ui/progress';
import {
  Button
} from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast aria-live="polite" aria-atomic="true"';
import { cn } from '@/lib/utils';


interface DepartmentAnalyticsProps {
  corporateAccountId: string;
  departments: CorporateDepartment[];
  className?: string;
}

interface KPIData {
  label: string;
  value: number | string;
  previousValue?: number;
  target?: number;
  unit?: string;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  previousValue?: number;
  target?: number;
  unit?: string;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  description?: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

const KPIS = [
  {
    key: 'employee_count',
    label: 'Total Employees',
    icon: Users,
    color: '#3b82f6',
    unit: 'employees'
  },
  {
    key: 'budget_utilization',
    label: 'Budget Utilization',
    icon: DollarSign,
    color: '#10b981',
    unit: '%'
  },
  {
    key: 'participation_rate',
    label: 'Program Participation',
    icon: Activity,
    color: '#f59e0b',
    unit: '%'
  },
  {
    key: 'satisfaction_score',
    label: 'Satisfaction Score',
    icon: Star,
    color: '#8b5cf6',
    unit: '/5'
  },
  {
    key: 'wellness_score',
    label: 'Wellness Score',
    icon: Heart,
    color: '#ef4444',
    unit: '/100'
  },
  {
    key: 'engagement_rate',
    label: 'Engagement Rate',
    icon: Zap,
    color: '#ec4899',
    unit: '%'
  }
] as const;

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  previousValue,
  target,
  unit,
  icon,
  color,
  trend,
  description
}) => {
  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowUpRight className="w-4 h-4 text-green-600" />;
    if (trend === 'down') return <ArrowDownRight className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getProgressColor = () => {
    if (!target) return 'bg-primary';
    const percentage = (Number(value) / target) * 100;
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="p-2 rounded-full" style={{ backgroundColor: `${color}20` }}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
        </div>

        {trend && previousValue && (
          <div className="flex items-center gap-1 mt-1">
            {getTrendIcon()}
            <span className="text-xs text-muted-foreground">
              vs {previousValue}{unit}
            </span>
          </div>
        )}

        {target && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Target</span>
              <span>{target}{unit}</span>
            </div>
            <Progress
              value={Math.min((Number(value) / target) * 100, 100)}
              className="h-2"
            />
          </div>
        )}

        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export const DepartmentAnalytics: React.FC<DepartmentAnalyticsProps> = ({
  corporateAccountId,
  departments,
  className
}) => {
  const { employees, analytics, loadAnalytics } = useCorporate();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  // State
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedMetric, setSelectedMetric] = useState<string>('all');
  const [comparisonMode, setComparisonMode] = useState<'none' | 'previous' | 'target'>('previous');

  // Filter data based on selections
  const filteredDepartments = selectedDepartment === 'all'
    ? departments
    : departments.filter(d => d.id === selectedDepartment);

  // Generate sample data for demonstration
  const generateDepartmentData = (department: CorporateDepartment) => {
    const deptEmployees = employees.filter(e => e.department_id === department.id);
    const deptAnalytics = analytics.filter(a => a.department_id === department.id);

    return {
      department,
      employees: deptEmployees.length,
      activeEmployees: deptEmployees.filter(e => e.is_active).length,
      budgetAllocated: department.budget_allocation || 100000,
      budgetUsed: Math.floor((department.budget_allocation || 100000) * (0.6 + Math.random() * 0.3)),
      programParticipations: Math.floor(deptEmployees.length * (0.4 + Math.random() * 0.4)),
      satisfactionScore: 3.5 + Math.random() * 1.5,
      wellnessScore: 60 + Math.random() * 30,
      engagementRate: 50 + Math.random() * 40,
      completionRate: 60 + Math.random() * 30,
      retentionRate: 80 + Math.random() * 15,
      productivityScore: 70 + Math.random() * 25
    };
  };

  const departmentData = filteredDepartments.map(generateDepartmentData);

  // Generate trend data
  const generateTrendData = () => {
    return Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), 11 - i);
      return {
        month: format(date, 'MMM'),
        employees: Math.floor(80 + Math.random() * 40),
        participation: Math.floor(40 + Math.random() * 40),
        satisfaction: 3 + Math.random() * 2,
        budget: Math.floor(60000 + Math.random() * 40000),
        wellness: 60 + Math.random() * 30,
        engagement: 50 + Math.random() * 40
      };
    });
  };

  const trendData = generateTrendData();

  // Generate radar data for department comparison
  const generateRadarData = () => {
    return departmentData.map(data => ({
      department: data.department.department_name,
      participation: (data.programParticipations / data.employees) * 100,
      satisfaction: (data.satisfactionScore / 5) * 100,
      wellness: data.wellnessScore,
      engagement: data.engagementRate,
      completion: data.completionRate,
      budgetUtilization: (data.budgetUsed / data.budgetAllocated) * 100
    }));
  };

  const radarData = generateRadarData();

  // Generate category breakdown
  const categoryBreakdown = [
    { name: 'Fitness Programs', value: 35, color: '#3b82f6' },
    { name: 'Mental Health', value: 25, color: '#10b981' },
    { name: 'Nutrition', value: 20, color: '#f59e0b' },
    { name: 'Preventive Care', value: 15, color: '#8b5cf6' },
    { name: 'Stress Management', value: 5, color: '#ef4444' }
  ];

  // Calculate department rankings
  const departmentRankings = departmentData
    .map(data => ({
      name: data.department.department_name,
      score: (
        (data.satisfactionScore / 5) * 0.25 +
        (data.wellnessScore / 100) * 0.25 +
        (data.engagementRate / 100) * 0.2 +
        (data.completionRate / 100) * 0.15 +
        (data.budgetUsed / data.budgetAllocated) * 0.15
      ) * 100,
      ...data
    }))
    .sort((a, b) => b.score - a.score);

  // Get top performers
  const topPerformers = departmentRankings.slice(0, 3);
  const needsAttention = departmentRankings.slice(-3).reverse();

  // Export data
  const handleExport = (format: 'csv' | 'pdf' | 'xlsx') => {
    toast aria-live="polite" aria-atomic="true"({
      title: 'Exporting Data',
      description: `Generating ${format.toUpperCase()} report...`
    });

    setTimeout(() => {
      toast aria-live="polite" aria-atomic="true"({
        title: 'Export Complete',
        description: `Department analytics exported as ${format.toUpperCase()}`
      });
    }, 2000);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Department Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into department performance and wellness metrics
          </p>
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
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={() => loadAnalytics(corporateAccountId, {})}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger className="w-[200px]">
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

        <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Monthly</SelectItem>
            <SelectItem value="quarter">Quarterly</SelectItem>
            <SelectItem value="year">Yearly</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Metrics" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Metrics</SelectItem>
            {KPIS.map(kpi => (
              <SelectItem key={kpi.key} value={kpi.key}>
                {kpi.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Employees"
          value={departmentData.reduce((sum, d) => sum + d.employees, 0)}
          icon={<Users className="w-4 h-4" style={{ color: '#3b82f6' }} />}
          color="#3b82f6"
          trend="up"
          previousValue={departmentData.reduce((sum, d) => sum + d.employees, 0) - 12}
          unit=""
        />
        <MetricCard
          title="Budget Utilization"
          value={Math.round(
            (departmentData.reduce((sum, d) => sum + d.budgetUsed, 0) /
             departmentData.reduce((sum, d) => sum + d.budgetAllocated, 0)) * 100
          )}
          icon={<DollarSign className="w-4 h-4" style={{ color: '#10b981' }} />}
          color="#10b981"
          trend="stable"
          target={85}
          unit="%"
        />
        <MetricCard
          title="Participation Rate"
          value={Math.round(
            (departmentData.reduce((sum, d) => sum + d.programParticipations, 0) /
             departmentData.reduce((sum, d) => sum + d.employees, 0)) * 100
          )}
          icon={<Activity className="w-4 h-4" style={{ color: '#f59e0b' }} />}
          color="#f59e0b"
          trend="up"
          target={75}
          unit="%"
        />
        <MetricCard
          title="Satisfaction Score"
          value={(
            departmentData.reduce((sum, d) => sum + d.satisfactionScore, 0) /
            departmentData.length
          ).toFixed(1)}
          icon={<Star className="w-4 h-4" style={{ color: '#8b5cf6' }} />}
          color="#8b5cf6"
          trend="up"
          previousValue={4.1}
          unit="/5"
        />
        <MetricCard
          title="Wellness Score"
          value={Math.round(
            departmentData.reduce((sum, d) => sum + d.wellnessScore, 0) /
            departmentData.length
          )}
          icon={<Heart className="w-4 h-4" style={{ color: '#ef4444' }} />}
          color="#ef4444"
          trend="up"
          target={80}
          unit="/100"
        />
        <MetricCard
          title="Engagement Rate"
          value={Math.round(
            departmentData.reduce((sum, d) => sum + d.engagementRate, 0) /
            departmentData.length
          )}
          icon={<Zap className="w-4 h-4" style={{ color: '#ec4899' }} />}
          color="#ec4899"
          trend="stable"
          target={70}
          unit="%"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>12-month overview of key metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="participation" stroke="#3b82f6" strokeWidth={2} name="Participation %" />
                <Line type="monotone" dataKey="engagement" stroke="#10b981" strokeWidth={2} name="Engagement %" />
                <Line type="monotone" dataKey="wellness" stroke="#f59e0b" strokeWidth={2} name="Wellness Score" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Department Comparison</CardTitle>
            <CardDescription>Multi-dimensional performance analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="department" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                {radarData.map((_, index) => (
                  <Radar
                    key={index}
                    name={radarData[index].department}
                    dataKey="participation"
                    stroke={COLORS[index % COLORS.length]}
                    fill={COLORS[index % COLORS.length]}
                    fillOpacity={0.1}
                  />
                ))}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Department Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Top Performers
            </CardTitle>
            <CardDescription>Best performing departments this month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topPerformers.map((dept, index) => (
              <div key={dept.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-white font-bold',
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                  )}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{dept.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {dept.employees} employees
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{dept.score.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">Score</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Needs Attention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Needs Attention
            </CardTitle>
            <CardDescription>Departments requiring support</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {needsAttention.map((dept) => (
              <div key={dept.name} className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-medium">{dept.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Low engagement rate
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-orange-600">{dept.score.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">Score</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Department Table */}
      <Card>
        <CardHeader>
          <CardTitle>Department Performance Details</CardTitle>
          <CardDescription>
            Comprehensive metrics for each department
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Department</th>
                  <th className="text-right p-2">Employees</th>
                  <th className="text-right p-2">Budget Used</th>
                  <th className="text-right p-2">Participation</th>
                  <th className="text-right p-2">Satisfaction</th>
                  <th className="text-right p-2">Wellness</th>
                  <th className="text-right p-2">Engagement</th>
                  <th className="text-right p-2">Overall Score</th>
                </tr>
              </thead>
              <tbody>
                {departmentData.map((data) => (
                  <tr key={data.department.id} className="border-b">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{data.department.department_name}</span>
                      </div>
                    </td>
                    <td className="text-right p-2">
                      <div>
                        <div>{data.employees}</div>
                        <div className="text-xs text-muted-foreground">
                          {data.activeEmployees} active
                        </div>
                      </div>
                    </td>
                    <td className="text-right p-2">
                      <div>
                        <div>€{data.budgetUsed.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round((data.budgetUsed / data.budgetAllocated) * 100)}%
                        </div>
                      </div>
                    </td>
                    <td className="text-right p-2">
                      <Badge variant={data.programParticipations / data.employees > 0.7 ? 'default' : 'secondary'}>
                        {Math.round((data.programParticipations / data.employees) * 100)}%
                      </Badge>
                    </td>
                    <td className="text-right p-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        {data.satisfactionScore.toFixed(1)}
                      </div>
                    </td>
                    <td className="text-right p-2">
                      <Badge variant={data.wellnessScore > 75 ? 'default' : data.wellnessScore > 60 ? 'secondary' : 'destructive'}>
                        {Math.round(data.wellnessScore)}
                      </Badge>
                    </td>
                    <td className="text-right p-2">
                      <Progress value={data.engagementRate} className="w-12 mx-auto" />
                    </td>
                    <td className="text-right p-2">
                      <Badge variant="outline" className="font-bold">
                        {(
                          (data.satisfactionScore / 5) * 0.25 +
                          (data.wellnessScore / 100) * 0.25 +
                          (data.engagementRate / 100) * 0.2 +
                          (data.completionRate / 100) * 0.15 +
                          (data.budgetUsed / data.budgetAllocated) * 0.15
                        ).toFixed(1)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Program Category Breakdown</CardTitle>
          <CardDescription>Distribution of wellness program participation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value}%`, 'Participation']} />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-3">
              {categoryBreakdown.map((category) => (
                <div key={category.name} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{category.value}%</div>
                    <div className="text-xs text-muted-foreground">of total</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};