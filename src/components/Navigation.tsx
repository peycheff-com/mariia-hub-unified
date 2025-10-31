import { useState, useEffect, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Sparkles, Dumbbell } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useMode } from "@/contexts/ModeContext";
import { useAuthState } from "@/hooks/useAuthState";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import LanguageSwitcher from "./LanguageSwitcher";
import CurrencySwitcher from "./CurrencySwitcher";
import UserMenu from "./UserMenu";
import ModeToggle from "./ModeToggle";

import logo from "@/assets/logo.png";

const Navigation = memo(({ mode: propMode }: { mode?: "beauty" | "fitness" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mode: contextMode } = useMode();
  const { user, isLoading: authLoading } = useAuthState();

  const activeMode = propMode || contextMode;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getNavItems = () => {
    if (!activeMode) {
      return [
        { name: t("nav.blog"), href: "/blog", isRoute: true },
        { name: "About", href: "/about", isRoute: true },
        { name: "Contact", href: "/contact", isRoute: true },
      ];
    }

    if (activeMode === "beauty") {
      return [
        { name: "Services", href: "/beauty/services", isRoute: true },
        { name: "Portfolio", href: "/beauty#portfolio", section: "portfolio" },
        { name: "FAQs", href: "/beauty#faqs", section: "faqs" },
      ];
    } else if (activeMode === "fitness") {
      return [
        { name: "Programs", href: "/fitness/programs", isRoute: true },
        { name: "Starter", href: "/lp/fitness/starter", isRoute: true },
        { name: "Glute Sculpt", href: "/lp/fitness/glutes-8w", isRoute: true },
      ];
    }

    return [
      { name: "Beauty", href: "/beauty", isRoute: true },
      { name: "Fitness", href: "/fitness", isRoute: true },
      { name: t("nav.blog"), href: "/blog", isRoute: true },
      { name: "About", href: "/about", isRoute: true },
      { name: "Contact", href: "/contact", isRoute: true },
    ];
  };

  const navItems = getNavItems();

  const handleNavClick = (item: any, e?: React.MouseEvent) => {
    if (item.isRoute) {
      navigate(item.href);
    } else {
      e?.preventDefault();
      const element = document.getElementById(item.section || '');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsOpen(false);
  };

  const getBookingLink = () => {
    if (activeMode === "beauty") return "/beauty/services";
    if (activeMode === "fitness") return "/fitness/programs";
    return "/book";
  };

  return (
    <nav
      id="navigation"
      role="navigation"
      aria-label="Main navigation"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 safe-area-inset-top ${
        isScrolled
          ? 'glass-card backdrop-blur-xl border-b border-champagne/20 shadow-luxury'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3 group touch-manipulation" aria-label="Mariia Borysevych - Home">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden glass-accent border border-champagne/20 group-hover:border-champagne/50 group-hover:shadow-luxury transition-all duration-300 flex-shrink-0">
              <img
                src={logo}
                alt="Mariia Borysevych Beauty & Fitness Logo"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="hidden sm:block">
              <span className="font-serif text-pearl text-base sm:text-lg tracking-tight font-display group-hover:text-champagne-200 transition-colors duration-300 whitespace-nowrap">
                Mariia Borysevych
              </span>
            </div>
            <div className="sm:hidden">
              <span className="font-serif text-pearl text-sm font-display">MB</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-3 lg:gap-4 flex-wrap">
            <ModeToggle />

            {navItems.map((item) => (
              item.isRoute ? (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "text-sm transition-colors relative group py-2 px-3 -mx-3 rounded-lg hover:bg-champagne/10 touch-manipulation focus-visible",
                    "hover:text-champagne"
                  )}
                >
                  {item.name}
                </Link>
              ) : (
                <button
                  key={item.name}
                  onClick={(e) => handleNavClick(item, e)}
                  className="text-sm text-pearl/90 hover:text-pearl transition-colors relative group py-2 px-3 -mx-3 rounded-lg hover:bg-champagne/10 touch-manipulation focus-visible"
                  aria-label={`Navigate to ${item.name} section`}
                >
                  {item.name}
                </button>
              )
            ))}

            <div className="h-4 w-px bg-border" />
            <LanguageSwitcher />
            <CurrencySwitcher />

            {authLoading ? (
              <div className="w-[140px] h-8" />
            ) : user ? (
              <UserMenu user={user} />
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-sm text-pearl hover:text-champagne"
                  onClick={() => navigate('/auth')}
                >
                  {t('nav.signIn')}
                </Button>
                <Button
                  size="sm"
                  className="text-sm"
                  onClick={() => navigate(getBookingLink())}
                >
                  Book
                </Button>
              </>
            )}
          </div>

          <button
            className="md:hidden p-4 text-pearl hover:text-champagne transition-all duration-300 touch-manipulation active:scale-95 glass-accent rounded-2xl hover:bg-champagne/10 min-h-[44px] min-w-[44px]"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
          >
            <div className="relative w-6 h-6">
              <Menu className={`h-6 w-6 transition-all duration-300 ${isOpen ? 'opacity-0 scale-75 rotate-90' : 'opacity-100 scale-100'}`} />
              <X className={`h-6 w-6 absolute inset-0 transition-all duration-300 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-75 -rotate-90'}`} />
            </div>
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden glass-card border-t border-champagne/20 animate-fade-in max-h-[85vh] overflow-y-auto">
            <div className="py-6 space-y-6">
              <div className="space-y-2">
                {navItems.map((item, index) => (
                  item.isRoute ? (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "flex items-center gap-4 p-5 rounded-2xl transition-all duration-300 group touch-manipulation active:scale-98 min-h-[52px]",
                        "glass-subtle hover:bg-champagne/10"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="text-pearl group-hover:text-champagne-200 text-lg font-display">
                        {item.name}
                      </span>
                    </Link>
                  ) : (
                    <button
                      key={item.name}
                      onClick={() => handleNavClick(item)}
                      className="flex items-center gap-4 w-full p-5 rounded-2xl glass-subtle hover:bg-champagne/10 transition-all duration-300 group touch-manipulation active:scale-98 min-h-[52px]"
                    >
                      <span className="text-pearl group-hover:text-champagne-200 text-lg font-display">
                        {item.name}
                      </span>
                    </button>
                  )
                ))}
              </div>

              <div className="pt-6 border-t border-champagne/10 space-y-4">
                <p className="text-xs font-body text-champagne/80 tracking-wider uppercase">Preferences</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass-subtle p-3 rounded-xl">
                    <LanguageSwitcher />
                  </div>
                  <div className="glass-subtle p-3 rounded-xl">
                    <CurrencySwitcher />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-champagne/10 space-y-3">
                {user ? (
                  <div className="glass-subtle p-4 rounded-2xl">
                    <UserMenu user={user} />
                  </div>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="w-full h-14 text-lg glass-card hover:bg-champagne/10 border-champagne/20 touch-manipulation"
                      onClick={() => {
                        navigate('/auth');
                        setIsOpen(false);
                      }}
                    >
                      {t('nav.signIn')}
                    </Button>
                    <Button
                      size="lg"
                      className="w-full h-14 text-lg font-display bg-gradient-to-r from-champagne-500 to-cocoa-600 text-white shadow-luxury hover:shadow-luxury-strong border border-white/10 touch-manipulation"
                      onClick={() => {
                        navigate(getBookingLink());
                        setIsOpen(false);
                      }}
                    >
                      Book Now
                      <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
});

Navigation.displayName = 'Navigation';

export default Navigation;
