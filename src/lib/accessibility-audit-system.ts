/**
 * Comprehensive Accessibility Audit and Compliance Reporting System
 *
 * This system provides automated accessibility auditing, compliance checking,
 * and detailed reporting for WCAG compliance tracking.
 */

import { AxeResults, Violation } from 'jest-axe'

// Audit configuration
export const ACCESSIBILITY_AUDIT_CONFIG = {
  // WCAG compliance levels
  wcagLevels: {
    A: {
      name: 'WCAG 2.1 Level A',
      description: 'Minimum level of accessibility',
      requiredTags: ['wcag2a'],
      scoreThreshold: 80
    },
    AA: {
      name: 'WCAG 2.1 Level AA',
      description: 'Target compliance level for most websites',
      requiredTags: ['wcag2a', 'wcag2aa'],
      scoreThreshold: 90
    },
    AAA: {
      name: 'WCAG 2.1 Level AAA',
      description: 'Highest level of accessibility',
      requiredTags: ['wcag2a', 'wcag2aa', 'wcag2aaa'],
      scoreThreshold: 95
    }
  },

  // Audit scopes
  scopes: {
    fullSite: 'Entire website audit',
    criticalPaths: 'Critical user journeys only',
    components: 'Specific component testing',
    templates: 'Template and layout testing'
  },

  // Reporting formats
  reportFormats: {
    html: 'Interactive HTML report',
    pdf: 'PDF document for sharing',
    json: 'JSON data for integration',
    csv: 'CSV for spreadsheet analysis'
  }
}

// Audit result interfaces
export interface AccessibilityAuditResult {
  timestamp: string
  url: string
  scope: string
  wcagLevel: string
  overallScore: number
  complianceStatus: 'compliant' | 'non-compliant' | 'partially-compliant'
  violations: ViolationDetails[]
  passes: PassDetails[]
  incomplete: IncompleteDetails[]
  performance: AuditPerformance
  recommendations: Recommendation[]
  metadata: AuditMetadata
}

export interface ViolationDetails extends Violation {
  wcagGuidelines: string[]
  impactLevel: 'critical' | 'serious' | 'moderate' | 'minor'
  affectedUsers: string[]
  fixComplexity: 'simple' | 'moderate' | 'complex'
  estimatedFixTime: string
  businessImpact: string
  relatedComponents: string[]
}

export interface PassDetails {
  ruleId: string
  description: string
  wcagGuidelines: string[]
  bestPractice: boolean
  components: string[]
}

export interface IncompleteDetails {
  ruleId: string
  description: string
  reason: string
  wcagGuidelines: string[]
  manualTestingRequired: boolean
}

export interface AuditPerformance {
  auditDuration: number // milliseconds
  pagesAudited: number
  elementsTested: number
  performanceImpact: string
  memoryUsage: number
}

export interface Recommendation {
  id: string
  title: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  category: string
  wcagGuideline: string
  implementation: {
    effort: 'low' | 'medium' | 'high'
    timeline: string
    resources: string[]
  }
  businessValue: string
  examples: string[]
}

export interface AuditMetadata {
  auditor: string
  auditVersion: string
  toolVersion: string
  browser: string
  viewport: { width: number; height: number }
  userAgent: string
  testEnvironment: 'development' | 'staging' | 'production'
  customRules: string[]
}

// Main audit system class
export class AccessibilityAuditSystem {
  private config = ACCESSIBILITY_AUDIT_CONFIG
  private auditHistory: AccessibilityAuditResult[] = []

