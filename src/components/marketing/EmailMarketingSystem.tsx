import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Mail,
  Send,
  Users,
  Eye,
  MousePointer,
  TrendingUp,
  Calendar,
  Settings,
  Plus,
  Edit,
  Trash2,
  Copy,
  BarChart3,
  Target,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Image,
  Layout,
  Palette,
  Code,
  Preview
} from 'lucide-react';
import { marketingService } from '@/services/marketing.service';
import {
  EmailCampaign,
  EmailTemplate,
  EmailList,
  EmailSubscriber,
  EmailCampaignRequest,
  EmailCampaignMetrics
} from '@/types/marketing';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface EmailMarketingSystemProps {
  className?: string;
}

export const EmailMarketingSystem: React.FC<EmailMarketingSystemProps> = ({ className }) => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [lists, setLists] = useState<EmailList[]>([]);
  const [subscribers, setSubscribers] = useState<EmailSubscriber[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [campaignMetrics, setCampaignMetrics] = useState<EmailCampaignMetrics | null>(null);
  const [isCreateCampaignDialogOpen, setIsCreateCampaignDialogOpen] = useState(false);
  const [isCreateTemplateDialogOpen, setIsCreateTemplateDialogOpen] = useState(false);
  const [isCreateListDialogOpen, setIsCreateListDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('campaigns');

  // Form states
  const [campaignForm, setCampaignForm] = useState<EmailCampaignRequest>({
    name: '',
    subjectLine: '',
    fromName: 'Mariia Hub',
    fromEmail: 'hello@mariaborysevych.com',
    contentHtml: '',
    contentText: '',
    listIds: [],
    personalizationVars: {},
    segmentationRules: {}
  });

  const [templateForm, setTemplateForm] = useState<Partial<EmailTemplate>>({
    name: '',
    description: '',
    category: 'custom',
    templateType: 'custom',
    htmlContent: '',
    textContent: '',
    cssStyles: '',
    variables: {},
    sections: {}
  });

  const [listForm, setListForm] = useState<Partial<EmailList>>({
    name: '',
    description: '',
    listType: 'manual',
    segmentationRules: {},
    isActive: true
  });

  const [subscriberForm, setSubscriberForm] = useState<Partial<EmailSubscriber>>({
    email: '',
    firstName: '',
    lastName: '',
    source: 'manual',
    gdprConsent: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [campaignsData, templatesData, listsData] = await Promise.all([
        marketingService.getEmailCampaigns(),
        loadEmailTemplates(),
        loadEmailLists()
      ]);

      setCampaigns(campaignsData);
      setTemplates(templatesData);
      setLists(listsData);
    } catch (error) {
      console.error('Error loading email marketing data:', error);
      toast.error('Failed to load email marketing data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmailTemplates = async (): Promise<EmailTemplate[]> => {
    // Mock data - in real implementation this would come from the service
    return [
      {
        id: 'template_1',
        name: 'Welcome Series',
        description: 'Automated welcome email for new subscribers',
        category: 'automation',
        templateType: 'automation',
        htmlContent: '<h1>Welcome to Mariia Hub!</h1><p>Thank you for joining our community...</p>',
        textContent: 'Welcome to Mariia Hub! Thank you for joining...',
        usage_count: 45,
        is_active: true,
        created_by: 'user_1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'template_2',
        name: 'Newsletter Template',
        description: 'Monthly newsletter layout',
        category: 'newsletter',
        templateType: 'newsletter',
        htmlContent: '<div class="newsletter"><h1>Monthly Newsletter</h1>...',
        textContent: 'Monthly Newsletter content...',
        usage_count: 12,
        is_active: true,
        created_by: 'user_1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  };

  const loadEmailLists = async (): Promise<EmailList[]> => {
    // Mock data - in real implementation this would come from the service
    return [
      {
        id: 'list_1',
        name: 'All Subscribers',
        description: 'Master list of all email subscribers',
        listType: 'manual',
        subscriber_count: 1250,
        is_active: true,
        created_by: 'user_1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'list_2',
        name: 'VIP Customers',
        description: 'High-value customers and loyalty members',
        listType: 'dynamic',
        segmentation_rules: { total_spent: { min: 1000 } },
        subscriber_count: 185,
        is_active: true,
        created_by: 'user_1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  };

  const handleCreateCampaign = async () => {
    try {
      const campaign = await marketingService.createEmailCampaign(campaignForm);
      setCampaigns([campaign, ...campaigns]);
      setIsCreateCampaignDialogOpen(false);
      resetCampaignForm();
      toast.success('Email campaign created successfully');
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    try {
      await marketingService.sendEmailCampaign(campaignId);
      await loadData();
      toast.success('Campaign sent successfully');
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast.error('Failed to send campaign');
    }
  };

  const handleCreateTemplate = async () => {
    try {
      // Mock implementation - in real implementation this would call the service
      const newTemplate: EmailTemplate = {
        id: `template_${Date.now()}`,
        name: templateForm.name || '',
        description: templateForm.description || '',
        category: templateForm.category || 'custom',
        templateType: templateForm.templateType || 'custom',
        htmlContent: templateForm.htmlContent || '',
        textContent: templateForm.textContent || '',
        cssStyles: templateForm.cssStyles || '',
        variables: templateForm.variables || {},
        sections: templateForm.sections || {},
        is_active: true,
        usage_count: 0,
        created_by: 'user_1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setTemplates([newTemplate, ...templates]);
      setIsCreateTemplateDialogOpen(false);
      resetTemplateForm();
      toast.success('Email template created successfully');
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  };

  const handleCreateList = async () => {
    try {
      // Mock implementation - in real implementation this would call the service
      const newList: EmailList = {
        id: `list_${Date.now()}`,
        name: listForm.name || '',
        description: listForm.description || '',
        listType: listForm.listType || 'manual',
        segmentation_rules: listForm.segmentationRules || {},
        auto_update_rules: {},
        is_active: listForm.isActive || true,
        subscriber_count: 0,
        created_by: 'user_1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setLists([newList, ...lists]);
      setIsCreateListDialogOpen(false);
      resetListForm();
      toast.success('Email list created successfully');
    } catch (error) {
      console.error('Error creating list:', error);
      toast.error('Failed to create list');
    }
  };

  const handleAddSubscriber = async () => {
    try {
      // Mock implementation - in real implementation this would call the service
      const newSubscriber: EmailSubscriber = {
        id: `subscriber_${Date.now()}`,
        email: subscriberForm.email || '',
        first_name: subscriberForm.firstName || '',
        last_name: subscriberForm.lastName || '',
        source: subscriberForm.source || 'manual',
        gdpr_consent: subscriberForm.gdprConsent || false,
        gdpr_consent_date: subscriberForm.gdprConsent ? new Date().toISOString() : undefined,
        preferences: {},
        custom_fields: {},
        engagement_score: 0,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setSubscribers([newSubscriber, ...subscribers]);
      resetSubscriberForm();
      toast.success('Subscriber added successfully');
    } catch (error) {
      console.error('Error adding subscriber:', error);
      toast.error('Failed to add subscriber');
    }
  };

  const loadCampaignMetrics = async (campaignId: string) => {
    try {
      const metrics = await marketingService.getEmailCampaignMetrics(campaignId);
      setCampaignMetrics(metrics);
    } catch (error) {
      console.error('Error loading campaign metrics:', error);
      toast.error('Failed to load campaign metrics');
    }
  };

  const resetCampaignForm = () => {
    setCampaignForm({
      name: '',
      subjectLine: '',
      fromName: 'Mariia Hub',
      fromEmail: 'hello@mariaborysevych.com',
      contentHtml: '',
      contentText: '',
      listIds: [],
      personalizationVars: {},
      segmentationRules: {}
    });
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      category: 'custom',
      templateType: 'custom',
      htmlContent: '',
      textContent: '',
      cssStyles: '',
      variables: {},
      sections: {}
    });
  };

  const resetListForm = () => {
    setListForm({
      name: '',
      description: '',
      listType: 'manual',
      segmentationRules: {},
      isActive: true
    });
  };

  const resetSubscriberForm = () => {
    setSubscriberForm({
      email: '',
      firstName: '',
      lastName: '',
      source: 'manual',
      gdprConsent: false
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'sending': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4" />;
      case 'scheduled': return <Calendar className="w-4 h-4" />;
      case 'sending': return <Send className="w-4 h-4" />;
      case 'sent': return <CheckCircle className="w-4 h-4" />;
      case 'paused': return <AlertTriangle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Email Marketing System</h2>
          <p className="text-muted-foreground">Create, manage, and automate your email marketing campaigns</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateListDialogOpen} onOpenChange={setIsCreateListDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Create List
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Email List</DialogTitle>
                <DialogDescription>
                  Create a new email list to organize your subscribers
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="list-name">List Name</Label>
                  <Input
                    id="list-name"
                    value={listForm.name || ''}
                    onChange={(e) => setListForm({ ...listForm, name: e.target.value })}
                    placeholder="e.g., VIP Customers, Newsletter Subscribers"
                  />
                </div>
                <div>
                  <Label htmlFor="list-description">Description</Label>
                  <Textarea
                    id="list-description"
                    value={listForm.description || ''}
                    onChange={(e) => setListForm({ ...listForm, description: e.target.value })}
                    placeholder="Describe the purpose of this list..."
                  />
                </div>
                <div>
                  <Label>List Type</Label>
                  <Select
                    value={listForm.listType}
                    onValueChange={(value) => setListForm({ ...listForm, listType: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="dynamic">Dynamic</SelectItem>
                      <SelectItem value="suppression">Suppression</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="list-active"
                    checked={listForm.isActive}
                    onCheckedChange={(checked) => setListForm({ ...listForm, isActive: checked })}
                  />
                  <Label htmlFor="list-active">Active</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateListDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateList}>
                    Create List
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateTemplateDialogOpen} onOpenChange={setIsCreateTemplateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Layout className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Email Template</DialogTitle>
                <DialogDescription>
                  Design a reusable email template for your campaigns
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="design">Design</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="template-name">Template Name</Label>
                      <Input
                        id="template-name"
                        value={templateForm.name || ''}
                        onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                        placeholder="e.g., Welcome Email, Newsletter"
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Select
                        value={templateForm.category}
                        onValueChange={(value) => setTemplateForm({ ...templateForm, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Custom</SelectItem>
                          <SelectItem value="automation">Automation</SelectItem>
                          <SelectItem value="newsletter">Newsletter</SelectItem>
                          <SelectItem value="transactional">Transactional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="template-description">Description</Label>
                    <Textarea
                      id="template-description"
                      value={templateForm.description || ''}
                      onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                      placeholder="Describe when and how to use this template..."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="design" className="space-y-4">
                  <div>
                    <Label htmlFor="template-html">HTML Content</Label>
                    <Textarea
                      id="template-html"
                      value={templateForm.htmlContent || ''}
                      onChange={(e) => setTemplateForm({ ...templateForm, htmlContent: e.target.value })}
                      placeholder="Enter your HTML template code..."
                      className="min-h-[300px] font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-text">Plain Text Content</Label>
                    <Textarea
                      id="template-text"
                      value={templateForm.textContent || ''}
                      onChange={(e) => setTemplateForm({ ...templateForm, textContent: e.target.value })}
                      placeholder="Plain text version for email clients that don't support HTML..."
                      className="min-h-[150px]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-css">CSS Styles</Label>
                    <Textarea
                      id="template-css"
                      value={templateForm.cssStyles || ''}
                      onChange={(e) => setTemplateForm({ ...templateForm, cssStyles: e.target.value })}
                      placeholder="Additional CSS styles..."
                      className="min-h-[100px] font-mono text-sm"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Template Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-lg p-4 bg-white">
                        <div dangerouslySetInnerHTML={{ __html: templateForm.htmlContent || '<p>No content yet</p>' }} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setIsCreateTemplateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTemplate}>
                  Create Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateCampaignDialogOpen} onOpenChange={setIsCreateCampaignDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Email Campaign</DialogTitle>
                <DialogDescription>
                  Set up a new email campaign to engage your subscribers
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="recipients">Recipients</TabsTrigger>
                  <TabsTrigger value="personalization">Personalization</TabsTrigger>
                  <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="campaign-name">Campaign Name</Label>
                      <Input
                        id="campaign-name"
                        value={campaignForm.name}
                        onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                        placeholder="e.g., November Newsletter, Special Promotion"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subject-line">Subject Line</Label>
                      <Input
                        id="subject-line"
                        value={campaignForm.subjectLine}
                        onChange={(e) => setCampaignForm({ ...campaignForm, subjectLine: e.target.value })}
                        placeholder="Your email subject line..."
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="preview-text">Preview Text</Label>
                    <Input
                      id="preview-text"
                      value={campaignForm.previewText || ''}
                      onChange={(e) => setCampaignForm({ ...campaignForm, previewText: e.target.value })}
                      placeholder="Brief text that appears in inbox previews..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="from-name">From Name</Label>
                      <Input
                        id="from-name"
                        value={campaignForm.fromName}
                        onChange={(e) => setCampaignForm({ ...campaignForm, fromName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="from-email">From Email</Label>
                      <Input
                        id="from-email"
                        type="email"
                        value={campaignForm.fromEmail}
                        onChange={(e) => setCampaignForm({ ...campaignForm, fromEmail: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Template</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a template or start from scratch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blank">Start from scratch</SelectItem>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name} - {template.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="campaign-content">Email Content</Label>
                    <Textarea
                      id="campaign-content"
                      value={campaignForm.contentHtml}
                      onChange={(e) => setCampaignForm({ ...campaignForm, contentHtml: e.target.value })}
                      placeholder="Write your email content in HTML..."
                      className="min-h-[200px]"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="recipients" className="space-y-4">
                  <div>
                    <Label>Select Email Lists</Label>
                    <div className="space-y-2 mt-2">
                      {lists.map((list) => (
                        <div key={list.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h3 className="font-medium">{list.name}</h3>
                            <p className="text-sm text-muted-foreground">{list.description}</p>
                            <p className="text-xs text-muted-foreground">{list.subscriber_count} subscribers</p>
                          </div>
                          <Switch />
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <Label>Segmentation Rules</Label>
                    <p className="text-sm text-muted-foreground mb-2">Further refine your audience with specific criteria</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Engagement Level</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="All subscribers" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All subscribers</SelectItem>
                            <SelectItem value="high">Highly engaged</SelectItem>
                            <SelectItem value="medium">Moderately engaged</SelectItem>
                            <SelectItem value="low">Recently inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Last Purchase</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="No filter" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">No filter</SelectItem>
                            <SelectItem value="7days">Within 7 days</SelectItem>
                            <SelectItem value="30days">Within 30 days</SelectItem>
                            <SelectItem value="90days">Within 90 days</SelectItem>
                            <SelectItem value="never">Never purchased</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="personalization" className="space-y-4">
                  <div>
                    <Label>Personalization Variables</Label>
                    <p className="text-sm text-muted-foreground mb-2">Add dynamic content based on subscriber data</p>
                    <div className="space-y-2">
                      {['First Name', 'Last Name', 'City', 'Last Purchase Date', 'Loyalty Tier'].map((variable) => (
                        <div key={variable} className="flex items-center gap-2 p-2 border rounded">
                          <Code className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{`{{${variable.replace(/\s+/g, '_').toLowerCase()}}}`}</span>
                          <Badge variant="outline" className="ml-auto">Available</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Conditional Content</Label>
                    <p className="text-sm text-muted-foreground mb-2">Show different content based on subscriber attributes</p>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Conditional Block
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="scheduling" className="space-y-4">
                  <div>
                    <Label>When to Send?</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <Card className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4 text-center">
                          <Send className="w-8 h-8 mx-auto mb-2 text-green-600" />
                          <h3 className="font-medium">Send Now</h3>
                          <p className="text-sm text-muted-foreground">Send immediately</p>
                        </CardContent>
                      </Card>
                      <Card className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4 text-center">
                          <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                          <h3 className="font-medium">Schedule</h3>
                          <p className="text-sm text-muted-foreground">Send at optimal time</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  <div>
                    <Label>Optimal Send Times</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {['Tuesday 10:00 AM', 'Wednesday 2:00 PM', 'Thursday 6:00 PM'].map((time) => (
                        <Button key={time} variant="outline" size="sm">
                          {time}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Based on your subscribers' engagement patterns
                    </p>
                  </div>
                  <div>
                    <Label>A/B Testing</Label>
                    <p className="text-sm text-muted-foreground mb-2">Test different versions to optimize performance</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Switch />
                        <Label>Test subject lines</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch />
                        <Label>Test content variations</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch />
                        <Label>Test send times</Label>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setIsCreateCampaignDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCampaign}>
                  Create Campaign
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="lists">Lists</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getStatusColor(campaign.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(campaign.status)}
                            {campaign.status}
                          </div>
                        </Badge>
                        {campaign.scheduled_for && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(campaign.scheduled_for), 'MMM d, yyyy HH:mm')}
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold mb-1">{campaign.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{campaign.subject_line}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{campaign.total_recipients} recipients</span>
                        {campaign.sent_at && (
                          <span>Sent {format(new Date(campaign.sent_at), 'MMM d')}</span>
                        )}
                        <span>Open rate: {campaign.total_recipients > 0 ? ((campaign.opened_count / campaign.total_recipients) * 100).toFixed(1) : 0}%</span>
                        <span>Click rate: {campaign.total_recipients > 0 ? ((campaign.clicked_count / campaign.total_recipients) * 100).toFixed(1) : 0}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {campaign.status === 'draft' && (
                        <Button size="sm" onClick={() => handleSendCampaign(campaign.id)}>
                          <Send className="w-4 h-4 mr-2" />
                          Send
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => loadCampaignMetrics(campaign.id)}>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analytics
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {selectedCampaign?.id === campaign.id && campaignMetrics && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-3">Campaign Performance</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{campaignMetrics.openRate.toFixed(1)}%</div>
                          <div className="text-sm text-muted-foreground">Open Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{campaignMetrics.clickRate.toFixed(1)}%</div>
                          <div className="text-sm text-muted-foreground">Click Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{campaignMetrics.conversionRate.toFixed(1)}%</div>
                          <div className="text-sm text-muted-foreground">Conversion Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">₺{campaignMetrics.revenue.toFixed(0)}</div>
                          <div className="text-sm text-muted-foreground">Revenue</div>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Delivery Progress</span>
                          <span>{campaignMetrics.delivered}/{campaignMetrics.sent}</span>
                        </div>
                        <Progress value={(campaignMetrics.delivered / campaignMetrics.sent) * 100} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Used:</span>
                      <span>{template.usage_count} times</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span>{template.template_type}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Copy className="w-4 h-4 mr-2" />
                      Use
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="lists" className="space-y-4">
          <div className="grid gap-4">
            {lists.map((list) => (
              <Card key={list.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{list.name}</h3>
                        <Badge variant={list.is_active ? "default" : "secondary"}>
                          {list.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">{list.list_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{list.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span>{list.subscriber_count} subscribers</span>
                        <span>Created {format(new Date(list.created_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Users className="w-4 h-4 mr-2" />
                        View Subscribers
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="subscribers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Subscriber</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="subscriber-email">Email</Label>
                  <Input
                    id="subscriber-email"
                    type="email"
                    value={subscriberForm.email || ''}
                    onChange={(e) => setSubscriberForm({ ...subscriberForm, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="subscriber-first">First Name</Label>
                  <Input
                    id="subscriber-first"
                    value={subscriberForm.firstName || ''}
                    onChange={(e) => setSubscriberForm({ ...subscriberForm, firstName: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="subscriber-last">Last Name</Label>
                  <Input
                    id="subscriber-last"
                    value={subscriberForm.lastName || ''}
                    onChange={(e) => setSubscriberForm({ ...subscriberForm, lastName: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={handleAddSubscriber} className="flex-1">
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Switch
                  id="gdpr-consent"
                  checked={subscriberForm.gdprConsent}
                  onCheckedChange={(checked) => setSubscriberForm({ ...subscriberForm, gdprConsent: checked })}
                />
                <Label htmlFor="gdpr-consent">GDPR Consent</Label>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {subscribers.slice(0, 10).map((subscriber) => (
              <Card key={subscriber.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">
                        {subscriber.first_name} {subscriber.last_name}
                      </h4>
                      <p className="text-sm text-muted-foreground">{subscriber.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={subscriber.status === 'active' ? 'default' : 'secondary'}>
                        {subscriber.status}
                      </Badge>
                      <Badge variant="outline">Score: {subscriber.engagement_score}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Automation Workflows</CardTitle>
                <CardDescription>
                  Set up automated email sequences based on customer behavior
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {[
                    {
                      name: 'Welcome Series',
                      description: 'Send a series of welcome emails to new subscribers',
                      triggers: 'When subscriber joins list',
                      status: 'active',
                      performance: '45% open rate, 12% click rate'
                    },
                    {
                      name: 'Abandoned Cart Recovery',
                      description: 'Recover abandoned bookings with automated reminders',
                      triggers: 'When booking is abandoned',
                      status: 'active',
                      performance: '68% open rate, 25% recovery rate'
                    },
                    {
                      name: 'Post-Treatment Care',
                      description: 'Send aftercare tips following treatments',
                      triggers: '24 hours after booking completion',
                      status: 'draft',
                      performance: 'Not started yet'
                    }
                  ].map((workflow, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">{workflow.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{workflow.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Trigger: {workflow.triggers}</span>
                          <span>Performance: {workflow.performance}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                          {workflow.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Workflow
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Automation Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">3,245</div>
                    <div className="text-sm text-muted-foreground">Automated Emails Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">52%</div>
                    <div className="text-sm text-muted-foreground">Average Open Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">18%</div>
                    <div className="text-sm text-muted-foreground">Conversion Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">₺12,450</div>
                    <div className="text-sm text-muted-foreground">Revenue Generated</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};