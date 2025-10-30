#!/usr/bin/env node

/**
 * Test Data Management and Cleanup Automation
 *
 * This script provides automated test data provisioning, cleanup,
 * and database state management for reliable test isolation.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class TestDataManager {
  constructor(options = {}) {
    this.options = {
      environment: options.environment || 'test',
      resetBeforeTests: options.resetBeforeTests !== false,
      cleanupAfterTests: options.cleanupAfterTests !== false,
      seedData: options.seedData !== false,
      backupEnabled: options.backupEnabled !== false,
      isolationLevel: options.isolationLevel || 'transaction', // 'transaction' or 'database'
      timeout: options.timeout || 30000,
      ...options
    };

    this.dbConfig = this.getDatabaseConfig();
    this.backupPath = path.join(process.cwd(), '.test-backups');
    this.tempSchema = `test_${Date.now()}`;
    this.originalSchema = null;
  }

  /**
   * Get database configuration based on environment
   */
  getDatabaseConfig() {
    const env = this.options.environment;

    if (env === 'test') {
      return {
        url: process.env.TEST_DATABASE_URL || process.env.VITE_SUPABASE_URL,
        host: process.env.TEST_DB_HOST || 'localhost',
        port: process.env.TEST_DB_PORT || '54322',
        database: process.env.TEST_DB_NAME || 'postgres',
        username: process.env.TEST_DB_USER || 'postgres',
        password: process.env.TEST_DB_PASSWORD || 'postgres',
        type: 'postgresql'
      };
    } else if (env === 'staging') {
      return {
        url: process.env.STAGING_SUPABASE_URL,
        ...this.parseSupabaseUrl(process.env.STAGING_SUPABASE_URL)
      };
    } else {
      return {
        url: process.env.VITE_SUPABASE_URL,
        ...this.parseSupabaseUrl(process.env.VITE_SUPABASE_URL)
      };
    }
  }

  /**
   * Parse Supabase URL to extract connection details
   */
  parseSupabaseUrl(url) {
    if (!url) return {};

    try {
      const urlObj = new URL(url);
      return {
        host: urlObj.hostname,
        port: urlObj.port || '5432',
        database: 'postgres',
        username: 'postgres',
        type: 'postgresql'
      };
    } catch (error) {
      console.warn('Failed to parse Supabase URL:', error.message);
      return {};
    }
  }

  /**
   * Setup test environment and database
   */
  async setup() {
    console.log(`🔧 Setting up test environment: ${this.options.environment}`);

    try {
      // Create backup directory
      if (!fs.existsSync(this.backupPath)) {
        fs.mkdirSync(this.backupPath, { recursive: true });
      }

      // Initialize database connection
      await this.initializeDatabase();

      // Create backup if enabled
      if (this.options.backupEnabled) {
        await this.createBackup();
      }

      // Reset database if requested
      if (this.options.resetBeforeTests) {
        await this.resetDatabase();
      }

      // Seed test data if requested
      if (this.options.seedData) {
        await this.seedTestData();
      }

      console.log('✅ Test environment setup completed');
      return true;
    } catch (error) {
      console.error('❌ Test environment setup failed:', error.message);
      throw error;
    }
  }

  /**
   * Initialize database connection and verify connectivity
   */
  async initializeDatabase() {
    console.log('🔌 Initializing database connection...');

    try {
      // Test database connection
      const connectionTest = this.executeSql('SELECT 1 as test');
      if (connectionTest) {
        console.log('✅ Database connection established');
      }

      // Get current schema for backup/restore operations
      const schemaResult = this.executeSql('SELECT current_schema()');
      this.originalSchema = schemaResult?.[0]?.current_schema || 'public';

    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Execute SQL commands safely
   */
  executeSql(sql, params = []) {
    try {
      // Using psql for PostgreSQL operations
      const command = `psql "${this.dbConfig.url}" -c "${sql}"`;
      const result = execSync(command, { encoding: 'utf8' });

      // Parse result if it's a SELECT query
      if (sql.trim().toLowerCase().startsWith('select')) {
        return this.parseQueryResult(result);
      }

      return result;
    } catch (error) {
      console.error(`SQL execution failed: ${sql}`, error.message);
      throw error;
    }
  }

  /**
   * Parse psql query results into JSON format
   */
  parseQueryResult(output) {
    try {
      const lines = output.split('\n').filter(line => line.trim());
      if (lines.length === 0) return [];

      // Find header and data rows
      const headerIndex = lines.findIndex(line => line.includes('---'));
      if (headerIndex === -1) return [];

      const headers = lines[headerIndex - 1].split('|').map(h => h.trim()).filter(h => h);
      const dataRows = lines.slice(headerIndex + 1).filter(line => line && !line.includes('('));

      return dataRows.map(row => {
        const values = row.split('|').map(v => v.trim()).filter(v => v);
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || null;
        });
        return obj;
      });
    } catch (error) {
      console.warn('Failed to parse query result:', error.message);
      return [];
    }
  }

  /**
   * Create database backup
   */
  async createBackup() {
    console.log('💾 Creating database backup...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupPath, `backup-${timestamp}.sql`);

    try {
      // Use pg_dump for PostgreSQL backup
      const command = `pg_dump "${this.dbConfig.url}" --no-owner --no-privileges --verbose > "${backupFile}"`;
      execSync(command, { stdio: 'inherit' });

      console.log(`✅ Backup created: ${backupFile}`);
      return backupFile;
    } catch (error) {
      console.error('❌ Backup creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Reset database to clean state
   */
  async resetDatabase() {
    console.log('🔄 Resetting database to clean state...');

    try {
      if (this.options.isolationLevel === 'transaction') {
        // Transaction-based isolation (faster, less disruptive)
        await this.resetWithTransaction();
      } else {
        // Full database reset (slower, more complete)
        await this.resetWithSchema();
      }

      console.log('✅ Database reset completed');
    } catch (error) {
      console.error('❌ Database reset failed:', error.message);
      throw error;
    }
  }

  /**
   * Reset database using transactions (fast method)
   */
  async resetWithTransaction() {
    // Disable foreign key constraints temporarily
    this.executeSql('SET session_replication_role = replica;');

    // Get all tables in the database
    const tables = this.executeSql(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT IN ('schema_migrations', 'spatial_ref_sys')
    `);

    // Truncate all tables
    const truncateCommands = tables.map(table =>
      `TRUNCATE TABLE ${table.tablename} RESTART IDENTITY CASCADE;`
    ).join('\n');

    if (truncateCommands) {
      this.executeSql(truncateCommands);
    }

    // Re-enable foreign key constraints
    this.executeSql('SET session_replication_role = DEFAULT;');
  }

  /**
   * Reset database using schema recreation (complete method)
   */
  async resetWithSchema() {
    // Create temporary schema
    this.executeSql(`CREATE SCHEMA IF NOT EXISTS ${this.tempSchema};`);

    // Copy structure to new schema
    this.executeSql(`
      DO $$
      DECLARE
        r RECORD;
      BEGIN
        FOR r IN (
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
        ) LOOP
          EXECUTE 'CREATE TABLE ' || '${this.tempSchema}' || '.' || r.table_name ||
                   ' AS SELECT * FROM ' || 'public.' || r.table_name || ' WHERE FALSE;';
        END LOOP;
      END $$;
    `);

    // Drop original schema and recreate
    this.executeSql('DROP SCHEMA public CASCADE;');
    this.executeSql('CREATE SCHEMA public;');

    // Copy structure back
    this.executeSql(`
      DO $$
      DECLARE
        r RECORD;
      BEGIN
        FOR r IN (
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = '${this.tempSchema}'
        ) LOOP
          EXECUTE 'CREATE TABLE public.' || r.table_name ||
                   ' AS SELECT * FROM ' || '${this.tempSchema}' || '.' || r.table_name || ' WHERE FALSE;';
        END LOOP;
      END $$;
    `);

    // Clean up temporary schema
    this.executeSql(`DROP SCHEMA ${this.tempSchema} CASCADE;`);
  }

  /**
   * Seed test data for consistent testing
   */
  async seedTestData() {
    console.log('🌱 Seeding test data...');

    try {
      const seedDataPath = path.join(process.cwd(), 'scripts', 'test-seed-data.sql');

      if (fs.existsSync(seedDataPath)) {
        // Execute custom seed data script
        execSync(`psql "${this.dbConfig.url}" -f "${seedDataPath}"`, { stdio: 'inherit' });
        console.log('✅ Custom seed data applied');
      } else {
        // Apply default test data
        await this.seedDefaultTestData();
      }

      console.log('✅ Test data seeding completed');
    } catch (error) {
      console.error('❌ Test data seeding failed:', error.message);
      throw error;
    }
  }

  /**
   * Seed default test data
   */
  async seedDefaultTestData() {
    const seedCommands = `
      -- Insert test services
      INSERT INTO services (id, title, description, category, price, duration, status, created_at, updated_at) VALUES
        ('test-service-1', 'Test Beauty Service', 'A test beauty service for automated testing', 'beauty', 100.00, 60, 'active', NOW(), NOW()),
        ('test-service-2', 'Test Fitness Service', 'A test fitness service for automated testing', 'fitness', 80.00, 45, 'active', NOW(), NOW()),
        ('test-service-3', 'Test Inactive Service', 'An inactive test service', 'beauty', 120.00, 90, 'inactive', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;

      -- Insert test availability slots
      INSERT INTO availability_slots (id, service_id, start_time, end_time, status, max_bookings, current_bookings, created_at, updated_at) VALUES
        ('test-slot-1', 'test-service-1', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '1 hour', 'available', 5, 0, NOW(), NOW()),
        ('test-slot-2', 'test-service-1', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '1 hour', 'available', 5, 0, NOW(), NOW()),
        ('test-slot-3', 'test-service-2', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '45 minutes', 'available', 3, 0, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;

      -- Insert test user profile
      INSERT INTO profiles (id, email, full_name, phone, created_at, updated_at) VALUES
        ('test-user-1', 'test@example.com', 'Test User', '+1234567890', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;

      -- Insert test bookings
      INSERT INTO bookings (id, service_id, profile_id, start_time, end_time, status, total_price, created_at, updated_at) VALUES
        ('test-booking-1', 'test-service-1', 'test-user-1', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '1 hour', 'confirmed', 100.00, NOW(), NOW()),
        ('test-booking-2', 'test-service-2', 'test-user-1', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '45 minutes', 'pending', 80.00, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `;

    // Execute seed commands
    const commands = seedCommands.split(';').filter(cmd => cmd.trim());
    for (const command of commands) {
      if (command.trim()) {
        this.executeSql(command);
      }
    }
  }

  /**
   * Cleanup test data after tests
   */
  async cleanup() {
    console.log('🧹 Cleaning up test environment...');

    try {
      // Clean up test data
      if (this.options.cleanupAfterTests) {
        await this.cleanupTestData();
      }

      // Restore database from backup if needed
      if (this.options.backupEnabled && this.options.restoreAfterTests) {
        await this.restoreBackup();
      }

      // Clean up temporary files
      await this.cleanupTempFiles();

      console.log('✅ Test environment cleanup completed');
    } catch (error) {
      console.error('❌ Test environment cleanup failed:', error.message);
      throw error;
    }
  }

  /**
   * Clean up test data (selective cleanup)
   */
  async cleanupTestData() {
    console.log('🗑️  Cleaning up test data...');

    const cleanupCommands = `
      -- Clean up test bookings
      DELETE FROM bookings WHERE id LIKE 'test-%';

      -- Clean up test availability slots
      DELETE FROM availability_slots WHERE id LIKE 'test-%';

      -- Clean up test services
      DELETE FROM services WHERE id LIKE 'test-%';

      -- Clean up test profiles (be careful with foreign key constraints)
      DELETE FROM profiles WHERE id LIKE 'test-%';

      -- Reset sequences
      SELECT setval('bookings_id_seq', 1, false);
      SELECT setval('services_id_seq', 1, false);
      SELECT setval('availability_slots_id_seq', 1, false);
      SELECT setval('profiles_id_seq', 1, false);
    `;

    const commands = cleanupCommands.split(';').filter(cmd => cmd.trim());
    for (const command of commands) {
      if (command.trim()) {
        try {
          this.executeSql(command);
        } catch (error) {
          console.warn('Cleanup command failed:', error.message);
        }
      }
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup() {
    console.log('🔄 Restoring database from backup...');

    try {
      // Find the most recent backup
      const backupFiles = fs.readdirSync(this.backupPath)
        .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
        .sort()
        .reverse();

      if (backupFiles.length === 0) {
        console.log('ℹ️  No backup files found for restoration');
        return;
      }

      const latestBackup = backupFiles[0];
      const backupPath = path.join(this.backupPath, latestBackup);

      // Restore from backup
      const command = `psql "${this.dbConfig.url}" < "${backupPath}"`;
      execSync(command, { stdio: 'inherit' });

      console.log(`✅ Database restored from: ${latestBackup}`);
    } catch (error) {
      console.error('❌ Database restoration failed:', error.message);
      throw error;
    }
  }

  /**
   * Clean up temporary files and resources
   */
  async cleanupTempFiles() {
    try {
      // Clean up old backup files (keep only last 5)
      const backupFiles = fs.readdirSync(this.backupPath)
        .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
        .sort()
        .reverse()
        .slice(5); // Keep 5 most recent, remove rest

      for (const file of backupFiles) {
        const filePath = path.join(this.backupPath, file);
        fs.unlinkSync(filePath);
      }

      // Clean up any test result files older than 7 days
      const testResultsPath = path.join(process.cwd(), 'test-results');
      if (fs.existsSync(testResultsPath)) {
        const files = fs.readdirSync(testResultsPath);
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

        files.forEach(file => {
          const filePath = path.join(testResultsPath, file);
          const stats = fs.statSync(filePath);

          if (now - stats.mtime.getTime() > maxAge) {
            fs.unlinkSync(filePath);
          }
        });
      }

      console.log('🧹 Temporary files cleaned up');
    } catch (error) {
      console.warn('⚠️  Temporary file cleanup failed:', error.message);
    }
  }

  /**
   * Create test data isolation for specific test suites
   */
  async createTestIsolation(testSuiteName) {
    console.log(`🔒 Creating isolation for test suite: ${testSuiteName}`);

    const schemaName = `test_${testSuiteName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;

    try {
      // Create isolated schema
      this.executeSql(`CREATE SCHEMA ${schemaName};`);

      // Copy all tables to the isolated schema
      const tables = this.executeSql(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      `);

      for (const table of tables) {
        this.executeSql(`
          CREATE TABLE ${schemaName}.${table.table_name}
          AS SELECT * FROM public.${table.table_name} WHERE FALSE;
        `);

        // Copy indexes and constraints
        const indexes = this.executeSql(`
          SELECT indexname, indexdef
          FROM pg_indexes
          WHERE schemaname = 'public'
          AND tablename = '${table.table_name}'
        `);

        for (const index of indexes) {
          const newIndexDef = index.indexdef
            .replace('public.', `${schemaName}.`)
            .replace(index.indexname, `${schemaName}_${index.indexname}`);

          this.executeSql(newIndexDef);
        }
      }

      console.log(`✅ Test isolation created: ${schemaName}`);
      return schemaName;
    } catch (error) {
      console.error('❌ Test isolation creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Clean up test isolation
   */
  async cleanupTestIsolation(schemaName) {
    console.log(`🗑️  Cleaning up test isolation: ${schemaName}`);

    try {
      this.executeSql(`DROP SCHEMA ${schemaName} CASCADE;`);
      console.log(`✅ Test isolation cleaned up: ${schemaName}`);
    } catch (error) {
      console.error('❌ Test isolation cleanup failed:', error.message);
      throw error;
    }
  }

  /**
   * Verify test data integrity
   */
  async verifyDataIntegrity() {
    console.log('🔍 Verifying test data integrity...');

    const checks = [
      {
        name: 'Services count',
        query: 'SELECT COUNT(*) as count FROM services WHERE id LIKE \'test-%\'',
        expectedMin: 1
      },
      {
        name: 'Availability slots count',
        query: 'SELECT COUNT(*) as count FROM availability_slots WHERE id LIKE \'test-%\'',
        expectedMin: 1
      },
      {
        name: 'Test profiles count',
        query: 'SELECT COUNT(*) as count FROM profiles WHERE id LIKE \'test-%\'',
        expectedMin: 0
      }
    ];

    const results = [];
    let allPassed = true;

    for (const check of checks) {
      try {
        const result = this.executeSql(check.query);
        const count = parseInt(result[0]?.count || 0);
        const passed = count >= check.expectedMin;

        results.push({
          name: check.name,
          expected: `>= ${check.expectedMin}`,
          actual: count,
          passed
        });

        if (!passed) {
          allPassed = false;
        }
      } catch (error) {
        results.push({
          name: check.name,
          expected: `>= ${check.expectedMin}`,
          actual: 'Error',
          passed: false,
          error: error.message
        });
        allPassed = false;
      }
    }

    console.log('\n📊 Data Integrity Check Results:');
    results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`   ${status} ${result.name}: ${result.actual} (expected ${result.expected})`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    });

    return {
      allPassed,
      results
    };
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const options = {};

  // Parse command line arguments
  for (let i = 1; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];

    switch (key) {
      case 'env':
        options.environment = value;
        break;
      case 'no-reset':
        options.resetBeforeTests = false;
        break;
      case 'no-cleanup':
        options.cleanupAfterTests = false;
        break;
      case 'no-seed':
        options.seedData = false;
        break;
      case 'no-backup':
        options.backupEnabled = false;
        break;
      case 'isolation':
        options.isolationLevel = value;
        break;
    }
  }

  const manager = new TestDataManager(options);

  async function runCommand() {
    try {
      switch (command) {
        case 'setup':
          await manager.setup();
          break;
        case 'cleanup':
          await manager.cleanup();
          break;
        case 'reset':
          await manager.resetDatabase();
          break;
        case 'seed':
          await manager.seedTestData();
          break;
        case 'verify':
          const integrity = await manager.verifyDataIntegrity();
          process.exit(integrity.allPassed ? 0 : 1);
          break;
        case 'isolation':
          const suiteName = args[args.indexOf('--suite') + 1] || 'default';
          const schema = await manager.createTestIsolation(suiteName);
          console.log(`Isolation schema: ${schema}`);
          break;
        default:
          console.log('Usage: node test-data-manager.js <command> [options]');
          console.log('Commands: setup, cleanup, reset, seed, verify, isolation');
          console.log('Options: --env <test|staging|production>, --no-reset, --no-cleanup, --no-seed, --no-backup, --isolation <transaction|database>');
          process.exit(1);
      }
    } catch (error) {
      console.error('❌ Command failed:', error.message);
      process.exit(1);
    }
  }

  runCommand();
}

module.exports = TestDataManager;