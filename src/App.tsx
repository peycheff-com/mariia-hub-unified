import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { initGTM } from "@/lib/gtm";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOWrapper } from "@/components/seo/SEOWrapper";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { OfflineIndicator } from "@/components/offline/OfflineIndicator";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { CookieConsent } from "@/components/CookieConsent";

import ErrorBoundary from "./components/ErrorBoundary";
import IntentRouter from "./components/IntentRouter";
import { useAnalytics } from "./hooks/useAnalytics";
import { LocationProvider } from "./contexts/LocationContext";
import { LocalizationProvider } from "./contexts/LocalizationContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { ModeProvider } from "./contexts/ModeContext";
import { BookingProvider } from "./contexts/BookingContext";
import { PricingProvider } from "./contexts/PricingContext";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const UserDashboard = lazy(() => import("./pages/user/Dashboard"));
const UserBookings = lazy(() => import("./pages/user/Bookings"));
const UserProfile = lazy(() => import("./pages/user/Profile"));
const Admin = lazy(() => import("./pages/Admin"));
const Beauty = lazy(() => import("./pages/Beauty"));
const Fitness = lazy(() => import("./pages/Fitness"));
const BeautyServices = lazy(() => import("./pages/BeautyServices"));
const BeautyServiceDetail = lazy(() => import("./pages/BeautyServiceDetail"));
const FitnessPrograms = lazy(() => import("./pages/FitnessPrograms"));
const FitnessProgramDetail = lazy(() => import("./pages/FitnessProgramDetail"));
const BookingWizard = lazy(() => import("./pages/BookingWizard"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Success = lazy(() => import("./pages/Success"));
const Legal = lazy(() => import("./pages/Legal"));
const Policies = lazy(() => import("./pages/Policies"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LandingBeautyLips = lazy(() => import("./pages/LandingBeautyLips"));
const LandingBeautyBrows = lazy(() => import("./pages/LandingBeautyBrows"));
const LandingFitnessStarter = lazy(() => import("./pages/LandingFitnessStarter"));
const LandingFitnessGlutes = lazy(() => import("./pages/LandingFitnessGlutes"));
const Reschedule = lazy(() => import("./pages/Reschedule"));
const Cancel = lazy(() => import("./pages/Cancel"));
const Reviews = lazy(() => import("./pages/Reviews"));
const Aftercare = lazy(() => import("./pages/Aftercare"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const BookingCancellationPolicy = lazy(() => import("./pages/BookingCancellationPolicy"));
const BeautyBrowsCategory = lazy(() => import("./pages/BeautyBrowsCategory"));
const BeautyMakeupCategory = lazy(() => import("./pages/BeautyMakeupCategory"));
const BusinessServices = lazy(() => import("./pages/BusinessServices"));
const GiftCards = lazy(() => import("./pages/GiftCards"));
const Packages = lazy(() => import("./pages/Packages"));
const PackageList = lazy(() => import("./pages/packages/PackageList"));
const Gallery = lazy(() => import("./pages/Gallery"));
const FAQ = lazy(() => import("./pages/FAQ"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const GDPRCompliance = lazy(() => import("./pages/GDPRCompliance"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const AftercareInstructions = lazy(() => import("./pages/AftercareInstructions"));
const TreatmentGuidelines = lazy(() => import("./pages/TreatmentGuidelines"));
const Error404 = lazy(() => import("./pages/Error404"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const DemoSEO = lazy(() => import("./pages/DemoSEO"));
const AnalyticsDashboard = lazy(() => import("./pages/admin/analytics/Dashboard"));
const Reports = lazy(() => import("./pages/admin/analytics/Reports"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="space-y-4 w-full max-w-xl px-6">
      <Skeleton className="h-12 w-3/4 mx-auto" />
      <Skeleton className="h-6 w-1/2 mx-auto" />
      <Skeleton className="h-96 w-full" />
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent = () => {
  useAnalytics(); // Track page views

  useEffect(() => {
    const handleConsent = async () => {
      try {
        if (!import.meta.env.PROD) return; // Only load in production
        const { data, error } = await supabase
          .from('integration_settings')
          .select('key, value')
          .in('key', ['google_tag_manager_id','sentry_dsn'])
          .order('key')
          .limit(2);
        if (!error && Array.isArray(data)) {
          const gtm = data.find(x => x.key === 'google_tag_manager_id')?.value;
          const dsn = data.find(x => x.key === 'sentry_dsn')?.value;
          if (gtm) {
            initGTM(gtm);
          }
          if (dsn) {
            import("./lib/sentry").then(({ initSentry }) => {
              initSentry(dsn);
            }).catch(() => {
              // Silently ignore if Sentry fails to load
            });
          }
        }
      } catch {
        // no-op
      }
    };

    const stored = localStorage.getItem('cookieConsent');
    if (stored === 'granted') {
      handleConsent();
    }
  }, []);

  return (
    <SEOWrapper>
      <Suspense fallback={<PageLoader />}>
        <CookieConsent />
        <IntentRouter />
        <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/user/dashboard" element={<UserDashboard />} />
        <Route path="/user/bookings" element={<UserBookings />} />
        <Route path="/user/profile" element={<UserProfile />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
        <Route path="/admin/analytics/dashboard" element={<AnalyticsDashboard />} />
        <Route path="/admin/analytics/reports" element={<Reports />} />
        
        {/* Beauty Routes */}
        <Route path="/beauty" element={<Beauty />} />
        <Route path="/beauty/services" element={<BeautyServices />} />
        <Route path="/beauty/services/:slug" element={<BeautyServiceDetail />} />
        
        {/* Fitness Routes */}
        <Route path="/fitness" element={<Fitness />} />
        <Route path="/fitness/programs" element={<FitnessPrograms />} />
        <Route path="/fitness/programs/:slug" element={<FitnessProgramDetail />} />
        
        {/* Unified Booking */}
        <Route path="/book" element={<BookingWizard />} />
        
        {/* General Routes */}
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/success" element={<Success />} />
        <Route path="/reschedule" element={<Reschedule />} />
        <Route path="/cancel" element={<Cancel />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="/policies" element={<Policies />} />
        <Route path="/policies/booking_cancellation" element={<BookingCancellationPolicy />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/aftercare" element={<Aftercare />} />
        <Route path="/portfolio" element={<Portfolio />} />
        
        {/* Landing Pages */}
        <Route path="/lp/beauty/lips" element={<LandingBeautyLips />} />
        <Route path="/lp/beauty/brows" element={<LandingBeautyBrows />} />
        <Route path="/lp/fitness/starter" element={<LandingFitnessStarter />} />
        <Route path="/lp/fitness/glutes-8w" element={<LandingFitnessGlutes />} />

        {/* Beauty Category Pages */}
        <Route path="/beauty/brows" element={<BeautyBrowsCategory />} />
        <Route path="/beauty/makeup" element={<BeautyMakeupCategory />} />

        {/* Business & Commercial */}
        <Route path="/business" element={<BusinessServices />} />
        <Route path="/gift-cards" element={<GiftCards />} />
        <Route path="/packages" element={<PackageList />} />
        <Route path="/packages/legacy" element={<Packages />} />
        <Route path="/gallery" element={<Gallery />} />

        {/* Support & Legal */}
        <Route path="/faq" element={<FAQ />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/cookies" element={<CookiePolicy />} />
        <Route path="/gdpr" element={<GDPRCompliance />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/aftercare" element={<AftercareInstructions />} />
        <Route path="/guidelines" element={<TreatmentGuidelines />} />

        {/* System Pages */}
        <Route path="/404" element={<Error404 />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/demo/seo" element={<DemoSEO />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
    </SEOWrapper>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <LocationProvider defaultCitySlug="warsaw">
            <LocalizationProvider>
              <CurrencyProvider>
                <ModeProvider>
                  <BookingProvider>
                    <PricingProvider>
                      <Toaster />
                      <Sonner />
                      <OfflineBanner />
                      <OfflineIndicator />
                      <InstallPrompt />
                      <AppContent />
                    </PricingProvider>
                  </BookingProvider>
                </ModeProvider>
              </CurrencyProvider>
            </LocalizationProvider>
          </LocationProvider>
        </BrowserRouter>
      </HelmetProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
