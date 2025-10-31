#!/usr/bin/env node

/**
 * Intelligent Test Selection & AI-Powered Test Optimization System
 *
 * Provides advanced test selection capabilities:
 * - AI-powered test selection based on code changes
 * - Test impact analysis for faster feedback
 * - Parallel test execution optimization
 * - Test failure analysis and root cause detection
 * - Test flakiness detection and management
 * - Smart test scheduling and prioritization
 * - Learning from historical test data
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

class IntelligentTestSelection {
  constructor(options = {}) {
    this.options = {
      testResultsDir: path.join(process.cwd(), 'test-results'),
      intelligenceDir: path.join(process.cwd(), 'test-results', 'intelligence'),
      historyFile: path.join(process.cwd(), 'test-results', 'intelligence', 'test-history.json'),
      impactAnalysisFile: path.join(process.cwd(), 'test-results', 'intelligence', 'impact-analysis.json'),
      flakyTestsFile: path.join(process.cwd(), 'test-results', 'intelligence', 'flaky-tests.json'),
      learningModelFile: path.join(process.cwd(), 'test-results', 'intelligence', 'learning-model.json'),
      maxConcurrency: 4,
      changeImpactRadius: 3, // How many levels deep to analyze impact
      flakinessThreshold: 0.3, // 30% failure rate considered flaky
      historicalDataDays: 30, // Days of historical data to consider
      confidenceThreshold: 0.7, // Minimum confidence for AI predictions
      testCategories: {
        unit: { priority: 1, weight: 0.4, averageDuration: 50 },
        integration: { priority: 2, weight: 0.3, averageDuration: 200 },
        e2e: { priority: 3, weight: 0.2, averageDuration: 5000 },
        visual: { priority: 2, weight: 0.1, averageDuration: 1000 }
      },
      ...options
    };

    this.testHistory = [];
    this.impactAnalysis = {};
    this.flakyTests = new Set();
    this.learningModel = null;
    this.currentChanges = [];

    this.initializeDirectories();
    this.loadHistoricalData();
    this.loadLearningModel();
  }

  initializeDirectories() {
    const dirs = [
      this.options.intelligenceDir,
      path.join(this.options.intelligenceDir, 'analysis'),
      path.join(this.options.intelligenceDir, 'predictions'),
      path.join(this.options.intelligenceDir, 'optimizations')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  loadHistoricalData() {
    try {
      if (fs.existsSync(this.options.historyFile)) {
        this.testHistory = JSON.parse(fs.readFileSync(this.options.historyFile, 'utf8'));
        // Filter to recent data
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.options.historicalDataDays);
        this.testHistory = this.testHistory.filter(entry =>
          new Date(entry.timestamp) > cutoffDate
        );
      }
    } catch (error) {
      console.warn('Could not load test history:', error.message);
      this.testHistory = [];
    }

    try {
      if (fs.existsSync(this.options.flakyTestsFile)) {
        const flakyData = JSON.parse(fs.readFileSync(this.options.flakyTestsFile, 'utf8'));
        this.flakyTests = new Set(flakyData.flakyTests || []);
      }
    } catch (error) {
      console.warn('Could not load flaky tests data:', error.message);
    }
  }

  loadLearningModel() {
    try {
      if (fs.existsSync(this.options.learningModelFile)) {
        this.learningModel = JSON.parse(fs.readFileSync(this.options.learningModelFile, 'utf8'));
      }
    } catch (error) {
      console.warn('Could not load learning model:', error.message);
      this.learningModel = this.createInitialLearningModel();
    }
  }

  createInitialLearningModel() {
    return {
      version: '1.0',
      created: new Date().toISOString(),
      patterns: {
        fileDependencies: {},
        testFailurePatterns: {},
        impactCorrelations: {},
        durationPredictors: {}
      },
      statistics: {
        totalPredictions: 0,
        accuratePredictions: 0,
        accuracy: 0
      }
    };
  }

  async runIntelligentTestSelection(options = {}) {
    console.log('🧠 Starting Intelligent Test Selection...\n');
    const startTime = Date.now();

    try {
      // 1. Detect code changes
      console.log('🔍 Detecting code changes...');
      this.currentChanges = await this.detectCodeChanges();

      // 2. Analyze change impact
      console.log('📊 Analyzing change impact...');
      const impactAnalysis = await this.analyzeChangeImpact(this.currentChanges);

      // 3. Select relevant tests
      console.log('🎯 Selecting relevant tests...');
      const selectedTests = await this.selectRelevantTests(impactAnalysis);

      // 4. Prioritize tests based on intelligence
      console.log('📋 Prioritizing tests...');
      const prioritizedTests = await this.prioritizeTests(selectedTests);

      // 5. Optimize test execution plan
      console.log('⚡ Optimizing test execution plan...');
      const executionPlan = await this.optimizeExecutionPlan(prioritizedTests);

      // 6. Predict test outcomes
      console.log('🔮 Predicting test outcomes...');
      const predictions = await this.predictTestOutcomes(executionPlan);

      // 7. Detect and handle flaky tests
      console.log('🎲 Handling flaky tests...');
      const flakyTestHandling = await this.handleFlakyTests(executionPlan);

      // 8. Generate execution recommendations
      console.log('💡 Generating execution recommendations...');
      const recommendations = await this.generateExecutionRecommendations(executionPlan, predictions);

      // 9. Save intelligence data
      console.log('💾 Saving intelligence data...');
      await this.saveIntelligenceData(executionPlan, predictions);

      const duration = Date.now() - startTime;

      console.log(`\n✅ Intelligent test selection completed:`);
      console.log(`   Selected ${selectedTests.length} tests from ${this.getTotalAvailableTests()} available`);
      console.log(`   Predicted failure rate: ${(predictions.overallFailureRisk * 100).toFixed(1)}%`);
      console.log(`   Estimated duration: ${(executionPlan.estimatedDuration / 1000).toFixed(1)}s`);
      console.log(`   Optimization savings: ${executionPlan.optimizationSavings.toFixed(1)}%`);
      console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);

      return {
        changes: this.currentChanges,
        impactAnalysis,
        selectedTests,
        prioritizedTests,
        executionPlan,
        predictions,
        flakyTestHandling,
        recommendations,
        duration,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Intelligent test selection failed:', error);
      throw error;
    }
  }

  async detectCodeChanges() {
    const changes = {
      files: [],
      directories: [],
      dependencies: new Set(),
      tests: new Set(),
      types: {
        added: [],
        modified: [],
        deleted: []
      }
    };

    try {
      // Get git changes
      const gitOutput = execSync('git status --porcelain', { encoding: 'utf8', cwd: process.cwd() });
      const gitDiffOutput = execSync('git diff --name-only HEAD~1', { encoding: 'utf8', cwd: process.cwd() });

      const changedFiles = [...gitOutput.split('\n'), ...gitDiffOutput.split('\n')]
        .filter(file => file && file.trim().length > 0)
        .map(file => file.replace(/^[^ ]+\s+/, '')); // Remove git status prefix

      // Analyze each changed file
      for (const filePath of changedFiles) {
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          const fileInfo = {
            path: filePath,
            type: stats.isDirectory() ? 'directory' : 'file',
            extension: path.extname(filePath),
            directory: path.dirname(filePath),
            size: stats.size,
            lastModified: stats.mtime,
            changeType: this.getChangeType(filePath),
            dependencies: await this.analyzeFileDependencies(filePath),
            impact: this.calculateFileImpact(filePath)
          };

          changes.files.push(fileInfo);

          // Categorize by type
          if (fileInfo.changeType) {
            changes.types[fileInfo.changeType].push(filePath);
          }

          // Extract dependencies
          fileInfo.dependencies.forEach(dep => changes.dependencies.add(dep));

          // Check if it's a test file
          if (this.isTestFile(filePath)) {
            changes.tests.add(filePath);
          }
        }
      }

      // Extract unique directories
      changes.directories = [...new Set(changes.files.map(f => f.directory))];

    } catch (error) {
      console.warn('Error detecting code changes:', error.message);
    }

    return changes;
  }

  getChangeType(filePath) {
    try {
      const gitOutput = execSync(`git status --porcelain "${filePath}"`, { encoding: 'utf8', cwd: process.cwd() });
      const status = gitOutput.trim().charAt(0);

      switch (status) {
        case 'A': return 'added';
        case 'M': return 'modified';
        case 'D': return 'deleted';
        case 'R': return 'renamed';
        case 'C': return 'copied';
        default: return 'unknown';
      }
    } catch (error) {
      return 'unknown';
    }
  }

  async analyzeFileDependencies(filePath) {
    const dependencies = [];

    try {
      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
        const content = fs.readFileSync(filePath, 'utf8');

        // Extract import statements
        const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
          dependencies.push(match[1]);
        }

        // Extract require statements
        const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
        while ((match = requireRegex.exec(content)) !== null) {
          dependencies.push(match[1]);
        }

        // Extract dynamic imports
        const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
        while ((match = dynamicImportRegex.exec(content)) !== null) {
          dependencies.push(match[1]);
        }
      }
    } catch (error) {
      console.warn(`Error analyzing dependencies for ${filePath}:`, error.message);
    }

    return dependencies;
  }

  calculateFileImpact(filePath) {
    // Calculate impact score based on file type and location
    let impact = 1; // Base impact

    // Higher impact for certain file types
    const highImpactFiles = [
      'src/main.tsx',
      'src/App.tsx',
      'vite.config.ts',
      'package.json',
      'tsconfig.json'
    ];

    const highImpactExtensions = ['.ts', '.tsx', '.js', '.jsx'];
    const mediumImpactExtensions = ['.json', '.css', '.scss'];

    if (highImpactFiles.includes(filePath)) {
      impact = 10;
    } else if (highImpactExtensions.includes(path.extname(filePath))) {
      impact = 5;
    } else if (mediumImpactExtensions.includes(path.extname(filePath))) {
      impact = 2;
    }

    // Higher impact for core directories
    if (filePath.includes('src/contexts/') || filePath.includes('src/lib/') || filePath.includes('src/services/')) {
      impact *= 2;
    }

    return impact;
  }

  isTestFile(filePath) {
    return filePath.includes('.test.') ||
           filePath.includes('.spec.') ||
           filePath.includes('/test/') ||
           filePath.includes('/tests/') ||
           filePath.includes('__tests__/');
  }

  async analyzeChangeImpact(changes) {
    const impactAnalysis = {
      overallImpact: 0,
      affectedAreas: new Set(),
      impactRadius: new Map(),
      recommendedTests: new Set(),
      riskAssessment: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      }
    };

    // Analyze each changed file
    for (const file of changes.files) {
      const fileImpact = await this.analyzeFileChangeImpact(file);
      impactAnalysis.affectedAreas.add(file.directory);
      impactAnalysis.impactRadius.set(file.path, fileImpact);
      impactAnalysis.overallImpact += fileImpact.score;

      // Add recommended tests based on file impact
      fileImpact.recommendedTests.forEach(test => impactAnalysis.recommendedTests.add(test));
    }

    // Categorize risk
    impactAnalysis.impactRadius.forEach((impact, filePath) => {
      if (impact.risk >= 0.8) {
        impactAnalysis.riskAssessment.critical++;
      } else if (impact.risk >= 0.6) {
        impactAnalysis.riskAssessment.high++;
      } else if (impact.risk >= 0.3) {
        impactAnalysis.riskAssessment.medium++;
      } else {
        impactAnalysis.riskAssessment.low++;
      }
    });

    // Load historical impact patterns
    this.applyHistoricalImpactPatterns(impactAnalysis, changes);

    return {
      ...impactAnalysis,
      affectedAreas: Array.from(impactAnalysis.affectedAreas),
      recommendedTests: Array.from(impactAnalysis.recommendedTests),
      impactRadius: Object.fromEntries(impactAnalysis.impactRadius)
    };
  }

  async analyzeFileChangeImpact(file) {
    const impact = {
      score: file.impact || 1,
      risk: 0.1,
      recommendedTests: [],
      affectedComponents: [],
      affectedModules: []
    };

    // Higher risk for certain changes
    if (file.changeType === 'deleted') {
      impact.risk = 0.9;
      impact.score *= 3;
    } else if (file.changeType === 'added') {
      impact.risk = 0.4;
    } else if (file.changeType === 'modified') {
      impact.risk = 0.6;
    }

    // Analyze based on file path
    const pathSegments = file.path.split('/');
    if (pathSegments.includes('contexts')) {
      impact.risk += 0.3;
      impact.affectedComponents.push('state-management');
      impact.recommendedTests.push('integration', 'e2e');
    }

    if (pathSegments.includes('services')) {
      impact.risk += 0.4;
      impact.affectedModules.push('api');
      impact.recommendedTests.push('integration', 'e2e');
    }

    if (pathSegments.includes('components')) {
      impact.affectedComponents.push('ui');
      impact.recommendedTests.push('unit', 'visual', 'e2e');
    }

    if (pathSegments.includes('lib') || pathSegments.includes('utils')) {
      impact.affectedModules.push('utilities');
      impact.recommendedTests.push('unit');
    }

    // Analyze dependencies to estimate ripple effect
    const dependencyImpact = await this.analyzeDependencyImpact(file.dependencies);
    impact.score += dependencyImpact.score;
    impact.risk += dependencyImpact.risk;
    impact.affectedModules.push(...dependencyImpact.affectedModules);

    // Cap risk at 1.0
    impact.risk = Math.min(1.0, impact.risk);

    return impact;
  }

  async analyzeDependencyImpact(dependencies) {
    const impact = {
      score: 0,
      risk: 0,
      affectedModules: []
    };

    for (const dep of dependencies) {
      // Check if dependency is internal (part of our codebase)
      if (dep.startsWith('.') || dep.startsWith('@/')) {
        impact.score += 2;
        impact.risk += 0.1;

        // Determine what module this dependency belongs to
        if (dep.includes('contexts')) {
          impact.affectedModules.push('state-management');
        } else if (dep.includes('services')) {
          impact.affectedModules.push('api');
        } else if (dep.includes('components')) {
          impact.affectedModules.push('ui');
        }
      }
    }

    return impact;
  }

  applyHistoricalImpactPatterns(impactAnalysis, changes) {
    if (!this.learningModel || !this.learningModel.patterns.impactCorrelations) {
      return;
    }

    const patterns = this.learningModel.patterns.impactCorrelations;

    // Apply historical patterns to current changes
    for (const file of changes.files) {
      const fileKey = this.getFilePatternKey(file.path);
      if (patterns[fileKey]) {
        const pattern = patterns[fileKey];
        impactAnalysis.recommendedTests.push(...pattern.likelyFailures);

        // Adjust risk based on historical data
        if (pattern.historicalFailureRate > 0.5) {
          impactAnalysis.riskAssessment.high++;
          impactAnalysis.riskAssessment.medium--;
        }
      }
    }
  }

  getFilePatternKey(filePath) {
    // Normalize file path for pattern matching
    return filePath
      .replace(/[^a-zA-Z0-9\/]/g, '_')
      .replace(/\/+/g, '/')
      .toLowerCase();
  }

  async selectRelevantTests(impactAnalysis) {
    const selectedTests = {
      unit: [],
      integration: [],
      e2e: [],
      visual: [],
      total: 0,
      selectionRatio: 0
    };

    // Get all available tests
    const availableTests = await this.getAllAvailableTests();

    // Select tests based on impact analysis
    const recommendedTests = new Set(impactAnalysis.recommendedTests);

    // Always include high-risk area tests
    if (impactAnalysis.riskAssessment.critical > 0 || impactAnalysis.riskAssessment.high > 0) {
      recommendedTests.add('e2e');
      recommendedTests.add('integration');
    }

    // Select tests by category
    Object.keys(this.options.testCategories).forEach(category => {
      const categoryTests = availableTests[category] || [];

      if (recommendedTests.has(category)) {
        // Include all tests from this category
        selectedTests[category] = [...categoryTests];
      } else {
        // Select tests based on file proximity and dependencies
        const relevantTests = await this.findTestsForCategory(category, impactAnalysis);
        selectedTests[category] = relevantTests;
      }
    });

    // Remove duplicate tests
    const allTests = new Set();
    Object.values(selectedTests).forEach(tests => {
      tests.forEach(test => allTests.add(test));
    });

    selectedTests.total = allTests.size;
    selectedTests.selectionRatio = allTests.size / this.getTotalAvailableTests();

    return selectedTests;
  }

  async getAllAvailableTests() {
    const tests = {
      unit: [],
      integration: [],
      e2e: [],
      visual: []
    };

    // Scan for test files
    const testPatterns = [
      { pattern: 'src/**/*.test.{ts,tsx,js,jsx}', category: 'unit' },
      { pattern: 'src/**/*.spec.{ts,tsx,js,jsx}', category: 'unit' },
      { pattern: 'src/test/**/*.{ts,tsx,js,jsx}', category: 'integration' },
      { pattern: 'tests/e2e/**/*.{ts,js}', category: 'e2e' },
      { pattern: 'tests/visual/**/*.{ts,js}', category: 'visual' }
    ];

    for (const { pattern, category } of testPatterns) {
      try {
        const files = execSync(`find . -name "${pattern.replace('src/', '').replace('**/', '*')}"`, {
          encoding: 'utf8',
          cwd: process.cwd()
        });

        tests[category] = files.split('\n').filter(file => file.trim().length > 0);
      } catch (error) {
        // No files found for this pattern
      }
    }

    return tests;
  }

  async findTestsForCategory(category, impactAnalysis) {
    const availableTests = await this.getAllAvailableTests();
    const categoryTests = availableTests[category] || [];
    const relevantTests = [];

    for (const testPath of categoryTests) {
      const relevance = await this.calculateTestRelevance(testPath, impactAnalysis);
      if (relevance >= 0.3) { // Threshold for including test
        relevantTests.push({
          path: testPath,
          relevance,
          estimatedDuration: this.options.testCategories[category].averageDuration
        });
      }
    }

    // Sort by relevance (highest first)
    relevantTests.sort((a, b) => b.relevance - a.relevance);

    return relevantTests.map(test => test.path);
  }

  async calculateTestRelevance(testPath, impactAnalysis) {
    let relevance = 0;

    // Base relevance from impact analysis
    for (const [filePath, impact] of Object.entries(impactAnalysis.impactRadius)) {
      const proximity = this.calculateFileProximity(testPath, filePath);
      relevance += impact.score * proximity;
    }

    // Historical relevance from learning model
    if (this.learningModel && this.learningModel.patterns.testFailurePatterns) {
      const testKey = this.getFilePatternKey(testPath);
      const pattern = this.learningModel.patterns.testFailurePatterns[testKey];
      if (pattern) {
        relevance += pattern.likelihood * 0.3;
      }
    }

    // Boost relevance for recently changed areas
    for (const changedFile of this.currentChanges.files) {
      if (testPath.includes(changedFile.directory)) {
        relevance += 0.2;
      }
    }

    return Math.min(1.0, relevance);
  }

  calculateFileProximity(testPath, filePath) {
    // Simple proximity calculation based on directory structure
    const testDirs = path.dirname(testPath).split('/');
    const fileDirs = path.dirname(filePath).split('/');

    // Calculate common directory depth
    let commonDepth = 0;
    const minLength = Math.min(testDirs.length, fileDirs.length);

    for (let i = 0; i < minLength; i++) {
      if (testDirs[i] === fileDirs[i]) {
        commonDepth++;
      } else {
        break;
      }
    }

    // Higher proximity for more shared directories
    return commonDepth / Math.max(testDirs.length, fileDirs.length);
  }

  async prioritizeTests(selectedTests) {
    const prioritizedTests = {
      critical: [],
      high: [],
      medium: [],
      low: [],
      total: selectedTests.total
    };

    // Calculate priority for each test
    for (const [category, tests] of Object.entries(selectedTests)) {
      if (category === 'total') continue;

      for (const testPath of tests) {
        const priority = await this.calculateTestPriority(testPath, category);
        const testInfo = {
          path: testPath,
          category,
          priority,
          estimatedDuration: this.options.testCategories[category].averageDuration,
          flaky: this.flakyTests.has(testPath),
          historicalFailureRate: this.getHistoricalFailureRate(testPath)
        };

        if (priority >= 0.8) {
          prioritizedTests.critical.push(testInfo);
        } else if (priority >= 0.6) {
          prioritizedTests.high.push(testInfo);
        } else if (priority >= 0.4) {
          prioritizedTests.medium.push(testInfo);
        } else {
          prioritizedTests.low.push(testInfo);
        }
      }
    }

    // Sort within each priority level
    Object.keys(prioritizedTests).forEach(priority => {
      if (priority !== 'total') {
        prioritizedTests[priority].sort((a, b) => b.priority - a.priority);
      }
    });

    return prioritizedTests;
  }

  async calculateTestPriority(testPath, category) {
    let priority = 0.5; // Base priority

    // Category-based priority
    priority += this.options.testCategories[category].priority * 0.1;

    // Historical failure rate increases priority
    const failureRate = this.getHistoricalFailureRate(testPath);
    priority += failureRate * 0.3;

    // Flaky tests get lower priority (but not too low)
    if (this.flakyTests.has(testPath)) {
      priority -= 0.1;
    }

    // Critical path tests get higher priority
    if (this.isCriticalPathTest(testPath)) {
      priority += 0.2;
    }

    // Recently failing tests get higher priority
    if (this.recentlyFailed(testPath)) {
      priority += 0.15;
    }

    // AI prediction based priority
    if (this.learningModel && this.learningModel.patterns.testFailurePatterns) {
      const testKey = this.getFilePatternKey(testPath);
      const pattern = this.learningModel.patterns.testFailurePatterns[testKey];
      if (pattern && pattern.likelihood > this.options.confidenceThreshold) {
        priority += pattern.likelihood * 0.2;
      }
    }

    return Math.min(1.0, Math.max(0.0, priority));
  }

  getHistoricalFailureRate(testPath) {
    const testHistory = this.testHistory.filter(entry => entry.testPath === testPath);
    if (testHistory.length === 0) return 0;

    const failures = testHistory.filter(entry => !entry.passed).length;
    return failures / testHistory.length;
  }

  isCriticalPathTest(testPath) {
    const criticalPaths = [
      'booking',
      'payment',
      'auth',
      'service',
      'main'
    ];

    return criticalPaths.some(path => testPath.toLowerCase().includes(path));
  }

  recentlyFailed(testPath) {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const recentHistory = this.testHistory.filter(entry =>
      entry.testPath === testPath &&
      new Date(entry.timestamp) > oneDayAgo
    );

    return recentHistory.some(entry => !entry.passed);
  }

  async optimizeExecutionPlan(prioritizedTests) {
    const executionPlan = {
      phases: [],
      totalTests: prioritizedTests.total,
      estimatedDuration: 0,
      parallelGroups: [],
      optimizationSavings: 0,
      resources: {
        maxConcurrency: this.options.maxConcurrency,
        estimatedMemory: 0,
        estimatedCpu: 0
      }
    };

    // Create execution phases based on priority
    const phases = [
      { name: 'Critical Tests', tests: prioritizedTests.critical, priority: 1 },
      { name: 'High Priority Tests', tests: prioritizedTests.high, priority: 2 },
      { name: 'Medium Priority Tests', tests: prioritizedTests.medium, priority: 3 },
      { name: 'Low Priority Tests', tests: prioritizedTests.low, priority: 4 }
    ];

    // Optimize each phase
    for (const phase of phases) {
      if (phase.tests.length === 0) continue;

      const optimizedPhase = await this.optimizePhase(phase);
      executionPlan.phases.push(optimizedPhase);
      executionPlan.estimatedDuration += optimizedPhase.estimatedDuration;
    }

    // Calculate optimization savings
    const originalDuration = this.calculateOriginalDuration(prioritizedTests);
    executionPlan.optimizationSavings = ((originalDuration - executionPlan.estimatedDuration) / originalDuration) * 100;

    // Generate parallel execution groups
    executionPlan.parallelGroups = this.generateParallelGroups(executionPlan.phases);

    return executionPlan;
  }

  async optimizePhase(phase) {
    const optimizedPhase = {
      name: phase.name,
      tests: phase.tests,
      groups: [],
      estimatedDuration: 0,
      parallelizable: true
    };

    // Group tests by category and characteristics
    const testGroups = this.groupTestsForOptimization(phase.tests);

    // Optimize each group
    for (const group of testGroups) {
      const optimizedGroup = await this.optimizeTestGroup(group);
      optimizedPhase.groups.push(optimizedGroup);
      optimizedPhase.estimatedDuration += optimizedGroup.estimatedDuration;
    }

    return optimizedPhase;
  }

  groupTestsForOptimization(tests) {
    const groups = {
      fast: [],     // Tests that run quickly (< 100ms)
      medium: [],   // Medium duration tests (100ms - 1s)
      slow: [],     // Slow tests (> 1s)
      flaky: [],    // Known flaky tests
      independent: [] // Tests that can run independently
    };

    tests.forEach(test => {
      if (test.flaky) {
        groups.flaky.push(test);
      } else if (test.estimatedDuration < 100) {
        groups.fast.push(test);
      } else if (test.estimatedDuration < 1000) {
        groups.medium.push(test);
      } else {
        groups.slow.push(test);
      }
    });

    // Filter out empty groups
    return Object.entries(groups)
      .filter(([_, tests]) => tests.length > 0)
      .map(([type, tests]) => ({ type, tests }));
  }

  async optimizeTestGroup(group) {
    const optimizedGroup = {
      type: group.type,
      tests: group.tests,
      executionStrategy: this.determineExecutionStrategy(group),
      estimatedDuration: 0,
      concurrency: 1
    };

    // Calculate estimated duration
    if (optimizedGroup.executionStrategy === 'parallel') {
      optimizedGroup.estimatedDuration = Math.max(...group.tests.map(t => t.estimatedDuration));
      optimizedGroup.concurrency = Math.min(group.tests.length, this.options.maxConcurrency);
    } else {
      optimizedGroup.estimatedDuration = group.tests.reduce((sum, t) => sum + t.estimatedDuration, 0);
      optimizedGroup.concurrency = 1;
    }

    return optimizedGroup;
  }

  determineExecutionStrategy(group) {
    // Flaky tests should run sequentially
    if (group.type === 'flaky') {
      return 'sequential';
    }

    // Fast tests can run in parallel
    if (group.type === 'fast') {
      return 'parallel';
    }

    // Medium tests can run in parallel with limited concurrency
    if (group.type === 'medium') {
      return 'parallel';
    }

    // Slow tests might be better run sequentially to avoid resource contention
    return group.tests.length <= 2 ? 'parallel' : 'sequential';
  }

  calculateOriginalDuration(prioritizedTests) {
    let totalDuration = 0;

    Object.values(prioritizedTests).forEach(tests => {
      if (Array.isArray(tests)) {
        tests.forEach(test => {
          totalDuration += test.estimatedDuration || 0;
        });
      }
    });

    return totalDuration;
  }

  generateParallelGroups(phases) {
    const parallelGroups = [];

    phases.forEach(phase => {
      phase.groups.forEach(group => {
        if (group.executionStrategy === 'parallel' && group.tests.length > 1) {
          parallelGroups.push({
            phase: phase.name,
            tests: group.tests.map(t => t.path),
            maxConcurrency: group.concurrency,
            estimatedDuration: group.estimatedDuration
          });
        }
      });
    });

    return parallelGroups;
  }

  async predictTestOutcomes(executionPlan) {
    const predictions = {
      overallFailureRisk: 0,
      testPredictions: [],
      highRiskTests: [],
      confidenceScore: 0,
      modelAccuracy: this.learningModel?.statistics?.accuracy || 0
    };

    let totalRisk = 0;
    let testCount = 0;

    // Predict outcome for each test
    for (const phase of executionPlan.phases) {
      for (const group of phase.groups) {
        for (const test of group.tests) {
          const prediction = await this.predictTestOutcome(test);
          predictions.testPredictions.push(prediction);

          totalRisk += prediction.failureRisk;
          testCount++;

          if (prediction.failureRisk > 0.7) {
            predictions.highRiskTests.push({
              path: test.path,
              risk: prediction.failureRisk,
              confidence: prediction.confidence
            });
          }
        }
      }
    }

    predictions.overallFailureRisk = testCount > 0 ? totalRisk / testCount : 0;
    predictions.confidenceScore = this.calculatePredictionConfidence(predictions.testPredictions);

    return predictions;
  }

  async predictTestOutcome(test) {
    let failureRisk = 0.1; // Base risk
    let confidence = 0.5;

    // Historical failure rate
    const historicalRate = this.getHistoricalFailureRate(test.path);
    failureRisk += historicalRate * 0.4;
    confidence += 0.2;

    // Recent failure patterns
    if (this.recentlyFailed(test.path)) {
      failureRisk += 0.3;
      confidence += 0.1;
    }

    // Flaky test penalty
    if (test.flaky) {
      failureRisk += 0.2;
      confidence -= 0.1;
    }

    // Category-based risk
    const categoryRisk = this.options.testCategories[test.category].weight;
    failureRisk += categoryRisk * 0.1;

    // AI model prediction
    if (this.learningModel && this.learningModel.patterns.testFailurePatterns) {
      const testKey = this.getFilePatternKey(test.path);
      const pattern = this.learningModel.patterns.testFailurePatterns[testKey];
      if (pattern) {
        failureRisk += pattern.likelihood * 0.3;
        confidence += pattern.confidence * 0.2;
      }
    }

    // Change impact risk
    const changeImpact = this.calculateChangeImpactForTest(test);
    failureRisk += changeImpact * 0.2;

    return {
      path: test.path,
      category: test.category,
      failureRisk: Math.min(1.0, Math.max(0.0, failureRisk)),
      confidence: Math.min(1.0, Math.max(0.0, confidence)),
      likelyOutcome: failureRisk > 0.5 ? 'failure' : 'success',
      reasoning: this.generatePredictionReasoning(test, failureRisk, confidence)
    };
  }

  calculateChangeImpactForTest(test) {
    let impact = 0;

    for (const changedFile of this.currentChanges.files) {
      const proximity = this.calculateFileProximity(test.path, changedFile.path);
      impact += changedFile.impact * proximity;
    }

    return Math.min(1.0, impact / 10); // Normalize to 0-1
  }

  generatePredictionReasoning(test, failureRisk, confidence) {
    const reasons = [];

    if (this.getHistoricalFailureRate(test.path) > 0.5) {
      reasons.push('Historically high failure rate');
    }

    if (this.recentlyFailed(test.path)) {
      reasons.push('Recently failed');
    }

    if (test.flaky) {
      reasons.push('Known flaky test');
    }

    if (failureRisk > 0.7) {
      reasons.push('High change impact');
    }

    if (confidence > 0.8) {
      reasons.push('High prediction confidence');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'Standard risk assessment';
  }

  calculatePredictionConfidence(predictions) {
    if (predictions.length === 0) return 0;

    const totalConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0);
    return totalConfidence / predictions.length;
  }

  async handleFlakyTests(executionPlan) {
    const flakyTestHandling = {
      flakyTests: [],
      strategies: [],
      retryConfigurations: [],
      isolationNeeded: []
    };

    // Identify flaky tests in the execution plan
    for (const phase of executionPlan.phases) {
      for (const group of phase.groups) {
        for (const test of group.tests) {
          if (test.flaky) {
            flakyTestHandling.flakyTests.push(test);

            // Determine handling strategy
            const strategy = this.determineFlakyTestStrategy(test);
            flakyTestHandling.strategies.push({
              test: test.path,
              strategy: strategy.type,
              configuration: strategy.config
            });

            // Generate retry configuration
            const retryConfig = this.generateRetryConfiguration(test);
            flakyTestHandling.retryConfigurations.push(retryConfig);

            // Check if isolation is needed
            if (strategy.requiresIsolation) {
              flakyTestHandling.isolationNeeded.push(test.path);
            }
          }
        }
      }
    }

    return flakyTestHandling;
  }

  determineFlakyTestStrategy(test) {
    const failureRate = this.getHistoricalFailureRate(test.path);

    if (failureRate > 0.5) {
      return {
        type: 'quarantine',
        config: { maxRetries: 1, timeout: test.estimatedDuration * 2 },
        requiresIsolation: true
      };
    } else if (failureRate > 0.3) {
      return {
        type: 'enhanced-retry',
        config: { maxRetries: 3, backoff: 'exponential', timeout: test.estimatedDuration * 1.5 },
        requiresIsolation: false
      };
    } else {
      return {
        type: 'standard-retry',
        config: { maxRetries: 2, timeout: test.estimatedDuration * 1.2 },
        requiresIsolation: false
      };
    }
  }

  generateRetryConfiguration(test) {
    const failureRate = this.getHistoricalFailureRate(test.path);

    return {
      testPath: test.path,
      maxRetries: failureRate > 0.5 ? 1 : failureRate > 0.3 ? 3 : 2,
      retryDelay: this.calculateRetryDelay(failureRate),
      timeoutMultiplier: failureRate > 0.3 ? 2 : 1.5,
      isolationRequired: failureRate > 0.4
    };
  }

  calculateRetryDelay(failureRate) {
    if (failureRate > 0.5) {
      return { type: 'fixed', delay: 1000 };
    } else if (failureRate > 0.3) {
      return { type: 'exponential', baseDelay: 500, maxDelay: 5000 };
    } else {
      return { type: 'linear', delay: 200 };
    }
  }

  async generateExecutionRecommendations(executionPlan, predictions) {
    const recommendations = {
      execution: [],
      optimization: [],
      monitoring: [],
      risk: []
    };

    // Execution recommendations
    if (predictions.overallFailureRisk > 0.7) {
      recommendations.execution.push({
        type: 'warning',
        priority: 'high',
        title: 'High Failure Risk Detected',
        description: `Overall failure risk is ${(predictions.overallFailureRisk * 100).toFixed(1)}%`,
        actions: [
          'Consider running tests in smaller batches',
          'Monitor execution closely',
          'Have rollback plan ready'
        ]
      });
    }

    // Optimization recommendations
    if (executionPlan.optimizationSavings < 20) {
      recommendations.optimization.push({
        type: 'improvement',
        priority: 'medium',
        title: 'Low Optimization Savings',
        description: `Current optimization saves only ${executionPlan.optimizationSavings.toFixed(1)}% of execution time`,
        actions: [
          'Consider more aggressive test selection',
          'Increase parallel execution where possible',
          'Review test categorization'
        ]
      });
    }

    // Monitoring recommendations
    if (predictions.highRiskTests.length > 0) {
      recommendations.monitoring.push({
        type: 'alert',
        priority: 'high',
        title: 'High-Risk Tests Identified',
        description: `${predictions.highRiskTests.length} tests have high failure risk`,
        actions: [
          'Monitor these tests closely during execution',
          'Set up alerts for failures',
          'Consider running these tests first'
        ]
      });
    }

    // Risk recommendations
    const flakyTestCount = executionPlan.phases.reduce((count, phase) => {
      return count + phase.groups.reduce((groupCount, group) => {
        return groupCount + group.tests.filter(t => t.flaky).length;
      }, 0);
    }, 0);

    if (flakyTestCount > 0) {
      recommendations.risk.push({
        type: 'risk',
        priority: 'medium',
        title: 'Flaky Tests Detected',
        description: `${flakyTestCount} flaky tests may impact reliability`,
        actions: [
          'Review and fix flaky tests',
          'Implement proper isolation',
          'Consider test retries with backoff'
        ]
      });
    }

    return recommendations;
  }

  async saveIntelligenceData(executionPlan, predictions) {
    const intelligenceData = {
      timestamp: new Date().toISOString(),
      changes: this.currentChanges,
      executionPlan,
      predictions,
      learningUpdates: {}
    };

    // Save current analysis
    const analysisFile = path.join(
      this.options.intelligenceDir,
      'analysis',
      `analysis-${Date.now()}.json`
    );
    fs.writeFileSync(analysisFile, JSON.stringify(intelligenceData, null, 2));

    // Update learning model
    await this.updateLearningModel(intelligenceData);

    // Save updated model
    fs.writeFileSync(
      this.options.learningModelFile,
      JSON.stringify(this.learningModel, null, 2)
    );
  }

  async updateLearningModel(data) {
    if (!this.learningModel) {
      this.learningModel = this.createInitialLearningModel();
    }

    // Update file dependency patterns
    for (const file of data.changes.files) {
      const fileKey = this.getFilePatternKey(file.path);
      if (!this.learningModel.patterns.fileDependencies[fileKey]) {
        this.learningModel.patterns.fileDependencies[fileKey] = {
          dependencies: file.dependencies,
          impact: file.impact,
          frequency: 1
        };
      } else {
        this.learningModel.patterns.fileDependencies[fileKey].frequency++;
      }
    }

    // Update test failure patterns (will be updated after actual test execution)
    this.learningModel.patterns.testFailurePatterns = this.learningModel.patterns.testFailurePatterns || {};

    // Update model statistics
    this.learningModel.statistics.totalPredictions++;
    this.learningModel.lastUpdated = new Date().toISOString();
  }

  getTotalAvailableTests() {
    // This would scan for all available tests
    return 100; // Placeholder
  }

  // Method to be called after test execution to update the model
  async updateWithActualResults(testResults) {
    if (!this.learningModel) return;

    for (const result of testResults) {
      const testKey = this.getFilePatternKey(result.testPath);

      if (!this.learningModel.patterns.testFailurePatterns[testKey]) {
        this.learningModel.patterns.testFailurePatterns[testKey] = {
          likelihood: result.failed ? 0.5 : 0.1,
          confidence: 0.5,
          totalRuns: 1,
          failures: result.failed ? 1 : 0
        };
      } else {
        const pattern = this.learningModel.patterns.testFailurePatterns[testKey];
        pattern.totalRuns++;
        if (result.failed) {
          pattern.failures++;
        }

        // Update likelihood and confidence
        pattern.likelihood = pattern.failures / pattern.totalRuns;
        pattern.confidence = Math.min(1.0, pattern.totalRuns / 10); // Increase confidence with more data
      }

      // Update flaky tests list
      const failureRate = this.learningModel.patterns.testFailurePatterns[testKey].likelihood;
      if (failureRate >= this.options.flakinessThreshold) {
        this.flakyTests.add(result.testPath);
      } else {
        this.flakyTests.delete(result.testPath);
      }
    }

    // Update accuracy statistics
    this.learningModel.statistics.accuratePredictions = this.calculateModelAccuracy();
    this.learningModel.statistics.accuracy =
      this.learningModel.statistics.accuratePredictions / this.learningModel.statistics.totalPredictions;

    // Save updated model
    fs.writeFileSync(
      this.options.learningModelFile,
      JSON.stringify(this.learningModel, null, 2)
    );

    // Save flaky tests
    fs.writeFileSync(
      this.options.flakyTestsFile,
      JSON.stringify({ flakyTests: Array.from(this.flakyTests) }, null, 2)
    );
  }

  calculateModelAccuracy() {
    // This would compare predictions with actual results
    // For now, return a mock accuracy
    return this.learningModel.statistics.totalPredictions * 0.8;
  }
}

