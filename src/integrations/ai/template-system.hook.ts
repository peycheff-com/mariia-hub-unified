import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { aiTemplateSystem } from './template-system';
import type { AITemplate } from './template-system';

export const useAITemplateSystem = () => {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<AITemplate | null>(null);

  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: ['ai-templates'],
    queryFn: () => aiTemplateSystem.getAllTemplates(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: customTemplates = [] } = useQuery({
    queryKey: ['ai-templates', 'custom'],
    queryFn: () => aiTemplateSystem.getCustomTemplates(),
    staleTime: 5 * 60 * 1000,
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
    customTemplates,
    selectedTemplate,
    setSelectedTemplate,
    createTemplate: createTemplateMutation.mutateAsync,
    updateTemplate: updateTemplateMutation.mutateAsync,
    deleteTemplate: deleteTemplateMutation.mutateAsync,
    generateFromTemplate: generateMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
    isLoading,
    error,
    searchTemplates: useCallback((query: string) => aiTemplateSystem.searchTemplates(query), []),
    getTemplatesByCategory: useCallback((category: string) => aiTemplateSystem.getTemplatesByCategory(category), []),
    getPopularTemplates: useCallback(() => aiTemplateSystem.getPopularTemplates(), []),
    validateTemplate: useCallback((template: AITemplate) => aiTemplateSystem.validateTemplate(template), []),
  };
};