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
    <div className="h-full p-6 glass-card text-foreground rounded-3xl transition-all duration-300 hover:shadow-luxury-strong hover:scale-[1.02] hover:bg-champagne/5 flex flex-col justify-between min-h-[280px] group cursor-pointer relative border border-champagne/10">
      {/* Enhanced Action Buttons */}
      <div className="absolute top-3 right-3 flex gap-2 z-10">
        {showQuickBook && (
          <Button
            variant="luxury"
            size="icon"
            className="h-11 w-11 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100 shadow-luxury hover:shadow-luxury-strong touch-manipulation"
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
          className="h-11 w-11 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100 glass-card hover:bg-champagne/10 touch-manipulation"
          onClick={handleFavoriteClick}
          aria-label="Add to favorites"
        >
          <Heart
            className={`w-4 h-4 transition-colors duration-300 ${
              isFavorite(id)
                ? 'fill-rose-gold text-rose-gold animate-scale-in'
                : 'text-graphite-500 hover:text-rose-gold'
            }`}
          />
        </Button>
      </div>

      {/* Enhanced Service Content */}
      <div className="flex-1 space-y-4">
        {Icon && (
          <div className="w-12 h-12 rounded-2xl glass-accent flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
            <Icon className="w-6 h-6 text-champagne-foreground" />
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-xl font-semibold heading-serif leading-tight tracking-tight text-foreground">
            {name}
          </h3>
          <p className="text-sm text-graphite-600 leading-relaxed line-clamp-3 text-body min-h-[2.5rem]">
            {description}
          </p>
        </div>
      </div>

      {/* Enhanced Price and Duration */}
      <div className="flex items-center justify-between text-sm pt-4 border-t border-champagne/10 mt-auto">
        {duration && (
          <span className="text-graphite-500 text-body flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-champagne/50" />
            {duration}
          </span>
        )}
        {priceFrom && (
          <span className="font-semibold text-champagne-foreground heading-serif">
            From <span className="text-lg">{priceFrom}</span> PLN
          </span>
        )}
      </div>

      {/* Subtle hover overlay */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-champagne/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
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
