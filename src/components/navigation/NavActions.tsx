import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from '@/hooks/useAuthState';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import CurrencySwitcher from '@/components/CurrencySwitcher';
import UserMenu from '@/components/UserMenu';
import ModeToggle from '@/components/ModeToggle';
import { useMode } from '@/contexts/ModeContext';

interface NavActionsProps {
  className?: string;
}

const NavActions = memo(({ className }: NavActionsProps) => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuthState();
  const { mode: contextMode } = useMode();

  const renderAuthControls = () => {
    if (authLoading) return <div className="w-[140px] h-8 animate-pulse bg-cocoa-200 rounded" />;
    if (user) return <UserMenu user={user} />;
    return (
      <>
        <Button
          size="sm"
          variant="ghost"
          className="text-sm text-pearl hover:text-champagne hover-lift"
          onClick={() => navigate('/auth')}
        >
          Sign In
        </Button>
        <Button
          size="sm"
          className="text-sm btn-premium hover-lift"
          onClick={() => {
            const bookingLink = contextMode === "beauty"
              ? "/beauty/services"
              : contextMode === "fitness"
              ? "/fitness/programs"
              : "/book";
            navigate(bookingLink);
          }}
        >
          Book
        </Button>
      </>
    );
  };

  return (
    <div className={`flex items-center gap-3 lg:gap-4 ${className || ''}`}>
      <ModeToggle />

      <div className="h-4 w-px bg-border opacity-30" />

      <LanguageSwitcher />
      <CurrencySwitcher />

      <div className="flex items-center gap-2">
        {renderAuthControls()}
      </div>
    </div>
  );
});

NavActions.displayName = 'NavActions';

export default NavActions;
