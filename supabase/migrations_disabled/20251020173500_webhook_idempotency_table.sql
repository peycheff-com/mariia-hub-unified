-- Store processed webhook events to ensure idempotency
create table if not exists public.processed_webhook_events (
  id text primary key,
  created_at timestamptz not null default now()
);

-- RLS is not needed for service-role usage; allow read for admins if desired later.