  /**
   * Run comprehensive accessibility audit
   */
  async runAudit(options: {
    url?: string
    scope?: string
    wcagLevel?: keyof typeof ACCESSIBILITY_AUDIT_CONFIG.wcagLevels
    customRules?: string[]
    includePerformance?: boolean
  } = {}): Promise<AccessibilityAuditResult> {
    const startTime = performance.now()

    const auditOptions = {
      url: options.url || window.location.href,
      scope: options.scope || this.config.scopes.fullSite,
      wcagLevel: options.wcagLevel || 'AA',
      customRules: options.customRules || [],
      includePerformance: options.includePerformance !== false
    }

    try {
      // Run axe-core audit
      const axeResults = await this.runAxeAudit(auditOptions)

      // Process results
      const processedResults = await this.processAuditResults(axeResults, auditOptions)

      // Generate recommendations
      const recommendations = await this.generateRecommendations(processedResults.violations, auditOptions)

      // Calculate performance metrics
      const performance = await this.calculateAuditPerformance(startTime, auditOptions)

      // Determine compliance status
      const complianceStatus = this.determineComplianceStatus(processedResults, auditOptions)

      const auditResult: AccessibilityAuditResult = {
        timestamp: new Date().toISOString(),
        url: auditOptions.url,
        scope: auditOptions.scope,
        wcagLevel: this.config.wcagLevels[auditOptions.wcagLevel].name,
        overallScore: this.calculateOverallScore(processedResults),
        complianceStatus,
        violations: processedResults.violations,
        passes: processedResults.passes,
        incomplete: processedResults.incomplete,
        performance,
        recommendations,
        metadata: {
          auditor: 'Automated Audit System',
          auditVersion: '1.0.0',
          toolVersion: 'axe-core 4.11.0',
          browser: navigator.userAgent.split(' ')[0],
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          userAgent: navigator.userAgent,
          testEnvironment: this.detectTestEnvironment(),
          customRules: auditOptions.customRules
        }
      }

      // Store in history
      this.auditHistory.push(auditResult)

      return auditResult

    } catch (error) {
      console.error('Accessibility audit failed:', error)
      throw new Error(`Accessibility audit failed: ${error.message}`)
    }
  }

  /**
   * Run axe-core audit with custom configuration
   */
  private async runAxeAudit(options: any): Promise<AxeResults> {
    const wcagLevel = this.config.wcagLevels[options.wcagLevel]

    const axeConfig = {
      rules: {
        // Enable all WCAG relevant rules
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'focus-management': { enabled: true },
        'aria-labels': { enabled: true },
        'heading-order': { enabled: true },
        'landmark-roles': { enabled: true },
        'image-alt': { enabled: true },
        'link-text': { enabled: true },
        'form-field-multiple-labels': { enabled: true },
        'label-title-only': { enabled: true },
        'duplicate-id': { enabled: true },
        'tabindex': { enabled: true },
        'focus-trap': { enabled: true },
        'aria-required-children': { enabled: true },
        'aria-required-parent': { enabled: true },
        'role-img-alt': { enabled: true },
        'skip-link': { enabled: true },
        'bypass': { enabled: true },
        'page-has-heading-one': { enabled: true },
        'region': { enabled: true },
        'document-title': { enabled: true },
        'html-has-lang': { enabled: true }
      },
      tags: wcagLevel.requiredTags,
      reporter: 'v2',
      runOnly: {
        type: 'tag',
        values: wcagLevel.requiredTags
      },
      exclude: options.customRules.length > 0 ? options.customRules : []
    }

    // Check if axe is available
    if (!window.axe) {
      throw new Error('Axe-core is not loaded. Please ensure axe-core is properly initialized.')
    }

    // Run the audit
    return await window.axe.run(document, axeConfig)
  }

  /**
   * Process and enhance audit results
   */
  private async processAuditResults(axeResults: AxeResults, options: any): Promise<{
    violations: ViolationDetails[]
    passes: PassDetails[]
    incomplete: IncompleteDetails[]
  }> {
    const violations = await Promise.all(
      axeResults.violations.map(async violation => this.enhanceViolation(violation, options))
    )

    const passes = axeResults.passes.map(pass => ({
      ruleId: pass.id,
      description: pass.description,
      wcagGuidelines: this.mapRuleToWCAG(pass.id),
      bestPractice: pass.tags?.includes('best-practice') || false,
      components: this.extractComponentNames(pass.nodes)
    }))

    const incomplete = axeResults.incomplete.map(incomplete => ({
      ruleId: incomplete.id,
      description: incomplete.description,
      reason: incomplete.reason || 'Manual testing required',
      wcagGuidelines: this.mapRuleToWCAG(incomplete.id),
      manualTestingRequired: true
    }))

    return { violations, passes, incomplete }
  }

