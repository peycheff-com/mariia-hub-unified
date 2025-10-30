import React, { useState } from 'react';
import {
  FileText,
  MessageSquare,
  Share2,
  Plus,
  Search,
  Star,
  Copy,
  Edit,
  Trash2,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Clock,
  User
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
import { useAITemplateSystem } from '@/integrations/ai/template-system.hook';

export function AITemplateManager() {
  const [activeTab, setActiveTab] = useState('library');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const {
    templates,
    customTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    generateFromTemplate,
    isGenerating
  } = useAITemplateSystem();

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateTemplate = async (templateData) => {
    try {
      await createTemplate(templateData);
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const handleGenerateContent = async (templateId, variables) => {
    try {
      const result = await generateFromTemplate(templateId, variables);
      // Handle generated content
      console.log('Generated content:', result);
    } catch (error) {
      console.error('Failed to generate content:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Template Manager</h2>
          <p className="text-muted-foreground">
            Create and manage content templates for consistent branding
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="library">Template Library</TabsTrigger>
          <TabsTrigger value="custom">Custom Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="blog-post">Blog Posts</SelectItem>
                <SelectItem value="service-description">Service Descriptions</SelectItem>
                <SelectItem value="social-media">Social Media</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="landing-page">Landing Pages</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {template.category === 'blog-post' && <FileText className="h-4 w-4" />}
                      {template.category === 'service-description' && <MessageSquare className="h-4 w-4" />}
                      {template.category === 'social-media' && <Share2 className="h-4 w-4" />}
                      <CardTitle className="text-sm">{template.name}</CardTitle>
                    </div>
                    <Badge variant={template.isCustom ? "default" : "secondary"}>
                      {template.isCustom ? "Custom" : "Default"}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{template.variables?.length || 0} variables</span>
                      <span>{template.usageCount || 0} uses</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleGenerateContent(template.id, {})}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <Clock className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <FileText className="h-3 w-3 mr-1" />
                        )}
                        Generate
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <div className="grid gap-4">
            {customTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Category: {template.category}</span>
                      <span>Used {template.usageCount || 0} times</span>
                      <span>Created {new Date(template.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="bg-muted p-3 rounded-md">
                      <code className="text-sm">{template.template}</code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{templates.length}</div>
                <p className="text-xs text-muted-foreground">
                  {customTemplates.length} custom
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usage This Month</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">156</div>
                <p className="text-xs text-muted-foreground">
                  +23% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.8</div>
                <p className="text-xs text-muted-foreground">
                  From 47 reviews
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12h</div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Template Performance</CardTitle>
              <CardDescription>
                Most used and highest-rated templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.slice(0, 5).map((template) => (
                  <div key={template.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{template.name}</p>
                      <p className="text-sm text-muted-foreground">{template.category}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <span className="font-medium">{template.usageCount || 0}</span> uses
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{template.rating || 4.5}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Template Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create New Template</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <CreateTemplateForm onSubmit={handleCreateTemplate} onCancel={() => setIsCreating(false)} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function CreateTemplateForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'blog-post',
    template: '',
    variables: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Template Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter template name"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe what this template is for"
          required
        />
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="blog-post">Blog Post</SelectItem>
            <SelectItem value="service-description">Service Description</SelectItem>
            <SelectItem value="social-media">Social Media</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="landing-page">Landing Page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="template">Template Content</Label>
        <Textarea
          id="template"
          value={formData.template}
          onChange={(e) => setFormData({ ...formData, template: e.target.value })}
          placeholder="Enter template content using {{variable}} syntax"
          rows={6}
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Use {'{{variable}}'} syntax for dynamic content
        </p>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          <Save className="h-4 w-4 mr-2" />
          Create Template
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}