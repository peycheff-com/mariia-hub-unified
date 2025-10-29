import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { useMode } from "@/contexts/ModeContext";
import { useLocation } from "@/contexts/LocationContext";
import { SEOHead } from "@/components/seo/SEOHead";
import { useStructuredData } from "@/components/seo/StructuredDataHook";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import QuickActionsBar from "@/components/QuickActionsBar";
import FloatingBookButton from "@/components/FloatingBookButton";
import ScrollProgressBar from "@/components/ScrollProgressBar";
import AboutCard from "@/components/AboutCard";
import PersonalStory from "@/components/PersonalStory";
import BeautyHighlight from "@/components/BeautyHighlight";
import FitnessHighlight from "@/components/FitnessHighlight";
import BlogSection from "@/components/BlogSection";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import StudioContact from "@/components/StudioContact";
import NewsletterSignup from "@/components/NewsletterSignup";
import Footer from "@/components/Footer";
import MobileFooter from "@/components/MobileFooter";
import { CitySelector } from "@/components/location/CitySelector";
import { LocalizationSelector, LocationDisplay } from "@/components/localization";

import beautyPathImage from "@/assets/beauty-path-card.jpg";
import fitnessPathImage from "@/assets/fitness-path-card.jpg";
const Index = () => {
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const { setMode, mode } = useMode();
  const { currentCity, isDetectingLocation } = useLocation();
  const structuredDataGenerator = useStructuredData();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      loadPreferences(user.id);
    }
  };

  const loadPreferences = async (userId: string) => {
    const { data } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();
    
    if (data) {
      setUserPreferences(data);
      // Track visit
      await supabase
        .from("user_preferences")
        .update({
          visit_count: (data.visit_count || 0) + 1,
          last_visited: new Date().toISOString(),
        })
        .eq("user_id", userId);
    }
  };

  // Adaptive content based on preferences
  const showBeautyFirst = !userPreferences?.preferred_service_type || 
                          userPreferences?.preferred_service_type === "beauty";

  // Enhanced SEO data for homepage
  const enhancedStructuredData = {
    ...structuredDataGenerator.generateLocalBusinessSchema,
    ...structuredDataGenerator.generateBreadcrumbSchema,
    mainEntity: {
      "@type": "BeautySalon",
      name: "Mariia Hub",
      description: "Premium beauty and fitness services in Warsaw",
      url: window.location.origin,
      telephone: "+48 123 456 789",
      address: {
        "@type": "PostalAddress",
        streetAddress: "ul. Marszałkowska 123",
        addressLocality: "Warsaw",
        addressRegion: "Mazowieckie",
        postalCode: "00-001",
        addressCountry: "PL"
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 52.2297,
        longitude: 21.0122
      },
      openingHours: [
        "Mo-Fr 09:00-20:00",
        "Sa 10:00-18:00",
        "Su 12:00-16:00"
      ],
      priceRange: "$$$",
      sameAs: [
        "https://www.instagram.com/mariiahub",
        "https://www.facebook.com/mariiahub"
      ]
    }
  };

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Mariia Hub — Premium Beauty & Fitness Services in Warsaw"
        description="BM BEAUTY studio + evidence-aligned coaching. Book in 60s. EN/PL/UA. PMU, brow lamination, personal training, and more."
        keywords="PMU Warsaw, brow lamination Warsaw, glute program women, personal trainer Warsaw, makijaż permanentny Warszawa, laminacja brwi Warszawa, trening pośladków, trener personalny Warszawa, beauty salon Warsaw, fitness center"
        ogImage="/og-homepage.webp"
        structuredData={enhancedStructuredData}
      />
      <Navigation />
      {/* City Selector Bar */}
      <div className="border-b border-graphite-200 bg-pearl/50 backdrop-blur-sm sticky top-16 z-40">
        <div className="container-standard py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Serving:</span>
              {isDetectingLocation ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="animate-pulse">Detecting your location...</span>
                </div>
              ) : (
                <LocationDisplay variant="compact" />
              )}
            </div>
            <div className="flex items-center gap-3">
              <CitySelector variant="compact" />
              <LocalizationSelector variant="horizontal" showLabels={false} />
            </div>
          </div>
        </div>
      </div>
      <main id="main-content">
        <Hero />
        
        {/* Quick Actions Bar - Sticky on mobile */}
        <QuickActionsBar />

        {/* Trust Strip - Standardized */}
        <section id="trust" className="section-compact border-y border-graphite-300 bg-pearl">
          <div className="container-standard">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-center">
              <div className="space-y-2 md:space-y-3 hover-lift p-4">
                <div className="text-2xl md:text-4xl font-bold text-charcoal-800">5.0</div>
                <p className="text-sm md:text-base text-charcoal-600">44 reviews on Booksy</p>
              </div>
              <div className="space-y-2 md:space-y-3 hover-lift p-4">
                <div className="text-2xl md:text-4xl font-bold text-charcoal-800">Smolna 8</div>
                <p className="text-sm md:text-base text-charcoal-600">Śródmieście, Warsaw</p>
              </div>
              <div className="space-y-2 md:space-y-3 hover-lift p-4">
                <div className="text-2xl md:text-4xl font-bold text-charcoal-800">56K+</div>
                <p className="text-sm md:text-base text-charcoal-600">Instagram followers</p>
              </div>
            </div>
          </div>
        </section>

        {/* About Card */}
        <AboutCard />

        {/* Two Path Cards - Standardized */}
        <section className="section-spacious bg-gradient-to-br from-champagne/5 to-bronze/5">
          <div className="container-standard">
            <div className="text-center mb-12 md:mb-16 animate-fade-in space-y-3 md:space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold px-4 text-high-contrast">Choose Your Path</h2>
              <p className="text-lg md:text-xl text-secondary max-w-2xl mx-auto px-4 font-medium">
                Enhance your outer beauty or build inner strength
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-10 items-stretch">
              {/* Beauty Card */}
              <Link
                to="/beauty"
                onClick={() => setMode("beauty")}
                className="group relative overflow-hidden rounded-3xl border-2 border-border hover:border-lip-rose transition-all duration-500 hover:shadow-luxury hover-scale cursor-pointer animate-fade-in flex flex-col h-full"
              >
                <div className="aspect-[4/3] relative flex-1">
                  <img
                    src={beautyPathImage}
                    srcSet={`${beautyPathImage} 1x`}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    alt="BM Beauty Studio - Permanent Makeup Services"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 space-y-3 md:space-y-4">
                    <div className="space-y-1 md:space-y-2">
                      <h3 className="text-2xl md:text-4xl font-bold text-pearl" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>Beauty</h3>
                      <p className="text-pearl/90 text-base md:text-lg" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Healed-first permanent makeup, brows & lashes.</p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-5 md:px-6 py-2.5 md:py-3 glass-card-light text-charcoal-700 font-semibold rounded-full group-hover:bg-charcoal-700 group-hover:text-pearl transition-all duration-300 text-sm md:text-base">
                      <span>Explore Beauty</span>
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Fitness Card */}
              <Link
                to="/fitness"
                onClick={() => setMode("fitness")}
                className="group relative overflow-hidden rounded-3xl border-2 border-border hover:border-sage transition-all duration-500 hover:shadow-luxury hover-scale cursor-pointer animate-fade-in flex flex-col h-full"
              >
                <div className="aspect-[4/3] relative flex-1">
                  <img
                    src={fitnessPathImage}
                    srcSet={`${fitnessPathImage} 1x`}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    alt="Personal Training Programs - Certified Fitness Coaching"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 space-y-3 md:space-y-4">
                    <div className="space-y-1 md:space-y-2">
                      <h3 className="text-2xl md:text-4xl font-bold text-pearl" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>Fitness</h3>
                      <p className="text-pearl/90 text-base md:text-lg" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Gentle coaching. Strong habits. 1:1 & online.</p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-5 md:px-6 py-2.5 md:py-3 glass-card-light text-charcoal-700 font-semibold rounded-full group-hover:bg-charcoal-700 group-hover:text-pearl transition-all duration-300 text-sm md:text-base">
                      <span>Explore Fitness</span>
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Personal Story */}
        <PersonalStory />

        {/* Beauty Highlight */}
        <BeautyHighlight />

        {/* Fitness Highlight */}
        <FitnessHighlight />

        {/* Removed Instagram feed; keep blog CTA only */}
        <section className="py-24 bg-gradient-to-br from-sage/5 to-champagne/5 bg-pearl">
          <div className="container mx-auto px-6 md:px-8 max-w-7xl text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-charcoal-800 mb-6">From the Journal</h2>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-charcoal-300 bg-pearl hover:bg-charcoal-700 hover:text-pearl transition-all font-medium group text-charcoal-700"
            >
              <span>Read the full journal</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </section>

        {/* Blog Section */}
        <BlogSection />

        {/* Testimonials */}
        <TestimonialsCarousel />

        {/* Studio & Contact */}
        <StudioContact />

        {/* Newsletter */}
        <section className="py-24 bg-gradient-to-br from-rose-gold/5 to-champagne/10 bg-pearl">
          <div className="container mx-auto px-6 md:px-8 max-w-2xl text-center">
            <div className="animate-fade-in space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold text-charcoal-800">Stay in the Loop</h2>
                <p className="text-lg text-charcoal-600 max-w-xl mx-auto">
                  Beauty aftercare, fitness tips & studio updates. Once a month, no spam.
                </p>
              </div>
              <NewsletterSignup />
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <MobileFooter />
      <FloatingBookButton />
      <ScrollProgressBar />
    </div>
  );
};

export default Index;
