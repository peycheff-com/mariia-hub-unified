import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  TrendingUp,
  Clock,
  Star,
  Filter,
  Grid,
  List,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  Users,
  Eye,
  Download,
  Upload,
  Settings,
  Brain,
  Zap,
  Target,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Share2,
  Bookmark,
  BookmarkCheck,
  Tag,
  Calendar,
  Globe,
  Languages,
  Lightbulb,
  HelpCircle,
  FileText,
  Video,
  Image,
  Headphones,
  Link as LinkIcon,
  Package,
  Sparkles,
  Award,
  Timer,
  TrendingDown,
  Activity,
  PieChart,
  LineChart
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

import { supportAutomationService } from '@/services/support-automation.service';
import { KnowledgeBaseArticle, KnowledgeSearchResult } from '@/types/support-automation';
import { cn } from '@/lib/utils';
import { toast aria-live="polite" aria-atomic="true" } from 'sonner';

interface SmartFAQSystemProps {
  className?: string;
  onArticleSelect?: (article: KnowledgeBaseArticle) => void;
  showAnalytics?: boolean;
  editable?: boolean;
  categories?: string[];
  languages?: string[];
}

interface FAQAnalytics {
  totalViews: number;
  totalSearches: number;
  topArticles: Array<{
    article: KnowledgeBaseArticle;
    views: number;
    helpful: number;
    notHelpful: number;
    satisfaction: number;
  }>;
  searchTrends: Array<{
    query: string;
    count: number;
    successRate: number;
  }>;
  categoryPerformance: Array<{
    category: string;
    articleCount: number;
    totalViews: number;
    averageSatisfaction: number;
  }>;
  languageBreakdown: Array<{
    language: string;
    usage: number;
    satisfaction: number;
  }>;
  learningInsights: Array<{
    type: 'gap' | 'opportunity' | 'decline';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    recommendation: string;
  }>;
}

