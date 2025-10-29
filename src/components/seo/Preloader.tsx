import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

interface PreloaderProps {
  criticalImages?: string[];
  criticalFonts?: string[];
  criticalCSS?: string[];
  criticalJS?: string[];
  prefetchResources?: string[];
  preconnectOrigins?: string[];
}

export function Preloader({
  criticalImages = [],
  criticalFonts = [],
  criticalCSS = [],
  criticalJS = [],
  prefetchResources = [],
  preconnectOrigins = [],
}: PreloaderProps) {
  useEffect(() => {
    // Preload critical resources early
    const preloadResource = (href: string, as: string, type?: string, crossorigin?: string) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = as;
      if (type) link.type = type;
      if (crossorigin) link.crossOrigin = crossorigin;

      // Insert at beginning of head for highest priority
      const head = document.head;
      head.insertBefore(link, head.firstChild);
    };

    // Preload critical images with fetchpriority
    criticalImages.forEach(src => {
      preloadResource(src, 'image', undefined, 'anonymous');
    });

    // Preload critical fonts
    criticalFonts.forEach(fontHref => {
      preloadResource(fontHref, 'font', 'font/woff2', 'anonymous');
    });

    // Preload critical CSS
    criticalCSS.forEach(cssHref => {
      preloadResource(cssHref, 'style');
    });

    // Preload critical JavaScript
    criticalJS.forEach(jsHref => {
      preloadResource(jsHref, 'script', 'module');
    });

    // Prefetch resources for next navigation
    const prefetchResource = (href: string, as?: string) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      if (as) link.as = as;

      // Lower priority than preload
      document.head.appendChild(link);
    };

    prefetchResources.forEach(href => {
      prefetchResource(href);
    });

    // Preconnect to external origins
    preconnectOrigins.forEach(origin => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      link.crossOrigin = 'anonymous';

      document.head.appendChild(link);
    });

    // DNS prefetch for external domains
    const dnsPrefetch = (domain: string) => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain}`;

      document.head.appendChild(link);
    };

    // Clean up function
    return () => {
      const preloadLinks = document.querySelectorAll('link[rel="preload"]');
      preloadLinks.forEach(link => link.remove());
    };
  }, [criticalImages, criticalFonts, criticalCSS, criticalJS, prefetchResources, preconnectOrigins]);

  return (
    <Helmet>
      {/* Preconnect to critical external origins */}
      {preconnectOrigins.map(origin => (
        <link key={origin} rel="preconnect" href={origin} crossOrigin="anonymous" />
      ))}

      {/* DNS prefetch for external services */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//www.googletagmanager.com" />
      <link rel="dns-prefetch" href="//www.google-analytics.com" />

      {/* Preload critical fonts */}
      {criticalFonts.map(font => (
        <link
          key={font}
          rel="preload"
          href={font}
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      ))}

      {/* Preload critical CSS */}
      {criticalCSS.map(css => (
        <link
          key={css}
          rel="preload"
          href={css}
          as="style"
        />
      ))}

      {/* Preload critical JavaScript */}
      {criticalJS.map(js => (
        <link
          key={js}
          rel="preload"
          href={js}
          as="script"
        />
      ))}

      {/* Prefetch next page resources */}
      {prefetchResources.map(resource => (
        <link
          key={resource}
          rel="prefetch"
          href={resource}
        />
      ))}

      {/* Inline critical CSS for faster rendering */}
      <style>{`
        /* Critical CSS for LCP */
        .lcp-preloader {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: var(--background);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        /* Font loading optimization */
        @font-face {
          font-display: swap;
        }

        /* Optimize above-the-fold content */
        .hero-section,
        .booking-form,
        .service-grid {
          contain: layout style paint;
        }

        /* Optimize images */
        img {
          content-visibility: auto;
          contain: layout;
        }
      `}</style>

      {/* JSON-LD for SEO */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Mariia Hub",
          "description": "Premium beauty and fitness booking platform",
          "url": typeof window !== 'undefined' ? window.location.origin : '',
          "applicationCategory": "LifestyleApplication",
          "operatingSystem": "Web Browser",
          "offers": {
            "@type": "Offer",
            "name": "Beauty & Fitness Services",
            "description": "Book premium beauty and fitness services online",
            "url": typeof window !== 'undefined' ? `${window.location.origin}/booking` : ''
          }
        })}
      </script>
    </Helmet>
  );
}

// Hook for programmatic preloading
export function usePreloader() {
  const preloadResource = (href: string, options: {
    as?: string;
    type?: string;
    priority?: 'high' | 'low';
  } = {}) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;

    if (options.as) link.as = options.as;
    if (options.type) link.type = options.type;
    if (options.priority === 'high') {
      link.setAttribute('fetchpriority', 'high');
    }

    document.head.appendChild(link);
  };

  const prefetchPage = (pageUrl: string) => {
    // Prefetch page resources
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = pageUrl;
    document.head.appendChild(link);
  };

  const preconnectTo = (origin: string) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  };

  return {
    preloadResource,
    prefetchPage,
    preconnectTo,
  };
}

// Component for optimizing LCP of images
export function LCPImage({ src, alt, priority = 'auto', className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="eager"
      decoding="sync"
      fetchpriority={priority}
      style={{
        contentVisibility: 'auto',
      }}
      {...props}
    />
  );
}

// Component for optimizing LCP of hero sections
export function LCPHero({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`lcp-hero ${className || ''}`} style={{ contain: 'layout style paint' }}>
      {children}
    </div>
  );
}

// Resource prioritization hints
export function ResourceHints() {
  return (
    <>
      {/* Prioritize critical resources */}
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      <link rel="preload" href="/fonts/Inter-Italic.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />

      {/* Critical CSS */}
      <link rel="preload" href="/assets/hero.css" as="style" />

      {/* Critical JS for interactivity */}
      <link rel="preload" href="/assets/main.js" as="script" />

      {/* Preconnect to CDNs */}
      <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />

      {/* DNS prefetch for analytics */}
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      <link rel="dns-prefetch" href="//stats.g.doubleclick.net" />
    </>
  );
}