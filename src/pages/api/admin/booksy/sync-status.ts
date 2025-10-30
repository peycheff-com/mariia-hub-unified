/**
 * API endpoint for Booksy sync status
 * GET /api/admin/booksy/sync-status
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
  // Only accept GET requests
  if (req.method !== 'GET') {
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

    // Get sync status from both engines
    const [
      syncEngineStatus,
      availabilityStatus
    ] = await Promise.all([
      booksySyncEngine.getSyncStatus(),
      booksyAvailabilitySync.getSyncStatus()
    ]);

    // Combine status information
    const combinedStatus = {
      isProcessing: syncEngineStatus?.isProcessing || false,
      lastFullSync: syncEngineStatus?.lastSync || availabilityStatus?.lastFullSync || null,
      entities: syncEngineStatus?.entities || [],
      queue: syncEngineStatus?.queue || [],
      conflicts: syncEngineStatus?.conflicts || 0,
      totalSlots: availabilityStatus?.totalSlots || 0,
      syncedSlots: availabilityStatus?.syncedSlots || 0,
      conflictedSlots: availabilityStatus?.conflictedSlots || 0,
      pendingConflicts: availabilityStatus?.pendingConflicts || 0,
      health: {
        syncEngine: syncEngineStatus ? 'healthy' : 'error',
        availabilitySync: availabilityStatus ? 'healthy' : 'error'
      }
    };

    return res.status(200).json(combinedStatus);
  } catch (error) {
    console.error('Failed to get Booksy sync status:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}