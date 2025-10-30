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
      title,
      message,
      type,
      priority = 0,
      data = {},
      target_devices = [],
      exclude_devices = [],
      scheduled_at = null
    } = req.body;

    // Validate required fields
    if (!title || !message || !type) {
      return res.status(400).json({
        error: 'Missing required fields: title, message, type'
      });
    }

    // Validate notification type
    const validTypes = [
      'booking_reminder',
      'booking_confirmation',
      'payment_received',
      'promotion',
      'system_update'
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: `Invalid type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validate priority
    if (priority < 0 || priority > 10) {
      return res.status(400).json({
        error: 'Priority must be between 0 and 10'
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

    // Validate target devices if provided
    if (target_devices.length > 0) {
      const { data: devices, error: deviceError } = await supabase
        .from('user_devices')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .in('id', target_devices);

      if (deviceError) {
        return res.status(400).json({ error: 'Failed to validate target devices' });
      }

      if (!devices || devices.length !== target_devices.length) {
        return res.status(400).json({ error: 'One or more target devices are invalid' });
      }
    }

    // Validate exclude devices if provided
    if (exclude_devices.length > 0) {
      const { data: devices, error: deviceError } = await supabase
        .from('user_devices')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .in('id', exclude_devices);

      if (deviceError) {
        return res.status(400).json({ error: 'Failed to validate exclude devices' });
      }

      if (!devices || devices.length !== exclude_devices.length) {
        return res.status(400).json({ error: 'One or more exclude devices are invalid' });
      }
    }

    // Validate scheduled time
    let scheduledTime = null;
    if (scheduled_at) {
      scheduledTime = new Date(scheduled_at);
      if (isNaN(scheduledTime.getTime()) || scheduledTime <= new Date()) {
        return res.status(400).json({
          error: 'Scheduled time must be in the future'
        });
      }
    }

    // Check quiet hours for target devices
    const shouldRespectQuietHours = type !== 'system_update' && priority < 7;
    if (shouldRespectQuietHours) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;

      // Get quiet hours settings for target devices
      const { data: notificationSettings, error: settingsError } = await supabase
        .from('device_notification_settings')
        .select('device_id, quiet_hours_start, quiet_hours_end, do_not_disturb')
        .eq('user_id', user.id)
        .eq('notification_type', type)
        .eq('enabled', true);

      if (!settingsError && notificationSettings) {
        const devicesToExclude: string[] = [];

        for (const setting of notificationSettings) {
          if (setting.do_not_disturb) {
            devicesToExclude.push(setting.device_id);
            continue;
          }

          if (setting.quiet_hours_start && setting.quiet_hours_end) {
            const [startHour, startMin] = setting.quiet_hours_start.split(':').map(Number);
            const [endHour, endMin] = setting.quiet_hours_end.split(':').map(Number);

            const startTime = startHour * 60 + startMin;
            const endTime = endHour * 60 + endMin;

            let isQuietHours = false;

            if (startTime <= endTime) {
              // Same day range (e.g., 22:00 to 08:00)
              isQuietHours = currentTime >= startTime || currentTime <= endTime;
            } else {
              // Cross midnight range (e.g., 22:00 to 08:00 next day)
              isQuietHours = currentTime >= startTime || currentTime <= endTime;
            }

            if (isQuietHours) {
              devicesToExclude.push(setting.device_id);
            }
          }
        }

        // Add quiet hours devices to exclusion list
        if (devicesToExclude.length > 0) {
          exclude_devices.push(...devicesToExclude);
        }
      }
    }

    // Queue the notification
    const { data: notificationId, error: queueError } = await supabase.rpc('queue_cross_platform_notification', {
      p_user_id: user.id,
      p_title: title,
      p_message: message,
      p_type: type,
      p_priority: priority,
      p_data: data,
      p_target_devices: target_devices,
      p_exclude_devices: exclude_devices,
      p_scheduled_at: scheduledTime?.toISOString()
    });

    if (queueError) {
      console.error('Notification queue error:', queueError);
      return res.status(500).json({ error: 'Failed to queue notification' });
    }

    // Get notification details for response
    const { data: notificationData, error: fetchError } = await supabase
      .from('cross_platform_notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (fetchError) {
      console.error('Error fetching notification data:', fetchError);
    }

    // Process immediate delivery if not scheduled
    let deliveryResults = null;
    if (!scheduled_at) {
      deliveryResults = await processImmediateDelivery(notificationId, user.id, supabase);
    }

    return res.status(200).json({
      success: true,
      notification_id: notificationId,
      notification: notificationData,
      delivery_results: deliveryResults,
      scheduled_for: scheduledTime?.toISOString() || null
    });

  } catch (error) {
    console.error('Send notification API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Process immediate notification delivery
async function processImmediateDelivery(
  notificationId: string,
  userId: string,
  supabase: any
) {
  try {
    // Get notification details
    const { data: notification, error: fetchError } = await supabase
      .from('cross_platform_notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (fetchError || !notification) {
      throw new Error('Failed to fetch notification for delivery');
    }

    // Get target devices
    let targetDeviceIds = notification.target_devices;
    if (targetDeviceIds.length === 0) {
      // If no specific targets, get all active devices
      const { data: devices } = await supabase
        .from('user_devices')
        .select('id, platform, push_token')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (devices) {
        targetDeviceIds = devices
          .map(d => d.id)
          .filter(id => !notification.exclude_devices.includes(id));
      }
    }

    // Initialize delivery status
    const deliveryStatus: Record<string, string> = {};

    // Process delivery for each target device
    for (const deviceId of targetDeviceIds) {
      try {
        // Get device details
        const { data: device } = await supabase
          .from('user_devices')
          .select('platform, push_token')
          .eq('id', deviceId)
          .single();

        if (!device) {
          deliveryStatus[deviceId] = 'device_not_found';
          continue;
        }

        // Deliver based on platform
        let deliveryResult = 'pending';

        switch (device.platform) {
          case 'web':
            deliveryResult = await deliverWebNotification(deviceId, notification, supabase);
            break;

          case 'ios':
          case 'android':
            if (device.push_token) {
              deliveryResult = await deliverPushNotification(deviceId, device.push_token, notification, supabase);
            } else {
              deliveryResult = 'no_push_token';
            }
            break;

          default:
            deliveryResult = 'unsupported_platform';
        }

        deliveryStatus[deviceId] = deliveryResult;

      } catch (error) {
        console.error(`Error delivering to device ${deviceId}:`, error);
        deliveryStatus[deviceId] = 'delivery_failed';
      }
    }

    // Update notification with delivery status
    await supabase
      .from('cross_platform_notifications')
      .update({
        delivery_status: deliveryStatus,
        sent_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    return deliveryStatus;

  } catch (error) {
    console.error('Error processing immediate delivery:', error);
    throw error;
  }
}

// Deliver web notification
async function deliverWebNotification(
  deviceId: string,
  notification: any,
  supabase: any
): Promise<string> {
  // For web notifications, we rely on real-time subscriptions
  // The actual delivery happens client-side through the service worker
  return 'delivered_via_realtime';
}

// Deliver push notification
async function deliverPushNotification(
  deviceId: string,
  pushToken: string,
  notification: any,
  supabase: any
): Promise<string> {
  try {
    // Implementation would integrate with FCM (Firebase Cloud Messaging) or APNS
    // For now, we'll simulate the push notification delivery

    const payload = {
      to: pushToken,
      notification: {
        title: notification.title,
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        data: notification.data
      },
      data: {
        type: notification.type,
        priority: notification.priority,
        notification_id: notification.id,
        ...notification.data
      },
      priority: notification.priority >= 7 ? 'high' : 'normal'
    };

    // Simulate API call to push service
    // const response = await fetch('https://fcm.googleapis.com/fcm/send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `key=${process.env.FCM_SERVER_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(payload)
    // });

    // For demo purposes, we'll just return success
    console.log(`Push notification sent to device ${deviceId}:`, payload);

    return 'delivered_via_push';

  } catch (error) {
    console.error('Error delivering push notification:', error);
    return 'push_delivery_failed';
  }
}