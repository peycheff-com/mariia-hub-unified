import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

/**
 * Home Page Object Model
 * Handles interactions with the homepage
 */
export class HomePage extends BasePage {
  readonly heroSection: Locator;
  readonly heroTitle: Locator;
  readonly heroDescription: Locator;
  readonly trustStrip: Locator;
  readonly reviewsCount: Locator;
  readonly locationInfo: Locator;
  readonly instagramCount: Locator;

  readonly beautyCard: Locator;
  readonly fitnessCard: Locator;
  readonly aboutSection: Locator;
  readonly testimonialsSection: Locator;
  readonly contactSection: Locator;
  readonly newsletterSection: Locator;

  readonly quickActionsBar: Locator;
  readonly floatingBookButton: Locator;
  readonly languageSelector: Locator;
  readonly currencySelector: Locator;

  constructor(page: Page) {
    super(page);

    // Hero section
    this.heroSection = page.locator('[data-testid="hero"], .hero, header');
    this.heroTitle = page.locator('h1, [data-testid="hero-title"], .hero-title');
    this.heroDescription = page.locator('[data-testid="hero-description"], .hero-description, .hero p');

    // Trust strip
    this.trustStrip = page.locator('[data-testid="trust-strip"], #trust, .trust-strip');
    this.reviewsCount = page.locator('[data-testid="reviews-count"], :text("5.0"), :text-matching("44 reviews")');
    this.locationInfo = page.locator('[data-testid="location"], :text("Smolna 8"), :text-matching("Śródmieście")');
    this.instagramCount = page.locator('[data-testid="instagram-count"], :text("56K+"), :text-matching("Instagram followers")');

    // Service cards
    this.beautyCard = page.locator('a[href*="beauty"]:has-text("Beauty"), [data-testid="beauty-card"]');
    this.fitnessCard = page.locator('a[href*="fitness"]:has-text("Fitness"), [data-testid="fitness-card"]');

    // Sections
    this.aboutSection = page.locator('[data-testid="about"], #about, .about-section');
    this.testimonialsSection = page.locator('[data-testid="testimonials"], .testimonials, .reviews');
    this.contactSection = page.locator('[data-testid="contact"], .contact, .studio-contact');
    this.newsletterSection = page.locator('[data-testid="newsletter"], .newsletter, .newsletter-signup');

    // Interactive elements
    this.quickActionsBar = page.locator('[data-testid="quick-actions"], .quick-actions-bar');
    this.floatingBookButton = page.locator('[data-testid="floating-book-button"], .floating-book-button');
    this.languageSelector = page.locator('[data-testid="language-selector"], .language-selector');
    this.currencySelector = page.locator('[data-testid="currency-selector"], .currency-selector');
  }

  /**
   * Navigate to home page
   */
  async navigateToHome(): Promise<void> {
    await this.goto('/');
    await this.waitForHomePageLoad();
  }

  /**
   * Wait for home page to load completely
   */
  async waitForHomePageLoad(): Promise<void> {
    await this.waitForLoadState();
    await this.heroTitle.waitFor({ state: 'visible' });
    await this.beautyCard.waitFor({ state: 'visible' });
    await this.fitnessCard.waitFor({ state: 'visible' });
  }

  /**
   * Get hero section text
   */
  async getHeroContent(): Promise<{ title: string; description: string }> {
    const title = await this.heroTitle.textContent() || '';
    const description = await this.heroDescription.textContent() || '';
    return { title: title.trim(), description: description.trim() };
  }

  /**
   * Navigate to beauty section
   */
  async navigateToBeauty(): Promise<void> {
    await this.beautyCard.click();
    await this.page.waitForURL(/beauty/);
  }

  /**
   * Navigate to fitness section
   */
  async navigateToFitness(): Promise<void> {
    await this.fitnessCard.click();
    await this.page.waitForURL(/fitness/);
  }

  /**
   * Click floating book button
   */
  async clickFloatingBookButton(): Promise<void> {
    if (await this.floatingBookButton.isVisible()) {
      await this.floatingBookButton.click();
      await this.page.waitForURL(/book/);
    }
  }

  /**
   * Quick action booking
   */
  async quickBook(): Promise<void> {
    if (await this.quickActionsBar.isVisible()) {
      const bookButton = this.quickActionsBar.locator('button:has-text("Book"), [data-testid="quick-book"]');
      if (await bookButton.isVisible()) {
        await bookButton.click();
        await this.page.waitForURL(/book/);
      }
    }
  }

  /**
   * Scroll to section
   */
  async scrollToSection(sectionName: 'about' | 'testimonials' | 'contact' | 'newsletter'): Promise<void> {
    let section: Locator;

    switch (sectionName) {
      case 'about':
        section = this.aboutSection;
        break;
      case 'testimonials':
        section = this.testimonialsSection;
        break;
      case 'contact':
        section = this.contactSection;
        break;
      case 'newsletter':
        section = this.newsletterSection;
        break;
    }

    await section.scrollIntoViewIfNeeded();
    await section.waitFor({ state: 'visible' });
  }

