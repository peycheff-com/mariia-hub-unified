import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Search,
  BookOpen,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import KnowledgeBaseService from '@/services/knowledge-base.service';
import SmartSearchService from '@/services/smart-search.service';
import type { KBArticle, FAQItem } from '@/types/knowledge-base';

interface KBWidgetProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'light' | 'dark';
  size?: 'small' | 'medium' | 'large';
  showCategories?: boolean;
  defaultOpen?: boolean;
  context?: {
    page?: string;
    serviceType?: 'beauty' | 'fitness' | 'lifestyle';
    tags?: string[];
  };
}

export const KBWidget: React.FC<KBWidgetProps> = ({
  position = 'bottom-right',
  theme = 'light',
  size = 'medium',
  showCategories = true,
  defaultOpen = false,
  context,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [popularArticles, setPopularArticles] = useState<KBArticle[]>([]);
  const [quickFAQs, setQuickFAQs] = useState<FAQItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSection, setActiveSection] = useState<'search' | 'popular' | 'faqs' | 'categories'>('search');

  useEffect(() => {
    if (isOpen) {
      loadWidgetContent();
    }
  }, [isOpen, context]);

  const loadWidgetContent = async () => {
    try {
      const filters: any = {
        limit: size === 'small' ? 3 : size === 'medium' ? 5 : 8,
      };

      if (context?.serviceType) {
        filters.service_type = context.serviceType;
      }

      const [articlesData, faqsData, categoriesData] = await Promise.all([
        KnowledgeBaseService.getArticles({ ...filters, featured: true }),
        KnowledgeBaseService.getFAQs({ ...filters, featured: true }),
        showCategories ? KnowledgeBaseService.getKBCategories(context?.serviceType) : Promise.resolve([]),
      ]);

      setPopularArticles(articlesData.articles);
      setQuickFAQs(faqsData);
      setCategories(categoriesData.slice(0, 5));
    } catch (error) {
      console.error('Error loading widget content:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await SmartSearchService.smartSearch(searchQuery, {}, {
        maxResults: 5,
      });

      setSearchResults(results);
      setActiveSection('search');
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50';

    switch (position) {
      case 'bottom-right':
        return `${baseClasses} bottom-4 right-4`;
      case 'bottom-left':
        return `${baseClasses} bottom-4 left-4`;
      case 'top-right':
        return `${baseClasses} top-4 right-4`;
      case 'top-left':
        return `${baseClasses} top-4 left-4`;
      default:
        return `${baseClasses} bottom-4 right-4`;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-80 max-h-96';
      case 'medium':
        return 'w-96 max-h-[500px]';
      case 'large':
        return 'w-[450px] max-h-[600px]';
      default:
        return 'w-96 max-h-[500px]';
    }
  };

  const getThemeClasses = () => {
    return theme === 'dark'
      ? 'bg-gray-900 text-white border-gray-700'
      : 'bg-white text-gray-900 border-gray-200';
  };

  const renderTriggerButton = () => (
    <Button
      onClick={() => setIsOpen(!isOpen)}
      className={`rounded-full shadow-lg flex items-center gap-2 ${
        theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'
      }`}
      size={size === 'small' ? 'sm' : 'default'}
    >
      <HelpCircle className="h-5 w-5" />
      {isOpen ? <X className="h-4 w-4" : null}
      {!isOpen && size !== 'small' && <span>Help</span>}
    </Button>
  );

  const renderContent = () => (
    <Card className={`${getSizeClasses()} ${getThemeClasses()} shadow-xl overflow-hidden`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Knowledge Base
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className={theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Search Section */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className={`pl-10 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : ''}`}
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="w-full"
            size="sm"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 mt-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <Button
            variant={activeSection === 'search' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveSection('search')}
            className="flex-1"
          >
            Search
          </Button>
          <Button
            variant={activeSection === 'popular' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveSection('popular')}
            className="flex-1"
          >
            Popular
          </Button>
          <Button
            variant={activeSection === 'faqs' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveSection('faqs')}
            className="flex-1"
          >
            FAQs
          </Button>
          {showCategories && (
            <Button
              variant={activeSection === 'categories' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveSection('categories')}
              className="flex-1"
            >
              Topics
            </Button>
          )}
        </div>

        <Separator className="my-4" />

        {/* Content Sections */}
        <div className="overflow-y-auto max-h-80">
          {/* Search Results */}
          {activeSection === 'search' && searchResults && (
            <div className="space-y-3">
              {searchResults.articles.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Articles</h4>
                  <div className="space-y-2">
                    {searchResults.articles.map((article: any) => (
                      <div
                        key={article.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => {
                          // Open article in new window or modal
                          window.open(`/knowledge-base/article/${article.slug}`, '_blank');
                        }}
                      >
                        <h5 className="font-medium text-sm line-clamp-2 mb-1">
                          {article.title}
                        </h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                          {article.summary}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {article.reading_time_minutes} min
                          </Badge>
                          <ExternalLink className="h-3 w-3 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.faqs.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">FAQs</h4>
                  <div className="space-y-2">
                    {searchResults.faqs.map((faq: any) => (
                      <div
                        key={faq.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => {
                          // Open FAQ in new window or modal
                          window.open(`/knowledge-base/faq/${faq.id}`, '_blank');
                        }}
                      >
                        <h5 className="font-medium text-sm line-clamp-2 mb-1">
                          {faq.question}
                        </h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {faq.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.articles.length === 0 && searchResults.faqs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No results found</p>
                  <p className="text-sm">Try different keywords or browse topics</p>
                </div>
              )}
            </div>
          )}

          {/* Popular Articles */}
          {activeSection === 'popular' && (
            <div className="space-y-3">
              {popularArticles.map((article, index) => (
                <div
                  key={article.id}
                  className="flex gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => {
                    window.open(`/knowledge-base/article/${article.slug}`, '_blank');
                  }}
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-sm line-clamp-2 mb-1">
                      {article.title}
                    </h5>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {article.view_count}
                      </span>
                      <span>{article.reading_time_minutes} min</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick FAQs */}
          {activeSection === 'faqs' && (
            <div className="space-y-3">
              {quickFAQs.map((faq) => (
                <div
                  key={faq.id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => {
                    window.open(`/knowledge-base/faq/${faq.id}`, '_blank');
                  }}
                >
                  <h5 className="font-medium text-sm line-clamp-2 mb-1">
                    {faq.question}
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {faq.answer}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {faq.helpful_count} helpful
                    </Badge>
                    {faq.is_featured && (
                      <Badge variant="secondary" className="text-xs">
                        Featured
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Categories */}
          {activeSection === 'categories' && categories.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.open(`/knowledge-base/category/${category.slug}`, '_blank');
                  }}
                  className="h-auto p-3 flex flex-col items-center gap-2"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: category.color + '20' }}
                  >
                    <BookOpen className="h-4 w-4" style={{ color: category.color }} />
                  </div>
                  <span className="text-xs text-center">{category.name}</span>
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('/knowledge-base', '_blank')}
              className="text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Full Knowledge Base
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('/contact', '_blank')}
              className="text-xs"
            >
              Contact Support
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={getPositionClasses()}>
      {renderTriggerButton()}
      {isOpen && (
        <div className="mt-2 animate-in slide-in-from-bottom-5 duration-200">
          {renderContent()}
        </div>
      )}
    </div>
  );
};

export default KBWidget;