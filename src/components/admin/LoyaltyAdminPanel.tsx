import React, { useState, useEffect } from 'react';
import {
  Users,
  Trophy,
  Gift,
  TrendingUp,
  Settings,
  Download,
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  Target,
  Star,
  Award,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Save,
  X,
  Check,
  AlertCircle
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast aria-live="polite" aria-atomic="true"';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLoyaltyContext } from '@/contexts/LoyaltyContext';
import { cn } from '@/lib/utils';

interface LoyaltyAdminPanelProps {
  className?: string;
}

export const LoyaltyAdminPanel: React.FC<LoyaltyAdminPanelProps> = ({ className }) => {
  const { state, actions } = useLoyaltyContext();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRewardDialogOpen, setIsRewardDialogOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<any>(null);

  // Form states
  const [memberForm, setMemberForm] = useState({
    tier_id: '',
    manual_points_adjustment: 0,
    notes: ''
  });

  const [rewardForm, setRewardForm] = useState({
    name: '',
    description: '',
    type: 'discount',
    discount_value: 0,
    points_cost: 0,
    required_tier: 'Bronze',
    is_active: true,
    expires_at: '',
    applicable_services: [] as string[]
  });

  // Load admin data
  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Load comprehensive data for admin panel
      await Promise.all([
        actions.loadMemberData(),
        actions.loadRewardsCatalog(),
        actions.loadTransactions(),
        actions.loadAchievements()
      ]);
    } catch (error) {
      console.error('Failed to load admin data:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error loading data',
        description: 'Failed to load loyalty program data. Please refresh.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = state.member ? [state.member] : [];
  const filteredRewards = state.rewards.filter(reward =>
    reward.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMemberEdit = (member: any) => {
    setSelectedMember(member);
    setMemberForm({
      tier_id: member.tier?.id || '',
      manual_points_adjustment: 0,
      notes: ''
    });
    setIsEditDialogOpen(true);
  };

  const handleMemberUpdate = async () => {
    if (!selectedMember) return;

    setLoading(true);
    try {
      // Update member tier if changed
      if (memberForm.tier_id && memberForm.tier_id !== selectedMember.tier?.id) {
        await actions.updateMemberTier(selectedMember.id, memberForm.tier_id);
      }

      // Apply manual points adjustment
      if (memberForm.manual_points_adjustment !== 0) {
        if (memberForm.manual_points_adjustment > 0) {
          await actions.earnPoints(memberForm.manual_points_adjustment, {
            reference_type: 'admin_adjustment',
            reference_id: selectedMember.id,
            description: memberForm.notes || 'Manual points adjustment by admin'
          });
        } else {
          await actions.redeemPoints(Math.abs(memberForm.manual_points_adjustment), {
            reference_type: 'admin_adjustment',
            reference_id: selectedMember.id,
            description: memberForm.notes || 'Manual points deduction by admin'
          });
        }
      }

      toast aria-live="polite" aria-atomic="true"({
        title: 'Member updated successfully',
        description: 'The member profile has been updated.',
      });

      setIsEditDialogOpen(false);
      setSelectedMember(null);
      await loadAdminData();
    } catch (error) {
      console.error('Failed to update member:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: 'Failed to update member',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRewardEdit = (reward: any) => {
    setSelectedReward(reward);
    setRewardForm({
      name: reward.name,
      description: reward.description,
      type: reward.type,
      discount_value: reward.discount_value || 0,
      points_cost: reward.points_cost || 0,
      required_tier: reward.required_tier,
      is_active: reward.is_active,
      expires_at: reward.expires_at || '',
      applicable_services: reward.applicable_services || []
    });
    setIsRewardDialogOpen(true);
  };

  const handleRewardSave = async () => {
    setLoading(true);
    try {
      if (selectedReward) {
        // Update existing reward
        await actions.updateReward(selectedReward.id, rewardForm);
        toast aria-live="polite" aria-atomic="true"({
          title: 'Reward updated successfully',
          description: 'The reward has been updated.',
        });
      } else {
        // Create new reward
        await actions.createReward(rewardForm);
        toast aria-live="polite" aria-atomic="true"({
          title: 'Reward created successfully',
          description: 'The new reward has been added to the catalog.',
        });
      }

      setIsRewardDialogOpen(false);
      setSelectedReward(null);
      setRewardForm({
        name: '',
        description: '',
        type: 'discount',
        discount_value: 0,
        points_cost: 0,
        required_tier: 'Bronze',
        is_active: true,
        expires_at: '',
        applicable_services: []
      });
      await loadAdminData();
    } catch (error) {
      console.error('Failed to save reward:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: 'Failed to save reward',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async (dataType: string) => {
    setLoading(true);
    try {
      let data: any[] = [];
      let filename = '';

      switch (dataType) {
        case 'members':
          data = filteredMembers.map(member => ({
            id: member.id,
            name: member.member_number,
            email: member.user_email,
            tier: member.tier?.name,
            points: state.stats?.availablePoints || 0,
            join_date: member.join_date,
            status: member.is_active ? 'Active' : 'Inactive'
          }));
          filename = 'loyalty_members';
          break;
        case 'rewards':
          data = state.rewards.map(reward => ({
            id: reward.id,
            name: reward.name,
            type: reward.type,
            value: reward.discount_value,
            points_cost: reward.points_cost,
            required_tier: reward.required_tier,
            is_active: reward.is_active,
            redemptions: reward.total_redemptions || 0
          }));
          filename = 'rewards_catalog';
          break;
        case 'transactions':
          data = state.transactions.map(transaction => ({
            id: transaction.id,
            member_id: transaction.member_id,
            type: transaction.transaction_type,
            points: transaction.points,
            description: transaction.description,
            created_at: transaction.created_at,
            reference_type: transaction.reference_type
          }));
          filename = 'points_transactions';
          break;
      }

      // Create CSV download
      const csv = [
        Object.keys(data[0] || {}).join(','),
        ...data.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast aria-live="polite" aria-atomic="true"({
        title: 'Data exported successfully',
        description: `${filename} data has been downloaded.`,
      });
    } catch (error) {
      console.error('Failed to export data:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: 'Export failed',
        description: 'Failed to export data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !state.member) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading admin panel...
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Loyalty Program Admin</h1>
          <p className="text-muted-foreground">Manage members, rewards, and program settings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => loadAdminData()}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Select onValueChange={(value) => handleExportData(value)}>
            <SelectTrigger className="w-40">
              <Download className="h-4 w-4 mr-2" />
              Export
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="members">Members</SelectItem>
              <SelectItem value="rewards">Rewards</SelectItem>
              <SelectItem value="transactions">Transactions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{filteredMembers.length}</p>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Gift className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{state.rewards.length}</p>
                <p className="text-sm text-muted-foreground">Active Rewards</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{state.transactions.length}</p>
                <p className="text-sm text-muted-foreground">Transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-amber-600" />
              <div>
                <p className="text-2xl font-bold">{state.achievements.length}</p>
                <p className="text-sm text-muted-foreground">Achievements</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {state.transactions.length > 0 ? (
                  <div className="space-y-3">
                    {state.transactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-xs',
                            transaction.transaction_type === 'earn' ? 'bg-green-100 text-green-600' :
                            transaction.transaction_type === 'redeem' ? 'bg-red-100 text-red-600' :
                            'bg-gray-100 text-gray-600'
                          )}>
                            {transaction.transaction_type === 'earn' && '+'}
                            {transaction.transaction_type === 'redeem' && '-'}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{transaction.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={transaction.points > 0 ? 'default' : 'secondary'}>
                          {transaction.points > 0 ? '+' : ''}{transaction.points} pts
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No recent activity</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Rewards</CardTitle>
              </CardHeader>
              <CardContent>
                {state.rewards.length > 0 ? (
                  <div className="space-y-3">
                    {state.rewards.slice(0, 5).map((reward) => (
                      <div key={reward.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{reward.name}</p>
                          <p className="text-xs text-muted-foreground">{reward.description}</p>
                        </div>
                        <Badge variant="outline">{reward.points_cost} pts</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No rewards available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Members</CardTitle>
                  <CardDescription>Manage loyalty program members</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={filterTier} onValueChange={setFilterTier}>
                    <SelectTrigger className="w-32">
                      <Filter className="h-4 w-4 mr-2" />
                      All
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      <SelectItem value="Bronze">Bronze</SelectItem>
                      <SelectItem value="Silver">Silver</SelectItem>
                      <SelectItem value="Gold">Gold</SelectItem>
                      <SelectItem value="Platinum">Platinum</SelectItem>
                      <SelectItem value="Diamond">Diamond</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredMembers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{member.member_number}</p>
                            <p className="text-sm text-muted-foreground">{member.user_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge style={{ backgroundColor: member.tier?.color_code }}>
                            {member.tier?.name}
                          </Badge>
                        </TableCell>
                        <TableCell>{state.stats?.availablePoints || 0}</TableCell>
                        <TableCell>{new Date(member.join_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={member.is_active ? 'default' : 'secondary'}>
                            {member.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMemberEdit(member)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/loyalty/dashboard?member=${member.id}`, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No members found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Rewards Catalog</CardTitle>
                  <CardDescription>Manage available rewards and benefits</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setSelectedReward(null);
                    setRewardForm({
                      name: '',
                      description: '',
                      type: 'discount',
                      discount_value: 0,
                      points_cost: 0,
                      required_tier: 'Bronze',
                      is_active: true,
                      expires_at: '',
                      applicable_services: []
                    });
                    setIsRewardDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reward
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredRewards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRewards.map((reward) => (
                    <Card key={reward.id} className={cn(!reward.is_active && 'opacity-50')}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">{reward.name}</h4>
                              <p className="text-sm text-muted-foreground">{reward.description}</p>
                            </div>
                            <Badge variant={reward.is_active ? 'default' : 'secondary'}>
                              {reward.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{reward.points_cost} points</Badge>
                            <Badge>{reward.required_tier}+</Badge>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRewardEdit(reward)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => actions.toggleRewardStatus(reward.id)}
                            >
                              {reward.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No rewards found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Loyalty program settings configuration. Changes here will affect the entire program.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Points Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Points per PLN spent</Label>
                  <Input type="number" defaultValue="10" />
                </div>
                <div className="space-y-2">
                  <Label>Points expiration (days)</Label>
                  <Input type="number" defaultValue="365" />
                </div>
                <div className="space-y-2">
                  <Label>Welcome bonus points</Label>
                  <Input type="number" defaultValue="100" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Referral Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Referral bonus points</Label>
                  <Input type="number" defaultValue="100" />
                </div>
                <div className="space-y-2">
                  <Label>Referee bonus points</Label>
                  <Input type="number" defaultValue="50" />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch defaultChecked />
                  <Label>Enable referral program</Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>
              Update member tier and adjust points as needed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tier</Label>
              <Select value={memberForm.tier_id} onValueChange={(value) => setMemberForm(prev => ({ ...prev, tier_id: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                  <SelectItem value="diamond">Diamond</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Points Adjustment</Label>
              <Input
                type="number"
                value={memberForm.manual_points_adjustment}
                onChange={(e) => setMemberForm(prev => ({ ...prev, manual_points_adjustment: parseInt(e.target.value) || 0 }))}
                placeholder="Enter positive or negative value"
              />
              <p className="text-xs text-muted-foreground">Use positive to add points, negative to remove</p>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={memberForm.notes}
                onChange={(e) => setMemberForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Reason for adjustment..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMemberUpdate} disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Reward Dialog */}
      <Dialog open={isRewardDialogOpen} onOpenChange={setIsRewardDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedReward ? 'Edit Reward' : 'Add New Reward'}</DialogTitle>
            <DialogDescription>
              {selectedReward ? 'Update reward details.' : 'Create a new reward for the loyalty program.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Reward Name</Label>
              <Input
                value={rewardForm.name}
                onChange={(e) => setRewardForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter reward name"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={rewardForm.description}
                onChange={(e) => setRewardForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the reward..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={rewardForm.type} onValueChange={(value: any) => setRewardForm(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">Discount</SelectItem>
                    <SelectItem value="free_service">Free Service</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="experience">Experience</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Required Tier</Label>
                <Select value={rewardForm.required_tier} onValueChange={(value) => setRewardForm(prev => ({ ...prev, required_tier: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bronze">Bronze</SelectItem>
                    <SelectItem value="Silver">Silver</SelectItem>
                    <SelectItem value="Gold">Gold</SelectItem>
                    <SelectItem value="Platinum">Platinum</SelectItem>
                    <SelectItem value="Diamond">Diamond</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Points Cost</Label>
                <Input
                  type="number"
                  value={rewardForm.points_cost}
                  onChange={(e) => setRewardForm(prev => ({ ...prev, points_cost: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Value</Label>
                <Input
                  type="number"
                  value={rewardForm.discount_value}
                  onChange={(e) => setRewardForm(prev => ({ ...prev, discount_value: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={rewardForm.is_active}
                onCheckedChange={(checked) => setRewardForm(prev => ({ ...prev, is_active: checked }))}
              />
              <Label>Active</Label>
            </div>

            <div className="space-y-2">
              <Label>Expiration Date (optional)</Label>
              <Input
                type="date"
                value={rewardForm.expires_at}
                onChange={(e) => setRewardForm(prev => ({ ...prev, expires_at: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsRewardDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRewardSave} disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {selectedReward ? 'Update' : 'Create'} Reward
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoyaltyAdminPanel;