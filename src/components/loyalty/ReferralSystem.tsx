import React, { useState } from 'react';
import {
  Users,
  Share2,
  Gift,
  Copy,
  Check,
  Mail,
  MessageCircle,
  Smartphone,
  QrCode,
  Crown,
  Star,
  Calendar,
  TrendingUp,
  UserPlus,
  Heart,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLoyaltyContext } from '@/contexts/LoyaltyContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ReferralSystemProps {
  className?: string;
}

export function ReferralSystem({ className }: ReferralSystemProps) {
  const { state, createReferral, checkReferralCode, processSuccessfulReferral } = useLoyaltyContext();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('refer');
  const [referralData, setReferralData] = useState({
    refereeEmail: '',
    refereeName: '',
    refereePhone: '',
    referralType: 'client',
    customMessage: ''
  });
  const [checkCode, setCheckCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const referrals = state.referrals || [];
  const successfulReferrals = referrals.filter(r => r.status === 'completed');
  const pendingReferrals = referrals.filter(r => r.status === 'pending');
  const registeredReferrals = referrals.filter(r => r.status === 'registered');

  // Calculate referral stats
  const totalReferralPoints = referrals.reduce((sum, r) => sum + r.referrer_reward_points, 0);
  const successfulReferralPoints = successfulReferrals.reduce((sum, r) => sum + r.referrer_reward_points, 0);

  const handleCreateReferral = async () => {
    if (!referralData.refereeEmail) {
      toast({
        title: "Error",
        description: "Please enter the referee's email address",
        variant: "destructive"
      });
      return;
    }

    try {
      const referral = await createReferral(
        referralData.refereeEmail,
        referralData.refereeName,
        referralData.refereePhone,
        referralData.referralType
      );

      if (referral) {
        toast({
          title: "Referral Created!",
          description: `Referral code: ${referral.referral_code}`,
        });
        setShowCreateDialog(false);
        setReferralData({
          refereeEmail: '',
          refereeName: '',
          refereePhone: '',
          referralType: 'client',
          customMessage: ''
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create referral. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard",
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleShareViaEmail = (referralCode: string) => {
    const subject = encodeURIComponent('Join me at mariiaborysevych - Exclusive Beauty & Fitness Services');
    const body = encodeURIComponent(
      `Hi!\n\nI'd love to invite you to experience the premium beauty and fitness services at mariiaborysevych. As a member, I know you'll love their luxury treatments and personalized care.\n\nUse my referral code: ${referralCode}\n\nYou'll get exclusive welcome benefits, and I'll earn rewards too!\n\nBook your appointment here: https://mariaborysevych.com\n\nLooking forward to seeing you there!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleShareViaSMS = (referralCode: string) => {
    const message = encodeURIComponent(
      `Join me at mariiaborysevych! 🌟 Use code ${referralCode} for exclusive welcome benefits. Book now: https://mariaborysevych.com`
    );
    window.location.href = `sms:?&body=${message}`;
  };

  const handleCheckReferralCode = async () => {
    if (!checkCode) return;

    try {
      const referral = await checkReferralCode(checkCode);
      if (referral) {
        toast({
          title: "Valid Referral Code!",
          description: "This code is valid. Complete your booking to claim your welcome bonus.",
        });
      } else {
        toast({
          title: "Invalid Code",
          description: "This referral code is not valid or has expired.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check referral code. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'registered':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'first_booking':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getReferralTypeIcon = (type: string) => {
    switch (type) {
      case 'client':
        return <Users className="h-4 w-4" />;
      case 'staff':
        return <Crown className="h-4 w-4" />;
      case 'social':
        return <Share2 className="h-4 w-4" />;
      case 'partner':
        return <Heart className="h-4 w-4" />;
      case 'corporate':
        return <Sparkles className="h-4 w-4" />;
      case 'influencer':
        return <Star className="h-4 w-4" />;
      default:
        return <UserPlus className="h-4 w-4" />;
    }
  };

  const getLatestReferralCode = () => {
    return referrals.length > 0 ? referrals[0].referral_code : null;
  };

  const latestReferralCode = getLatestReferralCode();

  return (
    <div className={cn('space-y-6', className)}>
      {/* Referral Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-900">{successfulReferrals.length}</p>
            <p className="text-sm text-green-700">Successful Referrals</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-900">{successfulReferralPoints}</p>
            <p className="text-sm text-blue-700">Points Earned</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-900">{pendingReferrals.length}</p>
            <p className="text-sm text-purple-700">Pending Referrals</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
          <CardContent className="p-4 text-center">
            <Gift className="h-8 w-8 text-amber-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-900">{totalReferralPoints}</p>
            <p className="text-sm text-amber-700">Total Referral Points</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="refer" className="gap-2">
            <Share2 className="h-4 w-4" />
            Refer Friends
          </TabsTrigger>
          <TabsTrigger value="referrals" className="gap-2">
            <Users className="h-4 w-4" />
            My Referrals
          </TabsTrigger>
          <TabsTrigger value="redeem" className="gap-2">
            <Gift className="h-4 w-4" />
            Redeem Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="refer" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create New Referral */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Create New Referral
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium" htmlFor="friend-s-email">Friend's Email</label>
                  <Input
                    type="email"
                    placeholder="friend@example.com"
                    value={referralData.refereeEmail}
                    onChange={(e) => setReferralData(prev => ({ ...prev, refereeEmail: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" htmlFor="friend-s-name-optional">Friend's Name (Optional)</label>
                  <Input
                    placeholder="John Doe"
                    value={referralData.refereeName}
                    onChange={(e) => setReferralData(prev => ({ ...prev, refereeName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" htmlFor="phone-optional">Phone (Optional)</label>
                  <Input
                    type="tel"
                    placeholder="+48 123 456 789"
                    value={referralData.refereePhone}
                    onChange={(e) => setReferralData(prev => ({ ...prev, refereePhone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" htmlFor="referral-type">Referral Type</label>
                  <Select value={referralData.referralType} onValueChange={(value) => setReferralData(prev => ({ ...prev, referralType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Friend/Client</SelectItem>
                      <SelectItem value="staff">Staff Member</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="partner">Business Partner</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="influencer">Influencer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateReferral} className="w-full">
                  Create Referral
                </Button>
              </CardContent>
            </Card>

            {/* Share Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Share Your Referral
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {latestReferralCode ? (
                  <>
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-900">Your Referral Code</p>
                          <p className="text-2xl font-bold text-purple-900">{latestReferralCode}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyCode(latestReferralCode)}
                          className="gap-2"
                        >
                          {copiedCode === latestReferralCode ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          {copiedCode === latestReferralCode ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleShareViaEmail(latestReferralCode)}
                        className="gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        Share via Email
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleShareViaSMS(latestReferralCode)}
                        className="gap-2"
                      >
                        <Smartphone className="h-4 w-4" />
                        Share via SMS
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: 'Join me at mariiaborysevych',
                              text: `Use my referral code ${latestReferralCode} for exclusive benefits!`,
                              url: 'https://mariaborysevych.com'
                            });
                          }
                        }}
                      >
                        <MessageCircle className="h-4 w-4" />
                        Share via Native
                      </Button>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Referral Benefits</h4>
                      <ul className="space-y-1 text-sm text-blue-800">
                        <li>• Your friend gets welcome bonus points</li>
                        <li>• You earn points when they book their first appointment</li>
                        <li>• Both get access to exclusive member benefits</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Create your first referral to start sharing!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {referrals.length > 0 ? (
                <div className="space-y-4">
                  {referrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-muted">
                          {getReferralTypeIcon(referral.referral_type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{referral.referee_name || referral.referee_email}</p>
                            <Badge className={cn('text-xs', getStatusColor(referral.status))}>
                              {referral.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Code: {referral.referral_code}</span>
                            <span>Created: {format(new Date(referral.referral_date), 'MMM d, yyyy')}</span>
                            {referral.completion_date && (
                              <span>Completed: {format(new Date(referral.completion_date), 'MMM d, yyyy')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">+{referral.referrer_reward_points}</p>
                        <p className="text-xs text-muted-foreground">points earned</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Referrals Yet</h3>
                  <p className="text-muted-foreground">Start referring friends to earn rewards!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redeem" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Redeem Referral Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium" htmlFor="enter-referral-code">Enter Referral Code</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter code..."
                    value={checkCode}
                    onChange={(e) => setCheckCode(e.target.value.toUpperCase())}
                    className="uppercase"
                  />
                  <Button onClick={handleCheckReferralCode}>
                    Check Code
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">Welcome Benefits</h4>
                <ul className="space-y-1 text-sm text-green-800">
                  <li>• Bonus points on your first treatment</li>
                  <li>• Special member discount</li>
                  <li>• Access to exclusive member events</li>
                  <li>• Personalized service recommendations</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}