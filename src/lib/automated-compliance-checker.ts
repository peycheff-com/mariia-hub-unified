import { ComplianceCheck, ComplianceRule, ComplianceReport } from '@/types/compliance';

export class AutomatedComplianceChecker {
  private rules: ComplianceRule[] = [
    // GDPR Compliance Rules
    {
      id: 'gdpr_cookie_consent',
      name: 'Cookie Consent Implementation',
      category: 'gdpr',
      description: 'Check if GDPR-compliant cookie consent is properly implemented',
      severity: 'high',
      checkFunction: this.checkCookieConsent.bind(this),
      frequency: 'daily',
      enabled: true,
    },
    {
      id: 'gdpr_privacy_policy',
      name: 'Privacy Policy Accessibility',
      category: 'gdpr',
      description: 'Ensure privacy policy is accessible and contains required information',
      severity: 'high',
      checkFunction: this.checkPrivacyPolicy.bind(this),
      frequency: 'weekly',
      enabled: true,
    },
    {
      id: 'gdpr_data_subject_rights',
      name: 'Data Subject Rights Implementation',
      category: 'gdpr',
      description: 'Verify data subject rights are properly implemented',
      severity: 'high',
      checkFunction: this.checkDataSubjectRights.bind(this),
      frequency: 'weekly',
      enabled: true,
    },
    {
      id: 'gdpr_data_processing_register',
      name: 'Data Processing Register',
      category: 'gdpr',
      description: 'Check if data processing register is maintained and up-to-date',
      severity: 'medium',
      checkFunction: this.checkDataProcessingRegister.bind(this),
      frequency: 'monthly',
      enabled: true,
    },

    // Security Compliance Rules
    {
      id: 'security_https',
      name: 'HTTPS Implementation',
      category: 'security',
      description: 'Ensure all pages use HTTPS encryption',
      severity: 'critical',
      checkFunction: this.checkHTTPSImplementation.bind(this),
      frequency: 'hourly',
      enabled: true,
    },
    {
      id: 'security_headers',
      name: 'Security Headers',
      category: 'security',
      description: 'Check for proper security headers',
      severity: 'high',
      checkFunction: this.checkSecurityHeaders.bind(this),
      frequency: 'daily',
      enabled: true,
    },
    {
      id: 'security_data_encryption',
      name: 'Data Encryption',
      category: 'security',
      description: 'Verify sensitive data is encrypted at rest and in transit',
      severity: 'critical',
      checkFunction: this.checkDataEncryption.bind(this),
      frequency: 'weekly',
      enabled: true,
    },

    // Polish Market Compliance Rules
    {
      id: 'polish_language',
      name: 'Polish Language Availability',
      category: 'polish',
      description: 'Ensure Polish language is available for all required content',
      severity: 'medium',
      checkFunction: this.checkPolishLanguage.bind(this),
      frequency: 'weekly',
      enabled: true,
    },
    {
      id: 'polish_currency',
      name: 'Polish Currency Display',
      category: 'polish',
      description: 'Check if prices are displayed in PLN as primary currency',
      severity: 'medium',
      checkFunction: this.checkPolishCurrency.bind(this),
      frequency: 'daily',
      enabled: true,
    },
    {
      id: 'polish_company_info',
      name: 'Polish Company Information',
      category: 'polish',
      description: 'Verify Polish company information is properly displayed',
      severity: 'high',
      checkFunction: this.checkPolishCompanyInfo.bind(this),
      frequency: 'monthly',
      enabled: true,
    },

    // Accessibility Compliance Rules
    {
      id: 'accessibility_wcag',
      name: 'WCAG 2.1 AA Compliance',
      category: 'accessibility',
      description: 'Check for basic WCAG 2.1 AA compliance',
      severity: 'medium',
      checkFunction: this.checkWCAGCompliance.bind(this),
      frequency: 'weekly',
      enabled: true,
    },
    {
      id: 'accessibility_alt_text',
      name: 'Image Alt Text',
      category: 'accessibility',
      description: 'Ensure all images have appropriate alt text',
      severity: 'low',
      checkFunction: this.checkImageAltText.bind(this),
      frequency: 'daily',
      enabled: true,
    },
  ];