export function SmartFAQSystem({
  className,
  onArticleSelect,
  showAnalytics = false,
  editable = false,
  categories = [],
  languages = ['en', 'pl']
}: SmartFAQSystemProps) {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'relevance' | 'popularity' | 'recent' | 'rating'>('relevance');

  // Data states
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [searchResults, setSearchResults] = useState<KnowledgeSearchResult[]>([]);
  const [analytics, setAnalytics] = useState<FAQAnalytics | null>(null);
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [suggestedArticles, setSuggestedArticles] = useState<KnowledgeBaseArticle[]>([]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeBaseArticle | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Set<string>>(new Set());
  const [ratedArticles, setRatedArticles] = useState<Map<string, 'helpful' | 'notHelpful'>>(new Map());

  // Analytics states
  const [showCreateArticle, setShowCreateArticle] = useState(false);
  const [showEditArticle, setShowEditArticle] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());

  // AI features
  const [aiSearchEnabled, setAiSearchEnabled] = useState(true);
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(true);
  const [smartRecommendationsEnabled, setSmartRecommendationsEnabled] = useState(true);
  const [autoCategorizationEnabled, setAutoCategorizationEnabled] = useState(true);

  // Load initial data
  useEffect(() => {
    loadArticles();
    if (showAnalytics) {
      loadAnalytics();
    }
    loadTrendingTopics();
    loadUserPreferences();
  }, [selectedLanguage, selectedCategory]);

  // Smart search with debouncing
  useEffect(() => {
    if (searchQuery.trim()) {
      const timer = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, aiSearchEnabled]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch from the database
      const mockArticles: KnowledgeBaseArticle[] = [
        {
          id: 'kb-1',
          title: 'How to Book Your First Appointment',
          content: 'Complete guide on booking your first beauty or fitness appointment...',
          summary: 'Step-by-step instructions for booking your first appointment online',
          category: 'booking',
          subcategory: 'getting-started',
          tags: ['booking', 'first-time', 'appointment', 'online'],
          author: 'Mariia Team',
          status: 'published',
          language: selectedLanguage,
          priority: 1,
          views: 1234,
          helpful: 89,
          notHelpful: 12,
          searchTerms: ['book', 'appointment', 'first time', 'how to'],
          relatedArticles: ['kb-2', 'kb-3'],
          lastReviewed: new Date().toISOString(),
          nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          aiGenerated: false,
          aiOptimized: true,
          readabilityScore: 92,
          seoScore: 88,
          effectiveness: 0.88,
          usageCount: 1234,
          successRate: 0.88,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          version: 3,
          feedback: [
            {
              id: 'fb-1',
              rating: 5,
              comment: 'Very helpful guide!',
              helpful: true,
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              userId: 'user-1'
            }
          ]
        },
        {
          id: 'kb-2',
          title: 'Payment Methods and Pricing',
          content: 'Information about all accepted payment methods and pricing details...',
          summary: 'Complete overview of payment options and service pricing',
          category: 'billing',
          subcategory: 'payment',
          tags: ['payment', 'pricing', 'methods', 'credit card', 'cash'],
          author: 'Mariia Team',
          status: 'published',
          language: selectedLanguage,
          priority: 2,
          views: 856,
          helpful: 72,
          notHelpful: 8,
          searchTerms: ['payment', 'price', 'cost', 'methods', 'billing'],
          relatedArticles: ['kb-1', 'kb-4'],
          lastReviewed: new Date().toISOString(),
          nextReview: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          aiGenerated: false,
          aiOptimized: true,
          readabilityScore: 89,
          seoScore: 91,
          effectiveness: 0.90,
          usageCount: 856,
          successRate: 0.90,
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          version: 2,
          feedback: []
        },
        {
          id: 'kb-3',
          title: 'Cancellation Policy',
          content: 'Detailed explanation of our cancellation policy and rescheduling options...',
          summary: 'Everything you need to know about canceling or rescheduling appointments',
          category: 'policies',
          subcategory: 'cancellation',
          tags: ['cancellation', 'reschedule', 'policy', 'refund', 'fees'],
          author: 'Mariia Team',
          status: 'published',
          language: selectedLanguage,
          priority: 2,
          views: 2341,
          helpful: 156,
          notHelpful: 34,
          searchTerms: ['cancel', 'reschedule', 'policy', 'refund', 'fee'],
          relatedArticles: ['kb-1', 'kb-4'],
          lastReviewed: new Date().toISOString(),
          nextReview: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          aiGenerated: true,
          aiOptimized: true,
          readabilityScore: 95,
          seoScore: 87,
          effectiveness: 0.82,
          usageCount: 2341,
          successRate: 0.82,
          createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          publishedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
          version: 4,
          feedback: []
        }
      ];

      // Filter by category and language
      const filteredArticles = mockArticles.filter(article => {
        const categoryMatch = selectedCategory === 'all' || article.category === selectedCategory;
        const languageMatch = article.language === selectedLanguage;
        return categoryMatch && languageMatch;
      });

      setArticles(filteredArticles);

      // Load suggested articles based on user behavior
      if (smartRecommendationsEnabled) {
        loadSuggestedArticles(filteredArticles);
      }
    } catch (error) {
      console.error('Error loading articles:', error);
      toast aria-live="polite" aria-atomic="true".error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (query: string) => {
    try {
      setSearching(true);
      const results = await supportAutomationService.searchKnowledgeBase(query, {
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        language: selectedLanguage,
        limit: 20,
        minRelevance: 0.6
      });

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      toast aria-live="polite" aria-atomic="true".error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      // Mock analytics data
      const mockAnalytics: FAQAnalytics = {
        totalViews: 15432,
        totalSearches: 3456,
        topArticles: [
          {
            article: articles[0] || {} as KnowledgeBaseArticle,
            views: 1234,
            helpful: 89,
            notHelpful: 12,
            satisfaction: 0.88
          }
        ],
        searchTrends: [
          { query: 'how to book', count: 234, successRate: 0.92 },
          { query: 'cancellation policy', count: 189, successRate: 0.85 },
          { query: 'payment methods', count: 156, successRate: 0.90 }
        ],
        categoryPerformance: [
          { category: 'booking', articleCount: 12, totalViews: 4567, averageSatisfaction: 0.89 },
          { category: 'billing', articleCount: 8, totalViews: 2341, averageSatisfaction: 0.91 },
          { category: 'policies', articleCount: 15, totalViews: 3421, averageSatisfaction: 0.82 }
        ],
        languageBreakdown: [
          { language: 'en', usage: 0.65, satisfaction: 0.88 },
          { language: 'pl', usage: 0.35, satisfaction: 0.91 }
        ],
        learningInsights: [
          {
            type: 'gap',
            title: 'Missing Weekend Booking Information',
            description: 'Users frequently search for weekend booking options but find limited information',
            impact: 'high',
            recommendation: 'Create detailed article about weekend availability and booking process'
          },
          {
            type: 'opportunity',
            title: 'High Interest in VIP Services',
            description: 'Significant search traffic for VIP and premium services',
            impact: 'medium',
            recommendation: 'Expand VIP services documentation and benefits'
          }
        ]
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadTrendingTopics = async () => {
    try {
      // Mock trending topics
      const mockTrending = [
        'luxury facial treatment',
        'weekend appointments',
        'gift cards',
        'group bookings',
        'membership benefits'
      ];
      setTrendingTopics(mockTrending);
    } catch (error) {
      console.error('Error loading trending topics:', error);
    }
  };

  const loadSuggestedArticles = (availableArticles: KnowledgeBaseArticle[]) => {
    // Mock suggestion algorithm based on views and effectiveness
    const suggested = availableArticles
      .sort((a, b) => (b.effectiveness * b.views) - (a.effectiveness * a.views))
      .slice(0, 3);
    setSuggestedArticles(suggested);
  };

  const loadUserPreferences = () => {
    // Load user preferences from localStorage or API
    const savedBookmarks = localStorage.getItem('faq-bookmarks');
    const savedRatings = localStorage.getItem('faq-ratings');

    if (savedBookmarks) {
      setBookmarkedArticles(new Set(JSON.parse(savedBookmarks)));
    }

    if (savedRatings) {
      setRatedArticles(new Map(JSON.parse(savedRatings)));
    }
  };

  const handleArticleRate = async (articleId: string, rating: 'helpful' | 'notHelpful') => {
    try {
      // Update local state
      const newRatings = new Map(ratedArticles);
      newRatings.set(articleId, rating);
      setRatedArticles(newRatings);

      // Save to localStorage
      localStorage.setItem('faq-ratings', JSON.stringify(Array.from(newRatings.entries())));

      // Update article statistics
      const article = articles.find(a => a.id === articleId);
      if (article) {
        const updatedArticles = articles.map(a => {
          if (a.id === articleId) {
            return {
              ...a,
              helpful: rating === 'helpful' ? a.helpful + 1 : a.helpful,
              notHelpful: rating === 'notHelpful' ? a.notHelpful + 1 : a.notHelpful,
              effectiveness: rating === 'helpful'
                ? Math.min(1, a.effectiveness + 0.01)
                : Math.max(0, a.effectiveness - 0.01)
            };
          }
          return a;
        });
        setArticles(updatedArticles);
      }

      toast aria-live="polite" aria-atomic="true".success('Thank you for your feedback!');
    } catch (error) {
      console.error('Error rating article:', error);
      toast aria-live="polite" aria-atomic="true".error('Failed to submit feedback');
    }
  };

  const handleBookmarkToggle = (articleId: string) => {
    const newBookmarks = new Set(bookmarkedArticles);
    if (newBookmarks.has(articleId)) {
      newBookmarks.delete(articleId);
      toast aria-live="polite" aria-atomic="true".success('Article removed from bookmarks');
    } else {
      newBookmarks.add(articleId);
      toast aria-live="polite" aria-atomic="true".success('Article added to bookmarks');
    }
    setBookmarkedArticles(newBookmarks);
    localStorage.setItem('faq-bookmarks', JSON.stringify(Array.from(newBookmarks)));
  };

  const handleTrendingTopicClick = (topic: string) => {
    setSearchQuery(topic);
    performSearch(topic);
  };

  const handleShareArticle = async (article: KnowledgeBaseArticle) => {
    try {
      const shareUrl = `${window.location.origin}/faq/${article.id}`;
      if (navigator.share) {
        await navigator.share({
          title: article.title,
          text: article.summary,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast aria-live="polite" aria-atomic="true".success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing article:', error);
      toast aria-live="polite" aria-atomic="true".error('Failed to share article');
    }
  };

  const filteredArticles = useMemo(() => {
    let filtered = [...articles];

    // Sort articles
    switch (sortBy) {
      case 'popularity':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case 'recent':
        filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case 'rating':
        filtered.sort((a, b) => (b.effectiveness || 0) - (a.effectiveness || 0));
        break;
      case 'relevance':
      default:
        // Keep original order or sort by AI relevance
        break;
    }

    return filtered;
  }, [articles, sortBy]);

  const displayArticles = searchQuery.trim() && searchResults.length > 0
    ? searchResults.map(result => articles.find(a => a.id === result.articleId)).filter(Boolean) as KnowledgeBaseArticle[]
    : filteredArticles;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn("space-y-6", className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              {t('faq.title', 'Smart FAQ System')}
              {aiSearchEnabled && (
                <Badge variant="secondary" className="text-xs">
                  <Brain className="h-3 w-3 mr-1" />
                  AI Enhanced
                </Badge>
              )}
            </h2>
            <p className="text-muted-foreground">
              {t('faq.description', 'Intelligent knowledge base with AI-powered search and recommendations')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {editable && (
              <Button onClick={() => setShowCreateArticle(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('faq.createArticle', 'Create Article')}
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {t('faq.export', 'Export')}
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('faq.searchPlaceholder', 'Search for help articles...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-12"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                  </div>
                )}
                {aiSearchEnabled && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                        <Brain className="h-4 w-4 text-blue-500" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>AI-powered search enabled</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t('faq.filters', 'Filters')}:</span>
                </div>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('faq.allCategories', 'All Categories')}</SelectItem>
                    <SelectItem value="booking">{t('faq.booking', 'Booking')}</SelectItem>
                    <SelectItem value="billing">{t('faq.billing', 'Billing')}</SelectItem>
                    <SelectItem value="policies">{t('faq.policies', 'Policies')}</SelectItem>
                    <SelectItem value="technical">{t('faq.technical', 'Technical')}</SelectItem>
                    <SelectItem value="services">{t('faq.services', 'Services')}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(lang => (
                      <SelectItem key={lang} value={lang}>
                        {lang.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">{t('faq.relevance', 'Relevance')}</SelectItem>
                    <SelectItem value="popularity">{t('faq.popularity', 'Popular')}</SelectItem>
                    <SelectItem value="recent">{t('faq.recent', 'Recent')}</SelectItem>
                    <SelectItem value="rating">{t('faq.rating', 'Top Rated')}</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-1 ml-auto">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Trending Topics */}
              {trendingTopics.length > 0 && !searchQuery && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">{t('faq.trendingTopics', 'Trending Topics')}:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {trendingTopics.map((topic, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleTrendingTopicClick(topic)}
                        className="text-xs"
                      >
                        {topic}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search Results */}
            {searchQuery.trim() && searchResults.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t('faq.searchResults', 'Search Results')} ({searchResults.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {searchResults.map((result) => {
                      const article = articles.find(a => a.id === result.articleId);
                      if (!article) return null;

                      return (
                        <div key={result.articleId} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold mb-2 flex items-center gap-2">
                                {article.title}
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(result.relevanceScore * 100)}% match
                                </Badge>
                              </h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                {article.summary}
                              </p>
                              {result.suggestedResponse && (
                                <div className="bg-blue-50 p-3 rounded-md mb-2">
                                  <p className="text-sm">{result.suggestedResponse}</p>
                                </div>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{article.views} views</span>
                                <span>{Math.round((article.effectiveness || 0) * 100)}% helpful</span>
                                <span>{article.category}</span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Articles Grid/List */}
            {displayArticles.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayArticles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      onSelect={() => {
                        setSelectedArticle(article);
                        onArticleSelect?.(article);
                      }}
                      onRate={handleArticleRate}
                      onBookmark={handleBookmarkToggle}
                      onShare={handleShareArticle}
                      isBookmarked={bookmarkedArticles.has(article.id)}
                      userRating={ratedArticles.get(article.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {displayArticles.map((article) => (
                    <ArticleListItem
                      key={article.id}
                      article={article}
                      onSelect={() => {
                        setSelectedArticle(article);
                        onArticleSelect?.(article);
                      }}
                      onRate={handleArticleRate}
                      onBookmark={handleBookmarkToggle}
                      onShare={handleShareArticle}
                      isBookmarked={bookmarkedArticles.has(article.id)}
                      userRating={ratedArticles.get(article.id)}
                    />
                  ))}
                </div>
              )
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {searchQuery.trim()
                      ? t('faq.noResults', 'No articles found')
                      : t('faq.noArticles', 'No articles available')
                    }
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery.trim()
                      ? t('faq.tryDifferentSearch', 'Try different search terms or browse categories')
                      : t('faq.noArticlesDesc', 'Articles will appear here once they are created')
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Suggested Articles */}
            {smartRecommendationsEnabled && suggestedArticles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-500" />
                    {t('faq.suggestedForYou', 'Suggested for You')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {suggestedArticles.map((article) => (
                      <div
                        key={article.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedArticle(article)}
                      >
                        <h4 className="font-medium text-sm mb-1">{article.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {article.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('faq.categories', 'Categories')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['booking', 'billing', 'policies', 'technical', 'services'].map((category) => (
                    <div
                      key={category}
                      className={cn(
                        "flex items-center justify-between p-2 rounded cursor-pointer transition-colors",
                        selectedCategory === category ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                      )}
                      onClick={() => setSelectedCategory(category)}
                    >
                      <span className="capitalize text-sm">{category}</span>
                      <Badge variant="outline" className="text-xs">
                        {articles.filter(a => a.category === category).length}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Features Toggle */}
            {editable && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {t('faq.aiFeatures', 'AI Features')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{t('faq.aiSearch', 'AI Search')}</div>
                        <p className="text-xs text-muted-foreground">
                          {t('faq.aiSearchDesc', 'Enhanced search with AI')}
                        </p>
                      </div>
                      <Switch
                        checked={aiSearchEnabled}
                        onCheckedChange={setAiSearchEnabled}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{t('faq.autoTranslate', 'Auto Translate')}</div>
                        <p className="text-xs text-muted-foreground">
                          {t('faq.autoTranslateDesc', 'Automatic translation')}
                        </p>
                      </div>
                      <Switch
                        checked={autoTranslateEnabled}
                        onCheckedChange={setAutoTranslateEnabled}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{t('faq.smartRecs', 'Smart Recommendations')}</div>
                        <p className="text-xs text-muted-foreground">
                          {t('faq.smartRecsDesc', 'Personalized suggestions')}
                        </p>
                      </div>
                      <Switch
                        checked={smartRecommendationsEnabled}
                        onCheckedChange={setSmartRecommendationsEnabled}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Analytics Section */}
        {showAnalytics && analytics && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">{t('faq.analytics', 'Analytics Dashboard')}</h3>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('faq.totalViews', 'Total Views')}</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    12% from last month
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('faq.searchQueries', 'Search Queries')}</CardTitle>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalSearches.toLocaleString()}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    8% from last month
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('faq.avgSatisfaction', 'Avg Satisfaction')}</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">87%</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <ThumbsUp className="h-3 w-3 mr-1 text-green-500" />
                    Excellent rating
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('faq.aiOptimization', 'AI Optimization')}</CardTitle>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">92%</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Zap className="h-3 w-3 mr-1 text-blue-500" />
                    Highly optimized
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Learning Insights */}
            {analytics.learningInsights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    {t('faq.aiInsights', 'AI Learning Insights')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.learningInsights.map((insight, index) => (
                      <Alert key={index} className={cn(
                        "border-l-4",
                        insight.type === 'gap' ? "border-orange-500 bg-orange-50" :
                        insight.type === 'opportunity' ? "border-green-500 bg-green-50" :
                        "border-blue-500 bg-blue-50"
                      )}>
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {insight.type === 'gap' && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                              {insight.type === 'opportunity' && <Target className="h-4 w-4 text-green-600" />}
                              <h4 className="font-semibold">{insight.title}</h4>
                              <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'} className="text-xs">
                                {insight.impact} impact
                              </Badge>
                            </div>
                            <AlertDescription>{insight.description}</AlertDescription>
                            <div className="mt-2 p-3 bg-muted/50 rounded">
                              <div className="font-medium text-sm mb-1">{t('faq.recommendation', 'Recommendation')}:</div>
                              <p className="text-sm">{insight.recommendation}</p>
                            </div>
                          </div>
                        </div>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Article Detail Modal */}
        {selectedArticle && (
          <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {selectedArticle.title}
                </DialogTitle>
                <DialogDescription>
                  {selectedArticle.summary}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Article Meta */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(selectedArticle.updatedAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {selectedArticle.views} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {Math.round((selectedArticle.effectiveness || 0) * 100)}% helpful
                  </span>
                  <Badge variant="outline">{selectedArticle.category}</Badge>
                  {selectedArticle.aiGenerated && (
                    <Badge variant="secondary">
                      <Brain className="h-3 w-3 mr-1" />
                      AI Generated
                    </Badge>
                  )}
                </div>

                {/* Article Content */}
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap">{selectedArticle.content}</div>
                </div>

                {/* Tags */}
                {selectedArticle.tags.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">{t('faq.tags', 'Tags')}:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedArticle.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{t('faq.wasThisHelpful', 'Was this helpful?')}:</span>
                    <Button
                      size="sm"
                      variant={ratedArticles.get(selectedArticle.id) === 'helpful' ? 'default' : 'outline'}
                      onClick={() => handleArticleRate(selectedArticle.id, 'helpful')}
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      {t('faq.yes', 'Yes')}
                    </Button>
                    <Button
                      size="sm"
                      variant={ratedArticles.get(selectedArticle.id) === 'notHelpful' ? 'default' : 'outline'}
                      onClick={() => handleArticleRate(selectedArticle.id, 'notHelpful')}
                    >
                      <ThumbsDown className="h-4 w-4 mr-1" />
                      {t('faq.no', 'No')}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBookmarkToggle(selectedArticle.id)}
                    >
                      {bookmarkedArticles.has(selectedArticle.id) ? (
                        <BookmarkCheck className="h-4 w-4 mr-1" />
                      ) : (
                        <Bookmark className="h-4 w-4 mr-1" />
                      )}
                      {bookmarkedArticles.has(selectedArticle.id) ? t('faq.bookmarked', 'Bookmarked') : t('faq.bookmark', 'Bookmark')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShareArticle(selectedArticle)}
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      {t('faq.share', 'Share')}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </TooltipProvider>
  );
}

// Article Card Component
interface ArticleCardProps {
  article: KnowledgeBaseArticle;
  onSelect: () => void;
  onRate: (articleId: string, rating: 'helpful' | 'notHelpful') => void;
  onBookmark: (articleId: string) => void;
  onShare: (article: KnowledgeBaseArticle) => void;
  isBookmarked: boolean;
  userRating?: 'helpful' | 'notHelpful';
}

function ArticleCard({
  article,
  onSelect,
  onRate,
  onBookmark,
  onShare,
  isBookmarked,
  userRating
}: ArticleCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onSelect}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2 line-clamp-2">{article.title}</CardTitle>
            <CardDescription className="line-clamp-3">{article.summary}</CardDescription>
          </div>
          {article.aiGenerated && (
            <Badge variant="secondary" className="ml-2">
              <Brain className="h-3 w-3 mr-1" />
              AI
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {article.views}
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              {Math.round((article.effectiveness || 0) * 100)}%
            </span>
            <Badge variant="outline" className="text-xs">
              {article.category}
            </Badge>
          </div>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {article.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {article.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{article.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={userRating === 'helpful' ? 'default' : 'ghost'}
                onClick={(e) => {
                  e.stopPropagation();
                  onRate(article.id, 'helpful');
                }}
                className="h-7 px-2"
              >
                <ThumbsUp className="h-3 w-3 mr-1" />
                {article.helpful}
              </Button>
              <Button
                size="sm"
                variant={userRating === 'notHelpful' ? 'default' : 'ghost'}
                onClick={(e) => {
                  e.stopPropagation();
                  onRate(article.id, 'notHelpful');
                }}
                className="h-7 px-2"
              >
                <ThumbsDown className="h-3 w-3 mr-1" />
                {article.notHelpful}
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onBookmark(article.id);
                }}
                className="h-7 w-7 p-0"
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-3 w-3" />
                ) : (
                  <Bookmark className="h-3 w-3" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(article);
                }}
                className="h-7 w-7 p-0"
              >
                <Share2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Article List Item Component
interface ArticleListItemProps {
  article: KnowledgeBaseArticle;
  onSelect: () => void;
  onRate: (articleId: string, rating: 'helpful' | 'notHelpful') => void;
  onBookmark: (articleId: string) => void;
  onShare: (article: KnowledgeBaseArticle) => void;
  isBookmarked: boolean;
  userRating?: 'helpful' | 'notHelpful';
}

function ArticleListItem({
  article,
  onSelect,
  onRate,
  onBookmark,
  onShare,
  isBookmarked,
  userRating
}: ArticleListItemProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{article.title}</h3>
              {article.aiGenerated && (
                <Badge variant="secondary" className="text-xs">
                  <Brain className="h-3 w-3 mr-1" />
                  AI
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {article.category}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {article.summary}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {article.views}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {Math.round((article.effectiveness || 0) * 100)}%
                </span>
                <span>{new Date(article.updatedAt).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant={userRating === 'helpful' ? 'default' : 'ghost'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRate(article.id, 'helpful');
                  }}
                  className="h-7 px-2"
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  {article.helpful}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookmark(article.id);
                  }}
                  className="h-7 w-7 p-0"
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="h-3 w-3" />
                  ) : (
                    <Bookmark className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <ChevronRight className="h-4 w-4 text-muted-foreground ml-4 mt-1" />
        </div>
      </CardContent>
    </Card>
  );
}