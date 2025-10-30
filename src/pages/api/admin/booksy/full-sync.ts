/**
 * API endpoint for triggering full Booksy sync
 * POST /api/admin/booksy/full-sync
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { booksySyncEngine } from '@/services/booksy-sync-engine';
import { booksyAvailabilitySync } from '@/services/booksy-availability-sync';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin permissions
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin privileges required' });
    }

    // Check if sync is already in progress
    const syncStatus = await booksySyncEngine.getSyncStatus();
    const availabilityStatus = await booksyAvailabilitySync.getSyncStatus();

    if (syncStatus?.isProcessing || availabilityStatus?.isProcessing) {
      return res.status(409).json({
        error: 'Sync already in progress',
        message: 'A synchronization operation is currently running'
      });
    }

    // Start full sync in background
    const [syncResult, availabilityResult] = await Promise.allSettled([
      booksySyncEngine.performFullSync(),
      booksyAvailabilitySync.performFullAvailabilitySync()
    ]);

    const results = {
      sync: syncResult.status === 'fulfilled' ? syncResult.value : null,
      availability: availabilityResult.status === 'fulfilled' ? availabilityResult.value : null,
      errors: []
    };

    // Collect errors
    if (syncResult.status === 'rejected') {
      results.errors.push(`Sync engine: ${syncResult.reason}`);
    }
    if (availabilityResult.status === 'rejected') {
      results.errors.push(`Availability sync: ${availabilityResult.reason}`);
    }

    const success = results.sync?.success || results.availability?.synced > 0;

    // Log the operation
    await supabase
      .from('admin_activity_logs')
      .insert({
        user_id: user.id,
        action: 'triggered_full_booksy_sync',
        entity_type: 'booksy_integration',
        success,
        error_message: results.errors.length > 0 ? results.errors.join('; ') : null,
        metadata: results,
        created_at: new Date().toISOString()
      });

    return res.status(200).json({
      success,
      results,
      errors: results.errors
    });

  } catch (error) {
    console.error('Failed to trigger full Booksy sync:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}