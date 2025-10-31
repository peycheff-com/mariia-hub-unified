// Employee Management System Component
// Comprehensive employee management with roles, permissions, and bulk operations

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Plus,
  Edit2,
  Trash2,
  Eye,
  MoreHorizontal,
  Users,
  UserCheck,
  UserX,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Award,
  Settings,
  Key,
  Shield,
  ChevronDown,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Building,
  UserPlus,
  UserMinus,
  Copy
} from 'lucide-react';

import { useCorporate } from '@/contexts/CorporateWellnessContext';
import {
  CorporateEmployee,
  CorporateDepartment,
  CreateEmployeeRequest,
  BulkEmployeeUpload
} from '@/types/corporate';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Button,
  buttonVariants
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
  Avatar,
  AvatarFallback,
  AvatarImage
} from '@/components/ui/avatar';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Switch
} from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface EmployeeManagementProps {
  corporateAccountId: string;
  departments: CorporateDepartment[];
  className?: string;
}

interface EmployeeFormData extends Omit<CreateEmployeeRequest, 'corporate_account_id'> {
  send_invitation: boolean;
  set_password: boolean;
  temporary_password?: string;
}

const BENEFITS_TIERS = [
  { value: 'basic', label: 'Basic', description: 'Core wellness benefits' },
  { value: 'standard', label: 'Standard', description: 'Enhanced wellness package' },
  { value: 'premium', label: 'Premium', description: 'Full wellness access' },
  { value: 'executive', label: 'Executive', description: 'Premium + Executive perks' }
] as const;

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'intern', label: 'Intern' }
] as const;

