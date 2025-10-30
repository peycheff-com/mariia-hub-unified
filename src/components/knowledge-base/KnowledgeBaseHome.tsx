import React, { useState, useEffect } from 'react';
import { Search, BookOpen, HelpCircle, TrendingUp, Clock, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import KnowledgeBaseService from '@/services/knowledge-base.service';
import SmartSearchService from '@/services/smart-search.service';
import type { KBCategory, KBArticle, FAQItem } from '@/types/knowledge-base';

interface KnowledgeBaseHomeProps {
  serviceType?: 'beauty' | 'fitness' | 'lifestyle';
}

export const KnowledgeBaseHome: React.FC<KnowledgeBaseHomeProps> = ({ serviceType }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [categories, setCategories] = useState<KBCategory[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<KBArticle[]>([]);
  const [recentArticles, setRecentArticles] = useState<KBArticle[]>([]);
  const [popularFAQs, setPopularFAQs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [serviceType]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [
        categoriesData,
        featuredData,
        recentData,
        faqsData,
      ] = await Promise.all([
        KnowledgeBaseService.getKBCategories(serviceType),
        KnowledgeBaseService.getArticles({ featured: true, service_type: serviceType, limit: 6 }),
        KnowledgeBaseService.getArticles({ service_type: serviceType, limit: 5 }),
        KnowledgeBaseService.getFAQs({ featured: true, limit: 5 }),
      ]);

      setCategories(categoriesData);
      setFeaturedArticles(featuredData.articles);
      setRecentArticles(recentData.articles);
      setPopularFAQs(faqsData);
    } catch (error) {
      console.error('Error loading knowledge base data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const results = await SmartSearchService.smartSearch(query, {}, {
        includeSuggestions: true,
        enableFuzzyMatching: true,
        maxResults: 10,
      });
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = async (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(value.length >= 2);

    if (value.length >= 2) {
      try {
        const autoSuggestions = await SmartSearchService.getAutoCompleteSuggestions(value, 5);
        setSuggestions(autoSuggestions);
      } catch (error) {
        console.error('Error getting suggestions:', error);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion);
  };

  const handleArticleClick = async (article: KBArticle) => {
    await KnowledgeBaseService.trackArticleView(article.id);
    // Navigate to article page would go here
  };

  const handleFAQClick = async (faq: FAQItem) => {
    // Track FAQ view would go here
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Knowledge Base
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Find answers to your questions about our beauty and fitness services
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search for articles, FAQs, or topics..."
                value={searchQuery}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchQuery);
                    setShowSuggestions(false);
                  }
                }}
                className="pl-12 pr-4 py-3 text-lg h-12"
              />
              <Button
                onClick={() => {
                  handleSearch(searchQuery);
                  setShowSuggestions(false);
                }}
                disabled={isSearching}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                size="sm"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-gray-400" />
                      <span>{suggestion}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Search Categories */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {categories.slice(0, 5).map((category) => (
              <Badge
                key={category.id}
                variant="secondary"
                className="cursor-pointer hover:bg-gray-200"
                onClick={() => handleSearch(category.name)}
              >
                {category.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Search Results */}
        {searchResults && (
          <div className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">Search Results</h2>
              <p className="text-gray-600">
                Found {searchResults.total_count} results in {searchResults.search_time}ms
                {searchResults.correctedQuery && (
                  <span className="ml-2">
                    (Did you mean: <em>{searchResults.correctedQuery}</em>?)
                  </span>
                )}
              </p>
            </div>

            <Tabs defaultValue="articles" className="w-full">
              <TabsList>
                <TabsTrigger value="articles">
                  Articles ({searchResults.articles.length})
                </TabsTrigger>
                <TabsTrigger value="faqs">
                  FAQs ({searchResults.faqs.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="articles" className="mt-6">
                <div className="grid gap-4">
                  {searchResults.articles.map((article: any) => (
                    <Card key={article.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg hover:text-blue-600 transition-colors">
                              {article.title}
                            </CardTitle>
                            <CardDescription className="mt-2">
                              {article.summary}
                            </CardDescription>
                          </div>
                          {article.featured_image_url && (
                            <img
                              src={article.featured_image_url}
                              alt={article.title}
                              className="w-20 h-20 object-cover rounded-lg ml-4"
                            />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {article.reading_time_minutes} min read
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4" />
                              {article.view_count} views
                            </span>
                          </div>
                          {article.category && (
                            <Badge variant="outline">{article.category.name}</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="faqs" className="mt-6">
                <div className="space-y-4">
                  {searchResults.faqs.map((faq: any) => (
                    <Card key={faq.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <HelpCircle className="h-5 w-5 text-blue-600" />
                          {faq.question}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 mb-4">{faq.answer}</p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4" />
                              {faq.view_count} views
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="h-4 w-4" />
                              {faq.helpful_count} helpful
                            </span>
                          </div>
                          {faq.category && (
                            <Badge variant="outline">{faq.category.name}</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Search Suggestions */}
            {searchResults.suggestions && searchResults.suggestions.length > 0 && (
              <div className="mt-8 p-6 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Try searching for:</h3>
                <div className="flex flex-wrap gap-2">
                  {searchResults.suggestions.map((suggestion: string, index: number) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-blue-100"
                      onClick={() => handleSearch(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Content (when not searching) */}
        {!searchResults && (
          <Tabs defaultValue="categories" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="articles">Articles</TabsTrigger>
              <TabsTrigger value="faqs">FAQs</TabsTrigger>
              <TabsTrigger value="popular">Popular</TabsTrigger>
            </TabsList>

            {/* Categories Tab */}
            <TabsContent value="categories" className="mt-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2">Browse by Category</h2>
                <p className="text-gray-600">
                  Find information organized by service types and topics
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <Card key={category.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: category.color + '20' }}
                        >
                          <BookOpen className="h-6 w-6" style={{ color: category.color }} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <CardDescription>{category.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full">
                        Browse {category.name}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Articles Tab */}
            <TabsContent value="articles" className="mt-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2">Latest Articles</h2>
                <p className="text-gray-600">
                  Recent articles and guides about our services
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {recentArticles.map((article) => (
                  <Card key={article.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader>
                      {article.featured_image_url && (
                        <img
                          src={article.featured_image_url}
                          alt={article.title}
                          className="w-full h-48 object-cover rounded-lg mb-4"
                        />
                      )}
                      <CardTitle className="text-xl hover:text-blue-600 transition-colors">
                        {article.title}
                      </CardTitle>
                      <CardDescription>{article.summary}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {article.reading_time_minutes} min read
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            {article.view_count} views
                          </span>
                        </div>
                        {article.category && (
                          <Badge variant="outline">{article.category.name}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* FAQs Tab */}
            <TabsContent value="faqs" className="mt-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2">Frequently Asked Questions</h2>
                <p className="text-gray-600">
                  Quick answers to common questions
                </p>
              </div>
              <div className="space-y-4">
                {popularFAQs.map((faq) => (
                  <Card key={faq.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-blue-600" />
                        {faq.question}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{faq.answer}</p>
                      {faq.category && (
                        <Badge variant="outline" className="mt-3">
                          {faq.category.name}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Popular Tab */}
            <TabsContent value="popular" className="mt-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2">Popular Content</h2>
                <p className="text-gray-600">
                  Most viewed and helpful articles and FAQs
                </p>
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                {/* Popular Articles */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Popular Articles</h3>
                  <div className="space-y-4">
                    {featuredArticles.map((article, index) => (
                      <div key={article.id} className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium hover:text-blue-600 cursor-pointer transition-colors">
                            {article.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {article.view_count} views • {article.reading_time_minutes} min read
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Popular FAQs */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Popular FAQs</h3>
                  <div className="space-y-4">
                    {popularFAQs.slice(0, 5).map((faq, index) => (
                      <div key={faq.id} className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium hover:text-blue-600 cursor-pointer transition-colors">
                            {faq.question}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {faq.view_count} views • {faq.helpful_count} helpful votes
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBaseHome;