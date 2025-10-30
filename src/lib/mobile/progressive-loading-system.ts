/**
 * Progressive Loading System with Skeleton Screens
 * Advanced content loading with beautiful skeleton placeholders for mobile devices
 */

interface LoadingStrategy {
  type: 'progressive' | 'lazy' | 'eager' | 'skeleton-first';
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enablePlaceholder: boolean;
  placeholderType: 'skeleton' | 'blur' | 'spinner' | 'shimmer';
  fadeInDuration: number;
  enableIntersectionObserver: boolean;
  rootMargin: string;
  threshold: number;
}

interface SkeletonConfig {
  baseColor: string;
  highlightColor: string;
  animationDuration: number;
  borderRadius: string;
  shimmerDirection: 'left' | 'right' | 'up' | 'down';
  pulseAnimation: boolean;
  shimmerAnimation: boolean;
  gradientStops: number;
  loadingText: string;
  showProgressBar: boolean;
  progressColor: string;
}

interface ContentPlaceholder {
  type: 'text' | 'image' | 'button' | 'card' | 'list' | 'avatar' | 'custom';
  width: string | number;
  height: string | number;
  lines?: number;
  borderRadius?: string;
  variant?: 'primary' | 'secondary' | 'tertiary';
  className?: string;
}

interface LoadingState {
  isLoading: boolean;
  isLoaded: boolean;
  hasError: boolean;
  retryCount: number;
  startTime: number;
  endTime?: number;
  loadDuration?: number;
  error?: Error;
  placeholder?: HTMLElement;
  originalContent?: HTMLElement;
}

interface ProgressiveLoadingOptions {
  strategy?: Partial<LoadingStrategy>;
  skeletonConfig?: Partial<SkeletonConfig>;
  customPlaceholder?: (element: HTMLElement) => HTMLElement;
  onLoadStart?: (element: HTMLElement) => void;
  onLoadEnd?: (element: HTMLElement, duration: number) => void;
  onError?: (element: HTMLElement, error: Error) => void;
  onRetry?: (element: HTMLElement, attempt: number) => void;
}

class ProgressiveLoadingSystem {
  private static instance: ProgressiveLoadingSystem;
  private defaultStrategy: LoadingStrategy;
  private defaultSkeletonConfig: SkeletonConfig;
  private loadingStates: Map<string, LoadingState> = new Map();
  private intersectionObserver: IntersectionObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private isInitialized = false;
  private activeLoaders: Set<string> = new Set();

  private constructor() {
    this.initializeDefaultStrategy();
    this.initializeDefaultSkeletonConfig();
  }

  static getInstance(): ProgressiveLoadingSystem {
    if (!ProgressiveLoadingSystem.instance) {
      ProgressiveLoadingSystem.instance = new ProgressiveLoadingSystem();
    }
    return ProgressiveLoadingSystem.instance;
  }

  private initializeDefaultStrategy(): void {
    this.defaultStrategy = {
      type: 'progressive',
      priority: 'medium',
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      enablePlaceholder: true,
      placeholderType: 'skeleton',
      fadeInDuration: 300,
      enableIntersectionObserver: true,
      rootMargin: '50px',
      threshold: 0.1
    };
  }

  private initializeDefaultSkeletonConfig(): void {
    this.defaultSkeletonConfig = {
      baseColor: '#f3f4f6',
      highlightColor: '#e5e7eb',
      animationDuration: 1500,
      borderRadius: '8px',
      shimmerDirection: 'right',
      pulseAnimation: true,
      shimmerAnimation: true,
      gradientStops: 3,
      loadingText: 'Loading...',
      showProgressBar: false,
      progressColor: '#3b82f6'
    };
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 Initializing Progressive Loading System');

    // Setup intersection observer for lazy loading
    this.setupIntersectionObserver();

    // Setup mutation observer for dynamic content
    this.setupMutationObserver();

    // Generate skeleton styles
    this.generateSkeletonStyles();

    // Apply progressive loading to existing elements
    this.applyProgressiveLoading();

    this.isInitialized = true;
    console.log('✅ Progressive Loading System initialized');
  }

  private setupIntersectionObserver(): void {
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported');
      return;
    }

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          const elementId = this.getElementId(element);

