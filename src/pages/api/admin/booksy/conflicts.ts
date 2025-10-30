/**
 * API endpoint for Booksy conflicts management
 * GET /api/admin/booksy/conflicts - List conflicts
 * POST /api/admin/booksy/conflicts/[id]/resolve - Resolve conflict
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

  try {
    const { method, query } = req;

    // GET /api/admin/booksy/conflicts - List conflicts
    if (method === 'GET') {
      const [syncConflicts, availabilityConflicts] = await Promise.all([
        booksySyncEngine.getPendingConflicts(),
        getAvailabilityConflicts()
      ]);

      const allConflicts = [
        ...syncConflicts.map(conflict => ({
          ...conflict,
          source: 'sync_engine'
        })),
        ...availabilityConflicts.map(conflict => ({
          ...conflict,
          source: 'availability_sync'
        }))
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return res.status(200).json({
        conflicts: allConflicts,
        total: allConflicts.length,
        syncConflicts: syncConflicts.length,
        availabilityConflicts: availabilityConflicts.length
      });
    }

    // POST /api/admin/booksy/conflicts/[id]/resolve - Resolve conflict
    if (method === 'POST' && query.id) {
      const { resolution } = req.body;

      if (!resolution || !['platform', 'booksy', 'manual'].includes(resolution)) {
        return res.status(400).json({
          error: 'Invalid resolution. Must be: platform, booksy, or manual'
        });
      }

      const conflictId = query.id as string;

      // Try to resolve with sync engine first
      try {
        await booksySyncEngine.resolveConflict(conflictId, resolution, {
          resolvedBy: user.id,
          resolvedAt: new Date().toISOString()
        });
      } catch (error) {
        // Try with availability sync engine
        try {
          await booksyAvailabilitySync.resolveConflict(conflictId, resolution);
        } catch (availabilityError) {
          // Neither engine could resolve it
          return res.status(404).json({
            error: 'Conflict not found',
            message: 'The specified conflict could not be found in either sync engine'
          });
        }
      }

      // Log the resolution
      await supabase
        .from('admin_activity_logs')
        .insert({
          user_id: user.id,
          action: 'resolved_booksy_conflict',
          entity_type: 'booksy_conflict',
          entity_id: conflictId,
          success: true,
          metadata: {
            resolution,
            resolvedAt: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        });

      return res.status(200).json({
        success: true,
        message: `Conflict resolved with ${resolution} priority`
      });
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Failed to handle Booksy conflicts request:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get availability conflicts from database
 */
async function getAvailabilityConflicts() {
  try {
    const { data, error } = await supabase
      .from('booksy_availability_conflicts')
      .select('*')
      .eq('resolution_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map(conflict => ({
      id: conflict.id,
      entityType: 'availability',
      entityId: conflict.slot_id,
      booksyEntityId: conflict.booksy_slot_id,
      conflictType: conflict.conflict_type,
      conflictData: {
        platformData: conflict.platform_data,
        booksyData: conflict.booksy_data
      },
      resolutionStatus: conflict.resolution_status,
      autoResolved: conflict.auto_resolved,
      createdAt: new Date(conflict.created_at)
    }));
  } catch (error) {
    console.error('Failed to get availability conflicts:', error);
    return [];
  }
}