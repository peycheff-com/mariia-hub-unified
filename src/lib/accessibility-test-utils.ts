/**
 * Comprehensive Accessibility Test Utilities
 *
 * This module provides utilities and helpers for accessibility testing
 * across unit tests, integration tests, and E2E tests.
 */

import { AxeResults, Violation } from 'jest-axe'
import { render, RenderResult } from '@testing-library/react'
import { UserEvent } from '@testing-library/user-event'

// Accessibility test configuration
export const ACCESSIBILITY_TEST_CONFIG = {
  // Default axe configuration
  axeConfig: {
    rules: {
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
      'tabindex': { enabled: true }
    },
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'best-practice']
    }
  },

  // Test thresholds
  thresholds: {
    maxViolations: 0,
    maxCriticalViolations: 0,
    maxSeriousViolations: 2,
    maxModerateViolations: 5,
    minAccessibilityScore: 85
  },

  // Component test selectors
  selectors: {
    focusableElements: 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    interactiveElements: 'button, a, input[type="button"], input[type="submit"], [role="button"]',
    formElements: 'input, select, textarea',
    headings: 'h1, h2, h3, h4, h5, h6',
    images: 'img',
    links: 'a[href]',
    landmarks: 'main, nav, header, footer, aside, section, [role]'
  }
}

// Accessibility test result interface
export interface AccessibilityTestResult {
  violations: Violation[]
  passes: any[]
  incomplete: any[]
  score: number
  criticalCount: number
  seriousCount: number
  moderateCount: number
  minorCount: number
  testContext: string
  timestamp: string
}

// Keyboard navigation test result
export interface KeyboardNavigationResult {
  focusableElements: {
    tagName: string
    textContent: string
    hasAriaLabel: boolean
    hasTitle: boolean
    disabled: boolean
    tabIndex: string | null
  }[]
  tabOrder: string[]
  skipLinks: {
    href: string
    text: string
  }[]
  issues: string[]
  score: number
}

// Screen reader test result
export interface ScreenReaderTestResult {
  headings: {
    level: number
    text: string
    hasAriaLabel: boolean
  }[]
  landmarks: {
    role: string
    hasAriaLabel: boolean
  }[]
  images: {
    src: string
    hasAlt: boolean
    isDecorative: boolean
    altText: string
  }[]
  links: {
    href: string
    hasText: boolean
    text: string
  }[]
  buttons: {
    text: string
    hasAriaLabel: boolean
    disabled: boolean
  }[]
  forms: {
    hasLabel: boolean
    hasAriaLabel: boolean
    hasAriaLabelledBy: boolean
    type: string
  }[]
  issues: string[]
  liveRegions: {
    live: string
    atomic: string
    relevant: string
    content: string
  }[]
}

// Main accessibility testing class
export class AccessibilityTester {
  private config = ACCESSIBILITY_TEST_CONFIG
  private testResults: AccessibilityTestResult[] = []

  /**
   * Run comprehensive accessibility test on a rendered component
   */
  async testComponent(
    renderResult: RenderResult,
    options: {
      context?: string
      axeConfig?: any
      threshold?: number
    } = {}
  ): Promise<AccessibilityTestResult> {
    const { container } = renderResult
    const axeConfig = { ...this.config.axeConfig, ...options.axeConfig }

    try {
      const results = await (await import('jest-axe')).axe(container, axeConfig)

      const testResult: AccessibilityTestResult = {
        violations: results.violations,
        passes: results.passes || [],
        incomplete: results.incomplete || [],
        score: this.calculateScore(results.violations),
        criticalCount: results.violations.filter(v => v.impact === 'critical').length,
        seriousCount: results.violations.filter(v => v.impact === 'serious').length,
        moderateCount: results.violations.filter(v => v.impact === 'moderate').length,
        minorCount: results.violations.filter(v => v.impact === 'minor').length,
        testContext: options.context || 'component',
        timestamp: new Date().toISOString()
      }

      this.testResults.push(testResult)
      return testResult
    } catch (error) {
      console.error('Accessibility test failed:', error)
      throw error
    }
  }

