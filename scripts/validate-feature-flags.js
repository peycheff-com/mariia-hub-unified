#!/usr/bin/env node

/**
 * Feature Flag Validation Script
 * Validates feature flag definitions and configurations
 */

const fs = require('fs');
const path = require('path');

const FLAGS_DIR = '.flags';
const SRC_FLAGS_DIR = 'src/flags';

// Required fields for feature flags
const REQUIRED_FIELDS = ['name', 'description', 'enabled', 'type'];
const VALID_TYPES = ['boolean', 'percentage', 'string', 'json'];

function validateFlagSchema(flagPath, flagData) {
  const errors = [];
  const warnings = [];

  // Check required fields
  REQUIRED_FIELDS.forEach(field => {
    if (!(field in flagData)) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Validate flag type
  if (flagData.type && !VALID_TYPES.includes(flagData.type)) {
    errors.push(`Invalid flag type: ${flagData.type}. Must be one of: ${VALID_TYPES.join(', ')}`);
  }

  // Validate percentage flags
  if (flagData.type === 'percentage') {
    if (typeof flagData.percentage !== 'number' || flagData.percentage < 0 || flagData.percentage > 100) {
      errors.push('Percentage flags must have a valid percentage value (0-100)');
    }
  }

  // Validate string flags
  if (flagData.type === 'string' && !flagData.value) {
    warnings.push('String flags should have a default value');
  }

  // Validate JSON flags
  if (flagData.type === 'json') {
    try {
      if (flagData.value) {
        JSON.parse(JSON.stringify(flagData.value));
      }
    } catch (e) {
      errors.push('Invalid JSON value for JSON flag');
    }
  }

  // Check for environment-specific configs
  if (flagData.environments) {
    const validEnvs = ['development', 'staging', 'production'];
    Object.keys(flagData.environments).forEach(env => {
      if (!validEnvs.includes(env)) {
        warnings.push(`Unknown environment: ${env}`);
      }
    });
  }

  // Validate rollout strategy
  if (flagData.rollout) {
    if (!flagData.rollout.strategy) {
      warnings.push('Rollout should specify a strategy');
    }

    if (flagData.rollout.percentage !== undefined) {
      if (typeof flagData.rollout.percentage !== 'number' ||
          flagData.rollout.percentage < 0 ||
          flagData.rollout.percentage > 100) {
        errors.push('Rollout percentage must be between 0 and 100');
      }
    }
  }

  return { errors, warnings };
}

function validateFlagFile(filePath) {
  try {
    const flagData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const flagName = path.basename(filePath, '.json');

    console.log(`\n🚩 Validating flag: ${flagName}`);

    const { errors, warnings } = validateFlagSchema(filePath, flagData);

    if (errors.length > 0) {
      console.error('❌ Errors:');
      errors.forEach(error => console.error(`   - ${error}`));
    }

    if (warnings.length > 0) {
      console.warn('⚠️  Warnings:');
      warnings.forEach(warning => console.warn(`   - ${warning}`));
    }

    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ Flag is valid');
      return true;
    }

    return errors.length === 0;

  } catch (error) {
    console.error(`❌ Failed to parse ${filePath}: ${error.message}`);
    return false;
  }
}

function validateFlagDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`📁 Directory ${dirPath} does not exist, skipping...`);
    return true;
  }

  const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.json'));
  let allValid = true;

  if (files.length === 0) {
    console.log(`📁 No flag files found in ${dirPath}`);
    return true;
  }

  console.log(`\n📂 Validating flags in ${dirPath}:`);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const isValid = validateFlagFile(filePath);
    allValid = allValid && isValid;
  });

  return allValid;
}

function checkForDuplicateFlags() {
  const flagDirs = [FLAGS_DIR, SRC_FLAGS_DIR].filter(dir => fs.existsSync(dirPath.join(dir))));
  const flagNames = new Set();
  const duplicates = [];

  flagDirs.forEach(dir => {
    const files = fs.readdirSync(dir).filter(file => file.endsWith('.json'));
    files.forEach(file => {
      const flagName = path.basename(file, '.json');
      if (flagNames.has(flagName)) {
        duplicates.push(flagName);
      } else {
        flagNames.add(flagName);
      }
    });
  });

  if (duplicates.length > 0) {
    console.error('\n❌ Duplicate flag names found:');
    duplicates.forEach(name => console.error(`   - ${name}`));
    return false;
  }

  return true;
}

function generateFlagSummary() {
  const flagDirs = [FLAGS_DIR, SRC_FLAGS_DIR].filter(dir => fs.existsSync(dir));
  const summary = {
    totalFlags: 0,
    enabledFlags: 0,
    disabledFlags: 0,
    flagsByType: {},
    flagsWithRollout: 0
  };

  flagDirs.forEach(dir => {
    const files = fs.readdirSync(dir).filter(file => file.endsWith('.json'));

    files.forEach(file => {
      const filePath = path.join(dir, file);
      try {
        const flagData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        summary.totalFlags++;

        if (flagData.enabled) {
          summary.enabledFlags++;
        } else {
          summary.disabledFlags++;
        }

        const type = flagData.type || 'unknown';
        summary.flagsByType[type] = (summary.flagsByType[type] || 0) + 1;

        if (flagData.rollout) {
          summary.flagsWithRollout++;
        }
      } catch (e) {
        // Skip invalid files
      }
    });
  });

  console.log('\n📊 Feature Flag Summary:');
  console.log(`   Total flags: ${summary.totalFlags}`);
  console.log(`   Enabled: ${summary.enabledFlags}`);
  console.log(`   Disabled: ${summary.disabledFlags}`);
  console.log(`   With rollout: ${summary.flagsWithRollout}`);
  console.log('   By type:', Object.entries(summary.flagsByType)
    .map(([type, count]) => `${type}: ${count}`)
    .join(', '));

  return summary;
}

function main() {
  console.log('🚩 Feature Flag Validation');
  console.log('==========================');

  let allValid = true;

  // Validate flags in both directories
  const flagsValid = validateFlagDirectory(FLAGS_DIR);
  const srcFlagsValid = validateFlagDirectory(SRC_FLAGS_DIR);

  allValid = allValid && flagsValid && srcFlagsValid;

  // Check for duplicate flags
  const noDuplicates = checkForDuplicateFlags();
  allValid = allValid && noDuplicates;

  // Generate summary
  generateFlagSummary();

  // Final result
  console.log('\n' + '='.repeat(50));
  if (allValid) {
    console.log('✅ All feature flags are valid!');
    process.exit(0);
  } else {
    console.log('❌ Feature flag validation failed!');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  validateFlagSchema,
  validateFlagFile,
  validateFlagDirectory,
  checkForDuplicateFlags,
  generateFlagSummary
};