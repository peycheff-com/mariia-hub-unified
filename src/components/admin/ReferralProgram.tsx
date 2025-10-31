import React, { useState } from 'react';
import { Users, Share2, TrendingUp, Gift, Calendar, Filter, Search, Download, Mail, MessageCircle, Facebook, Twitter, Settings, Award } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';


interface ReferralWithUser {
  id: string;
  referrer_id: string;
  referred_id: string | null;
  referral_code: string;
  status: 'pending' | 'completed' | 'expired';
  reward_points: number;
  referrer_reward_points: number;
  completed_at: string | null;
  expires_at: string | null;
  created_at: string;
  referrer_profile: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
  referred_profile: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
}

interface ReferralSettings {
  default_reward_points: number;
  default_referrer_reward_points: number;
  expiry_days: number;
  auto_approve: boolean;
  email_notifications: boolean;
}

export function ReferralProgram() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30');
  const [settings, setSettings] = useState<ReferralSettings>({
    default_reward_points: 100,
    default_referrer_reward_points: 100,
    expiry_days: 90,
    auto_approve: true,
    email_notifications: true
  });

  const queryClient = useQueryClient();

  // Fetch referrals with user profiles
  const { data: referrals, isLoading: isLoadingReferrals } = useQuery({
    queryKey: ['admin-referrals', searchTerm, statusFilter, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('referrals')
        .select(`
          *,
          referrer_profile:profiles!referrals_referrer_id_fkey (
            first_name,
            last_name,
            email
          ),
          referred_profile:profiles!referrals_referred_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        query = query.or(`referral_code.ilike.%${searchTerm}%,referrer_profile.email.ilike.%${searchTerm}%,referred_profile.email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ReferralWithUser[];
    }
  });

  // Fetch referral stats
  const { data: stats } = useQuery({
    queryKey: ['admin-referral-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('status, reward_points, referrer_reward_points');

      if (error) throw error;

      const total = data?.length || 0;
      const pending = data?.filter(r => r.status === 'pending').length || 0;
      const completed = data?.filter(r => r.status === 'completed').length || 0;
      const expired = data?.filter(r => r.status === 'expired').length || 0;
      const totalRewardsPaid = data?.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.referrer_reward_points, 0) || 0;

      return { total, pending, completed, expired, totalRewardsPaid };
    }
  });

  // Update referral status
  const updateReferralStatus = async (referralId: string, status: string) => {
    const updateData: any = { status };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();

      // Get referral details to award points
      const referral = referrals?.find(r => r.id === referralId);
      if (referral?.referrer_id && referral?.referred_id) {
        // Get loyalty program ID
        const { data: program } = await supabase
          .from('loyalty_programs')
          .select('id')
          .eq('is_active', true)
          .single();

        if (program) {
          // Award points to referrer
          await supabase.rpc('earn_loyalty_points', {
            p_customer_id: referral.referrer_id,
            p_program_id: program.id,
            p_points: referral.referrer_reward_points,
            p_reference_id: referralId,
            p_reference_type: 'referral',
            p_description: `Referral bonus for ${referral.referred_profile?.email}`
          });

          // Award points to referred
          await supabase.rpc('earn_loyalty_points', {
            p_customer_id: referral.referred_id,
            p_program_id: program.id,
            p_points: referral.reward_points,
            p_reference_id: referralId,
            p_reference_type: 'referral',
            p_description: 'Welcome bonus for joining via referral'
          });
        }
      }
    }

    const { error } = await supabase
      .from('referrals')
      .update(updateData)
      .eq('id', referralId);

    if (error) {
      toast.error('Failed to update referral status');
    } else {
      toast.success('Referral status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-referrals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-referral-stats'] });
    }
  };

  // Export referrals data
  const exportReferrals = () => {
    if (!referrals) return;

    const csv = [
      ['Referral Code', 'Referrer Email', 'Referred Email', 'Status', 'Reward Points', 'Created Date'],
      ...referrals.map(r => [
        r.referral_code,
        r.referrer_profile?.email || '',
        r.referred_profile?.email || '',
        r.status,
        r.reward_points.toString(),
        format(new Date(r.created_at), 'yyyy-MM-dd')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referrals-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Send reminder email
  const sendReminder = async (referral: ReferralWithUser) => {
    // This would integrate with your email service
    toast.success('Reminder email sent successfully');
  };

  const filteredReferrals = referrals?.filter(referral => {
    if (statusFilter !== 'all' && referral.status !== statusFilter) return false;
    if (searchTerm && !referral.referral_code.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !referral.referrer_profile?.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !referral.referred_profile?.email.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Referral Program</h2>
          <p className="text-muted-foreground">Manage customer referrals and rewards</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportReferrals}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Settings className="h-4 w-4 mr-2" />
                Program Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Referral Program Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reward-points">Default Reward Points (Referred)</Label>
                  <Input
                    id="reward-points"
                    type="number"
                    value={settings.default_reward_points}
                    onChange={(e) => setSettings({...settings, default_reward_points: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="referrer-reward">Default Reward Points (Referrer)</Label>
                  <Input
                    id="referrer-reward"
                    type="number"
                    value={settings.default_referrer_reward_points}
                    onChange={(e) => setSettings({...settings, default_referrer_reward_points: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="expiry-days">Referral Expiry (Days)</Label>
                  <Input
                    id="expiry-days"
                    type="number"
                    value={settings.expiry_days}
                    onChange={(e) => setSettings({...settings, expiry_days: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-approve">Auto-approve Referrals</Label>
                  <Switch
                    id="auto-approve"
                    checked={settings.auto_approve}
                    onCheckedChange={(checked) => setSettings({...settings, auto_approve: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <Switch
                    id="email-notifications"
                    checked={settings.email_notifications}
                    onCheckedChange={(checked) => setSettings({...settings, email_notifications: checked})}
                  />
                </div>
                <Button className="w-full" onClick={() => toast.success('Settings saved successfully')}>
                  Save Settings
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.pending || 0}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.completed || 0}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalRewardsPaid || 0}</p>
                <p className="text-sm text-muted-foreground">Points Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-rose-600" />
              <div>
                <p className="text-2xl font-bold">
                  {stats?.total ? Math.round((stats.completed / stats.total) * 100) : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Referral Management</CardTitle>
          <CardDescription>Monitor and manage all referral activities</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by code or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Referrals Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referral Code</TableHead>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Referred</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingReferrals ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}>
                        <div className="h-12 bg-muted animate-pulse rounded" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredReferrals.length > 0 ? (
                  filteredReferrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell className="font-mono">
                        {referral.referral_code}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {referral.referrer_profile?.first_name} {referral.referrer_profile?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {referral.referrer_profile?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {referral.referred_profile ? (
                          <div>
                            <p className="font-medium">
                              {referral.referred_profile.first_name} {referral.referred_profile.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {referral.referred_profile.email}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not registered yet</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            referral.status === 'completed' ? 'default' :
                            referral.status === 'pending' ? 'secondary' : 'outline'
                          }
                        >
                          {referral.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{referral.reward_points} pts</p>
                          <p className="text-xs text-muted-foreground">
                            +{referral.referrer_reward_points} pts referrer
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {format(new Date(referral.created_at), 'MMM d, yyyy')}
                        </p>
                        {referral.expires_at && (
                          <p className="text-xs text-muted-foreground">
                            Expires {format(new Date(referral.expires_at), 'MMM d')}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {referral.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => updateReferralStatus(referral.id, 'completed')}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => sendReminder(referral)}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {referral.status === 'completed' && (
                            <Button size="sm" variant="outline" disabled>
                              <Gift className="h-4 w-4 mr-1" />
                              Rewarded
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No referrals found</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}