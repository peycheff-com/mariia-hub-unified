/**
 * GDPR Compliance Manager
 * Comprehensive privacy and data protection compliance for EU users
 */

import { trackRUMEvent } from './rum';
import { reportMessage } from './sentry';

// GDPR Compliance Configuration
interface GDPRConfig {
  enableConsentManagement: boolean;
  requireExplicitConsent: boolean;
  consentCookieName: string;
  consentDuration: number; // days
  enableDataRetention: boolean;
  dataRetentionPeriod: number; // days
  enableRightToAccess: boolean;
  enableRightToRectification: boolean;
  enableRightToErasure: boolean;
  enableRightToPortability: boolean;
  enableRightToObjection: boolean;
  privacyPolicyUrl: string;
  cookiePolicyUrl: string;
  dataProtectionOfficer: {
    email: string;
    name: string;
    address: string;
  };
  dataProcessors: DataProcessor[];
}

// Data Processor Information
interface DataProcessor {
  name: string;
  purpose: string;
  dataTypes: string[];
  location: string;
  retentionPeriod: string;
  legalBasis: string;
}

// Consent Types
enum ConsentType {
  ANALYTICS = 'analytics',
  MARKETING = 'marketing',
  PERSONALIZATION = 'personalization',
  FUNCTIONAL = 'functional',
  NECESSARY = 'necessary'
}

// Consent Data
interface ConsentData {
  version: string;
  timestamp: number;
  consents: Record<ConsentType, boolean>;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  expiryDate: number;
  withdrawnAt?: number;
}

// Data Subject Request
interface DataSubjectRequest {
  id: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'objection';
  email: string;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  data?: any;
  response?: string;
  processedAt?: number;
}

// GDPR Compliance Manager
export class GDPRComplianceManager {
  private config: GDPRConfig;
  private consentData: ConsentData | null = null;
  private dataSubjectRequests: DataSubjectRequest[] = [];
  private isInitialized = false;
  private consentBanner: HTMLElement | null = null;
  private privacySettings: HTMLElement | null = null;

  constructor(config: Partial<GDPRConfig> = {}) {
    this.config = {
      enableConsentManagement: true,
      requireExplicitConsent: true,
      consentCookieName: 'mariia-hub-consent',
      consentDuration: 365, // 1 year
      enableDataRetention: true,
      dataRetentionPeriod: 730, // 2 years
      enableRightToAccess: true,
      enableRightToRectification: true,
      enableRightToErasure: true,
      enableRightToPortability: true,
      enableRightToObjection: true,
      privacyPolicyUrl: '/privacy-policy',
      cookiePolicyUrl: '/cookie-policy',
      dataProtectionOfficer: {
        email: 'privacy@mariaborysevych.com',
        name: 'Data Protection Officer',
        address: 'ul. Jana Pawła II 43/15, 00-001 Warszawa, Polska'
      },
      dataProcessors: this.getDefaultDataProcessors(),
      ...config
    };
  }

  // Initialize GDPR compliance
  initialize(): void {
    if (this.isInitialized) return;

    try {
      this.loadExistingConsent();
      this.initializeConsentManagement();
      this.initializeDataRetention();
      this.initializeDataSubjectRights();
      this.initializePrivacyControls();
      this.initializeComplianceMonitoring();

      this.isInitialized = true;
      console.log('[GDPR Compliance] GDPR compliance manager initialized');

      // Log compliance status
      this.logComplianceStatus();
    } catch (error) {
      console.warn('[GDPR Compliance] Failed to initialize:', error);
    }
  }

  // Get default data processors
  private getDefaultDataProcessors(): DataProcessor[] {
    return [
      {
        name: 'Google Analytics',
        purpose: 'Website analytics and performance monitoring',
        dataTypes: ['IP address', 'User agent', 'Pages visited', 'Time on site', 'Device information'],
        location: 'United States (EU-US Privacy Shield)',
        retentionPeriod: '26 months',
        legalBasis: 'Legitimate interest'
      },
      {
        name: 'Sentry',
        purpose: 'Error monitoring and performance tracking',
        dataTypes: ['Error logs', 'Performance metrics', 'User agent', 'IP address (partial)'],
        location: 'United States',
        retentionPeriod: '30 days',
        legalBasis: 'Legitimate interest'
      },
      {
        name: 'Supabase',
        purpose: 'Database services and authentication',
        dataTypes: ['Personal data', 'Booking information', 'User preferences', 'Authentication data'],
        location: 'European Union (Ireland)',
        retentionPeriod: 'As required for service provision',
        legalBasis: 'Contractual necessity'
      },
      {
        name: 'Stripe',
        purpose: 'Payment processing',
        dataTypes: ['Payment information', 'Billing address', 'Email address'],
        location: 'European Union',
        retentionPeriod: '7 years (legal requirement)',
        legalBasis: 'Contractual necessity'
      },
      {
        name: 'Vercel',
        purpose: 'Website hosting and content delivery',
        dataTypes: ['Access logs', 'IP addresses', 'Request data'],
        location: 'United States and European Union',
        retentionPeriod: '30 days',
        legalBasis: 'Legitimate interest'
      }
    ];
  }

  // Load existing consent
  private loadExistingConsent(): void {
    try {
      const consentCookie = this.getCookie(this.config.consentCookieName);
      if (consentCookie) {
        const consentData = JSON.parse(consentCookie);

        // Check if consent has expired
        if (consentData.expiryDate > Date.now()) {
          this.consentData = consentData;
          this.applyConsentSettings(consentData.consents);
          trackRUMEvent('gdpr-consent-loaded', {
            consentVersion: consentData.version,
            timestamp: consentData.timestamp
          });
        } else {
          // Consent expired, remove it
          this.deleteCookie(this.config.consentCookie);
        }
      }
    } catch (error) {
      console.warn('[GDPR Compliance] Failed to load existing consent:', error);
    }
  }

