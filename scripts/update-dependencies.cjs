#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Safe dependency update script
// This script updates packages safely with version checks

// Safe to update (patch/minor versions only)
const SAFE_UPDATES = [
  '@supabase/supabase-js', // 2.75.1 -> 2.76.1
  '@types/node', // 22.18.11 -> 22.18.12
  'dompurify', // Already latest
  'typescript', // 5.7.3 -> 5.8.2
  'vite', // 6.2.3 -> 6.3.5
];

// Major version updates (need careful testing)
const MAJOR_UPDATES = [
  // React 19 - wait for ecosystem
  // '@hookform/resolvers' - 3.10.0 -> 5.2.2 (breaking changes)
];

console.log('🔄 Starting safe dependency updates...\n');

async function checkAndInstall(packageName, currentVersion) {
  try {
    // Check if package is already at latest
    const latestCmd = `npm view ${packageName} version`;
    const latestVersion = execSync(latestCmd, { encoding: 'utf8' }).trim();

    console.log(`📦 ${packageName}`);
    console.log(`   Current: ${currentVersion}`);
    console.log(`   Latest:  ${latestVersion}`);

    // Parse versions
    const [currentMajor, currentMinor] = currentVersion.split('.').map(Number);
    const [latestMajor, latestMinor] = latestVersion.split('.').map(Number);

    // Only update patch/minor versions automatically
    if (latestMajor > currentMajor) {
      console.log(`   ⚠️  Major version update - manual review required`);
      return false;
    }

    if (latestVersion === currentVersion) {
      console.log(`   ✅ Already up to date`);
      return true;
    }

    // Safe to update
    console.log(`   🔄 Updating...`);
    const installCmd = `npm install ${packageName}@^${latestVersion}`;
    execSync(installCmd, { stdio: 'inherit' });
    console.log(`   ✅ Updated to ${latestVersion}\n`);
    return true;

  } catch (error) {
    console.error(`   ❌ Failed to update ${packageName}:`, error.message);
    return false;
  }
}

async function updatePackageJson() {
  console.log('📄 Updating package.json scripts...');

  const packageJsonPath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Add security audit script
  if (!packageJson.scripts['security-audit']) {
    packageJson.scripts['security-audit'] = 'npm audit && node scripts/security-audit.sh';
  }

  // Add image optimization script
  if (!packageJson.scripts['optimize-images']) {
    packageJson.scripts['optimize-images'] = 'node scripts/optimize-images.cjs';
  }

  // Add dependency check script
  if (!packageJson.scripts['check-deps']) {
    packageJson.scripts['check-deps'] = 'npm outdated';
  }

  // Add update dependencies script
  if (!packageJson.scripts['update-deps']) {
    packageJson.scripts['update-deps'] = 'node scripts/update-dependencies.cjs';
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('   ✅ package.json updated\n');
}

async function main() {
  const startTime = Date.now();

  try {
    // Get current versions
    const packageJsonPath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    console.log('📋 Checking safe updates...\n');

    let updatedCount = 0;
    let failedCount = 0;

    // Check safe updates
    for (const packageName of SAFE_UPDATES) {
      if (deps[packageName]) {
        const success = await checkAndInstall(packageName, deps[packageName]);
        if (success) updatedCount++;
        else failedCount++;
      }
    }

    // Check major updates
    if (MAJOR_UPDATES.length > 0) {
      console.log('\n⚠️  Major version updates (manual review required):\n');
      for (const packageName of MAJOR_UPDATES) {
        if (deps[packageName]) {
          console.log(`   - ${packageName}: ${deps[packageName]} -> latest`);
        }
      }
      console.log('\n   These updates require manual review and testing!\n');
    }

    // Update package.json
    await updatePackageJson();

    // Run audit
    console.log('🔒 Running security audit...');
    try {
      execSync('npm audit --audit-level=moderate', { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️  Security audit found issues - review required');
    }

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n📊 Update Summary');
    console.log('================');
    console.log(`   ✅ Successfully updated: ${updatedCount} packages`);
    console.log(`   ❌ Failed updates: ${failedCount} packages`);
    console.log(`   ⏱️  Duration: ${duration}s`);
    console.log('\n📝 Next Steps:');
    console.log('   1. Run tests: npm test');
    console.log('   2. Run build: npm run build');
    console.log('   3. Review major updates manually');
    console.log('   4. Create PR for changes');

  } catch (error) {
    console.error('\n❌ Update failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };