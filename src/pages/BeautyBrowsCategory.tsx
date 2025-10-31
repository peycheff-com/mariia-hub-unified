import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Sparkles, Clock, Shield, Heart } from "lucide-react";
import { Link } from "react-router-dom";

import { SEO } from "@/components/SEO";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileFooter from "@/components/MobileFooter";
import StandardServiceCard from "@/components/StandardServiceCard";
import ServiceCardSkeleton from "@/components/ServiceCardSkeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";


const BeautyBrowsCategory = () => {
  const { i18n } = useTranslation();
  const { toast } = useToast();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrowServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('service_type', 'beauty')
          .eq('is_active', true)
          .ilike('slug', '%brwi%')
          .or('slug.ilike.%brow%,slug.ilike.%brows%')
          .order('display_order');

        if (error) throw error;
        setServices(data || []);
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not load brow services",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBrowServices();
  }, [toast]);

  const browCategories = [
    {
      id: "microblading",
      title: i18n.language === 'pl' ? "Microblading" : "Microblading",
      description: i18n.language === 'pl'
        ? "Precyzyjne tworzenie naturalnych włosków za pomocą techniki microblading"
        : "Precise creation of natural hair strokes using microblading technique",
      icon: "✨"
    },
    {
      id: "ombre",
      title: i18n.language === 'pl' ? "Ombre / Powder Brows" : "Ombre / Powder Brows",
      description: i18n.language === 'pl'
        ? "Delikatny efekt ombre dla subtelnego i eleganckiego wyglądu"
        : "Soft ombre effect for a subtle and elegant appearance",
      icon: "🌟"
    },
    {
      id: "combo",
      title: i18n.language === 'pl' ? "Combo Brows" : "Combo Brows",
      description: i18n.language === 'pl'
        ? "Połączenie microblading i ombre dla maksymalnej naturalności"
        : "Combination of microblading and ombre for maximum naturalness",
      icon: "💫"
    },
    {
      id: "lamination",
      title: i18n.language === 'pl' ? "Laminacja Brwi" : "Brow Lamination",
      description: i18n.language === 'pl'
        ? "Zabieg podkreślający naturalny kształt i gęstość brwi"
        : "Treatment that enhances natural shape and density of brows",
      icon: "🦋"
    }
  ];

  const benefits = [
    {
      icon: Clock,
      title: i18n.language === 'pl' ? "Oszczędność Czasu" : "Time Saving",
      description: i18n.language === 'pl'
        ? "Codzienna oszczędność czasu do 30 minut"
        : "Save up to 30 minutes daily"
    },
    {
      icon: Shield,
      title: i18n.language === 'pl' ? "Bezpieczeństwo" : "Safety",
      description: i18n.language === 'pl'
        ? "Najwyższe standardy higieny i bezpieczeństwa"
        : "Highest hygiene and safety standards"
    },
    {
      icon: Heart,
      title: i18n.language === 'pl' ? "Naturalny Efekt" : "Natural Result",
      description: i18n.language === 'pl'
        ? "Indywidualnie dopasowany kształt i kolor"
        : "Customized shape and color"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation mode="beauty" />
        <div className="container mx-auto px-6 pt-32">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10 items-stretch">
            {[1, 2, 3, 4].map((i) => (
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
        title="Brow Treatments — Microblading, Ombre & Lamination | Warsaw"
        description="Professional brow treatments including microblading, ombre brows, combo brows, and brow lamination in Warsaw"
        keywords="microblading Warszawa, ombre brows, laminacja brwi, stylizacja brwi, PMU brows"
      />
      <Navigation mode="beauty" />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-background via-background to-muted/10 pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/50 via-transparent to-background/30" />

        <div className="container mx-auto px-6 md:px-8 max-w-7xl relative z-10">
          <div className="max-w-4xl space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass-accent border border-champagne/20 animate-fade-rise">
              <div className="w-2 h-2 rounded-full bg-bronze animate-pulse" />
              <span className="text-xs font-body tracking-[0.3em] uppercase font-light text-champagne-200">
                {i18n.language === 'pl' ? "Ekspertka od brwi" : i18n.language === 'en' ? "Brow Specialist" : i18n.language === 'ua' ? "Брові Майстер" : "Мастер Бровей"}
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.85] text-pearl tracking-tight font-light font-display animate-fade-rise">
              <div className="space-y-2">
                <span className="block">
                  {i18n.language === 'pl' ? "Idealne" : i18n.language === 'en' ? "Perfect" : i18n.language === 'ua' ? "Ідеальні" : "Идеальные"}
                </span>
                <span className="block bg-gradient-to-r from-bronze via-champagne-200 to-champagne bg-clip-text text-transparent font-normal">
                  {i18n.language === 'pl' ? "Brwi" : i18n.language === 'en' ? "Brows" : i18n.language === 'ua' ? "Брові" : "Брови"}
                </span>
              </div>
            </h1>

            <div className="w-24 h-[3px] bg-gradient-to-r from-bronze via-champagne to-bronze rounded-full shadow-luxury animate-fade-rise-delay" />

            <p className="text-xl sm:text-2xl text-pearl/80 leading-relaxed font-light font-body max-w-3xl animate-fade-rise-delay">
              {i18n.language === 'pl'
                ? "Odkryj najwyższej jakości zabiegi stylizacji brwi, które podkreślą Twoje naturalne piękno i zaoszczędzą czas każdego dnia."
                : i18n.language === 'en'
                ? "Discover highest quality brow treatments that will enhance your natural beauty and save you time every day."
                : i18n.language === 'ua'
                ? "Відкрийте найвищу якість процедур стилізації брів, які підкреслять Вашу природну красу та заощадять час щодня."
                : "Откройте высочайшее качество процедур стилизации бровей, которые подчеркнут Вашу естественную красоту и сэкономят время каждый день."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-rise-delay">
              <Link
                to="/book?category=brows"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-brand text-brand-foreground rounded-full font-medium shadow-luxury hover:shadow-luxury-lg transition-all duration-300 hover:scale-105 group"
              >
                <span>{i18n.language === 'pl' ? "Umów Wizytę" : i18n.language === 'en' ? "Book Appointment" : i18n.language === 'ua' ? "Записатись" : "Записаться"}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="#services"
                className="inline-flex items-center gap-3 px-8 py-4 glass-subtle text-pearl rounded-full font-medium border border-champagne/20 hover:bg-white/10 transition-all duration-300"
              >
                <span>{i18n.language === 'pl' ? "Zobacz Usługi" : i18n.language === 'en' ? "View Services" : i18n.language === 'ua' ? "Послуги" : "Услуги"}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Overview */}
      <section className="py-20 md:py-24 bg-gradient-to-b from-muted/10 to-transparent">
        <div className="container mx-auto px-6 md:px-8 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-semibold text-pearl leading-tight tracking-tight mb-4">
              {i18n.language === 'pl' ? "Rodzaje Zabiegów" : i18n.language === 'en' ? "Treatment Types" : i18n.language === 'ua' ? "Типи Процедур" : "Виды Процедур"}
            </h2>
            <p className="text-xl text-pearl/70 font-light font-body max-w-2xl mx-auto">
              {i18n.language === 'pl'
                ? "Wybierz technikę idealnie dopasowaną do Twoich potrzeb i oczekiwań"
                : i18n.language === 'en'
                ? "Choose the technique perfectly matched to your needs and expectations"
                : i18n.language === 'ua'
                ? "Оберіть техніку, ідеально підібрану до Ваших потреб та очікувань"
                : "Выберите технику, идеально подобранную под Ваши потребы и ожидания"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {browCategories.map((category, index) => (
              <div
                key={category.id}
                className="glass-card p-6 rounded-2xl border border-champagne/20 hover:border-champagne/40 transition-all duration-300 hover:scale-105 animate-fade-rise"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-4xl mb-4">{category.icon}</div>
                <h3 className="text-xl font-display font-semibold text-pearl mb-3">
                  {category.title}
                </h3>
                <p className="text-pearl/70 font-body leading-relaxed">
                  {category.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 md:py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/5 to-transparent" />

        <div className="container mx-auto px-6 md:px-8 max-w-7xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-semibold text-pearl leading-tight tracking-tight mb-4">
              {i18n.language === 'pl' ? "Korzyści" : i18n.language === 'en' ? "Benefits" : i18n.language === 'ua' ? "Переваги" : "Преимущества"}
            </h2>
            <p className="text-xl text-pearl/70 font-light font-body max-w-2xl mx-auto">
              {i18n.language === 'pl'
                ? "Dlaczego warto zainwestować w profesjonalną stylizację brwi"
                : i18n.language === 'en'
                ? "Why invest in professional brow styling"
                : i18n.language === 'ua'
                ? "Чому варто інвестувати в професійну стилізацію брів"
                : "Почему стоит инвестировать в профессиональную стилизацию бровей"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="text-center space-y-4 animate-fade-rise"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full glass-accent">
                  <benefit.icon className="w-8 h-8 text-champagne-200" />
                </div>
                <h3 className="text-xl font-display font-semibold text-pearl">
                  {benefit.title}
                </h3>
                <p className="text-pearl/70 font-body leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 md:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background to-muted/10" />

        <div className="container mx-auto px-6 md:px-8 max-w-7xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-semibold text-pearl leading-tight tracking-tight mb-4">
              {i18n.language === 'pl' ? "Usługi Brwi" : i18n.language === 'en' ? "Brow Services" : i18n.language === 'ua' ? "Послуги Брів" : "Услуги Бровей"}
            </h2>
            <p className="text-xl text-pearl/70 font-light font-body max-w-2xl mx-auto">
              {i18n.language === 'pl'
                ? "Kompleksowa oferta zabiegów stylizacji brwi"
                : i18n.language === 'en'
                ? "Complete offer of brow styling treatments"
                : i18n.language === 'ua'
                ? "Комплексна пропозиція послуг стилізації брів"
                : "Комплексное предложение услуг стилизации бровей"}
            </p>
          </div>

          {services.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full glass-accent mb-6">
                <Sparkles className="w-10 h-10 text-champagne-foreground" />
              </div>
              <p className="text-pearl/70 font-body text-lg">
                {i18n.language === 'pl'
                  ? "Brak dostępnych usług brwi w tej chwili"
                  : i18n.language === 'en'
                  ? "No brow services available at the moment"
                  : i18n.language === 'ua'
                  ? "Наразі немає доступних послуг для брів"
                  : "Сейчас нет доступных услуг для бровей"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10 items-stretch">
              {services.map((service, index) => (
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

          <div className="text-center mt-16">
            <Link
              to="/beauty/services"
              className="inline-flex items-center gap-3 px-8 py-4 glass-subtle text-pearl rounded-full font-medium border border-champagne/20 hover:bg-white/10 transition-all duration-300 group"
            >
              <span>{i18n.language === 'pl' ? "Wszystkie Usługi Beauty" : i18n.language === 'en' ? "All Beauty Services" : i18n.language === 'ua' ? "Всі Послуги Beauty" : "Все Услуги Beauty"}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-24 bg-gradient-to-r from-bronze/10 via-champagne/10 to-bronze/10">
        <div className="container mx-auto px-6 md:px-8 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-pearl mb-4">
            {i18n.language === 'pl'
              ? "Gotowa na idealne brwi?"
              : i18n.language === 'en'
              ? "Ready for perfect brows?"
              : i18n.language === 'ua'
              ? "Готова до ідеальних брів?"
              : "Готовы к идеальным бровям?"}
          </h2>
          <p className="text-xl text-pearl/80 font-body mb-8">
            {i18n.language === 'pl'
              ? "Umów się na konsultację i znajdź zabieg idealny dla Ciebie"
              : i18n.language === 'en'
              ? "Book a consultation and find the perfect treatment for you"
              : i18n.language === 'ua'
              ? "Запишіться на консультацію та знайдіть ідеальну процедуру для Вас"
              : "Запишитесь на консультацию и найдите идеальную процедуру для Вас"}
          </p>
          <Link
            to="/book?category=brows"
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-brand text-brand-foreground rounded-full font-medium shadow-luxury hover:shadow-luxury-lg transition-all duration-300 hover:scale-105 text-lg group"
          >
            <span>{i18n.language === 'pl' ? "Umów Konsultację" : i18n.language === 'en' ? "Book Consultation" : i18n.language === 'ua' ? "Записати на Консультацію" : "Записать на Консультацию"}</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      <Footer />
      <MobileFooter mode="beauty" />
    </div>
  );
};

export default BeautyBrowsCategory;