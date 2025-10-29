import { useState, useEffect, memo, useCallback, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Sparkles, Dumbbell, Zap, Star, MessageCircle, BookOpen, User, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useMode } from "@/contexts/ModeContext";
import { useAuthState } from "@/hooks/useAuthState";
import { cn } from "@/lib/utils";
// removed unused dropdown and badge imports

import LanguageSwitcher from "./LanguageSwitcher";
import CurrencySwitcher from "./CurrencySwitcher";
import UserMenu from "./UserMenu";
import { Button } from "./ui/button";
import ModeToggle from "./ModeToggle";

import logo from "@/assets/logo.png";

const Navigation = memo(({ mode: propMode }: { mode?: "beauty" | "fitness" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { mode: contextMode, setMode } = useMode();
  const { user, isLoading: authLoading } = useAuthState();

  // Use prop mode or context mode
  const activeMode = propMode || contextMode;

  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 50);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  const getNavItems = useMemo(() => {
    // On home, keep IA minimal (no overload)
    if (!activeMode && location.pathname === "/") {
      // Home: keep navigation minimal; mode selection is done via segmented control
      return [
        { name: t("nav.blog"), href: "/blog", isRoute: true, icon: BookOpen },
        { name: "About", href: "/about", isRoute: true, icon: User },
        { name: "Contact", href: "/contact", isRoute: true, icon: Mail },
      ];
    }
    // On non-home non-mode pages (blog/about/contact/etc.), do not repeat Beauty/Fitness links
    if (!location.pathname.startsWith('/beauty') && !location.pathname.startsWith('/fitness') && location.pathname !== '/') {
      return [
        { name: t("nav.blog"), href: "/blog", isRoute: true, icon: BookOpen },
        { name: "About", href: "/about", isRoute: true, icon: User },
        { name: "Contact", href: "/contact", isRoute: true, icon: Mail },
      ];
    }
    if (activeMode === "beauty") {
      // Beauty: condensed IA (max 3 links)
      return [
        { name: "Services", href: "/beauty/services", isRoute: true, icon: Sparkles },
        { name: "Portfolio", href: "/beauty#portfolio", section: "portfolio", icon: Star },
        { name: "FAQs", href: "/beauty#faqs", section: "faqs", icon: MessageCircle },
      ];
    } else if (activeMode === "fitness") {
      // Fitness: condensed IA
      return [
        { name: "Programs", href: "/fitness/programs", isRoute: true, icon: Dumbbell },
        { name: "Starter", href: "/lp/fitness/starter", isRoute: true, icon: Zap },
        { name: "Glute Sculpt", href: "/lp/fitness/glutes-8w", isRoute: true, icon: Star },
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
  }, [activeMode, location.pathname, t]);

  const navItems = getNavItems;

  const renderAuthControls = () => {
    if (authLoading) return <div className="w-[140px] h-8" />;
    if (user) return <UserMenu user={user} />;
    return (
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
    );
  };

  const handleNavClick = (item: any, e?: React.MouseEvent) => {
    if (item.isRoute) {
      navigate(item.href);
    } else {
      e?.preventDefault();
      const element = document.getElementById(item.section);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsOpen(false);
  };

  const getBookingLink = () => {
    if (activeMode === "beauty") return "/beauty/services";
    if (activeMode === "fitness") return "/fitness/programs";
    return "/book"; // Default to unified booking
  };

  const handleModeSwitch = (newMode: "beauty" | "fitness" | null) => {
    setMode(newMode);
    if (newMode === "beauty") {
      navigate("/beauty");
    } else if (newMode === "fitness") {
      navigate("/fitness");
    }
  };

  return (
    <nav id="navigation" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 safe-area-inset-top ${
      isScrolled
        ? 'glass-card backdrop-blur-xl border-b border-champagne/20 shadow-luxury'
        : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3 group touch-manipulation">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden glass-accent border border-champagne/20 group-hover:border-champagne/50 group-hover:shadow-luxury transition-all duration-300 flex-shrink-0">
              <img
                src={logo}
                alt="BM Beauty"
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
            {/* Mode Selector - segmented control */}
            <ModeToggle />

            {navItems.map((item) => {
              const isActive = item.isRoute && location.pathname === item.href;
              return item.isRoute ? (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "text-sm transition-colors relative group py-2 px-3 -mx-3 rounded-lg hover:bg-champagne/10 touch-manipulation",
                    isActive ? "text-champagne font-medium" : "text-pearl/90 hover:text-pearl"
                  )}
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
                  className="text-sm text-pearl/90 hover:text-pearl transition-colors relative group py-2 px-3 -mx-3 rounded-lg hover:bg-champagne/10 touch-manipulation"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-champagne group-hover:w-full transition-all duration-300" />
                </button>
              );
            })}
            
            <div className="h-4 w-px bg-border" />
            <LanguageSwitcher />
            <CurrencySwitcher />
            {renderAuthControls()}
          </div>

          {/* Enhanced Mobile Menu Button */}
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

        {/* Enhanced Mobile Menu */}
        {isOpen && (
          <div className="md:hidden glass-card border-t border-champagne/20 animate-fade-in max-h-[85vh] overflow-y-auto">
            <div className="py-6 space-y-6">
              {/* Enhanced Mode Selector Mobile */}
              {contextMode && (
                <div className="pb-6 border-b border-champagne/10">
                  <p className="text-xs font-body text-champagne/80 mb-4 tracking-wider uppercase">Mode</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      size="sm"
                      variant={contextMode === "beauty" ? "luxury" : "ghost"}
                      onClick={() => handleModeSwitch("beauty")}
                      className="flex-col gap-2 h-auto py-3 glass-card"
                    >
                      <Sparkles className="w-5 h-5 text-lip-rose" />
                      <span className="text-xs">Beauty</span>
                    </Button>
                    <Button
                      size="sm"
                      variant={contextMode === "fitness" ? "luxury" : "ghost"}
                      onClick={() => handleModeSwitch("fitness")}
                      className="flex-col gap-2 h-auto py-3 glass-card"
                    >
                      <Dumbbell className="w-5 h-5 text-sage" />
                      <span className="text-xs">Fitness</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleModeSwitch(null)}
                      className="flex-col gap-2 h-auto py-3 glass-card hover:bg-rose-gold/10"
                    >
                      <X className="w-5 h-5" />
                      <span className="text-xs">Exit</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Enhanced Navigation Items */}
              <div className="space-y-2">
                {navItems.map((item, index) => {
                  const isActive = item.isRoute && location.pathname === item.href;
                  const Icon = item.icon;
                  return item.isRoute ? (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "flex items-center gap-4 p-5 rounded-2xl transition-all duration-300 group touch-manipulation active:scale-98 min-h-[52px]",
                        "animate-fade-rise",
                        isActive ? "bg-champagne/20 glass-card" : "glass-subtle hover:bg-champagne/10"
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => setIsOpen(false)}
                    >
                      {Icon && (
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                          isActive ? "bg-champagne/20 text-champagne" : "bg-champagne/10 text-pearl/70 group-hover:bg-champagne/20 group-hover:text-champagne"
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                      )}
                      <span className={cn(
                        "text-lg font-display flex-1",
                        isActive ? "text-champagne font-semibold" : "text-pearl group-hover:text-champagne-200"
                      )}>
                        {item.name}
                      </span>
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full transition-colors flex-shrink-0",
                        isActive ? "bg-champagne" : "bg-champagne/30 group-hover:bg-champagne"
                      )} />
                    </Link>
                  ) : (
                    <button
                      key={item.name}
                      onClick={() => handleNavClick(item)}
                      className={cn(
                        "flex items-center gap-4 w-full p-5 rounded-2xl glass-subtle hover:bg-champagne/10 transition-all duration-300 group touch-manipulation active:scale-98 min-h-[52px]",
                        "animate-fade-rise"
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {Icon && (
                        <div className="w-10 h-10 rounded-xl bg-champagne/10 text-pearl/70 group-hover:bg-champagne/20 group-hover:text-champagne flex items-center justify-center transition-all">
                          <Icon className="w-5 h-5" />
                        </div>
                      )}
                      <span className="text-pearl group-hover:text-champagne-200 text-lg font-display text-left flex-1">
                        {item.name}
                      </span>
                      <div className="w-1.5 h-1.5 rounded-full bg-champagne/30 group-hover:bg-champagne transition-colors flex-shrink-0" />
                    </button>
                  );
                })}
              </div>

              {/* Language and Currency */}
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

              {/* User Actions */}
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
                      className="w-full h-14 text-lg font-display bg-gradient-brand text-brand-foreground shadow-luxury hover:shadow-luxury-strong border border-white/10 touch-manipulation"
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
