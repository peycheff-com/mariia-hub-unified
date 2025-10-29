-- Add Sentry DSN key and extend public read policy to include it

INSERT INTO public.integration_settings (key, description, is_configured)
VALUES (
  'sentry_dsn',
  'Sentry DSN for error monitoring (frontend)',
  false
)
ON CONFLICT (key) DO UPDATE SET
  description = 'Sentry DSN for error monitoring (frontend)',
  updated_at = now();

-- Recreate public read policy to include sentry_dsn
DROP POLICY IF EXISTS "Public read safe integration settings" ON public.integration_settings;
CREATE POLICY "Public read safe integration settings"
  ON public.integration_settings
  FOR SELECT
  USING (
    key IN (
      'booksy_business_url',
      'google_analytics_id',
      'facebook_pixel_id',
      'google_tag_manager_id',
      'sentry_dsn'
    )
  );