  /**
   * Enhance violation with additional details
   */
  private async enhanceViolation(violation: Violation, options: any): Promise<ViolationDetails> {
    const wcagGuidelines = this.mapRuleToWCAG(violation.id)
    const impactLevel = violation.impact as any
    const affectedUsers = this.estimateAffectedUsers(violation)
    const fixComplexity = this.assessFixComplexity(violation)
    const estimatedFixTime = this.estimateFixTime(violation)
    const businessImpact = this.assessBusinessImpact(violation)
    const relatedComponents = this.extractComponentNames(violation.nodes)

    return {
      ...violation,
      wcagGuidelines,
      impactLevel,
      affectedUsers,
      fixComplexity,
      estimatedFixTime,
      businessImpact,
      relatedComponents
    }
  }

  /**
   * Map axe rule to WCAG guidelines
   */
  private mapRuleToWCAG(ruleId: string): string[] {
    const wcagMapping: Record<string, string[]> = {
      'color-contrast': ['1.4.3 Contrast (Minimum)', '1.4.6 Contrast (Enhanced)'],
      'keyboard': ['2.1.1 Keyboard', '2.1.2 No Keyboard Trap'],
      'focus-management': ['2.4.3 Focus Order', '2.4.7 Focus Visible'],
      'aria-labels': ['1.3.1 Info and Relationships', '4.1.2 Name, Role, Value'],
      'heading-order': ['1.3.1 Info and Relationships'],
      'landmark-roles': ['1.3.6 Identify Purpose'],
      'image-alt': ['1.1.1 Non-text Content'],
      'link-text': ['2.4.4 Link Purpose (In Context)'],
      'form-field-multiple-labels': ['3.3.2 Labels or Instructions'],
      'label-title-only': ['3.3.2 Labels or Instructions'],
      'duplicate-id': ['4.1.1 Parsing'],
      'tabindex': ['2.1.1 Keyboard'],
      'focus-trap': ['2.1.2 No Keyboard Trap'],
      'aria-required-children': ['1.3.1 Info and Relationships'],
      'aria-required-parent': ['1.3.1 Info and Relationships'],
      'role-img-alt': ['1.1.1 Non-text Content'],
      'skip-link': ['2.4.1 Bypass Blocks'],
      'page-has-heading-one': ['1.3.1 Info and Relationships'],
      'region': ['1.3.1 Info and Relationships'],
      'document-title': ['2.4.2 Page Titled'],
      'html-has-lang': ['3.1.1 Language of Page']
    }

    return wcagMapping[ruleId] || ['Unknown WCAG Guideline']
  }

  /**
   * Estimate affected user groups
   */
  private estimateAffectedUsers(violation: Violation): string[] {
    const affectedGroups: string[] = []

    if (violation.id.includes('color-contrast')) {
      affectedGroups.push('Low Vision Users', 'Color Blind Users')
    }

    if (violation.id.includes('keyboard') || violation.id.includes('focus')) {
      affectedGroups.push('Keyboard Only Users', 'Motor Impaired Users')
    }

    if (violation.id.includes('aria') || violation.id.includes('label')) {
      affectedGroups.push('Screen Reader Users', 'Cognitively Impaired Users')
    }

    if (violation.id.includes('image-alt')) {
      affectedGroups.push('Screen Reader Users', 'Blind Users')
    }

    if (violation.id.includes('heading') || violation.id.includes('landmark')) {
      affectedGroups.push('Screen Reader Users', 'Cognitively Impaired Users')
    }

    return affectedGroups.length > 0 ? affectedGroups : ['All Users with Disabilities']
  }

  /**
   * Assess fix complexity
   */
  private assessFixComplexity(violation: Violation): 'simple' | 'moderate' | 'complex' {
    const simplePatterns = ['alt', 'label', 'title', 'role']
    const complexPatterns = ['keyboard-trap', 'focus-management', 'aria']

    const ruleId = violation.id.toLowerCase()

    if (simplePatterns.some(pattern => ruleId.includes(pattern))) {
      return 'simple'
    }

    if (complexPatterns.some(pattern => ruleId.includes(pattern))) {
      return 'complex'
    }

    return 'moderate'
  }

