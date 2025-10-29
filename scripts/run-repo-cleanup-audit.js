#!/usr/bin/env node

/**
 * Repository Cleanup Audit Script
 *
 * This script orchestrates multiple agents to perform a comprehensive
 * repository audit and cleanup opportunity identification.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Audit phases configuration
const AUDIT_PHASES = [
  {
    name: 'Frontend Code Audit',
    path: 'src/',
    focus: 'React components, hooks, services, types, and unused frontend code',
    agent: 'frontend-auditor'
  },
  {
    name: 'Backend Code Audit',
    path: 'supabase/',
    focus: 'Database migrations, functions, RLS policies, and SQL optimizations',
    agent: 'backend-auditor'
  },
  {
    name: 'Configuration Audit',
    path: '',
    focus: 'package.json, build configs, tooling, and dependency management',
    agent: 'config-auditor'
  },
  {
    name: 'Documentation Audit',
    path: 'docs/',
    focus: 'Outdated docs, missing documentation, and API specs',
    agent: 'docs-auditor'
  },
  {
    name: 'Assets Audit',
    path: 'public/',
    focus: 'Unused images, unoptimized assets, and media cleanup',
    agent: 'assets-auditor'
  },
  {
    name: 'Testing Audit',
    path: 'src/test/',
    focus: 'Test coverage, broken tests, and test organization',
    agent: 'test-auditor'
  }
];

// Cleanup categories to check
const CLEANUP_CATEGORIES = {
  DEAD_CODE: {
    patterns: [
      /import.*from.*['"].*['"].*\/\/ unused/i,
      /\/\/ TODO: remove/i,
      /\/\/ DEPRECATED:/i,
      /\/\*.*DEPRECATED.*\*\//i
    ],
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx']
  },
  DUPLICATE_CODE: {
    patterns: [
      // Similar component structures
      // Similar API patterns
      // Repeated utility functions
    ],
    files: ['src/components/**/*', 'src/services/**/*', 'src/utils/**/*']
  },
  REFACTORING_OPPORTUNITIES: {
    checks: ['largeComponents', 'complexHooks', 'nestedTernary', 'magicNumbers'],
    files: ['src/**/*.{ts,tsx}']
  },
  CONSOLIDATION_OPPORTUNITIES: {
    patterns: ['Form', 'Modal', 'Card', 'fetch', 'validate', 'error'],
    files: ['src/components/**/*', 'src/services/**/*']
  },
  UNUSED_DEPENDENCIES: {
    check: 'package',
    files: ['package.json', 'package-lock.json']
  },
  SECURITY_ISSUES: {
    patterns: [
      /API_KEY.*=.*['"][^'"]*['"]/i,
      /PASSWORD.*=.*['"][^'"]*['"]/i,
      /SECRET.*=.*['"][^'"]*['"]/i,
      /process\.env\./i
    ],
    files: ['**/*.{ts,tsx,js,jsx,json,env}']
  },
  PERFORMANCE_ISSUES: {
    patterns: [
      /useEffect.*\[\],/i, // Missing dependencies
      /useState.*<.*>/i, // Potential for expensive initialization
      /\.map\(/i, // Potential for performance issues
    ],
    files: ['src/**/*.{ts,tsx}']
  }
};

function logPhase(phase) {
  console.log(`\n🔍 Starting ${phase.name}...`);
  console.log(`📍 Focus: ${phase.focus}`);
  console.log(`📂 Path: ${phase.path || 'root'}`);
}

function generateAuditReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalIssues: 0,
      byCategory: {},
      byPriority: {
        high: 0,
        medium: 0,
        low: 0
      }
    },
    findings: results,
    recommendations: []
  };

  // Count issues
  results.forEach(result => {
    report.summary.totalIssues += result.issues.length;
    result.issues.forEach(issue => {
      report.summary.byCategory[issue.category] =
        (report.summary.byCategory[issue.category] || 0) + 1;
      report.summary.byPriority[issue.priority] =
        (report.summary.byPriority[issue.priority] || 0) + 1;
    });
  });

  // Generate recommendations
  report.recommendations = generateRecommendations(report);

  return report;
}