  /**
   * Switch language
   */
  async switchLanguage(language: 'en' | 'pl' | 'ua'): Promise<void> {
    if (await this.languageSelector.isVisible()) {
      await this.languageSelector.click();
      const languageOption = this.page.locator(`[data-value="${language}"], [data-lang="${language}"]`);
      await languageOption.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Switch currency
   */
  async switchCurrency(currency: 'PLN' | 'EUR' | 'USD'): Promise<void> {
    if (await this.currencySelector.isVisible()) {
      await this.currencySelector.click();
      const currencyOption = this.page.locator(`[data-value="${currency}"], [data-currency="${currency}"]`);
      await currencyOption.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Verify trust strip information
   */
  async verifyTrustStrip(): Promise<{
    hasReviews: boolean;
    hasLocation: boolean;
    hasInstagramCount: boolean;
  }> {
    const hasReviews = await this.reviewsCount.isVisible();
    const hasLocation = await this.locationInfo.isVisible();
    const hasInstagramCount = await this.instagramCount.isVisible();

    return { hasReviews, hasLocation, hasInstagramCount };
  }

  /**
   * Check if testimonials are loaded
   */
  async verifyTestimonialsLoaded(): Promise<boolean> {
    await this.scrollToSection('testimonials');
    const testimonialCards = this.page.locator('[data-testid="testimonial"], .testimonial, .review-card');
    return await testimonialCards.count() > 0;
  }

  /**
   * Subscribe to newsletter
   */
  async subscribeToNewsletter(email: string): Promise<void> {
    await this.scrollToSection('newsletter');
    const emailInput = this.newsletterSection.locator('input[type="email"], input[placeholder*="email"]');
    const submitButton = this.newsletterSection.locator('button[type="submit"], button:has-text("Subscribe")');

    if (await emailInput.isVisible()) {
      await emailInput.fill(email);
      await submitButton.click();
      await this.expectToast(/subscribed|success/i);
    }
  }

  /**
   * Test mobile menu functionality
   */
  async testMobileMenu(): Promise<void> {
    const mobileMenuButton = this.page.locator('[data-testid="mobile-menu-button"], .mobile-menu-button');

    if (await mobileMenuButton.isVisible()) {
      // Open menu
      await mobileMenuButton.click();
      const mobileMenu = this.page.locator('[data-testid="mobile-menu"], .mobile-menu');
      await expect(mobileMenu).toBeVisible();

      // Close menu
      await mobileMenuButton.click();
      await expect(mobileMenu).toBeHidden();
    }
  }

  /**
   * Test responsive design
   */
  async testResponsiveDesign(): Promise<{
    mobile: boolean;
    tablet: boolean;
    desktop: boolean;
  }> {
    // Test mobile
    await this.page.setViewportSize({ width: 375, height: 667 });
    const mobileNavigation = this.page.locator('[data-testid="mobile-navigation"], .mobile-navigation');
    const mobileMenuVisible = await mobileNavigation.isVisible();

    // Test tablet
    await this.page.setViewportSize({ width: 768, height: 1024 });
    const tabletLayout = this.page.locator('[data-testid="tablet-layout"], .grid-cols-2');
    const tabletColumnsVisible = await tabletLayout.count() > 0;

    // Test desktop
    await this.page.setViewportSize({ width: 1280, height: 720 });
    const desktopNavigation = this.page.locator('[data-testid="desktop-navigation"], nav:not(.mobile)');
    const desktopNavVisible = await desktopNavigation.isVisible();

    return {
      mobile: mobileMenuVisible,
      tablet: tabletColumnsVisible,
      desktop: desktopNavVisible
    };
  }

  /**
   * Check performance metrics
   */
  async getPerformanceMetrics(): Promise<{
    loadTime: number;
    domContentLoaded: number;
    firstContentfulPaint: number;
  }> {
    const metrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');

      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
      };
    });

    return metrics;
  }

  /**
   * Verify SEO elements
   */
  async verifySEOElements(): Promise<{
    hasTitle: boolean;
    hasDescription: boolean;
    hasStructuredData: boolean;
    hasCanonicalLink: boolean;
  }> {
    const hasTitle = !!(await this.page.title());
    const hasDescription = !!(await this.page.locator('meta[name="description"]').getAttribute('content'));
    const hasStructuredData = !!(await this.page.locator('script[type="application/ld+json"]').count());
    const hasCanonicalLink = !!(await this.page.locator('link[rel="canonical"]').getAttribute('href'));

    return { hasTitle, hasDescription, hasStructuredData, hasCanonicalLink };
  }

  /**
   * Test micro-interactions
   */
  async testMicroInteractions(): Promise<{
    heroAnimations: boolean;
    cardHoverEffects: boolean;
    buttonTransitions: boolean;
  }> {
    // Test hero animations
    const heroSection = this.heroSection;
    const heroTransform = await heroSection.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.transition !== 'none' || style.animation !== 'none';
    });

    // Test card hover effects
    await this.beautyCard.hover();
    const beautyCardStyle = await this.beautyCard.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.transform !== 'none' || style.boxShadow !== 'none';
    });

    // Test button transitions
    const button = this.page.locator('button, .btn').first();
    await button.hover();
    const buttonStyle = await button.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.transition !== 'none';
    });

    return {
      heroAnimations: heroTransform,
      cardHoverEffects: beautyCardStyle,
      buttonTransitions: buttonStyle
    };
  }
}