          if (elementId && this.loadingStates.has(elementId)) {
            const state = this.loadingStates.get(elementId)!;
            if (!state.isLoaded && !state.isLoading) {
              this.loadContent(element);
            }
          }
        }
      });
    }, {
      rootMargin: this.defaultStrategy.rootMargin,
      threshold: this.defaultStrategy.threshold
    });
  }

  private setupMutationObserver(): void {
    if (!('MutationObserver' in window)) {
      console.warn('MutationObserver not supported');
      return;
    }

    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            if (this.shouldApplyProgressiveLoading(element)) {
              this.applyProgressiveLoadingToElement(element);
            }
          }
        });
      });
    });

    // Observe document body for new elements
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private generateSkeletonStyles(): void {
    const style = document.createElement('style');
    style.id = 'progressive-loading-styles';
    style.textContent = this.generateSkeletonCSS();
    document.head.appendChild(style);
  }

  private generateSkeletonCSS(): string {
    const { baseColor, highlightColor, animationDuration, borderRadius, shimmerDirection } = this.defaultSkeletonConfig;

    return `
      /* Base skeleton styles */
      .skeleton {
        background-color: ${baseColor};
        border-radius: ${borderRadius};
        position: relative;
        overflow: hidden;
      }

      /* Shimmer animation */
      .skeleton-shimmer::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          ${shimmerDirection === 'right' ? '90deg' : shimmerDirection === 'left' ? '270deg' : '180deg'},
          ${baseColor} 0%,
          ${highlightColor} 20%,
          ${baseColor} 40%
        );
        animation: skeleton-shimmer ${animationDuration}ms infinite;
      }

      @keyframes skeleton-shimmer {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }

      /* Pulse animation */
      .skeleton-pulse {
        animation: skeleton-pulse ${animationDuration}ms ease-in-out infinite;
      }

      @keyframes skeleton-pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }

      /* Text skeleton */
      .skeleton-text {
        height: 1em;
        margin-bottom: 0.5em;
        border-radius: 4px;
      }

      .skeleton-text:last-child {
        margin-bottom: 0;
      }

      /* Title skeleton */
      .skeleton-title {
        height: 1.5em;
        width: 70%;
        margin-bottom: 0.5em;
        border-radius: 4px;
      }

      /* Avatar skeleton */
      .skeleton-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
      }

      /* Button skeleton */
      .skeleton-button {
        height: 44px;
        width: 120px;
        border-radius: 22px;
      }

      /* Card skeleton */
      .skeleton-card {
        padding: 16px;
        border: 1px solid ${baseColor};
        border-radius: 8px;
      }

      /* List skeleton */
      .skeleton-list-item {
        display: flex;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid ${baseColor};
      }

      .skeleton-list-item:last-child {
        border-bottom: none;
      }

      .skeleton-list-item .skeleton-avatar {
        margin-right: 12px;
      }

      /* Image skeleton */
      .skeleton-image {
        background-color: ${baseColor};
        border-radius: ${borderRadius};
      }

      /* Loading overlay */
      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: ${borderRadius};
        z-index: 10;
      }

      /* Spinner */
      .loading-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid ${baseColor};
        border-top: 3px solid ${this.defaultSkeletonConfig.progressColor};
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      /* Progress bar */
      .loading-progress {
        width: 200px;
        height: 4px;
        background-color: ${baseColor};
        border-radius: 2px;
        overflow: hidden;
      }

      .loading-progress-bar {
        height: 100%;
        background-color: ${this.defaultSkeletonConfig.progressColor};
        animation: progress 2s ease-in-out infinite;
      }

      @keyframes progress {
        0% { width: 0%; }
        50% { width: 70%; }
        100% { width: 100%; }
      }

      /* Content fade in */
      .content-fade-in {
        animation: fadeIn ${this.defaultStrategy.fadeInDuration}ms ease-in;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Error state */
      .loading-error {
        padding: 16px;
        text-align: center;
        color: #dc2626;
        background-color: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: ${borderRadius};
      }

      /* Retry button */
      .retry-button {
        margin-top: 12px;
        padding: 8px 16px;
        background-color: ${this.defaultSkeletonConfig.progressColor};
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }

      .retry-button:hover {
        background-color: #2563eb;
      }

      /* Mobile optimizations */
      @media (max-width: 640px) {
        .skeleton {
          animation-duration: ${Math.max(800, animationDuration)}ms;
        }
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .skeleton-shimmer::after,
        .skeleton-pulse,
        .loading-spinner,
        .loading-progress-bar {
          animation: none;
        }

        .content-fade-in {
          animation: none;
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
  }

  private applyProgressiveLoading(): void {
    // Find elements that need progressive loading
    const elements = document.querySelectorAll('[data-progressive], [data-lazy], img[data-src], [data-loading]');

    elements.forEach(element => {
      this.applyProgressiveLoadingToElement(element as HTMLElement);
    });
  }

  private shouldApplyProgressiveLoading(element: HTMLElement): boolean {
    // Check if element should have progressive loading
    return (
      element.hasAttribute('data-progressive') ||
      element.hasAttribute('data-lazy') ||
      element.tagName === 'IMG' && element.hasAttribute('data-src') ||
      element.hasAttribute('data-loading') ||
      element.classList.contains('progressive-load')
    );
  }

  private applyProgressiveLoadingToElement(element: HTMLElement): void {
    const elementId = this.getElementId(element);
    if (!elementId) return;

    const options = this.parseElementOptions(element);
    const strategy = { ...this.defaultStrategy, ...options.strategy };
    const skeletonConfig = { ...this.defaultSkeletonConfig, ...options.skeletonConfig };

    // Initialize loading state
    const loadingState: LoadingState = {
      isLoading: false,
      isLoaded: false,
      hasError: false,
      retryCount: 0,
      startTime: 0
    };

    this.loadingStates.set(elementId, loadingState);

    // Store original content
    loadingState.originalContent = element.cloneNode(true) as HTMLElement;

    // Apply initial loading state based on strategy
    if (strategy.type === 'skeleton-first' || strategy.type === 'progressive') {
      this.showPlaceholder(element, strategy, skeletonConfig);
    }

    // Setup observation for lazy loading
    if (strategy.enableIntersectionObserver && this.intersectionObserver) {
      this.intersectionObserver.observe(element);
    } else if (strategy.type === 'eager') {
      // Load immediately
      this.loadContent(element);
    }

    // Mark element as processed
    element.setAttribute('data-progressive-processed', 'true');
  }

  private parseElementOptions(element: HTMLElement): ProgressiveLoadingOptions {
    const options: ProgressiveLoadingOptions = {};

    // Parse data attributes
    const strategyAttr = element.getAttribute('data-strategy');
    if (strategyAttr) {
      options.strategy = this.parseStrategy(strategyAttr);
    }

    const priorityAttr = element.getAttribute('data-priority');
    if (priorityAttr) {
      options.strategy = { ...options.strategy, priority: priorityAttr as any };
    }

    const placeholderAttr = element.getAttribute('data-placeholder');
    if (placeholderAttr) {
      options.strategy = { ...options.strategy, placeholderType: placeholderAttr as any };
    }

    return options;
  }

  private parseStrategy(strategyStr: string): Partial<LoadingStrategy> {
    const strategy: Partial<LoadingStrategy> = {};

    switch (strategyStr) {
      case 'progressive':
        strategy.type = 'progressive';
        break;
      case 'lazy':
        strategy.type = 'lazy';
        break;
      case 'eager':
        strategy.type = 'eager';
        break;
      case 'skeleton-first':
        strategy.type = 'skeleton-first';
        break;
    }

    return strategy;
  }

  private getElementId(element: HTMLElement): string {
    // Get or generate unique ID for element
    let id = element.getAttribute('data-loading-id');
    if (!id) {
      id = `loading-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      element.setAttribute('data-loading-id', id);
    }
    return id;
  }

  private async loadContent(element: HTMLElement): Promise<void> {
    const elementId = this.getElementId(element);
    const loadingState = this.loadingStates.get(elementId);

    if (!loadingState || loadingState.isLoaded || loadingState.isLoading) {
      return;
    }

    loadingState.isLoading = true;
    loadingState.startTime = performance.now();
    this.activeLoaders.add(elementId);

    // Trigger load start callback
    this.triggerLoadStart(element);

    try {
      // Determine content type and load accordingly
      await this.loadContentByType(element);

      loadingState.isLoaded = true;
      loadingState.endTime = performance.now();
      loadingState.loadDuration = loadingState.endTime - loadingState.startTime;

      // Show loaded content
      this.showLoadedContent(element);

      // Trigger load end callback
      this.triggerLoadEnd(element, loadingState.loadDuration!);

      console.log(`✅ Content loaded for ${elementId} in ${loadingState.loadDuration.toFixed(2)}ms`);

    } catch (error) {
      loadingState.hasError = true;
      loadingState.error = error as Error;

      // Show error state
      this.showErrorState(element, error as Error);

      // Trigger error callback
      this.triggerError(element, error as Error);

      console.error(`❌ Failed to load content for ${elementId}:`, error);

      // Retry if attempts remaining
      if (loadingState.retryCount < this.defaultStrategy.retryAttempts) {
        setTimeout(() => {
          this.retryContent(element);
        }, this.defaultStrategy.retryDelay);
      }
    } finally {
      loadingState.isLoading = false;
      this.activeLoaders.delete(elementId);
    }
  }

  private async loadContentByType(element: HTMLElement): Promise<void> {
    const tagName = element.tagName.toLowerCase();

    switch (tagName) {
      case 'img':
        await this.loadImage(element);
        break;
      case 'iframe':
        await this.loadIframe(element);
        break;
      case 'video':
        await this.loadVideo(element);
        break;
      case 'audio':
        await this.loadAudio(element);
        break;
      default:
        await this.loadGenericContent(element);
        break;
    }
  }

  private async loadImage(element: HTMLImageElement): Promise<void> {
    return new Promise((resolve, reject) => {
      const src = element.getAttribute('data-src') || element.src;
      if (!src) {
        reject(new Error('No image source found'));
        return;
      }

      element.onload = () => resolve();
      element.onerror = () => reject(new Error(`Failed to load image: ${src}`));

      // Start loading
      element.src = src;
      element.removeAttribute('data-src');
    });
  }

  private async loadIframe(element: HTMLIFrameElement): Promise<void> {
    return new Promise((resolve, reject) => {
      const src = element.getAttribute('data-src') || element.src;
      if (!src) {
        reject(new Error('No iframe source found'));
        return;
      }

      element.onload = () => resolve();
      element.onerror = () => reject(new Error(`Failed to load iframe: ${src}`));

      // Start loading
      element.src = src;
      element.removeAttribute('data-src');
    });
  }

  private async loadVideo(element: HTMLVideoElement): Promise<void> {
    return new Promise((resolve, reject) => {
      const src = element.getAttribute('data-src') || element.src;
      if (!src) {
        reject(new Error('No video source found'));
        return;
      }

      element.onloadeddata = () => resolve();
      element.onerror = () => reject(new Error(`Failed to load video: ${src}`));

      // Start loading
      element.src = src;
      element.removeAttribute('data-src');
    });
  }

  private async loadAudio(element: HTMLAudioElement): Promise<void> {
    return new Promise((resolve, reject) => {
      const src = element.getAttribute('data-src') || element.src;
      if (!src) {
        reject(new Error('No audio source found'));
        return;
      }

      element.oncanplay = () => resolve();
      element.onerror = () => reject(new Error(`Failed to load audio: ${src}`));

      // Start loading
      element.src = src;
      element.removeAttribute('data-src');
    });
  }

  private async loadGenericContent(element: HTMLElement): Promise<void> {
    // Handle custom data loading
    const dataUrl = element.getAttribute('data-content-url');
    if (dataUrl) {
      const response = await fetch(dataUrl);
      const content = await response.text();
      element.innerHTML = content;
    }

    // Handle component lazy loading
    const componentName = element.getAttribute('data-component');
    if (componentName) {
      await this.loadComponent(element, componentName);
    }

    // Simulate loading delay for demonstration
    if (element.hasAttribute('data-simulate-load')) {
      const delay = parseInt(element.getAttribute('data-simulate-load') || '1000');
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  private async loadComponent(element: HTMLElement, componentName: string): Promise<void> {
    // Dynamic component loading implementation
    try {
      const module = await import(`../components/${componentName}.tsx`);
      const Component = module.default;

      // This would need to be implemented based on your framework
      // For now, just log the component loading
      console.log(`Loading component: ${componentName}`);
    } catch (error) {
      throw new Error(`Failed to load component: ${componentName}`);
    }
  }

  private showPlaceholder(element: HTMLElement, strategy: LoadingStrategy, skeletonConfig: SkeletonConfig): void {
    const elementId = this.getElementId(element);
    const loadingState = this.loadingStates.get(elementId);

    if (!loadingState || !strategy.enablePlaceholder) return;

    // Create placeholder based on type
    const placeholder = this.createPlaceholder(element, strategy.placeholderType!, skeletonConfig);

    // Hide original content
    if (loadingState.originalContent) {
      loadingState.originalContent.style.display = 'none';
    }

    // Insert placeholder
    element.parentNode?.insertBefore(placeholder, element);
    loadingState.placeholder = placeholder;
  }

  private createPlaceholder(element: HTMLElement, type: string, config: SkeletonConfig): HTMLElement {
    const placeholder = document.createElement('div');
    placeholder.className = 'loading-placeholder';
    placeholder.setAttribute('aria-hidden', 'true');

    switch (type) {
      case 'skeleton':
        return this.createSkeletonPlaceholder(element, config);
      case 'spinner':
        return this.createSpinnerPlaceholder(config);
      case 'blur':
        return this.createBlurPlaceholder(element, config);
      default:
        return this.createSkeletonPlaceholder(element, config);
    }
  }

  private createSkeletonPlaceholder(element: HTMLElement, config: SkeletonConfig): HTMLElement {
    const skeletonType = this.getSkeletonType(element);
    const placeholder = document.createElement('div');
    placeholder.className = 'skeleton';

    switch (skeletonType.type) {
      case 'text':
        return this.createTextSkeleton(skeletonType, config);
      case 'image':
        return this.createImageSkeleton(skeletonType, config);
      case 'button':
        return this.createButtonSkeleton(config);
      case 'card':
        return this.createCardSkeleton(config);
      case 'list':
        return this.createListSkeleton(config);
      case 'avatar':
        return this.createAvatarSkeleton(config);
      default:
        return this.createCustomSkeleton(element, config);
    }
  }

  private getSkeletonType(element: HTMLElement): ContentPlaceholder {
    // Determine skeleton type based on element attributes and classes
    if (element.classList.contains('skeleton-text') || element.tagName === 'P') {
      return { type: 'text', width: '100%', height: '1em', lines: 3 };
    }

    if (element.classList.contains('skeleton-title') || element.tagName === 'H1' || element.tagName === 'H2') {
      return { type: 'title', width: '70%', height: '1.5em' };
    }

    if (element.classList.contains('skeleton-image') || element.tagName === 'IMG') {
      const width = element.getAttribute('width') || element.clientWidth || 300;
      const height = element.getAttribute('height') || element.clientHeight || 200;
      return { type: 'image', width, height };
    }

    if (element.classList.contains('skeleton-button') || element.tagName === 'BUTTON') {
      return { type: 'button', width: 120, height: 44 };
    }

    if (element.classList.contains('skeleton-avatar')) {
      return { type: 'avatar', width: 40, height: 40 };
    }

    // Default to card
    return { type: 'card', width: '100%', height: 200 };
  }

  private createTextSkeleton(placeholder: ContentPlaceholder, config: SkeletonConfig): HTMLElement {
    const container = document.createElement('div');
    container.className = 'skeleton-text-container';

    const lines = placeholder.lines || 1;
    for (let i = 0; i < lines; i++) {
      const line = document.createElement('div');
      line.className = 'skeleton skeleton-text';

      // Vary line widths for more realistic appearance
      const widthVariation = Math.random() * 0.3 + 0.7; // 70-100% width
      line.style.width = `${widthVariation * 100}%`;

      if (config.shimmerAnimation) {
        line.classList.add('skeleton-shimmer');
      } else if (config.pulseAnimation) {
        line.classList.add('skeleton-pulse');
      }

      container.appendChild(line);
    }

    return container;
  }

  private createImageSkeleton(placeholder: ContentPlaceholder, config: SkeletonConfig): HTMLElement {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton skeleton-image';
    skeleton.style.width = typeof placeholder.width === 'string' ? placeholder.width : `${placeholder.width}px`;
    skeleton.style.height = typeof placeholder.height === 'string' ? placeholder.height : `${placeholder.height}px`;

    if (config.shimmerAnimation) {
      skeleton.classList.add('skeleton-shimmer');
    } else if (config.pulseAnimation) {
      skeleton.classList.add('skeleton-pulse');
    }

    return skeleton;
  }

  private createButtonSkeleton(config: SkeletonConfig): HTMLElement {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton skeleton-button';

    if (config.shimmerAnimation) {
      skeleton.classList.add('skeleton-shimmer');
    } else if (config.pulseAnimation) {
      skeleton.classList.add('skeleton-pulse');
    }

    return skeleton;
  }

  private createCardSkeleton(config: SkeletonConfig): HTMLElement {
    const card = document.createElement('div');
    card.className = 'skeleton skeleton-card';

    // Add title
    const title = document.createElement('div');
    title.className = 'skeleton skeleton-title';
    if (config.shimmerAnimation) {
      title.classList.add('skeleton-shimmer');
    }
    card.appendChild(title);

    // Add text lines
    for (let i = 0; i < 3; i++) {
      const line = document.createElement('div');
      line.className = 'skeleton skeleton-text';
      if (config.shimmerAnimation) {
        line.classList.add('skeleton-shimmer');
      }
      card.appendChild(line);
    }

    return card;
  }

  private createListSkeleton(config: SkeletonConfig): HTMLElement {
    const list = document.createElement('div');
    list.className = 'skeleton-list';

    // Create 3 list items
    for (let i = 0; i < 3; i++) {
      const item = document.createElement('div');
      item.className = 'skeleton-list-item';

      // Avatar
      const avatar = document.createElement('div');
      avatar.className = 'skeleton skeleton-avatar';
      if (config.shimmerAnimation) {
        avatar.classList.add('skeleton-shimmer');
      }
      item.appendChild(avatar);

      // Text
      const text = document.createElement('div');
      text.className = 'skeleton skeleton-text';
      text.style.flex = '1';
      if (config.shimmerAnimation) {
        text.classList.add('skeleton-shimmer');
      }
      item.appendChild(text);

      list.appendChild(item);
    }

    return list;
  }

  private createAvatarSkeleton(config: SkeletonConfig): HTMLElement {
    const avatar = document.createElement('div');
    avatar.className = 'skeleton skeleton-avatar';

    if (config.shimmerAnimation) {
      avatar.classList.add('skeleton-shimmer');
    } else if (config.pulseAnimation) {
      avatar.classList.add('skeleton-pulse');
    }

    return avatar;
  }

  private createCustomSkeleton(element: HTMLElement, config: SkeletonConfig): HTMLElement {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton';
    skeleton.style.width = element.style.width || '100%';
    skeleton.style.height = element.style.height || '100px';

    if (config.shimmerAnimation) {
      skeleton.classList.add('skeleton-shimmer');
    } else if (config.pulseAnimation) {
      skeleton.classList.add('skeleton-pulse');
    }

    return skeleton;
  }

  private createSpinnerPlaceholder(config: SkeletonConfig): HTMLElement {
    const container = document.createElement('div');
    container.className = 'loading-overlay';

    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    container.appendChild(spinner);

    if (config.showProgressBar) {
      const progress = document.createElement('div');
      progress.className = 'loading-progress';

      const progressBar = document.createElement('div');
      progressBar.className = 'loading-progress-bar';
      progress.appendChild(progressBar);

      container.appendChild(progress);
    }

    if (config.loadingText) {
      const text = document.createElement('div');
      text.textContent = config.loadingText;
      text.style.marginTop = '12px';
      text.style.fontSize = '14px';
      text.style.color = '#6b7280';
      container.appendChild(text);
    }

    return container;
  }

  private createBlurPlaceholder(element: HTMLElement, config: SkeletonConfig): HTMLElement {
    const placeholder = document.createElement('div');
    placeholder.className = 'loading-overlay';
    placeholder.style.backdropFilter = 'blur(5px)';
    placeholder.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';

    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    placeholder.appendChild(spinner);

    return placeholder;
  }

  private showLoadedContent(element: HTMLElement): void {
    const elementId = this.getElementId(element);
    const loadingState = this.loadingStates.get(elementId);

    if (!loadingState) return;

    // Remove placeholder
    if (loadingState.placeholder) {
      loadingState.placeholder.remove();
      loadingState.placeholder = undefined;
    }

    // Show original content
    if (loadingState.originalContent) {
      loadingState.originalContent.style.display = '';
      loadingState.originalContent.classList.add('content-fade-in');
    }

    // Add loaded class
    element.classList.add('content-loaded');
    element.setAttribute('data-loaded', 'true');
  }

  private showErrorState(element: HTMLElement, error: Error): void {
    const elementId = this.getElementId(element);
    const loadingState = this.loadingStates.get(elementId);

    if (!loadingState) return;

    // Remove placeholder
    if (loadingState.placeholder) {
      loadingState.placeholder.remove();
      loadingState.placeholder = undefined;
    }

    // Create error overlay
    const errorOverlay = document.createElement('div');
    errorOverlay.className = 'loading-error';
    errorOverlay.innerHTML = `
      <div class="error-message">
        <div class="error-icon">⚠️</div>
        <div class="error-text">Failed to load content</div>
        <div class="error-details">${error.message}</div>
        ${loadingState.retryCount < this.defaultStrategy.retryAttempts ?
          '<button class="retry-button">Retry</button>' :
          '<div class="retry-exhausted">Max retries exceeded</div>'
        }
      </div>
    `;

    // Add retry handler
    const retryButton = errorOverlay.querySelector('.retry-button');
    if (retryButton) {
      retryButton.addEventListener('click', () => {
        this.retryContent(element);
      });
    }

    // Insert error overlay
    element.parentNode?.insertBefore(errorOverlay, element);
    loadingState.placeholder = errorOverlay;
  }

  private retryContent(element: HTMLElement): void {
    const elementId = this.getElementId(element);
    const loadingState = this.loadingStates.get(elementId);

    if (!loadingState) return;

    loadingState.retryCount++;
    loadingState.hasError = false;
    loadingState.error = undefined;

    // Trigger retry callback
    this.triggerRetry(element, loadingState.retryCount);

    // Reload content
    this.loadContent(element);
  }

  private triggerLoadStart(element: HTMLElement): void {
    const event = new CustomEvent('loadStart', {
      detail: { element, timestamp: Date.now() }
    });
    element.dispatchEvent(event);
  }

  private triggerLoadEnd(element: HTMLElement, duration: number): void {
    const event = new CustomEvent('loadEnd', {
      detail: { element, duration, timestamp: Date.now() }
    });
    element.dispatchEvent(event);
  }

  private triggerError(element: HTMLElement, error: Error): void {
    const event = new CustomEvent('loadError', {
      detail: { element, error, timestamp: Date.now() }
    });
    element.dispatchEvent(event);
  }

  private triggerRetry(element: HTMLElement, attempt: number): void {
    const event = new CustomEvent('loadRetry', {
      detail: { element, attempt, timestamp: Date.now() }
    });
    element.dispatchEvent(event);
  }

  // Public API methods
  public loadElement(element: HTMLElement, options?: ProgressiveLoadingOptions): void {
    const elementId = this.getElementId(element);

    // Update options if provided
    if (options) {
      const currentOptions = this.parseElementOptions(element);
      const mergedOptions = {
        strategy: { ...currentOptions.strategy, ...options.strategy },
        skeletonConfig: { ...currentOptions.skeletonConfig, ...options.skeletonConfig },
        ...options
      };

      // Store custom callbacks
      if (options.onLoadStart) {
        element.addEventListener('loadStart', options.onLoadStart as EventListener);
      }
      if (options.onLoadEnd) {
        element.addEventListener('loadEnd', options.onLoadEnd as EventListener);
      }
      if (options.onError) {
        element.addEventListener('loadError', options.onError as EventListener);
      }
      if (options.onRetry) {
        element.addEventListener('loadRetry', options.onRetry as EventListener);
      }
    }

    // Start loading
    this.loadContent(element);
  }

  public preloadElements(elements: HTMLElement[]): void {
    elements.forEach(element => {
      if (this.shouldApplyProgressiveLoading(element)) {
        // Apply eager loading for preloading
        const eagerStrategy = { ...this.defaultStrategy, type: 'eager' as const };
        element.setAttribute('data-strategy', 'eager');
        this.applyProgressiveLoadingToElement(element);
      }
    });
  }

  public getLoadingState(element: HTMLElement): LoadingState | undefined {
    const elementId = this.getElementId(element);
    return this.loadingStates.get(elementId);
  }

  public getLoadingMetrics(): object {
    const states = Array.from(this.loadingStates.values());
    const loaded = states.filter(s => s.isLoaded);
    const failed = states.filter(s => s.hasError);
    const loading = states.filter(s => s.isLoading);

    const totalLoadTime = loaded.reduce((sum, s) => sum + (s.loadDuration || 0), 0);
    const averageLoadTime = loaded.length > 0 ? totalLoadTime / loaded.length : 0;

    return {
      total: states.length,
      loaded: loaded.length,
      failed: failed.length,
      loading: loading.length,
      activeLoaders: this.activeLoaders.size,
      averageLoadTime,
      totalLoadTime,
      successRate: states.length > 0 ? loaded.length / states.length : 0
    };
  }

  public updateSkeletonConfig(newConfig: Partial<SkeletonConfig>): void {
    this.defaultSkeletonConfig = { ...this.defaultSkeletonConfig, ...newConfig };

    // Regenerate styles
    const existingStyles = document.getElementById('progressive-loading-styles');
    if (existingStyles) {
      existingStyles.remove();
    }
    this.generateSkeletonStyles();

    console.log('🎨 Skeleton configuration updated:', this.defaultSkeletonConfig);
  }

  public updateDefaultStrategy(newStrategy: Partial<LoadingStrategy>): void {
    this.defaultStrategy = { ...this.defaultStrategy, ...newStrategy };
    console.log('⚙️ Default loading strategy updated:', this.defaultStrategy);
  }

  public generateReport(): object {
    return {
      metrics: this.getLoadingMetrics(),
      configuration: {
        defaultStrategy: this.defaultStrategy,
        skeletonConfig: this.defaultSkeletonConfig
      },
      features: {
        intersectionObserver: !!this.intersectionObserver,
        mutationObserver: !!this.mutationObserver,
        totalStates: this.loadingStates.size,
        activeLoaders: this.activeLoaders.size
      },
      recommendations: this.generateRecommendations(),
      timestamp: new Date().toISOString()
    };
  }

  private generateRecommendations(): string[] {
    const metrics = this.getLoadingMetrics();
    const recommendations: string[] = [];

    if (metrics.successRate < 0.9) {
      recommendations.push('Consider increasing timeout values for slow networks');
    }

    if (metrics.averageLoadTime > 2000) {
      recommendations.push('Optimize content loading for better performance');
    }

    if (metrics.failed > 0) {
      recommendations.push(`Investigate ${metrics.failed} failed load attempts`);
    }

    if (!this.intersectionObserver) {
      recommendations.push('IntersectionObserver not available - consider polyfill');
    }

    if (recommendations.length === 0) {
      recommendations.push('Progressive loading is performing optimally');
    }

    return recommendations;
  }
}

// Export singleton instance
export const progressiveLoadingSystem = ProgressiveLoadingSystem.getInstance();

// Convenience exports
export const initializeProgressiveLoading = () => progressiveLoadingSystem.initialize();
export const loadElementProgressively = (element: HTMLElement, options?: ProgressiveLoadingOptions) =>
  progressiveLoadingSystem.loadElement(element, options);
export const preloadElements = (elements: HTMLElement[]) => progressiveLoadingSystem.preloadElements(elements);
export const getLoadingMetrics = () => progressiveLoadingSystem.getLoadingMetrics();
export const getProgressiveReport = () => progressiveLoadingSystem.generateReport();

// Development debugging
if (import.meta.env.DEV) {
  (window as any).progressiveLoading = {
    init: initializeProgressiveLoading,
    load: loadElementProgressively,
    preload: preloadElements,
    getMetrics: getLoadingMetrics,
    getReport: getProgressiveReport,
    updateSkeleton: (config: Partial<SkeletonConfig>) => progressiveLoadingSystem.updateSkeletonConfig(config),
    updateStrategy: (strategy: Partial<LoadingStrategy>) => progressiveLoadingSystem.updateDefaultStrategy(strategy)
  };
}