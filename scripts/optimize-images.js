#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '../public');
const ASSETS_DIR = path.join(PUBLIC_DIR, 'assets');
const OPTIMIZED_DIR = path.join(PUBLIC_DIR, 'assets', 'optimized');

// Image quality settings
const WEBP_QUALITY = 85;
const JPEG_QUALITY = 85;
const PNG_QUALITY = 90;

// Supported formats
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG'];

function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getOptimizedPath(originalPath) {
  const relativePath = path.relative(ASSETS_DIR, originalPath);
  const optimizedPath = path.join(OPTIMIZED_DIR, relativePath);
  const dir = path.dirname(optimizedPath);

  ensureDirExists(dir);
  return optimizedPath;
}

function isCwebpAvailable() {
  try {
    execSync('cwebp -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function isOptimAvailable() {
  try {
    execSync('optipng -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function optimizeJpeg(inputPath, outputPath) {
  try {
    // Try using cwebp for WebP conversion
    if (isCwebpAvailable()) {
      const webpPath = outputPath.replace(/\.(jpg|jpeg)$/i, '.webp');
      execSync(`cwebp -q ${WEBP_QUALITY} "${inputPath}" -o "${webpPath}"`, { stdio: 'ignore' });
      console.log(`✓ Created WebP: ${path.relative(PUBLIC_DIR, webpPath)}`);
    }

    // Also create optimized JPEG
    try {
      execSync(`convert "${inputPath}" -quality ${JPEG_QUALITY} -strip "${outputPath}"`, { stdio: 'ignore' });
      console.log(`✓ Optimized JPEG: ${path.relative(PUBLIC_DIR, outputPath)}`);
    } catch {
      // Fallback: just copy the file
      fs.copyFileSync(inputPath, outputPath);
      console.log(`! Copied JPEG (imagemagick not available): ${path.relative(PUBLIC_DIR, outputPath)}`);
    }
  } catch (error) {
    console.error(`✗ Failed to optimize JPEG: ${inputPath}`, error.message);
  }
}

function optimizePng(inputPath, outputPath) {
  try {
    // Try using cwebp for WebP conversion
    if (isCwebpAvailable()) {
      const webpPath = outputPath.replace(/\.png$/i, '.webp');
      execSync(`cwebp -q ${WEBP_QUALITY} -lossless "${inputPath}" -o "${webpPath}"`, { stdio: 'ignore' });
      console.log(`✓ Created WebP: ${path.relative(PUBLIC_DIR, webpPath)}`);
    }

    // Also create optimized PNG
    if (isOptimAvailable()) {
      execSync(`optipng -o2 -quiet "${outputPath}"`, { stdio: 'ignore' });
      fs.copyFileSync(inputPath, outputPath);
      console.log(`✓ Optimized PNG: ${path.relative(PUBLIC_DIR, outputPath)}`);
    } else {
      try {
        execSync(`convert "${inputPath}" -quality ${PNG_QUALITY} -strip "${outputPath}"`, { stdio: 'ignore' });
        console.log(`✓ Optimized PNG: ${path.relative(PUBLIC_DIR, outputPath)}`);
      } catch {
        // Fallback: just copy the file
        fs.copyFileSync(inputPath, outputPath);
        console.log(`! Copied PNG (optimization tools not available): ${path.relative(PUBLIC_DIR, outputPath)}`);
      }
    }
  } catch (error) {
    console.error(`✗ Failed to optimize PNG: ${inputPath}`, error.message);
  }
}

function findImages(dir, images = []) {
  if (!fs.existsSync(dir)) return images;

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      findImages(fullPath, images);
    } else if (SUPPORTED_FORMATS.some(ext => file.endsWith(ext))) {
      images.push(fullPath);
    }
  }

  return images;
}

function generateOptimizedMapping() {
  const mapping = {};
  const images = findImages(ASSETS_DIR);

  for (const imagePath of images) {
    const relativePath = path.relative(ASSETS_DIR, imagePath);
    const optimizedPath = path.relative(PUBLIC_DIR, getOptimizedPath(imagePath));

    mapping[relativePath] = {
      original: path.relative(PUBLIC_DIR, imagePath),
      optimized: optimizedPath,
      webp: optimizedPath.replace(/\.(jpg|jpeg|png)$/i, '.webp'),
    };
  }

  return mapping;
}

function main() {
  console.log('🖼️  Image Optimization Script');
  console.log('================================');

  // Check for required tools
  console.log('📋 Checking optimization tools...');
  const hasCwebp = isCwebpAvailable();
  const hasOptim = isOptimAvailable();

  if (!hasCwebp) {
    console.log('⚠️  cwebp not found. WebP conversion will be skipped.');
    console.log('   Install with: brew install webp (macOS) or apt-get install webp (Ubuntu)');
  }

  if (!hasOptim) {
    console.log('⚠️  optipng not found. PNG optimization will be limited.');
    console.log('   Install with: brew install optipng (macOS) or apt-get install optipng (Ubuntu)');
  }

  console.log('\n📁 Finding images to optimize...');
  const images = findImages(ASSETS_DIR);

  if (images.length === 0) {
    console.log('No images found to optimize.');
    return;
  }

  console.log(`Found ${images.length} images to optimize.\n`);

  // Optimize each image
  for (const imagePath of images) {
    const ext = path.extname(imagePath);
    const optimizedPath = getOptimizedPath(imagePath);

    console.log(`Processing: ${path.relative(ASSETS_DIR, imagePath)}`);

    if (['.jpg', '.jpeg'].includes(ext)) {
      optimizeJpeg(imagePath, optimizedPath);
    } else if (ext === '.png') {
      optimizePng(imagePath, optimizedPath);
    }
  }

  // Generate mapping file
  console.log('\n📝 Generating optimization mapping...');
  const mapping = generateOptimizedMapping();
  const mappingPath = path.join(__dirname, '../public/image-mapping.json');

  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
  console.log(`✓ Mapping saved to: ${path.relative(process.cwd(), mappingPath)}`);

  console.log('\n🎉 Image optimization complete!');
  console.log('\nUsage in React components:');
  console.log('```tsx');
  console.log('import OptimizedImage from "@/components/ui/optimized-image";');
  console.log('');
  console.log('<OptimizedImage');
  console.log('  src="/assets/optimized/your-image.webp"');
  console.log('  fallbackSrc="/assets/optimized/your-image.jpg"');
  console.log('  alt="Description"');
  console.log('  width={800}');
  console.log('  height={600}');
  console.log('  className="w-full h-auto"');
  console.log('/>');
  console.log('```');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, findImages, generateOptimizedMapping };