  /**
   * Test keyboard navigation
   */
  testKeyboardNavigation(container: HTMLElement): KeyboardNavigationResult {
    const result: KeyboardNavigationResult = {
      focusableElements: [],
      tabOrder: [],
      skipLinks: [],
      issues: [],
      score: 100
    }

    try {
      // Find focusable elements
      const focusableElements = container.querySelectorAll(this.config.selectors.focusableElements)

      focusableElements.forEach(element => {
        const elementData = {
          tagName: element.tagName,
          textContent: element.textContent?.slice(0, 50) || '',
          hasAriaLabel: element.hasAttribute('aria-label'),
          hasTitle: element.hasAttribute('title'),
          disabled: element.hasAttribute('disabled'),
          tabIndex: element.getAttribute('tabindex')
        }
        result.focusableElements.push(elementData)

        // Check for issues
        if (!elementData.disabled && elementData.tabIndex === '-1') {
          result.issues.push(`Element with tabindex="-1" is not disabled: ${elementData.tagName}`)
        }

        if (element.tagName === 'BUTTON' && !elementData.textContent.trim() && !elementData.hasAriaLabel && !elementData.hasTitle) {
          result.issues.push(`Button missing accessible label: ${elementData.tagName}`)
        }
      })

      // Check for skip links
      const skipLinks = container.querySelectorAll('a[href^="#"]')
      skipLinks.forEach(link => {
        result.skipLinks.push({
          href: link.getAttribute('href') || '',
          text: link.textContent?.trim() || ''
        })
      })

      // Calculate score
      result.score = Math.max(0, 100 - (result.issues.length * 10))

      return result
    } catch (error) {
      console.error('Keyboard navigation test failed:', error)
      result.issues.push(`Test failed: ${error.message}`)
      result.score = 0
      return result
    }
  }

  /**
   * Test screen reader compatibility
   */
  testScreenReaderCompatibility(container: HTMLElement): ScreenReaderTestResult {
    const result: ScreenReaderTestResult = {
      headings: [],
      landmarks: [],
      images: [],
      links: [],
      buttons: [],
      forms: [],
      issues: [],
      liveRegions: []
    }

    try {
      // Test heading structure
      const headings = container.querySelectorAll(this.config.selectors.headings)
      let previousLevel = 0
      let hasH1 = false

      headings.forEach(heading => {
        const level = parseInt(heading.tagName.substring(1))
        if (level === 1) hasH1 = true

        if (previousLevel > 0 && level > previousLevel + 1) {
          result.issues.push(`Heading level skipped: h${previousLevel} to h${level}`)
        }

        result.headings.push({
          level,
          text: heading.textContent || '',
          hasAriaLabel: heading.hasAttribute('aria-label')
        })

        previousLevel = level
      })

      if (!hasH1) {
        result.issues.push('No h1 heading found on page')
      }

      // Test landmarks
      const landmarks = container.querySelectorAll(this.config.selectors.landmarks)
      landmarks.forEach(element => {
        const role = element.getAttribute('role') || element.tagName.toLowerCase()
        result.landmarks.push({
          role,
          hasAriaLabel: element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby')
        })
      })

      if (result.landmarks.length === 0) {
        result.issues.push('No semantic landmarks found')
      }

      // Test images
      const images = container.querySelectorAll(this.config.selectors.images)
      images.forEach(img => {
        const hasAlt = img.hasAttribute('alt')
        const altText = img.getAttribute('alt') || ''
        const isDecorative = altText === ''

        if (!hasAlt) {
          result.issues.push(`Image missing alt attribute: ${img.src}`)
        }

        result.images.push({
          src: img.src,
          hasAlt,
          isDecorative,
          altText
        })
      })

      // Test links
      const links = container.querySelectorAll(this.config.selectors.links)
      links.forEach(link => {
        const hasText = !!link.textContent?.trim() ||
                       !!link.getAttribute('aria-label') ||
                       !!link.querySelector('img[alt]')

        if (!hasText) {
          result.issues.push(`Link missing accessible text: ${link.getAttribute('href')}`)
        }

        result.links.push({
          href: link.getAttribute('href') || '',
          hasText,
          text: link.textContent?.trim() || ''
        })
      })

      // Test buttons
      const buttons = container.querySelectorAll('button, [role="button"]')
      buttons.forEach(button => {
        const hasText = !!button.textContent?.trim() ||
                       !!button.getAttribute('aria-label') ||
                       !!button.getAttribute('title')

        if (!hasText) {
          result.issues.push('Button missing accessible text')
        }

        result.buttons.push({
          text: button.textContent?.trim() || '',
          hasAriaLabel: button.hasAttribute('aria-label'),
          disabled: button.hasAttribute('disabled')
        })
      })

      // Test forms
      const formElements = container.querySelectorAll(this.config.selectors.formElements)
      formElements.forEach(element => {
        const hasLabel = !!document.querySelector(`label[for="${element.id}"]`) ||
                        element.hasAttribute('aria-label') ||
                        element.hasAttribute('aria-labelledby') ||
                        !!element.closest('label')

        if (!hasLabel && element.getAttribute('type') !== 'hidden') {
          result.issues.push(`Form element missing label: ${element.tagName}#${element.id}`)
        }

        result.forms.push({
          hasLabel,
          hasAriaLabel: element.hasAttribute('aria-label'),
          hasAriaLabelledBy: element.hasAttribute('aria-labelledby'),
          type: element.getAttribute('type') || element.tagName
        })
      })

      // Test live regions
      const liveRegions = container.querySelectorAll('[aria-live], [role="status"], [role="alert"]')
      liveRegions.forEach(region => {
        result.liveRegions.push({
          live: region.getAttribute('aria-live') || '',
          atomic: region.getAttribute('aria-atomic') || '',
          relevant: region.getAttribute('aria-relevant') || '',
          content: region.textContent?.slice(0, 100) || ''
        })
      })

      return result
    } catch (error) {
      console.error('Screen reader test failed:', error)
      result.issues.push(`Test failed: ${error.message}`)
      return result
    }
  }

