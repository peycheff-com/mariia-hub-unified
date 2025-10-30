import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Gift,
  Calendar,
  Clock,
  Star,
  Target,
  Zap,
  History,
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLoyaltyContext } from '@/contexts/LoyaltyContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PointsTransaction } from '@/contexts/LoyaltyContext';

interface PointsSystemProps {
  className?: string;
}

export function PointsSystem({ className }: PointsSystemProps) {
  const { state, earnPoints, redeemPoints } = useLoyaltyContext();
  const [activeTab, setActiveTab] = useState('balance');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEarningDialog, setShowEarningDialog] = useState(false);
  const [earningData, setEarningData] = useState({
    points: 0,
    description: '',
    referenceType: '',
    referenceId: '',
  });

  const currentPoints = state.member?.current_points || 0;
  const lifetimePoints = state.member?.lifetime_points || 0;
  const expiringPoints = state.stats?.expiringPoints || 0;

  // Filter transactions
  const filteredTransactions = state.transactions.filter(transaction => {
    const matchesFilter = filterType === 'all' || transaction.transaction_type === filterType;
    const matchesSearch = searchTerm === '' ||
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Calculate statistics
  const totalEarned = filteredTransactions
    .filter(t => t.transaction_type === 'earn')
    .reduce((sum, t) => sum + t.points, 0);

  const totalRedeemed = Math.abs(
    filteredTransactions
      .filter(t => t.transaction_type === 'redeem')
      .reduce((sum, t) => sum + t.points, 0)
  );

  const recentTransactions = filteredTransactions.slice(0, 10);

  const handleEarnPoints = async () => {
    if (!earningData.points || !earningData.description) return;

    try {
      await earnPoints(
        earningData.points,
        earningData.description,
        earningData.referenceType,
        earningData.referenceId
      );

      setShowEarningDialog(false);
      setEarningData({ points: 0, description: '', referenceType: '', referenceId: '' });
    } catch (error) {
      console.error('Error earning points:', error);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earn':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'redeem':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      case 'expire':
        return <Clock className="h-5 w-5 text-orange-600" />;
      case 'bonus':
        return <Star className="h-5 w-5 text-purple-600" />;
      default:
        return <History className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earn':
        return 'bg-green-50 border-green-200';
      case 'redeem':
        return 'bg-red-50 border-red-200';
      case 'expire':
        return 'bg-orange-50 border-orange-200';
      case 'bonus':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Points Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-900">{currentPoints.toLocaleString()}</p>
            <p className="text-sm text-green-700">Available Points</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-purple-900 flex items-center gap-2">
              <Star className="h-5 w-5" />
              Lifetime Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-900">{lifetimePoints.toLocaleString()}</p>
            <p className="text-sm text-purple-700">Total Earned</p>
          </CardContent>
        </Card>

        <Card className={cn(
          'border',
          expiringPoints > 0
            ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
            : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200'
        )}>
          <CardHeader className="pb-2">
            <CardTitle className={cn(
              'flex items-center gap-2',
              expiringPoints > 0 ? 'text-orange-900' : 'text-blue-900'
            )}>
              <Clock className="h-5 w-5" />
              {expiringPoints > 0 ? 'Expiring Soon' : 'All Active'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn(
              'text-3xl font-bold',
              expiringPoints > 0 ? 'text-orange-900' : 'text-blue-900'
            )}>
              {expiringPoints > 0 ? expiringPoints.toLocaleString() : '0'}
            </p>
            <p className={cn(
              'text-sm',
              expiringPoints > 0 ? 'text-orange-700' : 'text-blue-700'
            )}>
              Points expiring in 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Points Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Earning Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Earned</span>
                <span className="text-lg font-semibold text-green-600">+{totalEarned.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Redeemed</span>
                <span className="text-lg font-semibold text-red-600">-{totalRedeemed.toLocaleString()}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Net Points</span>
                <span className="text-lg font-bold text-primary">
                  {(totalEarned - totalRedeemed).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Dialog open={showEarningDialog} onOpenChange={setShowEarningDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <ArrowUpRight className="h-4 w-4" />
                    Earn Points
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Manually Earn Points</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium" htmlFor="points-amount">Points Amount</label>
                      <Input
                        type="number"
                        placeholder="Enter points to earn"
                        value={earningData.points || ''}
                        onChange={(e) => setEarningData(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium" htmlFor="description">Description</label>
                      <Input
                        placeholder="Reason for earning points"
                        value={earningData.description}
                        onChange={(e) => setEarningData(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium" htmlFor="reference-type">Reference Type</label>
                      <Select value={earningData.referenceType} onValueChange={(value) => setEarningData(prev => ({ ...prev, referenceType: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="booking">Booking</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="referral">Referral</SelectItem>
                          <SelectItem value="bonus">Bonus</SelectItem>
                          <SelectItem value="promotion">Promotion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium" htmlFor="reference-id">Reference ID</label>
                      <Input
                        placeholder="Optional reference ID"
                        value={earningData.referenceId}
                        onChange={(e) => setEarningData(prev => ({ ...prev, referenceId: e.target.value }))}
                      />
                    </div>
                    <Button onClick={handleEarnPoints} className="w-full">
                      Earn Points
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" className="gap-2">
                <ArrowDownRight className="h-4 w-4" />
                Redeem Points
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Transaction History
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="earn">Earned</SelectItem>
                  <SelectItem value="redeem">Redeemed</SelectItem>
                  <SelectItem value="expire">Expired</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg border',
                    getTransactionColor(transaction.transaction_type)
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-white">
                      {getTransactionIcon(transaction.transaction_type)}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{format(new Date(transaction.created_at), 'MMM d, yyyy • h:mm a')}</span>
                        {transaction.reference_type && (
                          <Badge variant="outline" className="text-xs">
                            {transaction.reference_type}
                          </Badge>
                        )}
                        {transaction.expires_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Expires {format(new Date(transaction.expires_at), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      'text-lg font-bold',
                      transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {transaction.points > 0 ? '+' : ''}{transaction.points.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterType !== 'all'
                  ? 'Try adjusting your filters or search terms'
                  : 'Start earning points by booking services or completing activities'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}