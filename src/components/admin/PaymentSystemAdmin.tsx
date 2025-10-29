import React, { useState } from 'react';
import {
  CreditCard,
  Gift,
  Users,
  TrendingUp,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Calendar,
  DollarSign,
  Award,
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';

interface PaymentSystemAdminProps {
  // Admin props
}

const mockData = {
  giftCards: [
    {
      id: '1',
      code: 'GIFT-ABC123',
      status: 'active',
      initial_value: 500,
      current_balance: 350,
      purchaser_email: 'john@example.com',
      recipient_email: 'jane@example.com',
      created_at: '2024-01-15T10:00:00Z',
      expires_at: '2025-01-15T10:00:00Z'
    },
    {
      id: '2',
      code: 'GIFT-XYZ789',
      status: 'used',
      initial_value: 200,
      current_balance: 0,
      purchaser_email: 'alice@example.com',
      recipient_email: 'bob@example.com',
      created_at: '2024-01-10T14:30:00Z',
      expires_at: '2025-01-10T14:30:00Z'
    }
  ],
  paymentPlans: [
    {
      id: '1',
      booking_id: 'booking-123',
      total_amount: 1500,
      number_of_installments: 3,
      status: 'active',
      created_at: '2024-01-20T09:00:00Z',
      next_payment_date: '2024-02-20T09:00:00Z'
    },
    {
      id: '2',
      booking_id: 'booking-456',
      total_amount: 800,
      number_of_installments: 2,
      status: 'completed',
      created_at: '2023-12-15T11:00:00Z',
      completed_at: '2024-01-15T11:00:00Z'
    }
  ],
  loyaltyStats: {
    totalMembers: 1247,
    activeMembers: 892,
    pointsIssued: 156890,
    pointsRedeemed: 45230,
    currentTierDistribution: {
      Bronze: 847,
      Silver: 298,
      Gold: 98,
      Platinum: 4
    }
  }
};

export function PaymentSystemAdmin({}: PaymentSystemAdminProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedGiftCard, setSelectedGiftCard] = useState<any>(null);
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment & Loyalty System</h1>
          <p className="text-muted-foreground">
            Manage payment plans, gift cards, and loyalty programs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Reports
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Payment Plans</p>
                <p className="text-2xl font-bold">47</p>
                <p className="text-xs text-green-600">+12% from last month</p>
              </div>
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gift Cards Sold</p>
                <p className="text-2xl font-bold">234</p>
                <p className="text-xs text-green-600">+8% from last month</p>
              </div>
              <Gift className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Loyalty Members</p>
                <p className="text-2xl font-bold">{mockData.loyaltyStats.totalMembers.toLocaleString()}</p>
                <p className="text-xs text-green-600">+15% from last month</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Points in Circulation</p>
                <p className="text-2xl font-bold">{mockData.loyaltyStats.pointsIssued.toLocaleString()}</p>
                <p className="text-xs text-blue-600">{((mockData.loyaltyStats.pointsIssued - mockData.loyaltyStats.pointsRedeemed) / mockData.loyaltyStats.pointsIssued * 100).toFixed(1)}% active</p>
              </div>
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payment-plans">Payment Plans</TabsTrigger>
          <TabsTrigger value="gift-cards">Gift Cards</TabsTrigger>
          <TabsTrigger value="loyalty">Loyalty Program</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Payment Plans */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Payment Plans</CardTitle>
                <CardDescription>Latest payment plan activity</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Installments</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockData.paymentPlans.slice(0, 5).map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-mono text-xs">
                          {plan.booking_id}
                        </TableCell>
                        <TableCell>{plan.total_amount} PLN</TableCell>
                        <TableCell>{plan.number_of_installments}</TableCell>
                        <TableCell>
                          <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                            {plan.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPaymentPlan(plan)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Loyalty Tier Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Loyalty Tier Distribution</CardTitle>
                <CardDescription>Current member distribution across tiers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(mockData.loyaltyStats.currentTierDistribution).map(([tier, count]) => {
                  const percentage = (count / mockData.loyaltyStats.totalMembers) * 100;
                  return (
                    <div key={tier} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{tier}</span>
                        <span className="text-sm text-muted-foreground">
                          {count} members ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            tier === 'Bronze' ? 'bg-amber-500' :
                            tier === 'Silver' ? 'bg-gray-400' :
                            tier === 'Gold' ? 'bg-yellow-500' :
                            'bg-purple-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payment Plans Tab */}
        <TabsContent value="payment-plans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Payment Plans Management</span>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Plan
                </Button>
              </CardTitle>
              <CardDescription>
                Manage and monitor all payment plans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan ID</TableHead>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Installments</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Next Payment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockData.paymentPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-mono text-xs">{plan.id}</TableCell>
                      <TableCell className="font-mono text-xs">{plan.booking_id}</TableCell>
                      <TableCell>{plan.total_amount} PLN</TableCell>
                      <TableCell>{plan.number_of_installments}</TableCell>
                      <TableCell>
                        <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                          {plan.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(plan.created_at), 'dd MMM yyyy', { locale: pl })}
                      </TableCell>
                      <TableCell>
                        {plan.next_payment_date ? (
                          format(new Date(plan.next_payment_date), 'dd MMM yyyy', { locale: pl })
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gift Cards Tab */}
        <TabsContent value="gift-cards" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Gift Cards Management</span>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Gift Card
                </Button>
              </CardTitle>
              <CardDescription>
                Manage all gift cards and track their usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Initial Value</TableHead>
                    <TableHead>Current Balance</TableHead>
                    <TableHead>Purchaser</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockData.giftCards.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell className="font-mono">{card.code}</TableCell>
                      <TableCell>
                        <Badge variant={
                          card.status === 'active' ? 'default' :
                          card.status === 'used' ? 'secondary' :
                          'destructive'
                        }>
                          {card.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{card.initial_value} PLN</TableCell>
                      <TableCell>{card.current_balance} PLN</TableCell>
                      <TableCell className="text-sm">{card.purchaser_email}</TableCell>
                      <TableCell className="text-sm">{card.recipient_email}</TableCell>
                      <TableCell>
                        {format(new Date(card.expires_at), 'dd MMM yyyy', { locale: pl })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loyalty Program Tab */}
        <TabsContent value="loyalty" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Program Settings</CardTitle>
                <CardDescription>
                  Configure loyalty program parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="program-active">Program Active</Label>
                  <Switch id="program-active" defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="points-per-currency">Points per Currency Unit</Label>
                  <Input id="points-per-currency" type="number" defaultValue="10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="points-expiry">Points Expiry (months)</Label>
                  <Input id="points-expiry" type="number" defaultValue="12" />
                </div>
                <Button className="w-full">Save Settings</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tier Configuration</CardTitle>
                <CardDescription>
                  Manage loyalty tiers and benefits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(mockData.loyaltyStats.currentTierDistribution).map(([tier, count]) => (
                  <div key={tier} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Award className={`h-5 w-5 ${
                        tier === 'Bronze' ? 'text-amber-500' :
                        tier === 'Silver' ? 'text-gray-400' :
                        tier === 'Gold' ? 'text-yellow-500' :
                        'text-purple-500'
                      }`} />
                      <div>
                        <p className="font-medium">{tier} Tier</p>
                        <p className="text-sm text-muted-foreground">{count} members</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
                <CardDescription>
                  Configure payment system preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="min-installment">Minimum Installment Amount</Label>
                  <Input id="min-installment" type="number" defaultValue="50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-installments">Maximum Installments</Label>
                  <Input id="max-installments" type="number" defaultValue="12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interest-rate">Interest Rate (%)</Label>
                  <Input id="interest-rate" type="number" step="0.1" defaultValue="5" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-payments">Enable Auto-Payments</Label>
                  <Switch id="auto-payments" defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gift Card Settings</CardTitle>
                <CardDescription>
                  Configure gift card policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="min-gift-amount">Minimum Gift Card Amount</Label>
                  <Input id="min-gift-amount" type="number" defaultValue="50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-gift-amount">Maximum Gift Card Amount</Label>
                  <Input id="max-gift-amount" type="number" defaultValue="10000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gift-card-expiry">Gift Card Expiry (years)</Label>
                  <Input id="gift-card-expiry" type="number" defaultValue="2" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="digital-delivery">Digital Delivery Only</Label>
                  <Switch id="digital-delivery" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cancellation Policies</CardTitle>
              <CardDescription>
                Manage cancellation policies and fees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy Name</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Cancellation Window</TableHead>
                    <TableHead>Fee Type</TableHead>
                    <TableHead>Fee Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Standard Policy</TableCell>
                    <TableCell>All</TableCell>
                    <TableCell>24 hours</TableCell>
                    <TableCell>Deposit Forfeiture</TableCell>
                    <TableCell>100%</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}