import { Link } from 'react-router-dom';
import { memo } from 'react';
import logo from '@/assets/logo.png';

interface NavBrandProps {
  className?: string;
}

const NavBrand = memo(({ className }: NavBrandProps) => {
  return (
    <Link
      to="/"
      className={`flex items-center gap-3 group touch-manipulation animate-fade-in ${className || ''}`}
      aria-label="Mariia Borysevych - Home"
    >
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden glass-accent border border-champagne/20 group-hover:border-champagne/50 group-hover:shadow-luxury transition-all duration-300 flex-shrink-0 magnetic-hover">
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
  );
});

NavBrand.displayName = 'NavBrand';

export default NavBrand;
