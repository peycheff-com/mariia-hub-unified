// API ENDPOINT FOR PERFORMANCE LOGGING
// Receives performance metrics from frontend and stores them for analysis

import { NextApiRequest, NextApiResponse } from 'next';

interface PerformanceLogEntry {
  metricName: string;
  queryTimeMs: number;
  resultCount?: number;
  metadata?: Record<string, any>;
  timestamp: string;
  userAgent?: string;
  sessionId?: string;
  userId?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const performanceData: PerformanceLogEntry = req.body;

    // Validate required fields
    if (!performanceData.metricName || typeof performanceData.queryTimeMs !== 'number') {
      return res.status(400).json({ error: 'Invalid performance data format' });
    }

    // Add request metadata
    performanceData.userAgent = req.headers['user-agent'];
    performanceData.timestamp = performanceData.timestamp || new Date().toISOString();

    // In production, store this in your monitoring system
    // For now, we'll log to console and optionally store in database
    console.log('[PERFORMANCE API]', {
      metric: performanceData.metricName,
      time: performanceData.queryTimeMs,
      timestamp: performanceData.timestamp,
      userAgent: performanceData.userAgent
    });

    // Store in Supabase if configured
    if (process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_TRACKING === 'true') {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        await supabase.from('performance_metrics').insert({
          metric_name: performanceData.metricName,
          query_time_ms: performanceData.queryTimeMs,
          result_count: performanceData.resultCount,
          metadata: performanceData.metadata || {},
          user_agent: performanceData.userAgent,
          session_id: performanceData.sessionId,
          user_id: performanceData.userId,
          created_at: performanceData.timestamp
        });

      } catch (dbError) {
        console.error('[PERFORMANCE API] Failed to store in database:', dbError);
        // Don't fail the request if database storage fails
      }
    }

    // Check if this is a critical performance issue that needs immediate attention
    if (performanceData.queryTimeMs > 5000) { // 5 seconds
      console.error('[PERFORMANCE CRITICAL]', {
        metric: performanceData.metricName,
        time: performanceData.queryTimeMs,
        timestamp: performanceData.timestamp
      });

      // Here you could send alerts to your monitoring system
      // await sendCriticalAlert(performanceData);
    }

    return res.status(200).json({ success: true, logged: true });

  } catch (error) {
    console.error('[PERFORMANCE API] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}