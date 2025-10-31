import React, { useState } from 'react';
import { Share2, Copy, Check, Users, Gift, MessageCircle, Mail, Facebook, Twitter, Plus, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useLoyalty } from '@/hooks/useLoyalty';
import { Skeleton } from '@/components/ui/skeleton';

interface ReferralShareProps {
  className?: string;
}

export function ReferralShare({ className }: ReferralShareProps) {
  const {
    referralCode,
    referrals,
    generateReferralCode,
    isGeneratingReferral,
    currentTier,
    isLoadingReferrals
  } = useLoyalty();

  const [copied, setCopied] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [referralForm, setReferralForm] = useState({
    email: '',
    name: '',
    phone: ''
  });

  const referralUrl = referralCode ? `${window.location.origin}?ref=${referralCode}` : '';
  const referralMessage = referralCode
    ? `Join me at Mariia Beauty & Fitness! Use my code ${referralCode} and get bonus points on your first booking. 🎁✨`
    : '';

  const handleCopyCode = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${type === 'code' ? 'Referral code' : 'Referral link'} copied!`);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleShare = async (platform: string) => {
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}&quote=${encodeURIComponent(referralMessage)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(referralMessage)}&url=${encodeURIComponent(referralUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(referralMessage + ' ' + referralUrl)}`,
      email: `mailto:?subject=Join me at Mariia Beauty & Fitness&body=${encodeURIComponent(referralMessage + '\n\n' + referralUrl)}`
    };

    const url = urls[platform];
    if (url) {
      if (platform === 'email') {
        window.location.href = url;
      } else {
        window.open(url, '_blank', 'width=600,height=400');
      }
    }
  };

  const handleCreateReferral = async () => {
    if (!referralForm.email) {
      toast.error('Email is required');
      return;
    }

    try {
      await generateReferralCode(referralForm);
      setIsCreateDialogOpen(false);
      setReferralForm({ email: '', name: '', phone: '' });
    } catch (error) {
      console.error('Error creating referral:', error);
    }
  };

  const getReferralReward = () => {
    // Get from loyalty settings or use default
    return 100; // Default - can be enhanced to get from settings
  };

  const successfulReferrals = referrals?.filter(r => r.status === 'completed').length || 0;
  const pendingReferrals = referrals?.filter(r => r.status === 'pending').length || 0;

  if (isLoadingReferrals) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('bg-gradient-to-br from-green-50 to-emerald-50 border-green-200', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-900">
          <Users className="h-6 w-6" />
          Refer Friends
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Referral Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs font-medium">Successful</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{successfulReferrals}</p>
          </div>

          <div className="bg-white/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Pending</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{pendingReferrals}</p>
          </div>

          <div className="bg-white/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <Gift className="h-4 w-4" />
              <span className="text-xs font-medium">Reward</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{getReferralReward()}</p>
          </div>

          <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <Gift className="h-4 w-4" />
              <span className="text-xs font-medium">Total Earned</span>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {successfulReferrals * getReferralReward()}
            </p>
          </div>
        </div>

        {/* Referral Code Generation */}
        {!referralCode ? (
          <div className="text-center p-6 bg-white/30 rounded-lg">
            <Gift className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Invite Friends & Earn Rewards
            </h3>
            <p className="text-sm text-green-700 mb-4">
              Create referrals and earn {getReferralReward()} points for each friend who makes their first booking!
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Referral
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Referral</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="friend@example.com"
                        value={referralForm.email}
                        onChange={(e) => setReferralForm(prev => ({ ...prev, email: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Friend's name"
                        value={referralForm.name}
                        onChange={(e) => setReferralForm(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+48 123 456 789"
                        value={referralForm.phone}
                        onChange={(e) => setReferralForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={handleCreateReferral}
                        disabled={isGeneratingReferral}
                        className="flex-1"
                      >
                        {isGeneratingReferral ? 'Creating...' : 'Create Referral'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-xs text-green-600 mt-4">
              You can create multiple referrals for different friends
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Referral Code Display */}
            <div className="bg-white/50 rounded-lg p-4">
              <label className="text-sm font-medium text-green-900 mb-2 block" htmlFor="your-referral-code">
                Your Referral Code
              </label>
              <div className="flex gap-2">
                <Input
                  value={referralCode}
                  readOnly
                  className="font-mono text-lg text-center bg-white/70 border-green-300"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopyCode(referralCode, 'code')}
                  className="border-green-300 hover:bg-green-50"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-green-900">Share via</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleShare('facebook')}
                  className="gap-2 border-blue-200 hover:bg-blue-50"
                >
                  <Facebook className="h-4 w-4 text-blue-600" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShare('twitter')}
                  className="gap-2 border-sky-200 hover:bg-sky-50"
                >
                  <Twitter className="h-4 w-4 text-sky-600" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShare('whatsapp')}
                  className="gap-2 border-green-200 hover:bg-green-50"
                >
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShare('email')}
                  className="gap-2 border-gray-200 hover:bg-gray-50"
                >
                  <Mail className="h-4 w-4 text-gray-600" />
                  Email
                </Button>
              </div>
            </div>

            {/* Share Link */}
            <div className="bg-white/50 rounded-lg p-4">
              <label className="text-sm font-medium text-green-900 mb-2 block" htmlFor="share-link">
                Share Link
              </label>
              <div className="flex gap-2">
                <Input
                  value={referralUrl}
                  readOnly
                  className="bg-white/70 border-green-300"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopyCode(referralUrl, 'link')}
                  className="border-green-300 hover:bg-green-50"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Create Another Referral */}
            <div className="flex justify-center">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2 border-green-300 hover:bg-green-50">
                    <Plus className="h-4 w-4" />
                    Create Another Referral
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Referral</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email-new">Email *</Label>
                      <Input
                        id="email-new"
                        type="email"
                        placeholder="friend@example.com"
                        value={referralForm.email}
                        onChange={(e) => setReferralForm(prev => ({ ...prev, email: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="name-new">Name</Label>
                      <Input
                        id="name-new"
                        type="text"
                        placeholder="Friend's name"
                        value={referralForm.name}
                        onChange={(e) => setReferralForm(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone-new">Phone</Label>
                      <Input
                        id="phone-new"
                        type="tel"
                        placeholder="+48 123 456 789"
                        value={referralForm.phone}
                        onChange={(e) => setReferralForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={handleCreateReferral}
                        disabled={isGeneratingReferral}
                        className="flex-1"
                      >
                        {isGeneratingReferral ? 'Creating...' : 'Create Referral'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* How It Works */}
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-3">How It Works</h4>
              <div className="space-y-2 text-sm text-green-800">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    1
                  </div>
                  <p>Share your referral code or link with friends</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    2
                  </div>
                  <p>Your friend uses the code on their first booking</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    3
                  </div>
                  <p>They get bonus points and you earn {getReferralReward()} points!</p>
                </div>
              </div>
            </div>

            {/* Referral History */}
            {referrals && referrals.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-green-900">Recent Referrals</h4>
                <div className="space-y-2">
                  {referrals.slice(0, 3).map((referral) => (
                    <div
                      key={referral.id}
                      className="flex items-center justify-between p-3 bg-white/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-3 h-3 rounded-full',
                            referral.status === 'completed'
                              ? 'bg-green-500'
                              : referral.status === 'pending'
                              ? 'bg-yellow-500'
                              : 'bg-gray-400'
                          )}
                        />
                        <div>
                          <p className="text-sm font-medium text-green-900">
                            {referral.status === 'completed'
                              ? 'Successful Referral'
                              : referral.status === 'pending'
                              ? 'Pending Confirmation'
                              : 'Expired'}
                          </p>
                          <p className="text-xs text-green-700">
                            Code: {referral.referral_code}
                          </p>
                        </div>
                      </div>
                      {referral.status === 'completed' && (
                        <Badge className="bg-green-100 text-green-900">
                          +{referral.reward_points} pts
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}