import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Share2,
  MessageCircle,
  Calendar,
  User,
  Tag,
  BookOpen,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import KnowledgeBaseService from '@/services/knowledge-base.service';
import SmartSearchService from '@/services/smart-search.service';
import type { KBArticle, FAQItem } from '@/types/knowledge-base';

interface ArticleViewerProps {
  slug?: string;
}

export const ArticleViewer: React.FC<ArticleViewerProps> = ({ slug: propSlug }) => {
  const { slug: paramSlug } = useParams();
  const navigate = useNavigate();
  const slug = propSlug || paramSlug;

  const [article, setArticle] = useState<KBArticle | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<KBArticle[]>([]);
  const [relatedFAQs, setRelatedFAQs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'helpful' | 'not-helpful' | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [tableOfContents, setTableOfContents] = useState<Array<{ id: string; title: string; level: number }>>([]);

  useEffect(() => {
    if (slug) {
      loadArticle(slug);
    }
  }, [slug]);

  const loadArticle = async (articleSlug: string) => {
    try {
      setLoading(true);
      setError(null);

      const articleData = await KnowledgeBaseService.getArticleBySlug(articleSlug);

      if (!articleData) {
        setError('Article not found');
        return;
      }

      setArticle(articleData);

      // Track article view
      await KnowledgeBaseService.trackArticleView(articleData.id);

      // Load related content
      const [relatedData, faqData] = await Promise.all([
        KnowledgeBaseService.getRelatedArticles(articleData.id),
        KnowledgeBaseService.getFAQs({ service_id: articleData.service_id, limit: 3 }),
      ]);

      setRelatedArticles(relatedData);
      setRelatedFAQs(faqData);

      // Generate table of contents
      generateTableOfContents(articleData.content);

      // Check if bookmarked (if user is authenticated)
      // checkBookmarkStatus(articleData.id);

    } catch (error) {
      console.error('Error loading article:', error);
      setError('Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const generateTableOfContents = (content: string) => {
    // Extract headings from content
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings: Array<{ id: string; title: string; level: number }> = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const title = match[2];
      const id = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

      headings.push({ id, title, level });
    }

    setTableOfContents(headings);
  };

  const handleFeedback = async (type: 'helpful' | 'not-helpful') => {
    if (!article || feedback) return;

    try {
      await KnowledgeBaseService.submitArticleFeedback(article.id, {
        feedback_type: type === 'helpful' ? 'helpful' : 'not_helpful',
        user_id: null, // Would get from auth context
        session_id: 'anonymous',
      });

      setFeedback(type);
      if (type === 'not-helpful') {
        setShowFeedbackForm(true);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!article || !feedbackComment.trim()) return;

    try {
      await KnowledgeBaseService.submitArticleFeedback(article.id, {
        feedback_type: 'suggestion',
        comment: feedbackComment,
        rating: feedback === 'helpful' ? 5 : 2,
        user_id: null,
        session_id: 'anonymous',
      });

      setFeedbackComment('');
      setShowFeedbackForm(false);
    } catch (error) {
      console.error('Error submitting feedback comment:', error);
    }
  };

  const handleBookmark = async () => {
    if (!article) return;

    try {
      await KnowledgeBaseService.toggleBookmark(
        'user-id-placeholder', // Would get from auth context
        article.id
      );
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share && article) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary || `Check out this article: ${article.title}`,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to copying to clipboard
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    // Show toast notification aria-live="polite" aria-atomic="true"
  };

  const renderContent = (content: string) => {
    // Simple markdown-like rendering
    return content
      .split('\n')
      .map((line, index) => {
        // Headings
        if (line.startsWith('####')) {
          const text = line.replace('####', '').trim();
          const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
          return (
            <h4 key={index} id={id} className="text-lg font-semibold mt-6 mb-3 text-gray-800">
              {text}
            </h4>
          );
        }
        if (line.startsWith('###')) {
          const text = line.replace('###', '').trim();
          const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
          return (
            <h3 key={index} id={id} className="text-xl font-semibold mt-8 mb-4 text-gray-800">
              {text}
            </h3>
          );
        }
        if (line.startsWith('##')) {
          const text = line.replace('##', '').trim();
          const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
          return (
            <h2 key={index} id={id} className="text-2xl font-bold mt-10 mb-5 text-gray-800">
              {text}
            </h2>
          );
        }
        if (line.startsWith('#')) {
          const text = line.replace('#', '').trim();
          const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
          return (
            <h1 key={index} id={id} className="text-3xl font-bold mt-12 mb-6 text-gray-900">
              {text}
            </h1>
          );
        }

        // Lists
        if (line.startsWith('- ')) {
          return (
            <li key={index} className="ml-6 mb-2 text-gray-700">
              {line.replace('- ', '')}
            </li>
          );
        }
        if (line.match(/^\d+\. /)) {
          return (
            <li key={index} className="ml-6 mb-2 list-decimal text-gray-700">
              {line.replace(/^\d+\. /, '')}
            </li>
          );
        }

        // Empty lines
        if (line.trim() === '') {
          return <br key={index} />;
        }

        // Regular paragraphs
        return (
          <p key={index} className="mb-4 text-gray-700 leading-relaxed">
            {line}
          </p>
        );
      });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>{error || 'Article not found'}</AlertDescription>
          </Alert>
          <Button
            onClick={() => navigate('/knowledge-base')}
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Knowledge Base
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
              <Button
                variant="ghost"
                onClick={() => navigate('/knowledge-base')}
                className="p-0 h-auto font-normal"
              >
                Knowledge Base
              </Button>
              <span>/</span>
              {article.category && (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate(`/knowledge-base/category/${article.category.slug}`)}
                    className="p-0 h-auto font-normal"
                  >
                    {article.category.name}
                  </Button>
                  <span>/</span>
                </>
              )}
              <span className="text-gray-900 font-medium">{article.title}</span>
            </div>

            {/* Article Header */}
            <article>
              <header role="banner" className="mb-8">
                <div className="flex items-center gap-3 text-sm text-gray-600 mb-4">
                  {article.category && (
                    <Badge variant="secondary">{article.category.name}</Badge>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {article.reading_time_minutes} min read
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {article.view_count} views
                  </span>
                </div>

                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {article.title}
                </h1>

                {article.summary && (
                  <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                    {article.summary}
                  </p>
                )}

                {/* Featured Image */}
                {article.featured_image_url && (
                  <div className="mb-8">
                    <img
                      src={article.featured_image_url}
                      alt={article.title}
                      className="w-full h-96 object-cover rounded-lg shadow-lg"
                    />
                  </div>
                )}

                {/* Article Metadata */}
                <div className="flex items-center justify-between mb-8 pb-6 border-b">
                  <div className="flex items-center gap-4">
                    {article.author && (
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={article.author.avatar_url} />
                          <AvatarFallback>
                            {article.author.full_name?.[0] || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">
                            {article.author.full_name}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(article.published_at || article.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBookmark}
                      className={isBookmarked ? 'bg-blue-50 border-blue-200' : ''}
                    >
                      <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current text-blue-600' : ''}`} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShare}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </header>

              {/* Table of Contents */}
              {tableOfContents.length > 0 && (
                <div className="mb-8 p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Table of Contents
                  </h3>
                  <nav aria-label="Main navigation" className="space-y-2">
                    {tableOfContents.map((heading) => (
                      <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        className={`block text-gray-600 hover:text-blue-600 transition-colors ${
                          heading.level === 1 ? 'font-medium' : ''
                        } ${heading.level > 2 ? 'ml-' + (heading.level - 2) * 4 : ''}`}
                      >
                        {heading.title}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              {/* Article Content */}
              <div className="prose prose-lg max-w-none mb-12">
                {renderContent(article.content)}
              </div>

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Tags:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => navigate(`/knowledge-base/search?q=${encodeURIComponent(tag)}`)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback Section */}
              <div className="p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Was this article helpful?</h3>

                <div className="flex items-center gap-4 mb-4">
                  <Button
                    variant={feedback === 'helpful' ? 'default' : 'outline'}
                    onClick={() => handleFeedback('helpful')}
                    className="flex items-center gap-2"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Yes
                  </Button>
                  <Button
                    variant={feedback === 'not-helpful' ? 'default' : 'outline'}
                    onClick={() => handleFeedback('not-helpful')}
                    className="flex items-center gap-2"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    No
                  </Button>
                </div>

                {feedback && (
                  <p className="text-sm text-gray-600 mb-4">
                    Thank you for your feedback!
                  </p>
                )}

                {showFeedbackForm && (
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Please tell us how we can improve this article..."
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleFeedbackSubmit} disabled={!feedbackComment.trim()}>
                        Submit Feedback
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowFeedbackForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="my-8" />

              {/* Article Footer */}
              <footer role="contentinfo" className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Last updated: {new Date(article.updated_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {article.helpful_count} found this helpful
                  </span>
                  {article.version > 1 && (
                    <span>Version {article.version}</span>
                  )}
                </div>
              </footer>
            </article>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Related Articles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {relatedArticles.map((relatedArticle) => (
                    <div key={relatedArticle.id} className="space-y-2">
                      <h4 className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer transition-colors">
                        {relatedArticle.title}
                      </h4>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {relatedArticle.summary}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {relatedArticle.reading_time_minutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {relatedArticle.view_count}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Related FAQs */}
            {relatedFAQs.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Related FAQs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {relatedFAQs.map((faq) => (
                    <div key={faq.id} className="space-y-2">
                      <h4 className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer transition-colors flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        {faq.question}
                      </h4>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Service Information */}
            {article.service && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Related Service</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-medium">{article.service.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {article.service.description}
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      View Service Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleViewer;