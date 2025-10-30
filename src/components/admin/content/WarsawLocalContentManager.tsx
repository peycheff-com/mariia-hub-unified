import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast aria-live="polite" aria-atomic="true" } from 'sonner';
import {
  MapPin,
  Calendar,
  Users,
  Building,
  TrendingUp,
  Eye,
  Heart,
  Share2,
  MessageCircle,
  Filter,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  Target,
  Globe,
  Zap,
  Star,
  Search,
  ChevronDown,
  ChevronUp,
  Info,
  Settings,
  Lightbulb,
  Camera,
  Crown,
  Sparkles,
  TreePine,
  Sun,
  Cloud,
  Wind,
  Coffee,
  ShoppingBag,
  Music,
  Palette,
  Train,
  Car,
  Home,
  Clock,
  Award,
  MessageSquare,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Languages,
  Globe2,
  Mountain,
  Bridge,
  Church,
  Castle,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
  Input,
} from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Progress,
} from '@/components/ui/progress';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Textarea,
} from '@/components/ui/textarea';
import {
  Label,
} from '@/components/ui/label';
import {
  Checkbox,
} from '@/components/ui/checkbox';

// Types
import {
  WarsawLocalContent as WarsawLocalContentType,
  ContentCalendar,
  ContentPerformanceAnalytics,
} from '@/types/content-strategy';

interface WarsawLocalContentManagerProps {
  className?: string;
}

// Warsaw neighborhoods with characteristics
const WARSAW_NEIGHBORHOODS = {
  srodmiescie: {
    name: 'Śródmieście (City Center)',
    description: 'Central business district, luxury shopping, corporate headquarters',
    demographics: 'Young professionals, tourists, business executives',
    lifestyle: 'Fast-paced, premium services, international',
    landmarks: ['Palace of Culture', 'Warsaw Uprising Museum', 'Old Town'],
    transport: 'Excellent metro, bus, and tram connections',
    beautyProfile: 'Corporate beauty, quick services, premium treatments',
    fitnessProfile: 'High-end gyms, boutique studios, personal training',
  },
  mokotow: {
    name: 'Mokotów',
    description: 'Upscale residential area, embassies, modern business parks',
    demographics: 'Affluent families, expats, professionals',
    lifestyle: 'Sophisticated, family-oriented, international community',
    landmarks: ['Pole Mokotowskie Park', 'Mokotów Business Center', 'Królikarnia Palace'],
    transport: 'Metro, extensive bus network',
    beautyProfile: 'Family-friendly services, premium beauty centers',
    fitnessProfile: 'Family gyms, boutique studios, outdoor activities',
  },
  wola: {
    name: 'Wola',
    description: 'Modern business district, skyscrapers, startup hub',
    demographics: 'Tech professionals, entrepreneurs, young professionals',
    lifestyle: 'Modern, innovative, work-life balance focused',
    landmarks: ['Warsaw Spire', 'Złote Tarasy', 'Warsaw Uprising Museum'],
    transport: 'Metro line 2, excellent connectivity',
    beautyProfile: 'Trendy treatments, express services, modern techniques',
    fitnessProfile: 'Modern gyms, HIIT studios, tech-integrated fitness',
  },
  praga_poludnie: {
    name: 'Praga-Południe',
    description: 'Trendy, artistic area, creative industries',
    demographics: 'Artists, young creatives, students',
    lifestyle: 'Bohemian, creative, up-and-coming',
    landmarks: ['Zachęta National Gallery', 'Pavilion Szkocki', 'Saska Kępa'],
    transport: 'Tram, bus, bike-friendly',
    beautyProfile: 'Artistic expression, alternative beauty, unique treatments',
    fitnessProfile: 'Alternative fitness, dance studios, outdoor activities',
  },
  ursynow: {
    name: 'Ursynów',
    description: 'Family-friendly, residential, nature areas',
    demographics: 'Families, students, nature lovers',
    lifestyle: 'Relaxed, family-oriented, nature-connected',
    landmarks: ['Kabaty Forest', 'Natolin Palace', 'Ursynów Cultural Center'],
    transport: 'Metro, bus lines to city center',
    beautyProfile: 'Natural beauty, family services, wellness focus',
    fitnessProfile: 'Family fitness, outdoor activities, nature-based exercise',
  },
  bemowo: {
    name: 'Bemowo',
    description: 'Suburban residential, growing business area',
    demographics: 'Middle-class families, young professionals',
    lifestyle: 'Balanced, community-focused, affordable',
    landmarks: ['Bemowo Airport', 'Fort Bema', 'Bemowo Shopping Center'],
    transport: 'Bus network, good car access',
    beautyProfile: 'Affordable quality, family services, convenience',
    fitnessProfile: 'Community gyms, family sports, outdoor recreation',
  },
};

