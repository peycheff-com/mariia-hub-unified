#!/usr/bin/env node

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STATS_FILE = join(__dirname, '../dist/stats.json');
const SIZE_LIMITS = {
  total: 1024 * 1024, // 1MB
  chunk: 250 * 1024, // 250KB per chunk
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function checkBundleSize() {
  try {
    const stats = JSON.parse(readFileSync(STATS_FILE, 'utf8'));

    console.log('📦 Bundle Size Analysis\n');

    // Calculate total size
    let totalSize = 0;
    const chunks = [];

    for (const [chunkName, chunkData] of Object.entries(stats.chunks || {})) {
      const size = chunkData.size || 0;
      totalSize += size;
      chunks.push({ name: chunkName, size });
    }

    // Sort by size
    chunks.sort((a, b) => b.size - a.size);

    // Display results
    console.log(`Total Size: ${formatBytes(totalSize)} (limit: ${formatBytes(SIZE_LIMITS.total)})`);
    console.log('\nChunks:');

    let hasWarnings = false;
    let hasErrors = false;

    chunks.forEach(chunk => {
      const status = chunk.size > SIZE_LIMITS.chunk ? '❌' :
                   chunk.size > SIZE_LIMITS.chunk * 0.8 ? '⚠️' : '✅';
      console.log(`${status} ${chunk.name}: ${formatBytes(chunk.size)}`);

      if (chunk.size > SIZE_LIMITS.chunk) {
        hasErrors = true;
      } else if (chunk.size > SIZE_LIMITS.chunk * 0.8) {
        hasWarnings = true;
      }
    });

    console.log('\n');

    // Check total size
    if (totalSize > SIZE_LIMITS.total) {
      console.error(`❌ Total bundle size exceeds limit: ${formatBytes(totalSize)} > ${formatBytes(SIZE_LIMITS.total)}`);
      hasErrors = true;
    } else if (totalSize > SIZE_LIMITS.total * 0.8) {
      console.warn(`⚠️ Total bundle size is close to limit: ${formatBytes(totalSize)} / ${formatBytes(SIZE_LIMITS.total)}`);
    }

    if (hasErrors) {
      console.error('\n❌ Bundle size check failed!');
      process.exit(1);
    } else if (hasWarnings) {
      console.warn('\n⚠️ Bundle size warnings detected');
    } else {
      console.log('✅ Bundle size check passed!');
    }

  } catch (error) {
    console.error('Error checking bundle size:', error);
    process.exit(1);
  }
}

checkBundleSize();