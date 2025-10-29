-- Remove sensitive fields and keep only public configuration
DELETE FROM public.integration_settings 
WHERE key IN ('booksy_api_key', 'whatsapp_api_token', 'instagram_access_token', 'smtp_user');

-- Update descriptions for remaining public settings
UPDATE public.integration_settings 
SET description = 'Stripe publishable key (public, safe for frontend)'
WHERE key = 'stripe_publishable_key';

UPDATE public.integration_settings 
SET description = 'Your Booksy business/location ID (public identifier)'
WHERE key = 'booksy_business_id';

UPDATE public.integration_settings 
SET description = 'WhatsApp Business phone number (public, for display)'
WHERE key = 'whatsapp_phone_number';

-- Add comment explaining the table purpose
COMMENT ON TABLE public.integration_settings IS 'Stores PUBLIC configuration only. Sensitive API keys and tokens must be managed via Supabase Edge Function Secrets.';