// CLI interface
if (require.main === module) {
  const options = {
    maxConcurrency: parseInt(process.argv[2]) || 4,
    dryRun: process.argv.includes('--dry-run'),
    outputFile: process.argv.includes('--output') ? process.argv[process.argv.indexOf('--output') + 1] : null
  };

  const testSelection = new IntelligentTestSelection(options);

  testSelection.runIntelligentTestSelection()
    .then((results) => {
      console.log('\n✅ Intelligent test selection completed!');

      console.log(`\n📊 Selection Summary:`);
      console.log(`   Selected ${results.selectedTests.total} tests`);
      console.log(`   Selection ratio: ${(results.selectionRatio * 100).toFixed(1)}%`);
      console.log(`   Estimated duration: ${(results.executionPlan.estimatedDuration / 1000).toFixed(1)}s`);
      console.log(`   Optimization savings: ${results.executionPlan.optimizationSavings.toFixed(1)}%`);

      if (results.predictions.highRiskTests.length > 0) {
        console.log(`\n⚠️  High-risk tests: ${results.predictions.highRiskTests.length}`);
        results.predictions.highRiskTests.forEach(test => {
          console.log(`   - ${test.path} (${(test.risk * 100).toFixed(1)}% risk)`);
        });
      }

      if (options.outputFile) {
        fs.writeFileSync(options.outputFile, JSON.stringify(results, null, 2));
        console.log(`\n💾 Results saved to: ${options.outputFile}`);
      }

      if (!options.dryRun) {
        console.log('\n🚀 Ready to execute optimized test plan!');
        process.exit(0);
      } else {
        console.log('\n🔍 Dry run completed - no tests executed');
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error('\n❌ Intelligent test selection failed:', error);
      process.exit(1);
    });
}

module.exports = IntelligentTestSelection;