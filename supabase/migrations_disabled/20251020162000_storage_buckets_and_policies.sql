-- Create required Storage buckets if not exist
insert into storage.buckets (id, name, public) values
  ('landing-images', 'landing-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) values
  ('service-images', 'service-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) values
  ('gallery-images', 'gallery-images', true)
on conflict (id) do nothing;

-- Public read policy for all three buckets (create if missing)
do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'Public read landing-images'
  ) then
    create policy "Public read landing-images" on storage.objects for select to public using ( bucket_id = 'landing-images' );
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'Public read service-images'
  ) then
    create policy "Public read service-images" on storage.objects for select to public using ( bucket_id = 'service-images' );
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'Public read gallery-images'
  ) then
    create policy "Public read gallery-images" on storage.objects for select to public using ( bucket_id = 'gallery-images' );
  end if;
end $$;

-- Allow authenticated users to upload/update to these buckets
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Authenticated write landing-images') then
    create policy "Authenticated write landing-images" on storage.objects for insert to authenticated with check ( bucket_id = 'landing-images' );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Authenticated update landing-images') then
    create policy "Authenticated update landing-images" on storage.objects for update to authenticated using ( bucket_id = 'landing-images' ) with check ( bucket_id = 'landing-images' );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Authenticated write service-images') then
    create policy "Authenticated write service-images" on storage.objects for insert to authenticated with check ( bucket_id = 'service-images' );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Authenticated update service-images') then
    create policy "Authenticated update service-images" on storage.objects for update to authenticated using ( bucket_id = 'service-images' ) with check ( bucket_id = 'service-images' );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Authenticated write gallery-images') then
    create policy "Authenticated write gallery-images" on storage.objects for insert to authenticated with check ( bucket_id = 'gallery-images' );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Authenticated update gallery-images') then
    create policy "Authenticated update gallery-images" on storage.objects for update to authenticated using ( bucket_id = 'gallery-images' ) with check ( bucket_id = 'gallery-images' );
  end if;
end $$;

-- RLS: allow admin/service role to upsert site_images and service_gallery
-- Assumes an "is_admin()" helper, otherwise allow authenticated for now.
alter table if exists public.site_images enable row level security;
alter table if exists public.service_gallery enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'site_images read') then
    create policy "site_images read" on public.site_images for select to public using ( true );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'site_images write auth') then
    create policy "site_images write auth" on public.site_images for insert to authenticated with check ( true );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'site_images update auth') then
    create policy "site_images update auth" on public.site_images for update to authenticated using ( true ) with check ( true );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'service_gallery read') then
    create policy "service_gallery read" on public.service_gallery for select to public using ( true );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'service_gallery write auth') then
    create policy "service_gallery write auth" on public.service_gallery for insert to authenticated with check ( true );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'service_gallery update auth') then
    create policy "service_gallery update auth" on public.service_gallery for update to authenticated using ( true ) with check ( true );
  end if;
end $$;

