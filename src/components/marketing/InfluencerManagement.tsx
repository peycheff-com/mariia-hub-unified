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
  Star,
  TrendingUp,
  Calendar,
  DollarSign,
  Target,
  MessageSquare,
  Heart,
  Share2,
  Eye,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  BarChart3,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Send,
  FileText,
  Award,
  Gift,
  ShoppingCart,
  Camera,
  Video
} from 'lucide-react';
import { marketingService } from '@/services/marketing.service';
import {
  Influencer,
  InfluencerCollaboration,
  AffiliateProgram,
  AffiliatePartner,
  InfluencerCollaborationRequest
} from '@/types/marketing';
import { format } from 'date-fns';
import { toast aria-live="polite" aria-atomic="true" } from 'sonner';

interface InfluencerManagementProps {
  className?: string;
}

export const InfluencerManagement: React.FC<InfluencerManagementProps> = ({ className }) => {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [collaborations, setCollaborations] = useState<InfluencerCollaboration[]>([]);
  const [affiliatePrograms, setAffiliatePrograms] = useState<AffiliateProgram[]>([]);
  const [affiliatePartners, setAffiliatePartners] = useState<AffiliatePartner[]>([]);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('influencers');

  // Dialog states
  const [isCreateInfluencerDialogOpen, setIsCreateInfluencerDialogOpen] = useState(false);
  const [isCreateCollaborationDialogOpen, setIsCreateCollaborationDialogOpen] = useState(false);
  const [isCreateAffiliateDialogOpen, setIsCreateAffiliateDialogOpen] = useState(false);

  // Form states
  const [influencerForm, setInfluencerForm] = useState<Partial<Influencer>>({
    name: '',
    handle: '',
    niche: [],
    followerCount: 0,
    engagementRate: 0,
    contactEmail: '',
    location: '',
    languages: [],
    status: 'prospect',
    rating: 0
  });

  const [collaborationForm, setCollaborationForm] = useState<InfluencerCollaborationRequest>({
    influencerId: '',
    collaborationType: 'post',
    brief: '',
    deliverables: {},
    compensationType: 'fixed',
    compensationAmount: 0,
    startDate: new Date(),
    contentReviewRequired: true
  });

  const [affiliateForm, setAffiliateForm] = useState<Partial<AffiliateProgram>>({
    name: '',
    description: '',
    commissionType: 'percentage',
    commissionRates: {},
    cookieDuration: 30
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [influencersData, collaborationsData, affiliateProgramsData] = await Promise.all([
        marketingService.getInfluencers(),
        loadInfluencerCollaborations(),
        loadAffiliatePrograms()
      ]);

      setInfluencers(influencersData);
      setCollaborations(collaborationsData);
      setAffiliatePrograms(affiliateProgramsData);
    } catch (error) {
      console.error('Error loading influencer data:', error);
      toast aria-live="polite" aria-atomic="true".error('Failed to load influencer data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadInfluencerCollaborations = async (): Promise<InfluencerCollaboration[]> => {
    // Mock data - in real implementation this would come from the service
    return [
      {
        id: 'collab_1',
        influencer_id: 'inf_1',
        collaboration_type: 'post',
        brief: 'Promote our new facial treatment package',
        deliverables: { posts: 3, stories: 5, reels: 2 },
        compensation_type: 'fixed',
        compensation_amount: 2500,
        status: 'completed',
        start_date: new Date('2024-01-15'),
        end_date: new Date('2024-01-30'),
        performance_metrics: { reach: 45000, engagement: 6800, clicks: 320 },
        actual_compensation: 2500,
        created_by: 'user_1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  };

  const loadAffiliatePrograms = async (): Promise<AffiliateProgram[]> => {
    // Mock data - in real implementation this would come from the service
    return [
      {
        id: 'prog_1',
        name: 'Beauty Influencer Program',
        description: 'Commission-based program for beauty content creators',
        commission_type: 'percentage',
        commission_rates: { default: 15, tier_1: 20, tier_2: 25 },
        cookie_duration: 30,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  };

  const handleCreateInfluencer = async () => {
    try {
      const influencer = await marketingService.createInfluencer(influencerForm);
      setInfluencers([influencer, ...influencers]);
      setIsCreateInfluencerDialogOpen(false);
      resetInfluencerForm();
      toast aria-live="polite" aria-atomic="true".success('Influencer added successfully');
    } catch (error) {
      console.error('Error creating influencer:', error);
      toast aria-live="polite" aria-atomic="true".error('Failed to add influencer');
    }
  };

  const handleCreateCollaboration = async () => {
    try {
      const collaboration = await marketingService.createInfluencerCollaboration(collaborationForm);
      setCollaborations([collaboration, ...collaborations]);
      setIsCreateCollaborationDialogOpen(false);
      resetCollaborationForm();
      toast aria-live="polite" aria-atomic="true".success('Collaboration created successfully');
    } catch (error) {
      console.error('Error creating collaboration:', error);
      toast aria-live="polite" aria-atomic="true".error('Failed to create collaboration');
    }
  };

  const resetInfluencerForm = () => {
    setInfluencerForm({
      name: '',
      handle: '',
      niche: [],
      followerCount: 0,
      engagementRate: 0,
      contactEmail: '',
      location: '',
      languages: [],
      status: 'prospect',
      rating: 0
    });
  };

  const resetCollaborationForm = () => {
    setCollaborationForm({
      influencerId: '',
      collaborationType: 'post',
      brief: '',
      deliverables: {},
      compensationType: 'fixed',
      compensationAmount: 0,
      startDate: new Date(),
      contentReviewRequired: true
    });
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, React.ReactNode> = {
      instagram: <Instagram className="w-5 h-5" />,
      facebook: <Facebook className="w-5 h-5" />,
      youtube: <Youtube className="w-5 h-5" />,
      twitter: <Twitter className="w-5 h-5" />,
      tiktok: <Video className="w-5 h-5" />
    };
    return icons[platform] || <Users className="w-5 h-5" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'prospect': return 'bg-gray-100 text-gray-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'negotiating': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'blacklisted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'prospect': return <Search className="w-4 h-4" />;
      case 'contacted': return <Send className="w-4 h-4" />;
      case 'negotiating': return <Clock className="w-4 h-4" />;
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'inactive': return <XCircle className="w-4 h-4" />;
      case 'blacklisted': return <AlertCircle className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getCollaborationIcon = (type: string) => {
    switch (type) {
      case 'post': return <Camera className="w-4 h-4" />;
      case 'story': return <Camera className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'review': return <Star className="w-4 h-4" />;
      case 'giveaway': return <Gift className="w-4 h-4" />;
      case 'takeover': return <Users className="w-4 h-4" />;
      case 'affiliate': return <ShoppingCart className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const filteredInfluencers = influencers.filter(influencer => {
    const matchesSearch = influencer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         influencer.handle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || influencer.status === filterStatus;
    const matchesPlatform = filterPlatform === 'all' || influencer.platform_id?.toString() === filterPlatform;
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const calculateInfluencerScore = (influencer: Influencer): number => {
    // Calculate a comprehensive score based on various factors
    const followerScore = Math.min(influencer.follower_count / 100000, 10) * 10; // Max 100 points
    const engagementScore = influencer.engagement_rate * 1000; // Max 100 points (assuming max 10% engagement)
    const ratingScore = (influencer.rating || 0) * 20; // Max 100 points
    const diversityScore = (influencer.niche?.length || 0) * 10; // Max 50 points

    return Math.round((followerScore + engagementScore + ratingScore + diversityScore) / 3.5);
  };

  const calculateROI = (collaboration: InfluencerCollaboration): number => {
    // Mock ROI calculation - in real implementation this would use actual revenue data
    const estimatedRevenue = collaboration.performance_metrics?.reach * 0.02 * 150; // 2% conversion, 150 PLN average
    const cost = collaboration.actual_compensation || collaboration.compensation_amount || 0;
    return cost > 0 ? ((estimatedRevenue - cost) / cost) * 100 : 0;
  };

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
          <h2 className="text-2xl font-bold">Influencer & Partnership Management</h2>
          <p className="text-muted-foreground">Manage influencer relationships and affiliate partnerships</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateAffiliateDialogOpen} onOpenChange={setIsCreateAffiliateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Award className="w-4 h-4 mr-2" />
                Affiliate Program
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Affiliate Program</DialogTitle>
                <DialogDescription>
                  Set up a commission-based affiliate program
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="affiliate-name">Program Name</Label>
                  <Input
                    id="affiliate-name"
                    value={affiliateForm.name || ''}
                    onChange={(e) => setAffiliateForm({ ...affiliateForm, name: e.target.value })}
                    placeholder="e.g., Beauty Ambassador Program"
                  />
                </div>
                <div>
                  <Label htmlFor="affiliate-description">Description</Label>
                  <Textarea
                    id="affiliate-description"
                    value={affiliateForm.description || ''}
                    onChange={(e) => setAffiliateForm({ ...affiliateForm, description: e.target.value })}
                    placeholder="Describe your affiliate program..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Commission Type</Label>
                    <Select
                      value={affiliateForm.commissionType}
                      onValueChange={(value) => setAffiliateForm({ ...affiliateForm, commissionType: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                        <SelectItem value="tiered">Tiered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="cookie-duration">Cookie Duration (days)</Label>
                    <Input
                      id="cookie-duration"
                      type="number"
                      value={affiliateForm.cookieDuration || 30}
                      onChange={(e) => setAffiliateForm({ ...affiliateForm, cookieDuration: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Commission Rates</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <Input placeholder="Default %" />
                    <Input placeholder="Tier 1 %" />
                    <Input placeholder="Tier 2 %" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateAffiliateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button>
                    Create Program
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateCollaborationDialogOpen} onOpenChange={setIsCreateCollaborationDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Target className="w-4 h-4 mr-2" />
                New Collaboration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Collaboration</DialogTitle>
                <DialogDescription>
                  Set up a new collaboration with an influencer
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Select Influencer</Label>
                  <Select
                    value={collaborationForm.influencerId}
                    onValueChange={(value) => setCollaborationForm({ ...collaborationForm, influencerId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an influencer" />
                    </SelectTrigger>
                    <SelectContent>
                      {influencers.map((influencer) => (
                        <SelectItem key={influencer.id} value={influencer.id}>
                          <div className="flex items-center gap-2">
                            {getPlatformIcon(influencer.platform_id || '')}
                            {influencer.name} (@{influencer.handle})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Collaboration Type</Label>
                    <Select
                      value={collaborationForm.collaborationType}
                      onValueChange={(value) => setCollaborationForm({ ...collaborationForm, collaborationType: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="post">Sponsored Post</SelectItem>
                        <SelectItem value="story">Story Series</SelectItem>
                        <SelectItem value="video">Video Content</SelectItem>
                        <SelectItem value="review">Product Review</SelectItem>
                        <SelectItem value="giveaway">Giveaway</SelectItem>
                        <SelectItem value="takeover">Account Takeover</SelectItem>
                        <SelectItem value="affiliate">Affiliate Partnership</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Compensation Type</Label>
                    <Select
                      value={collaborationForm.compensationType}
                      onValueChange={(value) => setCollaborationForm({ ...collaborationForm, compensationType: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                        <SelectItem value="commission">Commission</SelectItem>
                        <SelectItem value="product">Product Only</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="collab-brief">Campaign Brief</Label>
                  <Textarea
                    id="collab-brief"
                    value={collaborationForm.brief}
                    onChange={(e) => setCollaborationForm({ ...collaborationForm, brief: e.target.value })}
                    placeholder="Describe the campaign requirements and expectations..."
                    className="min-h-[100px]"
                  />
                </div>
                <div>
                  <Label>Deliverables</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div>
                      <Label className="text-sm">Posts</Label>
                      <Input type="number" placeholder="0" />
                    </div>
                    <div>
                      <Label className="text-sm">Stories</Label>
                      <Input type="number" placeholder="0" />
                    </div>
                    <div>
                      <Label className="text-sm">Reels/Videos</Label>
                      <Input type="number" placeholder="0" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="compensation-amount">Compensation Amount</Label>
                    <Input
                      id="compensation-amount"
                      type="number"
                      value={collaborationForm.compensationAmount || 0}
                      onChange={(e) => setCollaborationForm({ ...collaborationForm, compensationAmount: parseInt(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={format(collaborationForm.startDate, 'yyyy-MM-dd')}
                      onChange={(e) => setCollaborationForm({ ...collaborationForm, startDate: new Date(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="content-review"
                    checked={collaborationForm.contentReviewRequired}
                    onCheckedChange={(checked) => setCollaborationForm({ ...collaborationForm, contentReviewRequired: checked })}
                  />
                  <Label htmlFor="content-review">Content review required</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateCollaborationDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCollaboration}>
                    Create Collaboration
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateInfluencerDialogOpen} onOpenChange={setIsCreateInfluencerDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Influencer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Influencer</DialogTitle>
                <DialogDescription>
                  Add a new influencer to your database
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="influencer-name">Name</Label>
                    <Input
                      id="influencer-name"
                      value={influencerForm.name || ''}
                      onChange={(e) => setInfluencerForm({ ...influencerForm, name: e.target.value })}
                      placeholder="Influencer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="influencer-handle">Social Handle</Label>
                    <Input
                      id="influencer-handle"
                      value={influencerForm.handle || ''}
                      onChange={(e) => setInfluencerForm({ ...influencerForm, handle: e.target.value })}
                      placeholder="@username"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="followers">Followers</Label>
                    <Input
                      id="followers"
                      type="number"
                      value={influencerForm.followerCount || 0}
                      onChange={(e) => setInfluencerForm({ ...influencerForm, followerCount: parseInt(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="engagement">Engagement Rate (%)</Label>
                    <Input
                      id="engagement"
                      type="number"
                      step="0.1"
                      value={influencerForm.engagementRate || 0}
                      onChange={(e) => setInfluencerForm({ ...influencerForm, engagementRate: parseFloat(e.target.value) })}
                      placeholder="0.0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact-email">Contact Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={influencerForm.contactEmail || ''}
                      onChange={(e) => setInfluencerForm({ ...influencerForm, contactEmail: e.target.value })}
                      placeholder="contact@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={influencerForm.location || ''}
                      onChange={(e) => setInfluencerForm({ ...influencerForm, location: e.target.value })}
                      placeholder="City, Country"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="niche">Niche/Topics</Label>
                  <Input
                    id="niche"
                    value={influencerForm.niche?.join(', ') || ''}
                    onChange={(e) => setInfluencerForm({
                      ...influencerForm,
                      niche: e.target.value.split(',').map(n => n.trim()).filter(n => n)
                    })}
                    placeholder="beauty, skincare, fitness, wellness"
                  />
                </div>
                <div>
                  <Label htmlFor="rating">Rating (1-5)</Label>
                  <Select
                    value={influencerForm.rating?.toString() || ''}
                    onValueChange={(value) => setInfluencerForm({ ...influencerForm, rating: parseFloat(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Poor</SelectItem>
                      <SelectItem value="2">2 - Fair</SelectItem>
                      <SelectItem value="3">3 - Good</SelectItem>
                      <SelectItem value="4">4 - Very Good</SelectItem>
                      <SelectItem value="5">5 - Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateInfluencerDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateInfluencer}>
                    Add Influencer
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="influencers">Influencers</TabsTrigger>
          <TabsTrigger value="collaborations">Collaborations</TabsTrigger>
          <TabsTrigger value="affiliate">Affiliate Programs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="influencers" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search influencers..."
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
                <SelectItem value="prospect">Prospects</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="negotiating">Negotiating</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {filteredInfluencers.map((influencer) => (
              <Card key={influencer.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedInfluencer(influencer)}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {influencer.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{influencer.name}</h3>
                          <Badge className={getStatusColor(influencer.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(influencer.status)}
                              {influencer.status}
                            </div>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">@{influencer.handle}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            {getPlatformIcon(influencer.platform_id || '')}
                            <span>{influencer.follower_count?.toLocaleString()} followers</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="w-4 h-4 text-red-500" />
                            <span>{(influencer.engagement_rate * 100).toFixed(1)}% engagement</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{influencer.rating}/5</span>
                          </div>
                        </div>
                        {influencer.niche && influencer.niche.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {influencer.niche.slice(0, 3).map((niche, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {niche}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <div className="text-sm font-medium">Score: {calculateInfluencerScore(influencer)}/100</div>
                        <Progress value={calculateInfluencerScore(influencer)} className="w-20 h-2 mt-1" />
                      </div>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedInfluencer && (
            <Card>
              <CardHeader>
                <CardTitle>Influencer Details: {selectedInfluencer.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Contact Email</Label>
                    <p className="font-medium">{selectedInfluencer.contact_email}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Location</Label>
                    <p className="font-medium">{selectedInfluencer.location || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Languages</Label>
                    <p className="font-medium">{selectedInfluencer.languages?.join(', ') || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Agency</Label>
                    <p className="font-medium">{selectedInfluencer.agency || 'Independent'}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Label className="text-sm text-muted-foreground">Recent Collaborations</Label>
                  <div className="mt-2 space-y-2">
                    {collaborations
                      .filter(c => c.influencer_id === selectedInfluencer.id)
                      .slice(0, 3)
                      .map((collab) => (
                        <div key={collab.id} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-2">
                            {getCollaborationIcon(collab.collaboration_type)}
                            <span className="font-medium">{collab.collaboration_type}</span>
                            <Badge variant={collab.status === 'completed' ? 'default' : 'secondary'}>
                              {collab.status}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">ROI: {calculateROI(collab).toFixed(1)}%</div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(collab.start_date), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="collaborations" className="space-y-4">
          <div className="grid gap-4">
            {collaborations.map((collaboration) => {
              const influencer = influencers.find(i => i.id === collaboration.influencer_id);
              return (
                <Card key={collaboration.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusColor(collaboration.status)}>
                            {collaboration.status}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {getCollaborationIcon(collaboration.collaboration_type)}
                            <span className="font-medium">{collaboration.collaboration_type}</span>
                          </div>
                          {collaboration.start_date && (
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(collaboration.start_date), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold mb-1">
                          {influencer?.name || 'Unknown Influencer'}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">{collaboration.brief}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Compensation: {collaboration.compensation_type}</span>
                          {collaboration.compensation_amount && (
                            <span>Amount: ₺{collaboration.compensation_amount.toLocaleString()}</span>
                          )}
                          <span>ROI: {calculateROI(collaboration).toFixed(1)}%</span>
                        </div>
                        {collaboration.performance_metrics && (
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {collaboration.performance_metrics.reach?.toLocaleString()} reach
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-4 h-4" />
                              {collaboration.performance_metrics.engagement?.toLocaleString()} engagement
                            </span>
                            <span className="flex items-center gap-1">
                              <Share2 className="w-4 h-4" />
                              {collaboration.performance_metrics.clicks?.toLocaleString()} clicks
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Analytics
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="affiliate" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {affiliatePrograms.map((program) => (
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
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Commission Type:</span>
                      <span className="font-medium">{program.commission_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cookie Duration:</span>
                      <span className="font-medium">{program.cookie_duration} days</span>
                    </div>
                    {program.commission_rates && (
                      <div className="flex justify-between">
                        <span>Commission Rates:</span>
                        <span className="font-medium">
                          {Object.values(program.commission_rates).join('%, ')}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Users className="w-4 h-4 mr-2" />
                      View Partners
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Partner Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">24</div>
                  <div className="text-sm text-muted-foreground">Active Partners</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">₺45,250</div>
                  <div className="text-sm text-muted-foreground">Total Commissions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">156</div>
                  <div className="text-sm text-muted-foreground">Referrals</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">12.5%</div>
                  <div className="text-sm text-muted-foreground">Conversion Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Influencers</p>
                    <p className="text-2xl font-bold">{influencers.length}</p>
                    <p className="text-xs text-green-600">+{Math.floor(Math.random() * 10)} this month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Active Collaborations</p>
                    <p className="text-2xl font-bold">
                      {collaborations.filter(c => c.status === 'active').length}
                    </p>
                    <p className="text-xs text-green-600">+{Math.floor(Math.random() * 5)} this month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Average ROI</p>
                    <p className="text-2xl font-bold">
                      {collaborations.length > 0
                        ? (collaborations.reduce((sum, c) => sum + calculateROI(c), 0) / collaborations.length).toFixed(1)
                        : 0}%
                    </p>
                    <p className="text-xs text-green-600">+{Math.floor(Math.random() * 5)}% vs last month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Reach</p>
                    <p className="text-2xl font-bold">
                      {collaborations
                        .reduce((sum, c) => sum + (c.performance_metrics?.reach || 0), 0)
                        .toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600">+{Math.floor(Math.random() * 20)}K this month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Performing Influencers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {influencers
                  .sort((a, b) => calculateInfluencerScore(b) - calculateInfluencerScore(a))
                  .slice(0, 5)
                  .map((influencer, index) => (
                    <div key={influencer.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{influencer.name}</h4>
                          <p className="text-sm text-muted-foreground">@{influencer.handle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-medium">{calculateInfluencerScore(influencer)}/100</div>
                          <div className="text-xs text-muted-foreground">Score</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{influencer.follower_count?.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Followers</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{(influencer.engagement_rate * 100).toFixed(1)}%</div>
                          <div className="text-xs text-muted-foreground">Engagement</div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};