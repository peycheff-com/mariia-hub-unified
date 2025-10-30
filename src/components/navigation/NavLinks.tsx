import { Link } from 'react-router-dom';
import { memo, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, Dumbbell, BookOpen, User, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMode } from '@/contexts/ModeContext';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  isRoute: boolean;
  icon?: any;
  section?: string;
}

interface NavLinksProps {
  className?: string;
}

const NavLinks = memo(({ className }: NavLinksProps) => {
  const location = useLocation();
  const { t } = useTranslation();
  const { mode: contextMode } = useMode();

  const navItems = useMemo(() => {
    // On home, keep IA minimal
    if (!contextMode && location.pathname === "/") {
      return [
        { name: t("nav.blog"), href: "/blog", isRoute: true, icon: BookOpen },
        { name: "About", href: "/about", isRoute: true, icon: User },
        { name: "Contact", href: "/contact", isRoute: true, icon: Mail },
      ];
    }

    // On non-home non-mode pages
    if (!location.pathname.startsWith('/beauty') && !location.pathname.startsWith('/fitness') && location.pathname !== '/') {
      return [
        { name: t("nav.blog"), href: "/blog", isRoute: true, icon: BookOpen },
        { name: "About", href: "/about", isRoute: true, icon: User },
        { name: "Contact", href: "/contact", isRoute: true, icon: Mail },
      ];
    }

    if (contextMode === "beauty") {
      return [
        { name: "Services", href: "/beauty/services", isRoute: true, icon: Sparkles },
        { name: "Portfolio", href: "/beauty#portfolio", section: "portfolio", icon: BookOpen },
        { name: "FAQs", href: "/beauty#faqs", section: "faqs", icon: Mail },
      ];
    } else if (contextMode === "fitness") {
      return [
        { name: "Programs", href: "/fitness/programs", isRoute: true, icon: Dumbbell },
        { name: "Starter", href: "/lp/fitness/starter", isRoute: true, icon: Sparkles },
        { name: "Glute Sculpt", href: "/lp/fitness/glutes-8w", isRoute: true, icon: User },
      ];
    }

    // Global navigation
    return [
      { name: "Beauty", href: "/beauty", isRoute: true, icon: Sparkles },
      { name: "Fitness", href: "/fitness", isRoute: true, icon: Dumbbell },
      { name: t("nav.blog"), href: "/blog", isRoute: true, icon: BookOpen },
      { name: "About", href: "/about", isRoute: true, icon: User },
      { name: "Contact", href: "/contact", isRoute: true, icon: Mail },
    ];
  }, [contextMode, location.pathname, t]);

  const handleNavClick = (item: NavItem, e?: React.MouseEvent) => {
    if (item.isRoute) {
      window.location.href = item.href;
    } else {
      e?.preventDefault();
      const element = document.getElementById(item.section || '');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {navItems.map((item) => {
        const isActive = item.isRoute && location.pathname === item.href;
        return item.isRoute ? (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "text-sm transition-all duration-300 relative group py-2 px-3 -mx-3 rounded-lg hover:bg-champagne/10 touch-manipulation focus-visible",
              "hover-lift",
              isActive ? "text-champagne font-medium" : "text-pearl/90 hover:text-pearl"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {item.name}
            <span className={cn(
              "absolute -bottom-1 left-0 h-[2px] bg-champagne transition-all duration-300",
              isActive ? "w-full" : "w-0 group-hover:w-full"
            )} />
          </Link>
        ) : (
          <button
            key={item.name}
            onClick={(e) => handleNavClick(item, e)}
            className="text-sm text-pearl/90 hover:text-pearl transition-all duration-300 relative group py-2 px-3 -mx-3 rounded-lg hover:bg-champagne/10 touch-manipulation focus-visible hover-lift"
            aria-label={`Navigate to ${item.name} section`}
          >
            {item.name}
            <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-champagne group-hover:w-full transition-all duration-300" />
          </button>
        );
      })}
    </div>
  );
});

NavLinks.displayName = 'NavLinks';

export default NavLinks;
