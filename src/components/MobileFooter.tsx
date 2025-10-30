import { Home, Sparkles, Dumbbell, MessageCircle, User, Calendar } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { useMode } from "@/contexts/ModeContext";

interface MobileFooterProps {
  mode?: "beauty" | "fitness";
}

const MobileFooter = ({ mode: propMode }: MobileFooterProps) => {
  const location = useLocation();
  const { mode: contextMode } = useMode();
  const mode = propMode || contextMode;
  
  const getItems = () => {
    if (mode === "beauty") {
      return [
        { icon: Home, label: "Home", href: "/" },
        { icon: Sparkles, label: "Services", href: "/beauty/services" },
        { icon: Calendar, label: "Book", href: "/beauty/services", highlight: true },
        { icon: MessageCircle, label: "Contact", href: "/contact", external: false },
        { icon: User, label: "Profile", href: "/dashboard" },
      ];
    }
    
    if (mode === "fitness") {
      return [
        { icon: Home, label: "Home", href: "/" },
        { icon: Dumbbell, label: "Programs", href: "/fitness/programs" },
        { icon: Calendar, label: "Book", href: "/fitness/programs", highlight: true },
        { icon: MessageCircle, label: "Contact", href: "/contact", external: false },
        { icon: User, label: "Profile", href: "/dashboard" },
      ];
    }
    
    // Global/home
    return [
      { icon: Home, label: "Home", href: "/" },
      { icon: Sparkles, label: "Beauty", href: "/beauty" },
      { icon: Dumbbell, label: "Fitness", href: "/fitness" },
      { icon: MessageCircle, label: "Contact", href: "/contact", external: false },
      { icon: User, label: "Profile", href: "/dashboard" },
    ];
  };

  const items = getItems();

  return (
    <nav aria-label="Main navigation" className="md:hidden fixed bottom-0 left-0 right-0 glass-card backdrop-blur-xl border-t z-50 safe-area-inset-bottom">
      <div className="grid grid-cols-5 gap-0.5 py-1.5 px-1">
        {items.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          if (item.external) {
            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center py-2 px-1 rounded-lg hover:bg-accent transition-colors min-h-[56px] touch-manipulation active:scale-95"
              >
                <Icon className="w-5 h-5 mb-0.5 flex-shrink-0" />
                <span className="text-[10px] leading-tight">{item.label}</span>
              </a>
            );
          }
          
          return (
            <Link
              key={item.label}
              to={item.href}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all min-h-[56px] touch-manipulation active:scale-95 ${
                item.highlight
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : isActive
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent"
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5 flex-shrink-0" />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileFooter;
