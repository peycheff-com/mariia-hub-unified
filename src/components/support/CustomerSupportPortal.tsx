import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SupportService } from '@/services/support.service';
import type { SupportTicketWithDetails, KnowledgeBaseArticleWithCategory } from '@/types/supabase';
import {
  MessageCircle,
  Search,
  BookOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  Send,
  ThumbsUp,
  ThumbsDown,
  Star,
  Calendar,
  User,
  HelpCircle,
  Video,
  FileText
} from 'lucide-react';

const CustomerSupportPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tickets');
  const [tickets, setTickets] = useState<SupportTicketWithDetails[]>([]);
  const [kbCategories, setKbCategories] = useState<any[]>([]);
  const [kbArticles, setKbArticles] = useState<KnowledgeBaseArticleWithCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeBaseArticleWithCategory | null>(null);

  // New ticket form state
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'general',
    priority: 'medium',
    booking_id: '',
    service_id: ''
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KnowledgeBaseArticleWithCategory[]>([]);

  useEffect(() => {
    loadCustomerData();
  }, []);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      const [ticketsData, categoriesData, articlesData] = await Promise.all([
        SupportService.getTickets({ user_id: 'current-user-id' }), // Replace with actual user ID
        SupportService.getKnowledgeBaseCategories(),
        SupportService.getKnowledgeBaseArticles({ status: 'published', featured: true, limit: 6 })
      ]);

      setTickets(ticketsData);
      setKbCategories(categoriesData);
      setKbArticles(articlesData);
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const ticketData = {
        user_id: 'current-user-id', // Replace with actual user ID
        client_name: 'Customer Name', // Replace with actual user data
        client_email: 'customer@example.com', // Replace with actual user data
        subject: newTicket.subject,
        description: newTicket.description,
        category: newTicket.category as any,
        priority: newTicket.priority as any,
        channel: 'web',
        booking_id: newTicket.booking_id || null,
        service_id: newTicket.service_id || null
      };

      const createdTicket = await SupportService.createTicket(ticketData);
      setTickets([createdTicket, ...tickets]);

      // Reset form
      setNewTicket({
        subject: '',
        description: '',
        category: 'general',
        priority: 'medium',
        booking_id: '',
        service_id: ''
      });

      // Show success message
      alert('Ticket created successfully! We will respond within 24 hours.');
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Error creating ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const results = await SupportService.searchKnowledgeBase(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching knowledge base:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'waiting_on_customer': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleArticleHelpful = async (articleId: string, helpful: boolean) => {
    try {
      await SupportService.recordArticleHelpful(articleId, helpful);
      // Update the article in local state
      if (selectedArticle?.id === articleId) {
        setSelectedArticle({
          ...selectedArticle,
          helpful_count: selectedArticle.helpful_count + (helpful ? 1 : 0),
          not_helpful_count: selectedArticle.not_helpful_count + (helpful ? 0 : 1)
        });
      }
    } catch (error) {
      console.error('Error recording helpful feedback:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 to-orange-50/20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-amber-100">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-amber-900">Customer Support</h1>
              <p className="text-amber-600">We're here to help with your beauty and fitness needs</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                <Phone className="h-4 w-4 mr-2" />
                Call Us
              </Button>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                <Mail className="h-4 w-4 mr-2" />
                Email Support
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-amber-100 border-amber-200">
            <TabsTrigger value="tickets" className="data-[state=active]:bg-amber-200">
              <MessageCircle className="h-4 w-4 mr-2" />
              My Tickets
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="data-[state=active]:bg-amber-200">
              <BookOpen className="h-4 w-4 mr-2" />
              Knowledge Base
            </TabsTrigger>
            <TabsTrigger value="new-ticket" className="data-[state=active]:bg-amber-200">
              <HelpCircle className="h-4 w-4 mr-2" />
              Create Ticket
            </TabsTrigger>
          </TabsList>

          {/* My Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-amber-900 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  My Support Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tickets.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-amber-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-amber-900 mb-2">No tickets yet</h3>
                    <p className="text-amber-600 mb-4">Create your first support ticket to get started</p>
                    <Button onClick={() => setActiveTab('new-ticket')} className="bg-amber-600 hover:bg-amber-700">
                      Create First Ticket
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="border border-amber-200 rounded-lg p-4 hover:bg-amber-50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-amber-900">{ticket.subject}</h3>
                              <Badge className={getStatusColor(ticket.status)}>
                                {ticket.status.replace('_', ' ')}
                              </Badge>
                              <Badge className={getPriorityColor(ticket.priority)}>
                                {ticket.priority}
                              </Badge>
                            </div>
                            <p className="text-amber-700 line-clamp-2">{ticket.description}</p>
                          </div>
                          <div className="text-right text-sm text-amber-600 ml-4">
                            <div>#{ticket.ticket_number}</div>
                            <div>{new Date(ticket.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4 text-amber-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{ticket.category}</span>
                            </div>
                            {ticket.assigned_agent && (
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span>Assigned to agent</span>
                              </div>
                            )}
                          </div>
                          {ticket.satisfaction_survey && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span>{ticket.satisfaction_survey.overall_rating}/5</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Knowledge Base Tab */}
          <TabsContent value="knowledge" className="space-y-6">
            {/* Search Bar */}
            <Card className="border-amber-200">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-600" />
                    <Input
                      placeholder="Search for help articles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10 border-amber-200 focus:border-amber-400"
                    />
                  </div>
                  <Button onClick={handleSearch} className="bg-amber-600 hover:bg-amber-700">
                    Search
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <Card className="border-amber-200">
                <CardHeader>
                  <CardTitle className="text-amber-900">Search Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.map((article) => (
                      <div
                        key={article.id}
                        onClick={() => setSelectedArticle(article)}
                        className="border border-amber-200 rounded-lg p-4 hover:bg-amber-50 cursor-pointer transition-colors"
                      >
                        <h3 className="font-semibold text-amber-900 mb-2">{article.title}</h3>
                        <p className="text-amber-700 text-sm line-clamp-2 mb-2">
                          {article.summary_en || article.summary_pl}
                        </p>
                        <div className="flex items-center justify-between text-xs text-amber-600">
                          <span>{article.category.name}</span>
                          <span>{article.read_time || '5'} min read</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Categories and Featured Articles */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card className="border-amber-200">
                  <CardHeader>
                    <CardTitle className="text-amber-900">Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {kbCategories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => {
                            // Filter articles by category
                          }}
                          className="w-full text-left p-3 rounded-lg hover:bg-amber-50 transition-colors flex items-center gap-3"
                        >
                          <span className="text-2xl">{category.icon}</span>
                          <div>
                            <div className="font-medium text-amber-900">{category.name}</div>
                            <div className="text-sm text-amber-600">{category.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card className="border-amber-200">
                  <CardHeader>
                    <CardTitle className="text-amber-900">Featured Articles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {kbArticles.map((article) => (
                        <div
                          key={article.id}
                          onClick={() => setSelectedArticle(article)}
                          className="border border-amber-200 rounded-lg p-4 hover:bg-amber-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            {article.featured_image_url ? (
                              <img
                                src={article.featured_image_url}
                                alt={article.title}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-amber-100 rounded-lg flex items-center justify-center">
                                <BookOpen className="h-8 w-8 text-amber-600" />
                              </div>
                            )}
                            <div className="flex-1">
                              <h3 className="font-semibold text-amber-900 mb-1">{article.title}</h3>
                              <p className="text-amber-700 text-sm line-clamp-2 mb-2">
                                {article.summary_en || article.summary_pl}
                              </p>
                              <div className="flex items-center justify-between text-xs text-amber-600">
                                <span>{article.category.name}</span>
                                <span>{article.view_count} views</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Article Detail Modal */}
            {selectedArticle && (
              <Card className="border-amber-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-amber-900">{selectedArticle.title}</CardTitle>
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedArticle(null)}
                      className="text-amber-600 hover:text-amber-800"
                    >
                      ×
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-amber-600">
                    <span>{selectedArticle.category.name}</span>
                    <span>{selectedArticle.estimated_read_time || 5} min read</span>
                    <span>{selectedArticle.view_count} views</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-amber-900">
                      {selectedArticle.content_en || selectedArticle.content_pl}
                    </p>
                  </div>
                  <div className="mt-6 pt-6 border-t border-amber-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-amber-600">
                        Was this article helpful?
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleArticleHelpful(selectedArticle.id, true)}
                          className="border-amber-300 text-amber-700 hover:bg-amber-50"
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Helpful ({selectedArticle.helpful_count})
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleArticleHelpful(selectedArticle.id, false)}
                          className="border-amber-300 text-amber-700 hover:bg-amber-50"
                        >
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          Not Helpful ({selectedArticle.not_helpful_count})
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Create Ticket Tab */}
          <TabsContent value="new-ticket" className="space-y-6">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-amber-900">Create Support Ticket</CardTitle>
                <p className="text-amber-600">
                  Fill out the form below and we'll get back to you as soon as possible
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTicket} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-amber-900 mb-2" htmlFor="subject">
                        Subject *
                      </label>
                      <Input
                        value={newTicket.subject}
                        onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                        placeholder="Brief description of your issue"
                        required
                        className="border-amber-200 focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-900 mb-2" htmlFor="category">
                        Category *
                      </label>
                      <Select
                        value={newTicket.category}
                        onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}
                      >
                        <SelectTrigger className="border-amber-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="booking_issue">Booking Issue</SelectItem>
                          <SelectItem value="payment_problem">Payment Problem</SelectItem>
                          <SelectItem value="service_inquiry">Service Inquiry</SelectItem>
                          <SelectItem value="technical_support">Technical Support</SelectItem>
                          <SelectItem value="complaint">Complaint</SelectItem>
                          <SelectItem value="feature_request">Feature Request</SelectItem>
                          <SelectItem value="billing">Billing</SelectItem>
                          <SelectItem value="account_management">Account Management</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-amber-900 mb-2" htmlFor="priority">
                        Priority
                      </label>
                      <Select
                        value={newTicket.priority}
                        onValueChange={(value) => setNewTicket({ ...newTicket, priority: value })}
                      >
                        <SelectTrigger className="border-amber-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="urgent">Urgent - Immediate attention required</SelectItem>
                          <SelectItem value="high">High - Affects service usage</SelectItem>
                          <SelectItem value="medium">Medium - General inquiry</SelectItem>
                          <SelectItem value="low">Low - Information request</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-900 mb-2" htmlFor="related-booking-optional">
                        Related Booking (Optional)
                      </label>
                      <Input
                        value={newTicket.booking_id}
                        onChange={(e) => setNewTicket({ ...newTicket, booking_id: e.target.value })}
                        placeholder="Booking ID"
                        className="border-amber-200 focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-amber-900 mb-2" htmlFor="description">
                      Description *
                    </label>
                    <Textarea
                      value={newTicket.description}
                      onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                      placeholder="Please provide as much detail as possible about your issue"
                      rows={6}
                      required
                      className="border-amber-200 focus:border-amber-400"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Create Ticket
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab('tickets')}
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Quick Help Section */}
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-900">Quick Help</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border border-amber-200 rounded-lg">
                    <Phone className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                    <h3 className="font-medium text-amber-900 mb-1">Phone Support</h3>
                    <p className="text-sm text-amber-600 mb-2">+48 123 456 789</p>
                    <p className="text-xs text-amber-500">Mon-Fri, 9AM-6PM</p>
                  </div>
                  <div className="text-center p-4 border border-amber-200 rounded-lg">
                    <Mail className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                    <h3 className="font-medium text-amber-900 mb-1">Email Support</h3>
                    <p className="text-sm text-amber-600 mb-2">support@mariaborysevych.com</p>
                    <p className="text-xs text-amber-500">24-48 hour response</p>
                  </div>
                  <div className="text-center p-4 border border-amber-200 rounded-lg">
                    <Video className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                    <h3 className="font-medium text-amber-900 mb-1">Video Consultation</h3>
                    <p className="text-sm text-amber-600 mb-2">Schedule a call</p>
                    <p className="text-xs text-amber-500">Premium service</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CustomerSupportPortal;