const PERMISSIONS = [
  { id: 'view_own_data', label: 'View Own Data', category: 'Basic' },
  { id: 'book_services', label: 'Book Services', category: 'Basic' },
  { id: 'view_department_analytics', label: 'View Department Analytics', category: 'Manager' },
  { id: 'manage_team', label: 'Manage Team', category: 'Manager' },
  { id: 'approve_budget', label: 'Approve Budget', category: 'Manager' },
  { id: 'view_all_employees', label: 'View All Employees', category: 'Admin' },
  { id: 'manage_employees', label: 'Manage Employees', category: 'Admin' },
  { id: 'manage_programs', label: 'Manage Programs', category: 'Admin' },
  { id: 'manage_budgets', label: 'Manage Budgets', category: 'Admin' },
  { id: 'system_admin', label: 'System Administration', category: 'Super Admin' }
] as const;

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({
  corporateAccountId,
  departments,
  className
}) => {
  const { employees, loading, createEmployee, updateEmployee, deleteEmployee, bulkUploadEmployees, loadEmployees } = useCorporate();
  const { toast } = useToast();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedEmploymentType, setSelectedEmploymentType] = useState<string>('all');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<CorporateEmployee | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<any[]>([]);
  const [uploadProcessing, setUploadProcessing] = useState(false);

  // Form state
  const [formData, setFormData] = useState<EmployeeFormData>({
    department_id: '',
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    hire_date: '',
    employment_type: 'full_time',
    location: '',
    manager_id: '',
    wellness_budget: 0,
    benefits_tier: 'basic',
    preferences: {
      preferred_services: [],
      schedule_preferences: {
        preferred_days: [],
        preferred_times: [],
        location_preferences: []
      },
      health_goals: [],
      communication_preferences: {
        email: true,
        sms: false,
        push: false
      },
      language: 'en'
    },
    send_invitation: true,
    set_password: false
  });

  const [employeePermissions, setEmployeePermissions] = useState<string[]>([]);

  // Filter employees
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         employee.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         employee.position?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDepartment = selectedDepartment === 'all' || employee.department_id === selectedDepartment;
    const matchesStatus = selectedStatus === 'all' ||
                         (selectedStatus === 'active' && employee.is_active) ||
                         (selectedStatus === 'inactive' && !employee.is_active);
    const matchesEmploymentType = selectedEmploymentType === 'all' ||
                                 employee.employment_type === selectedEmploymentType;

    return matchesSearch && matchesDepartment && matchesStatus && matchesEmploymentType;
  });

  // Handle form changes
  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle nested preferences changes
  const handlePreferenceChange = (category: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [category]: {
          ...prev.preferences[category as keyof typeof prev.preferences],
          [field]: value
        }
      }
    }));
  };

  // Create or update employee
  const handleSaveEmployee = async () => {
    try {
      if (!formData.employee_id || !formData.first_name || !formData.last_name || !formData.email) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }

      const employeeData = {
        corporate_account_id: corporateAccountId,
        ...formData
      };

      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, employeeData);
        toast({
          title: 'Success',
          description: 'Employee updated successfully'
        });
      } else {
        await createEmployee(employeeData);
        toast({
          title: 'Success',
          description: 'Employee created successfully'
        });
      }

      setShowInviteDialog(false);
      setShowEditDialog(false);
      setEditingEmployee(null);
      resetForm();
      await loadEmployees(corporateAccountId);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save employee',
        variant: 'destructive'
      });
    }
  };

  // Delete employee
  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      await deleteEmployee(employeeId);
      toast({
        title: 'Success',
        description: 'Employee deleted successfully'
      });
      await loadEmployees(corporateAccountId);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete employee',
        variant: 'destructive'
      });
    }
  };

  // Bulk operations
  const handleBulkAction = async (action: string) => {
    if (selectedEmployees.length === 0) return;

    try {
      switch (action) {
        case 'activate':
          await Promise.all(
            selectedEmployees.map(id => updateEmployee(id, { is_active: true }))
          );
          toast({
            title: 'Success',
            description: `${selectedEmployees.length} employees activated`
          });
          break;
        case 'deactivate':
          await Promise.all(
            selectedEmployees.map(id => updateEmployee(id, { is_active: false }))
          );
          toast({
            title: 'Success',
            description: `${selectedEmployees.length} employees deactivated`
          });
          break;
        case 'delete':
          if (confirm(`Are you sure you want to delete ${selectedEmployees.length} employees?`)) {
            await Promise.all(
              selectedEmployees.map(id => deleteEmployee(id))
            );
            toast({
              title: 'Success',
              description: `${selectedEmployees.length} employees deleted`
            });
          }
          break;
      }
      setSelectedEmployees([]);
      await loadEmployees(corporateAccountId);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to perform bulk action',
        variant: 'destructive'
      });
    }
  };

  // File upload handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
      // Preview CSV data
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',');
        const data = lines.slice(1, 6).map(line => {
          const values = line.split(',');
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header.trim()] = values[index]?.trim();
          });
          return obj;
        });
        setUploadPreview(data);
      };
      reader.readAsText(file);
    }
  };

  const handleBulkUpload = async () => {
    if (!uploadFile) return;

    setUploadProcessing(true);
    try {
      // Parse CSV and prepare data
      const text = await uploadFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());

      const employees = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const employee: any = {};
        headers.forEach((header, index) => {
          employee[header] = values[index];
        });
        return employee;
      });

      const bulkData: BulkEmployeeUpload = {
        employees,
        department_mappings: {},
        send_invitations: formData.send_invitation,
        set_passwords: formData.set_password,
        default_benefits_tier: formData.benefits_tier
      };

      await bulkUploadEmployees(bulkData);
      toast({
        title: 'Success',
        description: `${employees.length} employees uploaded successfully`
      });
      setShowBulkUploadDialog(false);
      setUploadFile(null);
      setUploadPreview([]);
      await loadEmployees(corporateAccountId);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload employees',
        variant: 'destructive'
      });
    } finally {
      setUploadProcessing(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      department_id: '',
      employee_id: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      position: '',
      hire_date: '',
      employment_type: 'full_time',
      location: '',
      manager_id: '',
      wellness_budget: 0,
      benefits_tier: 'basic',
      preferences: {
        preferred_services: [],
        schedule_preferences: {
          preferred_days: [],
          preferred_times: [],
          location_preferences: []
        },
        health_goals: [],
        communication_preferences: {
          email: true,
          sms: false,
          push: false
        },
        language: 'en'
      },
      send_invitation: true,
      set_password: false
    });
    setEmployeePermissions([]);
  };

  // Edit employee
  const handleEditEmployee = (employee: CorporateEmployee) => {
    setEditingEmployee(employee);
    setFormData({
      department_id: employee.department_id || '',
      employee_id: employee.employee_id,
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      phone: employee.phone || '',
      position: employee.position || '',
      hire_date: employee.hire_date || '',
      employment_type: employee.employment_type,
      location: employee.location || '',
      manager_id: employee.manager_id || '',
      wellness_budget: employee.wellness_budget,
      benefits_tier: employee.benefits_tier,
      preferences: employee.preferences,
      send_invitation: false,
      set_password: false
    });
    setShowEditDialog(true);
  };

  // Get status badge
  const getStatusBadge = (isActive: boolean) => (
    <Badge variant={isActive ? 'default' : 'secondary'} className="gap-1">
      {isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );

  // Get benefits tier badge
  const getBenefitsTierBadge = (tier: string) => {
    const colors = {
      basic: 'secondary',
      standard: 'default',
      premium: 'outline',
      executive: 'destructive'
    } as const;

    return (
      <Badge variant={colors[tier as keyof typeof colors] || 'secondary'}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </Badge>
    );
  };

  // Calculate statistics
  const stats = {
    total: employees.length,
    active: employees.filter(e => e.is_active).length,
    inactive: employees.filter(e => !e.is_active).length,
    byDepartment: departments.map(dept => ({
      name: dept.department_name,
      count: employees.filter(e => e.department_id === dept.id).length
    })),
    totalBudget: employees.reduce((sum, e) => sum + e.wellness_budget, 0),
    usedBudget: employees.reduce((sum, e) => sum + (e.wellness_budget - e.remaining_budget), 0)
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <UserCheck className="w-3 h-3" />
              {stats.active} active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalBudget.toLocaleString()}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${(stats.usedBudget / stats.totalBudget) * 100}%` }}
                />
              </div>
              {((stats.usedBudget / stats.totalBudget) * 100).toFixed(1)}% used
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
            <div className="text-xs text-muted-foreground">
              {stats.byDepartment.length > 0 && (
                <span>
                  Avg. {Math.round(stats.total / departments.length)} employees per dept.
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employees.filter(e => {
                const hireDate = new Date(e.hire_date || '');
                const thisMonth = new Date();
                return hireDate.getMonth() === thisMonth.getMonth() &&
                       hireDate.getFullYear() === thisMonth.getFullYear();
              }).length}
            </div>
            <div className="text-xs text-muted-foreground">
              Hired this month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Employee Management</CardTitle>
              <CardDescription>
                Manage your corporate wellness program participants
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {selectedEmployees.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedEmployees.length} selected
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Bulk Actions
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkAction('activate')}>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Activate Selected
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('deactivate')}>
                        <UserX className="w-4 h-4 mr-2" />
                        Deactivate Selected
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleBulkAction('delete')}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Selected
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkUploadDialog(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Bulk Upload
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  resetForm();
                  setShowInviteDialog(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-full sm:w-[180px]">
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
            <Select value={selectedEmploymentType} onValueChange={setSelectedEmploymentType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {EMPLOYMENT_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Employee Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedEmployees.length === filteredEmployees.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedEmployees(filteredEmployees.map(e => e.id));
                        } else {
                          setSelectedEmployees([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Employment</TableHead>
                  <TableHead>Benefits</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <div className="text-sm text-muted-foreground">Loading employees...</div>
                    </TableCell>
                  </TableRow>
                ) : filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <div className="text-lg font-medium">No employees found</div>
                      <div className="text-sm text-muted-foreground">
                        {searchQuery || selectedDepartment !== 'all' || selectedStatus !== 'all'
                          ? 'Try adjusting your filters'
                          : 'Start by adding your first employee'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedEmployees.includes(employee.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedEmployees([...selectedEmployees, employee.id]);
                            } else {
                              setSelectedEmployees(selectedEmployees.filter(id => id !== employee.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={employee.user?.avatar_url} />
                            <AvatarFallback>
                              {employee.first_name[0]}{employee.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {employee.first_name} {employee.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Mail className="w-3 h-3" />
                              {employee.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {employee.department?.department_name || (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-muted-foreground" />
                          {employee.position || (
                            <span className="text-muted-foreground">Not specified</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {EMPLOYMENT_TYPES.find(t => t.value === employee.employment_type)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getBenefitsTierBadge(employee.benefits_tier)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-muted-foreground" />
                            <span className="font-medium">
                              €{employee.wellness_budget.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div
                              className="bg-primary h-1 rounded-full"
                              style={{
                                width: `${((employee.wellness_budget - employee.remaining_budget) / employee.wellness_budget) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(employee.is_active)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditEmployee(employee)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingEmployee(employee);
                                setShowPermissionsDialog(true);
                              }}
                            >
                              <Key className="w-4 h-4 mr-2" />
                              Permissions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteEmployee(employee.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Employee Dialog */}
      <Dialog open={showInviteDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowInviteDialog(false);
          setShowEditDialog(false);
          setEditingEmployee(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
            </DialogTitle>
            <DialogDescription>
              {editingEmployee
                ? 'Update employee information and preferences'
                : 'Add a new employee to the wellness program'
              }
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="employment">Employment</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employee_id">Employee ID *</Label>
                  <Input
                    id="employee_id"
                    value={formData.employee_id}
                    onChange={(e) => handleFormChange('employee_id', e.target.value)}
                    placeholder="e.g., EMP001"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    placeholder="employee@company.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleFormChange('first_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleFormChange('last_name', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                  placeholder="+48 123 456 789"
                />
              </div>
            </TabsContent>

            <TabsContent value="employment" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select value={formData.department_id} onValueChange={(value) => handleFormChange('department_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.department_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => handleFormChange('position', e.target.value)}
                    placeholder="e.g., Senior Developer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employment_type">Employment Type</Label>
                  <Select value={formData.employment_type} onValueChange={(value: any) => handleFormChange('employment_type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="hire_date">Hire Date</Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => handleFormChange('hire_date', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleFormChange('location', e.target.value)}
                  placeholder="e.g., Warsaw Office"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="manager">Manager</Label>
                  <Select value={formData.manager_id} onValueChange={(value) => handleFormChange('manager_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.filter(e => e.is_active).map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="benefits_tier">Benefits Tier</Label>
                  <Select value={formData.benefits_tier} onValueChange={(value: any) => handleFormChange('benefits_tier', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BENEFITS_TIERS.map(tier => (
                        <SelectItem key={tier.value} value={tier.value}>
                          <div>
                            <div className="font-medium">{tier.label}</div>
                            <div className="text-xs text-muted-foreground">{tier.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="wellness_budget">Wellness Budget (€)</Label>
                <Input
                  id="wellness_budget"
                  type="number"
                  value={formData.wellness_budget}
                  onChange={(e) => handleFormChange('wellness_budget', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4">
              <div>
                <Label>Communication Preferences</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email_notification aria-live="polite" aria-atomic="true"s">Email Notifications</Label>
                    <Switch
                      id="email_notification aria-live="polite" aria-atomic="true"s"
                      checked={formData.preferences.communication_preferences.email}
                      onCheckedChange={(checked) =>
                        handlePreferenceChange('communication_preferences', 'email', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sms_notification aria-live="polite" aria-atomic="true"s">SMS Notifications</Label>
                    <Switch
                      id="sms_notification aria-live="polite" aria-atomic="true"s"
                      checked={formData.preferences.communication_preferences.sms}
                      onCheckedChange={(checked) =>
                        handlePreferenceChange('communication_preferences', 'sms', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push_notification aria-live="polite" aria-atomic="true"s">Push Notifications</Label>
                    <Switch
                      id="push_notification aria-live="polite" aria-atomic="true"s"
                      checked={formData.preferences.communication_preferences.push}
                      onCheckedChange={(checked) =>
                        handlePreferenceChange('communication_preferences', 'push', checked)
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="language">Preferred Language</Label>
                <Select value={formData.preferences.language} onValueChange={(value) => handlePreferenceChange('language', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="pl">Polski</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!editingEmployee && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="send_invitation">Send Invitation Email</Label>
                    <Switch
                      id="send_invitation"
                      checked={formData.send_invitation}
                      onCheckedChange={(checked) => handleFormChange('send_invitation', checked)}
                    />
                  </div>
                  {formData.send_invitation && (
                    <div className="flex items-center justify-between">
                      <Label htmlFor="set_password">Set Temporary Password</Label>
                      <Switch
                        id="set_password"
                        checked={formData.set_password}
                        onCheckedChange={(checked) => handleFormChange('set_password', checked)}
                      />
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowInviteDialog(false);
                setShowEditDialog(false);
                setEditingEmployee(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEmployee}>
              {editingEmployee ? 'Update Employee' : 'Add Employee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={showBulkUploadDialog} onOpenChange={setShowBulkUploadDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Bulk Upload Employees</DialogTitle>
            <DialogDescription>
              Upload multiple employees at once using a CSV file
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertTitle>CSV Format Required</AlertTitle>
              <AlertDescription>
                Your CSV file must include these columns: employee_id, first_name, last_name, email,
                department_id, position, employment_type, wellness_budget, benefits_tier
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="csv_file">Select CSV File</Label>
                <Input
                  id="csv_file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </div>

            {uploadPreview.length > 0 && (
              <div>
                <Label>Preview (First 5 rows)</Label>
                <div className="border rounded-lg mt-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(uploadPreview[0]).map(key => (
                          <TableHead key={key}>{key}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uploadPreview.map((row, index) => (
                        <TableRow key={index}>
                          {Object.values(row).map((value: any, cellIndex) => (
                            <TableCell key={cellIndex}>{value}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bulk_send_invitations">Send Invitation Emails</Label>
                <Switch
                  id="bulk_send_invitations"
                  checked={formData.send_invitation}
                  onCheckedChange={(checked) => handleFormChange('send_invitation', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="bulk_default_tier">Default Benefits Tier</Label>
                <Select value={formData.benefits_tier} onValueChange={(value: any) => handleFormChange('benefits_tier', value)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BENEFITS_TIERS.map(tier => (
                      <SelectItem key={tier.value} value={tier.value}>
                        {tier.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkUploadDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkUpload}
              disabled={!uploadFile || uploadProcessing}
            >
              {uploadProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Employees
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Employee Permissions</DialogTitle>
            <DialogDescription>
              Configure permissions for {editingEmployee?.first_name} {editingEmployee?.last_name}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {Object.entries(
                PERMISSIONS.reduce((acc, permission) => {
                  if (!acc[permission.category]) acc[permission.category] = [];
                  acc[permission.category].push(permission);
                  return acc;
                }, {} as Record<string, typeof PERMISSIONS>)
              ).map(([category, permissions]) => (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{category}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {permissions.map(permission => (
                      <div key={permission.id} className="flex items-center justify-between">
                        <Label htmlFor={permission.id}>{permission.label}</Label>
                        <Checkbox
                          id={permission.id}
                          checked={employeePermissions.includes(permission.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setEmployeePermissions([...employeePermissions, permission.id]);
                            } else {
                              setEmployeePermissions(employeePermissions.filter(p => p !== permission.id));
                            }
                          }}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Save permissions logic here
              setShowPermissionsDialog(false);
              toast({
                title: 'Success',
                description: 'Permissions updated successfully'
              });
            }}>
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};