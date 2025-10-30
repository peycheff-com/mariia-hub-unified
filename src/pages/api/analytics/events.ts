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
    const { events, metadata } = req.body;

    // Validate required fields
    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        error: 'Missing or invalid events array'
      });
    }

    // Validate event structure
    for (const event of events) {
      if (!event.eventName || !event.eventType || !event.timestamp) {
        return res.status(400).json({
          error: 'Invalid event structure. Each event must have eventName, eventType, and timestamp'
        });
      }

      if (!['page_view', 'user_action', 'system_event', 'performance', 'error'].includes(event.eventType)) {
        return res.status(400).json({
          error: 'Invalid eventType. Must be one of: page_view, user_action, system_event, performance, error'
        });
      }
    }

    // Process events in batches
    const batchSize = 100;
    const processedEvents = [];
    const errors = [];

    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);

      try {
        const batchResults = await processEventBatch(batch, supabase);
        processedEvents.push(...batchResults);
      } catch (error) {
        console.error(`Error processing batch ${i / batchSize + 1}:`, error);
        errors.push({
          batch: Math.floor(i / batchSize) + 1,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Update analytics aggregates
    if (processedEvents.length > 0) {
      await updateAnalyticsAggregates(processedEvents, supabase);
    }

    return res.status(200).json({
      success: true,
      processed_count: processedEvents.length,
      total_events: events.length,
      errors: errors.length > 0 ? errors : null,
      metadata: {
        ...metadata,
        processed_at: new Date().toISOString(),
        batch_count: Math.ceil(events.length / batchSize)
      }
    });

  } catch (error) {
    console.error('Analytics events API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Process a batch of events
async function processEventBatch(events: any[], supabase: any) {
  const processedEvents = [];

  for (const event of events) {
    try {
      // Validate and enrich event data
      const enrichedEvent = await enrichEvent(event, supabase);

      // Store event in database
      const { data: storedEvent, error: storeError } = await supabase
        .from('analytics_events')
        .insert(enrichedEvent)
        .select()
        .single();

      if (storeError) {
        console.error('Error storing event:', storeError);
        continue;
      }

      processedEvents.push(storedEvent);

      // Process specific event types
      await processSpecificEvent(storedEvent, supabase);

    } catch (error) {
      console.error('Error processing event:', error);
    }
  }

  return processedEvents;
}

// Enrich event with additional data
async function enrichEvent(event: any, supabase: any) {
  const enrichedEvent = {
    ...event,
    id: generateEventId(),
    created_at: new Date().toISOString(),
    // Add server-side enrichment
    server_timestamp: Date.now(),
    // Add IP and user agent if not present
    ip_address: event.ip_address || req.ip,
    user_agent: event.user_agent || req.headers['user-agent']
  };

  // Add device info if deviceId is present
  if (event.deviceId) {
    const { data: device } = await supabase
      .from('user_devices')
      .select('platform, device_name, app_version')
      .eq('id', event.deviceId)
      .single();

    if (device) {
      enrichedEvent.device_info = device;
    }
  }

  // Add geolocation data if available
  if (event.properties?.location) {
    enrichedEvent.geolocation = event.properties.location;
  }

  return enrichedEvent;
}

// Process specific event types
async function processSpecificEvent(event: any, supabase: any) {
  switch (event.eventType) {
    case 'page_view':
      await processPageViewEvent(event, supabase);
      break;

    case 'user_action':
      await processUserActionEvent(event, supabase);
      break;

    case 'performance':
      await processPerformanceEvent(event, supabase);
      break;

    case 'error':
      await processErrorEvent(event, supabase);
      break;

    case 'system_event':
      await processSystemEvent(event, supabase);
      break;
  }
}

// Process page view events
async function processPageViewEvent(event: any, supabase: any) {
  // Update page view counters
  const { data: pageStats } = await supabase
    .from('analytics_page_stats')
    .select('views, unique_visitors')
    .eq('url', event.properties.url)
    .eq('date', new Date().toISOString().split('T')[0])
    .single();

  if (pageStats) {
    await supabase
      .from('analytics_page_stats')
      .update({
        views: pageStats.views + 1,
        unique_visitors: pageStats.unique_visitors + (event.sessionId ? 1 : 0),
        updated_at: new Date().toISOString()
      })
      .eq('url', event.properties.url)
      .eq('date', new Date().toISOString().split('T')[0]);
  } else {
    await supabase
      .from('analytics_page_stats')
      .insert({
        url: event.properties.url,
        title: event.properties.title,
        date: new Date().toISOString().split('T')[0],
        views: 1,
        unique_visitors: event.sessionId ? 1 : 0
      });
  }
}

// Process user action events
async function processUserActionEvent(event: any, supabase: any) {
  // Track conversion events
  if (event.eventName.includes('booking') || event.eventName.includes('purchase')) {
    await trackConversion(event, supabase);
  }

  // Update user journey if applicable
  if (event.properties?.journeyId) {
    await updateJourneyStep(event, supabase);
  }
}

// Process performance events
async function processPerformanceEvent(event: any, supabase: any) {
  // Store performance metrics
  const metrics = event.properties;

  await supabase
    .from('analytics_performance_metrics')
    .insert({
      event_id: event.id,
      user_id: event.userId,
      device_id: event.deviceId,
      platform: event.platform,
      lcp: metrics.largestContentfulPaint,
      fid: metrics.firstInputDelay,
      cls: metrics.cumulativeLayoutShift,
      fcp: metrics.firstContentfulPaint,
      ttfb: metrics.timeToFirstByte,
      memory_usage: metrics.memoryUsage,
      frame_rate: metrics.frameRate,
      timestamp: event.timestamp
    });
}

// Process error events
async function processErrorEvent(event: any, supabase: any) {
  // Store error details
  await supabase
    .from('analytics_errors')
    .insert({
      event_id: event.id,
      user_id: event.userId,
      device_id: event.deviceId,
      platform: event.platform,
      error_type: event.properties.errorType || 'javascript',
      error_message: event.properties.message,
      error_stack: event.properties.stack,
      url: event.properties.url,
      line_number: event.properties.lineno,
      column_number: event.properties.colno,
      timestamp: event.timestamp
    });

  // Update error rate metrics
  await updateErrorRate(event, supabase);
}

// Process system events
async function processSystemEvent(event: any, supabase: any) {
  // Track cross-platform specific events
  if (event.eventName.includes('sync') || event.eventName.includes('conflict')) {
    await trackCrossPlatformEvent(event, supabase);
  }
}

// Track conversion events
async function trackConversion(event: any, supabase: any) {
  await supabase
    .from('analytics_conversions')
    .insert({
      event_id: event.id,
      user_id: event.userId,
      session_id: event.sessionId,
      conversion_type: event.eventName,
      conversion_value: event.properties.value || 0,
      platform: event.platform,
      timestamp: event.timestamp
    });
}

// Update user journey steps
async function updateJourneyStep(event: any, supabase: any) {
  await supabase
    .from('analytics_user_journeys')
    .update({
      current_step: event.properties.stepName,
      step_count: supabase.sql`step_count + 1`,
      updated_at: new Date().toISOString()
    })
    .eq('id', event.properties.journeyId);
}

// Update error rate metrics
async function updateErrorRate(event: any, supabase: any) {
  const today = new Date().toISOString().split('T')[0];

  await supabase.rpc('update_error_rate_metrics', {
    p_date: today,
    p_platform: event.platform,
    p_user_id: event.userId,
    p_error_count: 1
  });
}

// Track cross-platform specific events
async function trackCrossPlatformEvent(event: any, supabase: any) {
  await supabase
    .from('analytics_cross_platform')
    .insert({
      event_id: event.id,
      user_id: event.userId,
      device_id: event.deviceId,
      event_name: event.eventName,
      event_data: event.properties,
      timestamp: event.timestamp
    });
}

// Update analytics aggregates
async function updateAnalyticsAggregates(events: any[], supabase: any) {
  const today = new Date().toISOString().split('T')[0];

  // Update daily aggregates
  await supabase.rpc('update_daily_analytics', {
    p_date: today,
    p_event_count: events.length,
    p_unique_users: new Set(events.filter(e => e.userId).map(e => e.userId)).size,
    p_unique_sessions: new Set(events.filter(e => e.sessionId).map(e => e.sessionId)).size
  });

  // Update platform distribution
  const platformCounts = events.reduce((acc, event) => {
    acc[event.platform] = (acc[event.platform] || 0) + 1;
    return acc;
  }, {});

  for (const [platform, count] of Object.entries(platformCounts)) {
    await supabase.rpc('update_platform_distribution', {
      p_date: today,
      p_platform: platform,
      p_event_count: count
    });
  }
}

// Generate unique event ID
function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}