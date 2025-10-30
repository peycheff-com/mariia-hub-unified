# Comprehensive Accessibility Testing Guide

## Table of Contents
1. [Overview](#overview)
2. [Testing Framework Setup](#testing-framework-setup)
3. [Automated Testing](#automated-testing)
4. [Manual Testing Checklists](#manual-testing-checklists)
5. [Assistive Technology Testing](#assistive-technology-testing)
6. [Performance & Monitoring](#performance--monitoring)
7. [User Testing with Disabilities](#user-testing-with-disabilities)
8. [CI/CD Integration](#cicd-integration)
9. [Reporting & Documentation](#reporting--documentation)
10. [Continuous Improvement](#continuous-improvement)

## Overview

This guide provides a comprehensive approach to accessibility testing for the Mariia Hub platform, ensuring WCAG AA compliance and an inclusive user experience for people with disabilities.

### Target Standards
- **WCAG 2.1 Level AA** (minimum requirement)
- **WCAG 2.1 Level AAA** (where feasible)
- **Section 508** compliance
- **EN 301 549** European accessibility standard

### Testing Objectives
1. Ensure equal access to beauty and fitness booking services
2. Provide seamless experience for users with assistive technology
3. Maintain accessibility across all devices and platforms
4. Continuously monitor and improve accessibility metrics

## Testing Framework Setup

### Automated Testing Stack

```bash
# Core accessibility testing libraries
npm install --save-dev axe-core jest-axe axe-playwright
npm install --save-dev @axe-core/react @axe-core/playwright
npm install --save-dev pa11y-ci lighthouse-ci
npm install --save-dev color-contrast-checker
```

### Configuration Files

#### axe-core Configuration (`src/test/setup-a11y.ts`)

```typescript
export const a11yConfig = {
  rules: {
    'color-contrast': { enabled: true },
    'keyboard-navigation': { enabled: true },
    'focus-management': { enabled: true },
    'aria-labels': { enabled: true },
    'heading-order': { enabled: true },
    'landmark-roles': { enabled: true },
    'image-alt': { enabled: true },
    'link-text': { enabled: true }
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'best-practice']
  }
}
```

#### Playwright Accessibility Configuration

```typescript
// tests/e2e/accessibility.config.ts
export const accessibilityConfig = {
  viewports: [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 720 }
  ],
  pages: [
    '/', '/beauty', '/fitness', '/booking', '/contact', '/about', '/admin'
  ],
  rules: {
    // Critical rules that block releases
    critical: [
      'color-contrast',
      'keyboard-navigation',
      'focus-management',
      'aria-labels',
      'image-alt'
    ],
    // Important rules to track
    important: [
      'heading-order',
      'landmark-roles',
      'form-field-multiple-labels',
      'link-text'
    ]
  }
}
```

## Automated Testing

### 1. Unit/Component Testing with Vitest

```typescript
// src/components/booking/__tests__/Step1Choose.accessibility.test.ts
import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { Step1Choose } from '../Step1Choose'

describe('Step1Choose Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<Step1Choose {...props} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have proper keyboard navigation', async () => {
    render(<Step1Choose {...props} />)

    const serviceButtons = screen.getAllByRole('button')
    expect(serviceButtons.length).toBeGreaterThan(0)

    // Test Tab navigation
    await userEvent.tab()
    expect(document.activeElement).toBe(serviceButtons[0])
  })
})
```

### 2. E2E Testing with Playwright

```typescript
// tests/e2e/accessibility.spec.ts
test.describe('Accessibility Suite', () => {
  const pages = ['/', '/beauty', '/fitness', '/booking']

  pages.forEach(pagePath => {
    test(`${pagePath} should be accessible`, async ({ page }) => {
      await page.goto(pagePath)

      // Inject and run axe
      await injectAxe(page)
      await checkA11y(page, undefined, {
        includedImpacts: ['critical', 'serious']
      })
    })
  })
})
```

### 3. Integration with Build Pipeline

```json
// package.json scripts
{
  "scripts": {
    "test:a11y": "vitest run --config vitest.a11y.config.ts",
    "test:a11y:e2e": "playwright test --config playwright.a11y.config.ts",
    "test:a11y:ci": "npm run test:a11y && npm run test:a11y:e2e",
    "a11y:audit": "axe --dist dist --exclude '**/*.map' --tags wcag2a,wcag2aa",
    "lighthouse:a11y": "lhci autorun --config=.lighthouserc.js"
  }
}
```

## Manual Testing Checklists

### 1. Keyboard Navigation Checklist

#### Basic Navigation
- [ ] Tab key moves through all interactive elements in logical order
- [ ] Shift+Tab navigates backwards through elements
- [ ] Enter/Space activate buttons, links, and controls
- [ ] Arrow keys work within menus, radio groups, and lists
- [ ] Escape key closes modals, menus, and cancels actions

#### Focus Management
- [ ] Focus indicator is clearly visible on all elements
- [ ] Focus moves to appropriate element after page changes
- [ ] Modal dialogs trap focus within them
- [ ] Skip links allow keyboard users to bypass navigation
- [ ] Focus returns to triggering element after closing dialogs

#### Form Navigation
- [ ] All form fields are reachable via keyboard
- [ ] Form validation errors are announced and focusable
- [ ] Required fields are properly indicated
- [ ] Error messages are associated with form fields

### 2. Screen Reader Testing Checklist

#### Navigation & Structure
- [ ] Page title is descriptive and changes per page
- [ ] Heading structure is logical (h1 → h2 → h3)
- [ ] Landmarks (main, nav, header, footer) are properly used
- [ ] Lists are properly marked up (ul, ol, li)
- [ ] Links have descriptive text (not "click here")

#### Content Understanding
- [ ] Images have appropriate alt text
- [ ] Decorative images have empty alt (alt="")
- [ ] Complex images have long descriptions
- [ ] Tables have proper headers and captions
- [ ] Form fields have proper labels

#### Dynamic Content
- [ ] Page changes are announced to screen readers
- [ ] Error messages are in appropriate live regions
- [ ] Loading states are announced
- [ ] Modal/dialog appearance is announced

### 3. Visual Accessibility Checklist

#### Color & Contrast
- [ ] Text meets WCAG AA contrast ratios (4.5:1 normal, 3:1 large)
- [ ] Interactive elements have sufficient contrast
- [ ] Color is not the only way to convey information
- [ ] Focus indicators are clearly visible
- [ ] Links are distinguishable from regular text

#### Typography & Layout
- [ ] Text can be resized to 200% without loss of functionality
- [ ] Line spacing is at least 1.5 times font size
- [ ] Paragraph spacing is at least 2 times font size
- [ ] Content reflows properly on larger text sizes
- [ ] No horizontal scrolling at 1280px width with 200% zoom

#### Motion & Animation
- [ ] Respects prefers-reduced-motion setting
- [ ] Autoplaying content can be paused
- [ ] Flashing content is below seizure threshold
- [ ] Timeouts provide sufficient time for users

### 4. Mobile Accessibility Checklist

#### Touch Targets
- [ ] Touch targets are at least 44x44 CSS pixels
- [ ] Targets are adequately spaced (prevents accidental activation)
- [ ] Swipe gestures have keyboard alternatives
- [ ] Touch feedback is provided

#### Orientation & Zoom
- [ ] Content works in both portrait and landscape
- [ ] Pinch-to-zoom works and doesn't break functionality
- [ ] Text remains readable at 200% zoom
- [ ] No content is cut off at edges

#### Device Features
- [ ] Voice control alternatives exist for all gestures
- [ ] Haptic feedback is not the only feedback mechanism
- [ ] Device-specific features have fallbacks

## Assistive Technology Testing

### Screen Reader Testing

#### Testing Setup
1. **NVDA (Windows)** - Free, widely used
2. **JAWS (Windows)** - Commercial, industry standard
3. **VoiceOver (Mac/iOS)** - Built-in, essential for Apple testing
4. **TalkBack (Android)** - Built-in Android screen reader
5. **Narrator (Windows)** - Built-in Windows option

#### Testing Scenarios

```typescript
// Screen Reader Test Scenarios
const screenReaderTests = [
  {
    name: "Complete booking flow",
    steps: [
      "Navigate to booking page",
      "Select service category",
      "Choose specific service",
      "Select date and time",
      "Fill customer information",
      "Complete booking"
    ],
    expected: "Each step is announced and can be completed via keyboard"
  },
  {
    name: "Emergency contact information",
    steps: [
      "Find emergency contact info",
      "Verify phone numbers are readable",
      "Test email address accessibility"
    ],
    expected: "Critical information is accessible to screen readers"
  }
]
```

### Keyboard-Only Testing

#### Setup Requirements
- Unplug mouse/disable trackpad
- Use only keyboard for all interactions
- Test with different keyboard layouts

#### Test Coverage
- Full booking workflow
- Navigation menu exploration
- Form completion and validation
- Error handling and recovery
- Modal interactions

### Voice Control Testing

#### Testing Tools
- **Windows Speech Recognition**
- **Mac Voice Control**
- **Google Voice Access (Android)**
- **Siri (iOS)**

#### Test Scenarios
- Voice commands for navigation
- Voice-activated form filling
- Voice-controlled booking process
- Error correction via voice

## Performance & Monitoring

### Accessibility Metrics

#### Core Metrics
```typescript
interface AccessibilityMetrics {
  // Compliance metrics
  wcagCompliance: {
    levelA: boolean
    levelAA: boolean
    levelAAA: boolean
  }

  // Issue metrics
  violations: {
    critical: number
    serious: number
    moderate: number
    minor: number
  }

  // Usage metrics
  assistiveTechnologyUsage: {
    screenReaders: number
    keyboardOnly: number
    voiceControl: number
    switchNavigation: number
  }

  // Performance metrics
  loadTimeForAT: number // Load time impact on assistive tech
  announcementLatency: number // Speed of screen reader announcements
  focusManagementSpeed: number // Time to manage focus changes
}
```

#### Real User Monitoring (RUM)

```typescript
// Accessibility RUM tracking
trackRUMEvent('accessibility-booking-start', {
  userAgent: navigator.userAgent,
  assistiveTechnology: detectedAT,
  timestamp: Date.now(),
  pageType: 'booking'
})

trackRUMEvent('keyboard-navigation-used', {
  navigationPath: focusPath,
  totalTime: navigationTime,
  errors: navigationErrors
})
```

### Continuous Monitoring Setup

```typescript
// Automated accessibility monitoring
const accessibilityMonitor = new AccessibilityMonitor()

// Start monitoring in production
accessibilityMonitor.startMonitoring({
  interval: 30000, // 30 seconds
  thresholds: {
    criticalViolations: 0,
    accessibilityScore: 85
  }
})

// Alert on new violations
accessibilityMonitor.on('violation', (violation) => {
  if (violation.severity === 'critical') {
    sendAlert({
      type: 'accessibility',
      severity: 'critical',
      message: violation.description,
      url: window.location.href
    })
  }
})
```

## User Testing with Disabilities

### Participant Recruitment

#### Target Disabilities
1. **Visual Impairments**
   - Blind users (screen readers)
   - Low vision users (screen magnifiers)
   - Color blind users

2. **Motor Impairments**
   - Keyboard-only users
   - Voice control users
   - Switch navigation users
   - Users with limited dexterity

3. **Cognitive Disabilities**
   - Users with attention deficit disorders
   - Users with learning disabilities
   - Users with memory impairments

#### Recruitment Sources
- Accessibility organizations and advocacy groups
- Disability support services
- Social media accessibility communities
- Professional accessibility testers

### Test Scenarios

#### Complete User Journey
```typescript
const userTestScenarios = [
  {
    name: "New Client Beauty Service Booking",
    userGoals: [
      "Explore available beauty services",
      "Find service that meets needs",
      "Book appointment for suitable time",
      "Complete booking with accessibility needs"
    ],
    successMetrics: [
      "Task completion rate",
      "Time to completion",
      "Error rate",
      "Satisfaction score",
      "Accessibility barriers encountered"
    ]
  },
  {
    name: "Returning Client Booking",
    userGoals: [
      "Log into account",
      "View previous services",
      "Book repeat service",
      "Modify accessibility requirements"
    ],
    successMetrics: [
      "Navigation efficiency",
      "Information findability",
      "Form completion success"
    ]
  }
]
```

#### Test Protocol

1. **Pre-Test Interview** (15 minutes)
   - Understand user's assistive technology setup
   - Discuss accessibility needs and preferences
   - Explain test process and objectives

2. **Task Performance** (45-60 minutes)
   - Observe user completing scenarios
   - Note barriers and workarounds
   - Record emotional responses and frustrations

3. **Post-Test Interview** (15-20 minutes)
   - Debrief on experience
   - Collect specific feedback
   - Suggest improvements

#### Data Collection

```typescript
interface UserTestResult {
  participant: {
    disabilityType: string[]
    assistiveTechnology: string[]
    experienceLevel: 'beginner' | 'intermediate' | 'expert'
  }

  taskResults: {
    scenario: string
    completed: boolean
    timeToComplete: number
    errors: number
    barriers: string[]
    workarounds: string[]
    satisfactionScore: number // 1-5 scale
  }

  qualitativeFeedback: {
    positiveExperiences: string[]
    painPoints: string[]
    suggestions: string[]
    emotionalResponse: string[]
  }

  accessibilityIssues: {
    wcagCriterion: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    impact: string
    suggestedFix: string
  }[]
}
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/accessibility.yml
name: Accessibility Testing

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM

jobs:
  accessibility-audit:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

      - name: Run automated accessibility tests
        run: npm run test:a11y:ci

      - name: Run axe-core audit
        run: npx axe --dist dist --tags wcag2a,wcag2aa --exit

      - name: Run Lighthouse accessibility audit
        run: npm run lighthouse:a11y

      - name: Generate accessibility report
        run: npm run a11y:report

      - name: Upload accessibility reports
        uses: actions/upload-artifact@v4
        with:
          name: accessibility-reports
          path: accessibility-reports/
          retention-days: 30

      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            // Generate PR comment with accessibility results
```

### Quality Gates

#### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged && npm run test:a11y -- --passWithNoTests",
      "pre-push": "npm run test:a11y:e2e -- --passWithNoTests"
    }
  },
  "lint-staged": {
    "*.{tsx,ts}": [
      "eslint --fix",
      "jest --watchAll=false --findRelatedTests --testPathPattern=a11y"
    ]
  }
}
```

#### Release Criteria
- Zero critical accessibility violations
- Accessibility score ≥ 85%
- All manual accessibility test cases pass
- User testing with disabilities completed for major features

## Reporting & Documentation

### Accessibility Dashboard

#### Key Metrics Display
```typescript
interface AccessibilityDashboard {
  overview: {
    currentScore: number
    trend: 'improving' | 'stable' | 'declining'
    lastAudit: string
    totalIssues: number
    criticalIssues: number
  }

  compliance: {
    wcagLevelA: boolean
    wcagLevelAA: boolean
    wcagLevelAAA: boolean
    section508: boolean
  }

  issues: {
    byCategory: Record<string, number>
    bySeverity: Record<string, number>
    byPage: Record<string, number>
    trendData: Array<{
      date: string
      critical: number
      serious: number
      score: number
    }>
  }

  userMetrics: {
    assistiveTechnologyUsage: Record<string, number>
    completionRates: Record<string, number>
    satisfactionScores: Record<string, number>
  }
}
```

### Accessibility Statement Template

```markdown
# Accessibility Statement for Mariia Hub

## Commitment to Accessibility

Mariia Hub is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.

## Compliance Status

The [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/standards-guidelines/wcag/) define requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA. Mariia Hub is partially conformant with WCAG 2.1 level AA. Partially conformant means that some parts of the content do not fully conform to the accessibility standard.

## Feedback

We welcome your feedback on the accessibility of Mariia Hub. Please let us know if you encounter accessibility barriers on Mariia Hub:

- Email: accessibility@mariaborysevych.com
- Phone: [Your phone number]
- Visit us: [Your address]

## Accessibility Features

Mariia Hub includes the following accessibility features:

- Screen reader compatibility
- Keyboard navigation support
- High contrast mode compatibility
- Text resizing support
- Voice control compatibility
- Touch-friendly interface

## Technical Specifications

Accessibility of Mariia Hub relies on the following technologies to work with the particular combination of web browser and any assistive technologies or plugins installed on your computer:

- HTML5
- WAI-ARIA
- CSS3
- JavaScript

## Limitations and Alternatives

Despite our best efforts to ensure accessibility of Mariia Hub, there may be some limitations. Below is a description of known limitations, and potential solutions. Please contact us if you observe an issue not listed below.

Known limitations:
- [List known limitations]
- Alternative access options available

## Assessment Approach

Mariia Hub assessed the accessibility of by the following approaches:
- Self-evaluation
- External professional evaluation
- User testing with people with disabilities
- Automated accessibility testing

## Formal Complaints

You can file a formal complaint by [complaint procedure].
```

### Monthly Accessibility Report

```typescript
interface MonthlyAccessibilityReport {
  reportingPeriod: {
    startDate: string
    endDate: string
  }

  executiveSummary: {
    overallScore: number
    criticalIssuesCount: number
    complianceStatus: string
    keyAchievements: string[]
    majorChallenges: string[]
  }

  detailedMetrics: {
    automatedTesting: {
      testsRun: number
      passRate: number
      violationsByType: Record<string, number>
    }

    manualTesting: {
      pagesTested: number
      issuesFound: number
      issuesResolved: number
    }

    userTesting: {
      participantsCount: number
      satisfactionScore: number
      completionRates: Record<string, number>
      feedbackSummary: string
    }
  }

  complianceStatus: {
    wcag21AA: {
      compliant: boolean
      issues: string[]
      recommendations: string[]
    }
  }

  roadmap: {
    nextMonthPriorities: string[]
    longTermGoals: string[]
    resourceRequirements: string[]
  }
}
```

## Continuous Improvement

### Accessibility Roadmap

#### Short-term Goals (1-3 months)
- [ ] Achieve 95% WCAG AA compliance across all pages
- [ ] Implement automated accessibility testing in CI/CD
- [ ] Conduct user testing with 10+ disabled participants
- [ ] Establish accessibility governance process

#### Medium-term Goals (3-6 months)
- [ ] Achieve WCAG AAA compliance for critical user paths
- [ ] Implement real-time accessibility monitoring
- [ ] Create accessibility training program for development team
- [ ] Establish accessibility user testing panel

#### Long-term Goals (6-12 months)
- [ ] Industry-leading accessibility standards
- [ ] Accessibility innovation and thought leadership
- [ ] Comprehensive accessibility certification
- [ ] Open source accessibility tools contribution

### Team Training

#### Developer Training Program

```typescript
interface AccessibilityTrainingModule {
  title: string
  duration: number // minutes
  audience: 'developers' | 'designers' | 'product' | 'all'
  format: 'workshop' | 'video' | 'documentation' | 'quiz'
  content: {
    topics: string[]
    handsOnExercises: string[]
    assessmentCriteria: string[]
  }
  prerequisites: string[]
  learningObjectives: string[]
}

const trainingModules: AccessibilityTrainingModule[] = [
  {
    title: "Accessibility Fundamentals for Developers",
    duration: 120,
    audience: 'developers',
    format: 'workshop',
    content: {
      topics: [
        "WCAG 2.1 Guidelines Overview",
        "Semantic HTML and ARIA",
        "Keyboard Navigation Implementation",
        "Color Contrast and Visual Accessibility"
      ],
      handsOnExercises: [
        "Make a React component accessible",
        "Fix accessibility violations in sample code",
        "Test with screen readers"
      ],
      assessmentCriteria: [
        "Can identify accessibility issues",
        "Can implement accessible components",
        "Can test with assistive technology"
      ]
    },
    prerequisites: ["Basic HTML/CSS/JavaScript knowledge"],
    learningObjectives: [
      "Understand WCAG principles",
      "Implement accessible React components",
      "Test accessibility effectively"
    ]
  }
]
```

### Accessibility Governance

#### Governance Structure
```typescript
interface AccessibilityGovernance {
  roles: {
    accessibilityLead: {
      responsibilities: string[]
      qualifications: string[]
      reportingStructure: string
    }

    accessibilityChampions: {
      team: string[]
      responsibilities: string[]
      training: string[]
    }

    developmentTeam: {
      responsibilities: string[]
      trainingRequirements: string[]
      kpis: string[]
    }
  }

  processes: {
    designReview: {
      frequency: string
      participants: string[]
      checklist: string[]
      approvalProcess: string
    }

    codeReview: {
      accessibilityChecklist: string[]
      automatedChecks: string[]
      manualReview: string[]
    }

    releaseProcess: {
      accessibilityGates: string[]
      rollbackCriteria: string[]
      incidentResponse: string[]
    }
  }

  policies: {
    accessibilityPolicy: string
    procurementPolicy: string
    vendorAccessibilityRequirements: string
    incidentManagementPolicy: string
  }
}
```

### Performance Incentives

#### Team KPIs
- Accessibility compliance score (>95%)
- User testing with disabilities completion rate (>90%)
- Accessibility issue resolution time (<48 hours for critical)
- Team accessibility training completion (100%)

#### Individual Recognition
- Accessibility Champion awards
- Innovation in accessibility recognition
- Community contribution acknowledgment

This comprehensive accessibility testing guide provides the foundation for maintaining exceptional accessibility standards at Mariia Hub. Regular updates and continuous improvement ensure we remain at the forefront of digital accessibility in the beauty and fitness industry.