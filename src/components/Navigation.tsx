import { useState, useEffect, memo, useCallback } from "react";
import { Menu, X } from "lucide-react";
import NavBrand from "./navigation/NavBrand";
import NavLinks from "./navigation/NavLinks";
import NavActions from "./navigation/NavActions";
import MobileMenu from "./navigation/MobileMenu";

const Navigation = memo(({ mode: propMode }: { mode?: "beauty" | "fitness" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 50);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

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
          {/* Brand */}
          <NavBrand />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4 flex-wrap">
            <NavLinks />
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex">
            <NavActions />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-4 text-pearl hover:text-champagne transition-all duration-300 touch-manipulation active:scale-95 glass-accent rounded-2xl hover:bg-champagne/10 min-h-[44px] min-w-[44px] magnetic-hover"
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

        {/* Mobile Menu */}
        <MobileMenu isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </div>
    </nav>
  );
});

Navigation.displayName = 'Navigation';

export default Navigation;
