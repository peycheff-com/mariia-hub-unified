insert into public.site_images (key, title, description, image_url, alt_text, display_order, is_active, updated_at)
values
  ('hero-brows','Hero Brows',null,'https://lckxvimdqnfjzkbrusgu.supabase.co/storage/v1/object/public/site-images/landing/beauty-brows-hero-1600x900.png','PMU Brows — healed natural result',0,true,now()),
  ('hero-glutes','Hero Glutes',null,'https://lckxvimdqnfjzkbrusgu.supabase.co/storage/v1/object/public/site-images/landing/fitness-glutes-hero-1600x900.png','Glute Sculpt — boutique gym',0,true,now()),
  ('hero-beauty','Hero Beauty',null,'https://lckxvimdqnfjzkbrusgu.supabase.co/storage/v1/object/public/site-images/landing/beauty-hero-1600x900.png','Beauty hero — PMU aesthetic',0,true,now()),
  ('hero-fitness','Hero Fitness',null,'https://lckxvimdqnfjzkbrusgu.supabase.co/storage/v1/object/public/site-images/landing/fitness-hero-1600x900.jpg','Fitness hero — women-first training',0,true,now())
on conflict (key) do update set
  title = excluded.title,
  image_url = excluded.image_url,
  alt_text = excluded.alt_text,
  is_active = excluded.is_active,
  updated_at = now();

