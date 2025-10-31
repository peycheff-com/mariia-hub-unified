#!/usr/bin/env node

/**
 * Calculate Accessibility Score
 *
 * This script analyzes accessibility test results from multiple tools
 * and calculates a comprehensive accessibility score.
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  axeResults: null,
  pa11yResults: null,
  threshold: 85,
  output: null
};

for (let i = 0; i < args.length; i += 2) {
  const flag = args[i];
  const value = args[i + 1];

  switch (flag) {
    case '--axe-results':
      options.axeResults = value;
      break;
    case '--pa11y-results':
      options.pa11yResults = value;
      break;
    case '--threshold':
      options.threshold = parseInt(value);
      break;
    case '--output':
      options.output = value;
      break;
  }
}

// Scoring weights for different violation levels
const VIOLATION_WEIGHTS = {
  critical: 25,
  serious: 15,
  moderate: 8,
  minor: 3
};

// Maximum score deduction categories
const MAX_DEDUCTIONS = {
  colorContrast: 20,
  keyboardNavigation: 15,
  screenReader: 20,
  focusManagement: 10,
  forms: 15,
  images: 10,
  structure: 10
};

/**
 * Calculate score from axe violations
 */
function calculateAxeScore(violations) {
  let deductions = 0;
  const categoryDeductions = {};

  violations.forEach(violation => {
    const weight = VIOLATION_WEIGHTS[violation.impact] || VIOLATION_WEIGHTS.minor;
    deductions += weight;

    // Track deductions by category
    const category = categorizeViolation(violation.id);
    categoryDeductions[category] = (categoryDeductions[category] || 0) + weight;
  });

  // Cap deductions per category
  Object.keys(categoryDeductions).forEach(category => {
    const maxDeduction = MAX_DEDUCTIONS[category] || 10;
    if (categoryDeductions[category] > maxDeduction) {
      deductions -= (categoryDeductions[category] - maxDeduction);
    }
  });

  return Math.max(0, 100 - deductions);
}

/**
 * Categorize violations by type
 */
function categorizeViolation(violationId) {
  const categories = {
    colorContrast: ['color-contrast', 'color-contrast-enhanced'],
    keyboardNavigation: ['keyboard', 'tabindex', 'focus-trap'],
    screenReader: ['aria-labels', 'aria-input-field-name', 'aria-valid-attr-value', 'button-name', 'link-name', 'label-title-only'],
    focusManagement: ['focus-order-semantics', 'focus-management'],
    forms: ['label', 'form-field-multiple-labels', 'select-name', 'textarea-maxlength', 'input-button-name'],
    images: ['image-alt', 'image-redundant-alt', 'alt-text'],
    structure: ['heading-order', 'landmark-one-main', 'landmark-no-duplicate-banner', 'landmark-no-duplicate-contentinfo', 'region']
  };

  for (const [category, ids] of Object.entries(categories)) {
    if (ids.some(id => violationId.includes(id))) {
      return category;
    }
  }

  return 'other';
}

/**
 * Calculate score from Pa11y results
 */
function calculatePa11yScore(results) {
  if (!results || !results.results || !Array.isArray(results.results)) {
    return 100;
  }

  let totalViolations = 0;
  let criticalViolations = 0;

  results.results.forEach(result => {
    totalViolations += result.issues.length || 0;

    // Count critical violations (type 1 in Pa11y)
    const criticalIssues = result.issues.filter(issue => issue.type === 1);
    criticalViolations += criticalIssues.length;
  });

  // Deduct points based on violations
  let deductions = 0;
  deductions += criticalViolations * 20; // Heavy penalty for critical violations
  deductions += (totalViolations - criticalViolations) * 5; // Lighter penalty for other violations

  return Math.max(0, 100 - deductions);
}

/**
 * Combine scores from different tools
 */
function combineScores(axeScore, pa11yScore) {
  // Weight axe-core more heavily as it's more comprehensive
  const weights = {
    axe: 0.7,
    pa11y: 0.3
  };

  return Math.round(axeScore * weights.axe + pa11yScore * weights.pa11y);
}

/**
 * Generate detailed score breakdown
 */
