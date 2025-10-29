import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { ConsentService } from '@/services/consent.service';
import {
  ModelConsent,
  ConsentRequest,
  ConsentUsageLog,
  ConsentTemplate,
  ConsentFormData,
  ConsentAnalytics,
  LogConsentUsageParams,
  RevokeConsentParams
} from '@/types/consent';

// Hooks for consent management
export const useConsents = (options?: {
  clientId?: string;
  status?: string[];
  consentType?: string[];
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: ['consents', options],
    queryFn: () => ConsentService.getConsents(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useConsent = (id: string) => {
  return useQuery({
    queryKey: ['consent', id],
    queryFn: () => ConsentService.getConsentById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreateConsent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (consentData: Omit<ModelConsent, 'id' | 'created_at' | 'updated_at'>) =>
      ConsentService.createConsent(consentData),
    onSuccess: (newConsent) => {
      queryClient.invalidateQueries({ queryKey: ['consents'] });
      queryClient.setQueryData(['consent', newConsent.id], newConsent);
    },
  });
};

export const useUpdateConsent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ModelConsent> }) =>
      ConsentService.updateConsent(id, updates),
    onSuccess: (updatedConsent) => {
      queryClient.invalidateQueries({ queryKey: ['consents'] });
      queryClient.setQueryData(['consent', updatedConsent.id], updatedConsent);
    },
  });
};

export const useDeleteConsent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ConsentService.deleteConsent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consents'] });
    },
  });
};

// Hooks for consent templates
export const useConsentTemplates = (options?: {
  type?: string;
  language?: string;
  active?: boolean;
}) => {
  return useQuery({
    queryKey: ['consent-templates', options],
    queryFn: () => ConsentService.getConsentTemplates(options),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

export const useConsentTemplate = (id: string) => {
  return useQuery({
    queryKey: ['consent-template', id],
    queryFn: () => ConsentService.getConsentTemplateById(id),
    enabled: !!id,
    staleTime: 15 * 60 * 1000,
  });
};

export const useCreateConsentTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateData: Omit<ConsentTemplate, 'id' | 'created_at' | 'updated_at'>) =>
      ConsentService.createConsentTemplate(templateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consent-templates'] });
    },
  });
};

export const useUpdateConsentTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ConsentTemplate> }) =>
      ConsentService.updateConsentTemplate(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consent-templates'] });
    },
  });
};

// Hooks for consent requests
export const useConsentRequests = (options?: {
  clientId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: ['consent-requests', options],
    queryFn: () => ConsentService.getConsentRequests(options),
    staleTime: 5 * 60 * 1000,
  });
};

export const useConsentRequestByToken = (token: string) => {
  return useQuery({
    queryKey: ['consent-request', token],
    queryFn: () => ConsentService.getConsentRequestByToken(token),
    enabled: !!token,
    staleTime: 10 * 60 * 1000,
  });
};

export const useCreateConsentRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestData: Omit<ConsentRequest, 'id' | 'created_at' | 'updated_at' | 'consent_form_token'>) =>
      ConsentService.createConsentRequest(requestData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consent-requests'] });
    },
  });
};

export const useUpdateConsentRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ConsentRequest> }) =>
      ConsentService.updateConsentRequest(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consent-requests'] });
    },
  });
};

// Hooks for usage logs
export const useUsageLogs = (options?: {
  consentId?: string;
  usageType?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: ['usage-logs', options],
    queryFn: () => ConsentService.getUsageLogs(options),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateUsageLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (logData: Omit<ConsentUsageLog, 'id' | 'created_at' | 'used_at'>) =>
      ConsentService.createUsageLog(logData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usage-logs'] });
      queryClient.invalidateQueries({ queryKey: ['consent-analytics'] });
    },
  });
};

// Hooks for database functions
export const useIsConsentActive = () => {
  return useMutation({
    mutationFn: (consentId: string) => ConsentService.isConsentActive(consentId),
  });
};

export const useLogConsentUsage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: LogConsentUsageParams) => ConsentService.logConsentUsage(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usage-logs'] });
      queryClient.invalidateQueries({ queryKey: ['consent-analytics'] });
    },
  });
};

export const useRevokeConsent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: RevokeConsentParams) => ConsentService.revokeConsent(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consents'] });
      queryClient.invalidateQueries({ queryKey: ['consent-analytics'] });
    },
  });
};

export const useExpiringConsent = (daysAhead: number = 30) => {
  return useQuery({
    queryKey: ['expiring-consent', daysAhead],
    queryFn: () => ConsentService.getExpiringConsent(daysAhead),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

// Hook for analytics
export const useConsentAnalytics = () => {
  return useQuery({
    queryKey: ['consent-analytics'],
    queryFn: () => ConsentService.getConsentAnalytics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for processing consent forms
export const useProcessConsentForm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, formData }: { requestId: string; formData: ConsentFormData }) =>
      ConsentService.processConsentForm(requestId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consents'] });
      queryClient.invalidateQueries({ queryKey: ['consent-requests'] });
    },
  });
};

// Hook for sending notifications
export const useSendConsentRequestNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => ConsentService.sendConsentRequestNotification(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consent-requests'] });
    },
  });
};

