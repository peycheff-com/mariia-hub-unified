import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast aria-live="polite" aria-atomic="true" } from 'sonner';
import { format, addDays, isAfter, isBefore, startOfDay } from 'date-fns';

// UI Components
import {
  Sparkles,
  TrendingUp,
  Users,
  Target,
  Calendar,
  MapPin,
  Star,
  Heart,
  ThumbsUp,
  Gift,
  Percent,
  Clock,
  Award,
  Zap,
  Brain,
  Lightbulb,
  ChevronRight,
  RefreshCw,
  Filter,
  Settings,
  BarChart3,
  Activity,
  Package,
  Repeat,
  ShoppingCart,
  Eye,
  Bookmark,
  Share2,
  Info,
  CheckCircle,
  XCircle,
  AlertCircle,
  Flame,
  Crown,
  Diamond,
  Gem,
  Trophy,
  Medal,
  Flag,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Button,
} from '@/components/ui/button';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Separator,
} from '@/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Progress,
} from '@/components/ui/progress';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Icons

import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// Types
interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  image: string;
  rating: number;
  popularity: number;
  tags: string[];
  description: string;
  provider: {
    id: string;
    name: string;
    rating: number;
    specialty: string;
  };
}

interface Recommendation {
  id: string;
  serviceId: string;
  service: Service;
  type: 'collaborative' | 'content' | 'trending' | 'seasonal' | 'location' | 'price' | 'bundle';
  score: number;
  reasoning: string[];
  confidence: number;
  discount?: number;
  bundle?: {
    services: Service[];
    totalPrice: number;
    savings: number;
  };
  expiresAt?: string;
}

interface UserPreference {
  userId: string;
  categories: string[];
  priceRange: { min: number; max: number };
  preferredTimes: string[];
  preferredLocations: string[];
  serviceHistory: string[];
  ratings: Record<string, number>;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'occasional';
}

interface RecommendationEngineProps {
  className?: string;
  userId?: string;
  maxRecommendations?: number;
  showReasoning?: boolean;
  onServiceSelect?: (serviceId: string) => void;
  onBookNow?: (serviceId: string) => void;
}

const recommendationTypes = [
  { id: 'collaborative', name: 'Similar Users', icon: <Users className="w-4 h-4" />, description: 'Based on users like you' },
  { id: 'content', name: 'Similar Services', icon: <Package className="w-4 h-4" />, description: 'Based on your history' },
  { id: 'trending', name: 'Trending Now', icon: <Flame className="w-4 h-4" />, description: 'Popular right now' },
  { id: 'seasonal', name: 'Seasonal', icon: <Calendar className="w-4 h-4" />, description: 'Perfect for this season' },
  { id: 'location', name: 'Near You', icon: <MapPin className="w-4 h-4" />, description: 'Services in your area' },
  { id: 'price', name: 'Best Value', icon: <Percent className="w-4 h-4" />, description: 'Great deals' },
  { id: 'bundle', name: 'Bundle Deals', icon: <Gift className="w-4 h-4" />, description: 'Save with packages' },
];

