import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

/**
 * Beauty Page Object Model
 * Handles interactions with beauty services pages
 */
export class BeautyPage extends BasePage {
  readonly pageTitle: Locator;
  readonly serviceCategories: Locator;
  readonly serviceGrid: Locator;
  readonly serviceCards: Locator;
  readonly filterButtons: Locator;
  readonly searchInput: Locator;
  readonly sortDropdown: Locator;

  // Service detail elements
  readonly serviceModal: Locator;
  readonly serviceGallery: Locator;
  readonly serviceDescription: Locator;
  readonly servicePrice: Locator;
  readonly serviceDuration: Locator;
  readonly bookNowButton: Locator;
  readonly viewGalleryButton: Locator;

  // Category-specific elements
  readonly browsCategory: Locator;
  readonly lipsCategory: Locator;
  readonly lashesCategory: Locator;
  readonly makeupCategory: Locator;

  constructor(page: Page) {
    super(page);

    // Page elements
    this.pageTitle = page.locator('h1, [data-testid="page-title"], .page-title');
    this.serviceCategories = page.locator('[data-testid="service-categories"], .service-categories');
    this.serviceGrid = page.locator('[data-testid="service-grid"], .service-grid, .services-grid');
    this.serviceCards = page.locator('[data-testid="service-card"], .service-card');
    this.filterButtons = page.locator('[data-testid="filter"], .filter-button, button[data-category]');
    this.searchInput = page.locator('input[placeholder*="search"], [data-testid="search"], .search-input');
    this.sortDropdown = page.locator('select[data-testid="sort"], .sort-select');

    // Service detail modal/section
    this.serviceModal = page.locator('[data-testid="service-modal"], .service-modal, .service-detail');
    this.serviceGallery = page.locator('[data-testid="service-gallery"], .service-gallery');
    this.serviceDescription = page.locator('[data-testid="service-description"], .service-description');
    this.servicePrice = page.locator('[data-testid="service-price"], .service-price, .price');
    this.serviceDuration = page.locator('[data-testid="service-duration"], .service-duration, .duration');
    this.bookNowButton = page.locator('button:has-text("Book Now"), [data-testid="book-now"], .book-now');
    this.viewGalleryButton = page.locator('button:has-text("Gallery"), [data-testid="view-gallery"], .view-gallery');

    // Categories
    this.browsCategory = page.locator('[data-category="brows"], button:has-text("Brows"), button:has-text("Brwi")');
    this.lipsCategory = page.locator('[data-category="lips"], button:has-text("Lips"), button:has-text("Usta")');
    this.lashesCategory = page.locator('[data-category="lashes"], button:has-text("Lashes"), button:has-text("Rzęsy")');
    this.makeupCategory = page.locator('[data-category="makeup"], button:has-text("Makeup"), button:has-text("Makijaż")');
  }

  /**
   * Navigate to beauty page
   */
  async navigateToBeauty(): Promise<void> {
    await this.goto('/beauty');
    await this.waitForBeautyPageLoad();
  }

  /**
   * Wait for beauty page to load completely
   */
  async waitForBeautyPageLoad(): Promise<void> {
    await this.waitForLoadState();
    await this.pageTitle.waitFor({ state: 'visible' });
    await this.serviceGrid.waitFor({ state: 'visible' });
  }

  /**
   * Get page title
   */
  async getPageTitle(): Promise<string> {
    return await this.pageTitle.textContent() || '';
  }

  /**
   * Get all visible service cards
   */
  async getServiceCards(): Promise<ServiceCardInfo[]> {
    const cards: ServiceCardInfo[] = [];
    const count = await this.serviceCards.count();

    for (let i = 0; i < Math.min(count, 20); i++) { // Limit to 20 cards for performance
      const card = this.serviceCards.nth(i);
      if (await card.isVisible()) {
        const name = await card.locator('[data-testid="service-name"], .service-name, h3').textContent() || '';
        const price = await card.locator('[data-testid="service-price"], .service-price, .price').textContent() || '';
        const duration = await card.locator('[data-testid="service-duration"], .service-duration, .duration').textContent() || '';
        const image = await card.locator('img').getAttribute('src') || '';
        const category = await card.getAttribute('data-category') || '';

        cards.push({
          name: name.trim(),
          price: price.trim(),
          duration: duration.trim(),
          image,
          category
        });
      }
    }

    return cards;
  }

