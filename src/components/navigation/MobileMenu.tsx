import { memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Sparkles, Dumbbell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMode } from '@/contexts/ModeContext';
import { useAuthState } from '@/hooks/useAuthState';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import CurrencySwitcher from '@/components/CurrencySwitcher';
import UserMenu from '@/components/UserMenu';
import NavLinks from './NavLinks';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu = memo(({ isOpen, onClose }: MobileMenuProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthState();
  const { mode: contextMode, setMode } = useMode();

  const handleModeSwitch = (newMode: "beauty" | "fitness" | null) => {
    setMode(newMode);
    if (newMode === "beauty") {
      navigate("/beauty");
    } else if (newMode === "fitness") {
      navigate("/fitness");
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="md:hidden glass-card border-t border-champagne/20 animate-fade-in max-h-[85vh] overflow-y-auto">
      <div className="py-6 space-y-6 animate-slide-up">
        {/* Mode Selector Mobile */}
        {contextMode && (
          <div className="pb-6 border-b border-champagne/10 animate-fade-rise">
            <p className="text-xs font-body text-champagne/80 mb-4 tracking-wider uppercase">Mode</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant={contextMode === "beauty" ? "default" : "ghost"}
                onClick={() => handleModeSwitch("beauty")}
                className="flex-col gap-2 h-auto py-3 card-elegant"
              >
                <Sparkles className="w-5 h-5 text-lip-rose" />
                <span className="text-xs">Beauty</span>
              </Button>
              <Button
                size="sm"
                variant={contextMode === "fitness" ? "default" : "ghost"}
                onClick={() => handleModeSwitch("fitness")}
                className="flex-col gap-2 h-auto py-3 card-elegant"
              >
                <Dumbbell className="w-5 h-5 text-sage" />
                <span className="text-xs">Fitness</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleModeSwitch(null)}
                className="flex-col gap-2 h-auto py-3 card-elegant hover:bg-rose-gold/10"
              >
                <X className="w-5 h-5" />
                <span className="text-xs">Exit</span>
              </Button>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <div className="stagger-children space-y-2">
          <NavLinks className="flex-col" />
        </div>

        {/* Language and Currency */}
        <div className="pt-6 border-t border-champagne/10 space-y-4 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <p className="text-xs font-body text-champagne/80 tracking-wider uppercase">Preferences</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-subtle p-3 rounded-xl hover-lift">
              <LanguageSwitcher />
            </div>
            <div className="glass-subtle p-3 rounded-xl hover-lift">
              <CurrencySwitcher />
            </div>
          </div>
        </div>

        {/* User Actions */}
        <div className="pt-6 border-t border-champagne/10 space-y-3 animate-fade-in" style={{ animationDelay: '500ms' }}>
          {user ? (
            <div className="glass-subtle p-4 rounded-2xl hover-lift">
              <UserMenu user={user} />
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                className="w-full h-14 text-lg card-elegant border-champagne/20 touch-manipulation"
                onClick={() => {
                  navigate('/auth');
                  onClose();
                }}
              >
                {t('nav.signIn')}
              </Button>
              <Button
                size="lg"
                className="w-full h-14 text-lg font-display btn-premium shadow-luxury-strong border border-white/10 touch-manipulation"
                onClick={() => {
                  const bookingLink = contextMode === "beauty"
                    ? "/beauty/services"
                    : contextMode === "fitness"
                    ? "/fitness/programs"
                    : "/book";
                  navigate(bookingLink);
                  onClose();
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
  );
});

MobileMenu.displayName = 'MobileMenu';

export default MobileMenu;
