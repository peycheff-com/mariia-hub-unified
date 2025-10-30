import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Sparkles, Palette, Clock, Star } from "lucide-react";
import { Link } from "react-router-dom";

import { SEO } from "@/components/SEO";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileFooter from "@/components/MobileFooter";
import StandardServiceCard from "@/components/StandardServiceCard";
import ServiceCardSkeleton from "@/components/ServiceCardSkeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";


const BeautyMakeupCategory = () => {
  const { i18n } = useTranslation();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMakeupServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('service_type', 'beauty')
          .eq('is_active', true)
          .ilike('slug', '%makijaz%')
          .or('slug.ilike.%makeup%')
          .order('display_order');

        if (error) throw error;
        setServices(data || []);
      } catch (error) {
        toast aria-live="polite" aria-atomic="true"({
          title: "Error",
          description: "Could not load makeup services",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMakeupServices();
  }, [toast aria-live="polite" aria-atomic="true"]);

  const makeupCategories = [
    {
      id: "daily",
      title: i18n.language === 'pl' ? "Makijaż Dzienny" : "Daily Makeup",
      description: i18n.language === 'pl'
        ? "Subtelny i naturalny makijaż na co dzień, który podkreśli Twoje piękno"
        : "Subtle and natural everyday makeup that enhances your beauty",
      icon: "☀️",
      duration: "45-60 min"
    },
    {
      id: "evening",
      title: i18n.language === 'pl' ? "Makijaż Wieczorowy" : "Evening Makeup",
      description: i18n.language === 'pl'
        ? "Wyrazisty makijaż na specjalne okazje, wieczorne wyjścia i imprezy"
        : "Bold makeup for special occasions, evenings out and events",
      icon: "🌙",
      duration: "60-90 min"
    },
    {
      id: "bridal",
      title: i18n.language === 'pl' ? "Makijaż Ślubny" : "Bridal Makeup",
      description: i18n.language === 'pl'
        ? "Profesjonalny makijaż ślubny, który przetrwa całą ceremonię i weselę"
        : "Professional bridal makeup that will last throughout the ceremony and reception",
      icon: "👰",
      duration: "90-120 min"
    },
    {
      id: "editorial",
      title: i18n.language === 'pl' ? "Makijaż Editorial" : "Editorial Makeup",
      description: i18n.language === 'pl'
        ? "Kreatywny i artystyczny makijaż do sesji zdjęciowych i wydarzeń"
        : "Creative and artistic makeup for photoshoots and events",
      icon: "🎨",
      duration: "90-120 min"
    }
  ];

  const features = [
    {
      icon: Palette,
      title: i18n.language === 'pl' ? "Luksusowe Kosmetyki" : "Premium Cosmetics",
      description: i18n.language === 'pl'
        ? "Używam tylko najwyższej jakości produktów renomowanych marek"
        : "I use only highest quality products from renowned brands"
    },
    {
      icon: Clock,
      title: i18n.language === 'pl' ? "Długotrwały Efekt" : "Long-lasting Effect",
      description: i18n.language === 'pl'
        ? "Makijaż, który utrzymuje się w nienagannej kondycji przez wiele godzin"
        : "Makeup that stays in perfect condition for many hours"
    },
    {
      icon: Star,
      title: i18n.language === 'pl' ? "Indywidualne Podejście" : "Personalized Approach",
      description: i18n.language === 'pl'
        ? "Dopasowuję makijaż do Twojego stylu, okazji i typu urody"
        : "I tailor makeup to your style, occasion and beauty type"
    }
  ];

  const processSteps = [
    {
      step: "01",
      title: i18n.language === 'pl' ? "Konsultacja" : "Consultation",
      description: i18n.language === 'pl'
        ? "Omówienie oczekiwań, stylu i okazji"
        : "Discussing expectations, style and occasion"
    },
    {
      step: "02",
      title: i18n.language === 'pl' ? "Przygotowanie Skóry" : "Skin Preparation",
      description: i18n.language === 'pl'
        ? "Oczyszczenie i nawilżenie skóry twarzy"
        : "Cleansing and moisturizing facial skin"
    },
    {
      step: "03",
      title: i18n.language === 'pl' ? "Wykonanie Makijażu" : "Makeup Application",
      description: i18n.language === 'pl'
        ? "Precyzyjne nałożenie makijażu krok po kroku"
        : "Precise makeup application step by step"
    },
    {
      step: "04",
      title: i18n.language === 'pl' ? "Finalizacja" : "Finalization",
      description: i18n.language === 'pl'
        ? "Utrwalenie i ostatnie poprawki"
        : "Setting and final touches"
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
        title="Makeup Services — Daily, Evening & Bridal Makeup | Warsaw"
        description="Professional makeup services including daily, evening, bridal, and editorial makeup in Warsaw"
        keywords="makijaż Warszawa, makijaż ślubny, makeup artist Warsaw, profesjonalny makijaż"
      />
      <Navigation mode="beauty" />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-background via-background to-muted/10 pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="absolute inset-0 bg-gradient-to-r from-rose/20 via-transparent to-background/30" />

        <div className="container mx-auto px-6 md:px-8 max-w-7xl relative z-10">
          <div className="max-w-4xl space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass-accent border border-champagne/20 animate-fade-rise">
              <div className="w-2 h-2 rounded-full bg-rose animate-pulse" />
              <span className="text-xs font-body tracking-[0.3em] uppercase font-light text-champagne-200">
                {i18n.language === 'pl' ? "Artystka makijażu" : i18n.language === 'en' ? "Makeup Artist" : i18n.language === 'ua' ? "Візажист" : "Визажист"}
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.85] text-pearl tracking-tight font-light font-display animate-fade-rise">
              <div className="space-y-2">
                <span className="block">
                  {i18n.language === 'pl' ? "Perfekcyjny" : i18n.language === 'en' ? "Perfect" : i18n.language === 'ua' ? "Ідеальний" : "Идеальный"}
                </span>
                <span className="block bg-gradient-to-r from-rose via-champagne-200 to-champagne bg-clip-text text-transparent font-normal">
                  {i18n.language === 'pl' ? "Makijaż" : i18n.language === 'en' ? "Makeup" : i18n.language === 'ua' ? "Макіяж" : "Макияж"}
                </span>
              </div>
            </h1>

            <div className="w-24 h-[3px] bg-gradient-to-r from-rose via-champagne to-bronze rounded-full shadow-luxury animate-fade-rise-delay" />

            <p className="text-xl sm:text-2xl text-pearl/80 leading-relaxed font-light font-body max-w-3xl animate-fade-rise-delay">
              {i18n.language === 'pl'
                ? "Profesjonalny makijaż, który podkreśli Twoje naturalne piękno i sprawi, że poczujesz się wyjątkowo na każdą okazję."
                : i18n.language === 'en'
                ? "Professional makeup that will enhance your natural beauty and make you feel special on any occasion."
                : i18n.language === 'ua'
                ? "Професійний макіяж, який підкреслить Вашу природну красу і змусить відчути себе винятково на будь-яку нагоду."
                : "Профессиональный макияж, который подчеркнет Вашу естественную красоту и заставит чувствовать себя исключительной на любой случай."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-rise-delay">
              <Link
                to="/book?category=makeup"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-brand text-brand-foreground rounded-full font-medium shadow-luxury hover:shadow-luxury-lg transition-all duration-300 hover:scale-105 group"
              >
                <span>{i18n.language === 'pl' ? "Umów Wizytę" : i18n.language === 'en' ? "Book Appointment" : i18n.language === 'ua' ? "Записатись" : "Записаться"}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="#services"
                className="inline-flex items-center gap-3 px-8 py-4 glass-subtle text-pearl rounded-full font-medium border border-champagne/20 hover:bg-white/10 transition-all duration-300"
              >
                <span>{i18n.language === 'pl' ? "Zobacz Ofertę" : i18n.language === 'en' ? "View Offer" : i18n.language === 'ua' ? "Переглянути" : "Посмотреть"}</span>
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
              {i18n.language === 'pl' ? "Rodzaje Makijażu" : i18n.language === 'en' ? "Makeup Types" : i18n.language === 'ua' ? "Види Макіяжу" : "Виды Макияжа"}
            </h2>
            <p className="text-xl text-pearl/70 font-light font-body max-w-2xl mx-auto">
              {i18n.language === 'pl'
                ? "Wybierz rodzaj makijażu idealnie dopasowany do Twojej okazji"
                : i18n.language === 'en'
                ? "Choose the makeup type perfectly suited for your occasion"
                : i18n.language === 'ua'
                ? "Оберіть вид макіяжу, ідеально підібраний для Вашої нагоди"
                : "Выберите вид макияжа, идеально подобранный для Вашего случая"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {makeupCategories.map((category, index) => (
              <div
                key={category.id}
                className="glass-card p-6 rounded-2xl border border-champagne/20 hover:border-champagne/40 transition-all duration-300 hover:scale-105 animate-fade-rise"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-4xl mb-4">{category.icon}</div>
                <h3 className="text-xl font-display font-semibold text-pearl mb-3">
                  {category.title}
                </h3>
                <p className="text-pearl/70 font-body leading-relaxed mb-4">
                  {category.description}
                </p>
                <div className="flex items-center gap-2 text-sm text-champagne-200">
                  <Clock className="w-4 h-4" />
                  <span>{category.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/5 to-transparent" />

        <div className="container mx-auto px-6 md:px-8 max-w-7xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-semibold text-pearl leading-tight tracking-tight mb-4">
              {i18n.language === 'pl' ? "Dlaczego Warto Wybrać Mój Makijaż" : i18n.language === 'en' ? "Why Choose My Makeup" : i18n.language === 'ua' ? "Чому Варто Обрати Мій Макіяж" : "Почему Стоит Выбрать Мой Макияж"}
            </h2>
            <p className="text-xl text-pearl/70 font-light font-body max-w-2xl mx-auto">
              {i18n.language === 'pl'
                ? "Profesjonalne podejście i najwyższa jakość usług"
                : i18n.language === 'en'
                ? "Professional approach and highest quality service"
                : i18n.language === 'ua'
                ? "Професійний підхід і найвища якість послуг"
                : "Профессиональный подход и высочайшее качество услуг"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center space-y-4 animate-fade-rise"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full glass-accent">
                  <feature.icon className="w-8 h-8 text-champagne-200" />
                </div>
                <h3 className="text-xl font-display font-semibold text-pearl">
                  {feature.title}
                </h3>
                <p className="text-pearl/70 font-body leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 md:py-24 bg-gradient-to-b from-muted/10 to-transparent">
        <div className="container mx-auto px-6 md:px-8 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-semibold text-pearl leading-tight tracking-tight mb-4">
              {i18n.language === 'pl' ? "Proces Makijażu" : i18n.language === 'en' ? "Makeup Process" : i18n.language === 'ua' ? "Процес Макіяжу" : "Процесс Макияжа"}
            </h2>
            <p className="text-xl text-pearl/70 font-light font-body max-w-2xl mx-auto">
              {i18n.language === 'pl'
                ? "Kroki, które prowadzą do idealnego makijażu"
                : i18n.language === 'en'
                ? "Steps that lead to perfect makeup"
                : i18n.language === 'ua'
                ? "Кроки, що ведуть до ідеального макіяжу"
                : "Шаги, которые ведут к идеальному макияжу"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {processSteps.map((step, index) => (
              <div
                key={index}
                className="text-center space-y-4 animate-fade-rise"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="text-4xl font-display font-bold text-champagne-200">
                  {step.step}
                </div>
                <h3 className="text-xl font-display font-semibold text-pearl">
                  {step.title}
                </h3>
                <p className="text-pearl/70 font-body leading-relaxed">
                  {step.description}
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
              {i18n.language === 'pl' ? "Usługi Makijażu" : i18n.language === 'en' ? "Makeup Services" : i18n.language === 'ua' ? "Послуги Макіяжу" : "Услуги Макияжа"}
            </h2>
            <p className="text-xl text-pearl/70 font-light font-body max-w-2xl mx-auto">
              {i18n.language === 'pl'
                ? "Kompleksowa oferta profesjonalnych usług makijażu"
                : i18n.language === 'en'
                ? "Complete offer of professional makeup services"
                : i18n.language === 'ua'
                ? "Комплексна пропозиція професійних послуг макіяжу"
                : "Комплексное предложение профессиональных услуг макияжа"}
            </p>
          </div>

          {services.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full glass-accent mb-6">
                <Sparkles className="w-10 h-10 text-champagne-foreground" />
              </div>
              <p className="text-pearl/70 font-body text-lg">
                {i18n.language === 'pl'
                  ? "Brak dostępnych usług makijażu w tej chwili"
                  : i18n.language === 'en'
                  ? "No makeup services available at the moment"
                  : i18n.language === 'ua'
                  ? "Наразі немає доступних послуг макіяжу"
                  : "Сейчас нет доступных услуг макияжа"}
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
      <section className="py-20 md:py-24 bg-gradient-to-r from-rose/10 via-champagne/10 to-bronze/10">
        <div className="container mx-auto px-6 md:px-8 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-pearl mb-4">
            {i18n.language === 'pl'
              ? "Gotowa na perfekcyjny makijaż?"
              : i18n.language === 'en'
              ? "Ready for perfect makeup?"
              : i18n.language === 'ua'
              ? "Готова до ідеального макіяжу?"
              : "Готовы к идеальному макияжу?"}
          </h2>
          <p className="text-xl text-pearl/80 font-body mb-8">
            {i18n.language === 'pl'
              ? "Umów się na wizytę i ciesz się profesjonalnym makijażem na każdą okazję"
              : i18n.language === 'en'
              ? "Book an appointment and enjoy professional makeup for any occasion"
              : i18n.language === 'ua'
              ? "Запишіться на візит і насолоджуйтесь професійним макіяжем на будь-яку нагоду"
              : "Запишитесь на визит и наслаждайтесь профессиональным макияжем на любой случай"}
          </p>
          <Link
            to="/book?category=makeup"
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-brand text-brand-foreground rounded-full font-medium shadow-luxury hover:shadow-luxury-lg transition-all duration-300 hover:scale-105 text-lg group"
          >
            <span>{i18n.language === 'pl' ? "Umów Wizytę" : i18n.language === 'en' ? "Book Appointment" : i18n.language === 'ua' ? "Записатись" : "Записаться"}</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      <Footer />
      <MobileFooter mode="beauty" />
    </div>
  );
};

export default BeautyMakeupCategory;