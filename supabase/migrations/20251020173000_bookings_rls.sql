-- Enable RLS and define policies for public.bookings
-- Security priority: ensure users access only their own bookings; admins manage all

-- 1) Enable Row Level Security
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 2) User can CRUD their own bookings
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bookings' AND policyname = 'bookings_user_own_crud'
  ) THEN
    DROP POLICY "bookings_user_own_crud" ON public.bookings;
  END IF;
END $$;

CREATE POLICY "bookings_user_own_crud"
  ON public.bookings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3) Admins can manage all bookings (requires JWT claim is_admin = true)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bookings' AND policyname = 'bookings_admin_all'
  ) THEN
    DROP POLICY "bookings_admin_all" ON public.bookings;
  END IF;
END $$;

CREATE POLICY "bookings_admin_all"
  ON public.bookings
  FOR ALL
  TO authenticated
  USING ((coalesce((auth.jwt() ->> 'is_admin')::boolean, false)) = true)
  WITH CHECK ((coalesce((auth.jwt() ->> 'is_admin')::boolean, false)) = true);

-- Note: Service role key bypasses RLS by design; booking/payment edge functions should use service role where appropriate


