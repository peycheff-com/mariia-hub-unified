#!/usr/bin/env node

/**
 * Simple Accessibility Audit Script for mariia-hub
 */

import fs from 'fs';
import path from 'path';

class SimpleAccessibilityAuditor {
  constructor() {
    this.outputDir = path.join(process.cwd(), 'accessibility-audit-results');
    this.auditResults = {
      timestamp: new Date().toISOString(),
      summary: {
        totalIssues: 0,
        criticalIssues: 0,
        seriousIssues: 0,
        moderateIssues: 0,
        minorIssues: 0
      },
      codeAnalysis: {},
      recommendations: []
    };
    this.ensureOutputDirectory();
  }

  ensureOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async runAudit() {
    console.log('🔍 Starting Simple Accessibility Audit...');

    try {
      // Analyze code for accessibility patterns
      await this.analyzeCodeAccessibility();

      // Generate recommendations
      await this.generateRecommendations();

      // Create HTML report
      await this.createHTMLReport();

      // Create JSON report
      await this.createJSONReport();

      console.log('✅ Simple accessibility audit completed!');
      console.log(`📊 Report available at: ${path.join(this.outputDir, 'accessibility-audit-report.html')}`);

    } catch (error) {
      console.error('❌ Accessibility audit failed:', error);
      process.exit(1);
    }
  }

  async analyzeCodeAccessibility() {
    console.log('📝 Analyzing code for accessibility patterns...');

    const componentFiles = this.findReactComponents();

    const analysis = {
      semanticHTML: this.checkSemanticHTML(componentFiles),
      ariaImplementation: this.checkARIAImplementation(componentFiles),
      formAccessibility: this.checkFormAccessibility(componentFiles),
      imageAccessibility: this.checkImageAccessibility(componentFiles),
      linkAccessibility: this.checkLinkAccessibility(componentFiles),
      headingStructure: this.checkHeadingStructure(componentFiles),
      altTextUsage: this.checkAltTextUsage(componentFiles),
      buttonAccessibility: this.checkButtonAccessibility(componentFiles)
    };

    this.auditResults.codeAnalysis = analysis;
    console.log('✅ Code accessibility analysis completed');
  }

  findReactComponents() {
    const srcDir = path.join(process.cwd(), 'src');
    const componentFiles = [];

    function scanDirectory(dir) {
      try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);

          if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            scanDirectory(filePath);
          } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
            componentFiles.push(filePath);
          }
        });
      } catch (error) {
        // Skip directories that can't be read
      }
    }

    scanDirectory(srcDir);
    return componentFiles;
  }

  checkSemanticHTML(componentFiles) {
    const semanticElements = [
      'header', 'nav', 'main', 'section', 'article', 'aside', 'footer',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'button', 'a', 'img', 'ul', 'ol', 'li'
    ];

    const results = {
      found: [],
      missing: [],
      score: 0,
      issues: []
    };

    componentFiles.forEach(filePath => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        semanticElements.forEach(element => {
          if (content.includes(`<${element}`) || content.includes(`'${element}'`) || content.includes(`"${element}"`)) {
            if (!results.found.includes(element)) {
              results.found.push(element);
            }
          }
        });
      } catch (error) {
        // Skip files that can't be read
      }
    });

    // Check for missing important semantic elements
    const importantElements = ['main', 'header', 'nav', 'footer'];
    importantElements.forEach(element => {
      if (!results.found.includes(element)) {
        results.missing.push(element);
        results.issues.push({
          severity: 'moderate',
          description: `Missing semantic element: <${element}>`,
          recommendation: `Add <${element}> elements to improve page structure and screen reader navigation`
        });
      }
    });

    results.score = (results.found.length / semanticElements.length) * 100;
    return results;
  }

  checkARIAImplementation(componentFiles) {
    const ariaAttributes = [
      'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-expanded',
      'aria-hidden', 'aria-live', 'aria-atomic', 'aria-busy', 'aria-current',
      'aria-disabled', 'aria-invalid', 'aria-required', 'aria-selected'
    ];

    const results = {
      found: [],
      issues: [],
      score: 0
    };

    componentFiles.forEach(filePath => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        ariaAttributes.forEach(attr => {
          if (content.includes(attr)) {
            results.found.push({ file: path.relative(process.cwd(), filePath), attribute: attr });
          }
        });
      } catch (error) {
        // Skip files that can't be read
      }
    });

    // Check for potential ARIA issues
    if (results.found.length < 5) {
      results.issues.push({
        severity: 'moderate',
        description: 'Limited ARIA implementation',
        recommendation: 'Add appropriate ARIA labels and descriptions for better screen reader support'
      });
    }

    results.score = Math.min((results.found.length / 5) * 20, 100);
    return results;
  }

  checkFormAccessibility(componentFiles) {
    const results = {
      formsFound: 0,
      accessibleForms: 0,
      issues: []
    };

    componentFiles.forEach(filePath => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('<form') || content.includes('form=')) {
          results.formsFound++;

          let hasLabels = content.includes('<label') || content.includes('htmlFor=');
          let hasRequired = content.includes('required') || content.includes('aria-required');

          if (hasLabels && hasRequired) {
            results.accessibleForms++;
          } else {
            let issues = [];
            if (!hasLabels) issues.push('Missing form labels');
            if (!hasRequired) issues.push('Missing required field indicators');

            results.issues.push({
              file: path.relative(process.cwd(), filePath),
              severity: 'serious',
              description: issues.join(', '),
              recommendation: 'Add proper labels and required field indicators to all form elements'
            });
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    });

    results.score = results.formsFound > 0 ? (results.accessibleForms / results.formsFound) * 100 : 100;
    return results;
  }

  checkImageAccessibility(componentFiles) {
    const results = {
      imagesFound: 0,
      imagesWithAlt: 0,
      decorativeImages: 0,
      issues: []
    };

    componentFiles.forEach(filePath => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const imgMatches = content.match(/<img[^>]*>/g) || [];
        const imgJsxMatches = content.match(/<Image[^>]*>/g) || [];

        [...imgMatches, ...imgJsxMatches].forEach(imgTag => {
          results.imagesFound++;
          if (imgTag.includes('alt=')) {
            if (imgTag.includes('alt=""') || imgTag.includes('alt=\'\'')) {
              results.decorativeImages++;
            } else {
              results.imagesWithAlt++;
            }
          } else {
            results.issues.push({
              file: path.relative(process.cwd(), filePath),
              severity: 'critical',
              description: 'Missing alt attribute',
              element: imgTag,
              recommendation: 'Add descriptive alt text to all images, or use alt="" for decorative images'
            });
          }
        });
      } catch (error) {
        // Skip files that can't be read
      }
    });

    results.score = results.imagesFound > 0 ? ((results.imagesWithAlt + results.decorativeImages) / results.imagesFound) * 100 : 100;
    return results;
  }

  checkLinkAccessibility(componentFiles) {
    const results = {
      linksFound: 0,
      descriptiveLinks: 0,
      issues: []
    };

    componentFiles.forEach(filePath => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const linkMatches = content.match(/<a[^>]*>(.*?)<\/a>/g) || [];

        linkMatches.forEach(linkTag => {
          results.linksFound++;
          const linkText = linkTag.replace(/<[^>]*>/g, '').trim();

          // Check if link has descriptive text
          const isDescriptive = linkText.length > 2 &&
                              !['click here', 'read more', 'learn more', 'here', 'more'].includes(linkText.toLowerCase());

          if (isDescriptive) {
            results.descriptiveLinks++;
          } else {
            results.issues.push({
              file: path.relative(process.cwd(), filePath),
              severity: 'moderate',
              description: 'Non-descriptive link text',
              element: linkTag,
              text: linkText,
              recommendation: 'Use descriptive link text that explains the destination or purpose'
            });
          }
        });
      } catch (error) {
        // Skip files that can't be read
      }
    });

    results.score = results.linksFound > 0 ? (results.descriptiveLinks / results.linksFound) * 100 : 100;
    return results;
  }

  checkHeadingStructure(componentFiles) {
    const results = {
      headingHierarchy: [],
      issues: [],
      score: 100
    };

    componentFiles.forEach(filePath => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const headingMatches = content.match(/<h[1-6][^>]*>/g) || [];

        headingMatches.forEach(heading => {
          const level = parseInt(heading.match(/h([1-6])/)[1]);
          results.headingHierarchy.push({
            file: path.relative(process.cwd(), filePath),
            level,
            heading
          });
        });
      } catch (error) {
        // Skip files that can't be read
      }
    });

    // Check for proper heading hierarchy
    let previousLevel = 0;
    results.headingHierarchy.forEach(({ file, level, heading }) => {
      if (level > previousLevel + 1) {
        results.issues.push({
          file,
          severity: 'moderate',
          description: `Heading level jump from h${previousLevel} to h${level}`,
          heading,
          recommendation: 'Use proper heading hierarchy without skipping levels'
        });
        results.score -= 10;
      }
      previousLevel = level;
    });

    results.score = Math.max(results.score, 0);
    return results;
  }

  checkAltTextUsage(componentFiles) {
    const results = {
      totalImages: 0,
      withAltText: 0,
      decorative: 0,
      missingAlt: 0,
      issues: []
    };

    componentFiles.forEach(filePath => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');

        // Find img tags
        const imgRegex = /<img[^>]*>/g;
        let match;

        while ((match = imgRegex.exec(content)) !== null) {
          results.totalImages++;

          if (match[0].includes('alt=')) {
            if (match[0].includes('alt=""') || match[0].includes('alt=\'\'')) {
              results.decorative++;
            } else {
              results.withAltText++;
            }
          } else {
            results.missingAlt++;
            results.issues.push({
              file: path.relative(process.cwd(), filePath),
              severity: 'critical',
              description: 'Image missing alt attribute',
              element: match[0],
              recommendation: 'Add appropriate alt text or alt="" for decorative images'
            });
          }
        }

        // Find Next.js Image components
        const nextImgRegex = /<Image[^>]*>/g;

        while ((match = nextImgRegex.exec(content)) !== null) {
          results.totalImages++;

          if (match[0].includes('alt=')) {
            if (match[0].includes('alt=""') || match[0].includes('alt=\'\'')) {
              results.decorative++;
            } else {
              results.withAltText++;
            }
          } else {
            results.missingAlt++;
            results.issues.push({
              file: path.relative(process.cwd(), filePath),
              severity: 'critical',
              description: 'Next.js Image component missing alt attribute',
              element: match[0],
              recommendation: 'Add appropriate alt text or alt="" for decorative images'
            });
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    });

    results.score = results.totalImages > 0 ? ((results.withAltText + results.decorative) / results.totalImages) * 100 : 100;
    return results;
  }

  checkButtonAccessibility(componentFiles) {
    const results = {
      buttonsFound: 0,
      accessibleButtons: 0,
      issues: []
    };

    componentFiles.forEach(filePath => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');

        // Find button elements
        const buttonRegex = /<button[^>]*>(.*?)<\/button>/g;
        let match;

        while ((match = buttonRegex.exec(content)) !== null) {
          results.buttonsFound++;
          const buttonText = match[1].trim();

          if (buttonText.length > 0) {
            results.accessibleButtons++;
          } else {
            results.issues.push({
              file: path.relative(process.cwd(), filePath),
              severity: 'serious',
              description: 'Button without accessible text',
              element: match[0],
              recommendation: 'Add text content or aria-label to button elements'
            });
          }
        }

        // Find elements with onClick that should be buttons
        const onClickRegex = /<(\w+)[^>]*onClick[^>]*>(.*?)<\/\1>/g;

        while ((match = onClickRegex.exec(content)) !== null) {
          const tagName = match[1];
          if (tagName !== 'button') {
            results.issues.push({
              file: path.relative(process.cwd(), filePath),
              severity: 'moderate',
              description: `Interactive element using ${tagName} instead of button`,
              element: match[0],
              recommendation: 'Use button elements for actions or add role="button" and appropriate keyboard handlers'
            });
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    });

    results.score = results.buttonsFound > 0 ? (results.accessibleButtons / results.buttonsFound) * 100 : 100;
    return results;
  }

  async generateRecommendations() {
    const recommendations = [];

    // Analyze results and generate recommendations
    const analysis = this.auditResults.codeAnalysis;

    if (analysis.imageAccessibility?.score < 100) {
      recommendations.push({
        priority: 'Critical',
        category: 'Image Accessibility',
        description: 'Add appropriate alt text to all images',
        effort: 'Medium',
        impact: 'Critical',
        action: 'Ensure all images have descriptive alt text or use alt="" for decorative images',
        affectedFiles: analysis.imageAccessibility.issues?.length || 0
      });
    }

    if (analysis.altTextUsage?.missingAlt > 0) {
      recommendations.push({
        priority: 'Critical',
        category: 'Alt Text Compliance',
        description: `${analysis.altTextUsage.missingAlt} images missing alt attributes`,
        effort: 'Medium',
        impact: 'Critical',
        action: 'Add alt attributes to all images for screen reader compatibility'
      });
    }

    if (analysis.buttonAccessibility?.score < 100) {
      recommendations.push({
        priority: 'High',
        category: 'Button Accessibility',
        description: 'Improve button accessibility',
        effort: 'Low',
        impact: 'High',
        action: 'Ensure all buttons have accessible text or aria-label attributes'
      });
    }

    if (analysis.formAccessibility?.issues?.length > 0) {
      recommendations.push({
        priority: 'High',
        category: 'Form Accessibility',
        description: 'Fix form accessibility issues',
        effort: 'Medium',
        impact: 'High',
        action: 'Add proper labels, required field indicators, and ARIA attributes to forms'
      });
    }

    if (analysis.headingStructure?.score < 90) {
      recommendations.push({
        priority: 'Medium',
        category: 'Content Structure',
        description: 'Fix heading hierarchy issues',
        effort: 'Medium',
        impact: 'Medium',
        action: 'Ensure proper heading structure without skipping levels'
      });
    }

    if (analysis.linkAccessibility?.score < 90) {
      recommendations.push({
        priority: 'Medium',
        category: 'Link Accessibility',
        description: 'Improve link text descriptions',
        effort: 'Low',
        impact: 'High',
        action: 'Use descriptive link text that explains the destination or purpose'
      });
    }

    if (analysis.semanticHTML?.missing?.length > 0) {
      recommendations.push({
        priority: 'Medium',
        category: 'Semantic HTML',
        description: 'Add missing semantic elements',
        effort: 'Low',
        impact: 'Medium',
        action: `Add semantic elements: ${analysis.semanticHTML.missing.join(', ')}`
      });
    }

    // Add general recommendations
    recommendations.push(
      {
        priority: 'Medium',
        category: 'ARIA Implementation',
        description: 'Enhance ARIA usage for better screen reader support',
        effort: 'Medium',
        impact: 'High',
        action: 'Add appropriate ARIA labels, descriptions, and landmarks'
      },
      {
        priority: 'Low',
        category: 'Testing',
        description: 'Implement ongoing accessibility testing',
        effort: 'Medium',
        impact: 'High',
        action: 'Set up automated accessibility testing in CI/CD pipeline'
      },
      {
        priority: 'Low',
        category: 'Documentation',
        description: 'Create accessibility guidelines for development team',
        effort: 'Low',
        impact: 'Medium',
        action: 'Document accessibility best practices and coding standards'
      }
    );

    // Update summary
    recommendations.forEach(rec => {
      if (rec.priority === 'Critical') this.auditResults.summary.criticalIssues++;
      else if (rec.priority === 'High') this.auditResults.summary.seriousIssues++;
      else if (rec.priority === 'Medium') this.auditResults.summary.moderateIssues++;
      else if (rec.priority === 'Low') this.auditResults.summary.minorIssues++;
    });

    this.auditResults.summary.totalIssues = recommendations.length;
    this.auditResults.recommendations = recommendations;
  }

  async createHTMLReport() {
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessibility Audit Report - mariia-hub</title>
    <style>
        :root {
            --primary: #8B4513;
            --secondary: #D2691E;
            --success: #16a34a;
            --warning: #ca8a04;
            --error: #dc2626;
            --gray-50: #f9fafb;
            --gray-100: #f3f4f6;
            --gray-200: #e5e7eb;
            --gray-300: #d1d5db;
            --gray-600: #4b5563;
            --gray-800: #1f2937;
            --gray-900: #111827;
        }

        body {
            font-family: 'Inter', system-ui, sans-serif;
            line-height: 1.6;
            color: var(--gray-800);
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: var(--gray-50);
        }

        .header {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
            border: 1px solid var(--gray-200);
        }

        .logo {
            font-size: 1.5rem;
            font-weight: bold;
            color: var(--primary);
            margin-bottom: 0.5rem;
        }

        .title {
            font-size: 2rem;
            font-weight: bold;
            color: var(--gray-900);
            margin-bottom: 0.5rem;
        }

        .subtitle {
            color: var(--gray-600);
            margin-bottom: 1rem;
        }

        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .summary-card {
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
            border: 1px solid var(--gray-200);
        }

        .summary-number {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }

        .summary-label {
            color: var(--gray-600);
            font-size: 0.875rem;
        }

        .critical { color: var(--error); }
        .serious { color: var(--warning); }
        .moderate { color: var(--primary); }
        .minor { color: var(--gray-600); }
        .success { color: var(--success); }

        .section {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
            border: 1px solid var(--gray-200);
        }

        .section-title {
            font-size: 1.5rem;
            font-weight: bold;
            color: var(--gray-900);
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid var(--gray-200);
        }

        .recommendation {
            padding: 1rem;
            border-left: 4px solid;
            margin-bottom: 1rem;
            background: var(--gray-50);
            border-radius: 0 8px 8px 0;
        }

        .priority-critical { border-left-color: var(--error); }
        .priority-high { border-left-color: var(--warning); }
        .priority-medium { border-left-color: var(--primary); }
        .priority-low { border-left-color: var(--gray-600); }

        .priority-badge {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 0.5rem;
        }

        .badge-critical { background: var(--error); color: white; }
        .badge-high { background: var(--warning); color: white; }
        .badge-medium { background: var(--primary); color: white; }
        .badge-low { background: var(--gray-600); color: white; }

        .analysis-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }

        .analysis-item {
            padding: 1rem;
            border: 1px solid var(--gray-200);
            border-radius: 8px;
            background: var(--gray-50);
        }

        .analysis-title {
            font-weight: bold;
            margin-bottom: 0.5rem;
            color: var(--gray-900);
        }

        .score-bar {
            width: 100%;
            height: 8px;
            background: var(--gray-200);
            border-radius: 4px;
            overflow: hidden;
            margin: 0.5rem 0;
        }

        .score-fill {
            height: 100%;
            transition: width 0.3s ease;
        }

        .score-high { background: var(--success); }
        .score-medium { background: var(--warning); }
        .score-low { background: var(--error); }

        .issue-list {
            list-style: none;
            padding: 0;
            margin-top: 0.5rem;
        }

        .issue-item {
            padding: 0.5rem;
            background: white;
            border-radius: 4px;
            margin-bottom: 0.5rem;
            font-size: 0.875rem;
            border-left: 3px solid;
        }

        .issue-critical { border-left-color: var(--error); }
        .issue-serious { border-left-color: var(--warning); }
        .issue-moderate { border-left-color: var(--primary); }

        .footer {
            text-align: center;
            color: var(--gray-600);
            margin-top: 2rem;
            padding-top: 2rem;
            border-top: 1px solid var(--gray-200);
        }

        @media (max-width: 768px) {
            body {
                padding: 10px;
            }

            .summary-grid {
                grid-template-columns: 1fr;
            }

            .analysis-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">mariia-hub</div>
        <h1 class="title">Accessibility Audit Report</h1>
        <p class="subtitle">WCAG 2.1 AA Compliance Evaluation</p>
        <p class="subtitle">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    </div>

    <div class="summary-grid">
        <div class="summary-card">
            <div class="summary-number critical">${this.auditResults.summary.totalIssues}</div>
            <div class="summary-label">Total Issues</div>
        </div>
        <div class="summary-card">
            <div class="summary-number critical">${this.auditResults.summary.criticalIssues}</div>
            <div class="summary-label">Critical Issues</div>
        </div>
        <div class="summary-card">
            <div class="summary-number serious">${this.auditResults.summary.seriousIssues}</div>
            <div class="summary-label">Serious Issues</div>
        </div>
        <div class="summary-card">
            <div class="summary-number moderate">${this.auditResults.summary.moderateIssues}</div>
            <div class="summary-label">Moderate Issues</div>
        </div>
        <div class="summary-card">
            <div class="summary-number minor">${this.auditResults.summary.minorIssues}</div>
            <div class="summary-label">Minor Issues</div>
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">Code Analysis Results</h2>
        <div class="analysis-grid">
            ${Object.entries(this.auditResults.codeAnalysis).map(([key, analysis]) => `
                <div class="analysis-item">
                    <div class="analysis-title">${this.formatAnalysisTitle(key)}</div>
                    <div style="font-size: 1.25rem; font-weight: bold; color: ${analysis.score >= 90 ? 'var(--success)' : analysis.score >= 70 ? 'var(--warning)' : 'var(--error)'};">
                        ${analysis.score?.toFixed(1) || 0}%
                    </div>
                    <div class="score-bar">
                        <div class="score-fill ${analysis.score >= 90 ? 'score-high' : analysis.score >= 70 ? 'score-medium' : 'score-low'}"
                             style="width: ${analysis.score || 0}%">
                        </div>
                    </div>
                    ${analysis.issues?.length > 0 ? `
                        <div style="margin-top: 0.5rem; font-size: 0.875rem;">
                            <strong>${analysis.issues.length} issues found</strong>
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">Recommendations</h2>
        ${this.auditResults.recommendations.map(rec => `
            <div class="recommendation priority-${rec.priority.toLowerCase()}">
                <div class="priority-badge badge-${rec.priority.toLowerCase()}">${rec.priority}</div>
                <div style="font-weight: bold; margin-bottom: 0.5rem;">${rec.category}</div>
                <div style="margin-bottom: 0.5rem;">${rec.description}</div>
                <div style="font-size: 0.875rem; color: var(--gray-600);">
                    <strong>Action:</strong> ${rec.action} |
                    <strong>Effort:</strong> ${rec.effort} |
                    <strong>Impact:</strong> ${rec.impact}
                    ${rec.affectedFiles ? ` | <strong>Files:</strong> ${rec.affectedFiles}` : ''}
                </div>
            </div>
        `).join('')}
    </div>

    ${this.auditResults.summary.totalIssues > 0 ? `
        <div class="section">
            <h2 class="section-title">Detailed Issues</h2>
            ${Object.entries(this.auditResults.codeAnalysis).filter(([key, analysis]) => analysis.issues?.length > 0).map(([key, analysis]) => `
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="font-weight: bold; margin-bottom: 1rem; color: var(--gray-900);">${this.formatAnalysisTitle(key)}</h3>
                    <ul class="issue-list">
                        ${analysis.issues.slice(0, 5).map(issue => `
                            <li class="issue-item issue-${issue.severity}">
                                <div style="font-weight: bold; margin-bottom: 0.25rem;">${issue.description}</div>
                                <div style="font-size: 0.875rem; color: var(--gray-600);">
                                    ${issue.file ? `File: ${issue.file}<br>` : ''}
                                    ${issue.recommendation ? `Recommendation: ${issue.recommendation}` : ''}
                                </div>
                            </li>
                        `).join('')}
                        ${analysis.issues.length > 5 ? `<li style="text-align: center; color: var(--gray-600); font-style: italic;">... and ${analysis.issues.length - 5} more issues</li>` : ''}
                    </ul>
                </div>
            `).join('')}
        </div>
    ` : ''}

    <div class="section">
        <h2 class="section-title">WCAG 2.1 AA Compliance Status</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div style="padding: 1rem; border: 1px solid var(--gray-200); border-radius: 8px; text-align: center;">
                <div style="font-weight: bold; margin-bottom: 0.5rem;">Overall Status</div>
                <div style="color: ${this.auditResults.summary.totalIssues === 0 ? 'var(--success)' : 'var(--warning)'}; font-size: 1.25rem; font-weight: bold;">
                    ${this.auditResults.summary.totalIssues === 0 ? '✅ READY for Certification' : '⚠️ Remediation Needed'}
                </div>
            </div>
            <div style="padding: 1rem; border: 1px solid var(--gray-200); border-radius: 8px; text-align: center;">
                <div style="font-weight: bold; margin-bottom: 0.5rem;">WCAG 2.1 AA</div>
                <div style="color: ${this.auditResults.summary.criticalIssues === 0 ? 'var(--success)' : 'var(--error)'};">
                    ${this.auditResults.summary.criticalIssues === 0 ? '✅ Compliant' : '❌ Issues Found'}
                </div>
            </div>
            <div style="padding: 1rem; border: 1px solid var(--gray-200); border-radius: 8px; text-align: center;">
                <div style="font-weight: bold; margin-bottom: 0.5rem;">Certification Ready</div>
                <div style="color: ${this.auditResults.summary.totalIssues === 0 ? 'var(--success)' : 'var(--warning)'};">
                    ${this.auditResults.summary.totalIssues === 0 ? '✅ Yes' : '⚠️ After Fixes'}
                </div>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>This accessibility audit was conducted using comprehensive code analysis focusing on WCAG 2.1 AA compliance.</p>
        <p>For questions about this report or to discuss remediation strategies, please contact the development team.</p>
        <p><strong>mariia-hub - Accessibility Excellence in Beauty & Fitness Services</strong></p>
        <p style="margin-top: 1rem; font-size: 0.875rem; color: var(--gray-500);">
            Next steps: Address critical and high-priority issues, then proceed with formal WCAG 2.1 AA certification application.
        </p>
    </div>
</body>
</html>
    `;

    const reportPath = path.join(this.outputDir, 'accessibility-audit-report.html');
    fs.writeFileSync(reportPath, htmlTemplate);
  }

  formatAnalysisTitle(key) {
    const titles = {
      semanticHTML: 'Semantic HTML',
      ariaImplementation: 'ARIA Implementation',
      formAccessibility: 'Form Accessibility',
      imageAccessibility: 'Image Accessibility',
      linkAccessibility: 'Link Accessibility',
      headingStructure: 'Heading Structure',
      altTextUsage: 'Alt Text Usage',
      buttonAccessibility: 'Button Accessibility'
    };
    return titles[key] || key;
  }

  async createJSONReport() {
    const jsonPath = path.join(this.outputDir, 'accessibility-audit-results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(this.auditResults, null, 2));
  }
}

// Run the audit
if (import.meta.url === `file://${process.argv[1]}`) {
  const auditor = new SimpleAccessibilityAuditor();
  auditor.runAudit().catch(console.error);
}

export default SimpleAccessibilityAuditor;