function generateRecommendations(report) {
  const recommendations = [];

  // Quick wins (high impact, low effort)
  recommendations.push({
    priority: 'HIGH',
    title: 'Remove Dead Code First',
    description: 'Start with removing clearly unused code to reduce complexity',
    effort: 'LOW',
    impact: 'HIGH'
  });

  if (report.summary.byCategory['UNUSED_DEPENDENCIES'] > 0) {
    recommendations.push({
      priority: 'HIGH',
      title: 'Update Dependencies',
      description: 'Update or remove unused/outdated dependencies for security',
      effort: 'MEDIUM',
      impact: 'HIGH'
    });
  }

  if (report.summary.byCategory['SECURITY_ISSUES'] > 0) {
    recommendations.push({
      priority: 'CRITICAL',
      title: 'Fix Security Issues',
      description: 'Address all security vulnerabilities immediately',
      effort: 'VARIES',
      impact: 'CRITICAL'
    });
  }

  return recommendations;
}

function createTodoList(report) {
  let todoList = `# Repository Cleanup Todo List\n\n`;
  todoList += `Generated on: ${new Date().toLocaleDateString()}\n`;
  todoList += `Total Issues Found: ${report.summary.totalIssues}\n\n`;

  // Group by category
  const categories = {};
  report.findings.forEach(phase => {
    phase.issues.forEach(issue => {
      if (!categories[issue.category]) {
        categories[issue.category] = [];
      }
      categories[issue.category].push(issue);
    });
  });

  // Generate todo sections
  Object.entries(categories).forEach(([category, issues]) => {
    const emoji = getCategoryEmoji(category);
    todoList += `### ${emoji} ${category.replace(/_/g, ' ').toUpperCase()}\n\n`;

    issues.sort((a, b) => {
      const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    issues.forEach(issue => {
      const priority = issue.priority === 'HIGH' ? '🔴' :
                      issue.priority === 'MEDIUM' ? '🟡' : '🟢';
      todoList += `- [${priority}] ${issue.description}\n`;
      todoList += `  📍 Location: \`${issue.file}${issue.line ? ':' + issue.line : ''}\`\n`;
      todoList += `  ⚡ Effort: ${issue.effort} | 🎯 Impact: ${issue.impact}\n\n`;
    });
  });

  // Add recommendations
  todoList += `## 📋 Recommendations\n\n`;
  report.recommendations.forEach(rec => {
    const priority = rec.priority === 'CRITICAL' ? '🚨' :
                    rec.priority === 'HIGH' ? '🔴' :
                    rec.priority === 'MEDIUM' ? '🟡' : '🟢';
    todoList += `### ${priority} ${rec.title}\n`;
    todoList += `${rec.description}\n`;
    todoList += `**Effort:** ${rec.effort} | **Impact:** ${rec.impact}\n\n`;
  });

  return todoList;
}

function getCategoryEmoji(category) {
  const emojis = {
    DEAD_CODE: '🗑️',
    DUPLICATE_CODE: '🔄',
    UNUSED_DEPENDENCIES: '📦',
    SECURITY_ISSUES: '🔒',
    PERFORMANCE_ISSUES: '⚡',
    DOCUMENTATION: '📚',
    ORGANIZATION: '📁',
    TESTING: '🧪',
    BUILD: '🔧',
    ASSETS: '🖼️'
  };
  return emojis[category] || '📝';
}

async function runAudit() {
  console.log('🚀 Starting Repository Cleanup Audit\n');
  console.log('This audit will analyze the entire codebase for cleanup opportunities.\n');

  const results = [];

  // Run each phase
  for (const phase of AUDIT_PHASES) {
    logPhase(phase);

    // Here you would invoke Claude Code agents
    // For now, we'll simulate the process
    const phaseResult = {
      phase: phase.name,
      path: phase.path,
      issues: [
        // Simulated findings
        // In real implementation, this would come from agent analysis
      ]
    };

    // Run actual analysis commands
    try {
      if (phase.path === 'src/') {
        // Check for unused imports in TypeScript files
        const unusedImports = execSync(
          `grep -r "import.*from.*'react'" ${phase.path} --include="*.tsx" --include="*.ts" | head -20`,
          { encoding: 'utf8' }
        );
        console.log('Found TypeScript files to analyze');
      }

      if (phase.path === '') {
        // Check package.json for unused dependencies
        if (fs.existsSync('package.json')) {
          const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
          console.log(`Found ${Object.keys(pkg.dependencies || {}).length} dependencies`);
          console.log(`Found ${Object.keys(pkg.devDependencies || {}).length} dev dependencies`);
        }
      }

      // Check for large files
      const largeFiles = execSync(
        `find . -type f -size +1M -not -path "./node_modules/*" -not -path "./.git/*" | head -10`,
        { encoding: 'utf8' }
      );
      if (largeFiles.trim()) {
        console.log('Found large files that might need optimization:');
        largeFiles.split('\n').forEach(file => {
          if (file.trim()) console.log(`  - ${file}`);
        });
      }

    } catch (error) {
      console.log(`Note: ${error.message}`);
    }

    results.push(phaseResult);
    console.log('✅ Phase complete\n');
  }

  // Generate report
  const report = generateAuditReport(results);

  // Save todo list
  const todoList = createTodoList(report);
  fs.writeFileSync('REPOSITORY_CLEANUP_TODO.md', todoList);

  // Save detailed report
  fs.writeFileSync('cleanup-audit-report.json', JSON.stringify(report, null, 2));

  console.log('\n✨ Audit Complete!\n');
  console.log(`📝 Todo list created: REPOSITORY_CLEANUP_TODO.md`);
  console.log(`📊 Detailed report: cleanup-audit-report.json`);
  console.log(`\n🎯 Found ${report.summary.totalIssues} issues to address`);
  console.log('\nStart with the high-priority items marked with 🔴');
}

// Additional helper functions for actual implementation

function findUnusedFiles() {
  const commonUnusedPatterns = [
    'src/components/**/*test*',
    'src/**/*.old.*',
    'src/**/*.backup.*',
    'src/**/*.deprecated.*',
    'src/**/*.tmp.*'
  ];

  return commonUnusedPatterns;
}

function checkDependencies() {
  // Check for:
  // - Unused dependencies
  // - Outdated packages
  // - Security vulnerabilities
  // - Duplicate dependencies
}

function analyzeCodeComplexity() {
  // Check for:
  // - Large functions (>50 lines)
  // - Deeply nested code
  // - Complex components
  // - Too many parameters
}

function checkDatabaseOptimization() {
  // Check for:
  // - Missing indexes
  // - Slow queries
  // - Unused tables
  // - Redundant migrations
}

function findRefactoringOpportunities() {
  const issues = [];

  // Find large components
  try {
    const largeFiles = execSync(
      'find src -name "*.tsx" -exec wc -l {} + | awk "$1 > 300 {print $2, $1}"',
      { encoding: 'utf8' }
    );
    largeFiles.split('\n').forEach(line => {
      if (line.trim()) {
        const [file, lines] = line.split(' ');
        issues.push({
          category: 'REFACTORING_OPPORTUNITIES',
          type: 'LARGE_COMPONENT',
          file,
          description: `Component with ${lines} lines (threshold: 300)`,
          priority: 'HIGH',
          effort: 'MEDIUM'
        });
      }
    });
  } catch (e) {
    // Continue if no large files found
  }

  // Find nested ternary operators
  try {
    const nestedTernaries = execSync(
      'grep -r "\\?[^:]*\\?[^:]*:" src --include="*.tsx" --include="*.ts" | head -20',
      { encoding: 'utf8' }
    );
    nestedTernaries.split('\n').forEach(line => {
      if (line.trim()) {
        const [file] = line.split(':');
        issues.push({
          category: 'REFACTORING_OPPORTUNITIES',
          type: 'NESTED_TERNARY',
          file,
          description: 'Nested ternary operator found',
          priority: 'MEDIUM',
          effort: 'LOW'
        });
      }
    });
  } catch (e) {
    // Continue if no nested ternaries found
  }

  return issues;
}

function findConsolidationOpportunities() {
  const issues = [];
  const patterns = ['Form', 'Modal', 'Card', 'List', 'Table'];

  patterns.forEach(pattern => {
    try {
      const similarComponents = execSync(
        `find src/components -name "*${pattern}*.tsx" | head -10`,
        { encoding: 'utf8' }
      );
      const files = similarComponents.split('\n').filter(f => f.trim());
      if (files.length > 3) {
        issues.push({
          category: 'CONSOLIDATION_OPPORTUNITIES',
          type: 'SIMILAR_COMPONENTS',
          files,
          description: `${files.length} ${pattern} components that could potentially be unified`,
          priority: 'MEDIUM',
          effort: 'HIGH'
        });
      }
    } catch (e) {
      // Continue if pattern not found
    }
  });

  return issues;
}

if (require.main === module) {
  runAudit().catch(console.error);
}

module.exports = {
  runAudit,
  generateAuditReport,
  createTodoList
};