  /**
   * Estimate fix time
   */
  private estimateFixTime(violation: Violation): string {
    const complexity = this.assessFixComplexity(violation)
    const nodeCount = violation.nodes.length

    if (complexity === 'simple') {
      return nodeCount <= 5 ? '15 minutes' : '1 hour'
    }

    if (complexity === 'moderate') {
      return nodeCount <= 5 ? '1 hour' : '4 hours'
    }

    if (complexity === 'complex') {
      return nodeCount <= 5 ? '2 hours' : '1 day'
    }

    return '2 hours'
  }

  /**
   * Assess business impact
   */
  private assessBusinessImpact(violation: Violation): string {
    const impact = violation.impact

    if (impact === 'critical') {
      return 'Blocks access to core functionality, may result in lost bookings'
    }

    if (impact === 'serious') {
      return 'Significantly impacts user experience, may affect conversion rates'
    }

    if (impact === 'moderate') {
      return 'Creates barriers for some users, may affect user satisfaction'
    }

    return 'Minor inconvenience, does not prevent task completion'
  }

  /**
   * Extract component names from nodes
   */
  private extractComponentNames(nodes: any[]): string[] {
    const componentNames: string[] = []

    nodes.forEach(node => {
      const element = node.target?.[0]
      if (element) {
        // Try to get component name from various sources
        const dataTestId = element.getAttribute('data-testid')
        const dataComponent = element.getAttribute('data-component')
        const className = element.className
        const id = element.id

        if (dataTestId) componentNames.push(dataTestId)
        if (dataComponent) componentNames.push(dataComponent)
        if (id) componentNames.push(`#${id}`)
        if (className) componentNames.push(`.${className.split(' ')[0]}`)
      }
    })

    return [...new Set(componentNames)] // Remove duplicates
  }

  /**
   * Calculate overall accessibility score
   */
  private calculateOverallScore(processedResults: {
    violations: ViolationDetails[]
    passes: PassDetails[]
    incomplete: IncompleteDetails[]
  }): number {
    let score = 100

    // Deduct points for violations based on severity
    processedResults.violations.forEach(violation => {
      switch (violation.impactLevel) {
        case 'critical':
          score -= 25
          break
        case 'serious':
          score -= 15
          break
        case 'moderate':
          score -= 8
          break
        case 'minor':
          score -= 3
          break
      }
    })

    // Deduct points for incomplete items (manual testing required)
    score -= processedResults.incomplete.length * 2

    return Math.max(0, score)
  }

  /**
   * Determine compliance status
   */
  private determineComplianceStatus(
    processedResults: {
      violations: ViolationDetails[]
      passes: PassDetails[]
      incomplete: IncompleteDetails[]
    },
    options: any
  ): 'compliant' | 'non-compliant' | 'partially-compliant' {
    const wcagLevel = this.config.wcagLevels[options.wcagLevel]
    const score = this.calculateOverallScore(processedResults)

    if (score >= wcagLevel.scoreThreshold) {
      // Check for critical violations
      const criticalViolations = processedResults.violations.filter(v => v.impactLevel === 'critical')
      if (criticalViolations.length === 0) {
        return 'compliant'
      } else {
        return 'partially-compliant'
      }
    }

    return 'non-compliant'
  }

  /**
   * Generate recommendations based on violations
   */
  private async generateRecommendations(
    violations: ViolationDetails[],
    options: any
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []

    // Group violations by category
    const categories = this.groupViolationsByCategory(violations)

    Object.entries(categories).forEach(([category, categoryViolations]) => {
      const recommendation = this.createCategoryRecommendation(category, categoryViolations)
      recommendations.push(recommendation)
    })

    // Add specific recommendations for critical issues
    const criticalViolations = violations.filter(v => v.impactLevel === 'critical')
    criticalViolations.forEach(violation => {
      const specificRecommendation = this.createSpecificRecommendation(violation)
      recommendations.push(specificRecommendation)
    })

    // Sort by priority
    recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

    return recommendations
  }

  /**
   * Group violations by category
   */
  private groupViolationsByCategory(violations: ViolationDetails[]): Record<string, ViolationDetails[]> {
    const categories: Record<string, ViolationDetails[]> = {}

    violations.forEach(violation => {
      const category = this.categorizeViolation(violation.id)
      if (!categories[category]) {
        categories[category] = []
      }
      categories[category].push(violation)
    })

    return categories
  }

