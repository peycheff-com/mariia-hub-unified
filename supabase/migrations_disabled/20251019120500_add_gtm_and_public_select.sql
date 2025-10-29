-- Add Google Tag Manager ID and allow public read of safe integration settings

-- 1) Ensure GTM key exists
INSERT INTO public.integration_settings (key, description, is_configured)
VALUES (
  'google_tag_manager_id',
  'Google Tag Manager container ID (e.g., GTM-XXXXXXX)',
  false
)
ON CONFLICT (key) DO UPDATE SET
  description = 'Google Tag Manager container ID (e.g., GTM-XXXXXXX)',
  updated_at = now();

-- 2) Public read policy for non-sensitive settings
DROP POLICY IF EXISTS "Public read safe integration settings" ON public.integration_settings;
CREATE POLICY "Public read safe integration settings"
  ON public.integration_settings
  FOR SELECT
  USING (
    key IN (
      'booksy_business_url',
      'google_analytics_id',
      'facebook_pixel_id',
      'google_tag_manager_id'
    )
  );


