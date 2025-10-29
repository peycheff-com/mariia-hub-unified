-- Create settings table for third-party integrations
CREATE TABLE IF NOT EXISTS public.integration_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  description text,
  is_configured boolean DEFAULT false,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage settings
CREATE POLICY "Admins can manage integration settings"
  ON public.integration_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_integration_settings_updated_at
  BEFORE UPDATE ON public.integration_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default configuration keys
INSERT INTO public.integration_settings (key, description, is_configured) VALUES
  ('stripe_publishable_key', 'Stripe publishable key for payment processing', false),
  ('booksy_business_id', 'Booksy business ID for appointment syncing', false),
  ('booksy_api_key', 'Booksy API key for integration', false),
  ('whatsapp_phone_number', 'WhatsApp business phone number', false),
  ('whatsapp_api_token', 'WhatsApp Cloud API access token', false),
  ('google_analytics_id', 'Google Analytics tracking ID', false),
  ('facebook_pixel_id', 'Facebook Pixel ID for tracking', false),
  ('instagram_access_token', 'Instagram access token for feed integration', false),
  ('smtp_host', 'Custom SMTP host (optional)', false),
  ('smtp_port', 'Custom SMTP port (optional)', false),
  ('smtp_user', 'Custom SMTP username (optional)', false)
ON CONFLICT (key) DO NOTHING;