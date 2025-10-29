import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Loader2,
  ImageIcon,
  Palette,
  Wand2,
  Download,
  RefreshCw,
  Settings,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Button,
} from '@/components/ui/button';
import {
  Input,
} from '@/components/ui/input';
import {
  Label,
} from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Textarea,
} from '@/components/ui/textarea';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Slider,
} from '@/components/ui/slider';

import { AIImageSuggestion } from './types';

interface AIImageGeneratorProps {
  content?: string;
  onImageGenerated?: (imageUrl: string) => void;
}

export const AIImageGenerator = React.memo<AIImageGeneratorProps>(({
  content,
  onImageGenerated,
}) => {
  const { t } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<'photorealistic' | 'illustration' | 'abstract' | 'luxury'>('luxury');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [quality, setQuality] = useState([80]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [suggestions, setSuggestions] = useState<AIImageSuggestion[]>([]);

  const presetStyles = [
    { value: 'photorealistic', label: 'Photorealistic', description: 'Realistic, high-quality photos' },
    { value: 'illustration', label: 'Illustration', description: 'Artistic illustrations and drawings' },
    { value: 'abstract', label: 'Abstract', description: 'Creative and artistic interpretations' },
    { value: 'luxury', label: 'Luxury', description: 'Elegant, premium aesthetic' },
  ];

  const aspectRatios = [
    { value: '16:9', label: 'Landscape (16:9)' },
    { value: '4:3', label: 'Standard (4:3)' },
    { value: '1:1', label: 'Square (1:1)' },
    { value: '9:16', label: 'Portrait (9:16)' },
  ];

  const generateSuggestions = () => {
    const aiSuggestions: AIImageSuggestion[] = [
      {
        prompt: 'Elegant beauty salon with soft lighting and modern decor',
        style: 'luxury',
        keywords: ['beauty', 'salon', 'luxury', 'modern'],
        composition: 'Wide angle shot with depth of field',
      },
      {
        prompt: 'Fitness professional helping client with exercise',
        style: 'photorealistic',
        keywords: ['fitness', 'training', 'professional', 'health'],
        composition: 'Medium shot with dynamic action',
      },
      {
        prompt: 'Spa treatment scene with candles and relaxation elements',
        style: 'photorealistic',
        keywords: ['spa', 'relaxation', 'wellness', 'treatment'],
        composition: 'Close-up with soft focus background',
      },
    ];
    setSuggestions(aiSuggestions);
  };

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt for image generation');
      return;
    }

    setIsGenerating(true);
    try {
      // NOTE: AI image generation pending - requires AI service integration
      // TODO: Implement actual AI image generation with proper error handling
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockImageUrl = 'https://picsum.photos/800/600?random=' + Date.now();

      toast.success('Image generated successfully');
      onImageGenerated?.(mockImageUrl);
    } catch (error) {
      console.error('Image generation failed:', error);
      toast.error('Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplySuggestion = (suggestion: AIImageSuggestion) => {
    setPrompt(suggestion.prompt);
    setStyle(suggestion.style);
    setKeywords(suggestion.keywords);
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  React.useEffect(() => {
    if (content) {
      // Extract keywords from content
      const words = content.split(' ').filter(word => word.length > 4).slice(0, 5);
      setKeywords(words);
    }
    generateSuggestions();
  }, [content]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          {t('admin.ai.contentManager.aiImageGenerator')}
        </CardTitle>
        <CardDescription>
          Generate stunning images for your content using AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Prompt Input */}
        <div className="space-y-2">
          <Label htmlFor="image-prompt">Image Description</Label>
          <Textarea
            id="image-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            rows={3}
          />
        </div>

        {/* Style Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Style</Label>
            <Select value={style} onValueChange={(value: any) => setStyle(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {presetStyles.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    <div>
                      <div className="font-medium">{preset.label}</div>
                      <div className="text-xs text-muted-foreground">{preset.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Aspect Ratio</Label>
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {aspectRatios.map((ratio) => (
                  <SelectItem key={ratio.value} value={ratio.value}>
                    {ratio.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Keywords */}
        <div className="space-y-2">
          <Label>Keywords</Label>
          <div className="flex gap-2">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Add keyword..."
              onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
            />
            <Button onClick={handleAddKeyword} size="sm">
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <Badge key={keyword} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveKeyword(keyword)}>
                {keyword} ×
              </Badge>
            ))}
          </div>
        </div>

        {/* Quality Slider */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Quality</Label>
            <span className="text-sm text-muted-foreground">{quality[0]}%</span>
          </div>
          <Slider
            value={quality}
            onValueChange={setQuality}
            max={100}
            min={10}
            step={10}
            className="mt-2"
          />
        </div>

        {/* AI Suggestions */}
        <div className="space-y-3">
          <Label>AI Suggestions</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestions.map((suggestion, index) => (
              <Card key={index} className="p-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleApplySuggestion(suggestion)}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {suggestion.style}
                    </Badge>
                    <Wand2 className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm line-clamp-2">{suggestion.prompt}</p>
                  <div className="flex flex-wrap gap-1">
                    {suggestion.keywords.slice(0, 3).map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <Button onClick={handleGenerateImage} disabled={isGenerating} className="w-full">
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Image...
            </>
          ) : (
            <>
              <Palette className="w-4 h-4 mr-2" />
              Generate Image
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
});

AIImageGenerator.displayName = 'AIImageGenerator';