  /**
   * Categorize violation
   */
  private categorizeViolation(ruleId: string): string {
    const categoryMap: Record<string, string> = {
      'color-contrast': 'Visual Design',
      'keyboard': 'Keyboard Navigation',
      'focus': 'Focus Management',
      'aria': 'Screen Reader Support',
      'label': 'Form Accessibility',
      'image-alt': 'Media Accessibility',
      'heading': 'Document Structure',
      'landmark': 'Navigation',
      'link': 'Link Accessibility',
      'duplicate-id': 'Technical Quality',
      'document-title': 'Page Metadata',
      'html-has-lang': 'Technical Quality'
    }

    const rule = ruleId.toLowerCase()
    for (const [pattern, category] of Object.entries(categoryMap)) {
      if (rule.includes(pattern)) {
        return category
      }
    }

    return 'Other'
  }

  /**
   * Create category-level recommendation
   */
  private createCategoryRecommendation(category: string, violations: ViolationDetails[]): Recommendation {
    const priority = this.determineCategoryPriority(category, violations)
    const wcagGuideline = this.getPrimaryWCAGGuideline(violations)

    return {
      id: `rec-${category.toLowerCase().replace(/\s+/g, '-')}`,
      title: `Improve ${category}`,
      description: `Address ${violations.length} ${category.toLowerCase()} violations to enhance accessibility.`,
      priority,
      category,
      wcagGuideline,
      implementation: {
        effort: this.estimateCategoryEffort(violations),
        timeline: this.estimateCategoryTimeline(violations),
        resources: this.getRequiredResources(category)
      },
      businessValue: `Enhances user experience for ${this.getAffectedUserGroups(violations).join(', ')}`,
      examples: this.generateCategoryExamples(violations)
    }
  }

  /**
   * Create specific violation recommendation
   */
  private createSpecificRecommendation(violation: ViolationDetails): Recommendation {
    return {
      id: `rec-specific-${violation.id}`,
      title: `Fix ${violation.id} violation`,
      description: violation.description,
      priority: 'critical',
      category: this.categorizeViolation(violation.id),
      wcagGuideline: violation.wcagGuidelines[0],
      implementation: {
        effort: violation.fixComplexity,
        timeline: violation.estimatedFixTime,
        resources: this.getRequiredResourcesForViolation(violation)
      },
      businessValue: violation.businessImpact,
      examples: [`Fix issue in ${violation.relatedComponents.join(', ')}`]
    }
  }

  /**
   * Determine category priority
   */
  private determineCategoryPriority(category: string, violations: ViolationDetails[]): 'critical' | 'high' | 'medium' | 'low' {
    const hasCriticalViolations = violations.some(v => v.impactLevel === 'critical')
    const hasSeriousViolations = violations.some(v => v.impactLevel === 'serious')

    if (hasCriticalViolations) return 'critical'
    if (hasSeriousViolations) return 'high'
    if (violations.length > 5) return 'medium'
    return 'low'
  }

  /**
   * Get primary WCAG guideline
   */
  private getPrimaryWCAGGuideline(violations: ViolationDetails[]): string {
    if (violations.length === 0) return 'Unknown'
    return violations[0].wcagGuidelines[0] || 'Unknown'
  }

  /**
   * Estimate category effort
   */
  private estimateCategoryEffort(violations: ViolationDetails[]): 'low' | 'medium' | 'high' {
    const complexities = violations.map(v => v.fixComplexity)
    const complexCount = complexities.filter(c => c === 'complex').length
    const simpleCount = complexities.filter(c => c === 'simple').length

    if (complexCount > simpleCount) return 'high'
    if (complexCount > 0) return 'medium'
    return 'low'
  }

  /**
   * Estimate category timeline
   */
  private estimateCategoryTimeline(violations: ViolationDetails[]): string {
    const totalFixTime = violations.reduce((total, v) => {
      const time = parseInt(v.estimatedFixTime) || 0
      return total + time
    }, 0)

    if (totalFixTime < 60) return '1 hour'
    if (totalFixTime < 240) return '1 day'
    if (totalFixTime < 480) return '2-3 days'
    return '1 week'
  }

