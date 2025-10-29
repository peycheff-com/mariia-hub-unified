import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useCurrency } from "@/contexts/CurrencyContext";

import { Button } from "./ui/button";

import lipsPermanentMakeup from "@/assets/lips-permanent-makeup.jpg";

const BeautySection = () => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  
  const services = [
    {
      title: t('beautySection.services.lips.title'),
      subtitle: t('beautySection.services.lips.subtitle'),
      description: t('beautySection.services.lips.description'),
      price: 900,
      image: lipsPermanentMakeup,
    },
    {
      title: t('beautySection.services.brows.title'),
      subtitle: t('beautySection.services.brows.subtitle'),
      description: t('beautySection.services.brows.description'),
      price: 900,
    },
    {
      title: t('beautySection.services.eyeliner.title'),
      subtitle: t('beautySection.services.eyeliner.subtitle'),
      description: t('beautySection.services.eyeliner.description'),
      price: 900,
    },
    {
      title: t('beautySection.services.styling.title'),
      subtitle: t('beautySection.services.styling.subtitle'),
      description: t('beautySection.services.styling.description'),
      price: 40,
    },
  ];

  return (
    <section id="beauty" className="relative">
      {/* Split screen layout - Left side text, Right side scrolling services */}
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Left - Sticky content */}
        <div className="relative bg-pearl flex items-center">
          <div className="sticky top-24 w-full px-6 md:px-12 lg:px-16 py-16 md:py-20">
            <div className="max-w-xl space-y-8">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 glass-card rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-lip-rose animate-pulse" />
                  <span className="text-xs text-lip-rose uppercase tracking-wider font-medium">{t('beautySection.badge')}</span>
                </div>
                
                <h2 className="text-5xl md:text-6xl lg:text-7xl leading-[0.9] text-charcoal tracking-tight whitespace-pre-line">
                  {t('beautySection.title')}
                </h2>
                
                <div className="w-16 h-[2px] bg-gradient-to-r from-lip-rose to-champagne" />
              </div>
              
              <p className="text-lg md:text-xl text-graphite leading-relaxed font-light">
                {t('beautySection.description')}
              </p>

              <div className="flex flex-col gap-4 pt-4">
                <Button 
                  size="lg"
                  className="group w-full sm:w-auto justify-between"
                  asChild
                >
                  <Link to="/beauty/services">
                    <span>{t('beautySection.viewPortfolio')}</span>
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                
                <Button 
                  size="lg"
                  variant="outline"
                  className="group w-full sm:w-auto justify-between"
                  asChild
                >
                  <a href="/blog">
                    <span>Journal</span>
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
              </div>

              <div className="pt-8 flex items-center gap-6 text-sm text-graphite/60 border-t border-graphite/10">
                <span className="flex items-center gap-2">
                  <span className="text-lip-rose">📍</span>
                  {t('beautySection.location')}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-champagne">⭐</span>
                  5.0 · {t('beautySection.reviews')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Services grid */}
        <div className="bg-cocoa p-6 md:p-10 lg:p-16 flex items-center">
          <div className="w-full grid gap-5 md:gap-6">
            {services.map((service, index) => (
              <div
                key={index}
                className="group relative glass-card rounded-3xl overflow-hidden hover-scale transition-all duration-300"
              >
                {service.image ? (
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="h-64 md:h-auto overflow-hidden">
                      <img 
                        src={service.image}
                        alt={service.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-8 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs text-champagne uppercase tracking-widest mb-2">{service.subtitle}</div>
                          <h3 className="text-3xl font-serif text-pearl">{service.title}</h3>
                        </div>
                        <p className="text-pearl/90 leading-relaxed">{service.description}</p>
                      </div>
                      <div className="flex items-end justify-between pt-6 mt-auto">
                        <div>
                          <div className="text-xs text-pearl/50 uppercase tracking-wider mb-1">{t('beautySection.from')}</div>
                          <div className="text-2xl font-serif text-champagne editorial-number">{formatPrice(service.price)}</div>
                        </div>
                        <div className="w-10 h-10 rounded-full border border-champagne/30 flex items-center justify-center text-champagne group-hover:bg-champagne/10 transition-colors">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 space-y-4">
                    <div>
                      <div className="text-xs text-champagne uppercase tracking-widest mb-2">{service.subtitle}</div>
                      <h3 className="text-3xl font-serif text-pearl">{service.title}</h3>
                    </div>
                    <p className="text-pearl/90 leading-relaxed">{service.description}</p>
                    <div className="flex items-end justify-between pt-4">
                      <div>
                        <div className="text-xs text-pearl/50 uppercase tracking-wider mb-1">{t('beautySection.from')}</div>
                        <div className="text-2xl font-serif text-champagne editorial-number">{formatPrice(service.price)}</div>
                      </div>
                      <div className="w-10 h-10 rounded-full border border-champagne/30 flex items-center justify-center text-champagne group-hover:bg-champagne/10 transition-colors">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BeautySection;
