import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Dumbbell, Users, Laptop, Heart, Target, Activity, Home, Baby, Clock } from "lucide-react";
import { useState, useEffect } from "react";

import { SEO } from "@/components/SEO";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileFooter from "@/components/MobileFooter";
import AvailableSlotsList from "@/components/AvailableSlotsList";
import ServiceCardSkeleton from "@/components/ServiceCardSkeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Program {
  id: string;
  slug: string;
  title: string;
  description: string;
  duration_minutes?: number;
  price_from: number;
  price_to?: number;
  is_package: boolean;
  package_sessions?: number;
}

const FitnessPrograms = () => {
  const { t, i18n } = useTranslation();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();
  const { formatPrice } = useCurrency();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('service_type', 'fitness')
          .eq('is_active', true)
          .order('display_order');
        
        if (error) throw error;
        setPrograms(data || []);
      } catch (error) {
        toast aria-live="polite" aria-atomic="true"({
          title: "Error",
          description: "Could not load programs",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, [toast aria-live="polite" aria-atomic="true"]);

  const getIcon = (slug: string) => {
    const iconMap: Record<string, any> = {
      'glute-sculpt-8w': Target,
      'waist-core': Activity,
      'posture-mobility': Home,
      'lean-toned-no-barbell': Dumbbell,
      'rehab-friendly': Heart,
      'pre-post-natal': Baby,
      'pt-1-1': Dumbbell,
      'online-coaching': Laptop
    };
    return iconMap[slug] || Dumbbell;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation mode="fitness" />
        <div className="container-standard pt-32">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 glass-card rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-on-dark uppercase tracking-wider font-medium">
                Loading Programs...
              </span>
            </div>
          </div>
          <div className="grid-services">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-full">
                <ServiceCardSkeleton />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <SEO
        title="Fitness Programs — Women-First Strength | Warsaw"
        description="8-week glutes, core training, mobility, no-barbell strength, and prenatal-safe fitness programs in Warsaw"
        keywords="program pośladki 8 tygodni, brzuch core anty-rotacja, mobilność biurowa, glute program women, Warsaw fitness"
      />
      <Navigation mode="fitness" />
      
      <main role="main" className="section-spacious">
        <div className="container-standard">
          {/* Hero Header - Standardized */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 glass-card rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-on-dark uppercase tracking-wider font-medium">
                Women-First Training Programs
              </span>
            </div>
            <h1 className="text-hero heading-serif mb-4">Fitness Programs</h1>
            <p className="text-description text-high-contrast max-w-2xl mx-auto">
              Choose the training style that fits your life. All programs are designed to build strength, confidence, and lasting habits.
            </p>
          </div>

          {/* Available Slots Section - Standardized */}
          <section className="mb-16">
            <h2 className="text-section text-center mb-12">Available Slots</h2>
            <AvailableSlotsList serviceType="fitness" limit={6} showViewAll={false} />
          </section>

          {/* Programs Grid - Standardized */}
          <section>
            <h2 className="text-section mb-12 heading-serif">
              {t('fitnessSection.programs.personal.title', 'All Programs')}
            </h2>
            <div className="grid-services">
              {programs.map((program) => {
              const Icon = getIcon(program.slug);
              return (
                <Link
                  key={program.slug}
                  to={`/fitness/programs/${program.slug}`}
                  className="group glass-card rounded-2xl p-8 hover:shadow-xl transition-all hover-scale"
                >
                  <div className="flex items-start justify-between mb-4">
                    <Icon className="w-12 h-12 text-primary group-hover:scale-110 transition-transform" />
                    {program.is_package && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                        Package
                      </span>
                    )}
                  </div>
                  
                  <h2 className="heading-serif text-2xl font-medium mb-3 group-hover:text-primary transition-colors">
                    {program.title}
                  </h2>
                  
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {program.description}
                  </p>

                  <div className="space-y-2 pt-4 border-t">
                    {program.duration_minutes && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>{program.duration_minutes} min/session</span>
                      </div>
                    )}
                    {program.is_package && program.package_sessions && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Target className="w-4 h-4 text-primary" />
                        <span>{program.package_sessions} sessions total</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-lg font-semibold heading-serif text-foreground pt-2">
                      <span>
                        {program.price_to 
                          ? `${formatPrice(program.price_from)}-${formatPrice(program.price_to)}` 
                          : `${formatPrice(program.price_from)}+`}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
            </div>
          </section>
        </div>
      </main>

      <Footer />
      <MobileFooter mode="fitness" />
    </div>
  );
};

export default FitnessPrograms;
