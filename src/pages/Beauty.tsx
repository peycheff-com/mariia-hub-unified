import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Sparkles, Heart, Eye, Palette, Star, Shield } from "lucide-react";

import { useMode } from "@/contexts/ModeContext";
import { SEO, generateLocalBusinessSchema } from "@/components/SEO";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileFooter from "@/components/MobileFooter";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import AvailableSlotsList from "@/components/AvailableSlotsList";
import BookingSheet from "@/components/booking/BookingSheet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSiteImage } from "@/hooks/useSiteImage";

import mariiaProfile from "@/assets/mariia-profile.jpg";

const Beauty = () => {
  const { t } = useTranslation();
  const { setMode } = useMode();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [services, setServices] = useState<any[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    setMode("beauty");
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .eq('service_type', 'beauty')
        .order('display_order');

      if (error) throw error;
      setServices(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Could not load services",
        variant: "destructive",
      });
    }
  };

  const serviceHighlights = [
    { id: "permanent-makeup-lips", name: "Permanent Makeup Lips", icon: Heart, slug: "makijaz-permanentny-ust" },
    { id: "permanent-makeup-eyebrows", name: "Permanent Makeup Brows", icon: Sparkles, slug: "makijaz-permanentny-brwi" },
    { id: "brow-styling", name: "Brow Styling & Lamination", icon: Sparkles, slug: "stylizacja-brwi" },
    { id: "lash-services", name: "Lash Lift & Tint", icon: Eye, slug: "laminacja-rzes" },
  ];

  const { image: heroBeauty } = useSiteImage('hero-beauty');

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="BM BEAUTY — PMU, Brows, Lashes | Warsaw"
        description="Healed-first PMU lips/brows/eyes, laminations, makeup. Book on Booksy."
        keywords="makijaż permanentny ust, makijaż permanentny brwi, laminacja rzęs, stylizacja brwi, PMU Warsaw"
        structuredData={generateLocalBusinessSchema()}
      />
      <Navigation mode="beauty" />

      <main>
        {/* Hero Section - Enhanced with Immersive Layout */}
        <section className="hero-split bg-gradient-to-br from-lip-rose/10 via-transparent to-champagne/5">
          <div className="container-standard">
            <div className="grid-hero">
              <div className="space-y-section stagger-children">
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass-glass border border-lip-rose/20">
                  <div className="w-2 h-2 rounded-full bg-lip-rose pulse-glow" />
                  <span className="text-sm font-body tracking-[0.3em] uppercase font-light text-on-dark">
                    Beauty Services
                  </span>
                </div>
                <h1 className="text-hero-serif leading-tight">
                  Healed-First PMU, <span className="text-gradient-reveal">Brows & Lashes</span>
                </h1>
                <p className="text-description text-high-contrast max-w-2xl">
                  Warsaw's trusted beauty studio at Smolna 8. Certified, hygienic, natural results that enhance your unique beauty.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="btn-large btn-primary-brand magnetic-btn" onClick={() => setIsBookingOpen(true)}>
                    Book Now
                  </Button>
                  <Button size="lg" variant="outline" className="btn-large btn-glass magnetic-btn" asChild>
                    <Link to="/beauty/services">View Services</Link>
                  </Button>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-lip-rose/20 to-transparent rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500" />
                <img
                  src={heroBeauty?.image_url || mariiaProfile}
                  srcSet={`${heroBeauty?.image_url || mariiaProfile} 1x, ${heroBeauty?.image_url || mariiaProfile} 2x`}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  alt={heroBeauty?.alt_text || "Mariia - Beauty Specialist"}
                  className="image-reveal rounded-3xl shadow-luxury w-full hover:scale-105 transition-all duration-500"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Service Categories - Enhanced Grid */}
        <section className="section-dense bg-gradient-to-br from-lip-rose/3 to-champagne/3">
          <div className="container-standard">
            <div className="text-center mb-16">
              <h2 className="text-section mb-4">Our Services</h2>
              <p className="text-description text-muted">
                Discover our range of premium beauty treatments
              </p>
            </div>
            <div className="grid-features stagger-children">
              {serviceHighlights.map((service, index) => (
                <Link
                  key={service.id}
                  to={`/beauty/services/${service.slug}`}
                  className="card-interactive hover-glow group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                      <service.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-title mb-3 group-hover:text-primary transition-colors">{service.name}</h3>
                    <p className="text-subtle">Learn more →</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Before/After - Enhanced with Showcase Layout */}
        <section className="section-spacious bg-gradient-to-br from-champagne/8 to-bronze/8">
          <div className="container-narrow">
            <div className="text-center mb-20">
              <h2 className="text-section mb-4">Real Results</h2>
              <p className="text-description text-muted">
                See the transformation with our healed-first approach
              </p>
            </div>
            <div className="relative group">
              <BeforeAfterSlider />
            </div>
          </div>
        </section>

        {/* Available Slots - Enhanced Layout */}
        <section className="section-standard bg-muted/30">
          <div className="container-narrow">
            <div className="text-center mb-16">
              <h2 className="text-section mb-4">Book Your Appointment</h2>
              <p className="text-description text-muted">
                Choose from our available time slots
              </p>
            </div>
            <AvailableSlotsList serviceType="beauty" limit={6} showViewAll={true} />
          </div>
        </section>

        {/* Process Steps - Enhanced with Creative Layout */}
        <section className="section-spacious bg-gradient-to-br from-muted/20 to-transparent">
          <div className="container-standard">
            <div className="text-center mb-20">
              <h2 className="text-section mb-4">Your Beauty Journey</h2>
              <p className="text-description text-muted">
                Three simple steps to enhance your natural beauty
              </p>
            </div>
            <div className="layout-zigzag">
              {[
                {
                  number: '1',
                  title: 'Consultation',
                  description: 'We discuss your goals, analyze your skin type, and design your perfect look together.',
                  icon: '💬'
                },
                {
                  number: '2',
                  title: 'Procedure',
                  description: 'Gentle, precise work with premium pigments in our hygienic, comfortable studio.',
                  icon: '✨'
                },
                {
                  number: '3',
                  title: 'Aftercare',
                  description: 'Full support through healing with detailed instructions and personalized follow-up.',
                  icon: '🌟'
                }
              ].map((step, index) => (
                <div key={index} className="card-service group stagger-children" style={{ animationDelay: `${index * 150}ms` }}>
                  <div className="flex items-start gap-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <span className="text-3xl">{step.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-title mb-3 group-hover:text-primary transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-description">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Section - Enhanced Stats Layout */}
        <section className="section-spacious bg-gradient-to-br from-lip-rose/5 to-champagne/5">
          <div className="container-standard">
            <div className="text-center mb-20">
              <h2 className="text-section mb-4">Why Choose BM Beauty</h2>
              <p className="text-description text-muted">
                Excellence trusted by hundreds of clients
              </p>
            </div>
            <div className="layout-stats">
              <div className="card-testimonial group hover:scale-105 transition-all">
                <Star className="w-12 h-12 text-champagne mb-4 mx-auto group-hover:scale-110 transition-transform" />
                <div className="text-4xl font-bold text-champagne mb-2">5.0</div>
                <h3 className="text-title mb-2">Perfect Rating</h3>
                <p className="text-subtle">44+ verified reviews</p>
              </div>
              <div className="card-testimonial group hover:scale-105 transition-all">
                <Shield className="w-12 h-12 text-primary mb-4 mx-auto group-hover:scale-110 transition-transform" />
                <div className="text-4xl font-bold text-primary mb-2">100%</div>
                <h3 className="text-title mb-2">Certified</h3>
                <p className="text-subtle">Internationally licensed</p>
              </div>
              <div className="card-testimonial group hover:scale-105 transition-all">
                <Sparkles className="w-12 h-12 text-lip-rose mb-4 mx-auto group-hover:scale-110 transition-transform" />
                <div className="text-4xl font-bold text-lip-rose mb-2">Premium</div>
                <h3 className="text-title mb-2">Quality Products</h3>
                <p className="text-subtle">Top-tier pigments</p>
              </div>
            </div>
          </div>
        </section>

        {/* Sticky CTA */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t py-4 md:hidden z-40">
          <div className="container mx-auto px-6">
            <Button size="lg" className="w-full" onClick={() => setIsBookingOpen(true)}>
              Book Now
            </Button>
          </div>
        </div>
      </main>

      <Footer />
      <MobileFooter mode="beauty" />

      <BookingSheet
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        services={services}
      />
    </div>
  );
};

export default Beauty;
