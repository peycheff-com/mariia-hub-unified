import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

// Base API class with common functionality
export class ApiService {
  static async handleRequest<T>(
    request: Promise<{ data: T | null; error: any }>,
    errorMessage?: string
  ): Promise<T | null> {
    try {
      const { data, error } = await request;

      if (error) {
        console.error('API Error:', error);
        toast({
          title: errorMessage || 'Error',
          description: error.message || 'Something went wrong',
          variant: 'destructive',
        });
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: errorMessage || 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      return null;
    }
  }

  static async handleRequestWithRetry<T>(
    request: () => Promise<{ data: T | null; error: any }>,
    maxRetries: number = 3,
    errorMessage?: string
  ): Promise<T | null> {
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const { data, error } = await request();

        if (error) {
          lastError = error;
          // Don't retry on authentication or validation errors
          if (error.status === 401 || error.status === 400) {
            throw error;
          }

          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
          continue;
        }

        return data;
      } catch (error) {
        lastError = error;

        // Don't retry on network errors or client errors
        if (error instanceof TypeError || error.status === 401 || error.status === 400) {
          break;
        }

        // Wait before retrying
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }

    console.error('API Error after retries:', lastError);
    toast({
      title: errorMessage || 'Error',
      description: lastError?.message || 'Request failed after multiple attempts',
      variant: 'destructive',
    });

    return null;
  }
}