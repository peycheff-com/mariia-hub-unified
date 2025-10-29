-- Initialize sentry_dsn to empty so frontend disables Sentry until a real DSN is provided
INSERT INTO public.integration_settings (key, value, description, is_configured)
VALUES ('sentry_dsn', '', 'Sentry DSN for error monitoring (frontend)', false)
ON CONFLICT (key) DO UPDATE SET
  value = '',
  is_configured = false,
  updated_at = now();