  /**
   * Get required resources for category
   */
  private getRequiredResources(category: string): string[] {
    const resourceMap: Record<string, string[]> = {
      'Visual Design': ['UI/UX Designer', 'Frontend Developer', 'Color contrast tools'],
      'Keyboard Navigation': ['Frontend Developer', 'Accessibility testing tools', 'Keyboard testing'],
      'Focus Management': ['Frontend Developer', 'JavaScript expertise', 'Screen reader testing'],
      'Screen Reader Support': ['Frontend Developer', 'ARIA expertise', 'Screen reader testing'],
      'Form Accessibility': ['Frontend Developer', 'UX Writer', 'Form validation expertise'],
      'Media Accessibility': ['UX Designer', 'Content team', 'Alt text writing'],
      'Document Structure': ['Frontend Developer', 'HTML expertise', 'SEO team'],
      'Navigation': ['UX Designer', 'Frontend Developer', 'Information architecture'],
      'Link Accessibility': ['UX Writer', 'Frontend Developer', 'Content team'],
      'Technical Quality': ['Frontend Developer', 'QA team', 'HTML validator'],
      'Page Metadata': ['SEO team', 'Frontend Developer', 'Content team']
    }

    return resourceMap[category] || ['Frontend Developer', 'Accessibility expertise']
  }

  /**
   * Get affected user groups
   */
  private getAffectedUserGroups(violations: ViolationDetails[]): string[] {
    const groups = new Set<string>()
    violations.forEach(violation => {
      violation.affectedUsers.forEach(user => groups.add(user))
    })
    return Array.from(groups)
  }

  /**
   * Generate category examples
   */
  private generateCategoryExamples(violations: ViolationDetails[]): string[] {
    return violations.slice(0, 3).map(violation =>
      `${violation.id}: ${violation.description}`
    )
  }

  /**
   * Get required resources for specific violation
   */
  private getRequiredResourcesForViolation(violation: ViolationDetails): string[] {
    const category = this.categorizeViolation(violation.id)
    const baseResources = this.getRequiredResources(category)

    if (violation.impactLevel === 'critical') {
      baseResources.push('Senior Developer', 'Immediate attention')
    }

    return baseResources
  }

  /**
   * Calculate audit performance metrics
   */
  private async calculateAuditPerformance(startTime: number, options: any): Promise<AuditPerformance> {
    const endTime = performance.now()
    const auditDuration = endTime - startTime

    // Count elements
    const elementsTested = document.querySelectorAll('*').length
    const pagesAudited = 1 // For single page audit

    // Assess performance impact
    let performanceImpact = 'low'
    if (auditDuration > 10000) performanceImpact = 'medium'
    if (auditDuration > 30000) performanceImpact = 'high'

    // Memory usage (if available)
    let memoryUsage = 0
    if ('memory' in performance) {
      memoryUsage = (performance as any).memory.usedJSHeapSize
    }

    return {
      auditDuration,
      pagesAudited,
      elementsTested,
      performanceImpact,
      memoryUsage
    }
  }

  /**
   * Detect test environment
   */
  private detectTestEnvironment(): 'development' | 'staging' | 'production' {
    const hostname = window.location.hostname

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development'
    }

    if (hostname.includes('staging') || hostname.includes('test')) {
      return 'staging'
    }

