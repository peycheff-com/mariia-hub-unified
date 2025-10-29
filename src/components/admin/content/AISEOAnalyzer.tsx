import React, { useState } from 'react';
import {
  Search,
  TrendingUp,
  Target,
  CheckCircle,
  AlertTriangle,
  Info,
  FileText,
  Globe,
  BarChart3,
  Download,
  RefreshCw,
  Eye,
  Clock,
  Users,
  Link,
  Zap,
  Star
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useSEOAnalyzer } from '@/integrations/ai/seo-analyzer.ts';

export function AISEOAnalyzer() {
  const [activeTab, setActiveTab] = useState('analyze');
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [keywords, setKeywords] = useState('');
  const [contentType, setContentType] = useState('blog-post');
  const [targetLocation, setTargetLocation] = useState('');

  const {
    analyzeSEO,
    generateSEOContent,
    analyzeCompetitors,
    generateSchema,
    isAnalyzing,
    error
  } = useSEOAnalyzer();

  const handleAnalyze = async () => {
    if (!content.trim()) {
      return;
    }

    try {
      const result = await analyzeSEO({
        url: url || undefined,
        content,
        title: title || undefined,
        keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
        targetLocation: targetLocation || undefined,
        contentType: contentType as any
      });

      // Handle analysis result
      console.log('SEO Analysis Result:', result);
    } catch (error) {
      console.error('SEO analysis failed:', error);
    }
  };

  const sampleAnalysisResult = {
    overallScore: 78,
    scores: {
      technical: 85,
      content: 72,
      performance: 68,
      authority: 82
    },
    issues: [
      {
        type: 'warning',
        category: 'content',
        title: 'Meta description too long',
        description: 'Your meta description is 165 characters, which exceeds the recommended 160 characters.',
        impact: 'medium',
        recommendation: 'Shorten your meta description to 155-160 characters for optimal display in search results.'
      },
      {
        type: 'error',
        category: 'technical',
        title: 'Missing H1 tag',
        description: 'No H1 tag found on the page.',
        impact: 'high',
        recommendation: 'Add a single H1 tag that includes your primary keyword.'
      }
    ],
    opportunities: [
      {
        title: 'Optimize for featured snippets',
        description: 'Structure your content with clear headings and lists to increase chances of appearing in featured snippets.',
        potentialImpact: 'High',
        difficulty: 'Easy'
      }
    ],
    keywordAnalysis: {
      primary: 'beauty treatments warsaw',
      secondary: ['cosmetic procedures', 'beauty salon', 'aesthetic medicine'],
      density: {
        'beauty treatments warsaw': 2.1,
        'cosmetic procedures': 1.8,
        'beauty salon': 1.5
      },
      suggestions: ['luxury beauty services', 'premium spa treatments', 'advanced aesthetics']
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI SEO Analyzer</h2>
          <p className="text-muted-foreground">
            Analyze and optimize your content for better search rankings
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analyze">Analyze</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Analysis</CardTitle>
              <CardDescription>
                Enter your content to get comprehensive SEO analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="url">Page URL (optional)</Label>
                  <Input
                    id="url"
                    placeholder="https://example.com/page"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="content-type">Content Type</Label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blog-post">Blog Post</SelectItem>
                      <SelectItem value="service-page">Service Page</SelectItem>
                      <SelectItem value="landing-page">Landing Page</SelectItem>
                      <SelectItem value="product-page">Product Page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="title">Page Title</Label>
                <Input
                  id="title"
                  placeholder="Enter page title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="keywords">Target Keywords (comma-separated)</Label>
                <Input
                  id="keywords"
                  placeholder="beauty treatments, cosmetic procedures, warsaw"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Paste your content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                />
              </div>

              <Button onClick={handleAnalyze} disabled={isAnalyzing || !content.trim()} className="w-full">
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Analyze SEO
                  </>
                )}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error.message}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {content && (
            <div className="space-y-6">
              {/* Overall Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    SEO Score Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Score</span>
                      <span className="text-2xl font-bold text-green-600">78/100</span>
                    </div>
                    <Progress value={78} className="h-2" />

                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">85</div>
                        <div className="text-xs text-muted-foreground">Technical</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-yellow-600">72</div>
                        <div className="text-xs text-muted-foreground">Content</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-orange-600">68</div>
                        <div className="text-xs text-muted-foreground">Performance</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">82</div>
                        <div className="text-xs text-muted-foreground">Authority</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Issues and Recommendations */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Issues Found</CardTitle>
                    <CardDescription>Items that need attention</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {sampleAnalysisResult.issues.map((issue, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                        <div className="mt-0.5">
                          {issue.type === 'error' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          {issue.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                          {issue.type === 'info' && <Info className="h-4 w-4 text-blue-500" />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{issue.title}</p>
                            <Badge variant={issue.impact === 'high' ? 'destructive' : issue.impact === 'medium' ? 'default' : 'secondary'}>
                              {issue.impact}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{issue.description}</p>
                          <p className="text-xs">{issue.recommendation}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Opportunities</CardTitle>
                    <CardDescription>Ways to improve your SEO</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {sampleAnalysisResult.opportunities.map((opportunity, index) => (
                      <div key={index} className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-sm">{opportunity.title}</p>
                          <Badge variant="secondary">{opportunity.difficulty}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{opportunity.description}</p>
                        <p className="text-xs font-medium text-green-600">Impact: {opportunity.potentialImpact}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Keyword Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Keyword Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Primary Keyword</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-sm px-3 py-1">
                          {sampleAnalysisResult.keywordAnalysis.primary}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Density: {sampleAnalysisResult.keywordAnalysis_density[sampleAnalysisResult.keywordAnalysis.primary]}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Secondary Keywords</p>
                      <div className="flex flex-wrap gap-2">
                        {sampleAnalysisResult.keywordAnalysis.secondary.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {keyword} ({sampleAnalysisResult.keywordAnalysis_density[keyword]}%)
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Suggested Keywords</p>
                      <div className="flex flex-wrap gap-2">
                        {sampleAnalysisResult.keywordAnalysis.suggestions.map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO-Optimized Content Generator</CardTitle>
              <CardDescription>
                Generate content that's optimized for search engines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Summer Beauty Trends 2024"
                  />
                </div>
                <div>
                  <Label htmlFor="audience">Target Audience</Label>
                  <Input
                    id="audience"
                    placeholder="e.g., Women 25-45 interested in premium beauty"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="gen-keywords">Target Keywords</Label>
                <Input
                  id="gen-keywords"
                  placeholder="beauty trends, summer makeup, premium cosmetics"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="word-count">Word Count</Label>
                  <Select defaultValue="1000">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="500">500 words</SelectItem>
                      <SelectItem value="1000">1000 words</SelectItem>
                      <SelectItem value="1500">1500 words</SelectItem>
                      <SelectItem value="2000">2000 words</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tone">Tone</Label>
                  <Select defaultValue="professional">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Generate SEO Content
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Competitor Analysis</CardTitle>
              <CardDescription>
                Analyze your competitors and discover opportunities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="competitor-keyword">Target Keyword</Label>
                  <Input
                    id="competitor-keyword"
                    placeholder="beauty salon warsaw"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="Warsaw, Poland"
                  />
                </div>
              </div>

              <Button className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Analyze Competitors
              </Button>
            </CardContent>
          </Card>

          {/* Sample Competitor Results */}
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Competitor #{i}</CardTitle>
                      <CardDescription>beauty-warsaw.com</CardDescription>
                    </div>
                    <Badge variant="secondary">Score: 82</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-sm font-medium">Content</div>
                      <div className="text-lg text-green-600">88</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Backlinks</div>
                      <div className="text-lg">245</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Domain Auth</div>
                      <div className="text-lg">67</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Social</div>
                      <div className="text-lg">1.2k</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Schema Markup Generator
                </CardTitle>
                <CardDescription>
                  Generate structured data for rich snippets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select schema type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="local-business">Local Business</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="w-full">
                  <Zap className="h-4 w-4 mr-2" />
                  Generate Schema
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  SERP Preview
                </CardTitle>
                <CardDescription>
                  See how your page appears in search results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 p-3 bg-muted rounded-lg">
                  <div className="text-blue-600 text-sm hover:underline cursor-pointer">
                    Your Page Title - 60 Characters Max
                  </div>
                  <div className="text-green-700 text-sm">
                    https://yourwebsite.com/your-page-url
                  </div>
                  <div className="text-gray-600 text-sm">
                    Your meta description appears here. Keep it under 160 characters for best results...
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}