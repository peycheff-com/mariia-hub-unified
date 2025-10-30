#!/usr/bin/env node

/**
 * Emergency Kill Switch Script
 * Immediately disables all or specific feature flags in case of emergency
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FLAGS_DIR = '.flags';
const SRC_FLAGS_DIR = 'src/flags';

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].substring(2);
    const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
    options[key] = value;
    if (value !== true) i++;
  }
}

const flagName = options.flag;
const environment = options.environment || 'production';
const reason = options.reason || 'Emergency kill switch activated';

function logEmergency(level, message) {
  const timestamp = new Date().toISOString();
  const prefix = level === 'ERROR' ? '🚨' : level === 'WARN' ? '⚠️' : '✅';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function disableFlagInFile(filePath, flagName) {
  try {
    const flagData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (flagName && flagData.name !== flagName) {
      return false;
    }

    const wasEnabled = flagData.enabled;

    // Disable the flag
    flagData.enabled = false;

    // Set rollout to 0 if it exists
    if (flagData.rollout) {
      flagData.rollout.percentage = 0;
      flagData.rollout.active = false;
    }

    // Add emergency metadata
    flagData.emergency = {
      disabled: true,
      timestamp: new Date().toISOString(),
      reason: reason,
      environment: environment
    };

    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(flagData, null, 2));

    return {
      disabled: true,
      wasEnabled: wasEnabled,
      name: flagData.name
    };

  } catch (error) {
    logEmergency('ERROR', `Failed to disable flag in ${filePath}: ${error.message}`);
    return false;
  }
}

function disableFlagsInDirectory(dirPath, flagName = null) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.json'));
  const disabledFlags = [];

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const result = disableFlagInFile(filePath, flagName);
    if (result) {
      disabledFlags.push(result);
    }
  });

  return disabledFlags;
}

function commitChanges(disabledFlags) {
  try {
    const changedFiles = execSync('git status --porcelain', { encoding: 'utf8' })
      .split('\n')
      .filter(line => line.trim() && line.includes('.json'))
      .map(line => line.split(' ')[1]);

    if (changedFiles.length === 0) {
      logEmergency('WARN', 'No changes to commit');
      return false;
    }

    // Configure git
    execSync('git config --local user.email "emergency-kill-switch@mariaborysevych.com"');
    execSync('git config --local user.name "Emergency Kill Switch"');

    // Stage changes
    changedFiles.forEach(file => {
      execSync(`git add "${file}"`);
    });

    // Commit changes
    const commitMessage = `chore(emergency): disable feature flags

${flagName ? `Disabled flag: ${flagName}` : `Disabled ${disabledFlags.length} feature flags`}
Environment: ${environment}
Reason: ${reason}
Timestamp: ${new Date().toISOString()}

This is an emergency change to ensure system stability.`;

    execSync(`git commit -m "${commitMessage}"`);

    // Create emergency branch if not on main
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    if (currentBranch !== 'main') {
      const emergencyBranch = `emergency/disable-flags-${Date.now()}`;
      execSync(`git checkout -b ${emergencyBranch}`);
      execSync(`git push -u origin ${emergencyBranch}`);
      logEmergency('INFO', `Created emergency branch: ${emergencyBranch}`);
    } else {
      execSync('git push origin main');
    }

    return true;

  } catch (error) {
    logEmergency('ERROR', `Failed to commit changes: ${error.message}`);
    return false;
  }
}

function triggerDeployment() {
  try {
    logEmergency('INFO', 'Triggering emergency deployment...');

    // Trigger GitHub Actions workflow
    const workflowPayload = {
      ref: 'main',
      inputs: {
        environment: environment,
        emergency_deploy: 'true',
        reason: reason
      }
    };

    execSync(`curl -X POST \
      -H "Authorization: token ${process.env.GITHUB_TOKEN}" \
      -H "Accept: application/vnd.github.v3+json" \
      https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/dispatches \
      -d '${JSON.stringify(workflowPayload)}'`);

    logEmergency('INFO', 'Emergency deployment triggered');
    return true;

  } catch (error) {
    logEmergency('ERROR', `Failed to trigger deployment: ${error.message}`);
    return false;
  }
}

function sendEmergencyNotification(disabledFlags) {
  try {
    const webhookUrl = process.env.EMERGENCY_WEBHOOK_URL;
    if (!webhookUrl) {
      logEmergency('WARN', 'No emergency webhook URL configured');
      return false;
    }

    const payload = {
      text: `🚨 EMERGENCY KILL SWITCH ACTIVATED`,
      attachments: [{
        color: 'danger',
        fields: [
          {
            title: 'Environment',
            value: environment,
            short: true
          },
          {
            title: 'Flags Disabled',
            value: disabledFlags.length.toString(),
            short: true
          },
          {
            title: 'Reason',
            value: reason,
            short: false
          },
          {
            title: 'Timestamp',
            value: new Date().toISOString(),
            short: true
          },
          {
            title: 'Triggered By',
            value: process.env.GITHUB_ACTOR || 'System',
            short: true
          }
        ],
        actions: [{
          type: 'button',
          text: 'View Deployment',
          url: `https://github.com/${process.env.GITHUB_REPOSITORY}/actions`
        }]
      }]
    };

    execSync(`curl -X POST -H 'Content-type: application/json' --data '${JSON.stringify(payload)}' ${webhookUrl}`);
    logEmergency('INFO', 'Emergency notification sent');
    return true;

  } catch (error) {
    logEmergency('ERROR', `Failed to send notification: ${error.message}`);
    return false;
  }
}

function createEmergencyLog(disabledFlags) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type: 'emergency_kill_switch',
    environment: environment,
    triggered_by: process.env.GITHUB_ACTOR || 'system',
    reason: reason,
    flags_disabled: disabledFlags,
    git_commit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
    deployment_triggered: true
  };

  const logFile = 'emergency-kill-switch.log';
  const logLine = JSON.stringify(logEntry) + '\n';

  fs.appendFileSync(logFile, logLine);
  logEmergency('INFO', `Emergency action logged to ${logFile}`);
}

function main() {
  console.log('🚨 Emergency Kill Switch');
  console.log('========================');

  if (!environment) {
    logEmergency('ERROR', 'Environment is required');
    process.exit(1);
  }

  if (!flagName && !options.all) {
    logEmergency('ERROR', 'Either --flag <name> or --all is required');
    process.exit(1);
  }

  logEmergency('WARN', `Emergency kill switch activated for ${flagName || 'ALL FLAGS'} in ${environment}`);
  logEmergency('INFO', `Reason: ${reason}`);

  // Disable flags
  let disabledFlags = [];

  if (flagName === 'ALL' || options.all) {
    logEmergency('INFO', 'Disabling ALL feature flags...');
    disabledFlags = [
      ...disableFlagsInDirectory(FLAGS_DIR),
      ...disableFlagsInDirectory(SRC_FLAGS_DIR)
    ];
  } else {
    logEmergency('INFO', `Disabling feature flag: ${flagName}`);
    disabledFlags = [
      ...disableFlagsInDirectory(FLAGS_DIR, flagName),
      ...disableFlagsInDirectory(SRC_FLAGS_DIR, flagName)
    ];

    if (disabledFlags.length === 0) {
      logEmergency('ERROR', `Flag '${flagName}' not found`);
      process.exit(1);
    }
  }

  if (disabledFlags.length === 0) {
    logEmergency('WARN', 'No flags were disabled');
    process.exit(0);
  }

  logEmergency('INFO', `Disabled ${disabledFlags.length} flag(s):`);
  disabledFlags.forEach(flag => {
    logEmergency('INFO', `  - ${flag.name} (was ${flag.wasEnabled ? 'ENABLED' : 'DISABLED'})`);
  });

  // Commit changes
  if (commitChanges(disabledFlags)) {
    logEmergency('INFO', 'Changes committed successfully');
  } else {
    logEmergency('ERROR', 'Failed to commit changes');
    process.exit(1);
  }

  // Send notification
  sendEmergencyNotification(disabledFlags);

  // Create log entry
  createEmergencyLog(disabledFlags);

  // Trigger deployment
  if (options.deploy !== 'false') {
    triggerDeployment();
  }

  logEmergency('INFO', 'Emergency kill switch completed successfully');
  console.log('\n✅ Emergency kill switch completed!');
  console.log('📋 Summary:');
  console.log(`   Environment: ${environment}`);
  console.log(`   Flags disabled: ${disabledFlags.length}`);
  console.log(`   Reason: ${reason}`);
  console.log(`   Deployment: ${options.deploy !== 'false' ? 'Triggered' : 'Skipped'}`);
}

if (require.main === module) {
  main();
}

module.exports = {
  disableFlagInFile,
  disableFlagsInDirectory,
  commitChanges,
  triggerDeployment,
  sendEmergencyNotification,
  createEmergencyLog
};