import { useState, memo, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Clock, Heart, Sparkles, Check, Star } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";

import BookingSheet from "./booking/BookingSheet";

interface StandardServiceCardProps {
  service: {
    id: string;
    slug: string;
    title: string;
    description: string;
    price_from: number;
    price_to?: number;
    duration_minutes?: number;
    features?: string[];
    image_url?: string;
    service_type: 'beauty' | 'fitness' | 'lifestyle';
    is_featured?: boolean;
  };
  showQuickBook?: boolean;
  allServices?: any[];
}

const StandardServiceCard = memo(({ service, showQuickBook = false, allServices = [] }: StandardServiceCardProps) => {
  const { formatPrice } = useCurrency();
  const { i18n } = useTranslation();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookerOpen, setIsBookerOpen] = useState(false);

  const priceDisplay = useMemo(() => {
    return service.price_to && service.price_from !== service.price_to
      ? `${formatPrice(service.price_from)}-${formatPrice(service.price_to)}`
      : `${formatPrice(service.price_from)}+`;
  }, [service.price_from, service.price_to, formatPrice]);

  const imageSrc = useMemo(() => {
    const fallbackBase = 'https://lckxvimdqnfjzkbrusgu.supabase.co/storage/v1/object/public/site-images/services';
    return service.image_url || `${fallbackBase}/${service.slug}-hero.png`;
  }, [service.image_url, service.slug]);

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsFavorite(!isFavorite);
  }, [isFavorite]);

  const handleQuickBook = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsBookerOpen(true);
  }, []);

  const handleCloseBooker = useCallback(() => {
    setIsBookerOpen(false);
  }, []);

  const detailsText = useMemo(() => {
    return i18n.language === 'pl' ? "Szczegóły" : i18n.language === 'en' ? "Details" : i18n.language === 'ua' ? "Деталі" : "Детали";
  }, [i18n.language]);

  return (
    <>
      <Card className="group glass-card rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-luxury-strong hover:scale-[1.02] hover:-translate-y-1 hover:border-champagne/30 h-full flex flex-col relative">
        {imageSrc && (
          <div className="h-48 overflow-hidden relative flex-shrink-0">
            <img
              src={imageSrc}
              alt={service.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            {service.is_featured && (
              <div className="absolute top-4 left-4 z-10">
                <Badge className="bg-gradient-to-r from-rose-gold to-champagne text-foreground font-semibold px-3 py-1 shadow-lg border-0">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Most Popular
                </Badge>
              </div>
            )}
            <button
              onClick={handleFavoriteClick}
              className="absolute top-4 right-4 p-2 bg-charcoal/80 backdrop-blur-sm rounded-full hover:bg-charcoal transition-colors z-10"
            >
              <Heart className={`w-5 h-5 transition-all ${isFavorite ? 'fill-lip-rose text-lip-rose' : 'text-pearl'}`} />
            </button>
          </div>
        )}

        <div className="p-6 space-y-4 flex-1 flex flex-col">
          <div className="space-y-3 flex-1">
            <Link to={`/${service.service_type}/services/${service.slug}`}>
              <h3 className="text-xl heading-serif text-pearl group-hover:text-champagne transition-colors line-clamp-2 font-medium">
                {service.title}
              </h3>
            </Link>
            <p className="text-sm text-pearl/70 leading-relaxed line-clamp-3 min-h-[3.75rem] text-body">
              {service.description}
            </p>
          </div>

          <div className="flex items-center gap-4 pt-3 border-t border-graphite/10">
            {service.duration_minutes && (
              <div className="flex items-center gap-2 text-sm text-pearl/70 text-body">
                <Clock className="w-4 h-4 text-champagne" />
                <span>{service.duration_minutes}min</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-lg font-medium text-pearl heading-serif">
              <span className="editorial-number">{priceDisplay}</span>
            </div>
          </div>

          {service.features && service.features.length > 0 && (
            <div className="space-y-2">
              {service.features.slice(0, 3).map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-pearl/70 text-body">
                  <Check className="w-3 h-3 text-sage flex-shrink-0" />
                  <span className="line-clamp-1">{feature}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2 mt-auto">
            <Button
              className="flex-1"
              asChild
            >
              <Link to={`/${service.service_type}/services/${service.slug}`}>
                {detailsText}
              </Link>
            </Button>
            {showQuickBook && (
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={handleQuickBook}
              >
                <Sparkles className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-champagne/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </Card>

      {showQuickBook && (
        <BookingSheet
          isOpen={isBookerOpen}
          onClose={handleCloseBooker}
          preselectedService={service.id}
          services={allServices}
        />
      )}
    </>
  );
});

StandardServiceCard.displayName = 'StandardServiceCard';

export default StandardServiceCard;
