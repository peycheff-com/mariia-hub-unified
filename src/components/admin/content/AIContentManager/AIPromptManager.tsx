import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast aria-live="polite" aria-atomic="true" } from 'sonner';
import {
  Loader2,
  Save,
  Edit,
  Trash2,
  Copy,
  Plus,
  Search,
  Filter,
  Wand2,
  MessageSquare,
  FileText,
  Star,
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
  Textarea,
} from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ScrollArea,
} from '@/components/ui/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: 'blog-post' | 'service-description' | 'email' | 'social-media' | 'general';
  template: string;
  variables: string[];
  tone: 'professional' | 'friendly' | 'casual' | 'luxury';
  tags: string[];
  isFavorite: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface AIPromptManagerProps {
  onPromptSelect?: (prompt: string) => void;
}

export const AIPromptManager = React.memo<AIPromptManagerProps>(({ onPromptSelect }) => {
  const { t } = useTranslation();
  const [prompts, setPrompts] = useState<PromptTemplate[]>([
    {
      id: '1',
      name: 'Luxury Beauty Service Blog Post',
      description: 'Create an elegant blog post about beauty services',
      category: 'blog-post',
      template: `Write a luxurious blog post about {service_name} that embodies elegance and sophistication.

Target audience: {target_audience}
Key benefits to highlight: {key_benefits}
Call to action: {cta}

Tone: {tone}
Length: {word_count} words

Please include:
- Compelling introduction
- Detailed service description
- Benefits for clients
- Aftercare tips
- Booking information`,
      variables: ['service_name', 'target_audience', 'key_benefits', 'cta', 'tone', 'word_count'],
      tone: 'luxury',
      tags: ['beauty', 'blog', 'luxury', 'marketing'],
      isFavorite: true,
      usageCount: 15,
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20',
    },
    {
      id: '2',
      name: 'Fitness Program Description',
      description: 'Detailed description for fitness programs',
      category: 'service-description',
      template: `Create an engaging description for {program_name} fitness program.

Program focus: {program_focus}
Target audience: {target_audience}
Duration: {duration}
Price point: {price}

Include:
- Program overview
- Target audience benefits
- What to expect
- Pricing options
- Success stories`,
      variables: ['program_name', 'program_focus', 'target_audience', 'duration', 'price'],
      tone: 'professional',
      tags: ['fitness', 'description', 'program'],
      isFavorite: false,
      usageCount: 8,
      createdAt: '2024-01-10',
      updatedAt: '2024-01-18',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);
  const [formData, setFormData] = useState<Partial<PromptTemplate>>({
    name: '',
    description: '',
    category: 'blog-post',
    template: '',
    tone: 'luxury',
    tags: [],
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'blog-post', label: 'Blog Posts' },
    { value: 'service-description', label: 'Service Descriptions' },
    { value: 'email', label: 'Email Content' },
    { value: 'social-media', label: 'Social Media' },
    { value: 'general', label: 'General' },
  ];

  const tones = [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'casual', label: 'Casual' },
    { value: 'luxury', label: 'Luxury' },
  ];

  const filteredPrompts = prompts.filter((prompt) => {
    const matchesSearch = prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prompt.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSavePrompt = () => {
    if (!formData.name || !formData.template) {
      toast aria-live="polite" aria-atomic="true".error('Please fill in all required fields');
      return;
    }

    if (editingPrompt) {
      setPrompts(prompts.map(p =>
        p.id === editingPrompt.id
          ? { ...p, ...formData, updatedAt: new Date().toISOString() }
          : p
      ));
      toast aria-live="polite" aria-atomic="true".success('Prompt template updated');
    } else {
      const newPrompt: PromptTemplate = {
        id: Date.now().toString(),
        name: formData.name!,
        description: formData.description || '',
        category: formData.category as PromptTemplate['category'],
        template: formData.template!,
        variables: extractVariables(formData.template!),
        tone: formData.tone as PromptTemplate['tone'],
        tags: formData.tags || [],
        isFavorite: false,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setPrompts([...prompts, newPrompt]);
      toast aria-live="polite" aria-atomic="true".success('Prompt template created');
    }

    setIsCreateDialogOpen(false);
    setEditingPrompt(null);
    setFormData({
      name: '',
      description: '',
      category: 'blog-post',
      template: '',
      tone: 'luxury',
      tags: [],
    });
  };

  const handleDeletePrompt = (id: string) => {
    setPrompts(prompts.filter(p => p.id !== id));
    toast aria-live="polite" aria-atomic="true".success('Prompt template deleted');
  };

  const handleToggleFavorite = (id: string) => {
    setPrompts(prompts.map(p =>
      p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
    ));
  };

  const handleUsePrompt = (prompt: PromptTemplate) => {
    onPromptSelect?.(prompt.template);
    setPrompts(prompts.map(p =>
      p.id === prompt.id ? { ...p, usageCount: p.usageCount + 1 } : p
    ));
  };

  const handleCopyPrompt = (template: string) => {
    navigator.clipboard.writeText(template);
    toast aria-live="polite" aria-atomic="true".success('Prompt copied to clipboard');
  };

  const extractVariables = (template: string): string[] => {
    const matches = template.match(/\{([^}]+)\}/g);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  };

  const openEditDialog = (prompt: PromptTemplate) => {
    setEditingPrompt(prompt);
    setFormData(prompt);
    setIsCreateDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          {t('admin.ai.contentManager.promptManager')}
        </CardTitle>
        <CardDescription>
          Manage and reuse AI prompt templates for consistent content generation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Prompt
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingPrompt ? 'Edit Prompt Template' : 'Create New Prompt Template'}
                  </DialogTitle>
                  <DialogDescription>
                    Create reusable prompt templates for consistent AI content generation
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="prompt-name">Name *</Label>
                      <Input
                        id="prompt-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter prompt name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="prompt-category">Category</Label>
                      <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.slice(1).map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="prompt-description">Description</Label>
                    <Input
                      id="prompt-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of this prompt template"
                    />
                  </div>

                  <div>
                    <Label htmlFor="prompt-template">Template *</Label>
                    <Textarea
                      id="prompt-template"
                      value={formData.template}
                      onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                      placeholder="Enter your prompt template. Use {variable_name} for dynamic content..."
                      rows={8}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use {`{variable_name}`} for dynamic content that will be replaced during generation
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSavePrompt}>
                      <Save className="w-4 h-4 mr-2" />
                      {editingPrompt ? 'Update' : 'Create'} Prompt
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Prompt Templates */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Templates ({filteredPrompts.length})</TabsTrigger>
              <TabsTrigger value="favorites">Favorites ({filteredPrompts.filter(p => p.isFavorite).length})</TabsTrigger>
              <TabsTrigger value="recent">Recently Used</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <ScrollArea className="h-96">
                <div className="grid gap-4">
                  {filteredPrompts.map((prompt) => (
                    <Card key={prompt.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{prompt.name}</h3>
                            <Badge variant="outline">{prompt.category}</Badge>
                            {prompt.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                            <span className="text-xs text-muted-foreground">
                              Used {prompt.usageCount} times
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{prompt.description}</p>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {prompt.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Variables: {prompt.variables.join(', ') || 'None'}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button size="sm" variant="outline" onClick={() => handleUsePrompt(prompt)}>
                            <Wand2 className="w-3 h-3 mr-1" />
                            Use
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleCopyPrompt(prompt.template)}>
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(prompt)}>
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleToggleFavorite(prompt.id)}>
                            <Star className={`w-3 h-3 mr-1 ${prompt.isFavorite ? 'fill-current text-yellow-500' : ''}`} />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeletePrompt(prompt.id)}>
                            <Trash2 className="w-3 h-3 mr-1" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="favorites" className="space-y-4">
              <ScrollArea className="h-96">
                <div className="grid gap-4">
                  {filteredPrompts.filter(p => p.isFavorite).map((prompt) => (
                    <Card key={prompt.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{prompt.name}</h3>
                            <Badge variant="outline">{prompt.category}</Badge>
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          </div>
                          <p className="text-sm text-muted-foreground">{prompt.description}</p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button size="sm" onClick={() => handleUsePrompt(prompt)}>
                            <Wand2 className="w-3 h-3 mr-1" />
                            Use
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="recent" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Recently used prompts will appear here</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
});

AIPromptManager.displayName = 'AIPromptManager';