export function RecommendationEngine({
  className,
  userId = 'current-user',
  maxRecommendations = 10,
  showReasoning = true,
  onServiceSelect,
  onBookNow,
}: RecommendationEngineProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('for-you');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, 'like' | 'dislike'>>({});

  // Fetch user preferences and history
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          user_preferences(*),
          booking_history(service_id, created_at, rating)
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Fetch available services
  const { data: services } = useQuery({
    queryKey: ['services-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          provider:profiles(name, rating, specialty)
        `)
        .eq('is_active', true)
        .order('popularity', { ascending: false });

      if (error) throw error;
      return data as Service[];
    },
  });

  // Generate recommendations
  useEffect(() => {
    if (services && userProfile) {
      generateRecommendations();
    }
  }, [services, userProfile]);

  const generateRecommendations = useCallback(async () => {
    setIsLoading(true);
    const recs: Recommendation[] = [];

    if (!services || !userProfile) {
      setIsLoading(false);
      return;
    }

    // Collaborative Filtering
    const collaborativeRecs = await generateCollaborativeRecommendations();
    recs.push(...collaborativeRecs);

    // Content-based Filtering
    const contentRecs = await generateContentBasedRecommendations();
    recs.push(...contentRecs);

    // Trending Services
    const trendingRecs = await generateTrendingRecommendations();
    recs.push(...trendingRecs);

    // Seasonal Recommendations
    const seasonalRecs = await generateSeasonalRecommendations();
    recs.push(...seasonalRecs);

    // Location-based
    const locationRecs = await generateLocationRecommendations();
    recs.push(...locationRecs);

    // Price-based recommendations
    const priceRecs = await generatePriceRecommendations();
    recs.push(...priceRecs);

    // Bundle recommendations
    const bundleRecs = await generateBundleRecommendations();
    recs.push(...bundleRecs);

    // Sort by score and limit
    const sortedRecs = recs
      .sort((a, b) => b.score - a.score)
      .slice(0, maxRecommendations);

    setRecommendations(sortedRecs);
    setIsLoading(false);
  }, [services, userProfile, maxRecommendations]);

  const generateCollaborativeRecommendations = async (): Promise<Recommendation[]> => {
    // Mock collaborative filtering
    return services.slice(0, 3).map((service, index) => ({
      id: `collab-${service.id}`,
      serviceId: service.id,
      service,
      type: 'collaborative',
      score: 0.85 + Math.random() * 0.15,
      reasoning: [
        'Users who booked your previous services also loved this',
        'Similar to services in your history',
        'Highly rated by customers like you',
      ],
      confidence: 0.82,
    }));
  };

  const generateContentBasedRecommendations = async (): Promise<Recommendation[]> => {
    // Mock content-based filtering
    return services.slice(3, 6).map((service, index) => ({
      id: `content-${service.id}`,
      serviceId: service.id,
      service,
      type: 'content',
      score: 0.80 + Math.random() * 0.20,
      reasoning: [
        'Matches your preferred service category',
        'Similar features to services you liked',
        'Fits your schedule preferences',
      ],
      confidence: 0.78,
    }));
  };

  const generateTrendingRecommendations = async (): Promise<Recommendation[]> => {
    // Mock trending analysis
    return services.slice(6, 8).map((service, index) => ({
      id: `trending-${service.id}`,
      serviceId: service.id,
      service,
      type: 'trending',
      score: 0.75 + Math.random() * 0.25,
      reasoning: [
        'Popular this week',
        'High demand in your area',
        'Trending on social media',
      ],
      confidence: 0.70,
      discount: Math.random() > 0.5 ? 10 : undefined,
    }));
  };

  const generateSeasonalRecommendations = async (): Promise<Recommendation[]> => {
    // Mock seasonal logic
    const currentSeason = new Date().getMonth();
    const seasonalServices = services.filter(s =>
      s.tags.includes('summer') || s.tags.includes('winter') || s.tags.includes('all-season')
    );

    return seasonalServices.slice(0, 2).map((service, index) => ({
      id: `seasonal-${service.id}`,
      serviceId: service.id,
      service,
      type: 'seasonal',
      score: 0.70 + Math.random() * 0.30,
      reasoning: [
        'Perfect for current season',
        'Special seasonal pricing',
        'Limited time availability',
      ],
      confidence: 0.75,
      discount: 15,
      expiresAt: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    }));
  };

  const generateLocationRecommendations = async (): Promise<Recommendation[]> => {
    // Mock location-based
    return services.slice(8, 10).map((service, index) => ({
      id: `location-${service.id}`,
      serviceId: service.id,
      service,
      type: 'location',
      score: 0.65 + Math.random() * 0.35,
      reasoning: [
        'Near your preferred location',
        'Highly rated in your area',
        'Convenient timing available',
      ],
      confidence: 0.68,
    }));
  };

  const generatePriceRecommendations = async (): Promise<Recommendation[]> => {
    // Mock price optimization
    return services.filter(s => s.price <= 300).slice(0, 2).map((service, index) => ({
      id: `price-${service.id}`,
      serviceId: service.id,
      service,
      type: 'price',
      score: 0.60 + Math.random() * 0.40,
      reasoning: [
        'Great value for money',
        'Within your budget range',
        'Special discount available',
      ],
      confidence: 0.65,
      discount: 20,
    }));
  };

  const generateBundleRecommendations = async (): Promise<Recommendation[]> => {
    // Mock bundle creation
    return [{
      id: 'bundle-1',
      serviceId: 'bundle-lip-brow',
      service: {
        id: 'bundle-lip-brow',
        name: 'Lip & Brow Package',
        category: 'beauty',
        price: 350,
        duration: 120,
        image: '/assets/services/bundle.jpg',
        rating: 4.9,
        popularity: 95,
        tags: ['bundle', 'beauty', 'popular'],
        description: 'Complete lip enhancement and brow lamination package',
        provider: {
          id: 'provider-1',
          name: 'Expert Stylist',
          rating: 4.9,
          specialty: 'Beauty Services',
        },
      },
      type: 'bundle',
      score: 0.90,
      reasoning: [
        'Save 25% with this bundle',
        'Perfect combination for complete look',
        'Booked together by 85% of customers',
      ],
      confidence: 0.88,
      bundle: {
        services: services.slice(0, 2),
        totalPrice: 450,
        savings: 100,
      },
    }];
  };

  const handleFeedback = (recommendationId: string, type: 'like' | 'dislike') => {
    setFeedback({ ...feedback, [recommendationId]: type });

    // Log feedback for improving recommendations
    supabase
      .from('recommendation_feedback')
      .insert({
        user_id: userId,
        recommendation_id: recommendationId,
        feedback: type,
        created_at: new Date().toISOString(),
      });

    if (type === 'like') {
      toast aria-live="polite" aria-atomic="true".success(t('recommendations.feedbackThanks'));
    }
  };

  const handleBookNow = (serviceId: string) => {
    if (onBookNow) {
      onBookNow(serviceId);
    }
  };

  const handleViewDetails = (recommendation: Recommendation) => {
    setSelectedRecommendation(recommendation);
    setShowDetailsDialog(true);
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'collaborative': return <Users className="w-5 h-5" />;
      case 'content': return <Package className="w-5 h-5" />;
      case 'trending': return <Flame className="w-5 h-5" />;
      case 'seasonal': return <Calendar className="w-5 h-5" />;
      case 'location': return <MapPin className="w-5 h-5" />;
      case 'price': return <Percent className="w-5 h-5" />;
      case 'bundle': return <Gift className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-purple-600 bg-purple-50';
    if (score >= 0.8) return 'text-blue-600 bg-blue-50';
    if (score >= 0.7) return 'text-green-600 bg-green-50';
    return 'text-gray-600 bg-gray-50';
  };

  const filteredRecommendations = useMemo(() => {
    if (selectedType === 'all') return recommendations;
    return recommendations.filter(r => r.type === selectedType);
  }, [recommendations, selectedType]);

  return (
    <TooltipProvider>
      <div className={cn("space-y-6", className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="w-6 h-6" />
              {t('recommendations.title')}
            </h2>
            <p className="text-muted-foreground mt-1">
              {t('recommendations.description')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateRecommendations()}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {t('recommendations.refresh')}
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              {t('recommendations.preferences')}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="for-you">{t('recommendations.forYou')}</TabsTrigger>
            <TabsTrigger value="trending">{t('recommendations.trending')}</TabsTrigger>
            <TabsTrigger value="bundles">{t('recommendations.bundles')}</TabsTrigger>
            <TabsTrigger value="new">{t('recommendations.new')}</TabsTrigger>
          </TabsList>

          {/* For You Tab */}
          <TabsContent value="for-you" className="space-y-6">
            {/* Filter Pills */}
            <div className="flex items-center gap-2">
              <Button
                variant={selectedType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('all')}
              >
                All
              </Button>
              {recommendationTypes.map((type) => (
                <Button
                  key={type.id}
                  variant={selectedType === type.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type.id)}
                  className="flex items-center gap-1"
                >
                  {type.icon}
                  {type.name}
                </Button>
              ))}
            </div>

            {/* Recommendations Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-muted rounded-t-lg" />
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredRecommendations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecommendations.map((recommendation) => (
                  <Card key={recommendation.id} className="group hover:shadow-lg transition-all">
                    <div className="relative">
                      <img
                        src={recommendation.service.image}
                        alt={recommendation.service.name}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <div className="absolute top-2 left-2">
                        <Badge className={getScoreColor(recommendation.score)}>
                          {Math.round(recommendation.score * 100)}% Match
                        </Badge>
                      </div>
                      {recommendation.discount && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="destructive">
                            -{recommendation.discount}%
                          </Badge>
                        </div>
                      )}
                      <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center gap-1 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-xs">
                              {getRecommendationIcon(recommendation.type)}
                              <span className="capitalize">{recommendation.type}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {recommendationTypes.find(t => t.id === recommendation.type)?.description}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold group-hover:text-primary transition-colors">
                            {recommendation.service.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {recommendation.service.provider.name}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">{recommendation.service.rating}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {recommendation.service.duration}m
                          </div>
                        </div>

                        {showReasoning && recommendation.reasoning.length > 0 && (
                          <div className="space-y-1">
                            {recommendation.reasoning.slice(0, 2).map((reason, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Lightbulb className="w-3 h-3" />
                                {reason}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-bold">
                              €{recommendation.service.price}
                              {recommendation.bundle && (
                                <span className="text-sm text-muted-foreground line-through ml-2">
                                  €{recommendation.bundle.totalPrice}
                                </span>
                              )}
                            </p>
                            {recommendation.bundle && (
                              <p className="text-xs text-green-600">
                                Save €{recommendation.bundle.savings}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFeedback(recommendation.id, feedback[recommendation.id] === 'like' ? 'like' : 'dislike')}
                            >
                              {feedback[recommendation.id] === 'like' ? (
                                <ThumbsUp className="w-4 h-4 text-green-600 fill-current" />
                              ) : feedback[recommendation.id] === 'dislike' ? (
                                <ThumbsUp className="w-4 h-4 text-red-600 rotate-180" />
                              ) : (
                                <ThumbsUp className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(recommendation)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleBookNow(recommendation.serviceId)}
                            >
                              {t('recommendations.bookNow')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">
                  {t('recommendations.noRecommendations')}
                </h3>
                <p className="text-muted-foreground">
                  {t('recommendations.noRecommendationsDesc')}
                </p>
              </div>
            )}
          </TabsContent>

          {/* Trending Tab */}
          <TabsContent value="trending" className="space-y-6">
            <Alert>
              <Flame className="w-4 h-4" />
              <AlertTitle>{t('recommendations.trendingNow')}</AlertTitle>
              <AlertDescription>
                {t('recommendations.trendingDesc')}
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendations
                .filter(r => r.type === 'trending')
                .slice(0, 4)
                .map((recommendation) => (
                  <Card key={recommendation.id} className="flex items-center gap-4 p-4">
                    <img
                      src={recommendation.service.image}
                      alt={recommendation.service.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{recommendation.service.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {recommendation.reasoning[0]}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold">€{recommendation.service.price}</span>
                        <Button size="sm" onClick={() => handleBookNow(recommendation.serviceId)}>
                          {t('recommendations.bookNow')}
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-green-600">
                        <ArrowUp className="w-4 h-4" />
                        <span className="font-medium">Trending</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        +{Math.round(recommendation.service.popularity)}% this week
                      </p>
                    </div>
                  </Card>
                ))}
            </div>
          </TabsContent>

          {/* Bundles Tab */}
          <TabsContent value="bundles" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {recommendations
                .filter(r => r.type === 'bundle')
                .map((recommendation) => (
                  <Card key={recommendation.id}>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Gift className="w-5 h-5" />
                        <CardTitle>{recommendation.service.name}</CardTitle>
                      </div>
                      <CardDescription>
                        {recommendation.service.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {recommendation.bundle && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            {recommendation.bundle.services.map((service, idx) => (
                              <div key={service.id} className="flex items-center justify-between p-2 bg-muted rounded">
                                <span className="text-sm">{service.name}</span>
                                <span className="text-sm font-medium">€{service.price}</span>
                              </div>
                            ))}
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Total</p>
                              <p className="text-2xl font-bold">
                                €{recommendation.service.price}
                                <span className="text-sm text-muted-foreground line-through ml-2">
                                  €{recommendation.bundle.totalPrice}
                                </span>
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-green-600 font-medium">
                                You save €{recommendation.bundle.savings}
                              </p>
                              <Button onClick={() => handleBookNow(recommendation.serviceId)}>
                                {t('recommendations.bookBundle')}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          {/* New Services Tab */}
          <TabsContent value="new" className="space-y-6">
            <Alert>
              <Sparkles className="w-4 h-4" />
              <AlertTitle>{t('recommendations.newServices')}</AlertTitle>
              <AlertDescription>
                {t('recommendations.newServicesDesc')}
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {services
                ?.filter(s => s.tags.includes('new'))
                .slice(0, 6)
                .map((service) => (
                  <Card key={service.id}>
                    <div className="relative">
                      <img
                        src={service.image}
                        alt={service.name}
                        className="w-full h-40 object-cover rounded-t-lg"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-green-100 text-green-800">
                          New
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-1">{service.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {service.description.substring(0, 100)}...
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold">€{service.price}</span>
                        <Button size="sm" onClick={() => handleBookNow(service.id)}>
                          {t('recommendations.tryNow')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedRecommendation?.service.name}</DialogTitle>
              <DialogDescription>
                {selectedRecommendation?.service.description}
              </DialogDescription>
            </DialogHeader>
            {selectedRecommendation && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Provider</p>
                    <p className="font-medium">{selectedRecommendation.service.provider.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">{selectedRecommendation.service.duration} minutes</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rating</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-medium">{selectedRecommendation.service.rating}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium capitalize">{selectedRecommendation.service.category}</p>
                  </div>
                </div>

                {showReasoning && (
                  <div>
                    <h4 className="font-medium mb-2">Why we recommend this:</h4>
                    <ul className="space-y-2">
                      {selectedRecommendation.reasoning.map((reason, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          <span className="text-sm">{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      €{selectedRecommendation.service.price}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Confidence: {Math.round(selectedRecommendation.confidence * 100)}%
                    </p>
                  </div>
                  <Button onClick={() => handleBookNow(selectedRecommendation.serviceId)}>
                    {t('recommendations.bookNow')}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}