// Seasonal beauty considerations for Warsaw
const WARSAW_SEASONS = {
  spring: {
    name: 'Spring (March-May)',
    weather: 'Transitional, mild to warm, occasional rain',
    beautyFocus: ['Skin recovery after winter', 'Allergy-friendly makeup', 'Fresh looks', 'Prep for summer'],
    fitnessFocus: ['Outdoor training preparation', 'Spring detox programs', 'Allergy management', 'Flexibility work'],
    localEvents: ['Warsaw Flower Show', 'Easter celebrations', 'Parks reopening', 'Outdoor festivals'],
    culturalAspects: 'Renewal, fresh starts, outdoor activities',
    colorPalette: 'Pastels, fresh greens, soft pinks',
  },
  summer: {
    name: 'Summer (June-August)',
    weather: 'Warm to hot, sunny, occasional thunderstorms',
    beautyFocus: ['Sun protection', 'Waterproof makeup', 'Lightweight products', 'Body care'],
    fitnessFocus: ['Outdoor workouts', 'Water activities', 'Early morning training', 'Vacation fitness'],
    localEvents: ['Open-air concerts', 'City festivals', 'Vistula River activities', 'Terrace season'],
    culturalAspects: 'Vacation mode, outdoor living, social gatherings',
    colorPalette: 'Bright, vibrant, tropical',
  },
  autumn: {
    name: 'Autumn (September-November)',
    weather: 'Mild to cool, colorful foliage, rainier',
    beautyFocus: ['Transitional skincare', 'Richer colors', 'Hydration focus', 'Seasonal treatments'],
    fitnessFocus: ['Indoor transition', 'Preparation for winter', 'Comfort foods balance', 'Group fitness'],
    localEvents: ['Warsaw Film Festival', 'Independence Day', 'Autumn foliage tours', 'Wine festivals'],
    culturalAspects: 'Cozy season, cultural events, back to routine',
    colorPalette: 'Warm earth tones, rich burgundies, golden',
  },
  winter: {
    name: 'Winter (December-February)',
    weather: 'Cold, snow possible, limited daylight',
    beautyFocus: ['Intensive hydration', 'Cold protection', 'Indoor lighting makeup', 'Body care'],
    fitnessFocus: ['Indoor training', 'Winter sports', 'Immune support', 'Mood management'],
    localEvents: ['Christmas markets', 'New Year celebrations', 'Winter sports', 'Cultural season'],
    culturalAspects: 'Cozy indoor activities, holiday celebrations, cultural events',
    colorPalette: 'Deep jewel tones, metallic, cozy textures',
  },
};

// Polish beauty standards and preferences
const POLISH_BEAUTY_STANDARDS = {
  general: {
    naturalLook: 'Emphasis on natural enhancement vs dramatic transformation',
    qualityFocus: 'High-quality, long-lasting results preferred',
    subtlety: 'Subtle elegance appreciated over bold statements',
    investment: 'Beauty seen as worthwhile investment',
  },
  preferences: {
    lipTreatments: 'Natural-looking volume, defined shape',
    brows: 'Well-defined but natural, appropriate arch',
    skin: 'Clear, healthy, minimal makeup appearance',
    hair: 'Natural colors, healthy appearance',
  },
  seasonal: {
    spring: 'Fresh, dewy, natural looks',
    summer: 'Light, sun-kissed, waterproof',
    autumn: 'Rich, warm, sophisticated tones',
    winter: 'Elegant, deeper colors, protection focus',
  },
  cultural: {
    traditions: 'Respect for natural beauty traditions',
    modern: 'Open to modern techniques with classic foundation',
    global: 'International trends adapted for Polish preferences',
  },
};

