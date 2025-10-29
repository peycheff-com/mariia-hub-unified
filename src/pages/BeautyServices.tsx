import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";

import { SEO } from "@/components/SEO";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileFooter from "@/components/MobileFooter";
import StandardServiceCard from "@/components/StandardServiceCard";
import ServiceCardSkeleton from "@/components/ServiceCardSkeleton";
import EmptyState from "@/components/EmptyState";
import AvailableSlotsList from "@/components/AvailableSlotsList";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";


const BeautyServices = () => {
  const { i18n } = useTranslation();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"popular" | "price-low" | "price-high" | "duration">("popular");
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('service_type', 'beauty')
          .eq('is_active', true)
          .order('display_order');
        
        if (error) throw error;
        setServices(data || []);
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not load services",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [toast]);

  const getCategoryFromSlug = (slug: string): string => {
    if (slug.includes('makijaz-permanentny')) return 'permanent-makeup';
    if (slug.includes('brwi')) return 'brow-styling';
    if (slug.includes('rzesy') || slug.includes('rzes')) return 'lashes';
    if (slug.includes('laminacja')) return 'lashes';
    if (slug.includes('makijaz')) return 'additional';
    return 'additional';
  };

  const servicesWithCategory = services.map(service => ({
    ...service,
    category: getCategoryFromSlug(service.slug),
  }));

  const categories = [
    { id: "all", label: i18n.language === 'pl' ? "Wszystkie" : i18n.language === 'en' ? "All Services" : i18n.language === 'ua' ? "Всі послуги" : "Все услуги" },
    { id: "permanent-makeup", label: i18n.language === 'pl' ? "Makijaż Permanentny" : i18n.language === 'en' ? "Permanent Makeup" : i18n.language === 'ua' ? "Перманентний Макіяж" : "Перманентный Макияж" },
    { id: "brow-styling", label: i18n.language === 'pl' ? "Stylizacja Brwi" : i18n.language === 'en' ? "Brow Styling" : i18n.language === 'ua' ? "Стилізація Брів" : "Стилизация Бровей" },
    { id: "lashes", label: i18n.language === 'pl' ? "Rzęsy" : i18n.language === 'en' ? "Lashes" : i18n.language === 'ua' ? "Вії" : "Ресницы" },
    { id: "additional", label: i18n.language === 'pl' ? "Dodatkowe" : i18n.language === 'en' ? "Additional" : i18n.language === 'ua' ? "Додаткові" : "Дополнительные" },
  ];

  const filteredServices = activeCategory === "all"
    ? servicesWithCategory
    : servicesWithCategory.filter(s => s.category === activeCategory);

  // Sort services
  const sortedServices = [...filteredServices].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return (b.view_count || 0) - (a.view_count || 0);
      case "price-low":
        return a.price_from - b.price_from;
      case "price-high":
        return b.price_from - a.price_from;
      case "duration":
        return (a.duration_minutes || 0) - (b.duration_minutes || 0);
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation mode="beauty" />
        <div className="container-standard pt-32">
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
    <div className="min-h-screen bg-background">
      <SEO
        title="Beauty Services — PMU, Brows & Lashes | Warsaw"
        description="Professional permanent makeup, brow styling, and lash treatments in the heart of Warsaw"
        keywords="makijaż permanentny Warszawa, stylizacja brwi, laminacja rzęs, PMU Warsaw"
      />
      <Navigation mode="beauty" />
      
      {/* Enhanced Hero Section - Standardized */}
      <section className="hero-standard bg-gradient-to-br from-lip-rose/5 to-champagne/5 pt-32 pb-16">
        <div className="container-standard">
          <div className="max-w-4xl space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass-accent border border-champagne/20 animate-fade-rise">
              <div className="w-2 h-2 rounded-full bg-lip-rose animate-pulse" />
              <span className="text-xs font-body tracking-[0.3em] uppercase font-light text-on-dark">
                {i18n.language === 'pl' ? "Profesjonalne usługi beauty" : i18n.language === 'en' ? "Professional beauty services" : i18n.language === 'ua' ? "Професійні послуги краси" : "Профессиональные услуги красоты"}
              </span>
            </div>

            <h1 className="text-hero animate-fade-rise">
              <div className="space-y-2">
                <span className="block">
                  {i18n.language === 'pl' ? "Nasze" : i18n.language === 'en' ? "Our" : i18n.language === 'ua' ? "Наші" : "Наши"}
                </span>
                <span className="block bg-gradient-to-r from-champagne via-champagne-200 to-bronze bg-clip-text text-transparent font-normal">
                  {i18n.language === 'pl' ? "Usługi" : i18n.language === 'en' ? "Services" : i18n.language === 'ua' ? "Послуги" : "Услуги"}
                </span>
              </div>
            </h1>

            <div className="w-24 h-[3px] bg-gradient-to-r from-lip-rose via-champagne to-bronze rounded-full shadow-luxury animate-fade-rise-delay" />

            <p className="text-description text-high-contrast max-w-3xl animate-fade-rise-delay">
              {i18n.language === 'pl'
                ? "Odkryj pełną gamę usług makijażu permanentnego, stylizacji brwi i rzęs w sercu Warszawy z najwyższą starannością i luksusem."
                : i18n.language === 'en'
                ? "Discover our complete range of permanent makeup, brow styling, and lash services in the heart of Warsaw with the highest quality and luxury."
                : i18n.language === 'ua'
                ? "Відкрийте повний спектр послуг перманентного макіяжу, стилізації брів та вій у серці Варшави з найвищою якістю та розкішшю."
                : "Откройте полный спектр услуг перманентного макияжа, стилизации бровей и ресниц в сердце Варшавы с высочайшим качеством и роскошью."}
            </p>
          </div>
        </div>
      </section>

      {/* Enhanced Categories Filter */}
      <section className="sticky top-20 z-40 glass-card backdrop-blur-xl border-b border-champagne/20 py-6 bg-charcoal/80">
        <div className="container mx-auto px-6 md:px-8 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide flex-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 border font-body ${
                    activeCategory === cat.id
                      ? "bg-gradient-brand text-brand-foreground shadow-luxury border-white/10 scale-105"
                      : "glass-subtle text-pearl/80 hover:text-pearl hover:bg-white/10 hover:border-white/20 border-white/10"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm text-pearl/60 font-body">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 rounded-xl glass-card border border-champagne/20 text-pearl text-sm font-body focus:outline-none focus:border-champagne/60 focus:ring-2 focus:ring-champagne/20 cursor-pointer"
              >
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="duration">Duration</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Available Slots Section - Standardized */}
      <section className="section-compact bg-gradient-to-b from-muted/20 to-transparent">
        <div className="container-standard">
          <div className="text-center mb-8">
            <h2 className="text-section text-high-contrast">
              {i18n.language === 'pl' ? "Dostępne Terminy" : i18n.language === 'en' ? "Available Slots" : i18n.language === 'ua' ? "Доступні Години" : "Доступное Время"}
            </h2>
            <p className="text-description text-muted">
              {i18n.language === 'pl' ? "Zarezerwuj wizytę w dogodnym terminie" : i18n.language === 'en' ? "Book your appointment at a convenient time" : i18n.language === 'ua' ? "Запишіться на зручний час" : "Запишитесь на удобное время"}
            </p>
          </div>
          <AvailableSlotsList serviceType="beauty" limit={6} showViewAll={false} />
        </div>
      </section>

      {/* Enhanced Services Grid - Standardized */}
      <section className="section-spacious">
        <div className="container-standard">
          <div className="text-center mb-16">
            <h2 className="text-section text-high-contrast">
              {i18n.language === 'pl' ? "Wszystkie Usługi" : i18n.language === 'en' ? "All Services" : i18n.language === 'ua' ? "Всі Послуги" : "Все Услуги"}
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-lip-rose to-champagne rounded-full mx-auto mt-4 shadow-luxury" />
          </div>

          {filteredServices.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full glass-accent mb-6">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <EmptyState
                icon={Sparkles}
                title={i18n.language === 'pl' ? "Brak Usług w tej Kategorii" : i18n.language === 'en' ? "No Services Available" : i18n.language === 'ua' ? "Немає Послуг" : "Нет Услуг"}
                description={i18n.language === 'pl' ? "Sprawdź wkrótce nowe usługi beauty w tej kategorii." : i18n.language === 'en' ? "Check back soon for new beauty services in this category." : i18n.language === 'ua' ? "Незабаром перевірте нові послуги краси в цій категорії." : "Скоро проверьте новые услуги красоты в этой категории."}
              />
            </div>
          ) : (
            <div className="grid-services">
              {sortedServices.map((service, index) => (
                <div
                  key={service.id}
                  className="animate-fade-rise h-full"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <StandardServiceCard
                    service={service}
                    showQuickBook
                    allServices={services}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
      <MobileFooter mode="beauty" />
    </div>
  );
};

export default BeautyServices;
