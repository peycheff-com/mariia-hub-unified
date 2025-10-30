import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { memo } from "react";

import { ResponsiveHero } from '@/components/ui/responsive-image';

import { Button } from "./ui/button";

import headerImage from "@/assets/header.png";

const Hero = memo(() => {
  const { t } = useTranslation();

  return (
    <section className="hero-immersive overflow-hidden">
      {/* Parallax background layers */}
      <div className="absolute inset-0">
        {/* Main background image */}
        <div className="parallax-slow absolute inset-0">
          <ResponsiveHero
            src={headerImage}
            alt="Mariia Borysevych - Beauty Artist and Personal Trainer in Warsaw"
            priority
            loading="eager"
          />
        </div>
        {/* Atmospheric overlays */}
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
      </div>

      {/* Premium floating decorative elements with enhanced animations */}
      <div className="absolute top-20 right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-float image-reveal" />
      <div className="absolute bottom-40 left-10 w-48 h-48 bg-champagne/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-rose-gold/5 rounded-full blur-2xl animate-float" style={{ animationDelay: '4s' }} />
      <div className="absolute bottom-1/3 right-20 w-36 h-36 bg-soft-gold/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />

      {/* Content with improved layout */}
      <div className="relative z-10 w-full">
        <div className="container-asym-left">
          <div className="max-w-4xl space-y-section stagger-children">
            {/* Luxury eyebrow indicator */}
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass-card-light hover:scale-105 transition-transform duration-500">
              <div className="w-2 h-2 rounded-full bg-champagne pulse-glow" />
              <span className="text-sm font-body tracking-[0.3em] uppercase font-light text-charcoal-700">
                {t('hero.eyebrow')}
              </span>
            </div>

            {/* Enhanced hero headline with premium animations */}
            <h1 className="space-y-2 md:space-y-0 stagger-children">
              <span className="block text-hero-serif animate-fade-rise text-shadow-lg">
                {t('hero.title1')}
              </span>
              <span className="block text-hero-serif text-gradient-animated font-light animate-fade-rise">
                {t('hero.title2')}
              </span>
            </h1>

            {/* Enhanced subtitle with smooth reveal */}
            <p className="text-description text-pearl max-w-3xl font-light animate-fade-in" style={{
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
              animationDelay: '400ms'
            }}>
              {t('hero.subtitle')}
            </p>

            {/* Premium CTA section with enhanced animations */}
            <div className="flex flex-col gap-6 pt-6 animate-slide-up" style={{ animationDelay: '600ms' }}>
              {/* Primary buttons with premium effects */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="xl"
                  className="group btn-large btn-premium magnetic-hover text-shadow"
                  asChild
                >
                  <Link to="/beauty/services">
                    {t('hero.bookBeauty')}
                    <span className="ml-3 transition-all duration-300 group-hover:translate-x-2 inline-block">
                      →
                    </span>
                  </Link>
                </Button>

                <Button
                  size="xl"
                  variant="outline"
                  className="group btn-large btn-premium magnetic-hover text-shadow border-champagne/30 hover:border-champagne"
                  asChild
                >
                  <Link to="/fitness/programs">
                    {t('hero.startTraining')}
                    <span className="ml-3 transition-all duration-300 group-hover:translate-x-2 inline-block">
                      →
                    </span>
                  </Link>
                </Button>
              </div>

              {/* Premium stats with hover effects */}
              <div className="flex items-center gap-8 sm:gap-12 pl-0 sm:pl-8 border-l-0 sm:border-l border-champagne/50">
                <div className="space-y-1 group cursor-pointer hover-lift">
                  <div className="text-2xl md:text-3xl heading-serif text-champagne editorial-number font-semibold group-hover:scale-110 transition-transform animate-pulse-slow" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                    5.0
                  </div>
                  <div className="text-xs text-pearl uppercase tracking-wider text-body font-medium" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                    {t('hero.rating')}
                  </div>
                </div>
                <div className="space-y-1 group cursor-pointer hover-lift">
                  <div className="text-2xl md:text-3xl heading-serif text-champagne editorial-number font-semibold group-hover:scale-110 transition-transform animate-pulse-slow" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                    56K+
                  </div>
                  <div className="text-xs text-pearl uppercase tracking-wider text-body font-medium" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                    {t('hero.followers')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium scroll indicator with luxury styling */}
      <a
        href="#trust"
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3 text-pearl hover:text-champagne transition-all duration-500 group magnetic-hover animate-fade-in"
        aria-label="Scroll down to learn more"
        role="button"
        style={{ animationDelay: '1000ms' }}
      >
        <div className="w-px h-12 bg-gradient-to-b from-champagne via-champagne/50 to-transparent opacity-80 group-hover:opacity-100 group-hover:h-16 transition-all duration-500 animate-pulse-slow" aria-hidden="true" />
        <div className="relative">
          <ChevronDown
            className="w-6 h-6 animate-bounce transition-all duration-300 group-hover:text-champagne group-hover:scale-110"
            strokeWidth={1.5}
            aria-hidden="true"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}
          />
          <div className="absolute inset-0 w-6 h-6 border border-champagne/30 rounded-full animate-ping opacity-75 group-hover:opacity-100" aria-hidden="true" />
        </div>
        <span className="text-xs uppercase tracking-widest text-body font-medium opacity-90 group-hover:opacity-100 transition-all duration-300 group-hover:tracking-widest text-shadow" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
          Scroll to explore
        </span>
      </a>
    </section>
  );
});

Hero.displayName = 'Hero';

export default Hero;
