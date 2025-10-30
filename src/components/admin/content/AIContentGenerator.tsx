import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast aria-live="polite" aria-atomic="true" } from 'sonner';
import { Loader2, Sparkles, Save, Send, RefreshCw, Download, Eye, Settings } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { getAIService, BlogPostRequest, ServiceDescriptionRequest, ContentType } from '@/integrations/ai/service';
import { servicesService } from '@/services/services.service';
import { supabase } from '@/integrations/supabase/client';


interface AIContentGeneratorProps {
  className?: string;
  initialTab?: string;
}

interface GeneratedContent {
  type: ContentType;
  content: any;
  generatedAt: Date;
  status: 'draft' | 'published';
}

export function AIContentGenerator({ className, initialTab = 'blog' }: AIContentGeneratorProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [savedDrafts, setSavedDrafts] = useState<GeneratedContent[]>([]);

  // Blog Post State
  const [blogTopic, setBlogTopic] = useState('');
  const [blogTitle, setBlogTitle] = useState('');
  const [blogCategory, setBlogCategory] = useState('');
  const [blogAudience, setBlogAudience] = useState('');
  const [blogTone, setBlogTone] = useState<'professional' | 'friendly' | 'casual' | 'luxury'>('luxury');
  const [blogWordCount, setBlogWordCount] = useState([800]);
  const [blogKeywords, setBlogKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');

  // Service Description State
  const [selectedService, setSelectedService] = useState('');
  const [serviceTone, setServiceTone] = useState<'professional' | 'friendly' | 'casual' | 'luxury'>('luxury');
  const [serviceWordCount, setServiceWordCount] = useState([400]);
  const [includePreparation, setIncludePreparation] = useState(true);
  const [includeAftercare, setIncludeAftercare] = useState(true);

  // Email State
  const [emailType, setEmailType] = useState<'promotional' | 'newsletter' | 'appointment' | 'followup'>('promotional');
  const [emailPurpose, setEmailPurpose] = useState('');
  const [emailAudience, setEmailAudience] = useState('');
  const [emailTone, setEmailTone] = useState<'professional' | 'friendly' | 'casual' | 'luxury'>('professional');

  // Fetch services for service descriptions
  const { data: services } = useQuery({
    queryKey: ['services-list'],
    queryFn: () => servicesService.getServices().then(res => res.data),
  });

  // Initialize AI service
  useEffect(() => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (apiKey) {
      getAIService({ apiKey, model: 'gpt-4-turbo-preview' });
    }
  }, []);

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !blogKeywords.includes(newKeyword.trim())) {
      setBlogKeywords([...blogKeywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setBlogKeywords(blogKeywords.filter(k => k !== keyword));
  };

  const generateBlogPost = async () => {
    if (!blogTopic) {
      toast aria-live="polite" aria-atomic="true".error(t('admin.ai.content.pleaseEnterTopic'));
      return;
    }

    setIsGenerating(true);
    try {
      const aiService = getAIService();
      const request: BlogPostRequest = {
        title: blogTitle || undefined,
        topic: blogTopic,
        category: blogCategory,
        targetAudience: blogAudience,
        tone: blogTone,
        wordCount: blogWordCount[0],
        language: i18n.language as 'en' | 'pl',
        seoKeywords: blogKeywords.length > 0 ? blogKeywords : undefined,
      };

      const response = await aiService.generateBlogPost(request);

      setGeneratedContent({
        type: 'blog-post',
        content: response,
        generatedAt: new Date(),
        status: 'draft',
      });

      toast aria-live="polite" aria-atomic="true".success(t('admin.ai.content.blogGenerated'));
    } catch (error) {
      console.error('Error generating blog post:', error);
      toast aria-live="polite" aria-atomic="true".error(t('admin.ai.content.generationError'));
    } finally {
      setIsGenerating(false);
    }
  };

  const generateServiceDescription = async () => {
    if (!selectedService) {
      toast aria-live="polite" aria-atomic="true".error(t('admin.ai.content.pleaseSelectService'));
      return;
    }

    setIsGenerating(true);
    try {
      const aiService = getAIService();
      const service = services?.find(s => s.id === selectedService);

      if (!service) {
        toast aria-live="polite" aria-atomic="true".error(t('admin.ai.content.serviceNotFound'));
        return;
      }

      const request: ServiceDescriptionRequest = {
        serviceName: service.title[i18n.language] || service.title.en || '',
        category: service.category,
        tone: serviceTone,
        wordCount: serviceWordCount[0],
        language: i18n.language as 'en' | 'pl',
        includePreparation,
        includeAftercare,
      };

      const response = await aiService.generateServiceDescription(request);

      setGeneratedContent({
        type: 'service-description',
        content: response,
        generatedAt: new Date(),
        status: 'draft',
      });

      toast aria-live="polite" aria-atomic="true".success(t('admin.ai.content.serviceDescriptionGenerated'));
    } catch (error) {
      console.error('Error generating service description:', error);
      toast aria-live="polite" aria-atomic="true".error(t('admin.ai.content.generationError'));
    } finally {
      setIsGenerating(false);
    }
  };

  const generateEmail = async () => {
    setIsGenerating(true);
    try {
      // This would be implemented with the AI service
      // For now, showing the structure
      const mockEmailContent = {
        subject: `Generated ${emailType} email`,
        body: 'Email content would be generated here...',
        cta: 'Call to action text',
        preview: 'Email preview text...',
      };

      setGeneratedContent({
        type: 'email',
        content: mockEmailContent,
        generatedAt: new Date(),
        status: 'draft',
      });

      toast aria-live="polite" aria-atomic="true".success(t('admin.ai.content.emailGenerated'));
    } catch (error) {
      console.error('Error generating email:', error);
      toast aria-live="polite" aria-atomic="true".error(t('admin.ai.content.generationError'));
    } finally {
      setIsGenerating(false);
    }
  };

  const saveDraft = async () => {
    if (!generatedContent) return;

    try {
      const { error } = await supabase
        .from('ai_content_drafts')
        .insert({
          content_type: generatedContent.type,
          content: generatedContent.content,
          language: i18n.language,
          status: 'draft',
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      setSavedDrafts([...savedDrafts, generatedContent]);
      toast aria-live="polite" aria-atomic="true".success(t('admin.ai.content.draftSaved'));
    } catch (error) {
      console.error('Error saving draft:', error);
      toast aria-live="polite" aria-atomic="true".error(t('admin.ai.content.saveError'));
    }
  };

  const publishContent = async () => {
    if (!generatedContent) return;

    try {
      if (generatedContent.type === 'blog-post') {
        const { error } = await supabase
          .from('blog_posts')
          .insert({
            title: generatedContent.content.title,
            slug: generatedContent.content.slug,
            content: generatedContent.content.content,
            excerpt: generatedContent.content.excerpt,
            seo_title: generatedContent.content.seoTitle,
            meta_description: generatedContent.content.metaDescription,
            tags: generatedContent.content.tags,
            reading_time: generatedContent.content.readingTime,
            status: 'published',
            published_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      setGeneratedContent({ ...generatedContent, status: 'published' });
      toast aria-live="polite" aria-atomic="true".success(t('admin.ai.content.contentPublished'));
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    } catch (error) {
      console.error('Error publishing content:', error);
      toast aria-live="polite" aria-atomic="true".error(t('admin.ai.content.publishError'));
    }
  };

  const regenerateContent = () => {
    if (activeTab === 'blog') generateBlogPost();
    else if (activeTab === 'service') generateServiceDescription();
    else if (activeTab === 'email') generateEmail();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('admin.ai.content.title')}</h2>
          <p className="text-muted-foreground">{t('admin.ai.content.description')}</p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          {t('admin.ai.content.settings')}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="blog">{t('admin.ai.content.blogPost')}</TabsTrigger>
          <TabsTrigger value="service">{t('admin.ai.content.serviceDescription')}</TabsTrigger>
          <TabsTrigger value="email">{t('admin.ai.content.email')}</TabsTrigger>
        </TabsList>

        {/* Blog Post Tab */}
        <TabsContent value="blog" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  {t('admin.ai.content.blogPostSettings')}
                </CardTitle>
                <CardDescription>{t('admin.ai.content.blogPostSettingsDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="topic">{t('admin.ai.content.topic')} *</Label>
                  <Input
                    id="topic"
                    value={blogTopic}
                    onChange={(e) => setBlogTopic(e.target.value)}
                    placeholder={t('admin.ai.content.topicPlaceholder')}
                  />
                </div>

                <div>
                  <Label htmlFor="blog-title">{t('admin.ai.content.title')}</Label>
                  <Input
                    id="blog-title"
                    value={blogTitle}
                    onChange={(e) => setBlogTitle(e.target.value)}
                    placeholder={t('admin.ai.content.titlePlaceholder')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="blog-category">{t('admin.ai.content.category')}</Label>
                    <Select value={blogCategory} onValueChange={setBlogCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('admin.ai.content.selectCategory')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beauty">{t('common.beauty')}</SelectItem>
                        <SelectItem value="fitness">{t('common.fitness')}</SelectItem>
                        <SelectItem value="wellness">{t('common.wellness')}</SelectItem>
                        <SelectItem value="lifestyle">{t('common.lifestyle')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="blog-audience">{t('admin.ai.content.audience')}</Label>
                    <Select value={blogAudience} onValueChange={setBlogAudience}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('admin.ai.content.selectAudience')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new-clients">{t('admin.ai.content.newClients')}</SelectItem>
                        <SelectItem value="existing-clients">{t('admin.ai.content.existingClients')}</SelectItem>
                        <SelectItem value="prospects">{t('admin.ai.content.prospects')}</SelectItem>
                        <SelectItem value="all">{t('admin.ai.content.all')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>{t('admin.ai.content.tone')}</Label>
                  <Select value={blogTone} onValueChange={(value: any) => setBlogTone(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">{t('admin.ai.content.professional')}</SelectItem>
                      <SelectItem value="friendly">{t('admin.ai.content.friendly')}</SelectItem>
                      <SelectItem value="casual">{t('admin.ai.content.casual')}</SelectItem>
                      <SelectItem value="luxury">{t('admin.ai.content.luxury')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{t('admin.ai.content.wordCount')}: {blogWordCount[0]}</Label>
                  <Slider
                    value={blogWordCount}
                    onValueChange={setBlogWordCount}
                    max={2000}
                    min={300}
                    step={100}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>{t('admin.ai.content.seoKeywords')}</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder={t('admin.ai.content.addKeyword')}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                    />
                    <Button onClick={handleAddKeyword} size="sm">
                      {t('common.add')}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {blogKeywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveKeyword(keyword)}>
                        {keyword} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button onClick={generateBlogPost} disabled={isGenerating} className="w-full">
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('admin.ai.content.generating')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {t('admin.ai.content.generateBlogPost')}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('admin.ai.content.generatedContent')}</CardTitle>
                <CardDescription>{t('admin.ai.content.generatedContentDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {generatedContent?.type === 'blog-post' && generatedContent.content ? (
                  <div className="space-y-4">
                    <div>
                      <Label>{t('admin.ai.content.title')}</Label>
                      <h3 className="text-lg font-semibold mt-1">{generatedContent.content.title}</h3>
                    </div>
                    <div>
                      <Label>{t('admin.ai.content.excerpt')}</Label>
                      <p className="text-sm text-muted-foreground mt-1">{generatedContent.content.excerpt}</p>
                    </div>
                    <Separator />
                    <div>
                      <Label>{t('admin.ai.content.content')}</Label>
                      <div className="mt-2 p-4 bg-muted rounded-lg max-h-96 overflow-y-auto">
                        <div className="prose prose-sm max-w-none">
                          {generatedContent.content.content.split('\n').map((paragraph: string, idx: number) => (
                            <p key={idx}>{paragraph}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Label>{t('admin.ai.content.tags')}: </Label>
                      {generatedContent.content.tags.map((tag: string) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={saveDraft} variant="outline" size="sm">
                        <Save className="w-4 h-4 mr-2" />
                        {t('admin.ai.content.saveDraft')}
                      </Button>
                      <Button onClick={publishContent} size="sm">
                        <Send className="w-4 h-4 mr-2" />
                        {t('admin.ai.content.publish')}
                      </Button>
                      <Button onClick={regenerateContent} variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {t('admin.ai.content.regenerate')}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        {t('admin.ai.content.preview')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t('admin.ai.content.noContentYet')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Service Description Tab */}
        <TabsContent value="service" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  {t('admin.ai.content.serviceSettings')}
                </CardTitle>
                <CardDescription>{t('admin.ai.content.serviceSettingsDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="service">{t('admin.ai.content.selectService')} *</Label>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('admin.ai.content.chooseService')} />
                    </SelectTrigger>
                    <SelectContent>
                      {services?.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.title[i18n.language] || service.title.en || service.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{t('admin.ai.content.tone')}</Label>
                  <Select value={serviceTone} onValueChange={(value: any) => setServiceTone(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">{t('admin.ai.content.professional')}</SelectItem>
                      <SelectItem value="friendly">{t('admin.ai.content.friendly')}</SelectItem>
                      <SelectItem value="casual">{t('admin.ai.content.casual')}</SelectItem>
                      <SelectItem value="luxury">{t('admin.ai.content.luxury')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{t('admin.ai.content.wordCount')}: {serviceWordCount[0]}</Label>
                  <Slider
                    value={serviceWordCount}
                    onValueChange={setServiceWordCount}
                    max={1000}
                    min={200}
                    step={50}
                    className="mt-2"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="preparation">{t('admin.ai.content.includePreparation')}</Label>
                    <Switch
                      id="preparation"
                      checked={includePreparation}
                      onCheckedChange={setIncludePreparation}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="aftercare">{t('admin.ai.content.includeAftercare')}</Label>
                    <Switch
                      id="aftercare"
                      checked={includeAftercare}
                      onCheckedChange={setIncludeAftercare}
                    />
                  </div>
                </div>

                <Button onClick={generateServiceDescription} disabled={isGenerating} className="w-full">
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('admin.ai.content.generating')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {t('admin.ai.content.generateDescription')}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('admin.ai.content.generatedDescription')}</CardTitle>
                <CardDescription>{t('admin.ai.content.generatedDescriptionDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {generatedContent?.type === 'service-description' && generatedContent.content ? (
                  <div className="space-y-4">
                    <div>
                      <Label>{t('admin.ai.content.shortDescription')}</Label>
                      <p className="text-sm mt-1">{generatedContent.content.shortDescription}</p>
                    </div>
                    <Separator />
                    <div>
                      <Label>{t('admin.ai.content.detailedDescription')}</Label>
                      <p className="text-sm mt-1">{generatedContent.content.detailedDescription}</p>
                    </div>
                    <div>
                      <Label>{t('admin.ai.content.keyBenefits')}</Label>
                      <ul className="list-disc list-inside text-sm mt-1">
                        {generatedContent.content.keyBenefits.map((benefit: string, idx: number) => (
                          <li key={idx}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={saveDraft} variant="outline" size="sm">
                        <Save className="w-4 h-4 mr-2" />
                        {t('admin.ai.content.saveDraft')}
                      </Button>
                      <Button onClick={publishContent} size="sm">
                        <Send className="w-4 h-4 mr-2" />
                        {t('admin.ai.content.updateService')}
                      </Button>
                      <Button onClick={regenerateContent} variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {t('admin.ai.content.regenerate')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t('admin.ai.content.noDescriptionYet')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  {t('admin.ai.content.emailSettings')}
                </CardTitle>
                <CardDescription>{t('admin.ai.content.emailSettingsDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{t('admin.ai.content.emailType')}</Label>
                  <Select value={emailType} onValueChange={(value: any) => setEmailType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="promotional">{t('admin.ai.content.promotional')}</SelectItem>
                      <SelectItem value="newsletter">{t('admin.ai.content.newsletter')}</SelectItem>
                      <SelectItem value="appointment">{t('admin.ai.content.appointment')}</SelectItem>
                      <SelectItem value="followup">{t('admin.ai.content.followup')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="purpose">{t('admin.ai.content.purpose')}</Label>
                  <Textarea
                    id="purpose"
                    value={emailPurpose}
                    onChange={(e) => setEmailPurpose(e.target.value)}
                    placeholder={t('admin.ai.content.purposePlaceholder')}
                    rows={3}
                  />
                </div>

                <div>
                  <Label>{t('admin.ai.content.targetAudience')}</Label>
                  <Select value={emailAudience} onValueChange={setEmailAudience}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('admin.ai.content.selectAudience')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-clients">{t('admin.ai.content.allClients')}</SelectItem>
                      <SelectItem value="new-clients">{t('admin.ai.content.newClients')}</SelectItem>
                      <SelectItem value="vip-clients">{t('admin.ai.content.vipClients')}</SelectItem>
                      <SelectItem value="inactive-clients">{t('admin.ai.content.inactiveClients')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{t('admin.ai.content.tone')}</Label>
                  <Select value={emailTone} onValueChange={(value: any) => setEmailTone(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">{t('admin.ai.content.professional')}</SelectItem>
                      <SelectItem value="friendly">{t('admin.ai.content.friendly')}</SelectItem>
                      <SelectItem value="casual">{t('admin.ai.content.casual')}</SelectItem>
                      <SelectItem value="luxury">{t('admin.ai.content.luxury')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={generateEmail} disabled={isGenerating} className="w-full">
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('admin.ai.content.generating')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {t('admin.ai.content.generateEmail')}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('admin.ai.content.generatedEmail')}</CardTitle>
                <CardDescription>{t('admin.ai.content.generatedEmailDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {generatedContent?.type === 'email' && generatedContent.content ? (
                  <div className="space-y-4">
                    <div>
                      <Label>{t('admin.ai.content.subject')}</Label>
                      <p className="font-semibold mt-1">{generatedContent.content.subject}</p>
                    </div>
                    <Separator />
                    <div>
                      <Label>{t('admin.ai.content.body')}</Label>
                      <div className="mt-2 p-4 bg-muted rounded-lg max-h-96 overflow-y-auto">
                        {generatedContent.content.body}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={saveDraft} variant="outline" size="sm">
                        <Save className="w-4 h-4 mr-2" />
                        {t('admin.ai.content.saveDraft')}
                      </Button>
                      <Button size="sm">
                        <Send className="w-4 h-4 mr-2" />
                        {t('admin.ai.content.sendTest')}
                      </Button>
                      <Button onClick={regenerateContent} variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {t('admin.ai.content.regenerate')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t('admin.ai.content.noEmailYet')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}