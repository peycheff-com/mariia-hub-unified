import { useState, useEffect } from "react";
import {
  Sparkles,
  Image as ImageIcon,
  Type,
  Loader2,
  Download,
  Save,
  Edit3,
  TrendingUp,
  Settings,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  BarChart3,
  Target,
  Zap,
  FileText,
  Layers,
  Hash
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";
import { logger } from "@/lib/logger";
import {
  getAIContentService,
  BlogPostGenerationRequest,
  ServiceDescriptionRequest,
  ContentImprovementRequest,
  GeneratedContent,
  ContentGenerationResult
} from "@/services/aiContentService";

const EnhancedAIContentGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("blog");
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [contentHistory, setContentHistory] = useState<GeneratedContent[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState("");
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  // Blog Post State
  const [blogTopic, setBlogTopic] = useState("");
  const [blogCategory, setBlogCategory] = useState("");
  const [blogAudience, setBlogAudience] = useState("");
  const [blogTone, setBlogTone] = useState<"professional" | "friendly" | "casual" | "luxury">("luxury");
  const [blogWordCount, setBlogWordCount] = useState([1000]);
  const [blogLanguage, setBlogLanguage] = useState<"en" | "pl" | "ru" | "ua">("en");
  const [blogKeywords, setBlogKeywords] = useState("");
  const [blogIncludeCTA, setBlogIncludeCTA] = useState(true);
  const [blogBrandVoice, setBlogBrandVoice] = useState("");
  const [blogOutline, setBlogOutline] = useState("");

  // Service Description State
  const [serviceName, setServiceName] = useState("");
  const [serviceCategory, setServiceCategory] = useState("");
  const [serviceFeatures, setServiceFeatures] = useState("");
  const [serviceBenefits, setServiceBenefits] = useState("");
  const [serviceAudience, setServiceAudience] = useState("");
  const [serviceTone, setServiceTone] = useState<"professional" | "friendly" | "casual" | "luxury">("luxury");
  const [serviceWordCount, setServiceWordCount] = useState([500]);
  const [serviceLanguage, setServiceLanguage] = useState<"en" | "pl" | "ru" | "ua">("en");
  const [serviceIncludePrep, setServiceIncludePrep] = useState(true);
  const [serviceIncludeAftercare, setServiceIncludeAftercare] = useState(true);
  const [serviceIncludeFAQ, setServiceIncludeFAQ] = useState(true);
  const [serviceIncludePricing, setServiceIncludePricing] = useState(false);
  const [servicePriceRange, setServicePriceRange] = useState("");
  const [serviceVariations, setServiceVariations] = useState([1]);

  // Content Improvement State
  const [improvementContent, setImprovementContent] = useState("");
  const [improvementType, setImprovementType] = useState<"blog" | "service" | "email" | "social">("blog");
  const [improvements, setImprovements] = useState<string[]>([]);
  const [improvementKeywords, setImprovementKeywords] = useState("");
  const [maintainTone, setMaintainTone] = useState(true);
  const [optimizeSEO, setOptimizeSEO] = useState(true);

  // Content Ideas State
  const [ideasCategory, setIdeasCategory] = useState("");
  const [ideasCount, setIdeasCount] = useState([10]);
  const [ideasAudience, setIdeasAudience] = useState("");

  const languages = [
    { value: "en", label: "English" },
    { value: "pl", label: "Polish" },
    { value: "ru", label: "Russian" },
    { value: "ua", label: "Ukrainian" },
  ];

  const categories = [
    "Beauty Treatments",
    "Skincare",
    "Permanent Makeup",
    "Fitness Programs",
    "Wellness",
    "Lifestyle",
    "Health Tips",
    "Tutorials"
  ];

  const improvementOptions = [
    "Improve readability",
    "Add more details",
    "Make more engaging",
    "Add statistics/facts",
    "Include examples",
    "Strengthen CTA",
    "Improve flow",
    "Add headings"
  ];

  // Initialize AI Service
  useEffect(() => {
    const config = {
      openai: {
        apiKey: import.meta.env.VITE_OPENAI_API_KEY || "",
        model: "gpt-4-turbo-preview"
      },
      rateLimits: {
        requestsPerMinute: 60,
        tokensPerMinute: 150000
      },
      brandVoice: {
        tone: "luxury",
        style: "premium",
        guidelines: [
          "Maintain luxury positioning",
          "Focus on quality and results",
          "Be informative yet approachable",
          "Include value propositions"
        ]
      }
    };

    if (config.openai.apiKey) {
      getAIContentService(config);
    }
  }, []);

  // Generate Blog Post
  const generateBlogPost = async () => {
    if (!blogTopic.trim()) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: "Please enter a topic",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const request: BlogPostGenerationRequest = {
        topic: blogTopic,
        category: blogCategory,
        targetAudience: blogAudience,
        tone: blogTone,
        wordCount: blogWordCount[0],
        language: blogLanguage,
        seoKeywords: blogKeywords.split(",").map(k => k.trim()).filter(k => k),
        includeCallToAction: blogIncludeCTA,
        brandVoice: blogBrandVoice,
        outline: blogOutline.split("\n").map(o => o.trim()).filter(o => o),
        includeImages: true
      };

      const result = await getAIContentService().generateBlogPost(request);

      if (result.success && result.content) {
        setGeneratedContent(result.content);
        setContentHistory(prev => [result.content!, ...prev.slice(0, 9)]);

        toast aria-live="polite" aria-atomic="true"({
          title: "Success",
          description: `Blog post generated with quality score: ${result.content.qualityScore}/100`,
        });
      } else {
        throw new Error(result.error || "Failed to generate content");
      }
    } catch (error: any) {
      logger.error("Error generating blog post:", error);
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message || "Failed to generate blog post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate Service Description
  const generateServiceDescription = async () => {
    if (!serviceName.trim()) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: "Please enter a service name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const request: ServiceDescriptionRequest = {
        serviceName,
        category: serviceCategory,
        features: serviceFeatures.split(",").map(f => f.trim()).filter(f => f),
        benefits: serviceBenefits.split(",").map(b => b.trim()).filter(b => b),
        targetAudience: serviceAudience,
        tone: serviceTone,
        wordCount: serviceWordCount[0],
        language: serviceLanguage,
        includePreparation: serviceIncludePrep,
        includeAftercare: serviceIncludeAftercare,
        includeFAQ: serviceIncludeFAQ,
        includePricing: serviceIncludePricing,
        priceRange: servicePriceRange,
        variations: serviceVariations[0]
      };

      const result = await getAIContentService().generateServiceDescription(request);

      if (result.success && result.content) {
        setGeneratedContent(result.content);
        setContentHistory(prev => [result.content!, ...prev.slice(0, 9)]);

        toast aria-live="polite" aria-atomic="true"({
          title: "Success",
          description: `Service description generated with ${result.content.variations?.length || 1} variation(s)`,
        });
      } else {
        throw new Error(result.error || "Failed to generate content");
      }
    } catch (error: any) {
      logger.error("Error generating service description:", error);
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message || "Failed to generate service description",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Improve Content
  const improveContent = async () => {
    if (!improvementContent.trim()) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: "Please enter content to improve",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const request: ContentImprovementRequest = {
        content: improvementContent,
        contentType: improvementType,
        improvements,
        targetKeywords: improvementKeywords.split(",").map(k => k.trim()).filter(k => k),
        maintainTone,
        optimizeForSEO: optimizeSEO
      };

      const result = await getAIContentService().improveContent(request);

      if (result.success && result.content) {
        setGeneratedContent(result.content);

        toast aria-live="polite" aria-atomic="true"({
          title: "Success",
          description: `Content improved with SEO score: ${result.content.seoScore}/100`,
        });
      } else {
        throw new Error(result.error || "Failed to improve content");
      }
    } catch (error: any) {
      logger.error("Error improving content:", error);
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message || "Failed to improve content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate Content Ideas
  const generateContentIdeas = async () => {
    if (!ideasCategory.trim()) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: "Please enter a category",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await getAIContentService().generateContentIdeas(
        ideasCategory,
        ideasCount[0],
        ideasAudience
      );

      if (result.success && result.content) {
        setGeneratedContent(result.content);

        toast aria-live="polite" aria-atomic="true"({
          title: "Success",
          description: `Generated ${ideasCount[0]} content ideas`,
        });
      } else {
        throw new Error(result.error || "Failed to generate ideas");
      }
    } catch (error: any) {
      logger.error("Error generating ideas:", error);
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message || "Failed to generate ideas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Save Content
  const saveContent = async (status: 'draft' | 'published' = 'draft') => {
    if (!generatedContent) return;

    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const contentToSave = generatedContent;

      // Handle different content types
      if (generatedContent.type === 'blog') {
        const { error } = await supabase.from("blog_posts").insert({
          title: generatedContent.title,
          slug: generatedContent.slug,
          excerpt: generatedContent.excerpt,
          content: generatedContent.content,
          seo_title: generatedContent.seoTitle,
          meta_description: generatedContent.metaDescription,
          tags: generatedContent.tags,
          author_id: user.user.id,
          status,
          metadata: generatedContent.metadata
        });
        if (error) throw error;
      }

      toast aria-live="polite" aria-atomic="true"({
        title: "Success",
        description: `Content saved as ${status}`,
      });

      // Reset after save
      setGeneratedContent(null);
    } catch (error: any) {
      logger.error("Error saving content:", error);
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message || "Failed to save content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast aria-live="polite" aria-atomic="true"({
      title: "Copied",
      description: "Content copied to clipboard",
    });
  };

  // Toggle edit mode
  const toggleEdit = () => {
    if (isEditing) {
      // Save edits
      setGeneratedContent(prev => prev ? { ...prev, content: editingContent } : null);
    } else {
      // Start editing
      setEditingContent(generatedContent?.content || "");
    }
    setIsEditing(!isEditing);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-serif">AI Content Generator</h2>
          <Badge variant="secondary" className="ml-2">Enhanced</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Advanced
          </Button>
        </div>
      </div>

      {/* Content History */}
      {contentHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Generations</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-20">
              <div className="flex gap-2">
                {contentHistory.map((item, idx) => (
                  <Button
                    key={idx}
                    variant="ghost"
                    size="sm"
                    onClick={() => setGeneratedContent(item)}
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    {item.title || `Content ${idx + 1}`}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="blog">
            <Type className="w-4 h-4 mr-2" />
            Blog Post
          </TabsTrigger>
          <TabsTrigger value="service">
            <Layers className="w-4 h-4 mr-2" />
            Service
          </TabsTrigger>
          <TabsTrigger value="improve">
            <Edit3 className="w-4 h-4 mr-2" />
            Improve
          </TabsTrigger>
          <TabsTrigger value="ideas">
            <Lightbulb className="w-4 h-4 mr-2" />
            Ideas
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Blog Post Generator */}
        <TabsContent value="blog" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Blog Post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={blogLanguage} onValueChange={(value: any) => setBlogLanguage(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Select value={blogTone} onValueChange={(value: any) => setBlogTone(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="luxury">Luxury</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Topic *</Label>
                <Input
                  id="topic"
                  value={blogTopic}
                  onChange={(e) => setBlogTopic(e.target.value)}
                  placeholder="Enter blog post topic..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={blogCategory} onValueChange={setBlogCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Input
                    id="audience"
                    value={blogAudience}
                    onChange={(e) => setBlogAudience(e.target.value)}
                    placeholder="e.g., Women 25-45"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">SEO Keywords</Label>
                <Input
                  id="keywords"
                  value={blogKeywords}
                  onChange={(e) => setBlogKeywords(e.target.value)}
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>

              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="brandVoice">Brand Voice Guidelines</Label>
                    <Textarea
                      id="brandVoice"
                      value={blogBrandVoice}
                      onChange={(e) => setBlogBrandVoice(e.target.value)}
                      placeholder="Specific brand voice instructions..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="outline">Outline (optional)</Label>
                    <Textarea
                      id="outline"
                      value={blogOutline}
                      onChange={(e) => setBlogOutline(e.target.value)}
                      placeholder="Enter key points or outline..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Word Count: {blogWordCount[0]}</Label>
                    <Slider
                      value={blogWordCount}
                      onValueChange={setBlogWordCount}
                      max={3000}
                      min={200}
                      step={100}
                      className="w-full"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="cta"
                      checked={blogIncludeCTA}
                      onCheckedChange={setBlogIncludeCTA}
                    />
                    <Label htmlFor="cta">Include Call to Action</Label>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Button onClick={generateBlogPost} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Blog Post
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Description Generator */}
        <TabsContent value="service" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Service Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceName">Service Name *</Label>
                  <Input
                    id="serviceName"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="e.g., Lip Blushing"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceCategory">Category</Label>
                  <Select value={serviceCategory} onValueChange={setServiceCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">Key Features</Label>
                <Textarea
                  id="features"
                  value={serviceFeatures}
                  onChange={(e) => setServiceFeatures(e.target.value)}
                  placeholder="feature1, feature2, feature3"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="benefits">Main Benefits</Label>
                <Textarea
                  id="benefits"
                  value={serviceBenefits}
                  onChange={(e) => setServiceBenefits(e.target.value)}
                  placeholder="benefit1, benefit2, benefit3"
                  rows={2}
                />
              </div>

              <Collapsible open={showAdvanced}>
                <CollapsibleContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="serviceTone">Tone</Label>
                      <Select value={serviceTone} onValueChange={(value: any) => setServiceTone(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="luxury">Luxury</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="serviceLanguage">Language</Label>
                      <Select value={serviceLanguage} onValueChange={(value: any) => setServiceLanguage(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Variations: {serviceVariations[0]}</Label>
                    <Slider
                      value={serviceVariations}
                      onValueChange={setServiceVariations}
                      max={5}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="prep"
                        checked={serviceIncludePrep}
                        onCheckedChange={setServiceIncludePrep}
                      />
                      <Label htmlFor="prep">Preparation</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="aftercare"
                        checked={serviceIncludeAftercare}
                        onCheckedChange={setServiceIncludeAftercare}
                      />
                      <Label htmlFor="aftercare">Aftercare</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="faq"
                        checked={serviceIncludeFAQ}
                        onCheckedChange={setServiceIncludeFAQ}
                      />
                      <Label htmlFor="faq">FAQ</Label>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Button onClick={generateServiceDescription} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Service Description
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Improver */}
        <TabsContent value="improve" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Improve Existing Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="improvementContent">Content to Improve *</Label>
                <Textarea
                  id="improvementContent"
                  value={improvementContent}
                  onChange={(e) => setImprovementContent(e.target.value)}
                  placeholder="Paste your content here..."
                  rows={8}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="improvementType">Content Type</Label>
                  <Select value={improvementType} onValueChange={(value: any) => setImprovementType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blog">Blog Post</SelectItem>
                      <SelectItem value="service">Service Description</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="improvementKeywords">Target Keywords</Label>
                  <Input
                    id="improvementKeywords"
                    value={improvementKeywords}
                    onChange={(e) => setImprovementKeywords(e.target.value)}
                    placeholder="keyword1, keyword2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Improvements Needed</Label>
                <div className="grid grid-cols-2 gap-2">
                  {improvementOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={option}
                        checked={improvements.includes(option)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setImprovements([...improvements, option]);
                          } else {
                            setImprovements(improvements.filter(i => i !== option));
                          }
                        }}
                      />
                      <Label htmlFor={option} className="text-sm">{option}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="maintainTone"
                    checked={maintainTone}
                    onCheckedChange={setMaintainTone}
                  />
                  <Label htmlFor="maintainTone">Maintain Original Tone</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="optimizeSEO"
                    checked={optimizeSEO}
                    onCheckedChange={setOptimizeSEO}
                  />
                  <Label htmlFor="optimizeSEO">Optimize for SEO</Label>
                </div>
              </div>

              <Button onClick={improveContent} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Improving...
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Improve Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Ideas Generator */}
        <TabsContent value="ideas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Content Ideas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ideasCategory">Category *</Label>
                <Select value={ideasCategory} onValueChange={setIdeasCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ideasAudience">Target Audience</Label>
                <Input
                  id="ideasAudience"
                  value={ideasAudience}
                  onChange={(e) => setIdeasAudience(e.target.value)}
                  placeholder="e.g., Brides-to-be"
                />
              </div>

              <div className="space-y-2">
                <Label>Number of Ideas: {ideasCount[0]}</Label>
                <Slider
                  value={ideasCount}
                  onValueChange={setIdeasCount}
                  max={20}
                  min={5}
                  step={1}
                  className="w-full"
                />
              </div>

              <Button onClick={generateContentIdeas} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Generate Ideas
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Usage Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-sm text-muted-foreground">Content Generated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-sm text-muted-foreground">Tokens Used</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">$0.00</div>
                    <div className="text-sm text-muted-foreground">Total Cost</div>
                  </div>
                </div>
                <div className="text-center text-muted-foreground">
                  Analytics data will be available after generating content
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generated Content Display */}
      {generatedContent && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Content</CardTitle>
              <div className="flex items-center gap-2">
                {generatedContent.qualityScore && (
                  <Badge variant={generatedContent.qualityScore > 80 ? "default" : "secondary"}>
                    Quality: {generatedContent.qualityScore}/100
                  </Badge>
                )}
                {generatedContent.seoScore && (
                  <Badge variant={generatedContent.seoScore > 80 ? "default" : "secondary"}>
                    SEO: {generatedContent.seoScore}/100
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedContent.title && (
              <div className="space-y-2">
                <Label>Title</Label>
                {isEditing ? (
                  <Input
                    value={generatedContent.title}
                    onChange={(e) => setGeneratedContent({...generatedContent, title: e.target.value})}
                  />
                ) : (
                  <div className="p-3 bg-muted rounded-md">{generatedContent.title}</div>
                )}
              </div>
            )}

            {generatedContent.excerpt && (
              <div className="space-y-2">
                <Label>Excerpt</Label>
                {isEditing ? (
                  <Textarea
                    value={generatedContent.excerpt}
                    onChange={(e) => setGeneratedContent({...generatedContent, excerpt: e.target.value})}
                    rows={2}
                  />
                ) : (
                  <div className="p-3 bg-muted rounded-md">{generatedContent.excerpt}</div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Content</Label>
              {isEditing ? (
                <Textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                />
              ) : (
                <div className="p-3 bg-muted rounded-md max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {generatedContent.content}
                  </pre>
                </div>
              )}
            </div>

            {/* Variations */}
            {generatedContent.variations && generatedContent.variations.length > 0 && (
              <div className="space-y-2">
                <Label>Variations</Label>
                <div className="space-y-2">
                  {generatedContent.variations.map((variation, idx) => (
                    <div key={idx} className="p-3 bg-muted rounded-md text-sm">
                      <div className="font-medium mb-1">Variation {idx + 1}</div>
                      <div>{variation.substring(0, 200)}...</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {generatedContent.suggestions && generatedContent.suggestions.length > 0 && (
              <div className="space-y-2">
                <Label>Suggestions</Label>
                <div className="space-y-1">
                  {generatedContent.suggestions.map((suggestion, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            {generatedContent.metadata && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Metadata
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-3 bg-muted rounded-md">
                    <pre className="text-xs">
                      {JSON.stringify(generatedContent.metadata, null, 2)}
                    </pre>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              {isEditing && (
                <Button onClick={toggleEdit} className="flex-1">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save Edits
                </Button>
              )}
              <Button onClick={() => copyToClipboard(generatedContent.content)} variant="outline" className="flex-1">
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button onClick={() => saveContent('draft')} disabled={loading} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Save as Draft
              </Button>
              <Button onClick={() => saveContent('published')} disabled={loading} className="flex-1">
                <Zap className="w-4 h-4 mr-2" />
                Publish
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedAIContentGenerator;