import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Dumbbell, Users, Laptop, Heart } from "lucide-react";

import { useMode } from "@/contexts/ModeContext";
import { SEO } from "@/components/SEO";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileFooter from "@/components/MobileFooter";
import AvailableSlotsList from "@/components/AvailableSlotsList";
import BookingSheet from "@/components/booking/BookingSheet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSiteImage } from "@/hooks/useSiteImage";

import heroFitness from "@/assets/hero-fitness.jpg";

const Fitness = () => {
  const { t } = useTranslation();
  const { setMode } = useMode();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setMode("fitness");
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .eq('service_type', 'fitness')
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

  const programs = [
    { id: "personal-training-single", name: "1:1 Personal Training", icon: Dumbbell, slug: "pt-1-1" },
    { id: "personal-training-package", name: "Training Packages", icon: Dumbbell, slug: "pt-1-1" },
    { id: "online-coaching", name: "Online Coaching", icon: Laptop, slug: "online-coaching" },
    { id: "group-training", name: "Small Group", icon: Users, slug: "glute-sculpt-8w" },
  ];

  const { image: heroFitnessImg } = useSiteImage('hero-fitness');

  return (
    <div className="min-h-screen bg-gradient-hero">
      <SEO
        title="Personal Training & Programs for Women | Warsaw"
        description="Glutes, core, posture, lean fat-loss. WHO & ACSM-aligned. EN/PL/UA."
        keywords="glute workout women, anti-rotation core, posture mobility desk, program pośladki 8 tygodni, brzuch core anty-rotacja"
      />
      <Navigation mode="fitness" />

      <main>
        {/* Hero Section - Enhanced with Immersive Layout */}
        <section className="hero-standard bg-gradient-to-br from-sage/10 via-transparent to-primary/5">
          <div className="container-standard">
            <div className="grid-hero">
              <div className="space-y-section stagger-children">
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass-glass border border-sage/20">
                  <div className="w-2 h-2 rounded-full bg-sage pulse-glow" />
                  <span className="text-sm font-body tracking-[0.3em] uppercase font-light text-on-dark">
                    Personal Training
                  </span>
                </div>
                <h1 className="text-hero-serif leading-tight">
                  Gentle Coaching.<span className="text-gradient-reveal"> Strong Habits.</span>
                </h1>
                <p className="text-description text-high-contrast max-w-2xl">
                  Personal training that meets you where you are. Build strength, confidence, and lasting change in a supportive environment.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="btn-large btn-primary-brand magnetic-btn" onClick={() => setIsBookingOpen(true)}>
                    Start Training
                  </Button>
                  <Button size="lg" variant="outline" className="btn-large btn-glass magnetic-btn" asChild>
                    <Link to="/fitness/programs">View Programs</Link>
                  </Button>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-sage/20 to-transparent rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500" />
                <div className="relative overflow-hidden rounded-3xl shadow-luxury aspect-video">
                  <img
                    src={heroFitnessImg?.image_url || heroFitness}
                    alt={heroFitnessImg?.alt_text || "Women-first personal training"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/20 to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Programs - Enhanced Interactive Grid */}
        <section className="section-dense bg-background">
          <div className="container-standard">
            <div className="text-center mb-20">
              <h2 className="text-section heading-serif mb-4">Choose Your Path</h2>
              <p className="text-description text-muted">
                Select the program that fits your goals and lifestyle
              </p>
            </div>
            <div className="grid-services stagger-children">
              {programs.map((program, index) => (
                <Link
                  key={program.id}
                  to={`/fitness/programs`}
                  className="card-interactive hover-glow group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-8 text-center">
                    <div className="w-20 h-20 bg-sage/10 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                      <program.icon className="w-10 h-10 text-sage" />
                    </div>
                    <h3 className="text-title mb-3 group-hover:text-sage transition-colors">{program.name}</h3>
                    <p className="text-subtle">Learn more →</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Available Slots - Enhanced Layout */}
        <section className="section-standard bg-gradient-to-br from-muted/30 to-transparent">
          <div className="container-narrow">
            <div className="text-center mb-16">
              <h2 className="text-section heading-serif mb-4">Book Your Session</h2>
              <p className="text-description text-muted">
                Choose from our available training slots
              </p>
            </div>
            <AvailableSlotsList serviceType="fitness" limit={6} showViewAll={true} />
          </div>
        </section>

        {/* Success Stories - Enhanced Carousel */}
        <section className="section-spacious bg-background">
          <div className="container-standard">
            <div className="text-center mb-20">
              <h2 className="text-section heading-serif mb-4">Real Progress</h2>
              <p className="text-description text-muted">
                Stories of transformation from our clients
              </p>
            </div>
            <div className="layout-carousel">
              <div className="card-testimonial hover-lift h-full">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-sage/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">💪</span>
                  </div>
                </div>
                <p className="text-description mb-6 italic text-high-contrast">
                  "Started with zero confidence. Three months later, I'm stronger than I ever thought possible."
                </p>
                <p className="font-semibold text-sage">— Anna, 34</p>
              </div>
              <div className="card-testimonial hover-lift h-full">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-sage/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🎯</span>
                  </div>
                </div>
                <p className="text-description mb-6 italic text-high-contrast">
                  "The gentle approach made all the difference. No judgment, just steady progress."
                </p>
                <p className="font-semibold text-sage">— Piotr, 41</p>
              </div>
              <div className="card-testimonial hover-lift h-full">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-sage/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">⭐</span>
                  </div>
                </div>
                <p className="text-description mb-6 italic text-high-contrast">
                  "Online coaching fit perfectly with my schedule. Personalized and effective."
                </p>
                <p className="font-semibold text-sage">— Kasia, 29</p>
              </div>
            </div>
          </div>
        </section>

        {/* Sticky CTA */}
        <div className="sticky bottom-0 glass-card border-t py-4 md:hidden z-40">
          <div className="container mx-auto px-6">
            <Button size="lg" variant="default" className="w-full" onClick={() => setIsBookingOpen(true)}>
              Book Training
            </Button>
          </div>
        </div>
      </main>

      <Footer />
      <MobileFooter mode="fitness" />

      <BookingSheet
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        services={services}
      />
    </div>
  );
};

export default Fitness;