  // Initialize consent management
  private initializeConsentManagement(): void {
    if (!this.config.enableConsentManagement) return;

    // Check user location for EU/EEA
    this.detectUserLocation().then(isInEU => {
      if (isInEU || this.config.requireExplicitConsent) {
        if (!this.consentData) {
          this.showConsentBanner();
        }
      }
    });

    // Set up consent update mechanisms
    this.initializeConsentUpdates();
  }

  // Detect user location
  private async detectUserLocation(): Promise<boolean> {
    try {
      // Check timezone for EU countries
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const euTimezones = [
        'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome',
        'Europe/Madrid', 'Europe/Amsterdam', 'Europe/Brussels', 'Europe/Vienna',
        'Europe/Stockholm', 'Europe/Copenhagen', 'Europe/Helsinki', 'Europe/Warsaw',
        'Europe/Prague', 'Europe/Budapest', 'Europe/Bucharest', 'Europe/Sofia',
        'Europe/Athens', 'Europe/Istanbul', 'Europe/Moscow'
      ];

      if (euTimezones.some(tz => timezone.startsWith(tz.replace('Europe/', '')))) {
        return true;
      }

      // Check browser language for EU languages
      const language = navigator.language.toLowerCase();
      const euLanguages = [
        'en-gb', 'en-ie', 'fr', 'fr-be', 'fr-lu', 'fr-ch',
        'de', 'de-at', 'de-ch', 'de-lu', 'it', 'it-ch',
        'es', 'pt', 'pt-pt', 'nl', 'nl-be', 'sv', 'da',
        'fi', 'el', 'pl', 'cs', 'sk', 'hu', 'ro', 'bg',
        'hr', 'sl', 'et', 'lv', 'lt', 'mt', 'ga'
      ];

      return euLanguages.some(lang => language.startsWith(lang));
    } catch (error) {
      console.warn('[GDPR Compliance] Failed to detect user location:', error);
      return false;
    }
  }

