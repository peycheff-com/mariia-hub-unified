import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Heart,
  MessageSquare,
  Share2,
  Star,
  Award,
  Gift,
  Target,
  TrendingUp,
  Calendar,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ThumbsUp,
  MessageCircle,
  Send,
  Camera,
  Video,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Crown,
  Trophy,
  ShoppingCart,
  UserPlus,
  Flag,
  Filter,
  Search,
  Download,
  RefreshCw
} from 'lucide-react';
import { marketingService } from '@/services/marketing.service';
import {
  UserGeneratedContent,
  LoyaltyProgram,
  CustomerLoyalty,
  ReferralProgram,
  Referral,
  EmailSubscriber
} from '@/types/marketing';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface CommunityEngagementProps {
  className?: string;
}

export const CommunityEngagement: React.FC<CommunityEngagementProps> = ({ className }) => {
  const [userGeneratedContent, setUserGeneratedContent] = useState<UserGeneratedContent[]>([]);
  const [loyaltyPrograms, setLoyaltyPrograms] = useState<LoyaltyProgram[]>([]);
  const [customerLoyalty, setCustomerLoyalty] = useState<CustomerLoyalty[]>([]);
  const [referralPrograms, setReferralPrograms] = useState<ReferralProgram[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [subscribers, setSubscribers] = useState<EmailSubscriber[]>([]);
  const [selectedContent, setSelectedContent] = useState<UserGeneratedContent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ugc');

  // Dialog states
  const [isCreateLoyaltyProgramDialogOpen, setIsCreateLoyaltyProgramDialogOpen] = useState(false);
  const [isCreateReferralProgramDialogOpen, setIsCreateReferralProgramDialogOpen] = useState(false);
  const [isFeatureContentDialogOpen, setIsFeatureContentDialogOpen] = useState(false);

  // Form states
  const [loyaltyProgramForm, setLoyaltyProgramForm] = useState<Partial<LoyaltyProgram>>({
    name: '',
    description: '',
    programType: 'points',
    rules: {},
    rewards: {},
    status: 'active'
  });

  const [referralProgramForm, setReferralProgramForm] = useState<Partial<ReferralProgram>>({
    name: '',
    description: '',
    referrerReward: {},
    refereeReward: {},
    conditions: {},
    status: 'active'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [ugcData, loyaltyProgramsData, referralProgramsData, referralsData, subscribersData] = await Promise.all([
        loadUserGeneratedContent(),
        loadLoyaltyPrograms(),
        loadReferralPrograms(),
        loadReferrals(),
        loadSubscribers()
      ]);

      setUserGeneratedContent(ugcData);
      setLoyaltyPrograms(loyaltyProgramsData);
      setReferralPrograms(referralProgramsData);
      setReferrals(referralsData);
      setSubscribers(subscribersData);
    } catch (error) {
      console.error('Error loading community data:', error);
      toast.error('Failed to load community data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserGeneratedContent = async (): Promise<UserGeneratedContent[]> => {
    // Mock UGC data - in real implementation this would come from the service
    return [
      {
        id: 'ugc_1',
        user_id: 'user_1',
        content_type: 'review',
        content: 'Amazing experience at Mariia Hub! The facial treatment was incredible and my skin has never looked better. The staff is so professional and caring.',
        media_urls: ['https://example.com/review1.jpg'],
        platform: 'instagram',
        platform_post_id: 'post_123',
        permission_granted: true,
        featured: true,
        featured_at: new Date('2024-01-15'),
        status: 'featured',
        engagement_stats: { likes: 245, comments: 32, shares: 18 },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'ugc_2',
        user_id: 'user_2',
        content_type: 'photo',
        content: 'Love my new brows! Thank you @mariiahub for the amazing service',
        media_urls: ['https://example.com/brows1.jpg'],
        platform: 'instagram',
        platform_post_id: 'post_124',
        permission_granted: false,
        featured: false,
        status: 'pending',
        engagement_stats: { likes: 156, comments: 24, shares: 8 },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  };

  const loadLoyaltyPrograms = async (): Promise<LoyaltyProgram[]> => {
    // Mock loyalty programs - in real implementation this would come from the service
    return [
      {
        id: 'loyalty_1',
        name: 'Mariia Rewards',
        description: 'Earn points for bookings, reviews, and social media engagement',
        programType: 'points',
        rules: {
          booking: 10,
          review: 5,
          social_share: 2,
          referral: 50,
          birthday_bonus: 25
        },
        rewards: {
          100: { type: 'discount', value: 5, description: '5% off next treatment' },
          250: { type: 'discount', value: 10, description: '10% off next treatment' },
          500: { type: 'discount', value: 15, description: '15% off next treatment' },
          1000: { type: 'free', value: 0, description: 'Free express treatment' }
        },
        status: 'active',
        start_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  };

  const loadReferralPrograms = async (): Promise<ReferralProgram[]> => {
    // Mock referral programs - in real implementation this would come from the service
    return [
      {
        id: 'referral_1',
        name: 'Refer a Friend',
        description: 'Give your friends 50 PLN credit, get 50 PLN credit when they book',
        referrerReward: { type: 'credit', amount: 50, currency: 'PLN' },
        refereeReward: { type: 'discount', amount: 50, currency: 'PLN', description: 'First booking discount' },
        conditions: {
          minimum_booking: 200,
          new_customer_only: true,
          credit_expiry_days: 90
        },
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  };

  const loadReferrals = async (): Promise<Referral[]> => {
    // Mock referrals - in real implementation this would come from the service
    return [
      {
        id: 'ref_1',
        program_id: 'referral_1',
        referrer_id: 'user_1',
        referee_id: 'user_2',
        referral_code: 'MARIIA123',
        status: 'converted',
        conversion_date: new Date('2024-01-20'),
        reward_amount: 50,
        reward_paid: true,
        reward_paid_at: new Date('2024-01-25'),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  };

  const loadSubscribers = async (): Promise<EmailSubscriber[]> => {
    // Mock subscribers - in real implementation this would come from the service
    return [
      {
        id: 'sub_1',
        email: 'customer1@example.com',
        first_name: 'Anna',
        last_name: 'Kowalska',
        engagement_score: 85,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  };

  const handleFeatureContent = async (contentId: string, featured: boolean) => {
    try {
      // Mock implementation - in real implementation this would call the service
      setUserGeneratedContent(prev =>
        prev.map(content =>
          content.id === contentId
            ? { ...content, featured, featured_at: featured ? new Date() : undefined, status: featured ? 'featured' : 'approved' }
            : content
        )
      );
      toast.success(featured ? 'Content featured successfully' : 'Content unfeatured');
    } catch (error) {
      console.error('Error featuring content:', error);
      toast.error('Failed to update content');
    }
  };

  const handleModerateContent = async (contentId: string, status: 'approved' | 'rejected') => {
    try {
      // Mock implementation - in real implementation this would call the service
      setUserGeneratedContent(prev =>
        prev.map(content =>
          content.id === contentId
            ? { ...content, status, moderation_notes: status === 'rejected' ? 'Does not meet brand guidelines' : 'Approved for featuring' }
            : content
        )
      );
      toast.success(`Content ${status} successfully`);
    } catch (error) {
      console.error('Error moderating content:', error);
      toast.error('Failed to moderate content');
    }
  };

  const handleCreateLoyaltyProgram = async () => {
    try {
      // Mock implementation - in real implementation this would call the service
      const newProgram: LoyaltyProgram = {
        id: `loyalty_${Date.now()}`,
        name: loyaltyProgramForm.name || '',
        description: loyaltyProgramForm.description || '',
        programType: loyaltyProgramForm.programType || 'points',
        rules: loyaltyProgramForm.rules || {},
        rewards: loyaltyProgramForm.rewards || {},
        status: loyaltyProgramForm.status || 'active',
        start_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setLoyaltyPrograms([newProgram, ...loyaltyPrograms]);
      setIsCreateLoyaltyProgramDialogOpen(false);
      resetLoyaltyProgramForm();
      toast.success('Loyalty program created successfully');
    } catch (error) {
      console.error('Error creating loyalty program:', error);
      toast.error('Failed to create loyalty program');
    }
  };

  const handleCreateReferralProgram = async () => {
    try {
      // Mock implementation - in real implementation this would call the service
      const newProgram: ReferralProgram = {
        id: `referral_${Date.now()}`,
        name: referralProgramForm.name || '',
        description: referralProgramForm.description || '',
        referrerReward: referralProgramForm.referrerReward || {},
        refereeReward: referralProgramForm.refereeReward || {},
        conditions: referralProgramForm.conditions || {},
        status: referralProgramForm.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setReferralPrograms([newProgram, ...referralPrograms]);
      setIsCreateReferralProgramDialogOpen(false);
      resetReferralProgramForm();
      toast.success('Referral program created successfully');
    } catch (error) {
      console.error('Error creating referral program:', error);
      toast.error('Failed to create referral program');
    }
  };

  const resetLoyaltyProgramForm = () => {
    setLoyaltyProgramForm({
      name: '',
      description: '',
      programType: 'points',
      rules: {},
      rewards: {},
      status: 'active'
    });
  };

  const resetReferralProgramForm = () => {
    setReferralProgramForm({
      name: '',
      description: '',
      referrerReward: {},
      refereeReward: {},
      conditions: {},
      status: 'active'
    });
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'review': return <Star className="w-4 h-4" />;
      case 'testimonial': return <MessageSquare className="w-4 h-4" />;
      case 'photo': return <Camera className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'social_mention': return <MessageCircle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'featured': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'featured': return <Award className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const filteredContent = userGeneratedContent.filter(content => {
    const matchesSearch = content.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || content.status === filterStatus;
    const matchesType = filterType === 'all' || content.content_type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Community Building & Engagement</h2>
          <p className="text-muted-foreground">Foster brand loyalty and encourage user-generated content</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateReferralProgramDialogOpen} onOpenChange={setIsCreateReferralProgramDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Referral Program
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Referral Program</DialogTitle>
                <DialogDescription>
                  Set up a referral program to encourage word-of-mouth marketing
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="referral-name">Program Name</Label>
                  <Input
                    id="referral-name"
                    value={referralProgramForm.name || ''}
                    onChange={(e) => setReferralProgramForm({ ...referralProgramForm, name: e.target.value })}
                    placeholder="e.g., Refer a Friend, Beauty Ambassador"
                  />
                </div>
                <div>
                  <Label htmlFor="referral-description">Description</Label>
                  <Textarea
                    id="referral-description"
                    value={referralProgramForm.description || ''}
                    onChange={(e) => setReferralProgramForm({ ...referralProgramForm, description: e.target.value })}
                    placeholder="Describe your referral program..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Referrer Reward</Label>
                    <div className="space-y-2 mt-2">
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Reward type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="credit">Store Credit</SelectItem>
                          <SelectItem value="discount">Discount</SelectItem>
                          <SelectItem value="free">Free Service</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input type="number" placeholder="Amount" />
                    </div>
                  </div>
                  <div>
                    <Label>Referee Reward</Label>
                    <div className="space-y-2 mt-2">
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Reward type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="discount">Discount</SelectItem>
                          <SelectItem value="credit">Store Credit</SelectItem>
                          <SelectItem value="free">Free Service</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input type="number" placeholder="Amount" />
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Conditions</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <Switch />
                      <Label>Minimum booking amount</Label>
                      <Input type="number" placeholder="0" className="w-24" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch />
                      <Label>New customers only</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch />
                      <Label>Reward expiry (days)</Label>
                      <Input type="number" placeholder="90" className="w-24" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateReferralProgramDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateReferralProgram}>
                    Create Program
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateLoyaltyProgramDialogOpen} onOpenChange={setIsCreateLoyaltyProgramDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Trophy className="w-4 h-4 mr-2" />
                Loyalty Program
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Loyalty Program</DialogTitle>
                <DialogDescription>
                  Set up a loyalty program to reward repeat customers
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="loyalty-name">Program Name</Label>
                  <Input
                    id="loyalty-name"
                    value={loyaltyProgramForm.name || ''}
                    onChange={(e) => setLoyaltyProgramForm({ ...loyaltyProgramForm, name: e.target.value })}
                    placeholder="e.g., Mariia Rewards, VIP Club"
                  />
                </div>
                <div>
                  <Label htmlFor="loyalty-description">Description</Label>
                  <Textarea
                    id="loyalty-description"
                    value={loyaltyProgramForm.description || ''}
                    onChange={(e) => setLoyaltyProgramForm({ ...loyaltyProgramForm, description: e.target.value })}
                    placeholder="Describe your loyalty program..."
                  />
                </div>
                <div>
                  <Label>Program Type</Label>
                  <Select
                    value={loyaltyProgramForm.programType}
                    onValueChange={(value) => setLoyaltyProgramForm({ ...loyaltyProgramForm, programType: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="points">Points-based</SelectItem>
                      <SelectItem value="tier">Tier-based</SelectItem>
                      <SelectItem value="cashback">Cashback</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Earning Rules</Label>
                  <div className="space-y-2 mt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Action (e.g., booking)" />
                      <Input type="number" placeholder="Points" />
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Rule
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Rewards</Label>
                  <div className="space-y-2 mt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Points required" />
                      <Input placeholder="Reward" />
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Reward
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateLoyaltyProgramDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateLoyaltyProgram}>
                    Create Program
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ugc">User Content</TabsTrigger>
          <TabsTrigger value="loyalty">Loyalty Programs</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="insights">Community Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="ugc" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search user-generated content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="review">Reviews</SelectItem>
                <SelectItem value="testimonial">Testimonials</SelectItem>
                <SelectItem value="photo">Photos</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {filteredContent.map((content) => (
              <Card key={content.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getStatusColor(content.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(content.status)}
                            {content.status}
                          </div>
                        </Badge>
                        <div className="flex items-center gap-1">
                          {getContentTypeIcon(content.content_type)}
                          <span className="text-sm text-muted-foreground capitalize">{content.content_type}</span>
                        </div>
                        {content.platform && (
                          <Badge variant="outline">{content.platform}</Badge>
                        )}
                        {content.featured && (
                          <Badge className="bg-purple-100 text-purple-800">
                            <Award className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm mb-3">{content.content}</p>
                      {content.media_urls && content.media_urls.length > 0 && (
                        <div className="flex gap-2 mb-3">
                          {content.media_urls.map((url, index) => (
                            <div key={index} className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Camera className="w-6 h-6 text-gray-400" />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Permission: {content.permission_granted ? 'Granted' : 'Not granted'}</span>
                        {content.engagement_stats && (
                          <>
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {content.engagement_stats.likes || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              {content.engagement_stats.comments || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Share2 className="w-3 h-3" />
                              {content.engagement_stats.shares || 0}
                            </span>
                          </>
                        )}
                        <span>Created {format(new Date(content.created_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {content.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleModerateContent(content.id, 'approved')}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleModerateContent(content.id, 'rejected')}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {content.status === 'approved' && !content.featured && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFeatureContent(content.id, true)}
                        >
                          <Award className="w-4 h-4" />
                        </Button>
                      )}
                      {content.featured && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFeatureContent(content.id, false)}
                        >
                          <EyeOff className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="loyalty" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {loyaltyPrograms.map((program) => (
              <Card key={program.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold mb-1">{program.name}</h3>
                      <p className="text-sm text-muted-foreground">{program.description}</p>
                    </div>
                    <Badge variant={program.status === 'active' ? 'default' : 'secondary'}>
                      {program.status}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Program Type</Label>
                      <p className="text-sm text-muted-foreground capitalize">{program.programType}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Earning Rules</Label>
                      <div className="space-y-1 mt-1">
                        {Object.entries(program.rules).map(([action, points]) => (
                          <div key={action} className="flex justify-between text-sm">
                            <span className="capitalize">{action.replace('_', ' ')}</span>
                            <span className="font-medium">{points} points</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Rewards</Label>
                      <div className="space-y-1 mt-1">
                        {Object.entries(program.rewards).map(([points, reward]) => (
                          <div key={points} className="flex justify-between text-sm">
                            <span>{points} points</span>
                            <span className="font-medium">{reward.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Users className="w-4 h-4 mr-2" />
                      View Members
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Member Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">486</div>
                  <div className="text-sm text-muted-foreground">Active Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">24,580</div>
                  <div className="text-sm text-muted-foreground">Points Issued</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">156</div>
                  <div className="text-sm text-muted-foreground">Rewards Redeemed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">89%</div>
                  <div className="text-sm text-muted-foreground">Retention Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {referralPrograms.map((program) => (
              <Card key={program.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold mb-1">{program.name}</h3>
                      <p className="text-sm text-muted-foreground">{program.description}</p>
                    </div>
                    <Badge variant={program.status === 'active' ? 'default' : 'secondary'}>
                      {program.status}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Referrer Reward</Label>
                        <p className="text-sm">
                          {program.referrerReward.type === 'credit' && `${program.referrerReward.amount} ${program.referrerReward.currency} credit`}
                          {program.referrerReward.type === 'discount' && `${program.referrerReward.amount}% discount`}
                          {program.referrerReward.type === 'free' && 'Free service'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Referee Reward</Label>
                        <p className="text-sm">
                          {program.refereeReward.type === 'discount' && `${program.refereeReward.amount}% discount`}
                          {program.refereeReward.type === 'credit' && `${program.refereeReward.amount} ${program.refereeReward.currency} credit`}
                          {program.refereeReward.type === 'free' && 'Free service'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Conditions</Label>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {program.conditions.minimum_booking && (
                          <div>Minimum booking: ₺{program.conditions.minimum_booking}</div>
                        )}
                        {program.conditions.new_customer_only && (
                          <div>New customers only</div>
                        )}
                        {program.conditions.credit_expiry_days && (
                          <div>Credit expires in {program.conditions.credit_expiry_days} days</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Users className="w-4 h-4 mr-2" />
                      View Referrals
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {referrals.map((referral) => (
                  <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Referral Code: {referral.referral_code}</h4>
                        <p className="text-sm text-muted-foreground">
                          Status: <span className="capitalize">{referral.status}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">₺{referral.reward_amount}</div>
                      <div className="text-xs text-muted-foreground">
                        {referral.reward_paid ? 'Paid' : 'Pending'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Management</CardTitle>
              <CardDescription>
                Monitor and respond to customer reviews across platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">4.8</div>
                  <div className="text-sm text-muted-foreground">Average Rating</div>
                  <div className="flex justify-center mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`w-4 h-4 ${star <= 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">324</div>
                  <div className="text-sm text-muted-foreground">Total Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">92%</div>
                  <div className="text-sm text-muted-foreground">Positive Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">18</div>
                  <div className="text-sm text-muted-foreground">This Month</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    platform: 'Google',
                    rating: 5,
                    review: 'Exceptional service! Mariia is incredibly professional and knowledgeable. The facial treatment was amazing and my skin feels rejuvenated.',
                    author: 'Anna K.',
                    date: '2 days ago',
                    responded: false
                  },
                  {
                    platform: 'Facebook',
                    rating: 4,
                    review: 'Great experience overall. The staff is friendly and the results are fantastic. Only minor issue was the waiting time.',
                    author: 'Maria P.',
                    date: '1 week ago',
                    responded: true
                  }
                ].map((review, index) => (
                  <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{review.platform}</Badge>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">{review.author} • {review.date}</span>
                      </div>
                      <p className="text-sm mb-2">{review.review}</p>
                      {review.responded && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-blue-900">Our Response:</p>
                          <p className="text-sm text-blue-800">Thank you for your feedback! We're thrilled you had a great experience.</p>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      {!review.responded && (
                        <Button variant="outline" size="sm">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Respond
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Community Members</p>
                    <p className="text-2xl font-bold">2,847</p>
                    <p className="text-xs text-green-600">+124 this month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Heart className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Engagement Rate</p>
                    <p className="text-2xl font-bold">12.4%</p>
                    <p className="text-xs text-green-600">+2.1% this month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <MessageSquare className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">User Content</p>
                    <p className="text-2xl font-bold">486</p>
                    <p className="text-xs text-green-600">+38 this month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Trophy className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Loyalty Score</p>
                    <p className="text-2xl font-bold">8.7/10</p>
                    <p className="text-xs text-green-600">+0.3 this month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Community Contributors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Anna Kowalska', contributions: 24, points: 850, tier: 'Gold' },
                    { name: 'Maria Nowak', contributions: 18, points: 620, tier: 'Silver' },
                    { name: 'Ewa Wiśniewska', contributions: 15, points: 480, tier: 'Silver' },
                    { name: 'Katarzyna Dąbrowska', contributions: 12, points: 390, tier: 'Bronze' }
                  ].map((contributor, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{contributor.name}</h4>
                          <p className="text-sm text-muted-foreground">{contributor.contributions} contributions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={contributor.tier === 'Gold' ? 'default' : contributor.tier === 'Silver' ? 'secondary' : 'outline'}>
                          {contributor.tier}
                        </Badge>
                        <div className="text-sm font-medium mt-1">{contributor.points} pts</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: 'Before/After Photos', count: 156, engagement: '85%', conversion: '12%' },
                    { type: 'Treatment Reviews', count: 89, engagement: '72%', conversion: '8%' },
                    { type: 'Video Testimonials', count: 34, engagement: '94%', conversion: '18%' },
                    { type: 'Social Mentions', count: 207, engagement: '68%', conversion: '5%' }
                  ].map((content, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{content.type}</h4>
                        <p className="text-sm text-muted-foreground">{content.count} pieces</p>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-medium">{content.engagement} engagement</div>
                        <div className="text-muted-foreground">{content.conversion} conversion</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};