-- Add payment tracking fields to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending' 
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
ADD COLUMN IF NOT EXISTS amount_paid numeric(10,2),
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'pln',
ADD COLUMN IF NOT EXISTS price_id text,
ADD COLUMN IF NOT EXISTS is_package boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sessions_remaining integer;

-- Add index for payment lookups
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_session ON public.bookings(stripe_checkout_session_id);

-- Update services table to link with Stripe
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS stripe_price_id text,
ADD COLUMN IF NOT EXISTS is_package boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS package_sessions integer;

-- Create booking packages table for tracking multi-session packages
CREATE TABLE IF NOT EXISTS public.booking_packages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  stripe_price_id text NOT NULL,
  total_sessions integer NOT NULL,
  sessions_used integer NOT NULL DEFAULT 0,
  sessions_remaining integer NOT NULL,
  amount_paid numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'pln',
  purchased_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on booking_packages
ALTER TABLE public.booking_packages ENABLE ROW LEVEL SECURITY;

-- Policies for booking_packages
CREATE POLICY "Users can view own packages"
ON public.booking_packages
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all packages"
ON public.booking_packages
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexes for booking_packages
CREATE INDEX IF NOT EXISTS idx_booking_packages_user_id ON public.booking_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_packages_status ON public.booking_packages(status);