  /**
   * Test color contrast (simplified version)
   */
  testColorContrast(container: HTMLElement): {
    elements: Array<{
      element: string
      color: string
      backgroundColor: string
      contrast: number
      passes: boolean
    }>
    issues: string[]
  } {
    const result = {
      elements: [] as any[],
      issues: [] as string[]
    }

    try {
      const textElements = container.querySelectorAll('*')

      textElements.forEach(element => {
        if (!element.textContent?.trim()) return

        try {
          const styles = window.getComputedStyle(element)
          const color = styles.color
          const backgroundColor = styles.backgroundColor

          if (color && backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
            // Simplified contrast calculation
            const contrast = this.calculateContrast(color, backgroundColor)
            const fontSize = parseFloat(styles.fontSize)
            const isLargeText = fontSize >= 18 || (fontSize >= 14 && parseInt(styles.fontWeight) >= 700)
            const requiredContrast = isLargeText ? 3.0 : 4.5

            result.elements.push({
              element: element.tagName,
              color,
              backgroundColor,
              contrast,
              passes: contrast >= requiredContrast
            })

            if (contrast < requiredContrast) {
              result.issues.push(
                `Insufficient contrast (${contrast.toFixed(2)}:1) for ${element.tagName} text`
              )
            }
          }
        } catch (error) {
          // Skip elements that can't be analyzed
        }
      })

      return result
    } catch (error) {
      console.error('Color contrast test failed:', error)
      result.issues.push(`Color contrast test failed: ${error.message}`)
      return result
    }
  }

