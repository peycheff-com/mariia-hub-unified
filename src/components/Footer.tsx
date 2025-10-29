import { Facebook, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation, Link } from "react-router-dom";

import LanguageSwitcher from "./LanguageSwitcher";
import CurrencySwitcher from "./CurrencySwitcher";
import NewsletterSignup from "./NewsletterSignup";

const Footer = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  // removed unused handleNavClick
  
  return (
    <footer id="footer" className="bg-charcoal text-pearl py-16 md:py-20 relative overflow-hidden">
      {/* Minimal accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px bg-gradient-to-r from-transparent via-champagne/20 to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl relative z-10">
        {/* Main content - spread out */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 md:gap-12 lg:gap-16 mb-16">
          {/* Brand - spans 5 columns */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="font-serif text-2xl md:text-3xl text-pearl">{t('footer.brand')}</h2>
            <p className="text-pearl/85 leading-relaxed max-w-md font-light">
              {t('footer.description')}
            </p>

            {/* Social */}
            <div className="flex gap-3 pt-4">
              {/* Instagram removed */}
              <a
                href="https://www.facebook.com/"
                className="group w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-graphite/30 flex items-center justify-center text-pearl/80 hover:text-champagne hover:border-champagne transition-all flex-shrink-0 touch-manipulation"
                aria-label="Follow on Facebook"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.25} />
              </a>
              <a
                href="mailto:hi@mariiaborysevych.com"
                className="group w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-graphite/30 flex items-center justify-center text-pearl/80 hover:text-champagne hover:border-champagne transition-all flex-shrink-0 touch-manipulation"
                aria-label="Send email"
              >
                <Mail className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.25} />
              </a>
            </div>
          </div>

          {/* Navigation - spans 3 columns */}
          <div className="lg:col-span-3 space-y-6">
            <h3 className="text-xs text-pearl/70 uppercase tracking-widest font-medium">{t('footer.navigate')}</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
              {/* Beauty Links */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-champagne/80">Beauty</p>
                <ul className="space-y-2">
                  <li><Link to="/beauty" className="text-pearl/90 hover:text-champagne transition-colors text-sm py-2 px-1 -mx-1 rounded-lg hover:bg-champagne/5 touch-manipulation block">Beauty Services</Link></li>
                  <li><Link to="/beauty/services" className="text-pearl/90 hover:text-champagne transition-colors text-sm py-2 px-1 -mx-1 rounded-lg hover:bg-champagne/5 touch-manipulation block">All Services</Link></li>
                  <li><Link to="/lp/beauty/lips" className="text-pearl/90 hover:text-champagne transition-colors text-sm py-2 px-1 -mx-1 rounded-lg hover:bg-champagne/5 touch-manipulation block">PMU Lips</Link></li>
                  <li><Link to="/lp/beauty/brows" className="text-pearl/90 hover:text-champagne transition-colors text-sm py-2 px-1 -mx-1 rounded-lg hover:bg-champagne/5 touch-manipulation block">PMU Brows</Link></li>
                </ul>
              </div>

              {/* Fitness Links */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-champagne/80">Fitness</p>
                <ul className="space-y-2">
                  <li><Link to="/fitness" className="text-pearl/90 hover:text-champagne transition-colors text-sm py-2 px-1 -mx-1 rounded-lg hover:bg-champagne/5 touch-manipulation block">Training Programs</Link></li>
                  <li><Link to="/fitness/programs" className="text-pearl/90 hover:text-champagne transition-colors text-sm py-2 px-1 -mx-1 rounded-lg hover:bg-champagne/5 touch-manipulation block">All Programs</Link></li>
                  <li><Link to="/lp/fitness/starter" className="text-pearl/90 hover:text-champagne transition-colors text-sm py-2 px-1 -mx-1 rounded-lg hover:bg-champagne/5 touch-manipulation block">Starter Session</Link></li>
                  <li><Link to="/lp/fitness/glutes-8w" className="text-pearl/90 hover:text-champagne transition-colors text-sm py-2 px-1 -mx-1 rounded-lg hover:bg-champagne/5 touch-manipulation block">Glute Sculpt 8W</Link></li>
                </ul>
              </div>

              {/* Utility Links */}
              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <p className="text-xs font-medium text-champagne/80">More</p>
                <ul className="space-y-2">
                  <li><Link to="/blog" className="text-pearl/90 hover:text-champagne transition-colors text-sm py-2 px-1 -mx-1 rounded-lg hover:bg-champagne/5 touch-manipulation block">Journal</Link></li>
                  <li><Link to="/about" className="text-pearl/90 hover:text-champagne transition-colors text-sm py-2 px-1 -mx-1 rounded-lg hover:bg-champagne/5 touch-manipulation block">About</Link></li>
                  <li><Link to="/contact" className="text-pearl/90 hover:text-champagne transition-colors text-sm py-2 px-1 -mx-1 rounded-lg hover:bg-champagne/5 touch-manipulation block">Contact</Link></li>
                  <li><Link to="/reviews" className="text-pearl/90 hover:text-champagne transition-colors text-sm py-2 px-1 -mx-1 rounded-lg hover:bg-champagne/5 touch-manipulation block">Reviews</Link></li>
                  <li><Link to="/aftercare" className="text-pearl/90 hover:text-champagne transition-colors text-sm py-2 px-1 -mx-1 rounded-lg hover:bg-champagne/5 touch-manipulation block">Aftercare</Link></li>
                  <li><Link to="/portfolio" className="text-pearl/90 hover:text-champagne transition-colors text-sm py-2 px-1 -mx-1 rounded-lg hover:bg-champagne/5 touch-manipulation block">Portfolio</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact Section with Newsletter */}
          <div className="lg:col-span-4 space-y-6">
            <h3 className="text-xs text-pearl/70 uppercase tracking-widest font-medium">{t('footer.reachOut')}</h3>
            <ul className="space-y-3 text-pearl/90 mb-6">
              <li>
                <a href="tel:+48536200573" className="hover:text-champagne transition-colors py-2 px-1 -mx-1 rounded-lg hover:bg-champagne/5 touch-manipulation block">
                  +48 536 200 573
                </a>
              </li>
              <li>
                <a href="mailto:hi@mariiaborysevych.com" className="hover:text-champagne transition-colors break-all py-2 px-1 -mx-1 rounded-lg hover:bg-champagne/5 touch-manipulation block">
                  hi@mariiaborysevych.com
                </a>
              </li>
              <li className="pt-2">
                ul. Smolna 8, lok. 254<br />
                Warszawa, Poland
              </li>
            </ul>

            {/* Newsletter Signup */}
            <div className="pt-4 border-t border-pearl/10">
              <h3 className="text-xs text-pearl/70 uppercase tracking-widest font-medium mb-4">
                {t('footer.newsletter', 'Newsletter')}
              </h3>
              <NewsletterSignup />
            </div>
          </div>
        </div>

        {/* Bottom - minimal */}
        <div className="pt-12 border-t border-graphite/20">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
              <span className="text-xs text-pearl/70 uppercase tracking-wider whitespace-nowrap">{t('footer.preferences')}</span>
              <div className="flex items-center gap-3">
                <LanguageSwitcher />
                <CurrencySwitcher />
              </div>
            </div>
            <div className="flex items-center gap-4 sm:gap-6 text-sm text-pearl/70">
              <Link to="/policies/booking_cancellation" className="hover:text-pearl/60 transition-colors whitespace-nowrap py-2 px-1 -mx-1 rounded-lg hover:bg-champagne/5 touch-manipulation">{t('footer.privacy')}</Link>
              <span>·</span>
              <Link to="/legal" className="hover:text-pearl/60 transition-colors whitespace-nowrap py-2 px-1 -mx-1 rounded-lg hover:bg-champagne/5 touch-manipulation">{t('footer.terms')}</Link>
            </div>
          </div>
          <p className="text-sm text-pearl/70 text-center">{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