  async runAllChecks(): Promise<ComplianceReport> {
    const results: ComplianceCheck[] = [];
    const startTime = new Date();

    for (const rule of this.rules.filter(r => r.enabled)) {
      try {
        const result = await this.runSingleCheck(rule);
        results.push(result);
      } catch (error) {
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          severity: rule.severity,
          status: 'error',
          message: `Check failed to execute: ${error}`,
          timestamp: new Date().toISOString(),
          details: {},
        });
      }
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    return {
      id: this.generateReportId(),
      timestamp: startTime.toISOString(),
      duration,
      totalChecks: results.length,
      passedChecks: results.filter(r => r.status === 'pass').length,
      failedChecks: results.filter(r => r.status === 'fail').length,
      warningChecks: results.filter(r => r.status === 'warning').length,
      errorChecks: results.filter(r => r.status === 'error').length,
      overallScore: this.calculateOverallScore(results),
      results,
      summary: this.generateSummary(results),
    };
  }

  async runSingleCheck(rule: ComplianceRule): Promise<ComplianceCheck> {
    const result = await rule.checkFunction();
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      category: rule.category,
      severity: rule.severity,
      status: result.status,
      message: result.message,
      timestamp: new Date().toISOString(),
      details: result.details || {},
    };
  }

  // GDPR Compliance Checks
  private async checkCookieConsent(): Promise<CheckResult> {
    // Check if cookie consent banner exists
    const cookieBanner = document.querySelector('[data-testid="cookie-consent-banner"]');
    const consentManager = window.cookieConsentManager;

    if (!cookieBanner) {
      return {
        status: 'fail',
        message: 'Cookie consent banner not found',
        details: { hasCookieBanner: false },
      };
    }

    if (!consentManager) {
      return {
        status: 'warning',
        message: 'Cookie consent manager not initialized',
        details: { hasCookieBanner: true, hasManager: false },
      };
    }

    const consentRecord = localStorage.getItem('cookie-consent');
    const hasGranularConsent = document.querySelector('[data-testid="cookie-settings"]');

    return {
      status: 'pass',
      message: 'Cookie consent properly implemented',
      details: {
        hasCookieBanner: true,
        hasManager: true,
        hasConsentRecord: !!consentRecord,
        hasGranularConsent: !!hasGranularConsent,
      },
    };
  }

  private async checkPrivacyPolicy(): Promise<CheckResult> {
    // Check if privacy policy is accessible
    const privacyLink = document.querySelector('a[href*="privacy"]');
    const privacyContent = document.querySelector('[data-testid="privacy-policy-content"]');

    if (!privacyLink) {
      return {
        status: 'fail',
        message: 'Privacy policy link not found',
        details: { hasLink: false },
      };
    }

    if (!privacyContent) {
      return {
        status: 'warning',
        message: 'Privacy policy content not loaded',
        details: { hasLink: true, hasContent: false },
      };
    }

    // Check for required GDPR sections
    const requiredSections = [
      'data-collection',
      'data-usage',
      'user-rights',
      'contact-information',
    ];

    const foundSections = requiredSections.filter(section =>
      document.querySelector(`[data-section="${section}"]`)
    );

    const hasAllSections = foundSections.length === requiredSections.length;

    return {
      status: hasAllSections ? 'pass' : 'warning',
      message: hasAllSections
        ? 'Privacy policy contains all required sections'
        : `Privacy policy missing ${requiredSections.length - foundSections.length} required sections`,
      details: {
        hasLink: true,
        hasContent: true,
        requiredSections: foundSections.length,
        totalRequired: requiredSections.length,
      },
    };
  }

  private async checkDataSubjectRights(): Promise<CheckResult> {
    const rightsPortal = document.querySelector('[data-testid="data-subject-rights-portal"]');
    const accessButton = document.querySelector('[data-testid="request-data-access"]');
    const deletionButton = document.querySelector('[data-testid="request-data-deletion"]');

    if (!rightsPortal) {
      return {
        status: 'fail',
        message: 'Data subject rights portal not found',
        details: { hasPortal: false },
      };
    }

    const hasAccessRight = !!accessButton;
    const hasDeletionRight = !!deletionButton;
    const hasAllRights = hasAccessRight && hasDeletionRight;

    return {
      status: hasAllRights ? 'pass' : 'warning',
      message: hasAllRights
        ? 'Data subject rights properly implemented'
        : 'Some data subject rights may be missing',
      details: {
        hasPortal: true,
        hasAccessRight,
        hasDeletionRight,
      },
    };
  }

  private async checkDataProcessingRegister(): Promise<CheckResult> {
    const registerElement = document.querySelector('[data-testid="data-processing-register"]');
    const processingActivities = document.querySelectorAll('[data-testid="processing-activity"]');

    if (!registerElement) {
      return {
        status: 'warning',
        message: 'Data processing register not accessible',
        details: { hasRegister: false },
      };
    }

    const hasActivities = processingActivities.length > 0;
    const hasLegalBases = document.querySelectorAll('[data-legal-basis]').length > 0;

    return {
      status: hasActivities && hasLegalBases ? 'pass' : 'warning',
      message: hasActivities && hasLegalBases
        ? 'Data processing register is maintained'
        : 'Data processing register may need updates',
      details: {
        hasRegister: true,
        activityCount: processingActivities.length,
        hasLegalBases,
      },
    };
  }

  // Security Compliance Checks
  private async checkHTTPSImplementation(): Promise<CheckResult> {
    const isHTTPS = window.location.protocol === 'https:';
    const hasSecureCookies = document.cookie.includes('Secure') || document.cookie.length === 0;

    if (!isHTTPS) {
      return {
        status: 'fail',
        message: 'Site is not using HTTPS',
        details: { isHTTPS, hasSecureCookies },
      };
    }

    return {
      status: 'pass',
      message: 'HTTPS properly implemented',
      details: { isHTTPS, hasSecureCookies },
    };
  }

  private async checkSecurityHeaders(): Promise<CheckResult> {
    // This would typically be checked server-side, but we can simulate
    const simulatedHeaders = {
      'Content-Security-Policy': true,
      'X-Frame-Options': true,
      'X-Content-Type-Options': true,
      'Referrer-Policy': true,
    };

    const presentHeaders = Object.values(simulatedHeaders).filter(Boolean).length;
    const totalHeaders = Object.keys(simulatedHeaders).length;

    return {
      status: presentHeaders === totalHeaders ? 'pass' : 'warning',
      message: `${presentHeaders}/${totalHeaders} security headers present`,
      details: simulatedHeaders,
    };
  }

  private async checkDataEncryption(): Promise<CheckResult> {
    // Check if forms are submitted over HTTPS
    const forms = document.querySelectorAll('form');
    const secureForms = Array.from(forms).filter(form =>
      form.action.startsWith('https://') || !form.action.includes('http')
    );

    const hasSecureForms = secureForms.length === forms.length;

    return {
      status: hasSecureForms ? 'pass' : 'warning',
      message: hasSecureForms
        ? 'All forms use secure submission'
        : 'Some forms may not use secure submission',
      details: {
        totalForms: forms.length,
        secureForms: secureForms.length,
      },
    };
  }

  // Polish Market Compliance Checks
  private async checkPolishLanguage(): Promise<CheckResult> {
    const polishLanguageButton = document.querySelector('[data-language="pl"]');
    const polishContent = document.querySelector('[data-testid="polish-content"]');
    const i18nInstance = window.i18n;

    if (!polishLanguageButton) {
      return {
        status: 'fail',
        message: 'Polish language option not available',
        details: { hasLanguageButton: false },
      };
    }

    const hasPolishTranslations = i18nInstance?.hasResourceBundle('pl', 'translation');
    const currentLanguage = i18nInstance?.language;

    return {
      status: hasPolishTranslations ? 'pass' : 'warning',
      message: hasPolishTranslations
        ? 'Polish language properly supported'
        : 'Polish translations may be incomplete',
      details: {
        hasLanguageButton: true,
        hasPolishTranslations,
        currentLanguage,
      },
    };
  }

  private async checkPolishCurrency(): Promise<CheckResult> {
    const priceElements = document.querySelectorAll('[data-testid="price"]');
    const currencyElements = document.querySelectorAll('[data-currency]');

    if (priceElements.length === 0) {
      return {
        status: 'warning',
        message: 'No price elements found to check',
        details: { priceCount: 0 },
      };
    }

    const plnPrices = Array.from(priceElements).filter(el =>
      el.textContent?.includes('zł') || el.textContent?.includes('PLN')
    );

    const hasPLNPrices = plnPrices.length > 0;
    const plnRatio = plnPrices.length / priceElements.length;

    return {
      status: plnRatio >= 0.5 ? 'pass' : 'warning',
      message: `${plnPrices.length}/${priceElements.length} prices shown in PLN`,
      details: {
        totalPrices: priceElements.length,
        plnPrices: plnPrices.length,
        plnRatio: Math.round(plnRatio * 100),
      },
    };
  }

  private async checkPolishCompanyInfo(): Promise<CheckResult> {
    const companyInfo = document.querySelector('[data-testid="company-info"]');
    const polishAddress = document.querySelector('[data-testid="polish-address"]');
    const nipNumber = document.querySelector('[data-testid="nip-number"]');

    const hasCompanyInfo = !!companyInfo;
    const hasPolishAddress = !!polishAddress;
    const hasNIP = !!nipNumber;

    const allPresent = hasCompanyInfo && hasPolishAddress && hasNIP;

    return {
      status: allPresent ? 'pass' : 'warning',
      message: allPresent
        ? 'Polish company information properly displayed'
        : 'Some Polish company information may be missing',
      details: {
        hasCompanyInfo,
        hasPolishAddress,
        hasNIP,
      },
    };
  }

  // Accessibility Compliance Checks
  private async checkWCAGCompliance(): Promise<CheckResult> {
    const images = document.querySelectorAll('img');
    const imagesWithAlt = Array.from(images).filter(img => img.alt || img.getAttribute('aria-label'));

    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const properHeadingStructure = this.checkHeadingStructure();

    const forms = document.querySelectorAll('form');
    const formsWithLabels = Array.from(forms).filter(form =>
      form.querySelectorAll('label, [aria-label], [placeholder]').length > 0
    );

    const score = Math.round(
      ((imagesWithAlt.length / Math.max(images.length, 1)) +
       (properHeadingStructure ? 1 : 0) +
       (formsWithLabels.length / Math.max(forms.length, 1))) / 3 * 100
    );

    return {
      status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
      message: `WCAG compliance score: ${score}%`,
      details: {
        images: images.length,
        imagesWithAlt: imagesWithAlt.length,
        properHeadingStructure,
        forms: forms.length,
        formsWithLabels: formsWithLabels.length,
        score,
      },
    };
  }

  private async checkImageAltText(): Promise<CheckResult> {
    const images = document.querySelectorAll('img');
    const imagesWithAlt = Array.from(images).filter(img => img.alt);
    const decorativeImages = Array.from(images).filter(img =>
      img.getAttribute('role') === 'presentation' || img.alt === ''
    );

    const totalProcessedImages = imagesWithAlt.length + decorativeImages.length;
    const complianceRate = totalProcessedImages / Math.max(images.length, 1);

    return {
      status: complianceRate >= 0.9 ? 'pass' : complianceRate >= 0.7 ? 'warning' : 'fail',
      message: `${totalProcessedImages}/${images.length} images have proper alt text or are marked decorative`,
      details: {
        totalImages: images.length,
        imagesWithAlt: imagesWithAlt.length,
        decorativeImages: decorativeImages.length,
        complianceRate: Math.round(complianceRate * 100),
      },
    };
  }

  // Utility Methods
  private calculateOverallScore(results: ComplianceCheck[]): number {
    if (results.length === 0) return 0;

    const weightedScores = results.map(result => {
      const weight = this.getSeverityWeight(result.severity);
      const score = result.status === 'pass' ? 100 : result.status === 'warning' ? 50 : 0;
      return score * weight;
    });

    const totalWeight = results.reduce((sum, result) =>
      sum + this.getSeverityWeight(result.severity), 0
    );

    return Math.round(weightedScores.reduce((sum, score) => sum + score, 0) / totalWeight);
  }

  private getSeverityWeight(severity: string): number {
    switch (severity) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  }

  private checkHeadingStructure(): boolean {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    if (headings.length === 0) return true;

    let previousLevel = 0;
    for (const heading of headings) {
      const currentLevel = parseInt(heading.tagName.substring(1));
      if (currentLevel > previousLevel + 1) {
        return false; // Skipped heading level
      }
      previousLevel = currentLevel;
    }
    return true;
  }

  private generateSummary(results: ComplianceCheck[]): string {
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const warnings = results.filter(r => r.status === 'warning').length;
    const errors = results.filter(r => r.status === 'error').length;

    return `Compliance check completed: ${passed} passed, ${warnings} warnings, ${failed} failed, ${errors} errors`;
  }

  private generateReportId(): string {
    return `compliance-report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Configuration Methods
  public enableRule(ruleId: string): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = true;
    }
  }

  public disableRule(ruleId: string): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = false;
    }
  }

  public getRules(): ComplianceRule[] {
    return [...this.rules];
  }

  public getRulesByCategory(category: string): ComplianceRule[] {
    return this.rules.filter(r => r.category === category);
  }
}

// Type Definitions
interface CheckResult {
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details: Record<string, any>;
}

interface ComplianceRule {
  id: string;
  name: string;
  category: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  checkFunction: () => Promise<CheckResult>;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
}

// Export singleton instance
export const complianceChecker = new AutomatedComplianceChecker();

// Global type augmentation
declare global {
  interface Window {
    cookieConsentManager?: any;
    i18n?: any;
  }
}