  /**
   * Generate accessibility test report
   */
  generateReport(): string {
    const totalTests = this.testResults.length
    const totalViolations = this.testResults.reduce((sum, result) => sum + result.violations.length, 0)
    const averageScore = this.testResults.length > 0
      ? this.testResults.reduce((sum, result) => sum + result.score, 0) / this.testResults.length
      : 100

    const criticalIssues = this.testResults.reduce((sum, result) => sum + result.criticalCount, 0)
    const seriousIssues = this.testResults.reduce((sum, result) => sum + result.seriousCount, 0)

    return `
# Accessibility Test Report

Generated: ${new Date().toISOString()}
Total Tests: ${totalTests}
Average Score: ${averageScore.toFixed(1)}%

## Summary
- Total Violations: ${totalViolations}
- Critical Issues: ${criticalIssues}
- Serious Issues: ${seriousIssues}
- Test Success Rate: ${totalTests > 0 ? ((totalTests - this.testResults.filter(r => r.violations.length > 0).length) / totalTests * 100).toFixed(1) : 0}%

## Recommendations
${criticalIssues > 0 ? '- Fix all critical accessibility issues immediately' : ''}
${seriousIssues > 0 ? '- Address serious issues in next sprint' : ''}
${averageScore < 90 ? '- Focus on improving overall accessibility score' : ''}

## Detailed Results
${this.testResults.map(result => `
### ${result.testContext}
- Score: ${result.score}%
- Violations: ${result.violations.length}
- Critical: ${result.criticalCount}, Serious: ${result.seriousCount}

${result.violations.slice(0, 3).map(violation => `- **${violation.id}**: ${violation.description}`).join('\n')}
${result.violations.length > 3 ? `- ... and ${result.violations.length - 3} more violations` : ''}
`).join('\n')}
    `.trim()
  }

  /**
   * Calculate accessibility score from violations
   */
  private calculateScore(violations: Violation[]): number {
    let score = 100

    violations.forEach(violation => {
      switch (violation.impact) {
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

    return Math.max(0, score)
  }

  /**
   * Calculate contrast ratio (simplified)
   */
  private calculateContrast(color1: string, color2: string): number {
    // This is a simplified contrast calculation
    // In a real implementation, you'd use a proper color contrast library
    try {
      const rgb1 = this.parseColor(color1)
      const rgb2 = this.parseColor(color2)

      if (!rgb1 || !rgb2) return 0

      const luminance1 = (0.299 * rgb1.r + 0.587 * rgb1.g + 0.114 * rgb1.b) / 255
      const luminance2 = (0.299 * rgb2.r + 0.587 * rgb2.g + 0.114 * rgb2.b) / 255

      const lighter = Math.max(luminance1, luminance2)
      const darker = Math.min(luminance1, luminance2)

      return (lighter + 0.05) / (darker + 0.05)
    } catch (error) {
      return 0
    }
  }

  /**
   * Parse color string to RGB
   */
  private parseColor(color: string): { r: number; g: number; b: number } | null {
    // Handle hex colors
    if (color.startsWith('#')) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null
    }

    // Handle rgb/rgba colors
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]),
        g: parseInt(rgbMatch[2]),
        b: parseInt(rgbMatch[3])
      }
    }

    return null
  }

  /**
   * Clear test results
   */
  clearResults(): void {
    this.testResults = []
  }

  /**
   * Get all test results
   */
  getResults(): AccessibilityTestResult[] {
    return [...this.testResults]
  }
}

// Utility functions for common accessibility testing patterns

/**
 * Test component with keyboard navigation
 */
export async function testComponentWithKeyboard(
  renderResult: RenderResult,
  userEvent: UserEvent,
  options: {
    context?: string
    testSteps?: Array<{ key: string; description: string }>
  } = {}
): Promise<{
  accessibilityResult: AccessibilityTestResult
  keyboardResult: KeyboardNavigationResult
}> {
  const tester = new AccessibilityTester()

  // Test basic accessibility
  const accessibilityResult = await tester.testComponent(renderResult, options)

  // Test keyboard navigation
  const keyboardResult = tester.testKeyboardNavigation(renderResult.container)

  // If test steps are provided, execute them
  if (options.testSteps) {
    for (const step of options.testSteps) {
      await userEvent.keyboard(step.key)
      // Add any additional checks for each step
    }
  }

  return {
    accessibilityResult,
    keyboardResult
  }
}

/**
 * Test form accessibility
 */