  /**
   * Filter services by category
   */
  async filterByCategory(category: 'brows' | 'lips' | 'lashes' | 'makeup'): Promise<void> {
    let categoryButton: Locator;

    switch (category) {
      case 'brows':
        categoryButton = this.browsCategory;
        break;
      case 'lips':
        categoryButton = this.lipsCategory;
        break;
      case 'lashes':
        categoryButton = this.lashesCategory;
        break;
      case 'makeup':
        categoryButton = this.makeupCategory;
        break;
    }

    if (await categoryButton.isVisible()) {
      await categoryButton.click();
      await this.page.waitForTimeout(500); // Wait for filter to apply
    }
  }

  /**
   * Search for services
   */
  async searchServices(query: string): Promise<void> {
    if (await this.searchInput.isVisible()) {
      await this.searchInput.fill(query);
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Sort services
   */
  async sortServices(sortBy: 'price-low' | 'price-high' | 'name' | 'duration'): Promise<void> {
    if (await this.sortDropdown.isVisible()) {
      await this.sortDropdown.selectOption(sortBy);
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Click service card to view details
   */
  async viewServiceDetails(serviceName: string): Promise<void> {
    const serviceCard = this.serviceCards.filter({ hasText: serviceName });
    await expect(serviceCard).toBeVisible();
    await serviceCard.click();
    await this.serviceModal.waitFor({ state: 'visible' });
  }

  /**
   * Get service details from modal
   */
  async getServiceDetails(): Promise<ServiceDetails | null> {
    if (!(await this.serviceModal.isVisible())) {
      return null;
    }

    const name = await this.serviceModal.locator('[data-testid="service-name"], .service-name, h2').textContent() || '';
    const description = await this.serviceDescription.textContent() || '';
    const price = await this.servicePrice.textContent() || '';
    const duration = await this.serviceDuration.textContent() || '';

    // Get gallery images
    const galleryImages: string[] = [];
    const imageElements = this.serviceGallery.locator('img');
    const imageCount = await imageElements.count();

    for (let i = 0; i < Math.min(imageCount, 10); i++) {
      const src = await imageElements.nth(i).getAttribute('src');
      if (src) galleryImages.push(src);
    }

    return {
      name: name.trim(),
      description: description.trim(),
      price: price.trim(),
      duration: duration.trim(),
      galleryImages
    };
  }

  /**
   * Book service from detail modal
   */
  async bookService(): Promise<void> {
    if (await this.bookNowButton.isVisible()) {
      await this.bookNowButton.click();
      await this.page.waitForURL(/book/);
    }
  }

  /**
   * Close service detail modal
   */
  async closeServiceDetails(): Promise<void> {
    const closeButton = this.serviceModal.locator('button:has-text("Close"), .close-button, [aria-label="Close"]');
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await this.serviceModal.waitFor({ state: 'hidden' });
    }
  }

  /**
   * View service gallery
   */
  async viewGallery(): Promise<void> {
    if (await this.viewGalleryButton.isVisible()) {
      await this.viewGalleryButton.click();
      // Wait for gallery to open (could be modal or lightbox)
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Navigate through gallery images
   */
  async navigateGallery(direction: 'next' | 'previous'): Promise<void> {
    const gallery = this.page.locator('[data-testid="gallery"], .gallery, .lightbox');
    const nextButton = gallery.locator('button:has-text("Next"), .next-button, .gallery-next');
    const prevButton = gallery.locator('button:has-text("Previous"), .prev-button, .gallery-prev');

    if (direction === 'next' && await nextButton.isVisible()) {
      await nextButton.click();
    } else if (direction === 'previous' && await prevButton.isVisible()) {
      await prevButton.click();
    }

    await this.page.waitForTimeout(300);
  }

  /**
   * Test image loading
   */
  async verifyImagesLoaded(): Promise<{ loaded: number; total: number; errors: string[] }> {
    const images = this.page.locator('img');
    const count = await images.count();
    let loaded = 0;
    const errors: string[] = [];

    for (let i = 0; i < Math.min(count, 50); i++) { // Limit to 50 images
      const img = images.nth(i);
      const src = await img.getAttribute('src');

      if (src) {
        try {
          await img.waitFor({ state: 'visible', timeout: 2000 });
          const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
          if (naturalWidth > 0) {
            loaded++;
          } else {
            errors.push(`Image failed to load: ${src}`);
          }
        } catch (error) {
          errors.push(`Image timeout: ${src}`);
        }
      }
    }

    return { loaded, total: count, errors };
  }

  /**
   * Test lazy loading
   */
  async testLazyLoading(): Promise<boolean> {
    // Scroll to bottom of page to trigger lazy loading
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(1000);

    // Check if new images have loaded
    const images = this.page.locator('img[loading="lazy"]');
    const lazyCount = await images.count();

    let loadedLazyImages = 0;
    for (let i = 0; i < Math.min(lazyCount, 20); i++) {
      const img = images.nth(i);
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      if (naturalWidth > 0) {
        loadedLazyImages++;
      }
    }

    return loadedLazyImages > 0;
  }

  /**
   * Test responsive design
   */
  async testResponsiveLayout(): Promise<{
    mobileColumns: number;
    tabletColumns: number;
    desktopColumns: number;
  }> {
    // Test mobile
    await this.page.setViewportSize({ width: 375, height: 667 });
    await this.page.waitForTimeout(500);
    const mobileColumns = await this.serviceGrid.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns.split(' ').length;
    });

    // Test tablet
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await this.page.waitForTimeout(500);
    const tabletColumns = await this.serviceGrid.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns.split(' ').length;
    });

    // Test desktop
    await this.page.setViewportSize({ width: 1280, height: 720 });
    await this.page.waitForTimeout(500);
    const desktopColumns = await this.serviceGrid.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns.split(' ').length;
    });

