import { LucideIcon , Heart, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

import { useFavorites } from "@/hooks/useFavorites";
import { Button } from "@/components/ui/button";
import BookingSheet from "@/components/booking/BookingSheet";

interface ServiceCardProps {
  id: string;
  name: string;
  description: string;
  duration?: string;
  priceFrom?: number;
  icon?: LucideIcon;
  slug: string;
  type: "beauty" | "fitness";
  onClick?: () => void;
  showQuickBook?: boolean;
  allServices?: any[];
}

const ServiceCard = ({
  id,
  name,
  description,
  duration,
  priceFrom,
  icon: Icon,
  slug,
  type,
  onClick,
  showQuickBook = false,
  allServices = [],
}: ServiceCardProps) => {
  const basePath = type === "beauty" ? "/beauty/services" : "/fitness/programs";
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(id);
  };

  const handleQuickBook = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBookingOpen(true);
  };

  const content = (
    <div className="h-full p-6 glass-card text-foreground rounded-3xl transition-all duration-500 hover:shadow-luxury-strong hover:scale-[1.02] hover:bg-champagne/5 flex flex-col justify-between min-h-[280px] group cursor-pointer relative border border-champagne/10 card-elegant animate-fade-in">
      {/* Premium Action Buttons */}
      <div className="absolute top-3 right-3 flex gap-2 z-10">
        {showQuickBook && (
          <Button
            variant="luxury"
            size="icon"
            className="h-11 w-11 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100 shadow-luxury hover:shadow-luxury-strong touch-manipulation magnetic-hover btn-premium"
            onClick={handleQuickBook}
            title="Quick Book"
            aria-label="Quick book this service"
          >
            <Sparkles className="w-4 h-4 text-champagne-foreground" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100 glass-card hover:bg-champagne/10 touch-manipulation magnetic-hover"
          onClick={handleFavoriteClick}
          aria-label="Add to favorites"
        >
          <Heart
            className={`w-4 h-4 transition-all duration-500 ${
              isFavorite(id)
                ? 'fill-rose-gold text-rose-gold animate-scale-in'
                : 'text-graphite-500 hover:text-rose-gold hover:scale-110'
            }`}
          />
        </Button>
      </div>

      {/* Premium Service Content */}
      <div className="flex-1 space-y-4 stagger-children">
        {Icon && (
          <div className="w-12 h-12 rounded-2xl glass-accent flex items-center justify-center group-hover:scale-110 transition-all duration-500 flex-shrink-0 magnetic-hover">
            <Icon className="w-6 h-6 text-champagne-foreground transition-all duration-500 group-hover:text-champagne" />
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-xl font-semibold heading-serif leading-tight tracking-tight text-foreground group-hover:text-champagne-foreground transition-colors duration-300">
            {name}
          </h3>
          <p className="text-sm text-graphite-600 leading-relaxed line-clamp-3 text-body min-h-[2.5rem] transition-colors duration-300 group-hover:text-graphite-700">
            {description}
          </p>
        </div>
      </div>

      {/* Enhanced Price and Duration with premium styling */}
      <div className="flex items-center justify-between text-sm pt-4 border-t border-champagne/10 mt-auto animate-fade-in" style={{ animationDelay: '200ms' }}>
        {duration && (
          <span className="text-graphite-500 text-body flex items-center gap-2 group-hover:text-graphite-600 transition-colors duration-300">
            <span className="w-1.5 h-1.5 rounded-full bg-champagne/50 animate-pulse-slow" />
            {duration}
          </span>
        )}
        {priceFrom && (
          <span className="font-semibold text-champagne-foreground heading-serif group-hover:text-champagne transition-colors duration-300">
            From <span className="text-lg group-hover:scale-110 inline-block transition-transform duration-300">{priceFrom}</span> PLN
          </span>
        )}
      </div>

      {/* Premium hover overlay with shimmer effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-champagne/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none image-reveal" />

      {/* Floating particles on hover */}
      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-champagne/30 rounded-full blur-sm animate-ping" />
        <div className="absolute top-3/4 right-1/4 w-1.5 h-1.5 bg-rose-gold/30 rounded-full blur-sm animate-ping" style={{ animationDelay: '200ms' }} />
        <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-soft-gold/30 rounded-full blur-sm animate-ping" style={{ animationDelay: '400ms' }} />
      </div>
    </div>
  );

  const cardContent = onClick ? (
    <div onClick={onClick}>{content}</div>
  ) : (
    <Link to={`${basePath}/${slug}`}>{content}</Link>
  );

  return (
    <>
      {cardContent}
      {showQuickBook && (
        <BookingSheet
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          preselectedService={id}
          services={allServices}
        />
      )}
    </>
  );
};

export default ServiceCard;