    return 'production'
  }

  /**
   * Generate audit report
   */
  async generateReport(auditResult: AccessibilityAuditResult, format: 'html' | 'pdf' | 'json' | 'csv' = 'html'): Promise<string> {
    switch (format) {
      case 'html':
        return this.generateHTMLReport(auditResult)
      case 'json':
        return JSON.stringify(auditResult, null, 2)
      case 'csv':
        return this.generateCSVReport(auditResult)
      case 'pdf':
        return 'PDF generation not yet implemented'
      default:
        throw new Error(`Unsupported report format: ${format}`)
    }
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(auditResult: AccessibilityAuditResult): string {
    const {
      timestamp,
      url,
      wcagLevel,
      overallScore,
      complianceStatus,
      violations,
      recommendations,
      performance
    } = auditResult

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessibility Audit Report - ${url}</title>
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
        }
        .score {
            font-size: 48px;
            font-weight: bold;
            margin: 20px 0;
        }
        .compliant { color: #28a745; }
        .non-compliant { color: #dc3545; }
        .partially-compliant { color: #ffc107; }
        .card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .violations-table {
            width: 100%;
            border-collapse: collapse;
        }
        .violations-table th,
        .violations-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        .violations-table th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        .priority-critical { border-left: 4px solid #dc3545; }
        .priority-serious { border-left: 4px solid #fd7e14; }
        .priority-moderate { border-left: 4px solid #ffc107; }
        .priority-minor { border-left: 4px solid #28a745; }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            margin-right: 5px;
        }
        .summary-metric {
            text-align: center;
            padding: 20px;
        }
        .summary-metric .value {
            font-size: 32px;
            font-weight: bold;
            color: #8B4513;
        }
        .summary-metric .label {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <header class="header">
        <h1>🎯 Accessibility Audit Report</h1>
        <p>${url}</p>
        <p>Generated: ${new Date(timestamp).toLocaleString()}</p>
        <div class="score ${complianceStatus}">
            ${overallScore}/100 - ${complianceStatus.toUpperCase()}
        </div>
        <p>WCAG Compliance: ${wcagLevel}</p>
    </header>

    <div class="card">
        <h2>📊 Audit Summary</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
            <div class="summary-metric">
                <div class="value">${overallScore}</div>
                <div class="label">Overall Score</div>
            </div>
            <div class="summary-metric">
                <div class="value">${violations.length}</div>
                <div class="label">Total Violations</div>
            </div>
            <div class="summary-metric">
                <div class="value">${performance.auditDuration}ms</div>
                <div class="label">Audit Duration</div>
            </div>
            <div class="summary-metric">
                <div class="value">${performance.elementsTested}</div>
                <div class="label">Elements Tested</div>
            </div>
        </div>
    </div>

    <div class="card">
        <h2>⚠️ Accessibility Violations</h2>
        <table class="violations-table">
            <thead>
                <tr>
                    <th>Rule</th>
                    <th>Description</th>
                    <th>Impact</th>
                    <th>Components</th>
                    <th>Fix Time</th>
                </tr>
            </thead>
            <tbody>
                ${violations.map(violation => `
                    <tr class="priority-${violation.impactLevel}">
                        <td>
                            <span class="badge">${violation.id}</span>
                        </td>
                        <td>${violation.description}</td>
                        <td>${violation.impactLevel}</td>
                        <td>${violation.relatedComponents.join(', ') || 'N/A'}</td>
                        <td>${violation.estimatedFixTime}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="card">
        <h2>💡 Recommendations</h2>
        ${recommendations.map(rec => `
            <div style="margin: 20px 0; padding: 15px; border-left: 4px solid #8B4513; background-color: #fff;">
                <h3>${rec.title}</h3>
                <p><strong>Priority:</strong> ${rec.priority}</p>
                <p><strong>Category:</strong> ${rec.category}</p>
                <p><strong>WCAG Guideline:</strong> ${rec.wcagGuideline}</p>
                <p>${rec.description}</p>
                <p><strong>Implementation:</strong></p>
                <ul>
                    <li>Effort: ${rec.implementation.effort}</li>
                    <li>Timeline: ${rec.implementation.timeline}</li>
                    <li>Resources: ${rec.implementation.resources.join(', ')}</li>
                </ul>
                <p><strong>Business Value:</strong> ${rec.businessValue}</p>
            </div>
        `).join('')}
    </div>

    <div class="card">
        <h2>🔧 Audit Performance</h2>
        <table class="violations-table">
            <tr>
                <th>Metric</th>
                <th>Value</th>
            </tr>
            <tr>
                <td>Audit Duration</td>
                <td>${performance.auditDuration}ms</td>
            </tr>
            <tr>
                <td>Performance Impact</td>
                <td>${performance.performanceImpact}</td>
            </tr>
            <tr>
                <td>Elements Tested</td>
                <td>${performance.elementsTested}</td>
            </tr>
            <tr>
                <td>Memory Usage</td>
                <td>${(performance.memoryUsage / 1024 / 1024).toFixed(2)} MB</td>
            </tr>
        </table>
    </div>
</body>
</html>
    `.trim()
  }

  /**
   * Generate CSV report
   */
  private generateCSVReport(auditResult: AccessibilityAuditResult): string {
    const headers = [
      'Rule ID',
      'Description',
      'Impact',
      'WCAG Guidelines',
      'Components',
      'Fix Complexity',
      'Estimated Fix Time',
      'Business Impact'
    ]

    const rows = auditResult.violations.map(violation => [
      violation.id,
      violation.description,
      violation.impactLevel,
      violation.wcagGuidelines.join('; '),
      violation.relatedComponents.join('; '),
      violation.fixComplexity,
      violation.estimatedFixTime,
      violation.businessImpact
    ])

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
  }

  /**
   * Get audit history
   */
  getAuditHistory(limit?: number): AccessibilityAuditResult[] {
    if (limit) {
      return this.auditHistory.slice(-limit)
    }
    return [...this.auditHistory]
  }

  /**
   * Compare audits
   */
  compareAudits(audit1: AccessibilityAuditResult, audit2: AccessibilityAuditResult): {
    scoreChange: number
    violationsChange: number
    newViolations: ViolationDetails[]
    resolvedViolations: ViolationDetails[]
    trends: string[]
  } {
    const scoreChange = audit2.overallScore - audit1.overallScore
    const violationsChange = audit2.violations.length - audit1.violations.length

    const newViolations = audit2.violations.filter(v2 =>
      !audit1.violations.some(v1 => v1.id === v2.id)
    )

    const resolvedViolations = audit1.violations.filter(v1 =>
      !audit2.violations.some(v2 => v2.id === v1.id)
    )

    const trends = this.analyzeTrends(audit1, audit2)

    return {
      scoreChange,
      violationsChange,
      newViolations,
      resolvedViolations,
      trends
    }
  }

  /**
   * Analyze trends between audits
   */
  private analyzeTrends(audit1: AccessibilityAuditResult, audit2: AccessibilityAuditResult): string[] {
    const trends: string[] = []

    if (audit2.overallScore > audit1.overallScore) {
      trends.push('Overall accessibility score improved')
    } else if (audit2.overallScore < audit1.overallScore) {
      trends.push('Overall accessibility score declined')
    }

    const criticalChange = audit2.violations.filter(v => v.impactLevel === 'critical').length -
                        audit1.violations.filter(v => v.impactLevel === 'critical').length

    if (criticalChange > 0) {
      trends.push('New critical violations introduced')
    } else if (criticalChange < 0) {
      trends.push('Critical violations resolved')
    }

    return trends
  }

  /**
   * Export audit data for external analysis
   */
  exportData(format: 'json' | 'csv' | 'excel'): string {
    switch (format) {
      case 'json':
        return JSON.stringify({
          auditHistory: this.auditHistory,
          config: this.config,
          generatedAt: new Date().toISOString()
        }, null, 2)
      case 'csv':
        return this.generateCSVExport()
      case 'excel':
        return 'Excel export not yet implemented'
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  /**
   * Generate CSV export
   */
  private generateCSVExport(): string {
    const headers = [
      'Timestamp',
      'URL',
      'WCAG Level',
      'Overall Score',
      'Compliance Status',
      'Total Violations',
      'Critical Violations',
      'Serious Violations',
      'Moderate Violations',
      'Minor Violations',
      'Audit Duration (ms)',
      'Elements Tested'
    ]

    const rows = this.auditHistory.map(audit => [
      audit.timestamp,
      audit.url,
      audit.wcagLevel,
      audit.overallScore,
      audit.complianceStatus,
      audit.violations.length,
      audit.violations.filter(v => v.impactLevel === 'critical').length,
      audit.violations.filter(v => v.impactLevel === 'serious').length,
      audit.violations.filter(v => v.impactLevel === 'moderate').length,
      audit.violations.filter(v => v.impactLevel === 'minor').length,
      audit.performance.auditDuration,
      audit.performance.elementsTested
    ])

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
  }
}

// Export default instance
export const accessibilityAuditSystem = new AccessibilityAuditSystem()

export default AccessibilityAuditSystem