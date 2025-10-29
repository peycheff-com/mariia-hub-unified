import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { generateSlug, generateSeoPath } from './slugGenerator';

interface UrlManagerOptions {
  defaultLocale?: string;
  supportedLocales?: string[];
  prefixDefault?: boolean;
}

export const useUrlManager = (options: UrlManagerOptions = {}) => {
  const {
    defaultLocale = 'en',
    supportedLocales = ['en', 'pl'],
    prefixDefault = false
  } = options;

  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const currentLocale = i18n.language;

  /**
   * Get localized URL for a specific path
   */
  const getLocalizedUrl = useMemo(() => {
    return (path: string, locale?: string): string => {
      const targetLocale = locale || currentLocale;
      const cleanPath = path.replace(/^\/+/, '');

      // Add locale prefix if needed
      if (targetLocale !== defaultLocale || prefixDefault) {
        return `/${targetLocale}/${cleanPath}`;
      }

      return `/${cleanPath}`;
    };
  }, [currentLocale, defaultLocale, prefixDefault]);

  /**
   * Get current path without locale prefix
   */
  const getPathWithoutLocale = useMemo(() => {
    return (): string => {
      const segments = location.pathname.split('/').filter(Boolean);

      // Remove locale if it's the first segment
      if (segments.length > 0 && supportedLocales.includes(segments[0])) {
        segments.shift();
      }

      return '/' + segments.join('/');
    };
  }, [location.pathname, supportedLocales]);

  /**
   * Navigate to a localized route
   */
  const navigateToLocale = useMemo(() => {
    return (path: string, locale?: string) => {
      const url = getLocalizedUrl(path, locale);
      navigate(url);
    };
  }, [navigate, getLocalizedUrl]);

  /**
   * Switch language while maintaining current route
   */
  const switchLanguage = useMemo(() => {
    return (newLocale: string) => {
      const currentPath = getPathWithoutLocale();
      const newUrl = getLocalizedUrl(currentPath, newLocale);
      navigate(newUrl);
    };
  }, [navigate, getPathWithoutLocale, getLocalizedUrl]);

  /**
   * Generate SEO-friendly service URL
   */
  const generateServiceUrl = useMemo(() => {
    return (
      serviceId: string,
      serviceName: string,
      category?: string,
      locale?: string
    ): string => {
      const slug = generateSlug(serviceName, { lang: locale || currentLocale });
      const basePath = category ? `${category}/${slug}` : slug;

      return generateSeoPath(
        basePath,
        serviceId,
        locale || currentLocale
      );
    };
  }, [currentLocale]);

  /**
   * Generate blog post URL
   */
  const generateBlogUrl = useMemo(() => {
    return (
      postId: string,
      title: string,
      category?: string,
      locale?: string
    ): string => {
      const slug = generateSlug(title, { lang: locale || currentLocale });
      const basePath = category ? `blog/${category}/${slug}` : `blog/${slug}`;

      return generateSeoPath(
        basePath,
        postId,
        locale || currentLocale
      );
    };
  }, [currentLocale]);

  /**
   * Parse URL to extract components
   */
  const parseUrl = useMemo(() => {
    return (url: string) => {
      const urlObj = new URL(url, window.location.origin);
      const segments = urlObj.pathname.split('/').filter(Boolean);

      let locale = defaultLocale;
      let pathSegments = segments;

      // Extract locale from URL
      if (segments.length > 0 && supportedLocales.includes(segments[0])) {
        locale = segments[0];
        pathSegments = segments.slice(1);
      }

      // Parse search params
      const params: Record<string, string> = {};
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });

      return {
        locale,
        path: '/' + pathSegments.join('/'),
        segments: pathSegments,
        params,
        hash: urlObj.hash
      };
    };
  }, [defaultLocale, supportedLocales]);

  /**
   * Generate canonical URL
   */
  const getCanonicalUrl = useMemo(() => {
    return (path?: string, locale?: string): string => {
      const targetPath = path || location.pathname;
      const targetLocale = locale || currentLocale;

      // Use the current language as canonical
      return `${window.location.origin}${targetPath}`;
    };
  }, [location.pathname, currentLocale]);

  /**
   * Generate alternate language URLs
   */
  const getAlternateUrls = useMemo(() => {
    return (path?: string): Record<string, string> => {
      const targetPath = path || getPathWithoutLocale();
      const alternates: Record<string, string> = {};

      supportedLocales.forEach(locale => {
        alternates[locale] = `${window.location.origin}${getLocalizedUrl(targetPath, locale)}`;
      });

      // Add x-default
      alternates['x-default'] = `${window.location.origin}${targetPath}`;

      return alternates;
    };
  }, [supportedLocales, getLocalizedUrl, getPathWithoutLocale]);

  /**
   * Generate redirect mapping
   */
  const generateRedirects = useMemo(() => {
    return (routes: Record<string, string>): Array<{ from: string; to: string; permanent?: boolean }> => {
      const redirects: Array<{ from: string; to: string; permanent?: boolean }> = [];

      Object.entries(routes).forEach(([from, to]) => {
        // Generate redirects for each locale
        supportedLocales.forEach(locale => {
          if (locale !== defaultLocale || prefixDefault) {
            redirects.push({
              from: `/${locale}${from}`,
              to: getLocalizedUrl(to, locale),
              permanent: true
            });
          } else {
            redirects.push({
              from,
              to: getLocalizedUrl(to, locale),
              permanent: true
            });
          }
        });
      });

      return redirects;
    };
  }, [supportedLocales, defaultLocale, prefixDefault, getLocalizedUrl]);

  return {
    // Current state
    currentLocale,
    currentPath: location.pathname,
    pathWithoutLocale: getPathWithoutLocale(),

    // URL generation
    getLocalizedUrl,
    generateServiceUrl,
    generateBlogUrl,
    getCanonicalUrl,
    getAlternateUrls,

    // Navigation
    navigateToLocale,
    switchLanguage,

    // Utilities
    parseUrl,
    generateRedirects
  };
};