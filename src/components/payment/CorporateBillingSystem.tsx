// Corporate Billing System
// Comprehensive billing solution for corporate clients and B2B customers

import React, { useState, useEffect } from 'react';
import {
  Building2Icon,
  UsersIcon,
  FileTextIcon,
  CreditCardIcon,
  CalendarIcon,
  TrendingUpIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  DownloadIcon,
  MailIcon,
  SettingsIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { formatCurrency } from '@/lib/email-templates';

interface CorporateAccount {
  id: string;
  companyName: string;
  nipNumber: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  billingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  planType: 'prepaid' | 'postpaid' | 'subscription';
  creditLimit?: number;
  currentBalance: number;
  currency: string;
  status: 'active' | 'suspended' | 'inactive';
  employeeCount: number;
  departmentCount: number;
  createdAt: string;
}

interface Department {
  id: string;
  corporateAccountId: string;
  name: string;
  managerName: string;
  managerEmail: string;
  budgetLimit: number;
  currentSpend: number;
  employees: string[];
}

interface BillingCycle {
  id: string;
  corporateAccountId: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'pending';
  totalAmount: number;
  currency: string;
  invoiceCount: number;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
  dueDate: string;
}

interface Employee {
  id: string;
  corporateAccountId: string;
  departmentId?: string;
  name: string;
  email: string;
  position: string;
  monthlyAllowance: number;
  currentUsage: number;
  activeBookings: number;
}

export function CorporateBillingSystem() {
  const [activeTab, setActiveTab] = useState('accounts');
  const [corporateAccounts, setCorporateAccounts] = useState<CorporateAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<CorporateAccount | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [billingCycles, setBillingCycles] = useState<BillingCycle[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddAccountDialog, setShowAddAccountDialog] = useState(false);
  const [showDepartmentDialog, setShowDepartmentDialog] = useState(false);
  const [showBillingDialog, setShowBillingDialog] = useState(false);

  // Form states
  const [newAccount, setNewAccount] = useState({
    companyName: '',
    nipNumber: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    billingAddress: {
      street: '',
      city: '',
      postalCode: '',
      country: 'Polska',
    },
    planType: 'postpaid' as const,
    creditLimit: 10000,
    currency: 'PLN',
    employeeCount: 0,
  });

  useEffect(() => {
    loadCorporateAccounts();
  }, []);

  const loadCorporateAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('corporate_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to load corporate accounts:', error);
        return;
      }

      setCorporateAccounts(data || []);
    } catch (error) {
      logger.error('Error loading corporate accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAccountDetails = async (accountId: string) => {
    try {
      // Load departments
      const { data: depts } = await supabase
        .from('departments')
        .select('*')
        .eq('corporate_account_id', accountId);

      setDepartments(depts || []);

      // Load employees
      const { data: emps } = await supabase
        .from('employees')
        .select('*')
        .eq('corporate_account_id', accountId);

      setEmployees(emps || []);

      // Load billing cycles
      const { data: cycles } = await supabase
        .from('billing_cycles')
        .select('*')
        .eq('corporate_account_id', accountId)
        .order('start_date', { ascending: false })
        .limit(12);

      setBillingCycles(cycles || []);
    } catch (error) {
      logger.error('Error loading account details:', error);
    }
  };

  const handleAccountClick = (account: CorporateAccount) => {
    setSelectedAccount(account);
    loadAccountDetails(account.id);
  };

  const createCorporateAccount = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('corporate_accounts')
        .insert({
          company_name: newAccount.companyName,
          nip_number: newAccount.nipNumber,
          contact_person: newAccount.contactPerson,
          contact_email: newAccount.contactEmail,
          contact_phone: newAccount.contactPhone,
          billing_address: newAccount.billingAddress,
          plan_type: newAccount.planType,
          credit_limit: newAccount.creditLimit,
          currency: newAccount.currency,
          employee_count: newAccount.employeeCount,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info('Corporate account created successfully', { accountId: data.id });
      loadCorporateAccounts();
      setShowAddAccountDialog(false);
      resetNewAccountForm();
    } catch (error) {
      logger.error('Failed to create corporate account:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetNewAccountForm = () => {
    setNewAccount({
      companyName: '',
      nipNumber: '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      billingAddress: {
        street: '',
        city: '',
        postalCode: '',
        country: 'Polska',
      },
      planType: 'postpaid',
      creditLimit: 10000,
      currency: 'PLN',
      employeeCount: 0,
    });
  };

  const generateInvoice = async (accountId: string, cycleId?: string) => {
    try {
      // This would call the invoice generation service
      logger.info('Generating invoice', { accountId, cycleId });
      // Implementation would go here
    } catch (error) {
      logger.error('Failed to generate invoice:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { variant: 'default' as const, label: 'Active', color: 'text-green-600' },
      suspended: { variant: 'secondary' as const, label: 'Suspended', color: 'text-yellow-600' },
      inactive: { variant: 'outline' as const, label: 'Inactive', color: 'text-gray-600' },
      pending: { variant: 'secondary' as const, label: 'Pending', color: 'text-blue-600' },
      completed: { variant: 'default' as const, label: 'Completed', color: 'text-green-600' },
      overdue: { variant: 'destructive' as const, label: 'Overdue', color: 'text-red-600' },
    };

    const config = variants[status as keyof typeof variants] || variants.active;

    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const AccountsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Corporate Accounts</h3>
        <Button onClick={() => setShowAddAccountDialog(true)}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>NIP</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Plan Type</TableHead>
            <TableHead>Credit Limit</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {corporateAccounts.map((account) => (
            <TableRow
              key={account.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleAccountClick(account)}
            >
              <TableCell className="font-medium">{account.companyName}</TableCell>
              <TableCell className="font-mono text-sm">{account.nipNumber}</TableCell>
              <TableCell>
                <div>
                  <p className="text-sm">{account.contactPerson}</p>
                  <p className="text-xs text-muted-foreground">{account.contactEmail}</p>
                </div>
              </TableCell>
              <TableCell className="capitalize">{account.planType}</TableCell>
              <TableCell>
                {formatCurrency(account.creditLimit || 0, account.currency, 'en')}
              </TableCell>
              <TableCell>
                <span className={account.currentBalance < 0 ? 'text-red-600' : 'text-green-600'}>
                  {formatCurrency(account.currentBalance, account.currency, 'en')}
                </span>
              </TableCell>
              <TableCell>{getStatusBadge(account.status)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAccountClick(account);
                    }}
                  >
                    <EditIcon className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const AccountDetailsTab = () => {
    if (!selectedAccount) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Select an account to view details
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Account Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2Icon className="w-5 h-5" />
              {selectedAccount.companyName}
            </CardTitle>
            <CardDescription>
              Corporate Account Details and Management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">NIP Number</p>
                <p className="font-mono">{selectedAccount.nipNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contact Person</p>
                <p>{selectedAccount.contactPerson}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Credit Limit</p>
                <p>{formatCurrency(selectedAccount.creditLimit || 0, 'PLN', 'en')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className={selectedAccount.currentBalance < 0 ? 'text-red-600' : 'text-green-600'}>
                  {formatCurrency(selectedAccount.currentBalance, 'PLN', 'en')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="departments" className="w-full">
          <TabsList>
            <TabsTrigger value="departments">
              <UsersIcon className="w-4 h-4 mr-2" />
              Departments
            </TabsTrigger>
            <TabsTrigger value="employees">
              <UsersIcon className="w-4 h-4 mr-2" />
              Employees
            </TabsTrigger>
            <TabsTrigger value="billing">
              <FileTextIcon className="w-4 h-4 mr-2" />
              Billing Cycles
            </TabsTrigger>
            <TabsTrigger value="settings">
              <SettingsIcon className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="departments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Departments ({departments.length})</h4>
              <Button size="sm" onClick={() => setShowDepartmentDialog(true)}>
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Department
              </Button>
            </div>

            <div className="grid gap-4">
              {departments.map((dept) => (
                <Card key={dept.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium">{dept.name}</h5>
                        <p className="text-sm text-muted-foreground">Manager: {dept.managerName}</p>
                        <p className="text-sm text-muted-foreground">{dept.managerEmail}</p>
                        <p className="text-sm text-muted-foreground">
                          {dept.employees.length} employees
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Budget</p>
                        <p className="font-medium">
                          {formatCurrency(dept.budgetLimit, 'PLN', 'en')}
                        </p>
                        <p className="text-sm text-muted-foreground">Spent</p>
                        <p className="font-medium">
                          {formatCurrency(dept.currentSpend, 'PLN', 'en')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="employees" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Employees ({employees.length})</h4>
              <Button size="sm">Add Employee</Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Monthly Allowance</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Active Bookings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>{emp.name}</TableCell>
                    <TableCell>{emp.email}</TableCell>
                    <TableCell>{emp.position}</TableCell>
                    <TableCell>
                      {departments.find(d => d.id === emp.departmentId)?.name || '-'}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(emp.monthlyAllowance, 'PLN', 'en')}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(emp.currentUsage, 'PLN', 'en')}
                    </TableCell>
                    <TableCell>{emp.activeBookings}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Billing Cycles</h4>
              <Button size="sm" onClick={() => setShowBillingDialog(true)}>
                <FileTextIcon className="w-4 h-4 mr-2" />
                Generate Invoice
              </Button>
            </div>

            <div className="grid gap-4">
              {billingCycles.map((cycle) => (
                <Card key={cycle.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium">
                          {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                        </h5>
                        <p className="text-sm text-muted-foreground mt-1">
                          {cycle.invoiceCount} invoices • Total: {formatCurrency(cycle.totalAmount, 'PLN', 'en')}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        {getStatusBadge(cycle.paymentStatus)}
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(cycle.dueDate).toLocaleDateString()}
                        </p>
                        <Button size="sm" variant="outline">
                          <DownloadIcon className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Billing Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Billing Frequency</Label>
                    <Select defaultValue="monthly">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Payment Terms</Label>
                    <Select defaultValue="14">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Due on Receipt</SelectItem>
                        <SelectItem value="7">7 Days</SelectItem>
                        <SelectItem value="14">14 Days</SelectItem>
                        <SelectItem value="30">30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Notifications</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="invoice-email" defaultChecked />
                      <Label htmlFor="invoice-email">Send invoices via email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="payment-reminder" defaultChecked />
                      <Label htmlFor="payment-reminder">Payment reminders</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="monthly-reports" defaultChecked />
                      <Label htmlFor="monthly-reports">Monthly usage reports</Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>Save Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Corporate Billing System</h2>
          <p className="text-muted-foreground">
            Manage corporate accounts, departments, and billing cycles
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {corporateAccounts.length} Active Accounts
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="accounts">Accounts Overview</TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedAccount}>
            Account Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <AccountsTab />
        </TabsContent>

        <TabsContent value="details">
          <AccountDetailsTab />
        </TabsContent>
      </Tabs>

      {/* Add Account Dialog */}
      <Dialog open={showAddAccountDialog} onOpenChange={setShowAddAccountDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Corporate Account</DialogTitle>
            <DialogDescription>
              Create a new corporate account for B2B clients
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={newAccount.companyName}
                  onChange={(e) => setNewAccount({ ...newAccount, companyName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="nipNumber">NIP Number</Label>
                <Input
                  id="nipNumber"
                  value={newAccount.nipNumber}
                  onChange={(e) => setNewAccount({ ...newAccount, nipNumber: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={newAccount.contactPerson}
                  onChange={(e) => setNewAccount({ ...newAccount, contactPerson: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={newAccount.contactEmail}
                  onChange={(e) => setNewAccount({ ...newAccount, contactEmail: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Billing Address</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Street"
                  value={newAccount.billingAddress.street}
                  onChange={(e) => setNewAccount({
                    ...newAccount,
                    billingAddress: { ...newAccount.billingAddress, street: e.target.value }
                  })}
                />
                <Input
                  placeholder="City"
                  value={newAccount.billingAddress.city}
                  onChange={(e) => setNewAccount({
                    ...newAccount,
                    billingAddress: { ...newAccount.billingAddress, city: e.target.value }
                  })}
                />
                <Input
                  placeholder="Postal Code"
                  value={newAccount.billingAddress.postalCode}
                  onChange={(e) => setNewAccount({
                    ...newAccount,
                    billingAddress: { ...newAccount.billingAddress, postalCode: e.target.value }
                  })}
                />
                <Select
                  value={newAccount.billingAddress.country}
                  onValueChange={(value) => setNewAccount({
                    ...newAccount,
                    billingAddress: { ...newAccount.billingAddress, country: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Polska">Polska</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="France">France</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="planType">Plan Type</Label>
                <Select
                  value={newAccount.planType}
                  onValueChange={(value: any) => setNewAccount({ ...newAccount, planType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prepaid">Prepaid</SelectItem>
                    <SelectItem value="postpaid">Postpaid</SelectItem>
                    <SelectItem value="subscription">Subscription</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="creditLimit">Credit Limit (PLN)</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  value={newAccount.creditLimit}
                  onChange={(e) => setNewAccount({ ...newAccount, creditLimit: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="employeeCount">Employee Count</Label>
                <Input
                  id="employeeCount"
                  type="number"
                  value={newAccount.employeeCount}
                  onChange={(e) => setNewAccount({ ...newAccount, employeeCount: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddAccountDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createCorporateAccount} disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CorporateBillingSystem;