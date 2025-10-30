// Internationalized URL Routing for Multi-language Platform
// Supports SEO-friendly URLs and language-specific routing

import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

// Route configuration
export interface RouteConfig {
  path: string;
  translations: Record<string, string>; // language -> path
  defaultLanguage: string;
  requiresAuth?: boolean;
  meta?: {
    title?: Record<string, string>;
    description?: Record<string, string>;
    keywords?: Record<string, string>;
  };
}

// Route definitions
export const routes: Record<string, RouteConfig> = {
  home: {
    path: '/',
    translations: {
      en: '/',
      pl: '/',
      ua: '/',
      ru: '/',
    },
    defaultLanguage: 'en',
    meta: {
      title: {
        en: 'Mariia Beauty & Fitness - Professional Services in Warsaw',
        pl: 'Mariia Beauty & Fitness - Profesjonalne Usługi w Warszawie',
        ua: 'Мarii Beauty & Fitness - Професійні Послуги у Варшаві',
        ru: 'Мариia Beauty & Fitness - Профессиональные Услуги в Варшаве',
      },
      description: {
        en: 'Professional permanent makeup and certified personal training services in Warsaw. Book your appointment today.',
        pl: 'Profesjonalny makijaż permanentny i certyfikowane treningi personalne w Warszawie. Zarezerwuj wizytę już dziś.',
        ua: 'Професійний перманентний макіяж та сертифіковані персональні тренування у Варшаві. Забронюйте візит сьогодні.',
        ru: 'Профессиональный перманентный макияж и сертифицированные персональные тренировки в Варшаве. Забронируйте визит сегодня.',
      },
    },
  },
  beauty: {
    path: '/beauty',
    translations: {
      en: '/beauty',
      pl: '/uroda',
      ua: 'krasa',
      ru: '/krasota',
    },
    defaultLanguage: 'en',
    meta: {
      title: {
        en: 'Beauty Services - Permanent Makeup Warsaw',
        pl: 'Usługi Kosmetyczne - Makijaż Permanentny Warszawa',
        ua: 'Послуги Краси - Перманентний Макіяж Варшава',
        ru: 'Услуги Красоты - Перманентный Макияж Варшава',
      },
    },
  },
  fitness: {
    path: '/fitness',
    translations: {
      en: '/fitness',
      pl: '/fitness',
      ua: 'fitness',
      ru: '/fitness',
    },
    defaultLanguage: 'en',
    meta: {
      title: {
        en: 'Fitness Programs - Personal Training Warsaw',
        pl: 'Programy Fitness - Treningi Personalne Warszawa',
        ua: 'Програми Фітнесу - Персональні Тренування Варшава',
        ru: 'Программы Фитнеса - Персональные Тренировки Варшава',
      },
    },
  },
  about: {
    path: '/about',
    translations: {
      en: '/about',
      pl: '/o-mnie',
      ua: 'pro-mene',
      ru: '/obo-mne',
    },
    defaultLanguage: 'en',
  },
  contact: {
    path: '/contact',
    translations: {
      en: '/contact',
      pl: '/kontakt',
      ua: 'kontakt',
      ru: '/kontakt',
    },
    defaultLanguage: 'en',
  },
  booking: {
    path: '/booking',
    translations: {
      en: '/booking',
      pl: '/rezerwacja',
      ua: 'bronuvannya',
      ru: '/bronirovanie',
    },
    defaultLanguage: 'en',
    requiresAuth: false,
  },
  blog: {
    path: '/blog',
    translations: {
      en: '/blog',
      pl: '/blog',
      ua: 'blog',
      ru: '/blog',
    },
    defaultLanguage: 'en',
  },
  faq: {
    path: '/faq',
    translations: {
      en: '/faq',
      pl: '/faq',
      ua: 'faq',
      ru: '/faq',
    },
    defaultLanguage: 'en',
  },
  gallery: {
    path: '/gallery',
    translations: {
      en: '/gallery',
      pl: '/galeria',
      ua: 'galereya',
      ru: '/galereya',
    },
    defaultLanguage: 'en',
  },
  reviews: {
    path: '/reviews',
    translations: {
      en: '/reviews',
      pl: '/opinie',
      ua: 'vidguki',
      ru: '/otzyvy',
    },
    defaultLanguage: 'en',
  },
  prices: {
    path: '/prices',
    translations: {
      en: '/prices',
      pl: '/cennik',
      ua: 'tsiny',
      ru: 'tseny',
    },
    defaultLanguage: 'en',
  },
  privacy: {
    path: '/privacy',
    translations: {
      en: '/privacy-policy',
      pl: '/polityka-prywatnosci',
      ua: 'politika-konfidentsiynosti',
      ru: 'politika-konfidentsialnosti',
    },
    defaultLanguage: 'en',
  },
  terms: {
    path: '/terms',
    translations: {
      en: '/terms-of-service',
      pl: '/regulamin',
      ua: 'umovi',
      ru: 'usloviya',
    },
    defaultLanguage: 'en',
  },
  gdpr: {
    path: '/gdpr',
    translations: {
      en: '/gdpr',
      pl: '/rodo',
      ua: 'gdpr',
      ru: '/gdpr',
    },
    defaultLanguage: 'en',
  },
  // Beauty service categories
  beautyLips: {
    path: '/beauty/lips',
    translations: {
      en: '/beauty/lips',
      pl: '/uroda/usta',
      ua: 'krasa/guby',
      ru: '/krasota/guby',
    },
    defaultLanguage: 'en',
  },
  beautyBrows: {
    path: '/beauty/brows',
    translations: {
      en: '/beauty/brows',
      pl: '/uroda/brwi',
      ua: 'krasa/brovi',
      ru: '/krasota/brovi',
    },
    defaultLanguage: 'en',
  },
  beautyMakeup: {
    path: '/beauty/makeup',
    translations: {
      en: '/beauty/makeup',
      pl: '/uroda/makijaz',
      ua: 'krasa/makiyazh',
      ru: '/krasota/makiyazh',
    },
    defaultLanguage: 'en',
  },
  // Fitness programs
  fitnessGlutes: {
    path: '/fitness/glutes',
    translations: {
      en: '/fitness/glutes',
      pl: '/fitness/pozadki',
      ua: 'fitness/sady',
      ru: '/fitness/yagoditsy',
    },
    defaultLanguage: 'en',
  },
  fitnessStarter: {
    path: '/fitness/starter',
    translations: {
      en: '/fitness/starter',
      pl: '/fitness/poczatkujacy',
      ua: 'fitness/pochatkivchiy',
      ru: '/fitness/nachinayushchiy',
    },
    defaultLanguage: 'en',
  },
};

// URL utilities
export class I18nRouter {
  private currentLanguage: string;
  private defaultLanguage: string = 'en';

  constructor(currentLanguage: string) {
    this.currentLanguage = currentLanguage;
  }

  // Get localized path for a route
  getLocalizedPath(routeKey: string, language?: string): string {
    const lang = language || this.currentLanguage;
    const route = routes[routeKey];

    if (!route) {
      console.warn(`Route not found: ${routeKey}`);
      return '/404';
    }

    const path = route.translations[lang] || route.translations[route.defaultLanguage];

    // Add language prefix for non-default languages
    if (lang !== this.defaultLanguage && !path.startsWith('/')) {
      return `/${lang}${path}`;
    }

    return path;
  }

  // Get route key from current path
  getRouteFromPath(path: string): string | null {
    // Remove language prefix if present
    const cleanPath = path.replace(/^\/(en|pl|ua|ru)(?=\/|$)/, '');

    // Find matching route
    for (const [key, route] of Object.entries(routes)) {
      if (Object.values(route.translations).includes(cleanPath)) {
        return key;
      }
    }

    return null;
  }

  // Extract language from path
  extractLanguageFromPath(path: string): string {
    const match = path.match(/^\/(en|pl|ua|ru)(?=\/|$)/);
    return match ? match[1] : this.defaultLanguage;
  }

  // Generate hreflang URLs for SEO
  generateHreflangUrls(currentPath: string): Record<string, string> {
    const routeKey = this.getRouteFromPath(currentPath);
    if (!routeKey) {
      return {};
    }

    const hreflangs: Record<string, string> = {};

    // Generate URLs for all supported languages
    for (const lang of ['en', 'pl', 'ua', 'ru']) {
      const localizedPath = this.getLocalizedPath(routeKey, lang);
      const baseUrl = typeof window !== 'undefined'
        ? window.location.origin
        : 'https://mariaborysevych.com';

      hreflangs[lang] = `${baseUrl}${localizedPath}`;
    }

    // Add x-default for international users
    hreflangs['x-default'] = hreflangs['en'];

    return hreflangs;
  }

  // Get canonical URL
  getCanonicalUrl(currentPath: string): string {
    const routeKey = this.getRouteFromPath(currentPath);
    if (!routeKey) {
      return currentPath;
    }

    const localizedPath = this.getLocalizedPath(routeKey, this.currentLanguage);
    const baseUrl = typeof window !== 'undefined'
      ? window.location.origin
      : 'https://mariaborysevych.com';

    return `${baseUrl}${localizedPath}`;
  }

  // Generate sitemap URLs
  generateSitemapUrls(): Array<{
    url: string;
    lastmod: string;
    changefreq: string;
    priority: number;
    alternates: Record<string, string>;
  }> {
    const baseUrl = 'https://mariaborysevych.com';
    const urls: Array<{
      url: string;
      lastmod: string;
      changefreq: string;
      priority: number;
      alternates: Record<string, string>;
    }> = [];

    for (const [routeKey, route] of Object.entries(routes)) {
      for (const lang of ['en', 'pl', 'ua', 'ru']) {
        const localizedPath = this.getLocalizedPath(routeKey, lang);
        const url = `${baseUrl}${localizedPath}`;

        // Generate alternates for this language
        const alternates: Record<string, string> = {};
        for (const altLang of ['en', 'pl', 'ua', 'ru']) {
          const altPath = this.getLocalizedPath(routeKey, altLang);
          alternates[altLang] = `${baseUrl}${altPath}`;
        }

        urls.push({
          url,
          lastmod: new Date().toISOString(),
          changefreq: this.getChangeFrequency(routeKey),
          priority: this.getPriority(routeKey, lang),
          alternates,
        });
      }
    }

    return urls;
  }

  private getChangeFrequency(routeKey: string): string {
    const highFreq = ['blog', 'reviews', 'gallery'];
    const mediumFreq = ['beauty', 'fitness', 'prices'];
    const lowFreq = ['about', 'privacy', 'terms'];

    if (highFreq.includes(routeKey)) return 'weekly';
    if (mediumFreq.includes(routeKey)) return 'monthly';
    if (lowFreq.includes(routeKey)) return 'yearly';
    return 'monthly';
  }

  private getPriority(routeKey: string, language: string): number {
    // Higher priority for Polish language (primary market)
    const languageBonus = language === 'pl' ? 0.1 : 0;

    const highPriority = ['home', 'beauty', 'fitness'];
    const mediumPriority = ['booking', 'contact', 'about'];
    const lowPriority = ['privacy', 'terms', 'gdpr'];

    if (highPriority.includes(routeKey)) return 1.0 + languageBonus;
    if (mediumPriority.includes(routeKey)) return 0.8 + languageBonus;
    if (lowPriority.includes(routeKey)) return 0.3 + languageBonus;
    return 0.6 + languageBonus;
  }
}

