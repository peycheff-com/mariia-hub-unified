/**
 * Booksy Webhook Handler
 *
 * Handles incoming webhooks from Booksy for real-time updates
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

import { booksyClient } from '@/services/booksy-api-client';
import { getRequiredEnvVar } from '@/lib/runtime-env';

const supabase = createClient(
  getRequiredEnvVar('SUPABASE_URL', ['VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL']),
  getRequiredEnvVar('SUPABASE_SERVICE_ROLE_KEY', ['VITE_SUPABASE_SERVICE_ROLE_KEY'])
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
    // Get webhook signature from headers
    const signature = req.headers['x-booksy-signature'] as string;
    if (!signature) {
      console.error('Missing webhook signature');
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Verify webhook signature
    const payload = JSON.stringify(req.body);
    if (!booksyClient.verifyWebhookSignature(payload, signature)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Process the webhook event
    await booksyClient.processWebhookEvent(req.body);

    // Log webhook received
    await supabase
      .from('webhook_logs')
      .insert({
        source: 'booksy',
        event: req.body.event,
        received_at: new Date(),
        processed: true,
        raw_data: req.body
      });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);

    // Log error
    await supabase
      .from('webhook_logs')
      .insert({
        source: 'booksy',
        event: req.body?.event || 'unknown',
        received_at: new Date(),
        processed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        raw_data: req.body
      });

    return res.status(500).json({ error: 'Internal server error' });
  }
}
