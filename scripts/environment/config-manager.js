#!/usr/bin/env node

/**
 * Advanced Configuration Management System
 * Provides centralized configuration management with templating, validation, and secrets handling
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';
import dotenv from 'dotenv';
import Joi from 'joi';
import crypto from 'crypto';
import { execSync } from 'child_process';
import Handlebars from 'handlebars';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ConfigManager {
  constructor() {
    this.configDir = path.join(__dirname, '..', '..', 'config');
    this.templatesDir = path.join(this.configDir, 'templates');
    this.schemasDir = path.join(this.configDir, 'schemas');
    this.secretsDir = path.join(this.configDir, 'secrets');
    this.environmentsDir = path.join(this.configDir, 'environments');
    this.validationDir = path.join(this.configDir, 'validation');
    this.stateDir = path.join(this.configDir, '.state');

    this.ensureDirectories();
    this.loadSchemas();
    this.registerHelpers();
  }

  ensureDirectories() {
    const dirs = [
      this.configDir,
      this.templatesDir,
      this.schemasDir,
      this.secretsDir,
      this.environmentsDir,
      this.validationDir,
      this.stateDir,
      path.join(this.templatesDir, 'environments'),
      path.join(this.templatesDir, 'services'),
      path.join(this.templatesDir, 'infrastructure'),
      path.join(this.secretsDir, 'encrypted'),
      path.join(this.secretsDir, 'vault'),
      path.join(this.validationDir, 'rules'),
      path.join(this.stateDir, 'configs'),
      path.join(this.stateDir, 'backups')
    ];

    dirs.forEach(dir => fs.ensureDirSync(dir));
  }

  loadSchemas() {
    this.schemas = {
      environment: this.loadSchema('environment'),
      service: this.loadSchema('service'),
      infrastructure: this.loadSchema('infrastructure'),
      secrets: this.loadSchema('secrets')
    };
  }

  loadSchema(schemaName) {
    const schemaPath = path.join(this.schemasDir, `${schemaName}.js`);

    if (fs.existsSync(schemaPath)) {
      try {
        const schemaModule = require(schemaPath);
        return schemaModule.default || schemaModule;
      } catch (error) {
        console.warn(`Warning: Could not load schema ${schemaName}:`, error.message);
      }
    }

    // Return default schema
    return this.getDefaultSchema(schemaName);
  }

  registerHelpers() {
    // Register Handlebars helpers for template rendering
    Handlebars.registerHelper('toUpperCase', str => str.toUpperCase());
    Handlebars.registerHelper('toLowerCase', str => str.toLowerCase());
    Handlebars.registerHelper('env', varName => process.env[varName]);
    Handlebars.registerHelper('generateSecret', () => crypto.randomBytes(32).toString('hex'));
    Handlebars.registerHelper('generateUUID', () => crypto.randomUUID());
    Handlebars.registerHelper('timestamp', () => new Date().toISOString());
    Handlebars.registerHelper('json', obj => JSON.stringify(obj, null, 2));
    Handlebars.registerHelper('eq', (a, b) => a === b);
    Handlebars.registerHelper('ne', (a, b) => a !== b);
    Handlebars.registerHelper('gt', (a, b) => a > b);
    Handlebars.registerHelper('lt', (a, b) => a < b);
    Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });
    Handlebars.registerHelper('unlessEquals', function(arg1, arg2, options) {
      return (arg1 != arg2) ? options.fn(this) : options.inverse(this);
    });
  }

  /**
   * Create or update configuration with validation
   */
  async createConfiguration(options) {
    const {
      type, // environment, service, infrastructure
      name,
      environment = 'development',
      template,
      variables = {},
      secrets = {},
      validate = true,
      encryptSecrets = true,
      backup = true
    } = options;

    console.log(`⚙️  Creating configuration: ${type}/${name} for ${environment}`);

    try {
      // Load template
      const templateContent = await this.loadTemplate(type, template);
      if (!templateContent) {
        throw new Error(`Template not found: ${type}/${template}`);
      }

      // Prepare context for template rendering
      const context = await this.prepareTemplateContext(name, environment, variables, secrets);

      // Render template
      const renderedConfig = this.renderTemplate(templateContent, context);

      // Parse rendered configuration
      let config;
      try {
        config = YAML.parse(renderedConfig);
      } catch (error) {
        throw new Error(`Failed to parse rendered configuration: ${error.message}`);
      }

      // Validate configuration
      if (validate) {
        await this.validateConfiguration(config, type);
      }

      // Encrypt secrets
      if (encryptSecrets && Object.keys(secrets).length > 0) {
        config = await this.encryptSecretsInConfig(config, secrets);
      }

      // Backup existing configuration if exists
      if (backup) {
        await this.backupConfiguration(type, name, environment);
      }

      // Save configuration
      const configPath = this.getConfigPath(type, name, environment);
      await this.saveConfiguration(config, configPath);

      // Update configuration registry
      await this.updateConfigRegistry(type, name, environment, configPath);

      console.log(`✅ Configuration created: ${type}/${name} for ${environment}`);

      return {
        type,
        name,
        environment,
        path: configPath,
        checksum: this.calculateChecksum(config),
        createdAt: new Date().toISOString(),
        hasSecrets: Object.keys(secrets).length > 0
      };

    } catch (error) {
      console.error(`❌ Failed to create configuration: ${error.message}`);
      throw error;
    }
  }

  /**
   * Load template by type and name
   */
  async loadTemplate(type, templateName) {
    const templatePath = path.join(this.templatesDir, type, `${templateName}.hbs`);

    if (fs.existsSync(templatePath)) {
      return fs.readFileSync(templatePath, 'utf8');
    }

    // Try fallback templates
    const fallbackPath = path.join(this.templatesDir, type, 'default.hbs');
    if (fs.existsSync(fallbackPath)) {
      console.warn(`Using default template for ${type}/${templateName}`);
      return fs.readFileSync(fallbackPath, 'utf8');
    }

    throw new Error(`Template not found: ${type}/${templateName}`);
  }

  /**
   * Prepare context for template rendering
   */
  async prepareTemplateContext(name, environment, variables, secrets) {
    // Load environment-specific variables
    const envConfig = await this.loadEnvironmentConfig(environment);

    // Load global variables
    const globalConfig = await this.loadGlobalConfig();

    // Generate dynamic values
    const dynamicValues = {
      environment,
      name,
      namespace: `mariaborysevych-${name}`,
      domain: `${name}.${environment === 'production' ? 'mariaborysevych.com' : `${environment}.mariaborysevych.com`}`,
      timestamp: new Date().toISOString(),
      randomId: crypto.randomBytes(8).toString('hex'),
      gitBranch: this.getCurrentGitBranch(),
      gitCommit: this.getCurrentGitCommit(),
      ...variables
    };

    return {
      ...globalConfig,
      ...envConfig,
      ...dynamicValues,
      secrets: this.prepareSecretsContext(secrets)
    };
  }

  /**
   * Load environment-specific configuration
   */
  async loadEnvironmentConfig(environment) {
    const envConfigPath = path.join(this.environmentsDir, `${environment}.yml`);

    if (fs.existsSync(envConfigPath)) {
      return YAML.parse(fs.readFileSync(envConfigPath, 'utf8'));
    }

    return this.getDefaultEnvironmentConfig(environment);
  }

  /**
   * Load global configuration
   */
  async loadGlobalConfig() {
    const globalConfigPath = path.join(this.configDir, 'global.yml');

    if (fs.existsSync(globalConfigPath)) {
      return YAML.parse(fs.readFileSync(globalConfigPath, 'utf8'));
    }

    return this.getDefaultGlobalConfig();
  }

  /**
   * Render template with context
   */
  renderTemplate(templateContent, context) {
    try {
      const template = Handlebars.compile(templateContent);
      return template(context);
    } catch (error) {
      throw new Error(`Template rendering failed: ${error.message}`);
    }
  }

  /**
   * Validate configuration against schema
   */
  async validateConfiguration(config, type) {
    const schema = this.schemas[type];
    if (!schema) {
      throw new Error(`Validation schema not found for type: ${type}`);
    }

    try {
      const { error, value } = schema.validate(config, {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true
      });

      if (error) {
        const details = error.details.map(detail => detail.message).join(', ');
        throw new Error(`Configuration validation failed: ${details}`);
      }

      return value;
    } catch (error) {
      throw new Error(`Validation error: ${error.message}`);
    }
  }

  /**
   * Encrypt secrets in configuration
   */
  async encryptSecretsInConfig(config, secrets) {
    const encryptionKey = await this.getEncryptionKey();
    const encryptedConfig = { ...config };

    // Encrypt each secret and replace in config
    for (const [key, value] of Object.entries(secrets)) {
      const encrypted = this.encryptValue(value, encryptionKey);
      encryptedConfig[key] = `encrypted:${encrypted}`;
    }

    // Store encrypted secrets separately
    await this.storeEncryptedSecrets(secrets, encryptionKey);

    return encryptedConfig;
  }

  /**
   * Get or create encryption key
   */
  async getEncryptionKey() {
    const keyPath = path.join(this.secretsDir, '.encryption-key');

    if (fs.existsSync(keyPath)) {
      return fs.readFileSync(keyPath, 'utf8').trim();
    }

    // Generate new encryption key
    const key = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(keyPath, key, { mode: 0o600 });
    return key;
  }

  /**
   * Encrypt value
   */
  encryptValue(value, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', key);

    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Store encrypted secrets
   */
  async storeEncryptedSecrets(secrets, encryptionKey) {
    const secretsPath = path.join(this.secretsDir, 'encrypted', `secrets-${Date.now()}.json`);
    const encryptedSecrets = {};

    for (const [key, value] of Object.entries(secrets)) {
      encryptedSecrets[key] = this.encryptValue(value, encryptionKey);
    }

    fs.writeFileSync(secretsPath, JSON.stringify(encryptedSecrets, null, 2));
  }

  /**
   * Save configuration to file
   */
  async saveConfiguration(config, configPath) {
    const configContent = YAML.stringify(config, {
      indent: 2,
      lineWidth: 120,
      minContentWidth: 0
    });

    fs.writeFileSync(configPath, configContent);
  }

  /**
   * Update configuration registry
   */
  async updateConfigRegistry(type, name, environment, configPath) {
    const registryPath = path.join(this.stateDir, 'registry.json');
    let registry = {};

    if (fs.existsSync(registryPath)) {
      registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    }

    const key = `${type}:${name}:${environment}`;
    registry[key] = {
      type,
      name,
      environment,
      path: configPath,
      checksum: this.calculateChecksum(config),
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
  }

  /**
   * Calculate configuration checksum
   */
  calculateChecksum(config) {
    const configString = JSON.stringify(config, Object.keys(config).sort());
    return crypto.createHash('sha256').update(configString).digest('hex');
  }

  /**
   * Get configuration path
   */
  getConfigPath(type, name, environment) {
    return path.join(this.configDir, type, environment, `${name}.yml`);
  }

  /**
   * Load configuration
   */
  async loadConfiguration(type, name, environment = 'development') {
    const configPath = this.getConfigPath(type, name, environment);

    if (!fs.existsSync(configPath)) {
      throw new Error(`Configuration not found: ${type}/${name} for ${environment}`);
    }

    const configContent = fs.readFileSync(configPath, 'utf8');
    return YAML.parse(configContent);
  }

  /**
   * List configurations
   */
  async listConfigurations(options = {}) {
    const { type, environment, includeSecrets = false } = options;

    const registryPath = path.join(this.stateDir, 'registry.json');

    if (!fs.existsSync(registryPath)) {
      return [];
    }

    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    let configurations = Object.values(registry);

    // Filter by type
    if (type) {
      configurations = configurations.filter(config => config.type === type);
    }

    // Filter by environment
    if (environment) {
      configurations = configurations.filter(config => config.environment === environment);
    }

    return configurations.map(config => ({
      ...config,
      hasSecrets: this.checkForSecrets(config.path)
    }));
  }

  /**
   * Check if configuration has encrypted secrets
   */
  checkForSecrets(configPath) {
    try {
      const configContent = fs.readFileSync(configPath, 'utf8');
      return configContent.includes('encrypted:');
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate all configurations
   */
  async validateAllConfigurations() {
    const configurations = await this.listConfigurations();
    const results = [];

    for (const config of configurations) {
      try {
        const configData = await this.loadConfiguration(config.type, config.name, config.environment);
        await this.validateConfiguration(configData, config.type);

        results.push({
          ...config,
          status: 'valid',
          errors: []
        });
      } catch (error) {
        results.push({
          ...config,
          status: 'invalid',
          errors: [error.message]
        });
      }
    }

    return results;
  }

  /**
   * Create configuration change tracking
   */
  async trackConfigurationChange(type, name, environment, change, author = 'system') {
    const changeLogPath = path.join(this.stateDir, 'change-log.json');
    let changeLog = [];

    if (fs.existsSync(changeLogPath)) {
      changeLog = JSON.parse(fs.readFileSync(changeLogPath, 'utf8'));
    }

    const changeEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      name,
      environment,
      change,
      author,
      gitCommit: this.getCurrentGitCommit()
    };

    changeLog.push(changeEntry);

    // Keep only last 1000 changes
    if (changeLog.length > 1000) {
      changeLog = changeLog.slice(-1000);
    }

    fs.writeFileSync(changeLogPath, JSON.stringify(changeLog, null, 2));
  }

  /**
   * Get configuration change history
   */
  async getConfigurationHistory(type, name, environment, limit = 50) {
    const changeLogPath = path.join(this.stateDir, 'change-log.json');

    if (!fs.existsSync(changeLogPath)) {
      return [];
    }

    const changeLog = JSON.parse(fs.readFileSync(changeLogPath, 'utf8'));

    let filtered = changeLog.filter(entry =>
      entry.type === type &&
      entry.name === name &&
      entry.environment === environment
    );

    return filtered.slice(-limit).reverse();
  }

  /**
   * Rollback configuration to previous version
   */
  async rollbackConfiguration(type, name, environment, targetVersion) {
    console.log(`🔄 Rolling back configuration: ${type}/${name} for ${environment} to version ${targetVersion}`);

    try {
      // Get configuration history
      const history = await this.getConfigurationHistory(type, name, environment);
      const targetChange = history.find(change => change.id === targetVersion);

      if (!targetChange) {
        throw new Error(`Configuration version ${targetVersion} not found`);
      }

      // Restore configuration from backup
      const backupPath = path.join(this.stateDir, 'backups', `${type}-${name}-${environment}-${targetVersion}.yml`);

      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup not found for version ${targetVersion}`);
      }

      const backupContent = fs.readFileSync(backupPath, 'utf8');
      const config = YAML.parse(backupContent);

      // Save restored configuration
      const configPath = this.getConfigPath(type, name, environment);
      await this.saveConfiguration(config, configPath);

      // Track rollback
      await this.trackConfigurationChange(
        type,
        name,
        environment,
        { action: 'rollback', targetVersion, previousVersion: history[0]?.id },
        'system'
      );

      console.log(`✅ Configuration rolled back successfully`);

      return {
        type,
        name,
        environment,
        rolledBackTo: targetVersion,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Failed to rollback configuration: ${error.message}`);
      throw error;
    }
  }

  /**
   * Backup configuration
   */
  async backupConfiguration(type, name, environment) {
    const configPath = this.getConfigPath(type, name, environment);

    if (!fs.existsSync(configPath)) {
      return; // No existing configuration to backup
    }

    const backupPath = path.join(this.stateDir, 'backups', `${type}-${name}-${environment}-${Date.now()}.yml`);
    fs.copyFileSync(configPath, backupPath);

    // Clean up old backups (keep last 10)
    await this.cleanupOldBackups(type, name, environment);
  }

  /**
   * Clean up old backups
   */
  async cleanupOldBackups(type, name, environment) {
    const backupDir = path.join(this.stateDir, 'backups');
    const backupPattern = `${type}-${name}-${environment}-`;
    const backups = fs.readdirSync(backupDir)
      .filter(file => file.startsWith(backupPattern))
      .sort()
      .reverse()
      .slice(10); // Keep only last 10

    for (const backup of backups) {
      fs.removeSync(path.join(backupDir, backup));
    }
  }

  /**
   * Get current Git branch
   */
  getCurrentGitBranch() {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get current Git commit
   */
  getCurrentGitCommit() {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Prepare secrets context for template rendering
   */
  prepareSecretsContext(secrets) {
    const secretsContext = {};

    for (const [key, value] of Object.entries(secrets)) {
      // Don't include actual secret values in context, only placeholders
      secretsContext[key] = `{{SECRET_${key.toUpperCase()}}}`;
    }

    return secretsContext;
  }

  /**
   * Default schemas
   */
  getDefaultSchema(type) {
    const schemas = {
      environment: Joi.object({
        name: Joi.string().required(),
        type: Joi.string().valid('development', 'staging', 'production', 'feature', 'ephemeral').required(),
        domain: Joi.string().domain().required(),
        resources: Joi.object({
          cpu: Joi.string().required(),
          memory: Joi.string().required(),
          storage: Joi.string().required(),
          replicas: Joi.number().integer().min(1).required()
        }).required()
      }),

      service: Joi.object({
        name: Joi.string().required(),
        image: Joi.string().required(),
        port: Joi.number().integer().min(1).max(65535).required(),
        env: Joi.object().pattern(Joi.string(), Joi.string()),
        healthCheck: Joi.object({
          path: Joi.string().required(),
          interval: Joi.number().integer().min(1).required(),
          timeout: Joi.number().integer().min(1).required(),
          retries: Joi.number().integer().min(1).required()
        })
      }),

      infrastructure: Joi.object({
        network: Joi.object({
          cidr: Joi.string().ip().required(),
          subnets: Joi.array().items(Joi.string().ip()).required()
        }),
        security: Joi.object({
          ssl: Joi.boolean().required(),
          firewall: Joi.boolean().required(),
          rateLimit: Joi.object({
            enabled: Joi.boolean().required(),
            requests: Joi.number().integer().min(1).required(),
            windowMs: Joi.number().integer().min(1000).required()
          }).required()
        }).required()
      }),

      secrets: Joi.object({
        database: Joi.object({
          url: Joi.string().required(),
          password: Joi.string().required()
        }),
        apiKeys: Joi.object().pattern(Joi.string(), Joi.string()),
        certificates: Joi.object().pattern(Joi.string(), Joi.string())
      })
    };

    return schemas[type] || Joi.object();
  }

  /**
   * Default environment configurations
   */
  getDefaultEnvironmentConfig(environment) {
    const configs = {
      development: {
        resources: {
          cpu: '500m',
          memory: '512Mi',
          storage: '5Gi',
          replicas: 1
        },
        features: {
          debug: true,
          hotReload: true,
          verboseLogs: true
        },
        security: {
          ssl: false,
          authentication: false
        }
      },

      staging: {
        resources: {
          cpu: '1000m',
          memory: '1Gi',
          storage: '10Gi',
          replicas: 1
        },
        features: {
          debug: false,
          hotReload: false,
          verboseLogs: true
        },
        security: {
          ssl: true,
          authentication: true
        }
      },

      production: {
        resources: {
          cpu: '2000m',
          memory: '2Gi',
          storage: '20Gi',
          replicas: 2
        },
        features: {
          debug: false,
          hotReload: false,
          verboseLogs: false
        },
        security: {
          ssl: true,
          authentication: true
        }
      }
    };

    return configs[environment] || configs.development;
  }

  /**
   * Default global configuration
   */
  getDefaultGlobalConfig() {
    return {
      organization: 'mariaborysevych',
      domain: 'mariaborysevych.com',
      region: 'europe-west1',
      timezone: 'Europe/Warsaw',
      currency: 'PLN',
      language: 'en',
      monitoring: {
        enabled: true,
        retention: 30
      },
      backup: {
        enabled: true,
        schedule: '0 2 * * *',
        retention: 7
      }
    };
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const manager = new ConfigManager();

  try {
    switch (command) {
      case 'create':
        const createOptions = parseCreateConfigArgs(args.slice(1));
        const result = await manager.createConfiguration(createOptions);
        console.log('Configuration created:', JSON.stringify(result, null, 2));
        break;

      case 'list':
        const listOptions = parseListConfigArgs(args.slice(1));
        const configurations = await manager.listConfigurations(listOptions);
        console.table(configurations);
        break;

      case 'validate':
        const validationResults = await manager.validateAllConfigurations();
        console.table(validationResults);
        break;

      case 'history':
        const historyArgs = parseHistoryArgs(args.slice(1));
        const history = await manager.getConfigurationHistory(
          historyArgs.type,
          historyArgs.name,
          historyArgs.environment
        );
        console.table(history);
        break;

      case 'rollback':
        const rollbackArgs = parseRollbackArgs(args.slice(1));
        const rollbackResult = await manager.rollbackConfiguration(
          rollbackArgs.type,
          rollbackArgs.name,
          rollbackArgs.environment,
          rollbackArgs.version
        );
        console.log('Rollback completed:', rollbackResult);
        break;

      default:
        console.log(`
Configuration Manager CLI

Commands:
  create <type> <name> [options]    Create a new configuration
  list [options]                     List configurations
  validate                           Validate all configurations
  history <type> <name> <env>        Get configuration history
  rollback <type> <name> <env> <ver> Rollback configuration

Examples:
  node config-manager.js create environment staging --template staging
  node config-manager.js list --type environment --environment production
  node config-manager.js validate
  node config-manager.js history environment main production
  node config-manager.js rollback environment main staging abc-123-def

Options:
  --environment <env>               Environment (development|staging|production)
  --template <template>             Template to use
  --variables <json>                Template variables (JSON string)
  --secrets <json>                  Secrets to encrypt (JSON string)
  --no-validate                     Skip validation
  --no-encrypt                      Skip encryption
  --no-backup                       Skip backup
        `);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

function parseCreateConfigArgs(args) {
  const options = { type: args[0], name: args[1] };

  for (let i = 2; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case '--environment':
        options.environment = value;
        break;
      case '--template':
        options.template = value;
        break;
      case '--variables':
        options.variables = JSON.parse(value);
        break;
      case '--secrets':
        options.secrets = JSON.parse(value);
        break;
      case '--no-validate':
        options.validate = false;
        i--; // This flag doesn't have a value
        break;
      case '--no-encrypt':
        options.encryptSecrets = false;
        i--;
        break;
      case '--no-backup':
        options.backup = false;
        i--;
        break;
    }
  }

  return options;
}

function parseListConfigArgs(args) {
  const options = {};

  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case '--type':
        options.type = value;
        break;
      case '--environment':
        options.environment = value;
        break;
      case '--include-secrets':
        options.includeSecrets = true;
        i--;
        break;
    }
  }

  return options;
}

function parseHistoryArgs(args) {
  return {
    type: args[0],
    name: args[1],
    environment: args[2]
  };
}

function parseRollbackArgs(args) {
  return {
    type: args[0],
    name: args[1],
    environment: args[2],
    version: args[3]
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default ConfigManager;