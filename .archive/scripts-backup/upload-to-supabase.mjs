#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Usage: node scripts/upload-to-supabase.mjs <localFilePath> <bucket> <targetPath> <siteImageKey> <altText> <title>
// Example: node scripts/upload-to-supabase.mjs ./src/assets/hero-brows.png landing-images beauty-brows/hero-1600x900.png hero-brows "PMU Brows — healed natural result" "Hero Brows"

const SUPABASE_URL = 'https://lckxvimdqnfjzkbrusgu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxja3h2aW1kcW5manprYnJ1c2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MTA0NTUsImV4cCI6MjA3NjA4NjQ1NX0.7Pk89NeTTVLtpn6ClpndiliFoYg_vj0fhmJVKU8BF0A';

async function main() {
  const [localFilePath, bucket, targetPath, siteImageKey, altText, title] = process.argv.slice(2);
  if (!localFilePath || !bucket || !targetPath) {
    console.error('Usage: node scripts/upload-to-supabase.mjs <localFilePath> <bucket> <targetPath> <siteImageKey> <altText> <title>');
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(path.resolve(localFilePath));
  const contentType = localFilePath.endsWith('.png') ? 'image/png' : localFilePath.endsWith('.webp') ? 'image/webp' : 'image/jpeg';

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Upload
  const { error: uploadError } = await supabase.storage.from(bucket).upload(targetPath, fileBuffer, {
    contentType,
    cacheControl: '3600',
    upsert: true,
  });
  if (uploadError) {
    console.error('Upload error:', uploadError.message);
    process.exit(2);
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(targetPath);
  const publicUrl = urlData?.publicUrl;
  console.log('Uploaded:', publicUrl);

  if (siteImageKey) {
    // Upsert into site_images
    const { error: upsertError } = await supabase.from('site_images').upsert({
      key: siteImageKey,
      title: title || siteImageKey,
      description: null,
      image_url: publicUrl,
      alt_text: altText || null,
      display_order: 0,
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });
    if (upsertError) {
      console.error('DB upsert error:', upsertError.message);
      process.exit(3);
    }
    console.log('site_images upserted:', siteImageKey);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(99);
});