export async function testFormAccessibility(
  renderResult: RenderResult,
  formTestCases: Array<{
    fieldSelector: string
    fieldValue: string
    shouldValidate: boolean
    expectedError?: string
  }> = []
): Promise<{
  accessibilityResult: AccessibilityTestResult
  screenReaderResult: ScreenReaderTestResult
  formResults: Array<{
    field: string
    accessible: boolean
    hasLabel: boolean
    validationAccessible: boolean
  }>
}> {
  const tester = new AccessibilityTester()

  // Test basic accessibility
  const accessibilityResult = await tester.testComponent(renderResult, {
    context: 'form'
  })

  // Test screen reader compatibility
  const screenReaderResult = tester.testScreenReaderCompatibility(renderResult.container)

  // Test form-specific accessibility
  const formResults = formTestCases.map(testCase => {
    const field = renderResult.container.querySelector(testCase.fieldSelector)
    const hasLabel = !!field?.closest('label') ||
                     !!renderResult.container.querySelector(`label[for="${field?.id}"]`) ||
                     field?.hasAttribute('aria-label') ||
                     field?.hasAttribute('aria-labelledby')

    return {
      field: testCase.fieldSelector,
      accessible: hasLabel,
      hasLabel,
      validationAccessible: testCase.shouldValidate ?
        !!renderResult.container.querySelector('[role="alert"], [aria-live="assertive"]') : true
    }
  })

  return {
    accessibilityResult,
    screenReaderResult,
    formResults
  }
}

/**
 * Test modal/dialog accessibility
 */
export async function testModalAccessibility(
  renderResult: RenderResult,
  modalSelector: string,
  openModalAction: () => Promise<void>
): Promise<{
  accessibilityResult: AccessibilityTestResult
  keyboardResult: KeyboardNavigationResult
  focusTrapTest: {
    focusTrapped: boolean
    hasCloseButton: boolean
    firstElementFocusable: boolean
  }
}> {
  const tester = new AccessibilityTester()

  // Test with modal closed
  const closedResult = await tester.testComponent(renderResult, {
    context: 'modal-closed'
  })

  // Open modal
  await openModalAction()

  // Test with modal open
  const openResult = await tester.testComponent(renderResult, {
    context: 'modal-open'
  })

  // Test keyboard navigation with modal
  const keyboardResult = tester.testKeyboardNavigation(renderResult.container)

  // Test focus trap
  const modal = renderResult.container.querySelector(modalSelector)
  const modalFocusableElements = modal?.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) || []

  const focusTrapTest = {
    focusTrapped: modalFocusableElements.length > 0,
    hasCloseButton: !!modal?.querySelector('button[aria-label*="close"], button[aria-label*="Close"], .close'),
    firstElementFocusable: modalFocusableElements.length > 0
  }

  return {
    accessibilityResult: openResult,
    keyboardResult,
    focusTrapTest
  }
}

// Custom Jest matchers for accessibility testing
export const customAccessibilityMatchers = {
  toBeAccessible(received: RenderResult) {
    const tester = new AccessibilityTester()
    return tester.testComponent(received).then(result => {
      if (result.violations.length > 0) {
        return {
          message: () => `Expected component to be accessible, but found ${result.violations.length} violations:\n${
            result.violations.map(v => `- ${v.id}: ${v.description}`).join('\n')
          }`,
          pass: false
        }
      }
      return {
        message: () => 'Expected component not to be accessible, but it was',
        pass: true
      }
    })
  },

  toHaveAccessibleKeyboardNavigation(received: RenderResult) {
    const tester = new AccessibilityTester()
    const result = tester.testKeyboardNavigation(received.container)

    if (result.issues.length > 0) {
      return {
        message: () => `Expected component to have accessible keyboard navigation, but found issues:\n${
          result.issues.map(issue => `- ${issue}`).join('\n')
        }`,
        pass: false
      }
    }
    return {
      message: () => 'Expected component not to have accessible keyboard navigation, but it did',
      pass: true
    }
  },

  toBeScreenReaderCompatible(received: RenderResult) {
    const tester = new AccessibilityTester()
    const result = tester.testScreenReaderCompatibility(received.container)

    if (result.issues.length > 0) {
      return {
        message: () => `Expected component to be screen reader compatible, but found issues:\n${
          result.issues.map(issue => `- ${issue}`).join('\n')
        }`,
        pass: false
      }
    }
    return {
      message: () => 'Expected component not to be screen reader compatible, but it was',
      pass: true
    }
  }
}

// Export default tester instance
export const accessibilityTester = new AccessibilityTester()

export default AccessibilityTester