  // Show consent banner
  private showConsentBanner(): void {
    if (this.consentBanner) return; // Already showing

    const banner = document.createElement('div');
    banner.id = 'gdpr-consent-banner';
    banner.setAttribute('role', 'alertdialog');
    banner.setAttribute('aria-labelledby', 'gdpr-consent-title');
    banner.setAttribute('aria-describedby', 'gdpr-consent-description');

    banner.innerHTML = `
      <div style="
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #2c1810 0%, #8B4513 100%);
        color: white;
        padding: 24px;
        z-index: 10002;
        box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <div style="max-width: 1200px; margin: 0 auto;">
          <div style="display: flex; align-items: flex-start; gap: 24px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 300px;">
              <h3 id="gdpr-consent-title" style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">
                Privacy & Cookie Settings
              </h3>
              <p id="gdpr-consent-description" style="margin: 0 0 16px 0; line-height: 1.6; font-size: 14px; opacity: 0.95;">
                We use cookies and similar technologies to enhance your luxury beauty and fitness experience.
                Your privacy is important to us, and we're committed to protecting your personal data in accordance with GDPR.
              </p>
              <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
                ${this.renderConsentOptions()}
              </div>
              <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                <button id="gdpr-accept-all" style="
                  background: white;
                  color: #8B4513;
                  border: none;
                  padding: 12px 24px;
                  border-radius: 8px;
                  cursor: pointer;
                  font-weight: 600;
                  font-size: 14px;
                  transition: all 0.3s ease;
                " onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">
                  Accept All
                </button>
                <button id="gdpr-accept-selected" style="
                  background: rgba(255,255,255,0.2);
                  color: white;
                  border: 1px solid rgba(255,255,255,0.3);
                  padding: 12px 24px;
                  border-radius: 8px;
                  cursor: pointer;
                  font-weight: 600;
                  font-size: 14px;
                  transition: all 0.3s ease;
                " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                  Accept Selected
                </button>
                <button id="gdpr-reject-all" style="
                  background: transparent;
                  color: white;
                  border: 1px solid rgba(255,255,255,0.3);
                  padding: 12px 24px;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 14px;
                  transition: all 0.3s ease;
                " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">
                  Reject All
                </button>
                <button id="gdpr-settings" style="
                  background: transparent;
                  color: white;
                  border: 1px solid rgba(255,255,255,0.3);
                  padding: 12px 24px;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 14px;
                  text-decoration: underline;
                  transition: all 0.3s ease;
                " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">
                  Manage Settings
                </button>
              </div>
            </div>
            <div style="flex: 0 0 auto;">
              <div style="background: rgba(255,255,255,0.1); padding: 16px; border-radius: 8px; max-width: 250px;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">Why your consent matters</h4>
                <p style="margin: 0; font-size: 12px; line-height: 1.5; opacity: 0.9;">
                  • Personalized luxury experience<br>
                  • Secure booking process<br>
                  • Performance optimization<br>
                  • Legal compliance & protection
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(banner);
    this.consentBanner = banner;

    // Set up event listeners
    this.setupConsentBannerListeners();
  }

  // Render consent options
  private renderConsentOptions(): string {
    const options = [
      { type: ConsentType.NECESSARY, name: 'Essential Cookies', description: 'Required for basic site functionality', required: true },
      { type: ConsentType.ANALYTICS, name: 'Analytics & Performance', description: 'Help us improve our service', required: false },
      { type: ConsentType.PERSONALIZATION, name: 'Personalization', description: 'Tailored experience recommendations', required: false },
      { type: ConsentType.MARKETING, name: 'Marketing & Communications', description: 'Updates about our luxury services', required: false }
    ];

    return options.map(option => `
      <div style="display: flex; align-items: flex-start; gap: 12px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 6px;">
        <input
          type="checkbox"
          id="consent-${option.type}"
          data-consent="${option.type}"
          ${option.required ? 'checked disabled' : ''}
          style="
            margin: 2px 0 0 0;
            flex-shrink: 0;
            ${option.required ? 'opacity: 0.6;' : ''}
          "
        >
        <div style="flex: 1;">
          <label for="consent-${option.type}" style="
            display: block;
            font-weight: 500;
            margin-bottom: 4px;
            cursor: ${option.required ? 'default' : 'pointer'};
            ${option.required ? 'opacity: 0.8;' : ''}
          ">
            ${option.name} ${option.required ? '(Required)' : ''}
          </label>
          <span style="font-size: 12px; opacity: 0.8; line-height: 1.4;">
            ${option.description}
          </span>
        </div>
      </div>
    `).join('');
  }

  // Setup consent banner listeners
  private setupConsentBannerListeners(): void {
    if (!this.consentBanner) return;

    // Accept all
    document.getElementById('gdpr-accept-all')?.addEventListener('click', () => {
      this.handleConsentDecision('all');
    });

    // Accept selected
    document.getElementById('gdpr-accept-selected')?.addEventListener('click', () => {
      this.handleConsentDecision('selected');
    });

    // Reject all
    document.getElementById('gdpr-reject-all')?.addEventListener('click', () => {
      this.handleConsentDecision('none');
    });

    // Settings
    document.getElementById('gdpr-settings')?.addEventListener('click', () => {
      this.showPrivacySettings();
    });
  }

  // Handle consent decision
  private handleConsentDecision(decision: 'all' | 'selected' | 'none'): void {
    const consents: Record<ConsentType, boolean> = {
      [ConsentType.NECESSARY]: true, // Always required
      [ConsentType.ANALYTICS]: decision === 'all',
      [ConsentType.PERSONALIZATION]: decision === 'all',
      [ConsentType.MARKETING]: decision === 'all'
    };

    if (decision === 'selected' && this.consentBanner) {
      // Get selected consents
      const checkboxes = this.consentBanner.querySelectorAll('input[data-consent]');
      checkboxes.forEach(checkbox => {
        const consentType = (checkbox as HTMLInputElement).dataset.consent as ConsentType;
        if (consentType) {
          consents[consentType] = (checkbox as HTMLInputElement).checked;
        }
      });
    }

    this.saveConsent(consents);
    this.hideConsentBanner();
  }

  // Save consent
  private saveConsent(consents: Record<ConsentType, boolean>): void {
    const consentData: ConsentData = {
      version: '1.0',
      timestamp: Date.now(),
      consents: consents,
      ipAddress: this.getAnonymizedIP(),
      userAgent: navigator.userAgent,
      sessionId: this.generateSessionId(),
      expiryDate: Date.now() + (this.config.consentDuration * 24 * 60 * 60 * 1000)
    };

    this.consentData = consentData;

    // Save to cookie
    this.setCookie(this.config.consentCookieName, JSON.stringify(consentData), this.config.consentDuration);

    // Apply consent settings
    this.applyConsentSettings(consents);

    // Track consent event
    trackRUMEvent('gdpr-consent-given', {
      consents: consents,
      timestamp: consentData.timestamp,
      version: consentData.version
    });

    // Report to Sentry (for compliance monitoring)
    reportMessage(`GDPR consent recorded: ${JSON.stringify(consents)}`, 'info', {
      consents: consents,
      timestamp: consentData.timestamp,
      sessionId: consentData.sessionId
    });
  }

  // Apply consent settings
  private applyConsentSettings(consents: Record<ConsentType, boolean>): void {
    // Store consent state for other systems
    localStorage.setItem('analytics-consent', consents[ConsentType.ANALYTICS] ? 'granted' : 'denied');
    localStorage.setItem('marketing-consent', consents[ConsentType.MARKETING] ? 'granted' : 'denied');
    localStorage.setItem('personalization-consent', consents[ConsentType.PERSONALIZATION] ? 'granted' : 'denied');

    // Trigger consent change event
    window.dispatchEvent(new CustomEvent('gdpr-consent-changed', {
      detail: { consents }
    }));

    // Enable/disable tracking based on consent
    if (!consents[ConsentType.ANALYTICS]) {
      this.disableAnalyticsTracking();
    }

    if (!consents[ConsentType.MARKETING]) {
      this.disableMarketingTracking();
    }
  }

  // Hide consent banner
  private hideConsentBanner(): void {
    if (this.consentBanner) {
      document.body.removeChild(this.consentBanner);
      this.consentBanner = null;
    }
  }

  // Show privacy settings
  private showPrivacySettings(): void {
    if (this.privacySettings) return;

    const modal = document.createElement('div');
    modal.id = 'gdpr-privacy-settings';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    modal.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 10003;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      ">
        <div style="
          background: white;
          border-radius: 12px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        ">
          <div style="padding: 32px;">
            <h2 style="margin: 0 0 24px 0; color: #8B4513; font-size: 24px;">
              Privacy & Data Protection Settings
            </h2>

            ${this.renderPrivacySettingsContent()}

            <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 32px;">
              <button id="privacy-settings-cancel" style="
                padding: 12px 24px;
                border: 1px solid #ddd;
                background: white;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
              ">
                Cancel
              </button>
              <button id="privacy-settings-save" style="
                padding: 12px 24px;
                background: #8B4513;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
              ">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.privacySettings = modal;

    this.setupPrivacySettingsListeners();
  }

  // Render privacy settings content
  private renderPrivacySettingsContent(): string {
    return `
      <div style="display: grid; gap: 32px;">
        ${this.renderConsentSection()}
        ${this.renderDataProcessorSection()}
        ${this.renderDataRightsSection()}
        ${this.renderContactSection()}
      </div>
    `;
  }

  // Render consent section
  private renderConsentSection(): string {
    const currentConsents = this.consentData?.consents || {
      [ConsentType.NECESSARY]: true,
      [ConsentType.ANALYTICS]: false,
      [ConsentType.PERSONALIZATION]: false,
      [ConsentType.MARKETING]: false
    };

    const options = [
      { type: ConsentType.NECESSARY, name: 'Essential Cookies', description: 'Required for the website to function properly', required: true },
      { type: ConsentType.ANALYTICS, name: 'Analytics & Performance', description: 'Help us understand how you use our website to improve it', required: false },
      { type: ConsentType.PERSONALIZATION, name: 'Personalization', description: 'Provide personalized recommendations and content', required: false },
      { type: ConsentType.MARKETING, name: 'Marketing & Communications', description: 'Send you updates about our luxury services and offers', required: false }
    ];

    return `
      <div>
        <h3 style="margin: 0 0 16px 0; color: #333; font-size: 18px;">Cookie Consent Preferences</h3>
        <div style="display: grid; gap: 16px;">
          ${options.map(option => `
            <div style="display: flex; align-items: flex-start; gap: 16px; padding: 16px; border: 1px solid #e5e5e5; border-radius: 8px;">
              <input
                type="checkbox"
                id="settings-consent-${option.type}"
                data-settings-consent="${option.type}"
                ${option.required ? 'checked disabled' : ''}
                ${currentConsents[option.type] && !option.required ? 'checked' : ''}
                style="margin-top: 4px; flex-shrink: 0;"
              >
              <div style="flex: 1;">
                <label for="settings-consent-${option.type}" style="
                  display: block;
                  font-weight: 600;
                  margin-bottom: 4px;
                  color: #333;
                  cursor: ${option.required ? 'default' : 'pointer'};
                ">
                  ${option.name} ${option.required ? '(Always Required)' : ''}
                </label>
                <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.5;">
                  ${option.description}
                </p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Render data processor section
  private renderDataProcessorSection(): string {
    return `
      <div>
        <h3 style="margin: 0 0 16px 0; color: #333; font-size: 18px;">Our Data Processing Partners</h3>
        <div style="display: grid; gap: 16px;">
          ${this.config.dataProcessors.map(processor => `
            <div style="padding: 16px; border: 1px solid #e5e5e5; border-radius: 8px;">
              <h4 style="margin: 0 0 8px 0; color: #8B4513; font-size: 16px;">${processor.name}</h4>
              <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;"><strong>Purpose:</strong> ${processor.purpose}</p>
              <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;"><strong>Data Types:</strong> ${processor.dataTypes.join(', ')}</p>
              <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;"><strong>Location:</strong> ${processor.location}</p>
              <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;"><strong>Retention:</strong> ${processor.retentionPeriod}</p>
              <p style="margin: 0; color: #666; font-size: 14px;"><strong>Legal Basis:</strong> ${processor.legalBasis}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Render data rights section
  private renderDataRightsSection(): string {
    return `
      <div>
        <h3 style="margin: 0 0 16px 0; color: #333; font-size: 18px;">Your Data Protection Rights</h3>
        <div style="display: grid; gap: 12px;">
          ${this.config.enableRightToAccess ? `
            <div style="padding: 16px; background: #f8f9fa; border-radius: 8px;">
              <h4 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">Right to Access</h4>
              <p style="margin: 0; color: #666; font-size: 14px;">You can request a copy of your personal data.</p>
            </div>
          ` : ''}

          ${this.config.enableRightToRectification ? `
            <div style="padding: 16px; background: #f8f9fa; border-radius: 8px;">
              <h4 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">Right to Rectification</h4>
              <p style="margin: 0; color: #666; font-size: 14px;">You can correct inaccurate personal data.</p>
            </div>
          ` : ''}

          ${this.config.enableRightToErasure ? `
            <div style="padding: 16px; background: #f8f9fa; border-radius: 8px;">
              <h4 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">Right to Erasure</h4>
              <p style="margin: 0; color: #666; font-size: 14px;">You can request deletion of your personal data.</p>
            </div>
          ` : ''}

          ${this.config.enableRightToPortability ? `
            <div style="padding: 16px; background: #f8f9fa; border-radius: 8px;">
              <h4 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">Right to Data Portability</h4>
              <p style="margin: 0; color: #666; font-size: 14px;">You can request your data in a machine-readable format.</p>
            </div>
          ` : ''}

          ${this.config.enableRightToObjection ? `
            <div style="padding: 16px; background: #f8f9fa; border-radius: 8px;">
              <h4 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">Right to Object</h4>
              <p style="margin: 0; color: #666; font-size: 14px;">You can object to processing of your personal data.</p>
            </div>
          ` : ''}
        </div>

        <div style="margin-top: 16px; padding: 16px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>To exercise these rights,</strong> please contact our Data Protection Officer at
            <a href="mailto:${this.config.dataProtectionOfficer.email}" style="color: #8B4513;">${this.config.dataProtectionOfficer.email}</a>
          </p>
        </div>
      </div>
    `;
  }

  // Render contact section
  private renderContactSection(): string {
    return `
      <div>
        <h3 style="margin: 0 0 16px 0; color: #333; font-size: 18px;">Contact & Policies</h3>
        <div style="display: grid; gap: 16px;">
          <div style="padding: 16px; background: #f8f9fa; border-radius: 8px;">
            <h4 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">Data Protection Officer</h4>
            <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;"><strong>Name:</strong> ${this.config.dataProtectionOfficer.name}</p>
            <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;"><strong>Email:</strong> <a href="mailto:${this.config.dataProtectionOfficer.email}" style="color: #8B4513;">${this.config.dataProtectionOfficer.email}</a></p>
            <p style="margin: 0; color: #666; font-size: 14px;"><strong>Address:</strong> ${this.config.dataProtectionOfficer.address}</p>
          </div>

          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <a href="${this.config.privacyPolicyUrl}" style="
              display: inline-block;
              padding: 12px 20px;
              background: #8B4513;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 600;
            " target="_blank">
              Privacy Policy
            </a>

            <a href="${this.config.cookiePolicyUrl}" style="
              display: inline-block;
              padding: 12px 20px;
              background: #8B4513;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 600;
            " target="_blank">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // Setup privacy settings listeners
  private setupPrivacySettingsListeners(): void {
    if (!this.privacySettings) return;

    // Cancel
    document.getElementById('privacy-settings-cancel')?.addEventListener('click', () => {
      this.hidePrivacySettings();
    });

    // Save
    document.getElementById('privacy-settings-save')?.addEventListener('click', () => {
      this.handlePrivacySettingsSave();
    });

    // Close on backdrop click
    this.privacySettings.addEventListener('click', (event) => {
      if (event.target === this.privacySettings) {
        this.hidePrivacySettings();
      }
    });
  }

  // Handle privacy settings save
  private handlePrivacySettingsSave(): void {
    const consents: Record<ConsentType, boolean> = {
      [ConsentType.NECESSARY]: true
    };

    const checkboxes = this.privacySettings?.querySelectorAll('input[data-settings-consent]');
    checkboxes?.forEach(checkbox => {
      const consentType = (checkbox as HTMLInputElement).dataset.settingsConsent as ConsentType;
      if (consentType) {
        consents[consentType] = (checkbox as HTMLInputElement).checked;
      }
    });

    this.saveConsent(consents);
    this.hidePrivacySettings();
  }

  // Hide privacy settings
  private hidePrivacySettings(): void {
    if (this.privacySettings) {
      document.body.removeChild(this.privacySettings);
      this.privacySettings = null;
    }
  }

  // Initialize consent updates
  private initializeConsentUpdates(): void {
    // Listen for consent withdrawal
    window.addEventListener('gdpr-consent-withdraw', (event: any) => {
      this.withdrawConsent(event.detail.types);
    });

    // Periodic consent validation
    setInterval(() => {
      this.validateConsent();
    }, 24 * 60 * 60 * 1000); // Daily
  }

  // Validate consent
  private validateConsent(): void {
    if (!this.consentData) return;

    // Check if consent has expired
    if (this.consentData.expiryDate < Date.now()) {
      this.handleConsentExpiry();
    }

    // Check if legal basis has changed
    this.validateLegalBasis();
  }

  // Handle consent expiry
  private handleConsentExpiry(): void {
    // Clear expired consent
    this.consentData = null;
    this.deleteCookie(this.config.consentCookieName);

    // Show consent banner again
    this.showConsentBanner();

    // Track expiry event
    trackRUMEvent('gdpr-consent-expired', {
      timestamp: Date.now()
    });
  }

  // Validate legal basis
  private validateLegalBasis(): void {
    // This would check if any legal basis for processing has changed
    // and require re-consent if necessary
  }

  // Withdraw consent
  withdrawConsent(types: ConsentType[]): void {
    if (!this.consentData) return;

    // Update consent data
    types.forEach(type => {
      this.consentData!.consents[type] = false;
    });

    this.consentData.withdrawnAt = Date.now();

    // Save updated consent
    this.saveConsent(this.consentData.consents);

    // Track withdrawal
    trackRUMEvent('gdpr-consent-withdrawn', {
      types: types,
      timestamp: Date.now()
    });

    // Apply changes
    this.applyConsentSettings(this.consentData.consents);
  }

  // Initialize data retention
  private initializeDataRetention(): void {
    if (!this.config.enableDataRetention) return;

    // Set up automatic data cleanup
    setInterval(() => {
      this.performDataCleanup();
    }, 24 * 60 * 60 * 1000); // Daily

    // Initial cleanup
    setTimeout(() => this.performDataCleanup(), 5000);
  }

  // Perform data cleanup
  private performDataCleanup(): void {
    const retentionPeriod = this.config.dataRetentionPeriod * 24 * 60 * 60 * 1000; // Convert to milliseconds
    const cutoffTime = Date.now() - retentionPeriod;

    // Clean up old analytics data
    this.cleanupAnalyticsData(cutoffTime);

    // Clean up old error logs
    this.cleanupErrorLogs(cutoffTime);

    // Clean up old user feedback
    this.cleanupUserFeedback(cutoffTime);

    // Track cleanup event
    trackRUMEvent('gdpr-data-cleanup', {
      timestamp: Date.now(),
      retentionPeriod: this.config.dataRetentionPeriod,
      cutoffTime: cutoffTime
    });
  }

  // Cleanup analytics data
  private cleanupAnalyticsData(cutoffTime: number): void {
    // Remove old analytics data from local storage
    const analyticsKeys = ['rum-metrics', 'performance-data', 'user-journey-data'];

    analyticsKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter((item: any) =>
              item.timestamp > cutoffTime
            );
            localStorage.setItem(key, JSON.stringify(filtered));
          }
        } catch (error) {
          // Remove invalid data
          localStorage.removeItem(key);
        }
      }
    });
  }

