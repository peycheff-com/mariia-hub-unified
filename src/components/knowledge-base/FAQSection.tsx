import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Search,
  Filter,
  MessageCircle,
  TrendingUp,
  Star,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import FAQManagementService from '@/services/faq-management.service';
import SmartSearchService from '@/services/smart-search.service';
import type { FAQCategory, FAQItem } from '@/types/knowledge-base';

interface FAQSectionProps {
  serviceType?: 'beauty' | 'fitness' | 'lifestyle';
  categoryId?: string;
  limit?: number;
  showSearch?: boolean;
  showCategories?: boolean;
  interactive?: boolean;
}

export const FAQSection: React.FC<FAQSectionProps> = ({
  serviceType,
  categoryId,
  limit,
  showSearch = true,
  showCategories = true,
  interactive = true,
}) => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryId || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQs, setExpandedFAQs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<FAQItem[]>([]);
  const [feedback, setFeedback] = useState<Record<string, 'helpful' | 'not-helpful'>>({});
  const [filteredCount, setFilteredCount] = useState(0);

  useEffect(() => {
    loadData();
  }, [serviceType, categoryId, selectedCategory, searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [categoriesData, faqsData] = await Promise.all([
        showCategories ? FAQManagementService.getFAQCategories(serviceType) : Promise.resolve([]),
        loadFAQs(),
      ]);

      setCategories(categoriesData);
      setFilteredCount(faqsData.length);
    } catch (error) {
      console.error('Error loading FAQ data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFAQs = async (): Promise<FAQItem[]> => {
    const filters: any = {
      service_type: serviceType,
      limit,
    };

    if (selectedCategory !== 'all') {
      filters.category_id = selectedCategory;
    }

    if (searchQuery) {
      filters.search = searchQuery;
    }

    const result = await FAQManagementService.getFAQs(filters);
    setFaqs(result.faqs);
    return result.faqs;
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.length >= 3) {
      try {
        const smartSuggestions = await SmartSearchService.getSmartFAQSuggestions(query, 5);
        setSuggestions(smartSuggestions);
      } catch (error) {
        console.error('Error getting FAQ suggestions:', error);
      }
    } else {
      setSuggestions([]);
    }
  };

  const toggleFAQ = (faqId: string) => {
    const newExpanded = new Set(expandedFAQs);
    if (newExpanded.has(faqId)) {
      newExpanded.delete(faqId);
    } else {
      newExpanded.add(faqId);
    }
    setExpandedFAQs(newExpanded);
  };

  const handleFeedback = async (faqId: string, type: 'helpful' | 'not-helpful') => {
    if (!interactive) return;

    try {
      await FAQManagementService.submitFAQFeedback(faqId, {
        feedback_type: type,
        user_id: null, // Would get from auth context
        session_id: 'anonymous',
      });

      setFeedback(prev => ({ ...prev, [faqId]: type }));

      // Reload FAQs to update counters
      await loadFAQs();
    } catch (error) {
      console.error('Error submitting FAQ feedback:', error);
    }
  };

  const handleSuggestionClick = (suggestion: FAQItem) => {
    setSearchQuery(suggestion.question);
    setSuggestions([]);
    // Expand the suggested FAQ if it's in the current results
    const faqIndex = faqs.findIndex(faq => faq.id === suggestion.id);
    if (faqIndex !== -1) {
      setExpandedFAQs(new Set([suggestion.id]));
    }
  };

  const getCategoryName = (categoryId: string): string => {
    if (categoryId === 'all') return 'All Categories';
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {showSearch && <Skeleton className="h-12 w-full" />}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-lg text-gray-600">
          Find quick answers to common questions about our services
        </p>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="relative max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-12 pr-4 py-3 text-lg"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Search Suggestions */}
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="p-2 text-sm text-gray-600 border-b border-gray-100">
                Did you mean:
              </div>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{suggestion.question}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category Filter */}
      {showCategories && categories.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <span className="text-gray-700">Filter by category:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => setSelectedCategory('all')}
            >
              All Categories
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Results Count */}
      {(searchQuery || selectedCategory !== 'all') && (
        <div className="text-center text-gray-600">
          Showing {filteredCount} FAQ{filteredCount !== 1 ? 's' : ''} for "
          {getCategoryName(selectedCategory)}
          {searchQuery && ` matching "${searchQuery}"`}"
        </div>
      )}

      {/* No Results */}
      {faqs.length === 0 && !loading && (
        <Alert>
          <HelpCircle className="h-4 w-4" />
          <AlertDescription>
            No FAQs found matching your criteria. Try adjusting your search or filters.
          </AlertDescription>
        </Alert>
      )}

      {/* FAQ Items */}
      <div className="space-y-4">
        {faqs.map((faq) => {
          const isExpanded = expandedFAQs.has(faq.id);
          const hasFeedback = feedback[faq.id];

          return (
            <Card key={faq.id} className="overflow-hidden">
              <Collapsible open={isExpanded} onOpenChange={() => toggleFAQ(faq.id)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                          <HelpCircle className="h-4 w-4" />
                        </div>
                        <div className="flex-1 text-left">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {faq.question}
                            {faq.is_featured && (
                              <Badge variant="secondary" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </CardTitle>
                          {faq.category && (
                            <CardDescription className="mt-1">
                              {faq.category.name}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {faq.view_count} views
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-600" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="pl-11">
                      <div className="prose prose-gray max-w-none">
                        <p className="text-gray-700 leading-relaxed mb-6">
                          {faq.answer}
                        </p>

                        {/* Polish version if available */}
                        {faq.answer_pl && (
                          <div className="border-t pt-4">
                            <h4 className="font-medium text-gray-900 mb-2">
                              Wersja polska:
                            </h4>
                            <p className="text-gray-700 leading-relaxed mb-6">
                              {faq.answer_pl}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Feedback Section */}
                      {interactive && (
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">
                              Was this helpful?
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                variant={hasFeedback === 'helpful' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleFeedback(faq.id, 'helpful')}
                                className="flex items-center gap-1"
                              >
                                <ThumbsUp className="h-4 w-4" />
                                Yes
                                {faq.helpful_count > 0 && (
                                  <span className="text-xs">({faq.helpful_count})</span>
                                )}
                              </Button>
                              <Button
                                variant={hasFeedback === 'not-helpful' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleFeedback(faq.id, 'not-helpful')}
                                className="flex items-center gap-1"
                              >
                                <ThumbsDown className="h-4 w-4" />
                                No
                                {faq.not_helpful_count > 0 && (
                                  <span className="text-xs">({faq.not_helpful_count})</span>
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Related service link */}
                          {faq.service_id && (
                            <Button variant="ghost" size="sm" className="text-blue-600">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Related Service
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Additional info */}
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-4">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {faq.helpful_count + faq.not_helpful_count} people found this helpful
                        </span>
                        {faq.created_by_profile && (
                          <span>
                            Added by {faq.created_by_profile.full_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Load More Button */}
      {limit && faqs.length === limit && (
        <div className="text-center">
          <Button variant="outline" size="lg">
            Load More FAQs
          </Button>
        </div>
      )}

      {/* Still have questions section */}
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Still have questions?</h3>
        <p className="text-gray-600 mb-6">
          Can't find the answer you're looking for? We're here to help.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg">
            <MessageCircle className="h-5 w-5 mr-2" />
            Contact Support
          </Button>
          <Button variant="outline" size="lg">
            <Search className="h-5 w-5 mr-2" />
            Browse Knowledge Base
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FAQSection;