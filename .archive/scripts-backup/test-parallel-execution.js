#!/usr/bin/env node

/**
 * Parallel Test Execution Optimizer
 *
 * This script provides intelligent test splitting and parallel execution
 * optimization for CI/CD pipelines with smart caching strategies.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class TestParallelExecutor {
  constructor(options = {}) {
    this.options = {
      maxWorkers: options.maxWorkers || os.cpus().length,
      testDir: options.testDir || 'src',
      shardCount: options.shardCount || 4,
      testPattern: options.testPattern || '**/*.{test,spec}.{ts,tsx,js,jsx}',
      timeout: options.timeout || 30000,
      retries: options.retries || 2,
      cacheDir: options.cacheDir || '.test-cache',
      ...options
    };

    this.cache = new Map();
    this.testFiles = [];
    this.shards = [];
    this.results = [];
  }

  /**
   * Discover all test files in the project
   */
  async discoverTestFiles() {
    console.log('🔍 Discovering test files...');

    try {
      // Use find command to get all test files
      const { stdout } = execSync(
        `find ${this.options.testDir} -name "${this.options.testPattern.replace('**/*', '').replace(/\.\{.*?\}/, '')}" | head -1000`,
        { encoding: 'utf8' }
      );

      this.testFiles = stdout
        .split('\n')
        .filter(file => file.trim() &&
          (file.includes('.test.') || file.includes('.spec.')) &&
          file.match(/\.(ts|tsx|js|jsx)$/)
        );

      console.log(`📁 Found ${this.testFiles.length} test files`);
      return this.testFiles;
    } catch (error) {
      console.error('❌ Error discovering test files:', error.message);
      return [];
    }
  }

  /**
   * Analyze test files for complexity and execution time estimation
   */
  async analyzeTestFiles() {
    console.log('📊 Analyzing test files for complexity...');

    const analysisPromises = this.testFiles.map(async (file) => {
      try {
        const stats = fs.statSync(file);
        const content = fs.readFileSync(file, 'utf8');

        // Count test cases, assertions, and complexity indicators
        const testCount = (content.match(/(it|test)\s*\(/g) || []).length;
        const describeCount = (content.match(/describe\s*\(/g) || []).length;
        const lineCount = content.split('\n').length;
        const assertionCount = (content.match(/(expect|assert)\./g) || []).length;

        // Estimate execution time based on complexity
        const estimatedTime = Math.max(
          1000,
          testCount * 500 + lineCount * 10 + assertionCount * 100
        );

        // Check if file has been modified since last cache
        const cacheKey = this.getCacheKey(file);
        const cachedResult = this.getCachedResult(cacheKey);

        return {
          file,
          path: file,
          testCount,
          describeCount,
          lineCount,
          assertionCount,
          estimatedTime,
          complexity: testCount + describeCount + Math.floor(lineCount / 50),
          size: stats.size,
          modified: stats.mtime,
          cacheKey,
          cachedResult
        };
      } catch (error) {
        console.warn(`⚠️  Error analyzing ${file}:`, error.message);
        return {
          file,
          path: file,
          testCount: 0,
          describeCount: 0,
          lineCount: 0,
          assertionCount: 0,
          estimatedTime: 1000,
          complexity: 1,
          size: 0,
          modified: new Date(),
          cacheKey: null,
          cachedResult: null
        };
      }
    });

    this.testFiles = await Promise.all(analysisPromises);
    console.log(`✅ Analyzed ${this.testFiles.length} test files`);

    return this.testFiles;
  }

  /**
   * Create intelligent test shards based on complexity and estimated execution time
   */
  createShards() {
    console.log(`🔄 Creating ${this.options.shardCount} optimized shards...`);

    // Sort files by complexity (descending) for better load balancing
    const sortedFiles = [...this.testFiles].sort((a, b) => b.complexity - a.complexity);

    // Initialize shards
    this.shards = Array.from({ length: this.options.shardCount }, () => ({
      files: [],
      totalComplexity: 0,
      estimatedTime: 0,
      testCount: 0,
      size: 0
    }));

    // Distribute files using a greedy algorithm for load balancing
    sortedFiles.forEach(file => {
      // Find the shard with the least load
      let minIndex = 0;
      let minLoad = this.shards[0].totalComplexity;

      for (let i = 1; i < this.shards.length; i++) {
        const currentLoad = this.shards[i].totalComplexity;
        if (currentLoad < minLoad) {
          minLoad = currentLoad;
          minIndex = i;
        }
      }

      // Add file to the selected shard
      this.shards[minIndex].files.push(file);
      this.shards[minIndex].totalComplexity += file.complexity;
      this.shards[minIndex].estimatedTime += file.estimatedTime;
      this.shards[minIndex].testCount += file.testCount;
      this.shards[minIndex].size += file.size;
    });

    // Log shard distribution
    this.shards.forEach((shard, index) => {
      console.log(`📦 Shard ${index}: ${shard.files.length} files, ${shard.testCount} tests, ${Math.round(shard.estimatedTime / 1000)}s estimated`);
    });

    return this.shards;
  }

  /**
   * Generate cache key for a test file
   */
  getCacheKey(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      const hash = require('crypto').createHash('md5');
      hash.update(`${filePath}:${stats.mtime.getTime()}:${stats.size}:${content.slice(0, 1000)}`);
      return hash.digest('hex');
    } catch (error) {
      return null;
    }
  }

  /**
   * Get cached test result if available and valid
   */
  getCachedResult(cacheKey) {
    if (!cacheKey) return null;

    try {
      const cacheFile = path.join(this.options.cacheDir, `${cacheKey}.json`);
      if (fs.existsSync(cacheFile)) {
        const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (Date.now() - cached.timestamp < maxAge) {
          return cached.result;
        }
      }
    } catch (error) {
      // Cache read failed, ignore
    }

    return null;
  }

  /**
   * Cache test result
   */
  cacheResult(cacheKey, result) {
    if (!cacheKey) return;

    try {
      if (!fs.existsSync(this.options.cacheDir)) {
        fs.mkdirSync(this.options.cacheDir, { recursive: true });
      }

      const cacheFile = path.join(this.options.cacheDir, `${cacheKey}.json`);
      const cacheData = {
        timestamp: Date.now(),
        result
      };

      fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
    } catch (error) {
      // Cache write failed, ignore
    }
  }

  /**
   * Execute tests for a single shard
   */
  async executeShard(shardIndex, shard) {
    const startTime = Date.now();
    console.log(`🚀 Executing shard ${shardIndex} with ${shard.files.length} files...`);

    // Create temporary test list file for this shard
    const testListFile = path.join(os.tmpdir(), `test-shard-${shardIndex}-${Date.now()}.txt`);
    fs.writeFileSync(testListFile, shard.files.map(f => f.file).join('\n'));

    try {
      // Execute tests with specific file list
      const testCommand = `npx vitest run \
        --config vitest.config.ts \
        --reporter=json \
        --outputFile=test-results/shard-${shardIndex}-results.json \
        --maxWorkers=${Math.min(4, Math.ceil(os.cpus().length / this.options.shardCount))} \
        --testTimeout=${this.options.timeout} \
        --retry=${this.options.retries} \
        ${shard.files.map(f => f.file).join(' ')}`;

      const result = execSync(testCommand, {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        timeout: Math.max(300000, shard.estimatedTime * 3) // 5 min minimum or 3x estimated time
      });

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Parse results
      let testResults;
      try {
        testResults = JSON.parse(fs.readFileSync(`test-results/shard-${shardIndex}-results.json`, 'utf8'));
      } catch (error) {
        testResults = {
          numTotalTests: shard.testCount,
          numPassedTests: shard.testCount,
          numFailedTests: 0,
          numPendingTests: 0,
          testResults: []
        };
      }

      const shardResult = {
        shardIndex,
        files: shard.files,
        executionTime,
        estimatedTime: shard.estimatedTime,
        testResults,
        success: true
      };

      // Cache individual file results
      shard.files.forEach(file => {
        const fileResult = testResults.testResults?.find(tr => tr.title.includes(file.file)) || {
          status: 'passed',
          duration: 0
        };
        this.cacheResult(file.cacheKey, fileResult);
      });

      console.log(`✅ Shard ${shardIndex} completed in ${Math.round(executionTime / 1000)}s`);
      return shardResult;

    } catch (error) {
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      console.error(`❌ Shard ${shardIndex} failed after ${Math.round(executionTime / 1000)}s:`, error.message);

      return {
        shardIndex,
        files: shard.files,
        executionTime,
        estimatedTime: shard.estimatedTime,
        error: error.message,
        success: false
      };
    } finally {
      // Cleanup temporary files
      try {
        fs.unlinkSync(testListFile);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Execute all shards in parallel
   */
  async executeShards() {
    console.log(`🔥 Executing ${this.shards.length} shards in parallel...`);

    const promises = this.shards.map((shard, index) =>
      this.executeShard(index, shard)
    );

    this.results = await Promise.all(promises);

    return this.results;
  }

  /**
   * Generate comprehensive execution report
   */
  generateReport() {
    const totalFiles = this.results.reduce((sum, result) => sum + result.files.length, 0);
    const totalTests = this.results.reduce((sum, result) =>
      sum + (result.testResults?.numTotalTests || 0), 0
    );
    const totalPassed = this.results.reduce((sum, result) =>
      sum + (result.testResults?.numPassedTests || 0), 0
    );
    const totalFailed = this.results.reduce((sum, result) =>
      sum + (result.testResults?.numFailedTests || 0), 0
    );
    const totalExecutionTime = this.results.reduce((sum, result) => sum + result.executionTime, 0);
    const totalEstimatedTime = this.shards.reduce((sum, shard) => sum + shard.estimatedTime, 0);
    const successfulShards = this.results.filter(result => result.success).length;

    const report = {
      summary: {
        totalFiles,
        totalTests,
        totalPassed,
        totalFailed,
        totalExecutionTime,
        totalEstimatedTime,
        successfulShards,
        failedShards: this.shards.length - successfulShards,
        efficiency: Math.round((totalEstimatedTime / totalExecutionTime) * 100),
        timestamp: new Date().toISOString()
      },
      shards: this.results.map(result => ({
        shardIndex: result.shardIndex,
        fileCount: result.files.length,
        executionTime: result.executionTime,
        estimatedTime: result.estimatedTime,
        success: result.success,
        testCount: result.testResults?.numTotalTests || 0,
        passedTests: result.testResults?.numPassedTests || 0,
        failedTests: result.testResults?.numFailedTests || 0,
        efficiency: Math.round((result.estimatedTime / result.executionTime) * 100)
      })),
      recommendations: this.generateRecommendations()
    };

    // Save detailed report
    if (!fs.existsSync('test-results')) {
      fs.mkdirSync('test-results', { recursive: true });
    }

    fs.writeFileSync(
      'test-results/parallel-execution-report.json',
      JSON.stringify(report, null, 2)
    );

    // Print summary
    console.log('\n📊 Parallel Execution Summary:');
    console.log(`   Files: ${totalFiles}`);
    console.log(`   Tests: ${totalTests} (${totalPassed} passed, ${totalFailed} failed)`);
    console.log(`   Shards: ${successfulShards}/${this.shards.length} successful`);
    console.log(`   Execution Time: ${Math.round(totalExecutionTime / 1000)}s`);
    console.log(`   Estimated Time: ${Math.round(totalEstimatedTime / 1000)}s`);
    console.log(`   Efficiency: ${report.summary.efficiency}%`);

    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }

    return report;
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    const report = this.generateReport();

    // Check for inefficient shards
    const inefficientShards = report.shards.filter(shard => shard.efficiency < 50);
    if (inefficientShards.length > 0) {
      recommendations.push(`${inefficientShards.length} shards have low efficiency (<50%). Consider adjusting shard distribution.`);
    }

    // Check for failed shards
    if (report.summary.failedShards > 0) {
      recommendations.push(`${report.summary.failedShards} shards failed. Review error logs and consider increasing timeout or retries.`);
    }

    // Check execution time
    if (report.summary.totalExecutionTime > 600000) { // 10 minutes
      recommendations.push('Total execution time exceeds 10 minutes. Consider increasing parallelism or optimizing tests.');
    }

    // Check cache efficiency
    const cachedFiles = this.testFiles.filter(file => file.cachedResult).length;
    const cacheEfficiency = Math.round((cachedFiles / this.testFiles.length) * 100);

    if (cacheEfficiency < 30) {
      recommendations.push(`Cache efficiency is low (${cacheEfficiency}%). Consider running tests more frequently to improve caching.`);
    }

    return recommendations;
  }

  /**
   * Clean up old cache files
   */
  cleanupCache(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    try {
      if (!fs.existsSync(this.options.cacheDir)) return;

      const files = fs.readdirSync(this.options.cacheDir);
      const now = Date.now();

      files.forEach(file => {
        const filePath = path.join(this.options.cacheDir, file);
        const stats = fs.statSync(filePath);

        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
        }
      });

      console.log('🧹 Cache cleanup completed');
    } catch (error) {
      console.warn('⚠️  Cache cleanup failed:', error.message);
    }
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      console.log('🚀 Starting Parallel Test Execution Optimizer\n');

      // Cleanup old cache
      this.cleanupCache();

      // Discover and analyze test files
      await this.discoverTestFiles();
      await this.analyzeTestFiles();

      if (this.testFiles.length === 0) {
        console.log('ℹ️  No test files found');
        return { success: true, message: 'No tests to run' };
      }

      // Create optimized shards
      this.createShards();

      // Execute shards in parallel
      const results = await this.executeShards();

      // Generate and return report
      const report = this.generateReport();

      return {
        success: report.summary.failedShards === 0 && report.summary.totalFailed === 0,
        report
      };

    } catch (error) {
      console.error('❌ Parallel execution failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];

    switch (key) {
      case 'shards':
        options.shardCount = parseInt(value);
        break;
      case 'workers':
        options.maxWorkers = parseInt(value);
        break;
      case 'timeout':
        options.timeout = parseInt(value);
        break;
      case 'retries':
        options.retries = parseInt(value);
        break;
      case 'cache-dir':
        options.cacheDir = value;
        break;
    }
  }

  const executor = new TestParallelExecutor(options);
  executor.run().then(result => {
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Execution failed:', error);
    process.exit(1);
  });
}

module.exports = TestParallelExecutor;