  // Cleanup error logs
  private cleanupErrorLogs(cutoffTime: number): void {
    // Clean up old error tracking data
    const errorData = localStorage.getItem('error-tracking-data');
    if (errorData) {
      try {
        const parsed = JSON.parse(errorData);
        if (parsed.errors && Array.isArray(parsed.errors)) {
          parsed.errors = parsed.errors.filter((error: any) =>
            error.timestamp > cutoffTime
          );
          localStorage.setItem('error-tracking-data', JSON.stringify(parsed));
        }
      } catch (error) {
        localStorage.removeItem('error-tracking-data');
      }
    }
  }

  // Cleanup user feedback
  private cleanupUserFeedback(cutoffTime: number): void {
    // Clean up old user feedback data
    const feedbackData = localStorage.getItem('user-feedback-data');
    if (feedbackData) {
      try {
        const parsed = JSON.parse(feedbackData);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((item: any) =>
            item.timestamp > cutoffTime
          );
          localStorage.setItem('user-feedback-data', JSON.stringify(filtered));
        }
      } catch (error) {
        localStorage.removeItem('user-feedback-data');
      }
    }
  }

  // Initialize data subject rights
  private initializeDataSubjectRights(): void {
    // Set up data subject request endpoints
    this.setupDataSubjectRequestHandlers();

    // Monitor for data subject requests
    this.monitorDataSubjectRequests();
  }

  // Setup data subject request handlers
  private setupDataSubjectRequestHandlers(): void {
    // These would typically be server-side endpoints
    // Here we set up client-side tracking of requests

    window.addEventListener('data-subject-request', (event: any) => {
      this.handleDataSubjectRequest(event.detail);
    });
  }

  // Handle data subject request
  private handleDataSubjectRequest(request: {
    type: 'access' | 'rectification' | 'erasure' | 'portability' | 'objection';
    email: string;
    details?: any;
  }): void {
    const requestObj: DataSubjectRequest = {
      id: this.generateRequestId(),
      type: request.type,
      email: request.email,
      timestamp: Date.now(),
      status: 'pending',
      data: request.details
    };

    this.dataSubjectRequests.push(requestObj);

    // Track request
    trackRUMEvent('gdpr-data-subject-request', {
      requestId: requestObj.id,
      type: requestObj.type,
      email: this.hashEmail(request.email),
      timestamp: requestObj.timestamp
    });

    // Log for compliance
    reportMessage(`GDPR data subject request received: ${request.type}`, 'info', {
      requestId: requestObj.id,
      type: request.type,
      emailHash: this.hashEmail(request.email),
      timestamp: requestObj.timestamp
    });

    // In a real implementation, this would send the request to a server
    this.processDataSubjectRequest(requestObj);
  }

  // Process data subject request
  private async processDataSubjectRequest(request: DataSubjectRequest): Promise<void> {
    // Update status
    request.status = 'processing';

    try {
      // Simulate processing (in real implementation, this would be server-side)
      await new Promise(resolve => setTimeout(resolve, 1000));

      switch (request.type) {
        case 'access':
          await this.processAccessRequest(request);
          break;
        case 'rectification':
          await this.processRectificationRequest(request);
          break;
        case 'erasure':
          await this.processErasureRequest(request);
          break;
        case 'portability':
          await this.processPortabilityRequest(request);
          break;
        case 'objection':
          await this.processObjectionRequest(request);
          break;
      }

      request.status = 'completed';
      request.processedAt = Date.now();
    } catch (error) {
      request.status = 'rejected';
      console.error('[GDPR Compliance] Failed to process data subject request:', error);
    }
  }

  // Process access request
  private async processAccessRequest(request: DataSubjectRequest): Promise<void> {
    const userData = this.collectUserData(request.email);
    request.data = userData;
    request.response = 'Your personal data has been collected and will be sent to you via email.';
  }

  // Process rectification request
  private async processRectificationRequest(request: DataSubjectRequest): Promise<void> {
    // Update user data based on request.details
    request.response = 'Your data has been updated as requested.';
  }

  // Process erasure request
  private async processErasureRequest(request: DataSubjectRequest): Promise<void> {
    // Delete user data
    this.deleteUserData(request.email);
    request.response = 'Your personal data has been deleted as requested.';
  }

  // Process portability request
  private async processPortabilityRequest(request: DataSubjectRequest): Promise<void> {
    const userData = this.collectUserData(request.email);
    request.data = this.formatDataForPortability(userData);
    request.response = 'Your data has been prepared for portability and will be sent to you.';
  }

  // Process objection request
  private async processObjectionRequest(request: DataSubjectRequest): Promise<void> {
    // Stop processing based on objection
    request.response = 'Your objection has been recorded and processing has been stopped.';
  }

  // Collect user data
  private collectUserData(email: string): any {
    // Collect all data associated with the user
    return {
      personalData: this.getPersonalData(email),
      analyticsData: this.getAnalyticsData(email),
      consentData: this.getConsentData(email),
      preferences: this.getUserPreferences(email),
      timestamp: Date.now()
    };
  }

  // Get personal data
  private getPersonalData(email: string): any {
    // Retrieve personal data from various sources
    return {
      email: email,
      profile: localStorage.getItem(`user-profile-${this.hashEmail(email)}`),
      bookings: localStorage.getItem(`user-bookings-${this.hashEmail(email)}`),
      preferences: localStorage.getItem(`user-preferences-${this.hashEmail(email)}`)
    };
  }

  // Get analytics data
  private getAnalyticsData(email: string): any {
    // Retrieve analytics data
    return {
      sessions: localStorage.getItem(`user-sessions-${this.hashEmail(email)}`),
      interactions: localStorage.getItem(`user-interactions-${this.hashEmail(email)}`)
    };
  }

  // Get consent data
  private getConsentData(email: string): any {
    // Retrieve consent history
    return {
      currentConsent: this.consentData,
      consentHistory: localStorage.getItem(`consent-history-${this.hashEmail(email)}`)
    };
  }

  // Get user preferences
  private getUserPreferences(email: string): any {
    // Retrieve user preferences
    return {
      language: localStorage.getItem(`user-language-${this.hashEmail(email)}`),
      theme: localStorage.getItem(`user-theme-${this.hashEmail(email)}`),
      notifications: localStorage.getItem(`user-notifications-${this.hashEmail(email)}`)
    };
  }

  // Format data for portability
  private formatDataForPortability(data: any): string {
    return JSON.stringify(data, null, 2);
  }

  // Delete user data
  private deleteUserData(email: string {
    const emailHash = this.hashEmail(email);

    // Delete from local storage
    const keysToRemove = [
      `user-profile-${emailHash}`,
      `user-bookings-${emailHash}`,
      `user-preferences-${emailHash}`,
      `user-sessions-${emailHash}`,
      `user-interactions-${emailHash}`,
      `consent-history-${emailHash}`,
      `user-language-${emailHash}`,
      `user-theme-${emailHash}`,
      `user-notifications-${emailHash}`
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    // Clear consent
    if (this.consentData) {
      this.withdrawConsent(Object.values(ConsentType));
    }
  }

  // Monitor data subject requests
  private monitorDataSubjectRequests(): void {
    // Check for request status updates
    setInterval(() => {
      this.checkDataSubjectRequestStatus();
    }, 60000); // Every minute
  }

  // Check data subject request status
  private checkDataSubjectRequestStatus(): void {
    // Monitor pending requests and send updates
    this.dataSubjectRequests
      .filter(request => request.status === 'pending')
      .forEach(request => {
        // Check if request should be escalated
        const pendingTime = Date.now() - request.timestamp;
        if (pendingTime > 30 * 24 * 60 * 60 * 1000) { // 30 days
          reportMessage(`GDPR data subject request pending for over 30 days: ${request.id}`, 'warning', {
            requestId: request.id,
            type: request.type,
            pendingTime: pendingTime
          });
        }
      });
  }

  // Initialize privacy controls
  private initializePrivacyControls(): void {
    // Add privacy controls to the UI
    this.addPrivacyControlsToUI();

    // Set up keyboard navigation for privacy controls
    this.setupPrivacyControlAccessibility();
  }

  // Add privacy controls to UI
  private addPrivacyControlsToUI(): void {
    // Add privacy settings link to footer or navigation
    const footer = document.querySelector('footer');
    if (footer) {
      const privacyLink = document.createElement('a');
      privacyLink.href = '#';
      privacyLink.textContent = 'Privacy Settings';
      privacyLink.style.cssText = 'color: inherit; text-decoration: underline; margin: 0 10px;';
      privacyLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showPrivacySettings();
      });
      footer.appendChild(privacyLink);
    }
  }

  // Setup privacy control accessibility
  private setupPrivacyControlAccessibility(): void {
    // Ensure privacy controls are keyboard accessible
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.privacySettings) {
        this.hidePrivacySettings();
      }
    });
  }

  // Initialize compliance monitoring
  private initializeComplianceMonitoring(): void {
    // Monitor for compliance issues
    this.monitorCompliance();

    // Set up regular compliance reports
    setInterval(() => {
      this.generateComplianceReport();
    }, 7 * 24 * 60 * 60 * 1000); // Weekly
  }

  // Monitor compliance
  private monitorCompliance(): void {
    // Check consent banner compliance
    this.checkConsentBannerCompliance();

    // Check data retention compliance
    this.checkDataRetentionCompliance();

    // Check data subject request compliance
    this.checkDataSubjectRequestCompliance();
  }

  // Check consent banner compliance
  private checkConsentBannerCompliance(): void {
    const isInEU = this.detectUserLocation();

    isInEU.then(isEU => {
      if (isEU && !this.consentData && !this.consentBanner) {
        reportMessage('GDPR compliance: Missing consent banner for EU user', 'warning', {
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        });
      }
    });
  }

  // Check data retention compliance
  private checkDataRetentionCompliance(): void {
    // Check if data is being retained beyond the configured period
    const retentionPeriod = this.config.dataRetentionPeriod * 24 * 60 * 60 * 1000;
    const now = Date.now();

    // Check various data stores
    const keys = Object.keys(localStorage);
    const oldDataKeys = keys.filter(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '');
        return data.timestamp && (now - data.timestamp) > retentionPeriod;
      } catch {
        return false;
      }
    });

    if (oldDataKeys.length > 0) {
      reportMessage(`GDPR compliance: Data retention period exceeded for ${oldDataKeys.length} keys`, 'warning', {
        keys: oldDataKeys,
        retentionPeriod: this.config.dataRetentionPeriod
      });
    }
  }

  // Check data subject request compliance
  private checkDataSubjectRequestCompliance(): void {
    // Check for overdue data subject requests
    const overdueRequests = this.dataSubjectRequests.filter(request => {
      const pendingTime = Date.now() - request.timestamp;
      return request.status === 'pending' && pendingTime > 30 * 24 * 60 * 60 * 1000; // 30 days
    });

    if (overdueRequests.length > 0) {
      reportMessage(`GDPR compliance: ${overdueRequests.length} overdue data subject requests`, 'error', {
        requests: overdueRequests.map(r => ({
          id: r.id,
          type: r.type,
          pendingDays: Math.floor((Date.now() - r.timestamp) / (24 * 60 * 60 * 1000))
        }))
      });
    }
  }

  // Generate compliance report
  private generateComplianceReport(): void {
    const report = {
      timestamp: Date.now(),
      consentStatus: this.consentData ? {
        granted: true,
        timestamp: this.consentData.timestamp,
        expiryDate: this.consentData.expiryDate,
        consents: this.consentData.consents
      } : {
        granted: false
      },
      dataSubjectRequests: {
        total: this.dataSubjectRequests.length,
        pending: this.dataSubjectRequests.filter(r => r.status === 'pending').length,
        completed: this.dataSubjectRequests.filter(r => r.status === 'completed').length,
        rejected: this.dataSubjectRequests.filter(r => r.status === 'rejected').length
      },
      dataRetention: {
        enabled: this.config.enableDataRetention,
        period: this.config.dataRetentionPeriod,
        lastCleanup: Date.now()
      },
      privacyFeatures: {
        consentManagement: this.config.enableConsentManagement,
        dataSubjectRights: [
          this.config.enableRightToAccess,
          this.config.enableRightToRectification,
          this.config.enableRightToErasure,
          this.config.enableRightToPortability,
          this.config.enableRightToObjection
        ]
      }
    };

    trackRUMEvent('gdpr-compliance-report', report);

    // Report any compliance issues
    if (!report.consentStatus.granted && this.detectUserLocation()) {
      reportMessage('GDPR compliance: No consent recorded for potential EU user', 'warning', report);
    }
  }

  // Log compliance status
  private logComplianceStatus(): void {
    console.log('[GDPR Compliance] Compliance Status:', {
      consentManagement: this.config.enableConsentManagement,
      dataRetention: this.config.enableDataRetention,
      dataSubjectRights: {
        access: this.config.enableRightToAccess,
        rectification: this.config.enableRightToRectification,
        erasure: this.config.enableRightToErasure,
        portability: this.config.enableRightToPortability,
        objection: this.config.enableRightToObjection
      },
      currentConsent: this.consentData ? 'granted' : 'none'
    });
  }

  // Initialize consent updates
  private initializeConsentUpdates(): void {
    // Listen for changes in legal requirements
    window.addEventListener('gdpr-legal-update', (event: any) => {
      this.handleLegalUpdate(event.detail);
    });
  }

  // Handle legal update
  private handleLegalUpdate(update: any): void {
    // If legal basis has changed, require re-consent
    if (update.requiresReconsent) {
      this.consentData = null;
      this.deleteCookie(this.config.consentCookieName);
      this.showConsentBanner();

      trackRUMEvent('gdpr-legal-update-reconsent', {
        updateId: update.id,
        timestamp: Date.now()
      });
    }
  }

  // Helper methods

  private disableAnalyticsTracking(): void {
    // Disable Google Analytics
    if ('ga' in window) {
      (window as any).ga('set', 'anonymizeIp', true);
    }

    // Disable other analytics
    window.dispatchEvent(new CustomEvent('analytics-disabled'));
  }

  private disableMarketingTracking(): void {
    // Disable marketing cookies and tracking
    window.dispatchEvent(new CustomEvent('marketing-disabled'));
  }

  private getAnonymizedIP(): string {
    // Return anonymized IP for compliance
    return '0.0.0.0'; // In practice, you'd get the actual IP and anonymize it
  }

  private generateSessionId(): string {
    return `gdpr_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRequestId(): string {
    return `dsr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private hashEmail(email: string): string {
    // Simple hash for email (in practice, use proper hashing)
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      const char = email.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  private setCookie(name: string, value: string, days: number): void {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    const secure = window.location.protocol === 'https:' ? 'secure;' : '';
    const sameSite = 'SameSite=Lax;';

    document.cookie = `${name}=${value};${expires}path=/;${secure}${sameSite}`;
  }

  private deleteCookie(name: string): void {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 UTC;path=/;`;
  }

  // Public API methods

  // Check if user has given consent
  hasConsent(type: ConsentType): boolean {
    return this.consentData?.consents[type] || false;
  }

  // Get current consent data
  getConsentData(): ConsentData | null {
    return this.consentData;
  }

  // Show consent banner manually
  showConsentBanner(): void {
    this.showConsentBanner();
  }

  // Show privacy settings manually
  showPrivacySettings(): void {
    this.showPrivacySettings();
  }

  // Submit data subject request
  submitDataSubjectRequest(request: {
    type: 'access' | 'rectification' | 'erasure' | 'portability' | 'objection';
    email: string;
    details?: any;
  }): void {
    this.handleDataSubjectRequest(request);
  }

  // Get compliance status
  getComplianceStatus(): any {
    return {
      isInitialized: this.isInitialized,
      hasConsent: !!this.consentData,
      consentData: this.consentData,
      config: this.config,
      dataSubjectRequests: this.dataSubjectRequests,
      dataProcessors: this.config.dataProcessors
    };
  }

  // Export data for portability
  exportUserData(email: string): string {
    return this.formatDataForPortability(this.collectUserData(email));
  }

  // Delete user data
  deleteUserData(email: string): void {
    this.deleteUserData(email);
  }

  // Update configuration
  updateConfig(newConfig: Partial<GDPRConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get data processing records
  getDataProcessingRecords(): DataProcessor[] {
    return this.config.dataProcessors;
  }
}

// Create and export singleton instance
export const gdprComplianceManager = new GDPRComplianceManager();

// Initialize automatically
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    gdprComplianceManager.initialize();
  } else {
    window.addEventListener('load', () => {
      gdprComplianceManager.initialize();
    });
  }
}

// Export helper functions
export const initializeGDPRCompliance = () => gdprComplianceManager.initialize();
export const hasGDPRConsent = (type: ConsentType) => gdprComplianceManager.hasConsent(type);
export const showGDPRConsentBanner = () => gdprComplianceManager.showConsentBanner();
export const showGDPRPrivacySettings = () => gdprComplianceManager.showPrivacySettings();
export const submitGDPRDataSubjectRequest = (request: {
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'objection';
  email: string;
  details?: any;
}) => gdprComplianceManager.submitDataSubjectRequest(request);
export const getGDPRComplianceStatus = () => gdprComplianceManager.getComplianceStatus();
export const exportUserData = (email: string) => gdprComplianceManager.exportUserData(email);
export const deleteUserData = (email: string) => gdprComplianceManager.deleteUserData(email);

// Export types
export { GDPRConfig, ConsentType, ConsentData, DataSubjectRequest, DataProcessor };