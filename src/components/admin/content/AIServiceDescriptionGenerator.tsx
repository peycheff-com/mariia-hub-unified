import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Wand2, Copy, CheckCircle, Plus, X } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAIServiceDescription } from '@/hooks/useAIContent';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ServiceDescriptionRequest } from '@/integrations/ai/service';

interface AIServiceDescriptionGeneratorProps {
  onContentGenerated?: (content: any) => void;
}

export function AIServiceDescriptionGenerator({ onContentGenerated }: AIServiceDescriptionGeneratorProps) {
  const [formData, setFormData] = useState<Partial<ServiceDescriptionRequest>>({
    serviceName: '',
    category: 'beauty',
    tone: 'luxury',
    wordCount: 400,
    language: 'en',
    includePreparation: true,
    includeAftercare: true,
  });
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [copiedSection, setCopiedSection] = useState<string>('');
  const [newFeature, setNewFeature] = useState('');
  const [newBenefit, setNewBenefit] = useState('');

  const { generateServiceDescription, isGenerating, error, data, reset } = useAIServiceDescription();

  const handleInputChange = (field: keyof ServiceDescriptionRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...(prev.features || []), newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== index)
    }));
  };

  const handleAddBenefit = () => {
    if (newBenefit.trim()) {
      setFormData(prev => ({
        ...prev,
        benefits: [...(prev.benefits || []), newBenefit.trim()]
      }));
      setNewBenefit('');
    }
  };

  const handleRemoveBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits?.filter((_, i) => i !== index)
    }));
  };

  const handleGenerate = async () => {
    if (!formData.serviceName?.trim()) {
      return;
    }

    try {
      const result = await generateServiceDescription(formData as ServiceDescriptionRequest);
      setGeneratedContent(result);
      onContentGenerated?.(result);
    } catch (error) {
      console.error('Failed to generate service description:', error);
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

  const canGenerate = formData.serviceName?.trim() && formData.serviceName.length > 2;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            AI Service Description Generator
          </CardTitle>
          <CardDescription>
            Create compelling service descriptions with AI-powered content generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {/* Service Name */}
            <div className="space-y-2">
              <Label htmlFor="serviceName">Service Name *</Label>
              <Input
                id="serviceName"
                placeholder="Enter the service name..."
                value={formData.serviceName || ''}
                onChange={(e) => handleInputChange('serviceName', e.target.value)}
              />
            </div>

            {/* Category and Target Audience */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Input
                  id="targetAudience"
                  placeholder="e.g., Luxury clients, athletes"
                  value={formData.targetAudience || ''}
                  onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                />
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <Label>Key Features</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a feature..."
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                />
                <Button type="button" variant="outline" onClick={handleAddFeature}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.features && formData.features.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {feature}
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              <Label>Key Benefits</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a benefit..."
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddBenefit()}
                />
                <Button type="button" variant="outline" onClick={handleAddBenefit}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.benefits && formData.benefits.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.benefits.map((benefit, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {benefit}
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefit(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Settings Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            {/* Word Count and Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wordCount">Word Count</Label>
                <Input
                  id="wordCount"
                  type="number"
                  min="100"
                  max="1000"
                  value={formData.wordCount || 400}
                  onChange={(e) => handleInputChange('wordCount', parseInt(e.target.value))}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="includePreparation"
                  checked={formData.includePreparation}
                  onCheckedChange={(checked) => handleInputChange('includePreparation', checked)}
                />
                <Label htmlFor="includePreparation">Include Preparation</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="includeAftercare"
                  checked={formData.includeAftercare}
                  onCheckedChange={(checked) => handleInputChange('includeAftercare', checked)}
                />
                <Label htmlFor="includeAftercare">Include Aftercare</Label>
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
                  Generating Service Description...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Service Description
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
              <CardTitle>Generated Service Description</CardTitle>
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
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="detailed">Detailed</TabsTrigger>
                <TabsTrigger value="benefits">Benefits</TabsTrigger>
                <TabsTrigger value="care">Care</TabsTrigger>
                <TabsTrigger value="faq">FAQ</TabsTrigger>
                <TabsTrigger value="json">JSON</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Short Description</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generatedContent.shortDescription, 'shortDescription')}
                    >
                      {copiedSection === 'shortDescription' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm">{generatedContent.shortDescription}</p>
                </div>
              </TabsContent>

              <TabsContent value="detailed" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Detailed Description</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generatedContent.detailedDescription, 'detailedDescription')}
                    >
                      {copiedSection === 'detailedDescription' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Textarea
                    value={generatedContent.detailedDescription}
                    readOnly
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">What to Expect</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generatedContent.whatToExpect, 'whatToExpect')}
                    >
                      {copiedSection === 'whatToExpect' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm">{generatedContent.whatToExpect}</p>
                </div>
              </TabsContent>

              <TabsContent value="benefits" className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Key Benefits</Label>
                  <div className="grid gap-2">
                    {generatedContent.keyBenefits.map((benefit: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generatedContent.keyBenefits.join('\n'), 'benefits')}
                  >
                    {copiedSection === 'benefits' ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    Copy Benefits
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="care" className="space-y-4">
                {generatedContent.preparation && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Preparation</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(generatedContent.preparation, 'preparation')}
                      >
                        {copiedSection === 'preparation' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm">{generatedContent.preparation}</p>
                  </div>
                )}

                {generatedContent.aftercare && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Aftercare</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(generatedContent.aftercare, 'aftercare')}
                      >
                        {copiedSection === 'aftercare' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm">{generatedContent.aftercare}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="faq" className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Frequently Asked Questions</Label>
                  <div className="space-y-4">
                    {generatedContent.faq.map((item: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{item.question}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(`${item.question}\n\n${item.answer}`, `faq-${index}`)}
                          >
                            {copiedSection === `faq-${index}` ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
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