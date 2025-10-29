-- Schedule daily package expiration using pg_cron without exposing Edge Function

-- Enable pg_cron extension
create extension if not exists pg_cron;

-- Create a simple SQL function to expire packages
create or replace function public.expire_booking_packages_sql()
returns void
language sql
security definer
as $$
  update booking_packages
     set status = 'expired'
   where status = 'active'
     and expires_at is not null
     and expires_at <= now();
$$;

-- Create daily schedule at 03:00 server time
select cron.schedule(
  'daily-expire-booking-packages',
  '0 3 * * *',
  $$select public.expire_booking_packages_sql();$$
);


