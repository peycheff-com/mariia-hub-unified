#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PUBLIC_DIR = path.join(__dirname, '../public');
const ASSETS_DIR = path.join(PUBLIC_DIR, 'assets');
const QUALITY = 80; // WebP quality (0-100)
const DELETE_ORIGINALS = false; // Set to true to delete original images after conversion

// Supported image formats
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'];

// Check if sharp is installed
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.log('⚠️  Sharp is not installed. Installing it now...');
  try {
    execSync('npm install --save-dev sharp', { stdio: 'inherit' });
    sharp = require('sharp');
  } catch (installError) {
    console.error('❌ Failed to install sharp. Please run: npm install --save-dev sharp');
    process.exit(1);
  }
}

// Create WebP conversion function
async function convertToWebP(inputPath, outputPath) {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    // Handle animated GIFs
    if (metadata.format === 'gif' && metadata.pages > 1) {
      console.log(`⏭️  Skipping animated GIF: ${path.basename(inputPath)}`);
      return false;
    }

    await image
      .webp({ quality: QUALITY, effort: 4 })
      .toFile(outputPath);

    const originalSize = fs.statSync(inputPath).size;
    const webpSize = fs.statSync(outputPath).size;
    const savings = ((originalSize - webpSize) / originalSize * 100).toFixed(1);

    console.log(`✅ ${path.basename(inputPath)} → ${path.basename(outputPath)} (Saved ${savings}%)`);
    return true;
  } catch (error) {
    console.error(`❌ Error converting ${inputPath}:`, error.message);
    return false;
  }
}

// Process directory recursively
async function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();

      if (SUPPORTED_FORMATS.includes(ext)) {
        const webpPath = fullPath.replace(ext, '.webp');

        // Skip if WebP version already exists and is newer
        if (fs.existsSync(webpPath)) {
          const originalTime = fs.statSync(fullPath).mtime;
          const webpTime = fs.statSync(webpPath).mtime;

          if (webpTime > originalTime) {
            console.log(`⏭️  Skipping (WebP already exists): ${entry.name}`);
            continue;
          }
        }

        await convertToWebP(fullPath, webpPath);

        // Optionally delete original files
        if (DELETE_ORIGINALS) {
          try {
            fs.unlinkSync(fullPath);
            console.log(`🗑️  Deleted original: ${entry.name}`);
          } catch (error) {
            console.error(`❌ Error deleting ${fullPath}:`, error.message);
          }
        }
      }
    }
  }
}

// Create picture element markup generator
function generatePictureMarkup() {
  console.log('\n📝 Generating <picture> markup examples...');

  console.log(`
For responsive WebP images, use this markup pattern:

<picture>
  <source srcset="/assets/your-image.webp" type="image/webp">
  <source srcset="/assets/your-image.jpg" type="image/jpeg">
  <img src="/assets/your-image.jpg" alt="Description" loading="lazy">
</picture>

For React components:

import { LazyImage } from '@/components/ui/lazy-image';

<LazyImage
  src="/assets/your-image.jpg"
  webpSrc="/assets/your-image.webp"
  alt="Description"
  className="w-full h-auto"
/>
`);
}

// Main execution
async function main() {
  console.log('🚀 Starting WebP conversion for all images...');
  console.log(`📁 Processing directory: ${PUBLIC_DIR}`);
  console.log(`🎯 Quality setting: ${QUALITY}%`);
  console.log(`🗑️  Delete originals: ${DELETE_ORIGINALS ? 'Yes' : 'No'}\n`);

  const startTime = Date.now();

  if (!fs.existsSync(PUBLIC_DIR)) {
    console.error(`❌ Public directory not found: ${PUBLIC_DIR}`);
    process.exit(1);
  }

  await processDirectory(PUBLIC_DIR);

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log(`\n✨ WebP conversion completed in ${duration}s`);
  generatePictureMarkup();
}

// Run the script
main().catch(error => {
  console.error('❌ An error occurred:', error);
  process.exit(1);
});