/**
 * Luxury Client Profile Management Component
 * Comprehensive client profile editor with visual history and relationship management
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  User,
  Heart,
  Star,
  Award,
  MessageCircle,
  Camera,
  TrendingUp,
  Phone,
  Mail,
  Calendar as CalendarIcon,
  MapPin,
  CreditCard,
  Gift,
  Crown,
  Diamond,
  Gem,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  Edit,
  Save,
  X,
  Plus,
  Image as ImageIcon,
  Activity,
  Target,
  Zap
} from 'lucide-react';

import { crmService } from '@/services/crm.service';
import { format, addDays, differenceInDays } from 'date-fns';
import { pl } from 'date-fns/locale';

interface ClientProfileManagerProps {
  clientId?: string;
  userId?: string;
  onSave?: (profile: any) => void;
  viewMode?: 'full' | 'compact' | 'readonly';
}

interface ClientProfile {
  id?: string;
  user_id: string;
  preferred_name?: string;
  birth_date?: string;
  preferred_language: string;
  communication_preferences: string[];
  skin_type?: string;
  beauty_goals: string[];
  fitness_goals: string[];
  allergies: string[];
  medical_conditions: string[];
  preferred_service_duration?: number;
  is_vip: boolean;
  special_occasions: Record<string, string>;
  personal_interests: string[];
  preferred_payment_method?: string;
  relationship_strength: string;
  relationship_score: number;
  client_notes?: string;
  internal_tags: string[];
  loyalty?: {
    current_tier: string;
    current_points: number;
    lifetime_points: number;
    tier_progress_points: number;
  };
  user?: {
    email: string;
    full_name: string;
    avatar_url?: string;
    phone?: string;
  };
}

const TIER_ICONS = {
  bronze: <Gem className="w-4 h-4" />,
  silver: <Award className="w-4 h-4" />,
  gold: <Crown className="w-4 h-4" />,
  platinum: <Diamond className="w-4 h-4" />
};

const TIER_COLORS = {
  bronze: 'bg-amber-600',
  silver: 'bg-gray-400',
  gold: 'bg-yellow-500',
  platinum: 'bg-purple-600'
};

const RELATIONSHIP_STRENGTH_COLORS = {
  very_strong: 'bg-green-600',
  strong: 'bg-green-500',
  moderate: 'bg-yellow-500',
  weak: 'bg-orange-500',
  very_weak: 'bg-red-500'
};

export const ClientProfileManager: React.FC<ClientProfileManagerProps> = ({
  clientId,
  userId,
  onSave,
  viewMode = 'full'
}) => {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [gallery, setGallery] = useState<any[]>([]);
  const [serviceHistory, setServiceHistory] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<ClientProfile>>({});

  useEffect(() => {
    if (clientId || userId) {
      loadProfile();
    }
  }, [clientId, userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);

      const targetId = clientId || userId;
      if (!targetId) return;

      const profileData = userId
        ? await crmService.getClientProfile(userId)
        : await crmService.getClientProfile(targetId);

      if (profileData) {
        setProfile(profileData);
        setFormData(profileData);

        // Load related data
        await Promise.all([
          loadGallery(profileData.id!),
          loadServiceHistory(profileData.id!),
          loadRecommendations(profileData.id!),
          loadAnalytics(profileData.id!)
        ]);
      }
    } catch (error) {
      console.error('Error loading client profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGallery = async (profileId: string) => {
    try {
      const galleryData = await crmService.getClientGallery(profileId);
      setGallery(galleryData);
    } catch (error) {
      console.error('Error loading gallery:', error);
    }
  };

  const loadServiceHistory = async (profileId: string) => {
    try {
      const historyData = await crmService.getServiceHistory(profileId, 10);
      setServiceHistory(historyData);
    } catch (error) {
      console.error('Error loading service history:', error);
    }
  };

  const loadRecommendations = async (profileId: string) => {
    try {
      const recommendationsData = await crmService.getRecommendations(profileId, 'pending');
      setRecommendations(recommendationsData);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const loadAnalytics = async (profileId: string) => {
    try {
      const analyticsData = await crmService.getServiceAnalytics(profileId);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!profile?.user_id) return;

      const updatedProfile = await crmService.createOrUpdateClientProfile({
        user_id: profile.user_id,
        ...formData
      } as any);

      setProfile(updatedProfile);
      setEditing(false);

      if (onSave) {
        onSave(updatedProfile);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateRecommendations = async () => {
    if (!profile?.id) return;

    try {
      const newRecommendations = await crmService.generateRecommendations(profile.id, 5);
      setRecommendations(prev => [...newRecommendations, ...prev]);
    } catch (error) {
      console.error('Error generating recommendations:', error);
    }
  };

  const getAge = () => {
    if (!profile?.birth_date) return null;
    return differenceInDays(new Date(), new Date(profile.birth_date)) / 365;
  };

  const getTierProgress = () => {
    if (!profile?.loyalty) return 0;

    const tierThresholds = {
      bronze: 0,
      silver: 500,
      gold: 1500,
      platinum: 3000
    };

    const currentTier = profile.loyalty.current_tier as keyof typeof tierThresholds;
    const currentThreshold = tierThresholds[currentTier];

    const tiers = ['bronze', 'silver', 'gold', 'platinum'];
    const currentIndex = tiers.indexOf(currentTier);

    if (currentIndex >= tiers.length - 1) return 100;

    const nextTier = tiers[currentIndex + 1] as keyof typeof tierThresholds;
    const nextThreshold = tierThresholds[nextTier];

    const progress = ((profile.loyalty.current_points - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Client profile not found
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Client Overview */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.user?.avatar_url} />
                <AvatarFallback className="text-lg">
                  {profile.user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>

              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold">
                    {profile.preferred_name || profile.user?.full_name}
                  </h1>
                  {profile.is_vip && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Crown className="w-3 h-3 mr-1" />
                      VIP
                    </Badge>
                  )}
                </div>

                <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    {profile.user?.email}
                  </span>
                  {profile.user?.phone && (
                    <span className="flex items-center">
                      <Phone className="w-4 h-4 mr-1" />
                      {profile.user?.phone}
                    </span>
                  )}
                  {getAge() && (
                    <span className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      {Math.floor(getAge())} lat
                    </span>
                  )}
                </div>

                {/* Loyalty Status */}
                {profile.loyalty && (
                  <div className="flex items-center space-x-3 mt-2">
                    <Badge
                      variant="secondary"
                      className={`${TIER_COLORS[profile.loyalty.current_tier as keyof typeof TIER_COLORS]} text-white`}
                    >
                      {TIER_ICONS[profile.loyalty.current_tier as keyof typeof TIER_ICONS]}
                      <span className="ml-1 capitalize">{profile.loyalty.current_tier}</span>
                    </Badge>

                    <div className="flex items-center space-x-2 text-sm">
                      <span className="font-medium">{profile.loyalty.current_points} points</span>
                      <span className="text-muted-foreground">• {profile.loyalty.lifetime_points} lifetime</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {viewMode !== 'readonly' && (
                <Button
                  variant={editing ? "outline" : "default"}
                  onClick={() => editing ? handleSave() : setEditing(true)}
                  disabled={saving}
                >
                  {editing ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save'}
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </>
                  )}
                </Button>
              )}

              <Badge
                variant="outline"
                className={`${RELATIONSHIP_STRENGTH_COLORS[profile.relationship_strength as keyof typeof RELATIONSHIP_STRENGTH_COLORS]} text-white`}
              >
                {profile.relationship_score}/100 {profile.relationship_strength.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="history">Service History</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Preferred Name</Label>
                    {editing ? (
                      <Input
                        value={formData.preferred_name || ''}
                        onChange={(e) => handleInputChange('preferred_name', e.target.value)}
                        placeholder={profile.user?.full_name}
                      />
                    ) : (
                      <p className="text-sm font-medium">{profile.preferred_name || profile.user?.full_name}</p>
                    )}
                  </div>

                  <div>
                    <Label>Birth Date</Label>
                    {editing ? (
                      <Input
                        type="date"
                        value={formData.birth_date || ''}
                        onChange={(e) => handleInputChange('birth_date', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm font-medium">
                        {profile.birth_date ? format(new Date(profile.birth_date), 'PPP', { locale: pl }) : 'Not specified'}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Communication Preferences</Label>
                  {editing ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['email', 'sms', 'whatsapp'].map(channel => (
                        <Badge
                          key={channel}
                          variant={formData.communication_preferences?.includes(channel) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            const current = formData.communication_preferences || [];
                            const updated = current.includes(channel)
                              ? current.filter(c => c !== channel)
                              : [...current, channel];
                            handleInputChange('communication_preferences', updated);
                          }}
                        >
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.communication_preferences.map(pref => (
                        <Badge key={pref} variant="secondary">{pref}</Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Special Occasions</Label>
                  {editing ? (
                    <Textarea
                      value={JSON.stringify(formData.special_occasions || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          handleInputChange('special_occasions', parsed);
                        } catch (err) {
                          // Invalid JSON, ignore
                        }
                      }}
                      placeholder='{"birthday": "1990-05-15", "anniversary": "2020-08-20"}'
                      className="mt-2"
                      rows={3}
                    />
                  ) : (
                    <div className="space-y-1 mt-2">
                      {Object.entries(profile.special_occasions || {}).map(([key, value]) => (
                        <Badge key={key} variant="outline" className="mr-2">
                          {key}: {value}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Beauty & Fitness Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="w-5 h-5 mr-2" />
                  Beauty & Fitness Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Skin Type</Label>
                  {editing ? (
                    <Select
                      value={formData.skin_type || ''}
                      onValueChange={(value) => handleInputChange('skin_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select skin type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="dry">Dry</SelectItem>
                        <SelectItem value="oily">Oily</SelectItem>
                        <SelectItem value="combination">Combination</SelectItem>
                        <SelectItem value="sensitive">Sensitive</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-medium capitalize">{profile.skin_type || 'Not specified'}</p>
                  )}
                </div>

                <div>
                  <Label>Beauty Goals</Label>
                  {editing ? (
                    <Input
                      value={(formData.beauty_goals || []).join(', ')}
                      onChange={(e) => handleInputChange('beauty_goals', e.target.value.split(',').map(g => g.trim()).filter(Boolean))}
                      placeholder="e.g., anti-aging, hydration, radiance"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.beauty_goals.map(goal => (
                        <Badge key={goal} variant="secondary">{goal}</Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Fitness Goals</Label>
                  {editing ? (
                    <Input
                      value={(formData.fitness_goals || []).join(', ')}
                      onChange={(e) => handleInputChange('fitness_goals', e.target.value.split(',').map(g => g.trim()).filter(Boolean))}
                      placeholder="e.g., weight loss, muscle toning, flexibility"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.fitness_goals.map(goal => (
                        <Badge key={goal} variant="secondary">{goal}</Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Preferred Service Duration</Label>
                  {editing ? (
                    <Input
                      type="number"
                      value={formData.preferred_service_duration || ''}
                      onChange={(e) => handleInputChange('preferred_service_duration', parseInt(e.target.value))}
                      placeholder="60"
                    />
                  ) : (
                    <p className="text-sm font-medium">
                      {profile.preferred_service_duration ? `${profile.preferred_service_duration} minutes` : 'Not specified'}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Allergies</Label>
                  {editing ? (
                    <Textarea
                      value={(formData.allergies || []).join('\n')}
                      onChange={(e) => handleInputChange('allergies', e.target.value.split('\n').map(a => a.trim()).filter(Boolean))}
                      placeholder="One allergy per line"
                      rows={3}
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.allergies.map(allergy => (
                        <Badge key={allergy} variant="destructive">{allergy}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Relationship Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Relationship Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Relationship Strength</Label>
                  {editing ? (
                    <Select
                      value={formData.relationship_strength || ''}
                      onValueChange={(value) => handleInputChange('relationship_strength', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="very_strong">Very Strong</SelectItem>
                        <SelectItem value="strong">Strong</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="weak">Weak</SelectItem>
                        <SelectItem value="very_weak">Very Weak</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge
                        variant="outline"
                        className={`${RELATIONSHIP_STRENGTH_COLORS[profile.relationship_strength as keyof typeof RELATIONSHIP_STRENGTH_COLORS]} text-white`}
                      >
                        {profile.relationship_score}/100
                      </Badge>
                      <span className="text-sm font-medium capitalize">
                        {profile.relationship_strength.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <Label>VIP Status</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Switch
                      checked={formData.is_vip || false}
                      onCheckedChange={(checked) => handleInputChange('is_vip', checked)}
                      disabled={!editing}
                    />
                    <span className="text-sm font-medium">
                      {formData.is_vip ? 'VIP Client' : 'Regular Client'}
                    </span>
                  </div>
                </div>

                <div>
                  <Label>Personal Interests</Label>
                  {editing ? (
                    <Textarea
                      value={(formData.personal_interests || []).join(', ')}
                      onChange={(e) => handleInputChange('personal_interests', e.target.value.split(',').map(i => i.trim()).filter(Boolean))}
                      placeholder="e.g., travel, cooking, yoga, reading"
                      rows={2}
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.personal_interests.map(interest => (
                        <Badge key={interest} variant="outline">{interest}</Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Client Notes</Label>
                  {editing ? (
                    <Textarea
                      value={formData.client_notes || ''}
                      onChange={(e) => handleInputChange('client_notes', e.target.value)}
                      placeholder="Internal notes about this client..."
                      rows={4}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-2">
                      {profile.client_notes || 'No notes'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Loyalty Progress */}
            {profile.loyalty && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="w-5 h-5 mr-2" />
                    Loyalty Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Current Points</span>
                      <span>{profile.loyalty.current_points}</span>
                    </div>
                    <Progress value={getTierProgress()} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Next tier in {Math.max(0, (getTierProgress() < 100 ? Math.ceil(100 - getTierProgress()) : 0))}% progress
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Lifetime Points</p>
                      <p className="font-medium">{profile.loyalty.lifetime_points.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Bookings</p>
                      <p className="font-medium">{analytics?.summary?.total_bookings || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Revenue</p>
                      <p className="font-medium">₺{(analytics?.summary?.total_revenue || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg. Satisfaction</p>
                      <p className="font-medium">
                        {analytics?.summary?.average_satisfaction
                          ? `${analytics.summary.average_satisfaction.toFixed(1)}/5`
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Service History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Service History
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service Record
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {serviceHistory.length > 0 ? (
                <div className="space-y-4">
                  {serviceHistory.map((history) => (
                    <div key={history.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">{history.service?.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(history.service_date), 'PPP', { locale: pl })} • {history.service_duration}min
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-medium">₺{history.actual_price}</p>
                        {history.satisfaction_score && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Star className="w-4 h-4 mr-1 text-yellow-500" />
                            {history.satisfaction_score}/5
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No service history available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gallery Tab */}
        <TabsContent value="gallery" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Camera className="w-5 h-5 mr-2" />
                  Visual History Gallery
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Photo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {gallery.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {gallery.map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={image.thumbnail_url || image.image_url}
                          alt={image.caption || 'Client photo'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      {image.progress_category && (
                        <Badge
                          variant="secondary"
                          className="absolute top-2 left-2 text-xs"
                        >
                          {image.progress_category}
                        </Badge>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center">
                        <Button size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100">
                          <ImageIcon className="w-4 h-4 mr-2" alt="" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No photos in gallery yet</p>
                  <p className="text-sm">Add photos to track client progress over time</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Personalized Recommendations
                </CardTitle>
                <Button onClick={generateRecommendations} variant="outline" size="sm">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Generate New
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recommendations.length > 0 ? (
                <div className="grid gap-4">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                          <Heart className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">{rec.title}</p>
                          <p className="text-sm text-muted-foreground">{rec.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">Confidence: {Math.round(rec.confidence_score * 100)}%</Badge>
                            <Badge variant="outline">Priority: {rec.priority_score}/10</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                        <Button size="sm">
                          Book Now
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recommendations available</p>
                  <p className="text-sm">Generate personalized recommendations for this client</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {analytics && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Activity className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Bookings</p>
                        <p className="text-2xl font-bold">{analytics.summary.total_bookings}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                        <p className="text-2xl font-bold">₺{analytics.summary.total_revenue.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Star className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Satisfaction</p>
                        <p className="text-2xl font-bold">
                          {analytics.summary.average_satisfaction
                            ? analytics.summary.average_satisfaction.toFixed(1)
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Target className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Booking Value</p>
                        <p className="text-2xl font-bold">
                          ₺{Math.round(analytics.summary.average_booking_value).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Favorite Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.summary.favorite_services?.map((service: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{service.service}</span>
                          <Badge variant="outline">{service.count} visits</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Preferred Staff</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.summary.preferred_staff?.map((staff: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{staff.staff}</span>
                          <Badge variant="outline">{staff.count} sessions</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientProfileManager;