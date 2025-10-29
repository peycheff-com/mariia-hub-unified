import React, { useState } from 'react';
import {
  Star,
  TrendingUp,
  Award,
  CheckCircle,
  AlertTriangle,
  Info,
  FileText,
  Target,
  Zap,
  BarChart3,
  Download,
  RefreshCw,
  Eye,
  Medal,
  Gem,
  Shield
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useAIQualityScorer } from '@/integrations/ai/quality-scoring.ts';

export function AIQualityScorer() {
  const [activeTab, setActiveTab] = useState('score');
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState('blog-post');

  const {
    scoreContent,
    getBenchmarkReport,
    certifyContent,
    isScoring,
    error
  } = useAIQualityScorer();

  const handleScore = async () => {
    if (!content.trim()) {
      return;
    }

    try {
      const result = await scoreContent({
        content,
        contentType: contentType as any,
        industry: 'beauty-fitness',
        targetAudience: 'premium-customers'
      });

      // Handle scoring result
      console.log('Quality Score Result:', result);
    } catch (error) {
      console.error('Quality scoring failed:', error);
    }
  };

  const sampleScoreResult = {
    overallScore: 87,
    scores: {
      readability: 92,
      engagement: 85,
      seo: 88,
      accuracy: 90,
      creativity: 82,
      professionalism: 86
    },
    strengths: [
      'Excellent readability score with clear sentence structure',
      'Strong use of emotional language that resonates with target audience',
      'Well-optimized for target keywords without sounding unnatural',
      'Accurate information and trustworthy tone'
    ],
    improvements: [
      'Consider adding more statistics to support claims',
      'Include a stronger call-to-action in the conclusion',
      'Add internal links to related services'
    ],
    certification: {
      level: 'gold',
      score: 87,
      criteria: {
        readability: { score: 92, weight: 0.2 },
        engagement: { score: 85, weight: 0.2 },
        seo: { score: 88, weight: 0.15 },
        accuracy: { score: 90, weight: 0.15 },
        creativity: { score: 82, weight: 0.15 },
        professionalism: { score: 86, weight: 0.15 }
      }
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <Gem className="h-4 w-4" />;
    if (score >= 80) return <Medal className="h-4 w-4" />;
    if (score >= 70) return <Award className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const getCertificationBadge = (level: string) => {
    const badges = {
      platinum: { icon: <Gem className="h-4 w-4" />, color: 'bg-purple-100 text-purple-800 border-purple-200' },
      gold: { icon: <Medal className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      silver: { icon: <Award className="h-4 w-4" />, color: 'bg-gray-100 text-gray-800 border-gray-200' },
      bronze: { icon: <Shield className="h-4 w-4" />, color: 'bg-orange-100 text-orange-800 border-orange-200' }
    };
    return badges[level] || badges.bronze;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Quality Scorer</h2>
          <p className="text-muted-foreground">
            Evaluate and certify your content quality with AI-powered analysis
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="score">Score Content</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="certification">Certification</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="score" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Quality Analysis</CardTitle>
              <CardDescription>
                Get comprehensive quality score and actionable insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="content-type-score">Content Type</Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog-post">Blog Post</SelectItem>
                    <SelectItem value="service-description">Service Description</SelectItem>
                    <SelectItem value="landing-page">Landing Page</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="social-media">Social Media</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="content-to-score">Content</Label>
                <Textarea
                  id="content-to-score"
                  placeholder="Paste your content here to analyze its quality..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                />
              </div>

              <Button onClick={handleScore} disabled={isScoring || !content.trim()} className="w-full">
                {isScoring ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Scoring...
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-2" />
                    Score Quality
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
                    Quality Score Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <div className={`text-6xl font-bold ${getScoreColor(sampleScoreResult.overallScore)}`}>
                          {sampleScoreResult.overallScore}
                        </div>
                        <div className="flex items-center justify-center gap-2 mt-2">
                          {getScoreIcon(sampleScoreResult.overallScore)}
                          <span className="text-lg font-medium">Quality Score</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Out of 100 points
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(sampleScoreResult.scores).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className={`text-sm font-bold ${getScoreColor(value)}`}>
                              {value}
                            </span>
                          </div>
                          <Progress value={value} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Strengths and Improvements */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Strengths
                    </CardTitle>
                    <CardDescription>What your content does well</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {sampleScoreResult.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      Improvements
                    </CardTitle>
                    <CardDescription>Areas for enhancement</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {sampleScoreResult.improvements.map((improvement, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Certification Badge */}
              <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Content Certification
                  </CardTitle>
                  <CardDescription>
                    Your content meets our quality standards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getCertificationBadge(sampleScoreResult.certification.level).color}`}>
                        {getCertificationBadge(sampleScoreResult.certification.level).icon}
                        <span className="font-medium capitalize">
                          {sampleScoreResult.certification.level} Certified
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Score: {sampleScoreResult.certification.score}/100
                      </div>
                    </div>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Certificate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="benchmarks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Industry Benchmarks</CardTitle>
              <CardDescription>
                Compare your content quality against industry standards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { category: 'Beauty Blogs', average: 78, top10: 92 },
                  { category: 'Service Descriptions', average: 82, top10: 94 },
                  { category: 'Social Media Content', average: 75, top10: 89 },
                  { category: 'Email Marketing', average: 80, top10: 91 }
                ].map((benchmark, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{benchmark.category}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span>Industry Avg: {benchmark.average}</span>
                        <span>Top 10%: {benchmark.top10}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2 relative">
                        <div
                          className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                          style={{ width: `${benchmark.average}%` }}
                        />
                      </div>
                      <div className="flex-1 bg-muted rounded-full h-2 relative">
                        <div
                          className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
                          style={{ width: `${benchmark.top10}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certification" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gem className="h-5 w-5" />
                  Platinum Certification
                </CardTitle>
                <CardDescription>
                  95+ score - Exceptional quality content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Outstanding readability and engagement</li>
                  <li>• Perfect SEO optimization</li>
                  <li>• Industry-leading creativity</li>
                  <li>• Trustworthy and accurate information</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Medal className="h-5 w-5" />
                  Gold Certification
                </CardTitle>
                <CardDescription>
                  85-94 score - High quality content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Excellent readability score</li>
                  <li>• Strong engagement factors</li>
                  <li>• Good SEO optimization</li>
                  <li>• Professional and trustworthy</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Silver Certification
                </CardTitle>
                <CardDescription>
                  75-84 score - Good quality content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Good readability</li>
                  <li>• Decent engagement</li>
                  <li>• Basic SEO optimization</li>
                  <li>• Minor improvements needed</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Bronze Certification
                </CardTitle>
                <CardDescription>
                  65-74 score - Meets minimum standards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Acceptable readability</li>
                  <li>• Some engagement elements</li>
                  <li>• Basic SEO present</li>
                  <li>• Several improvements needed</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Content Scored</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">234</div>
                <p className="text-xs text-muted-foreground">
                  +12% this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Score</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">82.3</div>
                <p className="text-xs text-muted-foreground">
                  +3.2 improvement
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Certified</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">189</div>
                <p className="text-xs text-muted-foreground">
                  81% certified
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gold Level</CardTitle>
                <Medal className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">67</div>
                <p className="text-xs text-muted-foreground">
                  35% of total
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quality Trends</CardTitle>
              <CardDescription>
                Track your content quality improvements over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
                <p className="text-muted-foreground">Quality score trends chart would appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}