// Sample data for demonstration
const sampleWarsawContent: WarsawLocalContentType[] = [
  {
    id: '1',
    content_id: 'warsaw-1',
    local_context: 'Perfect summer beauty routine for Warsaw professionals working in Wola district',
    target_neighborhoods: ['wola', 'srodmiescie'],
    seasonal_relevance: 'summer',
    polish_beauty_standards: {
      naturalFocus: 'Natural makeup that lasts during hot weather',
      workAppropriate: 'Professional appearance suitable for office environment',
      convenience: 'Quick routine for busy professionals',
    },
    local_preferences: {
      transportation: 'Metro-friendly services near stations',
      timing: 'After-work express treatments',
      services: ['Quick touch-ups', 'Long-lasting makeup', 'UV protection'],
    },
    cultural_considerations: [
      'Polish professional standards',
      'Summer business casual dress code',
      'Work-life balance in Warsaw',
    ],
    related_warsaw_events: {
      summer: 'Warsaw Summer Festival season',
      business: 'Corporate networking events',
      cultural: 'Open-air concerts and festivals',
    },
    local_partnerships: [
      'Wola business centers',
      'Metro station beauty pop-ups',
      'Corporate wellness programs',
    ],
    community_initiatives: [
      'Women in Business Warsaw',
      'Wola Community Council',
      'Professional networking groups',
    ],
    location_tags: ['Wola', 'Metro Rondo Daszyńskiego', 'Warsaw Spire', 'Business Center'],
    venue_specific: 'Corporate offices and business centers in Wola district',
    accessibility_notes: 'Metro accessible, disabled-friendly facilities, parking available',
    warsaw_keywords: ['wola beauty', 'warsaw business beauty', 'metro beauty services', 'professional makeup warsaw'],
    local_business_mentions: ['Wola Shopping Center', 'Metro Wola Station', 'Warsaw Spire'],
    neighborhood_references: ['Quick services for Wola professionals', 'Near Metro Rondo Daszyńskiego'],
    local_call_to_actions: [
      'Book your lunch-break beauty session',
      'Express treatments for busy Wola professionals',
      'Corporate wellness partnerships available',
    ],
    community_involvement: 'Participating in Wola district community events and business networks',
    local_impact_story: 'Helping Warsaw professionals look and feel their best during busy summer business season',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
];

const sampleContentPerformance: ContentPerformanceAnalytics[] = [
  {
    id: '1',
    content_id: 'warsaw-1',
    date: '2024-01-15',
    views: 1800,
    unique_views: 1600,
    average_time_on_page_seconds: 195,
    bounce_rate: 32,
    likes: 145,
    shares: 42,
    comments: 28,
    saves_bookmarks: 89,
    clicks: 134,
    conversions: 15,
    conversion_rate: 0.83,
    revenue_generated: 22500,
    website_visits: 670,
    instagram_engagement: 198,
    facebook_engagement: 87,
    tiktok_views: 2300,
    newsletter_clicks: 34,
    quality_score: 91,
    relevance_score: 94,
    sentiment_score: 92,
    demographic_data: { age: '25-45', gender: 'female', location: 'Warsaw' },
    geographic_data: { poland: 95, warsaw: 88, wola: 45, europe: 3, other: 2 },
    behavior_data: { device: 'mobile', sessionDuration: 195, pagesVisited: 3.4 },
    video_completion_rate: 72,
    audio_completion_rate: 0,
    quiz_completion_rate: 0,
    download_completion_rate: 56,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
];

export const WarsawLocalContentManager = ({ className }: WarsawLocalContentManagerProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('content');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // State for content management
  const [warsawContent, setWarsawContent] = useState<WarsawLocalContentType[]>(sampleWarsawContent);
  const [performance, setPerformance] = useState<ContentPerformanceAnalytics[]>(sampleContentPerformance);

  // Toggle expanded state for content items
  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Filter content based on selected filters
  const filteredContent = warsawContent.filter(content => {
    const matchesNeighborhood = selectedNeighborhood === 'all' ||
      content.target_neighborhoods.includes(selectedNeighborhood);
    const matchesSeason = selectedSeason === 'all' || content.seasonal_relevance === selectedSeason;
    const matchesSearch = searchTerm === '' ||
      content.local_context.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.warsaw_keywords.some(keyword =>
        keyword.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesNeighborhood && matchesSeason && matchesSearch;
  });

  // Get performance metrics for content
  const getContentPerformance = (contentId: string) => {
    return performance.find(p => p.content_id === contentId);
  };

  // Calculate total metrics
  const totalMetrics = performance.reduce((acc, curr) => ({
    totalViews: acc.totalViews + curr.views,
    totalEngagement: acc.totalEngagement + curr.likes + curr.shares + curr.comments,
    totalConversions: acc.totalConversions + curr.conversions,
    avgEngagementRate: (acc.avgEngagementRate + curr.engagement_rate || 0) / (performance.length || 1),
    localReach: curr.geographic_data?.warsaw || 0,
  }), { totalViews: 0, totalEngagement: 0, totalConversions: 0, avgEngagementRate: 0, localReach: 0 });

  // Warsaw Local Content Card Component
  const WarsawContentCard = ({ content }: { content: WarsawLocalContentType }) => {
    const contentPerf = getContentPerformance(content.content_id);
    const isExpanded = expandedItems.has(content.id);
    const seasonInfo = content.seasonal_relevance ? WARSAW_SEASONS[content.seasonal_relevance] : null;

    return (
      <Card className="transition-all duration-200 hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-100 to-white">
                <MapPin className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-lg line-clamp-2">
                  {content.local_context}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  {seasonInfo && (
                    <Badge variant="outline" className="text-xs">
                      {seasonInfo.name}
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {content.target_neighborhoods.map(n => WARSAW_NEIGHBORHOODS[n]?.name || n).join(', ')}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleExpanded(content.id)}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Local Performance */}
            {contentPerf && (
              <div className="grid grid-cols-4 gap-4 p-3 bg-red-50 rounded-lg">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-red-600">
                    <Eye className="w-4 h-4" />
                    <span className="font-semibold">{contentPerf.views.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Views</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-red-600">
                    <MapPin className="w-4 h-4" />
                    <span className="font-semibold">{contentPerf.geographic_data?.warsaw || 0}%</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Warsaw</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-pink-600">
                    <Heart className="w-4 h-4" />
                    <span className="font-semibold">{contentPerf.likes}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Likes</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-purple-600">
                    <Target className="w-4 h-4" />
                    <span className="font-semibold">{contentPerf.conversions}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Conversions</div>
                </div>
              </div>
            )}

            {/* Neighborhood Focus */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Target Areas</h4>
              <div className="flex flex-wrap gap-1">
                {content.target_neighborhoods.map((neighborhood, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    <MapPin className="w-3 h-3 mr-1" />
                    {WARSAW_NEIGHBORHOODS[neighborhood]?.name || neighborhood}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Local Insights */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Cultural Context</h4>
                <ul className="text-sm space-y-1">
                  {content.cultural_considerations.slice(0, 2).map((consideration, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Globe2 className="w-3 h-3 text-blue-500" />
                      {consideration}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Local Keywords</h4>
                <div className="flex flex-wrap gap-1">
                  {content.warsaw_keywords.slice(0, 3).map((keyword, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                  {content.warsaw_keywords.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{content.warsaw_keywords.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="space-y-4 pt-4 border-t">
                {/* Polish Beauty Standards */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    <Crown className="w-4 h-4 inline mr-1" />
                    Polish Beauty Standards Applied
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(content.polish_beauty_standards).map(([key, value]) => (
                      <div key={key} className="p-3 bg-pink-50 rounded-lg">
                        <div className="font-medium text-pink-700 text-sm capitalize mb-1">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-xs text-gray-600">
                          {typeof value === 'string' ? value : Object.values(value).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Local Partnerships */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Local Partnerships
                  </h4>
                  <div className="space-y-2">
                    {content.local_partnerships.map((partnership, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                        <Building className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">{partnership}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Community Impact */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    <Heart className="w-4 h-4 inline mr-1" />
                    Community Impact
                  </h4>
                  <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                    <p className="text-sm">{content.local_impact_story}</p>
                    <div className="mt-2 text-xs text-purple-600">
                      <strong>Community Initiatives:</strong> {content.community_initiatives.join(', ')}
                    </div>
                  </div>
                </div>

                {/* Local Events Integration */}
                {Object.keys(content.related_warsaw_events).length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Local Events Integration
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries(content.related_warsaw_events).map(([season, events]) => (
                        <div key={season} className="p-2 bg-yellow-50 rounded">
                          <div className="font-medium text-yellow-700 text-sm capitalize mb-1">
                            {season} Events
                          </div>
                          <div className="text-xs text-gray-600">
                            {typeof events === 'string' ? events : events.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline">
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Analytics
                  </Button>
                  <Button size="sm" variant="outline">
                    <MapPin className="w-4 h-4 mr-1" />
                    Local View
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MapPin className="w-8 h-8 text-red-600" />
            Warsaw-Specific Local Content
          </h1>
          <p className="text-muted-foreground mt-2">
            Create hyper-localized content that resonates with Warsaw residents and reflects local culture
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Local Content
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create Warsaw-Specific Local Content</DialogTitle>
                <DialogDescription>
                  Design content that speaks directly to Warsaw residents and local culture
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="neighborhoods">Target Neighborhoods</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select neighborhoods" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(WARSAW_NEIGHBORHOODS).map(([key, info]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              {info.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="season">Seasonal Relevance</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select season" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(WARSAW_SEASONS).map(([key, info]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              {key === 'spring' && <TreePine className="w-3 h-3" />}
                              {key === 'summer' && <Sun className="w-3 h-3" />}
                              {key === 'autumn' && <Wind className="w-3 h-3" />}
                              {key === 'winter' && <Cloud className="w-3 h-3" />}
                              {info.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="local-context">Local Context</Label>
                  <Textarea
                    placeholder="Describe how this content relates to Warsaw and the specific local context..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="local-events">Local Events Integration</Label>
                    <Input placeholder="e.g., Warsaw Summer Festival, Christmas markets" />
                  </div>
                  <div>
                    <Label htmlFor="cultural-aspects">Cultural Considerations</Label>
                    <Input placeholder="e.g., Polish beauty standards, local traditions" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="warsaw-keywords">Warsaw-Specific Keywords</Label>
                  <Input placeholder="e.g., warsaw beauty, wola district, mokotow salon" />
                </div>

                <div className="space-y-3">
                  <Label>Content Features</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="polish-standards" />
                      <label htmlFor="polish-standards" className="text-sm">
                        Polish Beauty Standards
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="local-partnerships" />
                      <label htmlFor="local-partnerships" className="text-sm">
                        Local Partnerships
                    </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="community-initiatives" />
                      <label htmlFor="community-initiatives" className="text-sm">
                        Community Initiatives
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="transport-access" />
                      <label htmlFor="transport-access" className="text-sm">
                        Transport Accessibility
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={() => setShowCreateDialog(false)}>
                    Create Content
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Local Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Local Views</p>
              <p className="text-2xl font-bold">{totalMetrics.totalViews.toLocaleString()}</p>
            </div>
            <MapPin className="w-8 h-8 text-red-600" />
          </div>
          <div className="mt-2">
            <span className="text-xs text-green-600">95% from Warsaw area</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Local Engagement</p>
              <p className="text-2xl font-bold">{totalMetrics.totalEngagement.toLocaleString()}</p>
            </div>
            <Heart className="w-8 h-8 text-pink-500" />
          </div>
          <div className="mt-2">
            <span className="text-xs text-green-600">+25% local interaction</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Local Conversions</p>
              <p className="text-2xl font-bold">{totalMetrics.totalConversions}</p>
            </div>
            <Target className="w-8 h-8 text-purple-500" />
          </div>
          <div className="mt-2">
            <span className="text-xs text-green-600">+18% from Warsaw</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Coverage</p>
              <p className="text-2xl font-bold">{Object.keys(WARSAW_NEIGHBORHOODS).length}</p>
            </div>
            <Globe className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-2">
            <span className="text-xs text-muted-foreground">Warsaw districts</span>
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="content" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Local Content
          </TabsTrigger>
          <TabsTrigger value="neighborhoods" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Neighborhoods
          </TabsTrigger>
          <TabsTrigger value="seasons" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Seasons
          </TabsTrigger>
          <TabsTrigger value="culture" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Culture
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Local Content Tab */}
        <TabsContent value="content" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search local content, neighborhoods, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedNeighborhood} onValueChange={setSelectedNeighborhood}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Neighborhoods</SelectItem>
                {Object.entries(WARSAW_NEIGHBORHOODS).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3" />
                      {info.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSeason} onValueChange={setSelectedSeason}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Seasons</SelectItem>
                {Object.entries(WARSAW_SEASONS).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {key === 'spring' && <TreePine className="w-3 h-3" />}
                      {key === 'summer' && <Sun className="w-3 h-3" />}
                      {key === 'autumn' && <Wind className="w-3 h-3" />}
                      {key === 'winter' && <Cloud className="w-3 h-3" />}
                      {key}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content Grid */}
          <div className="grid gap-6">
            {filteredContent.map((content) => (
              <WarsawContentCard key={content.id} content={content} />
            ))}
          </div>

          {filteredContent.length === 0 && (
            <Card className="p-12 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No local content found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or create new Warsaw-specific content.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Local Content
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Neighborhoods Tab */}
        <TabsContent value="neighborhoods" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Warsaw Neighborhood Profiles
              </CardTitle>
              <CardDescription>
                Detailed insights into Warsaw districts for targeted content creation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(WARSAW_NEIGHBORHOODS).map(([key, neighborhood]) => (
                  <Card key={key} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{neighborhood.name}</CardTitle>
                        <MapPin className="w-5 h-5 text-red-500" />
                      </div>
                      <CardDescription>{neighborhood.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Demographics & Lifestyle</h4>
                        <p className="text-sm text-muted-foreground mb-1">
                          <strong>People:</strong> {neighborhood.demographics}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Lifestyle:</strong> {neighborhood.lifestyle}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2">Beauty & Fitness Profile</h4>
                        <p className="text-sm text-muted-foreground mb-1">
                          <strong>Beauty:</strong> {neighborhood.beautyProfile}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Fitness:</strong> {neighborhood.fitnessProfile}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2">Key Locations</h4>
                        <div className="flex flex-wrap gap-1">
                          {neighborhood.landmarks.slice(0, 3).map((landmark, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {landmark}
                            </Badge>
                          ))}
                          {neighborhood.landmarks.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{neighborhood.landmarks.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        <Button size="sm" variant="outline" className="w-full">
                          <Sparkles className="w-4 h-4 mr-1" />
                          Create Content for {neighborhood.name.split('(')[0].trim()}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seasons Tab */}
        <TabsContent value="seasons" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Warsaw Seasonal Content Strategy
              </CardTitle>
              <CardDescription>
                Seasonal beauty and fitness content adapted to Warsaw climate and culture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(WARSAW_SEASONS).map(([season, info]) => (
                  <Card key={season} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-white">
                          {season === 'spring' && <TreePine className="w-5 h-5 text-green-600" />}
                          {season === 'summer' && <Sun className="w-5 h-5 text-yellow-600" />}
                          {season === 'autumn' && <Wind className="w-5 h-5 text-orange-600" />}
                          {season === 'winter' && <Cloud className="w-5 h-5 text-blue-600" />}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{info.name}</CardTitle>
                          <CardDescription>{info.weather}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-sm mb-3">
                            <Palette className="w-4 h-4 inline mr-1" />
                            Beauty Focus
                          </h4>
                          <div className="space-y-2">
                            {info.beautyFocus.map((focus, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                                <span className="text-sm">{focus}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm mb-3">
                            <Target className="w-4 h-4 inline mr-1" />
                            Fitness Focus
                          </h4>
                          <div className="space-y-2">
                            {info.fitnessFocus.map((focus, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-sm">{focus}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-sm mb-2">Local Events</h5>
                            <div className="flex flex-wrap gap-1">
                              {info.localEvents.slice(0, 3).map((event, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {event}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h5 className="font-medium text-sm mb-2">Cultural Aspects</h5>
                            <p className="text-sm text-muted-foreground">{info.culturalAspects}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button size="sm">
                          <Calendar className="w-4 h-4 mr-1" />
                          Create Seasonal Content
                        </Button>
                        <Button size="sm" variant="outline">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          View Seasonal Trends
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Culture Tab */}
        <TabsContent value="culture" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Polish Beauty Standards
                </CardTitle>
                <CardDescription>
                  Understanding Polish beauty preferences and cultural expectations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(POLISH_BEAUTY_STANDARDS).map(([category, standards]) => (
                    <div key={category} className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2 capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}</h4>
                      <ul className="text-sm space-y-1">
                        {Object.entries(standards).map(([key, value]) => (
                          <li key={key} className="flex items-center gap-2">
                            <Star className="w-3 h-3 text-yellow-500" />
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:
                              {typeof value === 'string' ? value : value.join(', ')}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="w-5 h-5" />
                  Localization Strategy
                </CardTitle>
                <CardDescription>
                  Adapting global beauty and fitness trends for Polish market
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Language & Tone</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Professional yet approachable tone</li>
                      <li>• Use of Polish beauty terminology</li>
                      <li>• Respect for local beauty traditions</li>
                      <li>• Inclusion of Polish beauty influencers</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Visual Adaptation</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Diverse representation of Polish women</li>
                      <li>• Warsaw landmarks and settings</li>
                      <li>• Seasonal appropriate visuals</li>
                      <li>• Local fashion and style integration</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Community Integration</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Local business partnerships</li>
                      <li>• Community events participation</li>
                      <li>• Polish beauty expert collaboration</li>
                      <li>• Local testimonial features</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Local Content Performance Analytics
              </CardTitle>
              <CardDescription>
                Track how Warsaw-specific content performs across different neighborhoods and seasons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Geographic Performance */}
                <div className="p-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg">
                  <h4 className="font-semibold mb-4">Neighborhood Performance</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(WARSAW_NEIGHBORHOODS).map(([key, neighborhood]) => (
                      <div key={key} className="p-3 bg-white rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{neighborhood.name.split('(')[0].trim()}</span>
                          <Badge variant="outline" className="text-xs">
                            {Math.floor(Math.random() * 400 + 100)} views
                          </Badge>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${Math.random() * 60 + 40}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seasonal Performance */}
                <div className="p-6 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg">
                  <h4 className="font-semibold mb-4">Seasonal Content Performance</h4>
                  <div className="space-y-3">
                    {Object.entries(WARSAW_SEASONS).map(([season, info]) => (
                      <div key={season} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div className="flex items-center gap-2">
                          {season === 'spring' && <TreePine className="w-4 h-4 text-green-600" />}
                          {season === 'summer' && <Sun className="w-4 h-4 text-yellow-600" />}
                          {season === 'autumn' && <Wind className="w-4 h-4 text-orange-600" />}
                          {season === 'winter' && <Cloud className="w-4 h-4 text-blue-600" />}
                          <span className="font-medium">{info.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm">{Math.floor(Math.random() * 800 + 200)} views</span>
                          <Badge variant="outline">{Math.floor(Math.random() * 60 + 20)}% engagement</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Local Engagement Metrics */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Local Content</th>
                        <th className="text-left py-3 px-4">Warsaw Views</th>
                        <th className="text-left py-3 px-4">Local Engagement</th>
                        <th className="text-left py-3 px-4">Conversions</th>
                        <th className="text-left py-3 px-4">Local Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performance.map((perf, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium">Warsaw Content #{idx + 1}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(perf.date).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-red-500" />
                              {perf.geographic_data?.warsaw || 0}%
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <Heart className="w-4 h-4 text-pink-500" />
                              {perf.likes + perf.comments + perf.saves_bookmarks}
                            </div>
                          </td>
                          <td className="py-3 px-4">{perf.conversions}</td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-green-600">
                              {perf.revenue_generated.toLocaleString()} PLN
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WarsawLocalContentManager;