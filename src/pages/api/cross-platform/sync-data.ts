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
      entity_type,
      entity_id,
      operation,
      data_before,
      data_after,
      device_id
    } = req.body;

    // Validate required fields
    if (!entity_type || !entity_id || !operation || !device_id) {
      return res.status(400).json({
        error: 'Missing required fields: entity_type, entity_id, operation, device_id'
      });
    }

    // Validate operation
    if (!['create', 'update', 'delete', 'sync'].includes(operation)) {
      return res.status(400).json({
        error: 'Invalid operation. Must be one of: create, update, delete, sync'
      });
    }

    // Validate entity type
    const validEntityTypes = ['booking', 'profile', 'preferences', 'notification_settings'];
    if (!validEntityTypes.includes(entity_type)) {
      return res.status(400).json({
        error: `Invalid entity_type. Must be one of: ${validEntityTypes.join(', ')}`
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

    // Verify device belongs to user
    const { data: device, error: deviceError } = await supabase
      .from('user_devices')
      .select('*')
      .eq('id', device_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (deviceError || !device) {
      return res.status(403).json({ error: 'Device not found or not authorized' });
    }

    // Check for conflicts
    let conflictDetected = false;
    let conflictResolution = null;

    if (operation === 'update' && entity_type === 'booking') {
      // Check for existing booking conflicts
      const { data: existingLogs, error: logError } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('entity_type', entity_type)
        .eq('entity_id', entity_id)
        .eq('sync_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!logError && existingLogs && existingLogs.length > 0) {
        const lastSync = existingLogs[0];
        const lastSyncTime = new Date(lastSync.created_at).getTime();
        const currentTime = new Date().getTime();
        const timeDiff = currentTime - lastSyncTime;

        // If there was a recent sync, check for conflicts
        if (timeDiff < 60000) { // Within 1 minute
          // Simple conflict detection - compare timestamps
          if (data_after?.updated_at && lastSync.data_after?.updated_at) {
            const newDataTime = new Date(data_after.updated_at).getTime();
            const existingDataTime = new Date(lastSync.data_after.updated_at).getTime();

            if (Math.abs(newDataTime - existingDataTime) > 1000) { // 1 second difference
              conflictDetected = true;
              conflictResolution = newDataTime > existingDataTime ? 'use_latest' : 'use_existing';
            }
          }
        }
      }
    }

    // Create sync log
    const syncData = {
      user_id: user.id,
      device_id,
      entity_type,
      entity_id,
      operation,
      sync_status: conflictDetected ? 'failed' : 'in_progress',
      data_before: data_before || null,
      data_after: data_after || null,
      conflict_detected: conflictDetected,
      conflict_resolution: conflictResolution
    };

    const { data: syncLog, error: syncError } = await supabase
      .from('sync_logs')
      .insert(syncData)
      .select()
      .single();

    if (syncError) {
      console.error('Sync log creation error:', syncError);
      return res.status(500).json({ error: 'Failed to create sync log' });
    }

    // Process the sync operation
    let syncResult = null;
    let syncError = null;

    try {
      switch (entity_type) {
        case 'booking':
          syncResult = await processBookingSync(user.id, entity_id, operation, data_after, supabase);
          break;

        case 'profile':
          syncResult = await processProfileSync(user.id, operation, data_after, supabase);
          break;

        case 'preferences':
          syncResult = await processPreferencesSync(user.id, operation, data_after, supabase);
          break;

        case 'notification_settings':
          syncResult = await processNotificationSettingsSync(user.id, device_id, operation, data_after, supabase);
          break;

        default:
          throw new Error(`Unsupported entity type: ${entity_type}`);
      }

      // Update sync log with success status
      await supabase
        .from('sync_logs')
        .update({
          sync_status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', syncLog.id);

      // Trigger real-time updates for other devices
      await triggerRealtimeSync(user.id, entity_type, entity_id, operation, data_after, supabase);

    } catch (error) {
      syncError = error instanceof Error ? error.message : 'Unknown sync error';

      // Update sync log with error status
      await supabase
        .from('sync_logs')
        .update({
          sync_status: 'failed',
          error_message: syncError,
          completed_at: new Date().toISOString()
        })
        .eq('id', syncLog.id);

      console.error('Sync operation error:', syncError);
    }

    return res.status(200).json({
      success: !syncError,
      sync_id: syncLog.id,
      conflict_detected: conflictDetected,
      conflict_resolution: conflictResolution,
      result: syncResult,
      error: syncError
    });

  } catch (error) {
    console.error('Sync data API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Process booking synchronization
async function processBookingSync(
  userId: string,
  bookingId: string,
  operation: string,
  data: any,
  supabase: any
) {
  switch (operation) {
    case 'create':
      const { data: newBooking, error: createError } = await supabase
        .from('bookings')
        .insert({
          ...data,
          user_id: userId
        })
        .select()
        .single();

      if (createError) throw createError;
      return newBooking;

    case 'update':
      const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update(data)
        .eq('id', bookingId)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) throw updateError;
      return updatedBooking;

    case 'delete':
      const { error: deleteError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;
      return { deleted: true };

    default:
      throw new Error(`Unsupported booking operation: ${operation}`);
  }
}

// Process profile synchronization
async function processProfileSync(
  userId: string,
  operation: string,
  data: any,
  supabase: any
) {
  switch (operation) {
    case 'update':
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId)
        .select()
        .single();

      if (updateError) throw updateError;
      return updatedProfile;

    default:
      throw new Error(`Unsupported profile operation: ${operation}`);
  }
}

// Process preferences synchronization
async function processPreferencesSync(
  userId: string,
  operation: string,
  data: any,
  supabase: any
) {
  switch (operation) {
    case 'update':
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          preferences: data
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) throw updateError;
      return updatedProfile;

    default:
      throw new Error(`Unsupported preferences operation: ${operation}`);
  }
}

// Process notification settings synchronization
async function processNotificationSettingsSync(
  userId: string,
  deviceId: string,
  operation: string,
  data: any,
  supabase: any
) {
  switch (operation) {
    case 'update':
      // Upsert notification settings for the device
      const { data: updatedSettings, error: updateError } = await supabase
        .from('device_notification_settings')
        .upsert({
          device_id: deviceId,
          notification_type: data.notification_type,
          enabled: data.enabled,
          quiet_hours_start: data.quiet_hours_start,
          quiet_hours_end: data.quiet_hours_end,
          do_not_disturb: data.do_not_disturb,
          device_specific_settings: data.device_specific_settings || {}
        })
        .select()
        .single();

      if (updateError) throw updateError;
      return updatedSettings;

    default:
      throw new Error(`Unsupported notification settings operation: ${operation}`);
  }
}

// Trigger real-time sync for other devices
async function triggerRealtimeSync(
  userId: string,
  entityType: string,
  entityId: string,
  operation: string,
  data: any,
  supabase: any
) {
  // Get all active devices for the user except the current one
  const { data: devices } = await supabase
    .from('user_devices')
    .select('id, platform')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (!devices) return;

  // Create notifications for other platforms
  const notifications = devices
    .filter(device => device.id !== (data as any).device_id)
    .map(device => ({
      user_id: userId,
      title: getNotificationTitle(entityType, operation),
      message: getNotificationMessage(entityType, operation),
      type: 'system_update',
      priority: 3,
      data: {
        entity_type: entityType,
        entity_id: entityId,
        operation: operation,
        data: data
      },
      target_devices: [device.id]
    }));

  if (notifications.length > 0) {
    await supabase
      .from('cross_platform_notifications')
      .insert(notifications);
  }
}

function getNotificationTitle(entityType: string, operation: string): string {
  switch (entityType) {
    case 'booking':
      switch (operation) {
        case 'create': return 'New Booking';
        case 'update': return 'Booking Updated';
        case 'delete': return 'Booking Cancelled';
        default: return 'Booking Changed';
      }
    case 'profile':
      return 'Profile Updated';
    case 'preferences':
      return 'Preferences Updated';
    default:
      return 'Data Synced';
  }
}

function getNotificationMessage(entityType: string, operation: string): string {
  switch (entityType) {
    case 'booking':
      switch (operation) {
        case 'create': return 'A new booking has been created on another device.';
        case 'update': return 'A booking has been updated on another device.';
        case 'delete': return 'A booking has been cancelled on another device.';
        default: return 'Booking information has been updated on another device.';
      }
    case 'profile':
      return 'Your profile has been updated on another device.';
    case 'preferences':
      return 'Your preferences have been updated on another device.';
    default:
      return 'Data has been synced from another device.';
  }
}