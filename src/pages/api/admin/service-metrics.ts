/**
 * API Route for Service Metrics
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

import { getRequiredEnvVar } from '@/lib/runtime-env';

const supabase = createClient(
  getRequiredEnvVar('SUPABASE_URL', ['VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL']),
  getRequiredEnvVar('SUPABASE_SERVICE_ROLE_KEY', ['VITE_SUPABASE_SERVICE_ROLE_KEY'])
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { service } = req.query;
    let query = supabase.from('service_metrics').select('*');

    if (service) {
      query = query.eq('service', service);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) throw error;

    const metrics = (data || []).map(record => ({
      service: record.service,
      totalRequests: record.total_requests || 0,
      successfulRequests: record.successful_requests || 0,
      failedRequests: record.failed_requests || 0,
      averageResponseTime: record.average_response_time || 0,
      requestsPerMinute: record.requests_per_minute || 0,
      errorRate: record.error_rate || 0,
      lastHourRequests: record.last_hour_requests || 0
    }));

    res.status(200).json(metrics);
  } catch (error) {
    console.error('Failed to fetch service metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