function generateScoreBreakdown(axeData, pa11yData, finalScore) {
  const breakdown = {
    finalScore,
    componentScores: {
      axe: axeData.score,
      pa11y: pa11yData.score
    },
    violations: {
      total: axeData.violations.length + (pa11yData.totalViolations || 0),
      critical: axeData.criticalCount + (pa11yData.criticalViolations || 0),
      serious: axeData.seriousCount,
      moderate: axeData.moderateCount,
      minor: axeData.minorCount
    },
    categoryBreakdown: {},
    recommendations: []
  };

  // Analyze violations by category
  const categoryCounts = {};
  axeData.violations.forEach(violation => {
    const category = categorizeViolation(violation.id);
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  breakdown.categoryBreakdown = categoryCounts;

  // Generate recommendations
  if (breakdown.violations.critical > 0) {
    breakdown.recommendations.push('Fix all critical accessibility violations immediately');
  }

  if (finalScore < 90) {
    breakdown.recommendations.push('Address high-impact violations to improve overall score');
  }

  if (categoryCounts.colorContrast > 0) {
    breakdown.recommendations.push('Improve color contrast ratios for better readability');
  }

  if (categoryCounts.keyboardNavigation > 0) {
    breakdown.recommendations.push('Enhance keyboard navigation and focus management');
  }

  if (categoryCounts.screenReader > 0) {
    breakdown.recommendations.push('Improve ARIA implementation and semantic markup');
  }

  return breakdown;
}

/**
 * Main execution
 */
function main() {
  try {
    let axeData = { violations: [], score: 100, criticalCount: 0, seriousCount: 0, moderateCount: 0, minorCount: 0 };
    let pa11yData = { score: 100, totalViolations: 0, criticalViolations: 0 };

    // Load axe results
    if (options.axeResults && fs.existsSync(options.axeResults)) {
      const axeResults = JSON.parse(fs.readFileSync(options.axeResults, 'utf8'));
      axeData.violations = axeResults.violations || [];
      axeData.criticalCount = axeData.violations.filter(v => v.impact === 'critical').length;
      axeData.seriousCount = axeData.violations.filter(v => v.impact === 'serious').length;
      axeData.moderateCount = axeData.violations.filter(v => v.impact === 'moderate').length;
      axeData.minorCount = axeData.violations.filter(v => v.impact === 'minor').length;
      axeData.score = calculateAxeScore(axeData.violations);
    }

    // Load Pa11y results
    if (options.pa11yResults && fs.existsSync(options.pa11yResults)) {
      const pa11yResults = JSON.parse(fs.readFileSync(options.pa11yResults, 'utf8'));
      pa11yData.totalViolations = pa11yResults.results ? pa11yResults.results.reduce((total, result) => total + (result.issues?.length || 0), 0) : 0;
      pa11yData.criticalViolations = pa11yResults.results ? pa11yResults.results.reduce((total, result) => {
        const criticalIssues = result.issues?.filter(issue => issue.type === 1) || [];
        return total + criticalIssues.length;
      }, 0) : 0;
      pa11yData.score = calculatePa11yScore(pa11yResults);
    }

    // Calculate final score
    const finalScore = combineScores(axeData.score, pa11yData.score);

    // Generate detailed breakdown
    const breakdown = generateScoreBreakdown(axeData, pa11yData, finalScore);

    // Output results
    const result = {
      timestamp: new Date().toISOString(),
      score: finalScore,
      threshold: options.threshold,
      passesThreshold: finalScore >= options.threshold,
      breakdown,
      raw: {
        axe: axeData,
        pa11y: pa11yData
      }
    };

    // Save to output file if specified
    if (options.output) {
      fs.writeFileSync(options.output, JSON.stringify(result, null, 2));
      console.log(`Accessibility score saved to ${options.output}`);
    }

    // Console output
    console.log(`\n🎯 Accessibility Score: ${finalScore}/100`);
    console.log(`📊 Threshold: ${options.threshold}`);
    console.log(result.passesThreshold ? '✅ PASSES threshold' : '❌ FAILS threshold');

    console.log('\n📈 Component Scores:');
    console.log(`  Axe Core: ${axeData.score}/100`);
    console.log(`  Pa11y: ${pa11yData.score}/100`);

    console.log('\n🔍 Violation Summary:');
    console.log(`  Total: ${breakdown.violations.total}`);
    console.log(`  Critical: ${breakdown.violations.critical}`);
    console.log(`  Serious: ${breakdown.violations.serious}`);
    console.log(`  Moderate: ${breakdown.violations.moderate}`);
    console.log(`  Minor: ${breakdown.violations.minor}`);

    if (Object.keys(breakdown.categoryBreakdown).length > 0) {
      console.log('\n📂 Violations by Category:');
      Object.entries(breakdown.categoryBreakdown).forEach(([category, count]) => {
        console.log(`  ${category}: ${count}`);
      });
    }

    if (breakdown.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      breakdown.recommendations.forEach(rec => console.log(`  • ${rec}`));
    }

    // Exit with appropriate code
    process.exit(result.passesThreshold ? 0 : 1);

  } catch (error) {
    console.error('Error calculating accessibility score:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { calculateAxeScore, calculatePa11yScore, combineScores, categorizeViolation };