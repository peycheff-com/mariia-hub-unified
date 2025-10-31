import { useState, useEffect } from "react";
import {
  BarChart3,
  FlaskConical,
  Lightbulb,
  Play,
  Pause,
  StopCircle,
  TrendingUp,
  Target,
  Eye,
  Users,
  MousePointer,
  ChevronDown,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Copy,
  Plus
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import {
  getABTestingService,
  ABTestSuggestion,
  ABTestCampaign,
  generateTitleVariations,
  generateCTAVariations
} from "@/services/aiABTestingService";
import { logger } from "@/lib/logger";

const AIABTesting = () => {
  const [suggestions, setSuggestions] = useState<ABTestSuggestion[]>([]);
  const [campaigns, setCampaigns] = useState<ABTestCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [testTitle, setTestTitle] = useState("");
  const [testContent, setTestContent] = useState("");
  const [testType, setTestType] = useState<"title" | "cta" | "description">("title");
  const [originalText, setOriginalText] = useState("");
  const [generatedVariations, setGeneratedVariations] = useState<string[]>([]);
  const [selectedVariations, setSelectedVariations] = useState<string[]>([]);
  const [testGoal, setTestGoal] = useState<'booking' | 'purchase' | 'newsletter' | 'consultation'>('booking');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { toast } = useToast();

  // Load campaigns on mount
  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      // In real implementation, fetch from database
      const mockCampaigns: ABTestCampaign[] = [
        {
          id: '1',
          name: 'Blog Title Test - Winter Skincare',
          contentId: 'blog-123',
          variants: [
            { id: 'v1', name: 'Original', content: { title: 'Winter Skincare Tips' }, traffic: 50 },
            { id: 'v2', name: 'Variant A', content: { title: '7 Winter Skincare Secrets' }, traffic: 50 }
          ],
          status: 'running',
          metrics: {
            impressions: 1250,
            conversions: 85,
            conversionRate: 6.8,
            avgTimeOnPage: 185,
            bounceRate: 42
          },
          createdAt: '2024-01-10',
          startedAt: '2024-01-11',
          winner: {
            variantId: 'v2',
            confidence: 92,
            improvement: 24
          }
        }
      ];
      setCampaigns(mockCampaigns);
    } catch (error) {
      logger.error('Error loading campaigns:', error);
    }
  };

  const generateVariations = async () => {
    if (!originalText.trim()) {
      toast({
        title: "Error",
        description: "Please enter original text to test",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let variations: string[] = [];

      if (testType === 'title') {
        variations = await generateTitleVariations(originalText, 'blog');
      } else if (testType === 'cta') {
        variations = await generateCTAVariations(originalText, 'Blog post about skincare', testGoal);
      }

      setGeneratedVariations(variations);
      toast({
        title: "Success",
        description: `Generated ${variations.length} variations`
      });
    } catch (error) {
      logger.error('Error generating variations:', error);
      toast({
        title: "Error",
        description: "Failed to generate variations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTest = async () => {
    if (!testTitle.trim() || selectedVariations.length < 2) {
      toast({
        title: "Error",
        description: "Please provide test title and select at least 2 variations",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const service = getABTestingService();
      const allVariants = [originalText, ...selectedVariations];

      const campaign = await service.createTestCampaign(
        testTitle,
        'content-123',
        allVariants.map(v => ({ title: v })),
        `Testing which ${testType} performs better for ${testGoal} conversion`
      );

      setCampaigns(prev => [campaign, ...prev]);
      toast({
        title: "Success",
        description: "A/B test created successfully"
      });

      // Reset form
      setTestTitle("");
      setOriginalText("");
      setSelectedVariations([]);
      setGeneratedVariations([]);
    } catch (error) {
      logger.error('Error creating test:', error);
      toast({
        title: "Error",
        description: "Failed to create test",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCampaign = async (campaignId: string, action: 'start' | 'pause' | 'stop') => {
    try {
      // Update campaign status
      setCampaigns(prev =>
        prev.map(c =>
          c.id === campaignId
            ? {
                ...c,
                status: action === 'start' ? 'running' : action === 'pause' ? 'paused' : 'completed',
                completedAt: action === 'stop' ? new Date().toISOString() : c.completedAt
              }
            : c
        )
      );

      toast({
        title: "Success",
        description: `Campaign ${action}ed`
      });
    } catch (error) {
      logger.error('Error toggling campaign:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 95) return 'text-green-600';
    if (confidence >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FlaskConical className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-serif">AI A/B Testing</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{campaigns.filter(c => c.status === 'running').length} Active</Badge>
          <Button onClick={loadCampaigns} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Create Test</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Create Test */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create New A/B Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="testTitle">Test Name</Label>
                  <Input
                    id="testTitle"
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    placeholder="e.g., Blog Title Test - Skincare Tips"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="testType">Test Type</Label>
                  <Select value={testType} onValueChange={(value: any) => setTestType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="title">Title/Headline</SelectItem>
                      <SelectItem value="cta">Call to Action</SelectItem>
                      <SelectItem value="description">Description</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {testType === 'cta' && (
                <div className="space-y-2">
                  <Label htmlFor="testGoal">Conversion Goal</Label>
                  <Select value={testGoal} onValueChange={(value: any) => setTestGoal(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="booking">Booking</SelectItem>
                      <SelectItem value="purchase">Purchase</SelectItem>
                      <SelectItem value="newsletter">Newsletter Signup</SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="originalText">Original {testType.charAt(0).toUpperCase() + testType.slice(1)} *</Label>
                <Textarea
                  id="originalText"
                  value={originalText}
                  onChange={(e) => setOriginalText(e.target.value)}
                  placeholder={`Enter the original ${testType}...`}
                  rows={testType === 'description' ? 4 : 2}
                />
              </div>

              <Button onClick={generateVariations} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Generate AI Variations
                  </>
                )}
              </Button>

              {generatedVariations.length > 0 && (
                <div className="space-y-4">
                  <Label>Select Variations to Test</Label>
                  <div className="space-y-3">
                    {generatedVariations.map((variation, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                        <input
                          type="checkbox"
                          id={`variation-${idx}`}
                          checked={selectedVariations.includes(variation)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedVariations([...selectedVariations, variation]);
                            } else {
                              setSelectedVariations(selectedVariations.filter(v => v !== variation));
                            }
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label htmlFor={`variation-${idx}`} className="font-medium">
                            Variation {idx + 1}
                          </Label>
                          <p className="text-sm mt-1">{variation}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start">
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Advanced Settings
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Traffic Split (%)</Label>
                          <Input
                            type="number"
                            defaultValue="50"
                            placeholder="50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Test Duration</Label>
                          <Select defaultValue="7">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3">3 days</SelectItem>
                              <SelectItem value="7">7 days</SelectItem>
                              <SelectItem value="14">14 days</SelectItem>
                              <SelectItem value="30">30 days</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="autoStop" />
                        <Label htmlFor="autoStop">Auto-stop when statistical significance reached</Label>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <Button onClick={createTest} disabled={loading} className="w-full">
                    <Play className="w-4 h-4 mr-2" />
                    Create A/B Test
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns */}
        <TabsContent value="campaigns" className="space-y-4">
          {campaigns.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <FlaskConical className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No A/B tests created yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                        <div className="flex gap-1">
                          {campaign.status === 'draft' && (
                            <Button
                              size="sm"
                              onClick={() => toggleCampaign(campaign.id, 'start')}
                            >
                              <Play className="w-3 h-3" />
                            </Button>
                          )}
                          {campaign.status === 'running' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleCampaign(campaign.id, 'pause')}
                              >
                                <Pause className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => toggleCampaign(campaign.id, 'stop')}
                              >
                                <StopCircle className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          {campaign.status === 'paused' && (
                            <Button
                              size="sm"
                              onClick={() => toggleCampaign(campaign.id, 'start')}
                            >
                              <Play className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Variants Performance */}
                    <div className="grid grid-cols-2 gap-4">
                      {campaign.variants.map((variant) => (
                        <div key={variant.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{variant.name}</span>
                            {campaign.winner?.variantId === variant.id && (
                              <Badge className="bg-green-100 text-green-800">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Winner
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mb-3">
                            {variant.content.title || variant.content}
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Traffic:</span>
                              <span>{variant.traffic}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Conversions:</span>
                              <span>{Math.floor(campaign.metrics.conversions * (variant.traffic / 100))}</span>
                            </div>
                            <div className="flex justify-between text-sm font-medium">
                              <span>CR:</span>
                              <span>{(campaign.metrics.conversionRate * (variant.traffic / 100)).toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Impressions</p>
                        <p className="text-lg font-bold">{campaign.metrics.impressions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Conversions</p>
                        <p className="text-lg font-bold">{campaign.metrics.conversions}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Time on Page</p>
                        <p className="text-lg font-bold">{campaign.metrics.avgTimeOnPage}s</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Bounce Rate</p>
                        <p className="text-lg font-bold">{campaign.metrics.bounceRate}%</p>
                      </div>
                    </div>

                    {/* Winner Announcement */}
                    {campaign.winner && (
                      <Alert>
                        <CheckCircle className="w-4 h-4" />
                        <AlertDescription>
                          <strong>Statistical Significance Reached!</strong> Variant is winning with{' '}
                          <span className={getConfidenceColor(campaign.winner.confidence)}>
                            {campaign.winner.confidence}% confidence
                          </span>
                          . Expected lift: <strong>{campaign.winner.improvement}%</strong>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Insights */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Testing Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">24%</div>
                  <div className="text-sm text-muted-foreground">Avg Improvement</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">92%</div>
                  <div className="text-sm text-muted-foreground">Confidence Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">5.2 days</div>
                  <div className="text-sm text-muted-foreground">Avg Test Duration</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Key Learnings</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <p className="text-sm">Numbers in headlines perform 23% better than descriptive titles</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <p className="text-sm">Questions in CTAs increase click-through rate by 18%</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <p className="text-sm">Benefit-driven descriptions outperform feature-focused ones</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Recommended Tests</h4>
                <div className="space-y-2">
                  <Alert>
                    <Target className="w-4 h-4" />
                    <AlertDescription>
                      Test urgency elements in CTAs for time-sensitive services
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <Eye className="w-4 h-4" />
                    <AlertDescription>
                      A/B test different hero image styles (studio vs lifestyle)
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIABTesting;