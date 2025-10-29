import { aiService } from './config';

import { z } from 'zod';

// Template system for AI content generation
export const TemplateCategory = z.enum([
  'blog-post',
  'service-description',
  'social-media',
  'email-newsletter',
  'landing-page',
  'press-release',
  'testimonial',
  'faq',
  'case-study',
  'product-description',
]);

export type TemplateCategory = z.infer<typeof TemplateCategory>;

export interface AITemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  structure: TemplateStructure;
  variables: TemplateVariable[];
  examples: TemplateExample[];
  tags: string[];
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateStructure {
  sections: TemplateSection[];
}

export interface TemplateSection {
  id: string;
  name: string;
  type: 'heading' | 'paragraph' | 'list' | 'quote' | 'callout' | 'faq' | 'testimonial';
  required: boolean;
  repeatable: boolean;
  prompt: string;
  variables: string[];
  aiInstructions: string;
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date' | 'url';
  label: string;
  description: string;
  required: boolean;
  defaultValue?: any;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface TemplateExample {
  name: string;
  description: string;
  variables: Record<string, any>;
  generatedContent: string;
}

export class AITemplateSystem {
  private static instance: AITemplateSystem;
  private templates: Map<string, AITemplate> = new Map();
  private customTemplates: Map<string, AITemplate> = new Map();

  static getInstance(): AITemplateSystem {
    if (!AITemplateSystem.instance) {
      AITemplateSystem.instance = new AITemplateSystem();
      AITemplateSystem.instance.initializeDefaultTemplates();
    }
    return AITemplateSystem.instance;
  }

  private initializeDefaultTemplates(): void {
    // Blog Post Template
    const blogPostTemplate: AITemplate = {
      id: 'blog-post-standard',
      name: 'Standard Blog Post',
      category: 'blog-post',
      description: 'Professional blog post with SEO optimization',
      structure: {
        sections: [
          {
            id: 'title',
            name: 'Title',
            type: 'heading',
            required: true,
            repeatable: false,
            prompt: 'Generate an engaging, SEO-friendly title',
            variables: ['topic', 'targetAudience', 'tone'],
            aiInstructions: 'Include primary keyword naturally, keep under 60 characters, create curiosity',
          },
          {
            id: 'introduction',
            name: 'Introduction',
            type: 'paragraph',
            required: true,
            repeatable: false,
            prompt: 'Write a compelling introduction',
            variables: ['topic', 'targetAudience', 'mainBenefit'],
            aiInstructions: 'Hook the reader, state the problem/topic, preview what will be covered',
          },
          {
            id: 'main-content',
            name: 'Main Content',
            type: 'paragraph',
            required: true,
            repeatable: true,
            prompt: 'Develop the main content section',
            variables: ['keyPoints', 'details', 'examples'],
            aiInstructions: 'Use subheadings, include bullet points, provide valuable information',
          },
          {
            id: 'conclusion',
            name: 'Conclusion',
            type: 'paragraph',
            required: true,
            repeatable: false,
            prompt: 'Write a strong conclusion',
            variables: ['summary', 'callToAction', 'nextSteps'],
            aiInstructions: 'Summarize key points, include call to action, encourage engagement',
          },
        ],
      },
      variables: [
        {
          name: 'topic',
          type: 'text',
          label: 'Main Topic',
          description: 'The primary subject of the blog post',
          required: true,
        },
        {
          name: 'targetAudience',
          type: 'select',
          label: 'Target Audience',
          description: 'Who are you writing for?',
          required: true,
          options: ['Beginners', 'Advanced Users', 'Professionals', 'General Audience'],
          defaultValue: 'General Audience',
        },
        {
          name: 'tone',
          type: 'select',
          label: 'Tone',
          description: 'The writing style',
          required: true,
          options: ['Professional', 'Friendly', 'Casual', 'Luxury', 'Educational'],
          defaultValue: 'Professional',
        },
        {
          name: 'wordCount',
          type: 'number',
          label: 'Word Count',
          description: 'Target word count',
          required: false,
          defaultValue: 1000,
          validation: { min: 300, max: 3000 },
        },
      ],
      examples: [
        {
          name: 'Beauty Tips Example',
          description: 'Example for beauty tips blog post',
          variables: {
            topic: 'Summer Skincare Tips',
            targetAudience: 'Beginners',
            tone: 'Friendly',
            wordCount: 800,
          },
          generatedContent: 'Generated content would appear here...',
        },
      ],
      tags: ['blog', 'seo', 'content', 'marketing'],
      isActive: true,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Service Description Template
    const serviceDescriptionTemplate: AITemplate = {
      id: 'service-description-luxury',
      name: 'Luxury Service Description',
      category: 'service-description',
      description: 'Premium service description for high-end offerings',
      structure: {
        sections: [
          {
            id: 'overview',
            name: 'Service Overview',
            type: 'paragraph',
            required: true,
            repeatable: false,
            prompt: 'Write a compelling service overview',
            variables: ['serviceName', 'category', 'uniqueValue'],
            aiInstructions: 'Focus on luxury and exclusivity, emphasize benefits over features',
          },
          {
            id: 'benefits',
            name: 'Key Benefits',
            type: 'list',
            required: true,
            repeatable: false,
            prompt: 'List 4-6 key benefits',
            variables: ['benefits'],
            aiInstructions: 'Focus on transformation and results, use emotional language',
          },
          {
            id: 'process',
            name: 'Service Process',
            type: 'paragraph',
            required: true,
            repeatable: false,
            prompt: 'Describe the service process',
            variables: ['duration', 'steps'],
            aiInstructions: 'Make it sound luxurious and relaxing, manage expectations',
          },
          {
            id: 'faq',
            name: 'FAQ Section',
            type: 'faq',
            required: false,
            repeatable: true,
            prompt: 'Generate FAQ items',
            variables: ['commonQuestions'],
            aiInstructions: 'Address common concerns, build trust',
          },
        ],
      },
      variables: [
        {
          name: 'serviceName',
          type: 'text',
          label: 'Service Name',
          description: 'Name of the service',
          required: true,
        },
        {
          name: 'category',
          type: 'select',
          label: 'Category',
          description: 'Service category',
          required: true,
          options: ['Beauty', 'Fitness', 'Wellness', 'Lifestyle'],
        },
        {
          name: 'price',
          type: 'number',
          label: 'Price',
          description: 'Service price',
          required: false,
        },
        {
          name: 'duration',
          type: 'number',
          label: 'Duration (minutes)',
          description: 'Service duration',
          required: true,
          defaultValue: 60,
        },
      ],
      examples: [],
      tags: ['service', 'luxury', 'premium', 'description'],
      isActive: true,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Social Media Template
    const socialMediaTemplate: AITemplate = {
      id: 'social-media-engagement',
      name: 'Engaging Social Media Post',
      category: 'social-media',
      description: 'High-engagement social media content',
      structure: {
        sections: [
          {
            id: 'hook',
            name: 'Hook',
            type: 'paragraph',
            required: true,
            repeatable: false,
            prompt: 'Create an attention-grabbing hook',
            variables: ['topic', 'hookType'],
            aiInstructions: 'Use questions, statistics, or bold statements, keep it short',
          },
          {
            id: 'content',
            name: 'Main Content',
            type: 'paragraph',
            required: true,
            repeatable: false,
            prompt: 'Write the main content',
            variables: ['message', 'value'],
            aiInstructions: 'Be concise, use emojis strategically, include relevant hashtags',
          },
          {
            id: 'cta',
            name: 'Call to Action',
            type: 'paragraph',
            required: true,
            repeatable: false,
            prompt: 'Add call to action',
            variables: ['action'],
            aiInstructions: 'Clear and direct, create urgency if appropriate',
          },
        ],
      },
      variables: [
        {
          name: 'platform',
          type: 'select',
          label: 'Platform',
          description: 'Social media platform',
          required: true,
          options: ['Instagram', 'Facebook', 'Twitter', 'LinkedIn', 'TikTok'],
        },
        {
          name: 'hookType',
          type: 'select',
          label: 'Hook Type',
          description: 'Type of hook to use',
          required: true,
          options: ['Question', 'Statistic', 'Bold Statement', 'Story', 'Tip'],
        },
        {
          name: 'hashtags',
          type: 'multiselect',
          label: 'Hashtags',
          description: 'Relevant hashtags',
          required: false,
          options: ['#BeautyWarsaw', '#FitnessPoland', '#LuxuryLifestyle', '#SelfCare'],
        },
      ],
      examples: [],
      tags: ['social', 'engagement', 'marketing', 'content'],
      isActive: true,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store templates
    this.templates.set(blogPostTemplate.id, blogPostTemplate);
    this.templates.set(serviceDescriptionTemplate.id, serviceDescriptionTemplate);
    this.templates.set(socialMediaTemplate.id, socialMediaTemplate);
  }

  async generateFromTemplate(
    templateId: string,
    variables: Record<string, any>,
    options?: {
      language?: string;
      creativity?: number;
      examples?: boolean;
    }
  ): Promise<{
    content: string;
    metadata: {
      templateUsed: string;
      generatedAt: string;
      variables: Record<string, any>;
      sections: Array<{
        id: string;
        name: string;
        content: string;
      }>;
    };
  }> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const sections = [];
    let fullContent = '';

    // Increment usage count
    template.usageCount++;
    template.updatedAt = new Date().toISOString();

    for (const section of template.structure.sections) {
      if (section.required || this.shouldGenerateSection(section, variables)) {
        const sectionContent = await this.generateSectionContent(
          section,
          variables,
          options
        );

        sections.push({
          id: section.id,
          name: section.name,
          content: sectionContent,
        });

        fullContent += sectionContent + '\n\n';
      }
    }

    return {
      content: fullContent.trim(),
      metadata: {
        templateUsed: templateId,
        generatedAt: new Date().toISOString(),
        variables,
        sections,
      },
    };
  }

  private async generateSectionContent(
    section: any,
    variables: Record<string, any>,
    options?: any
  ): Promise<string> {
    if (!aiService) {
      throw new Error('AI service not available');
    }

    // Build context for AI
    const context = {
      variables,
      instructions: section.aiInstructions,
      type: section.type,
      examples: options?.examples,
    };

    const prompt = this.buildPrompt(section, context, options);

    try {
      const response = await aiService['generateContent'](
        prompt,
        'You are a professional content writer following the provided template structure.',
        options?.creativity || 0.7,
        2000
      );

      return response;
    } catch (error) {
      console.error('Failed to generate section content:', error);
      throw new Error('Failed to generate content from template');
    }
  }

  private buildPrompt(section: any, context: any, options?: any): string {
    let prompt = `Generate content for section: ${section.name}\n\n`;
    prompt += `Section Type: ${section.type}\n`;
    prompt += `Instructions: ${section.aiInstructions}\n\n`;

    // Add variables
    if (Object.keys(context.variables).length > 0) {
      prompt += 'Available Variables:\n';
      Object.entries(context.variables).forEach(([key, value]) => {
        prompt += `- ${key}: ${value}\n`;
      });
      prompt += '\n';
    }

    prompt += `Prompt: ${section.prompt}\n\n`;

    if (options?.language) {
      prompt += `Language: ${options.language}\n`;
    }

    // Add section-specific instructions
    switch (section.type) {
      case 'heading':
        prompt += 'Generate a compelling heading. Keep it concise but impactful.\n';
        break;
      case 'paragraph':
        prompt += 'Write a well-structured paragraph. Use clear sentences and good flow.\n';
        break;
      case 'list':
        prompt += 'Format as a bulleted or numbered list. Each item should be concise.\n';
        break;
      case 'faq':
        prompt += 'Format as Q&A pairs. Questions should be common concerns.\n';
        break;
      case 'quote':
        prompt += 'Format as a quote. Make it impactful and quotable.\n';
        break;
      case 'callout':
        prompt += 'Create a highlighted callout box. Make it stand out.\n';
        break;
    }

    prompt += '\nGenerate the content following the template structure.';

    return prompt;
  }

  private shouldGenerateSection(section: any, variables: Record<string, any>): boolean {
    // Logic to determine if optional section should be generated
    if (section.repeatable) {
      // For repeatable sections, check if we have relevant variables
      return section.variables.some(v => variables[v]);
    }
    return true;
  }

  getTemplate(templateId: string): AITemplate | null {
    return this.templates.get(templateId) || this.customTemplates.get(templateId) || null;
  }

  getTemplatesByCategory(category: TemplateCategory): AITemplate[] {
    const allTemplates = Array.from(this.templates.values()).concat(
      Array.from(this.customTemplates.values())
    );
    return allTemplates.filter(t => t.category === category && t.isActive);
  }

  searchTemplates(query: string): AITemplate[] {
    const allTemplates = Array.from(this.templates.values()).concat(
      Array.from(this.customTemplates.values())
    );
    const lowerQuery = query.toLowerCase();

    return allTemplates.filter(t =>
      t.isActive &&
      (t.name.toLowerCase().includes(lowerQuery) ||
       t.description.toLowerCase().includes(lowerQuery) ||
       t.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
    );
  }

  async createCustomTemplate(template: Omit<AITemplate, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTemplate: AITemplate = {
      ...template,
      id,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.customTemplates.set(id, newTemplate);
    return id;
  }

  async updateTemplate(templateId: string, updates: Partial<AITemplate>): Promise<void> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (this.templates.has(templateId)) {
      this.templates.set(templateId, updatedTemplate);
    } else if (this.customTemplates.has(templateId)) {
      this.customTemplates.set(templateId, updatedTemplate);
    }
  }

  async deleteTemplate(templateId: string): Promise<void> {
    if (this.templates.has(templateId)) {
      throw new Error('Cannot delete default template');
    }
    this.customTemplates.delete(templateId);
  }

  getPopularTemplates(limit: number = 5): AITemplate[] {
    const allTemplates = Array.from(this.templates.values()).concat(
      Array.from(this.customTemplates.values())
    );
    return allTemplates
      .filter(t => t.isActive)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  validateTemplate(template: Partial<AITemplate>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!template.name) errors.push('Template name is required');
    if (!template.category) errors.push('Template category is required');
    if (!template.structure?.sections?.length) errors.push('At least one section is required');

    template.structure?.sections?.forEach((section, index) => {
      if (!section.name) errors.push(`Section ${index + 1}: Name is required`);
      if (!section.type) errors.push(`Section ${index + 1}: Type is required`);
      if (!section.prompt) errors.push(`Section ${index + 1}: Prompt is required`);
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const aiTemplateSystem = AITemplateSystem.getInstance();

// React hook for template system
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useAITemplates() {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<AITemplate | null>(null);

  const {
    data: templates,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['ai-templates'],
    queryFn: () => {
      const allTemplates = Array.from(aiTemplateSystem['templates'].values()).concat(
        Array.from(aiTemplateSystem['customTemplates'].values())
      );
      return allTemplates.filter(t => t.isActive);
    },
  });

  const generateMutation = useMutation({
    mutationFn: ({
      templateId,
      variables,
      options,
    }: {
      templateId: string;
      variables: Record<string, any>;
      options?: any;
    }) => aiTemplateSystem.generateFromTemplate(templateId, variables, options),
  });

  const createTemplateMutation = useMutation({
    mutationFn: (template: Omit<AITemplate, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>) =>
      aiTemplateSystem.createCustomTemplate(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-templates'] });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ templateId, updates }: { templateId: string; updates: Partial<AITemplate> }) =>
      aiTemplateSystem.updateTemplate(templateId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-templates'] });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: string) => aiTemplateSystem.deleteTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-templates'] });
    },
  });

  return {
    templates,
    selectedTemplate,
    setSelectedTemplate,
    generateContent: generateMutation.mutateAsync,
    createTemplate: createTemplateMutation.mutateAsync,
    updateTemplate: updateTemplateMutation.mutateAsync,
    deleteTemplate: deleteTemplateMutation.mutateAsync,
    isLoading,
    error,
    isGenerating: generateMutation.isPending,
    searchTemplates: aiTemplateSystem.searchTemplates.bind(aiTemplateSystem),
    getTemplatesByCategory: aiTemplateSystem.getTemplatesByCategory.bind(aiTemplateSystem),
    getPopularTemplates: aiTemplateSystem.getPopularTemplates.bind(aiTemplateSystem),
    validateTemplate: aiTemplateSystem.validateTemplate.bind(aiTemplateSystem),
  };
}