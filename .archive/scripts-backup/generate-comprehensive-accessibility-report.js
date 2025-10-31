#!/usr/bin/env node

/**
 * Generate Comprehensive Accessibility Report
 *
 * This script combines results from multiple accessibility testing tools
 * and generates a comprehensive HTML report with detailed analysis.
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  artifactsDir: './',
  viewport: 'all',
  output: 'comprehensive-accessibility-report.html',
  jsonOutput: 'comprehensive-accessibility-report.json'
};

for (let i = 0; i < args.length; i += 2) {
  const flag = args[i];
  const value = args[i + 1];

  switch (flag) {
    case '--artifacts-dir':
      options.artifactsDir = value;
      break;
    case '--viewport':
      options.viewport = value;
      break;
    case '--output':
      options.output = value;
      break;
    case '--json-output':
      options.jsonOutput = value;
      break;
  }
}

/**
 * Load and parse JSON file
 */
function loadJsonFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return null;
  } catch (error) {
    console.warn(`Warning: Could not load ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Collect all accessibility test results
 */
function collectResults() {
  const results = {
    axe: {},
    playwright: {},
    pa11y: {},
    lighthouse: {},
    contrast: {},
    scores: {}
  };

  // Load results for each viewport
  const viewports = options.viewport === 'all'
    ? ['mobile', 'tablet', 'desktop']
    : [options.viewport];

  viewports.forEach(viewport => {
    // Axe results
    const axeFile = path.join(options.artifactsDir, `axe-results-${viewport}.json`);
    results.axe[viewport] = loadJsonFile(axeFile);

    // Playwright results
    const playwrightFile = path.join(options.artifactsDir, `test-results/accessibility-${viewport}.json`);
    results.playwright[viewport] = loadJsonFile(playwrightFile);

    // Pa11y results
    const pa11yDir = path.join(options.artifactsDir, '.pa11yci');
    if (fs.existsSync(pa11yDir)) {
      const pa11yFile = path.join(pa11yDir, 'report.json');
      results.pa11y[viewport] = loadJsonFile(pa11yFile);
    }

    // Lighthouse results
    const lighthouseDir = path.join(options.artifactsDir, '.lighthouseci');
    if (fs.existsSync(lighthouseDir)) {
      const lighthouseFiles = fs.readdirSync(lighthouseDir).filter(f => f.endsWith('.json'));
      if (lighthouseFiles.length > 0) {
        const lighthouseFile = path.join(lighthouseDir, lighthouseFiles[0]);
        results.lighthouse[viewport] = loadJsonFile(lighthouseFile);
      }
    }

    // Contrast analysis results
    const contrastFile = path.join(options.artifactsDir, `contrast-analysis-${viewport}.json`);
    results.contrast[viewport] = loadJsonFile(contrastFile);

    // Score results
    const scoreFile = path.join(options.artifactsDir, `score-${viewport}.json`);
    results.scores[viewport] = loadJsonFile(scoreFile);
  });

  return results;
}

/**
 * Analyze results and generate insights
 */
function analyzeResults(results) {
  const analysis = {
    overallScore: 0,
    scoresByViewport: {},
    violationsByCategory: {},
    topIssues: [],
    trends: {},
    compliance: {
      wcagLevelA: true,
      wcagLevelAA: true,
      wcagLevelAAA: false
    },
    recommendations: []
  };

  let totalScore = 0;
  let viewportCount = 0;

  Object.keys(results.axe).forEach(viewport => {
    const axeData = results.axe[viewport];
    const scoreData = results.scores[viewport];

    if (axeData && scoreData) {
      const viewportScore = scoreData.score || 0;
      analysis.scoresByViewport[viewport] = {
        score: viewportScore,
        violations: {
          total: axeData.violations?.length || 0,
          critical: axeData.violations?.filter(v => v.impact === 'critical').length || 0,
          serious: axeData.violations?.filter(v => v.impact === 'serious').length || 0,
          moderate: axeData.violations?.filter(v => v.impact === 'moderate').length || 0,
          minor: axeData.violations?.filter(v => v.impact === 'minor').length || 0
        }
      };

      totalScore += viewportScore;
      viewportCount++;

      // Analyze violations by category
      if (axeData.violations) {
        axeData.violations.forEach(violation => {
          const category = categorizeViolation(violation.id);
          analysis.violationsByCategory[category] = (analysis.violationsByCategory[category] || 0) + 1;
        });
      }
    }
  });

  analysis.overallScore = viewportCount > 0 ? Math.round(totalScore / viewportCount) : 0;

  // Generate top issues
  analysis.topIssues = generateTopIssues(results.axe);

  // Check WCAG compliance
  analysis.compliance = checkWCAGCompliance(results.axe);

  // Generate recommendations
  analysis.recommendations = generateRecommendations(analysis);

  return analysis;
}

/**
 * Categorize violations
 */
function categorizeViolation(violationId) {
  const categories = {
    'Color Contrast': ['color-contrast', 'color-contrast-enhanced'],
    'Keyboard Navigation': ['keyboard', 'tabindex', 'focus-trap'],
    'Screen Reader Support': ['aria-labels', 'aria-input-field-name', 'button-name', 'link-name'],
    'Focus Management': ['focus-order-semantics', 'focus-management'],
    'Form Accessibility': ['label', 'form-field-multiple-labels'],
    'Image Accessibility': ['image-alt', 'alt-text'],
    'Document Structure': ['heading-order', 'landmark-one-main'],
    'Touch Targets': ['target-size'],
    'Motion & Animation': ['motion', 'animation'],
    'Other': []
  };

  for (const [category, ids] of Object.entries(categories)) {
    if (ids.some(id => violationId.includes(id))) {
      return category;
    }
  }

  return 'Other';
}

/**
 * Generate top issues list
 */
function generateTopIssues(axeResults) {
  const issueCounts = {};
  const issueDetails = {};

  Object.values(axeResults).forEach(data => {
    if (data && data.violations) {
      data.violations.forEach(violation => {
        const key = `${violation.id}: ${violation.description}`;
        issueCounts[key] = (issueCounts[key] || 0) + 1;

        if (!issueDetails[key]) {
          issueDetails[key] = {
            id: violation.id,
            description: violation.description,
            impact: violation.impact,
            helpUrl: violation.helpUrl,
            category: categorizeViolation(violation.id)
          };
        }
      });
    }
  });

  return Object.entries(issueCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([key, count]) => ({
      ...issueDetails[key],
      count,
      severity: issueDetails[key].impact
    }));
}

/**
 * Check WCAG compliance
 */
function checkWCAGCompliance(axeResults) {
  let hasLevelAViolations = false;
  let hasLevelAAViolations = false;

  Object.values(axeResults).forEach(data => {
    if (data && data.violations) {
      data.violations.forEach(violation => {
        if (violation.tags) {
          if (violation.tags.includes('wcag2a')) {
            hasLevelAViolations = true;
          }
          if (violation.tags.includes('wcag2aa')) {
            hasLevelAAViolations = true;
          }
        }
      });
    }
  });

  return {
    levelA: !hasLevelAViolations,
    levelAA: !hasLevelAAViolations,
    levelAAA: false // Assume not tested for AAA
  };
}

/**
 * Generate recommendations
 */
function generateRecommendations(analysis) {
  const recommendations = [];

  if (analysis.overallScore < 90) {
    recommendations.push({
      priority: 'high',
      category: 'Overall',
      title: 'Improve Overall Accessibility Score',
      description: 'Focus on addressing high-impact violations to improve the overall accessibility score.'
    });
  }

  if (analysis.violationsByCategory['Color Contrast'] > 0) {
    recommendations.push({
      priority: 'high',
      category: 'Color Contrast',
      title: 'Fix Color Contrast Issues',
      description: `${analysis.violationsByCategory['Color Contrast']} color contrast violations found. Ensure text meets WCAG AA contrast ratios.`
    });
  }

  if (analysis.violationsByCategory['Keyboard Navigation'] > 0) {
    recommendations.push({
      priority: 'high',
      category: 'Keyboard Navigation',
      title: 'Enhance Keyboard Navigation',
      description: `${analysis.violationsByCategory['Keyboard Navigation']} keyboard navigation issues found. Ensure all interactive elements are keyboard accessible.`
    });
  }

  if (analysis.violationsByCategory['Screen Reader Support'] > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'Screen Reader Support',
      title: 'Improve ARIA Implementation',
      description: `${analysis.violationsByCategory['Screen Reader Support']} ARIA-related violations found. Improve semantic markup and ARIA attributes.`
    });
  }

  if (analysis.violationsByCategory['Form Accessibility'] > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'Form Accessibility',
      title: 'Fix Form Labeling Issues',
      description: `${analysis.violationsByCategory['Form Accessibility']} form accessibility violations found. Ensure all form inputs have proper labels.`
    });
  }

  if (analysis.violationsByCategory['Image Accessibility'] > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'Image Accessibility',
      title: 'Add Alternative Text',
      description: `${analysis.violationsByCategory['Image Accessibility']} image accessibility violations found. Add descriptive alt text to images.`
    });
  }

  return recommendations;
}

/**
 * Generate HTML report
 */
function generateHTMLReport(analysis, results) {
  const timestamp = new Date().toISOString();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mariia Hub - Accessibility Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }

        .header {
            background: linear-gradient(135deg, #8B4513 0%, #F5DEB3 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .score-display {
            font-size: 48px;
            font-weight: bold;
            margin: 20px 0;
        }

        .score-high { color: #28a745; }
        .score-medium { color: #ffc107; }
        .score-low { color: #dc3545; }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .card h3 {
            margin-top: 0;
            color: #8B4513;
        }

        .violations-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        .violations-table th,
        .violations-table td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }

        .violations-table th {
            background-color: #f8f9fa;
            font-weight: 600;
        }

        .priority-high { border-left: 4px solid #dc3545; }
        .priority-medium { border-left: 4px solid #ffc107; }
        .priority-low { border-left: 4px solid #28a745; }

        .compliance-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            margin-right: 5px;
        }

        .compliant { background-color: #d4edda; color: #155724; }
        .non-compliant { background-color: #f8d7da; color: #721c24; }

        .chart {
            height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f8f9fa;
            border-radius: 4px;
            margin: 20px 0;
        }

        .summary-metric {
            text-align: center;
            padding: 15px;
        }

        .summary-metric .value {
            font-size: 24px;
            font-weight: bold;
            color: #8B4513;
        }

        .summary-metric .label {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }

        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <header class="header">
        <h1>🎯 Mariia Hub Accessibility Report</h1>
        <p>Generated on ${new Date(timestamp).toLocaleString()}</p>
        <div class="score-display ${getScoreClass(analysis.overallScore)}">
            ${analysis.overallScore}/100
        </div>
        <p>${getScoreDescription(analysis.overallScore)}</p>
    </header>

    <div class="grid">
        <div class="card">
            <h3>📊 Compliance Status</h3>
            <div style="margin: 20px 0;">
                <span class="compliance-badge ${analysis.compliance.levelA ? 'compliant' : 'non-compliant'}">
                    WCAG 2.1 Level A: ${analysis.compliance.levelA ? 'Compliant' : 'Non-Compliant'}
                </span>
                <span class="compliance-badge ${analysis.compliance.levelAA ? 'compliant' : 'non-compliant'}">
                    WCAG 2.1 Level AA: ${analysis.compliance.levelAA ? 'Compliant' : 'Non-Compliant'}
                </span>
                <span class="compliance-badge ${analysis.compliance.levelAAA ? 'compliant' : 'non-compliant'}">
                    WCAG 2.1 Level AAA: ${analysis.compliance.levelAAA ? 'Compliant' : 'Non-Compliant'}
                </span>
            </div>
        </div>

        <div class="card">
            <h3>📈 Scores by Viewport</h3>
            ${Object.entries(analysis.scoresByViewport).map(([viewport, data]) => `
                <div class="summary-metric">
                    <div class="value">${data.score}/100</div>
                    <div class="label">${viewport.charAt(0).toUpperCase() + viewport.slice(1)}</div>
                    <div style="font-size: 12px; color: #666; margin-top: 5px;">
                        ${data.violations.total} violations (${data.violations.critical} critical)
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="card">
            <h3>🔍 Violations Summary</h3>
            <table class="violations-table">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Count</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(analysis.violationsByCategory).map(([category, count]) => `
                        <tr>
                            <td>${category}</td>
                            <td>${count}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>

    <div class="card">
        <h3>⚠️ Top Issues</h3>
        <table class="violations-table">
            <thead>
                <tr>
                    <th>Issue</th>
                    <th>Category</th>
                    <th>Severity</th>
                    <th>Count</th>
                    <th>Help</th>
                </tr>
            </thead>
            <tbody>
                ${analysis.topIssues.map(issue => `
                    <tr class="priority-${issue.severity}">
                        <td>
                            <strong>${issue.id}</strong><br>
                            ${issue.description}
                        </td>
                        <td>${issue.category}</td>
                        <td>${issue.severity}</td>
                        <td>${issue.count}</td>
                        <td>
                            ${issue.helpUrl ? `<a href="${issue.helpUrl}" target="_blank">Learn More</a>` : 'N/A'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="card">
        <h3>💡 Recommendations</h3>
        ${analysis.recommendations.map(rec => `
            <div class="priority-${rec.priority}" style="margin: 15px 0; padding: 15px; border-radius: 4px;">
                <h4>${rec.title}</h4>
                <p><strong>Category:</strong> ${rec.category}</p>
                <p><strong>Priority:</strong> ${rec.priority}</p>
                <p>${rec.description}</p>
            </div>
        `).join('')}
    </div>

    <footer class="footer">
        <p>This report was generated automatically as part of Mariia Hub's commitment to digital accessibility.</p>
        <p>For questions about this report, please contact the development team.</p>
    </footer>

    <script>
        function getScoreClass(score) {
            if (score >= 90) return 'score-high';
            if (score >= 70) return 'score-medium';
            return 'score-low';
        }

        function getScoreDescription(score) {
            if (score >= 90) return 'Excellent accessibility compliance';
            if (score >= 70) return 'Good accessibility with room for improvement';
            if (score >= 50) return 'Moderate accessibility compliance';
            return 'Significant accessibility improvements needed';
        }
    </script>
</body>
</html>
  `;
}

/**
 * Get score class for styling
 */
function getScoreClass(score) {
  if (score >= 90) return 'score-high';
  if (score >= 70) return 'score-medium';
  return 'score-low';
}

/**
 * Get score description
 */
function getScoreDescription(score) {
  if (score >= 90) return 'Excellent accessibility compliance';
  if (score >= 70) return 'Good accessibility with room for improvement';
  if (score >= 50) return 'Moderate accessibility compliance';
  return 'Significant accessibility improvements needed';
}

/**
 * Main execution
 */
function main() {
  try {
    console.log('🔍 Generating comprehensive accessibility report...');

    // Collect all results
    const results = collectResults();
    console.log('📊 Results collected from', Object.keys(results.axe).length, 'viewports');

    // Analyze results
    const analysis = analyzeResults(results);
    console.log('✅ Analysis completed');

    // Generate HTML report
    const htmlReport = generateHTMLReport(analysis, results);
    fs.writeFileSync(options.output, htmlReport);
    console.log(`📄 HTML report saved to ${options.output}`);

    // Generate JSON report
    const jsonReport = {
      timestamp: new Date().toISOString(),
      analysis,
      results
    };
    fs.writeFileSync(options.jsonOutput, JSON.stringify(jsonReport, null, 2));
    console.log(`📄 JSON report saved to ${options.jsonOutput}`);

    // Summary
    console.log('\n📈 Accessibility Summary:');
    console.log(`Overall Score: ${analysis.overallScore}/100`);
    console.log(`WCAG AA Compliance: ${analysis.compliance.levelAA ? '✅ Compliant' : '❌ Non-Compliant'}`);
    console.log(`Total Violations: ${Object.values(analysis.violationsByCategory).reduce((a, b) => a + b, 0)}`);
    console.log(`Top Issue: ${analysis.topIssues[0]?.description || 'None'}`);

  } catch (error) {
    console.error('❌ Error generating accessibility report:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { generateHTMLReport, analyzeResults, collectResults };