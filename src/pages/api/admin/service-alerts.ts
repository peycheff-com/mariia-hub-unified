/**
 * API Route for Service Alerts
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
    const limit = parseInt(req.query.limit as string) || 50;
    const { data, error } = await supabase
      .from('service_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const alerts = (data || []).map(record => ({
      id: record.id,
      service: record.service,
      type: record.alert_type,
      severity: record.severity,
      message: record.message,
      timestamp: new Date(record.created_at)
    }));

    res.status(200).json(alerts);
  } catch (error) {
    console.error('Failed to fetch service alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
