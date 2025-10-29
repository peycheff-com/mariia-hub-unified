/**
 * API Route for Service Health
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
    const { data, error } = await supabase
      .from('service_health')
      .select('*')
      .order('service');

    if (error) throw error;

    const healthData = (data || []).map(record => ({
      service: record.service,
      status: record.status,
      responseTime: record.response_time_ms || 0,
      lastChecked: new Date(record.last_check),
      errorMessage: record.last_error,
      uptime: record.uptime || 0,
      consecutiveFailures: record.consecutive_failures || 0
    }));

    res.status(200).json(healthData);
  } catch (error) {
    console.error('Failed to fetch service health:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
