#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PUBLIC_DIR = path.join(__dirname, '../public');
const QUALITY = 80;
const ENABLE_WEBP = true;
const ENABLE_COMPRESSION = true;
const DELETE_ORIGINALS = false;

// Console colors for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Check if required dependencies are installed
function checkDependencies() {
  const required = ['sharp'];
  const missing = [];

  for (const dep of required) {
    try {
      require.resolve(dep);
    } catch (e) {
      missing.push(dep);
    }
  }

  if (missing.length > 0) {
    log(`\n❌ Missing dependencies: ${missing.join(', ')}`, 'red');
    log('Installing missing dependencies...\n', 'yellow');
    execSync(`npm install --save-dev ${missing.join(' ')}`, { stdio: 'inherit' });
    log('✅ Dependencies installed successfully!\n', 'green');
  }
}

// Image optimization with Sharp
async function optimizeImage(inputPath, outputPath, options = {}) {
  const sharp = require('sharp');

  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    // Handle animated GIFs
    if (metadata.format === 'gif' && metadata.pages > 1) {
      log(`⏭️  Skipping animated GIF: ${path.basename(inputPath)}`, 'yellow');
      return false;
    }

    let pipeline = image;

    // Resize if width is specified
    if (options.width) {
      pipeline = pipeline.resize(options.width, null, {
        withoutEnlargement: true,
        fit: 'inside',
      });
    }

    // Apply optimizations
    if (options.format === 'webp') {
      pipeline = pipeline.webp({ quality: QUALITY, effort: 4 });
    } else if (options.format === 'jpeg') {
      pipeline = pipeline.jpeg({ quality: QUALITY, progressive: true });
    } else if (options.format === 'png') {
      pipeline = pipeline.png({ quality: QUALITY, progressive: true });
    }

    await pipeline.toFile(outputPath);

    const originalSize = fs.statSync(inputPath).size;
    const optimizedSize = fs.statSync(outputPath).size;
    const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);

    log(`✅ ${path.basename(inputPath)} → ${path.basename(outputPath)} (Saved ${savings}%)`, 'green');
    return true;
  } catch (error) {
    log(`❌ Error optimizing ${inputPath}: ${error.message}`, 'red');
    return false;
  }
}

// Process directory recursively
async function processDirectory(dir, options = {}) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let totalSavings = 0;
  let processedCount = 0;

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const subResults = await processDirectory(fullPath, options);
      totalSavings += subResults.savings;
      processedCount += subResults.count;
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      const supportedExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'];

      if (supportedExts.includes(ext)) {
        const originalSize = fs.statSync(fullPath).size;

        // Create WebP version
        if (ENABLE_WEBP) {
          const webpPath = fullPath.replace(ext, '.webp');

          // Skip if WebP version exists and is newer
          if (fs.existsSync(webpPath)) {
            const originalTime = fs.statSync(fullPath).mtime;
            const webpTime = fs.statSync(webpPath).mtime;

            if (webpTime > originalTime) {
              log(`⏭️  Skipping (WebP already exists): ${entry.name}`, 'cyan');
            } else {
              await optimizeImage(fullPath, webpPath, { ...options, format: 'webp' });
            }
          } else {
            await optimizeImage(fullPath, webpPath, { ...options, format: 'webp' });
          }
        }

        // Compress original if enabled
        if (ENABLE_COMPRESSION && ext !== '.webp') {
          const outputPath = fullPath.replace(ext, `.optimized${ext}`);
          const skipOptimization = fs.existsSync(outputPath) &&
            fs.statSync(outputPath).mtime > fs.statSync(fullPath).mtime;

          if (!skipOptimization) {
            await optimizeImage(fullPath, outputPath, { ...options, format: ext.slice(1) });
          }
        }

        processedCount++;
      }
    }
  }

  return { savings: totalSavings, count: processedCount };
}

// Create manifest for optimized assets
function createManifest(results) {
  const manifest = {
    generated: new Date().toISOString(),
    totalProcessed: results.count,
    totalSavings: results.savings,
    settings: {
      quality: QUALITY,
      webpEnabled: ENABLE_WEBP,
      compressionEnabled: ENABLE_COMPRESSION,
    },
  };

  fs.writeFileSync(
    path.join(__dirname, '../public/optimization-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  log('\n📝 Created optimization manifest', 'blue');
}

// Update HTML files to use WebP where appropriate
function updateHTMLForWebP() {
  if (!ENABLE_WEBP) return;

  const indexHTML = path.join(__dirname, '../index.html');

  if (!fs.existsSync(indexHTML)) {
    log('\n⚠️  index.html not found, skipping HTML update', 'yellow');
    return;
  }

  let html = fs.readFileSync(indexHTML, 'utf8');

  // Add WebP support detection
  if (!html.includes('supportsWebP')) {
    const script = `
    <script>
      // Check WebP support
      function checkWebPSupport() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      }

      if (checkWebPSupport()) {
        document.documentElement.classList.add('webp');
      } else {
        document.documentElement.classList.add('no-webp');
      }
    </script>`;

    html = html.replace('</head>', `${script}</head>`);
    fs.writeFileSync(indexHTML, html);
    log('\n✅ Added WebP support detection to index.html', 'green');
  }
}

// Main execution
async function main() {
  log('\n🚀 Starting Asset Optimization Pipeline...\n', 'bright');
  log('⚙️  Configuration:', 'cyan');
  log(`   • Quality: ${QUALITY}%`);
  log(`   • WebP conversion: ${ENABLE_WEBP ? 'Enabled' : 'Disabled'}`);
  log(`   • Image compression: ${ENABLE_COMPRESSION ? 'Enabled' : 'Disabled'}`);
  log(`   • Delete originals: ${DELETE_ORIGINALS ? 'Yes' : 'No'}\n`);

  const startTime = Date.now();

  // Check dependencies
  checkDependencies();

  // Ensure public directory exists
  if (!fs.existsSync(PUBLIC_DIR)) {
    log(`❌ Public directory not found: ${PUBLIC_DIR}`, 'red');
    process.exit(1);
  }

  // Process assets
  log('📁 Processing assets...\n', 'blue');
  const results = await processDirectory(PUBLIC_DIR);

  // Create optimization manifest
  createManifest(results);

  // Update HTML for WebP support
  updateHTMLForWebP();

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  log(`\n✨ Asset optimization completed in ${duration}s`, 'bright');
  log(`📊 Processed ${results.count} files`, 'blue');
  log(`💾 Total savings: ${results.savings.toFixed(0)} bytes\n`, 'green');

  // Usage instructions
  log('📝 Usage Instructions:\n', 'cyan');
  log('For React components, use the LazyImage component from @/components/ui/lazy-image');
  log('\nExample:');
  log('<LazyImage src="/assets/image.jpg" alt="Description" webpSrc="/assets/image.webp" />\n');

  if (ENABLE_WEBP) {
    log('For HTML, use picture elements:');
    log(`
<picture>
  <source srcset="/assets/image.webp" type="image/webp">
  <source srcset="/assets/image.jpg" type="image/jpeg">
  <img src="/assets/image.jpg" alt="Description" loading="lazy">
</picture>
    `);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--webp-only')) {
  ENABLE_COMPRESSION = false;
  log('\n🔧 WebP-only mode enabled\n', 'yellow');
} else if (args.includes('--compress-only')) {
  ENABLE_WEBP = false;
  log('\n🔧 Compression-only mode enabled\n', 'yellow');
}

// Run the optimization
main().catch(error => {
  log(`\n❌ An error occurred: ${error.message}`, 'red');
  if (env.DEBUG) console.error(error.stack);
  process.exit(1);
});