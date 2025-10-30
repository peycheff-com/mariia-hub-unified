import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { cors } from '@/lib/cors';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle CORS
  await cors(req, res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      device_id,
      platform,
      device_name,
      app_version,
      os_version,
      push_token
    } = req.body;

    // Validate required fields
    if (!device_id || !platform) {
      return res.status(400).json({
        error: 'Missing required fields: device_id, platform'
      });
    }

    // Validate platform
    if (!['web', 'ios', 'android'].includes(platform)) {
      return res.status(400).json({
        error: 'Invalid platform. Must be one of: web, ios, android'
      });
    }

    // Get user from auth header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    // Register or update device
    const { data, error } = await supabase.rpc('register_device', {
      p_user_id: user.id,
      p_device_id: device_id,
      p_platform: platform,
      p_device_name: device_name || null,
      p_app_version: app_version || null,
      p_os_version: os_version || null,
      p_push_token: push_token || null
    });

    if (error) {
      console.error('Device registration error:', error);
      return res.status(500).json({ error: 'Failed to register device' });
    }

    // Get full device info
    const { data: deviceData, error: deviceError } = await supabase
      .from('user_devices')
      .select('*')
      .eq('id', data)
      .single();

    if (deviceError) {
      console.error('Error fetching device data:', deviceError);
      return res.status(500).json({ error: 'Failed to fetch device data' });
    }

    // Update user's device count
    const { data: allDevices } = await supabase
      .from('user_devices')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    // Store device count for analytics
    if (allDevices) {
      // This would typically be handled by analytics service
      console.log(`User ${user.id} has ${allDevices.length} active devices`);
    }

    return res.status(200).json({
      success: true,
      device: deviceData,
      device_count: allDevices?.length || 1
    });

  } catch (error) {
    console.error('Device registration API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}