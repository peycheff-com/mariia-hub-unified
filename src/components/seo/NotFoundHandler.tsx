import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SuggestedLink {
  title: string;
  description: string;
  url: string;
}

export const NotFoundHandler: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [suggestions, setSuggestions] = useState<SuggestedLink[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Common redirects based on common misspellings or old URLs
  const redirectMap: Record<string, string> = {
    '/beuty': '/beauty',
    '/beaty': '/beauty',
    '/fitnes': '/fitness',
    '/boking': '/booking',
    '/bookin': '/booking',
    '/kontakt': '/contact',
    '/kontact': '/contact',
    '/o-nas': '/about',
    '/about-us': '/about',
    '/cennik': '/pricing',
    '/price': '/pricing',
    '/galeria': '/gallery',
    '/blog/new': '/blog',
    '/uslugi': '/beauty',
    '/services': '/beauty',
    '/trening': '/fitness',
    '/training': '/fitness'
  };

  const suggestedPages: SuggestedLink[] = [
    {
      title: t('nav.beauty', 'Beauty Services'),
      description: t('404.suggestions.beautyDesc', 'Explore our premium beauty treatments'),
      url: '/beauty'
    },
    {
      title: t('nav.fitness', 'Fitness Programs'),
      description: t('404.suggestions.fitnessDesc', 'Discover our fitness programs'),
      url: '/fitness'
    },
    {
      title: t('nav.booking', 'Book Appointment'),
      description: t('404.suggestions.bookingDesc', 'Schedule your appointment'),
      url: '/booking'
    },
    {
      title: t('nav.about', 'About Us'),
      description: t('404.suggestions.aboutDesc', 'Learn more about Mariia Hub'),
      url: '/about'
    },
    {
      title: t('nav.contact', 'Contact'),
      description: t('404.suggestions.contactDesc', 'Get in touch with us'),
      url: '/contact'
    },
    {
      title: t('nav.blog', 'Blog'),
      description: t('404.suggestions.blogDesc', 'Read our latest articles'),
      url: '/blog'
    }
  ];

  useEffect(() => {
    const path = location.pathname.replace(`/${i18n.language}`, '');

    // Check for direct redirect
    if (redirectMap[path]) {
      navigate(redirectMap[path], { replace: true });
      return;
    }

    // Generate suggestions based on path
    const pathLower = path.toLowerCase();
    const filtered = suggestedPages.filter(page => {
      const titleLower = page.title.toLowerCase();
      const descLower = page.description.toLowerCase();

      // Check if path contains any keywords from the page
      return pathLower.split('-').some(word =>
        word.length > 2 && (titleLower.includes(word) || descLower.includes(word))
      );
    });

    setSuggestions(filtered.length > 0 ? filtered : suggestedPages.slice(0, 4));

    // Log 404 for analytics
    console.warn(`404: Page not found - ${location.pathname}`);

    // Send to analytics service
    if (window.gtag) {
      window.gtag('event', '404', {
        page_path: location.pathname,
        page_location: window.location.href,
        page_title: document.title
      });
    }
  }, [location.pathname, navigate, i18n.language]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Redirect to search results or use site search
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="text-6xl font-bold text-primary mb-4">404</div>
          <CardTitle className="text-2xl">
            {t('404.title', 'Page Not Found')}
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            {t('404.message', "The page you're looking for doesn't exist or has been moved.")}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('404.searchPlaceholder', 'Search for something...')}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button type="submit">
              {t('404.search', 'Search')}
            </Button>
          </form>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">
                {t('404.suggestions.title', 'You might be looking for:')}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {suggestions.map((page, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto p-4 text-left"
                    onClick={() => navigate(page.url)}
                  >
                    <div>
                      <div className="font-medium">{page.title}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {page.description}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button onClick={() => navigate('/')} className="flex-1">
              {t('404.goHome', 'Go Home')}
            </Button>
            <Button variant="outline" onClick={handleGoBack} className="flex-1">
              {t('404.goBack', 'Go Back')}
            </Button>
          </div>

          {/* Report Link */}
          <div className="text-center text-sm text-muted-foreground">
            {t('404.report', "Think this is a mistake?")}{' '}
            <Button
              variant="link"
              className="p-0 h-auto text-primary"
              onClick={() => window.location.href = `mailto:support@mariiahub.com?subject=Broken Link Report&body=I found a broken link: ${window.location.href}`}
            >
              {t('404.reportLink', 'Let us know')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};