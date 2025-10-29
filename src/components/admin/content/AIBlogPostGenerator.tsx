import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Wand2, Copy, CheckCircle } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAIBlogPost } from '@/hooks/useAIContent';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BlogPostRequest } from '@/integrations/ai/service';

interface AIBlogPostGeneratorProps {
  onContentGenerated?: (content: any) => void;
}

export function AIBlogPostGenerator({ onContentGenerated }: AIBlogPostGeneratorProps) {
  const [formData, setFormData] = useState<Partial<BlogPostRequest>>({
    topic: '',
    category: 'beauty',
    tone: 'luxury',
    wordCount: 800,
    language: 'en',
  });
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [copiedSection, setCopiedSection] = useState<string>('');

  const { generateBlogPost, isGenerating, error, data, reset } = useAIBlogPost();

  const handleInputChange = (field: keyof BlogPostRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    if (!formData.topic?.trim()) {
      return;
    }

    try {
      const result = await generateBlogPost(formData as BlogPostRequest);
      setGeneratedContent(result);
      onContentGenerated?.(result);
    } catch (error) {
      console.error('Failed to generate blog post:', error);
    }
  };

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const regenerateContent = () => {
    reset();
    setGeneratedContent(null);
    handleGenerate();
  };

  useEffect(() => {
    if (data) {
      setGeneratedContent(data);
    }
  }, [data]);

  const canGenerate = formData.topic?.trim() && formData.topic.length > 5;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            AI Blog Post Generator
          </CardTitle>
          <CardDescription>
            Generate high-quality blog posts with AI powered content creation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {/* Topic Input */}
            <div className="space-y-2">
              <Label htmlFor="topic">Topic *</Label>
              <Textarea
                id="topic"
                placeholder="Enter the main topic for your blog post..."
                value={formData.topic || ''}
                onChange={(e) => handleInputChange('topic', e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Title and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Custom Title (Optional)</Label>
                <Input
                  id="title"
                  placeholder="Leave empty for AI-generated title"
                  value={formData.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beauty">Beauty</SelectItem>
                    <SelectItem value="fitness">Fitness</SelectItem>
                    <SelectItem value="wellness">Wellness</SelectItem>
                    <SelectItem value="lifestyle">Lifestyle</SelectItem>
                    <SelectItem value="tutorials">Tutorials</SelectItem>
                    <SelectItem value="trends">Trends</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Target Audience and SEO Keywords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Input
                  id="targetAudience"
                  placeholder="e.g., Young professionals, luxury clients"
                  value={formData.targetAudience || ''}
                  onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoKeywords">SEO Keywords (comma-separated)</Label>
                <Input
                  id="seoKeywords"
                  placeholder="keyword1, keyword2, keyword3"
                  value={formData.seoKeywords?.join(', ') || ''}
                  onChange={(e) => handleInputChange('seoKeywords', e.target.value.split(',').map(k => k.trim()))}
                />
              </div>
            </div>

            {/* Settings Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select
                  value={formData.tone}
                  onValueChange={(value) => handleInputChange('tone', value)}
                >
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
                <Label>Language</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => handleInputChange('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="pl">Polish</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wordCount">Word Count</Label>
                <Input
                  id="wordCount"
                  type="number"
                  min="100"
                  max="2000"
                  value={formData.wordCount || 800}
                  onChange={(e) => handleInputChange('wordCount', parseInt(e.target.value))}
                />
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error.message || 'Failed to generate content. Please try again.'}
                </AlertDescription>
              </Alert>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Blog Post...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Blog Post
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Content Display */}
      {generatedContent && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Content</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={regenerateContent}>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
                <Button variant="outline" size="sm" onClick={reset}>
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
                <TabsTrigger value="meta">Meta</TabsTrigger>
                <TabsTrigger value="tags">Tags</TabsTrigger>
                <TabsTrigger value="json">JSON</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Title</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generatedContent.title, 'title')}
                    >
                      {copiedSection === 'title' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-lg font-semibold">{generatedContent.title}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Excerpt</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generatedContent.excerpt, 'excerpt')}
                    >
                      {copiedSection === 'excerpt' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-muted-foreground">{generatedContent.excerpt}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Full Content</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generatedContent.content, 'content')}
                    >
                      {copiedSection === 'content' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Textarea
                    value={generatedContent.content}
                    readOnly
                    rows={20}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Slug: {generatedContent.slug}</span>
                  <span>Reading time: {generatedContent.readingTime} min</span>
                </div>
              </TabsContent>

              <TabsContent value="seo" className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">SEO Title</Label>
                  <div className="flex items-center justify-between">
                    <p className="text-sm">{generatedContent.seoTitle}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generatedContent.seoTitle, 'seoTitle')}
                    >
                      {copiedSection === 'seoTitle' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {generatedContent.seoTitle.length}/60 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Meta Description</Label>
                  <div className="flex items-center justify-between">
                    <p className="text-sm">{generatedContent.metaDescription}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generatedContent.metaDescription, 'metaDescription')}
                    >
                      {copiedSection === 'metaDescription' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {generatedContent.metaDescription.length}/160 characters
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="tags" className="space-y-4">
                <Label className="text-sm font-medium">Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {generatedContent.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generatedContent.tags.join(', '), 'tags')}
                >
                  {copiedSection === 'tags' ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  Copy Tags
                </Button>
              </TabsContent>

              <TabsContent value="json" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Raw JSON</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(generatedContent, null, 2), 'json')}
                    >
                      {copiedSection === 'json' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Textarea
                    value={JSON.stringify(generatedContent, null, 2)}
                    readOnly
                    rows={20}
                    className="font-mono text-xs"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}