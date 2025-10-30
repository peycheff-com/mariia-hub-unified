// API ENDPOINT FOR PERFORMANCE ALERTS
// Handles critical performance alerts and notifications

import { NextApiRequest, NextApiResponse } from 'next';

interface PerformanceAlert {
  id: string;
  type: 'query' | 'api' | 'ux' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: string;
  context?: Record<string, any>;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const alert: PerformanceAlert = req.body;

    // Validate alert structure
    if (!alert.type || !alert.severity || !alert.message || !alert.metric) {
      return res.status(400).json({ error: 'Invalid alert format' });
    }

    const timestamp = new Date().toISOString();
    const alertWithTimestamp = { ...alert, timestamp };

    console.error('[PERFORMANCE ALERT]', {
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      metric: alert.metric,
      value: alert.value,
      threshold: alert.threshold,
      timestamp,
      context: alert.context
    });

    // Store alert in database
    if (process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_TRACKING === 'true') {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        await supabase.from('performance_alerts').insert({
          alert_id: alert.id,
          alert_type: alert.type,
          severity: alert.severity,
          message: alert.message,
          metric: alert.metric,
          value: alert.value,
          threshold: alert.threshold,
          context: alert.context || {},
          created_at: timestamp
        });

      } catch (dbError) {
        console.error('[PERFORMANCE ALERT] Failed to store in database:', dbError);
      }
    }

    // Handle critical alerts with immediate notification
    if (alert.severity === 'critical') {
      await handleCriticalAlert(alertWithTimestamp);
    }

    // Send to external monitoring services if configured
    if (process.env.PERFORMANCE_WEBHOOK_URL) {
      await sendToWebhook(alertWithTimestamp);
    }

    return res.status(200).json({
      success: true,
      acknowledged: true,
      alertId: alert.id,
      timestamp
    });

  } catch (error) {
    console.error('[PERFORMANCE ALERT] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCriticalAlert(alert: PerformanceAlert) {
  console.error('🚨 [CRITICAL PERFORMANCE ALERT]', alert.message);

  // Send immediate notifications
  const notifications = [
    {
      type: 'console',
      message: `CRITICAL: ${alert.message} (${alert.value}ms > ${alert.threshold}ms)`,
      metadata: alert
    }
  ];

  // Send to monitoring service
  if (process.env.MONITORING_SERVICE_URL) {
    try {
      await fetch(process.env.MONITORING_SERVICE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'critical',
          service: 'mariia-hub-performance',
          message: alert.message,
          timestamp: alert.timestamp,
          metadata: alert
        })
      });
    } catch (error) {
      console.error('[PERFORMANCE ALERT] Failed to send to monitoring service:', error);
    }
  }

  // Send email notification if configured
  if (process.env.ADMIN_EMAIL && process.env.EMAIL_SERVICE_URL) {
    try {
      await fetch(process.env.EMAIL_SERVICE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: process.env.ADMIN_EMAIL,
          subject: `🚨 Critical Performance Alert: ${alert.type}`,
          message: `
Critical performance alert detected:

Type: ${alert.type}
Message: ${alert.message}
Metric: ${alert.metric}
Value: ${alert.value}
Threshold: ${alert.threshold}
Timestamp: ${alert.timestamp}

Context: ${JSON.stringify(alert.context, null, 2)}

Please investigate immediately.
          `,
          priority: 'high'
        })
      });
    } catch (error) {
      console.error('[PERFORMANCE ALERT] Failed to send email notification:', error);
    }
  }

  // Send Slack notification if configured
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 *Critical Performance Alert*`,
          attachments: [{
            color: 'danger',
            fields: [
              { title: 'Type', value: alert.type, short: true },
              { title: 'Metric', value: alert.metric, short: true },
              { title: 'Value', value: alert.value.toString(), short: true },
              { title: 'Threshold', value: alert.threshold.toString(), short: true },
              { title: 'Message', value: alert.message, short: false },
              { title: 'Timestamp', value: alert.timestamp, short: true }
            ]
          }]
        })
      });
    } catch (error) {
      console.error('[PERFORMANCE ALERT] Failed to send Slack notification:', error);
    }
  }
}

async function sendToWebhook(alert: PerformanceAlert) {
  try {
    await fetch(process.env.PERFORMANCE_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'performance_alert',
        alert,
        timestamp: new Date().toISOString(),
        service: 'mariia-hub-booking-system'
      })
    });
  } catch (error) {
    console.error('[PERFORMANCE ALERT] Failed to send webhook:', error);
  }
}