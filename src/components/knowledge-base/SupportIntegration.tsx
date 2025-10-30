import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Search,
  BookOpen,
  MessageSquare,
  Send,
  X,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import SmartSearchService from '@/services/smart-search.service';
import KnowledgeBaseService from '@/services/knowledge-base.service';
import type { KBArticle, FAQItem } from '@/types/knowledge-base';

interface SupportIntegrationProps {
  context?: 'booking' | 'service' | 'general';
  serviceId?: string;
  serviceType?: 'beauty' | 'fitness' | 'lifestyle';
  onContactSupport?: (message: string, context: any) => void;
  showContactForm?: boolean;
  compact?: boolean;
}

export const SupportIntegration: React.FC<SupportIntegrationProps> = ({
  context = 'general',
  serviceId,
  serviceType,
  onContactSupport,
  showContactForm = true,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQItem | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [showContactForm, setShowContactFormLocal] = useState(false);
  const [resolvedWithKB, setResolvedWithKB] = useState<boolean | null>(null);

  // Context-aware suggestions
  useEffect(() => {
    if (isOpen && !searchQuery) {
      loadContextualSuggestions();
    }
  }, [isOpen, context, serviceId, serviceType]);

  const loadContextualSuggestions = async () => {
    try {
      let suggestedArticles: KBArticle[] = [];
      let suggestedFAQs: FAQItem[] = [];

      // Load context-specific content
      if (context === 'booking') {
        suggestedFAQs = await KnowledgeBaseService.getFAQs({
          category_id: 'booking-category-id', // Would need actual category ID
          limit: 3,
        });
      } else if (context === 'service' && serviceId) {
        suggestedArticles = await KnowledgeBaseService.getArticles({
          service_id: serviceId,
          limit: 3,
        });
        suggestedFAQs = await KnowledgeBaseService.getFAQs({
          service_id: serviceId,
          limit: 3,
        });
      } else if (serviceType) {
        suggestedFAQs = await KnowledgeBaseService.getFAQs({
          service_type: serviceType,
          featured: true,
          limit: 3,
        });
      }

      // General suggestions if no specific context
      if (suggestedArticles.length === 0 && suggestedFAQs.length === 0) {
        suggestedFAQs = await KnowledgeBaseService.getFAQs({
          featured: true,
          limit: 5,
        });
      }

      setSuggestions({
        articles: suggestedArticles,
        faqs: suggestedFAQs,
      });
    } catch (error) {
      console.error('Error loading contextual suggestions:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await SmartSearchService.smartSearch(searchQuery, {}, {
        maxResults: 5,
        includeSuggestions: true,
      });

      setSuggestions(results);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleArticleSelect = async (article: KBArticle) => {
    setSelectedArticle(article);
    setSelectedFAQ(null);
    await KnowledgeBaseService.trackArticleView(article.id);
  };

  const handleFAQSelect = (faq: FAQItem) => {
    setSelectedFAQ(faq);
    setSelectedArticle(null);
  };

  const handleContactSupport = () => {
    if (!contactMessage.trim() || !onContactSupport) return;

    const supportContext = {
      context,
      serviceId,
      serviceType,
      searchQuery,
      viewedArticle: selectedArticle?.id,
      viewedFAQ: selectedFAQ?.id,
      resolvedWithKB,
    };

    onContactSupport(contactMessage, supportContext);

    // Log the support ticket creation
    logSupportTicketCreation(supportContext);

    // Reset form
    setContactMessage('');
    setShowContactFormLocal(false);
    setResolvedWithKB(null);
  };

  const logSupportTicketCreation = async (context: any) => {
    try {
      await supabase
        .from('support_ticket_kb_suggestions')
        .insert({
          ticket_id: `ticket-${Date.now()}`, // Would be actual ticket ID
          suggested_article_id: context.viewedArticle,
          suggested_faq_id: context.viewedFAQ,
          suggestion_type: 'manual',
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error logging support ticket:', error);
    }
  };

  const handleHelpfulVote = async (helpful: boolean) => {
    setResolvedWithKB(helpful);

    if (selectedArticle) {
      await KnowledgeBaseService.submitArticleFeedback(selectedArticle.id, {
        feedback_type: helpful ? 'helpful' : 'not_helpful',
        user_id: null,
        session_id: 'support-widget',
      });
    } else if (selectedFAQ) {
      await KnowledgeBaseService.submitFAQFeedback(selectedFAQ.id, {
        feedback_type: helpful ? 'helpful' : 'not_helpful',
        user_id: null,
        session_id: 'support-widget',
      });
    }
  };

  const renderCompactView = () => (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={compact ? "ghost" : "default"}
          size={compact ? "sm" : "default"}
          className="flex items-center gap-2"
        >
          <HelpCircle className="h-4 w-4" />
          {compact ? 'Help' : 'Need Help?'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-4" align="end">
        <SupportContent />
      </PopoverContent>
    </Popover>
  );

  const renderFullView = () => (
    <div className="border rounded-lg p-6 bg-white">
      <SupportContent />
    </div>
  );

  const SupportContent = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold">How can we help?</h3>
        </div>
        {compact && (
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
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

      {/* Suggestions */}
      {suggestions && (suggestions.articles?.length > 0 || suggestions.faqs?.length > 0) && (
        <div className="space-y-3">
          {/* Articles */}
          {suggestions.articles?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Articles</h4>
              <div className="space-y-2">
                {suggestions.articles.slice(0, 3).map((article: KBArticle) => (
                  <Card
                    key={article.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleArticleSelect(article)}
                  >
                    <CardContent className="p-3">
                      <h5 className="font-medium text-sm line-clamp-2 mb-1">
                        {article.title}
                      </h5>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {article.summary}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {article.reading_time_minutes} min
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {article.view_count} views
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* FAQs */}
          {suggestions.faqs?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Frequently Asked Questions</h4>
              <div className="space-y-2">
                {suggestions.faqs.slice(0, 3).map((faq: FAQItem) => (
                  <Card
                    key={faq.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleFAQSelect(faq)}
                  >
                    <CardContent className="p-3">
                      <h5 className="font-medium text-sm line-clamp-2 mb-1 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 text-blue-600" />
                        {faq.question}
                      </h5>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {faq.answer}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">
                          {faq.helpful_count} helpful
                        </span>
                        {faq.is_featured && (
                          <Badge variant="secondary" className="text-xs">
                            Featured
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Content */}
      {(selectedArticle || selectedFAQ) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <h4 className="font-medium text-blue-900">
                  {selectedArticle ? selectedArticle.title : selectedFAQ?.question}
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedArticle(null);
                    setSelectedFAQ(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-sm text-gray-700">
                {selectedArticle ? selectedArticle.summary : selectedFAQ?.answer}
              </p>

              {/* Full content view link */}
              <Button variant="outline" size="sm" className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Full Article
              </Button>

              {/* Was this helpful? */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Was this helpful?</p>
                <div className="flex gap-2">
                  <Button
                    variant={resolvedWithKB === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleHelpfulVote(true)}
                    className="flex items-center gap-1"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Yes
                  </Button>
                  <Button
                    variant={resolvedWithKB === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleHelpfulVote(false)}
                    className="flex items-center gap-1"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    No
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Still Need Help */}
      {showContactForm && onContactSupport && (
        <div className="space-y-3">
          <Collapsible open={showContactFormLocal} onOpenChange={setShowContactFormLocal}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Still need help? Contact support
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3">
              <Textarea
                placeholder="Describe your issue and we'll help you resolve it..."
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                rows={4}
              />
              <Button
                onClick={handleContactSupport}
                disabled={!contactMessage.trim()}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Send to Support
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* Quick Links */}
      <div className="border-t pt-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" className="text-xs">
            <BookOpen className="h-3 w-3 mr-1" />
            Browse Knowledge Base
          </Button>
          <Button variant="ghost" size="sm" className="text-xs">
            <HelpCircle className="h-3 w-3 mr-1" />
            View All FAQs
          </Button>
        </div>
      </div>
    </div>
  );

  return compact ? renderCompactView() : renderFullView();
};

export default SupportIntegration;