// React hook for i18n routing
export const useI18nRouting = () => {
  const { currentLanguage, changeLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const router = new I18nRouter(currentLanguage);

  // Navigate to localized route
  const navigateToRoute = (routeKey: string, language?: string, options?: { replace?: boolean }) => {
    const path = router.getLocalizedPath(routeKey, language);

    if (language && language !== currentLanguage) {
      // Change language and navigate
      changeLanguage(language).then(() => {
        navigate(path, { replace: options?.replace });
      });
    } else {
      navigate(path, { replace: options?.replace });
    }
  };

  // Get current route key
  const getCurrentRoute = (): string | null => {
    return router.getRouteFromPath(location.pathname);
  };

  // Get localized URL
  const getLocalizedUrl = (routeKey: string, language?: string): string => {
    return router.getLocalizedPath(routeKey, language);
  };

  // Switch language for current route
  const switchLanguageForCurrentRoute = (targetLanguage: string) => {
    const currentRoute = getCurrentRoute();
    if (currentRoute) {
      navigateToRoute(currentRoute, targetLanguage);
    }
  };

  // Get hreflang tags for current page
  const getHreflangTags = (): Array<{ rel: string; hrefLang: string; href: string }> => {
    const hreflangs = router.generateHreflangUrls(location.pathname);
    const tags: Array<{ rel: string; hrefLang: string; href: string }> = [];

    Object.entries(hreflangs).forEach(([lang, url]) => {
      tags.push({
        rel: 'alternate',
        hrefLang: lang,
        href: url,
      });
    });

    // Add canonical URL
    tags.push({
      rel: 'canonical',
      hrefLang: currentLanguage,
      href: router.getCanonicalUrl(location.pathname),
    });

    return tags;
  };

  // Get meta tags for current page
  const getMetaTags = (): Array<{ name: string; content: string; property?: string }> => {
    const currentRoute = getCurrentRoute();
    const route = currentRoute ? routes[currentRoute] : null;
    const tags: Array<{ name: string; content: string; property?: string }> = [];

    if (route?.meta) {
      if (route.meta.title) {
        const title = route.meta.title[currentLanguage] || route.meta.title[route.defaultLanguage];
        tags.push({ name: 'title', content: title });
        tags.push({ property: 'og:title', content: title });
        tags.push({ name: 'twitter:title', content: title });
      }

      if (route.meta.description) {
        const description = route.meta.description[currentLanguage] || route.meta.description[route.defaultLanguage];
        tags.push({ name: 'description', content: description });
        tags.push({ property: 'og:description', content: description });
        tags.push({ name: 'twitter:description', content: description });
      }

      if (route.meta.keywords) {
        const keywords = route.meta.keywords[currentLanguage] || route.meta.keywords[route.defaultLanguage];
        tags.push({ name: 'keywords', content: keywords });
      }
    }

    // Add language-specific meta tags
    tags.push({ name: 'language', content: currentLanguage });
    tags.push({ property: 'og:locale', content: currentLanguage === 'en' ? 'en_GB' : currentLanguage + '_' + currentLanguage.toUpperCase() });

    // Add geographic meta tags for Warsaw
    tags.push({ name: 'geo.region', content: 'PL-MZ' });
    tags.push({ name: 'geo.placename', content: 'Warsaw' });
    tags.push({ name: 'geo.position', content: '52.2297;21.0122' });

    return tags;
  };

  return {
    router,
    navigateToRoute,
    getCurrentRoute,
    getLocalizedUrl,
    switchLanguageForCurrentRoute,
    getHreflangTags,
    getMetaTags,
    currentLanguage,
    location,
    params,
  };
};

// Utility function for server-side routing
export const getLocalizedRoute = (routeKey: string, language: string): string => {
  const router = new I18nRouter(language);
  return router.getLocalizedPath(routeKey, language);
};

// Export route configurations for external use
export { routes };