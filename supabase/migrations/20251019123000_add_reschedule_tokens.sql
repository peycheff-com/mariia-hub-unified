-- Add reschedule and optional cancellation tokens to bookings

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS reschedule_token text,
  ADD COLUMN IF NOT EXISTS reschedule_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_token text,
  ADD COLUMN IF NOT EXISTS cancellation_token_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_bookings_reschedule_token ON public.bookings(reschedule_token);
CREATE INDEX IF NOT EXISTS idx_bookings_reschedule_token_expires_at ON public.bookings(reschedule_token_expires_at);


