#!/usr/bin/env node

import { readFile, readdir, writeFile } from 'fs/promises';
import { resolve, extname } from 'path';
import { gzipSync } from 'zlib';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

async function analyzeBundle() {
  console.log('🔍 Analyzing bundle size...\n');

  // The build was already run by npm script, just analyze the output
  const distPath = resolve('dist');
  const assetsPath = resolve('dist', 'assets');

  // Get files from dist root
  const rootFiles = await readdir(distPath);
  // Get files from assets folder
  const assetFiles = await readdir(assetsPath);

  // Combine JS and CSS files from both locations
  const jsAndCssFiles = [
    ...rootFiles.filter(file => file.endsWith('.js') || file.endsWith('.css')),
    ...assetFiles.map(file => `assets/${file}`).filter(file => file.endsWith('.js') || file.endsWith('.css'))
  ];

  const analysis = [];
  let totalSize = 0;
  let totalGzipped = 0;
  let totalImageSize = 0;

  // Analyze JS and CSS files
  for (const file of jsAndCssFiles) {
    const filePath = resolve(distPath, file);
    const fileContent = await readFile(filePath);
    const gzipped = gzipSync(fileContent);

    const size = fileContent.length;
    const gzippedSize = gzipped.length;

    totalSize += size;
    totalGzipped += gzippedSize;

    // Determine type from filename
    let type = 'unknown';
    if (file.includes('vendor')) type = 'vendor';
    else if (file.includes('react')) type = 'react';
    else if (file.includes('ui')) type = 'ui';
    else if (file.includes('charts')) type = 'charts';
    else if (file.includes('supabase')) type = 'supabase';
    else if (file.includes('page')) type = 'page';
    else if (file.includes('component')) type = 'component';
    else if (file === 'index-BKEEThe5.js') type = 'main';
    else if (file.includes('router')) type = 'router';

    analysis.push({
      name: file.replace(/\.[^/.]+$/, ""), // Remove extension
      file,
      type,
      size,
      gzippedSize,
      ext: extname(file),
    });
  }

  // Analyze images
  const imageFiles = [
    ...rootFiles.filter(file => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file)),
    ...assetFiles.map(file => `assets/${file}`).filter(file => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file))
  ];

  for (const file of imageFiles) {
    const filePath = resolve(distPath, file);
    const stat = await readFile(filePath);
    totalImageSize += stat.length;
  }

  // Sort by size
  analysis.sort((a, b) => b.size - a.size);

  // Print results
  console.log('📦 Bundle Analysis Results\n');
  console.log('Name'.padEnd(40), 'Type'.padEnd(12), 'Size'.padEnd(12), 'Gzipped'.padEnd(12), 'File');
  console.log('-'.repeat(100));

  for (const item of analysis) {
    const name = item.name.length > 38 ? item.name.substring(0, 35) + '...' : item.name;
    const size = formatBytes(item.size);
    const gzipped = formatBytes(item.gzippedSize);

    console.log(
      name.padEnd(40),
      item.type.padEnd(12),
      size.padEnd(12),
      gzipped.padEnd(12),
      item.file
    );
  }

  console.log('-'.repeat(100));
  console.log(
    'JavaScript/CSS Total'.padEnd(40),
    ''.padEnd(12),
    formatBytes(totalSize).padEnd(12),
    formatBytes(totalGzipped).padEnd(12)
  );
  console.log(
    'Images Total'.padEnd(40),
    ''.padEnd(12),
    formatBytes(totalImageSize).padEnd(12),
    ''.padEnd(12)
  );
  console.log(
    'Complete Bundle'.padEnd(40),
    ''.padEnd(12),
    formatBytes(totalSize + totalImageSize).padEnd(12),
    formatBytes(totalGzipped + Math.round(totalImageSize * 0.7)).padEnd(12) // Assuming ~70% compression for images
  );

  // Analysis
  console.log('\n📊 Analysis Summary:');

  // Check for large chunks
  const largeChunks = analysis.filter(item => item.size > 100000);
  if (largeChunks.length > 0) {
    console.log('\n⚠️  Large Chunks (>100KB):');
    largeChunks.forEach(chunk => {
      console.log(`   ${chunk.name} (${chunk.type}): ${formatBytes(chunk.size)}`);
    });
  } else {
    console.log('\n✅ All JavaScript/CSS chunks are under 100KB');
  }

  // Image optimization
  console.log('\n🖼️  Images Analysis:');
  if (totalImageSize > 5000000) { // 5MB
    console.log(`⚠️  Large images detected: ${formatBytes(totalImageSize)}`);
    console.log('   - Consider using WebP format for better compression');
    console.log('   - Implement lazy loading for images');
    console.log('   - Use responsive images with srcset');
  } else {
    console.log(`✅ Total image size is reasonable: ${formatBytes(totalImageSize)}`);
  }

  // Chunk analysis
  console.log('\n🔍 Chunk Distribution:');
  const typeTotals = {};
  analysis.forEach(item => {
    if (!typeTotals[item.type]) {
      typeTotals[item.type] = { count: 0, size: 0 };
    }
    typeTotals[item.type].count++;
    typeTotals[item.type].size += item.size;
  });

  Object.entries(typeTotals).forEach(([type, data]) => {
    console.log(`   ${type}: ${data.count} chunks, ${formatBytes(data.size)}`);
  });

  // Recommendations
  console.log('\n💡 Optimization Recommendations:');

  if (totalSize > 1000000) {
    console.log('   - Total JS/CSS size exceeds 1MB. Consider more aggressive code splitting.');
  }

  const vendorSize = typeTotals.vendor?.size || 0;
  if (vendorSize > 400000) {
    console.log(`   - Vendor chunk is large (${formatBytes(vendorSize)}). Consider splitting by library.`);
  }

  if (analysis.filter(item => item.type === 'component').length > 1) {
    console.log('   - Multiple component chunks detected. Consider consolidating.');
  }

  if (!largeChunks.length && totalSize < 500000) {
    console.log('   - ✅ Bundle size is well optimized!');
  }

  console.log('\n   🚀 To visualize the bundle, open dist/stats.html in your browser');

  // Write detailed report
  const report = {
    timestamp: new Date().toISOString(),
    totalJSSize: totalSize,
    totalGzipped,
    totalImageSize,
    totalBundleSize: totalSize + totalImageSize,
    chunks: analysis,
    typeDistribution: typeTotals,
    largeChunks,
    recommendations: getRecommendations(analysis, totalSize, totalImageSize),
  };

  await writeFile('dist/bundle-analysis.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Detailed report saved to: dist/bundle-analysis.json');
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function getRecommendations(analysis, totalSize, totalImageSize) {
  const recommendations = [];

  // Check specific libraries
  const chunksByName = Object.fromEntries(analysis.map(c => [c.name, c]));

  if (chunksByName['components'] && chunksByName['components'].size > 300000) {
    recommendations.push({
      type: 'large-components',
      message: 'Components chunk is large. Consider lazy loading heavy components.',
      impact: 'high',
    });
  }

  if (totalImageSize > 5000000) {
    recommendations.push({
      type: 'image-optimization',
      message: 'Images are taking significant space. Optimize and consider WebP format.',
      impact: 'high',
    });
  }

  if (totalSize > 1000000) {
    recommendations.push({
      type: 'bundle-size',
      message: 'JavaScript bundle is large. Implement route-based code splitting.',
      impact: 'medium',
    });
  }

  // Good practices
  const allChunksSmall = analysis.every(c => c.size < 100000);
  if (allChunksSmall) {
    recommendations.push({
      type: 'good-practice',
      message: 'All chunks are well-sized (<100KB). Good job!',
      impact: 'positive',
    });
  }

  return recommendations;
}

analyzeBundle().catch(console.error);