// Custom hook for consent form management
export const useConsentForm = (templateId?: string) => {
  const [formData, setFormData] = useState<Partial<ConsentFormData>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: template } = useConsentTemplate(templateId || '');
  const processConsentForm = useProcessConsentForm();

  // Initialize form data when template loads
  useEffect(() => {
    if (template) {
      setFormData(prev => ({
        ...prev,
        consent_type: template.template_type,
        scope: template.default_scope as any,
        duration: template.default_duration,
        compensation_type: template.default_compensation_type || 'none',
      }));
    }
  }, [template]);

  const updateFormData = useCallback((updates: Partial<ConsentFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    // Clear errors for updated fields
    const updatedFields = Object.keys(updates);
    setErrors(prev => {
      const newErrors = { ...prev };
      updatedFields.forEach(field => delete newErrors[field]);
      return newErrors;
    });
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.consent_type) {
      newErrors.consent_type = 'Consent type is required';
    }

    if (!formData.scope || Object.values(formData.scope).every(v => !v)) {
      newErrors.scope = 'At least one usage scope must be selected';
    }

    if (!formData.duration) {
      newErrors.duration = 'Duration is required';
    }

    if (formData.duration !== 'permanent' && !formData.expiry_date) {
      newErrors.expiry_date = 'Expiry date is required for time-limited consent';
    }

    if (!formData.signature_data) {
      newErrors.signature = 'Signature is required';
    }

    if (!formData.agreed) {
      newErrors.agreed = 'You must agree to the consent terms';
    }

    if (!formData.client_understands) {
      newErrors.understands = 'You must confirm that you understand the consent';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const submitForm = useCallback(async (requestId: string) => {
    if (!validateForm()) {
      return false;
    }

    setIsSubmitting(true);
    try {
      await processConsentForm.mutateAsync({
        requestId,
        formData: formData as ConsentFormData
      });
      return true;
    } catch (error) {
      console.error('Error submitting consent form:', error);
      setErrors({ submit: 'Failed to submit consent form. Please try again.' });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, processConsentForm]);

  const resetForm = useCallback(() => {
    setFormData({});
    setErrors({});
    setIsSubmitting(false);
  }, []);

  return {
    formData,
    updateFormData,
    errors,
    isSubmitting,
    validateForm,
    submitForm,
    resetForm,
    template
  };
};

// Custom hook for consent request management
export const useConsentRequestManager = () => {
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [requestPurpose, setRequestPurpose] = useState('');
  const [usageContext, setUsageContext] = useState<any>({});

  const { data: templates } = useConsentTemplates({ active: true });
  const createRequest = useCreateConsentRequest();
  const sendNotification = useSendConsentRequestNotification();

  const createAndSendRequest = useCallback(async (clientId: string, bookingId?: string) => {
    if (!selectedTemplate || !requestPurpose.trim()) {
      throw new Error('Template and purpose are required');
    }

    const template = templates?.find(t => t.id === selectedTemplate);
    if (!template) {
      throw new Error('Selected template not found');
    }

    try {
      // Create request
      const request = await createRequest.mutateAsync({
        client_id: clientId,
        booking_id: bookingId,
        request_type: template.template_type,
        request_purpose: requestPurpose.trim(),
        usage_context: usageContext,
        email_sent: true,
        email_template_used: template.name,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Send notification
      await sendNotification.mutateAsync(request.id);

      return request;
    } catch (error) {
      console.error('Error creating consent request:', error);
      throw error;
    }
  }, [selectedTemplate, requestPurpose, usageContext, templates, createRequest, sendNotification]);

  const reset = useCallback(() => {
    setSelectedClient('');
    setSelectedTemplate('');
    setRequestPurpose('');
    setUsageContext({});
  }, []);

  return {
    selectedClient,
    setSelectedClient,
    selectedTemplate,
    setSelectedTemplate,
    requestPurpose,
    setRequestPurpose,
    usageContext,
    setUsageContext,
    createAndSendRequest,
    reset,
    templates,
    isLoading: createRequest.isPending || sendNotification.isPending
  };
};

// Custom hook for consent usage tracking
export const useConsentUsageTracker = () => {
  const [selectedConsent, setSelectedConsent] = useState<ModelConsent | null>(null);
  const [usageData, setUsageData] = useState<Partial<ConsentUsageLog>>({});

  const createUsageLog = useCreateUsageLog();

  const logUsage = useCallback(async (consentId: string, usageData: Partial<ConsentUsageLog>) => {
    try {
      await createUsageLog.mutateAsync({
        consent_id: consentId,
        usage_type: usageData.usage_type!,
        usage_context: usageData.usage_context!,
        usage_description: usageData.usage_description,
        media_type: usageData.media_type,
        media_urls: usageData.media_urls || [],
        campaign_id: usageData.campaign_id,
        geographic_region: usageData.geographic_region,
        display_start_date: usageData.display_start_date,
        display_end_date: usageData.display_end_date,
        department: usageData.department,
        project_name: usageData.project_name,
        compliance_notes: usageData.compliance_notes,
        usage_approved: usageData.usage_approved || false,
      });
      return true;
    } catch (error) {
      console.error('Error logging usage:', error);
      throw error;
    }
  }, [createUsageLog]);

  const reset = useCallback(() => {
    setSelectedConsent(null);
    setUsageData({});
  }, []);

  return {
    selectedConsent,
    setSelectedConsent,
    usageData,
    setUsageData,
    logUsage,
    reset,
    isLoading: createUsageLog.isPending
  };
};