    return { mobileColumns, tabletColumns, desktopColumns };
  }

  /**
   * Test search functionality
   */
  async testSearchFunctionality(): Promise<{
    works: boolean;
    resultsCount: number;
    noResultsMessage: boolean;
  }> {
    const initialCount = await this.serviceCards.count();

    if (await this.searchInput.isVisible()) {
      // Test with known term
      await this.searchInput.fill('brow');
      await this.page.waitForTimeout(1000);

      const filteredCount = await this.serviceCards.count();
      const noResultsMessage = await this.page.locator(':text("No results"), :text("Brak wyników")').isVisible();

      // Clear search
      await this.searchInput.fill('');
      await this.page.waitForTimeout(500);
      const clearedCount = await this.serviceCards.count();

      return {
        works: filteredCount < initialCount || noResultsMessage,
        resultsCount: filteredCount,
        noResultsMessage
      };
    }

    return { works: false, resultsCount: initialCount, noResultsMessage: false };
  }

  /**
   * Get price range information
   */
  async getPriceRange(): Promise<{ min: number; max: number; currency: string }> {
    const priceElements = this.page.locator('[data-testid="service-price"], .service-price, .price');
    const prices: number[] = [];
    let currency = 'PLN';

    const count = await priceElements.count();
    for (let i = 0; i < Math.min(count, 20); i++) {
      const priceText = await priceElements.nth(i).textContent() || '';
      const match = priceText.match(/(\d+)\s*(PLN|zł|€|\$)/);
      if (match) {
        prices.push(parseInt(match[1]));
        if (match[2]) {
          currency = match[2];
        }
      }
    }

    if (prices.length === 0) {
      return { min: 0, max: 0, currency: 'PLN' };
    }

    return { min: Math.min(...prices), max: Math.max(...prices), currency };
  }
}

interface ServiceCardInfo {
  name: string;
  price: string;
  duration: string;
  image: string;
  category: string;
}

interface ServiceDetails {
  name: string;
  description: string;
  price: string;
  duration: string;
  galleryImages: string[];
}