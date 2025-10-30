import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Package, Star, Clock, Check, Heart, Sparkles, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

import { SEO } from "@/components/SEO";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileFooter from "@/components/MobileFooter";
import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";


const Packages = () => {
  const { i18n } = useTranslation();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("all");

  const beautyPackages = [
    {
      id: "brow-package",
      category: "beauty",
      title: i18n.language === 'pl' ? "Pakiet Brwi Premium" : i18n.language === 'en' ? "Brow Premium Package" : i18n.language === 'ua' ? "Преміум Пакет Брів" : "Премиум Пакет Бровей",
      description: i18n.language === 'pl'
        ? "Kompleksowa pielęgnacja brwi: microblading + laminacja + regulacja"
        : "Complete brow care: microblading + lamination + shaping",
      originalPrice: 1200,
      price: 890,
      discount: 26,
      sessions: 3,
      duration: "3 miesiące",
      includes: [
        i18n.language === 'pl' ? "Microblading brwi" : i18n.language === 'en' ? "Brow microblading" : i18n.language === 'ua' ? "Мікроблейдинг брів" : "Микроблейдинг бровей",
        i18n.language === 'pl' ? "Laminacja brwi" : i18n.language === 'en' ? "Brow lamination" : i18n.language === 'ua' ? "Ламінація брів" : "Ламинация бровей",
        i18n.language === 'pl' ? "Regulacja i farbowanie" : i18n.language === 'en' ? "Shaping and tinting" : i18n.language === 'ua' ? "Корекція та фарбування" : "Коррекция и окрашивание",
        i18n.language === 'pl' ? "Konsultacja po zabiegu" : i18n.language === 'en' ? "Aftercare consultation" : i18n.language === 'ua' ? "Консультація після процедури" : "Консультация после процедуры"
      ],
      popular: true,
      badge: i18n.language === 'pl' ? "Najpopularniejszy" : i18n.language === 'en' ? "Most Popular" : i18n.language === 'ua' ? "Найпопулярніший" : "Самый Популярный"
    },
    {
      id: "lips-package",
      category: "beauty",
      title: i18n.language === 'pl' ? "Pakiet Usta Idealne" : i18n.language === 'en' ? "Perfect Lips Package" : i18n.language === 'ua' ? "Пакет Ідеальні Губи" : "Пакет Идеальные Губы",
      description: i18n.language === 'pl'
        ? "Pełna regeneracja ust: PMU + peeling + nawilżanie"
        : "Complete lip regeneration: PMU + peeling + hydration",
      originalPrice: 900,
      price: 690,
      discount: 23,
      sessions: 2,
      duration: "2 miesiące",
      includes: [
        i18n.language === 'pl' ? "Permanentny makijaż ust" : i18n.language === 'en' ? "Permanent lip makeup" : i18n.language === 'ua' ? "Перманентний макіяж губ" : "Перманентный макияж губ",
        i18n.language === 'pl' ? "Głęboki peeling kwasowy" : i18n.language === 'en' ? "Deep chemical peel" : i18n.language === 'ua' ? "Глибокий пілінг" : "Глубокий пилинг",
        i18n.language === 'pl' ? "Intensywne nawilżanie" : i18n.language === 'en' ? "Intensive hydration" : i18n.language === 'ua' ? "Інтенсивне зволоження" : "Интенсивное увлажнение",
        i18n.language === 'pl' ? "Produkty do pielęgnacji domowej" : i18n.language === 'en' ? "Home care products" : i18n.language === 'ua' ? "Продукти для домашнього догляду" : "Продукты для домашнего ухода"
      ]
    },
    {
      id: "complete-makeup",
      category: "beauty",
      title: i18n.language === 'pl' ? "Pakiet Kompletny Makijaż" : i18n.language === 'en' ? "Complete Makeup Package" : i18n.language === 'ua' ? "Пакет Повний Макіяж" : "Пакет Полный Макияж",
      description: i18n.language === 'pl'
        ? "Makijaż permanentny twarzy: brwi + usta + eyeliner"
        : "Permanent makeup full face: brows + lips + eyeliner",
      originalPrice: 2000,
      price: 1590,
      discount: 20,
      sessions: 3,
      duration: "6 miesięcy",
      includes: [
        i18n.language === 'pl' ? "Microblading brwi" : i18n.language === 'en' ? "Brow microblading" : i18n.language === 'ua' ? "Мікроблейдинг брів" : "Микроблейдинг бровей",
        i18n.language === 'pl' ? "Permanentny makijaż ust" : i18n.language === 'en' ? "Permanent lip makeup" : i18n.language === 'ua' ? "Перманентний макіяж губ" : "Перманентный макияж губ",
        i18n.language === 'pl' ? "Eyeliner permanentny" : i18n.language === 'en' ? "Permanent eyeliner" : i18n.language === 'ua' ? "Перманентний айлайнер" : "Перманентный айлайнер",
        i18n.language === 'pl' ? "Konsultacje kolorystyczne" : i18n.language === 'en' ? "Color consultations" : i18n.language === 'ua' ? "Консультації з кольору" : "Консультации по цвету"
      ],
      badge: i18n.language === 'pl' ? "Najlepsza Wartość" : i18n.language === 'en' ? "Best Value" : i18n.language === 'ua' ? "Найкраща Ціна" : "Лучшая Цена"
    }
  ];

  const fitnessPackages = [
    {
      id: "glutes-transformation",
      category: "fitness",
      title: i18n.language === 'pl' ? "Transformacja Pośladów 8 Tygodni" : i18n.language === 'en' ? "Glutes Transformation 8 Weeks" : i18n.language === 'ua' ? "Трансформація Сідниць 8 Тижнів" : "Трансформация Ягодиц 8 Недель",
      description: i18n.language === 'pl'
        ? "Kompleksowy program treningowy + dietetyczny + suplementacja"
        : "Complete training + nutrition + supplementation program",
      originalPrice: 1600,
      price: 1290,
      discount: 19,
      sessions: 24,
      duration: "8 tygodni",
      includes: [
        i18n.language === 'pl' ? "24 sesje treningowe personalne" : i18n.language === 'en' ? "24 personal training sessions" : i18n.language === 'ua' ? "24 персональні тренування" : "24 персональные тренировки",
        i18n.language === 'pl' ? "Plan żywieniowy indywidualny" : i18n.language === 'en' ? "Personalized nutrition plan" : i18n.language === 'ua' ? "Індивідуальний план харчування" : "Индивидуальный план питания",
        i18n.language === 'pl' ? "Plan suplementacji" : i18n.language === 'en' ? "Supplementation plan" : i18n.language === 'ua' ? "План добавок" : "План добавок",
        i18n.language === 'pl' ? "Pomiary postępów co tydzień" : i18n.language === 'en' ? "Weekly progress measurements" : i18n.language === 'ua' ? "Щотижневі вимірювання прогресу" : "Еженедельные измерения прогресса"
      ],
      popular: true
    },
    {
      id: "full-body-package",
      category: "fitness",
      title: i18n.language === 'pl' ? "Pakiet Full Body 12 Tygodni" : i18n.language === 'en' ? "Full Body Package 12 Weeks" : i18n.language === 'ua' ? "Пакет Full Body 12 Тижнів" : "Пакет Full Body 12 Недель",
      description: i18n.language === 'pl'
        ? "Pełna transformacja ciała: trening + dieta + wsparcie"
        : "Complete body transformation: training + diet + support",
      originalPrice: 2400,
      price: 1890,
      discount: 21,
      sessions: 36,
      duration: "12 tygodni",
      includes: [
        i18n.language === 'pl' ? "36 sesji treningowych" : i18n.language === 'en' ? "36 training sessions" : i18n.language === 'ua' ? "36 тренувань" : "36 тренировок",
        i18n.language === 'pl' ? "Kompleksowy plan żywieniowy" : i18n.language === 'en' ? "Comprehensive nutrition plan" : i18n.language === 'ua' ? "Комплексний план харчування" : "Комплексный план питания",
        i18n.language === 'pl' ? "Wsparcie 24/7 przez czat" : i18n.language === 'en' ? "24/7 chat support" : i18n.language === 'ua' ? "Підтримка 24/7 в чаті" : "Поддержка 24/7 в чате",
        i18n.language === 'pl' ? "Analiza składu ciała" : i18n.language === 'en' ? "Body composition analysis" : i18n.language === 'ua' ? "Аналіз складу тіла" : "Анализ состава тела"
      ]
    },
    {
      id: "starter-fitness",
      category: "fitness",
      title: i18n.language === 'pl' ? "Pakiet Start Fitness 4 Tygodnie" : i18n.language === 'en' ? "Fitness Starter 4 Weeks" : i18n.language === 'ua' ? "Фітнес Старт 4 Тижні" : "Фитнес Старт 4 Недели",
      description: i18n.language === 'pl'
        ? "Idealny start przygody z fitness: podstawy + motywacja"
        : "Perfect fitness start: basics + motivation",
      originalPrice: 800,
      price: 590,
      discount: 26,
      sessions: 8,
      duration: "4 tygodnie",
      includes: [
        i18n.language === 'pl' ? "8 sesji treningowych" : i18n.language === 'en' ? "8 training sessions" : i18n.language === 'ua' ? "8 тренувань" : "8 тренировок",
        i18n.language === 'pl' ? "Podstawy planowania treningu" : i18n.language === 'en' ? "Training planning basics" : i18n.language === 'ua' ? "Основи планування тренувань" : "Основы планирования тренировок",
        i18n.language === 'pl' ? "Wprowadzenie do zdrowego odżywiania" : i18n.language === 'en' ? "Introduction to healthy eating" : i18n.language === 'ua' ? "Вступ до здорового харчування" : "Введение в здоровое питание",
        i18n.language === 'pl' ? "Motywacyjne wsparcie" : i18n.language === 'en' ? "Motivational support" : i18n.language === 'ua' ? "Мотиваційна підтримка" : "Мотивационная поддержка"
      ]
    }
  ];

  const combinedPackages = [
    {
      id: "beauty-fitness-luxury",
      category: "combined",
      title: i18n.language === 'pl' ? "Pakiet Lux Beauty & Fitness" : i18n.language === 'en' ? "Lux Beauty & Fitness Package" : i18n.language === 'ua' ? "Пакет Lux Beauty & Fitness" : "Пакет Lux Beauty & Fitness",
      description: i18n.language === 'pl'
        ? "Połączenie beauty i fitness: kompletna transformacja"
        : "Beauty and fitness combined: complete transformation",
      originalPrice: 3600,
      price: 2790,
      discount: 23,
      sessions: 48,
      duration: "12 tygodni",
      includes: [
        i18n.language === 'pl' ? "36 sesji treningowych personalnych" : i18n.language === 'en' ? "36 personal training sessions" : i18n.language === 'ua' ? "36 персональних тренувань" : "36 персональных тренировок",
        i18n.language === 'pl' ? "Microblading brwi" : i18n.language === 'en' ? "Brow microblading" : i18n.language === 'ua' ? "Мікроблейдинг брів" : "Микроблейдинг бровей",
        i18n.language === 'pl' ? "Plan żywieniowy + suplementacja" : i18n.language === 'en' ? "Nutrition plan + supplements" : i18n.language === 'ua' ? "План харчування + добавки" : "План питания + добавки",
        i18n.language === 'pl' ? "Zabiegi regeneracyjne co tydzień" : i18n.language === 'en' ? "Weekly regeneration treatments" : i18n.language === 'ua' ? "Щотижневі регенеруючі процедури" : "Еженедельные регенерирующие процедуры"
      ],
      popular: true,
      badge: i18n.language === 'pl' ? "Najlepszy Wybór" : i18n.language === 'en' ? "Best Choice" : i18n.language === 'ua' ? "Найкращий Вибір" : "Лучший Выбор"
    }
  ];

  const allPackages = [...beautyPackages, ...fitnessPackages, ...combinedPackages];

  const categories = [
    { id: "all", label: i18n.language === 'pl' ? "Wszystkie Pakiety" : i18n.language === 'en' ? "All Packages" : i18n.language === 'ua' ? "Всі Пакети" : "Все Пакеты" },
    { id: "beauty", label: i18n.language === 'pl' ? "Beauty" : i18n.language === 'en' ? "Beauty" : i18n.language === 'ua' ? "Beauty" : "Beauty" },
    { id: "fitness", label: i18n.language === 'pl' ? "Fitness" : i18n.language === 'en' ? "Fitness" : i18n.language === 'ua' ? "Fitness" : "Fitness" },
    { id: "combined", label: i18n.language === 'pl' ? "Kombinowane" : i18n.language === 'en' ? "Combined" : i18n.language === 'ua' ? "Комбіновані" : "Комбинированные" }
  ];

  const filteredPackages = selectedCategory === "all"
    ? allPackages
    : allPackages.filter(pkg => pkg.category === selectedCategory);

  const benefits = [
    {
      icon: Check,
      title: i18n.language === 'pl' ? "Oszczędność do 30%" : i18n.language === 'en' ? "Save up to 30%" : i18n.language === 'ua' ? "Економія до 30%" : "Экономия до 30%",
      description: i18n.language === 'pl'
        ? "Pakiety są tańsze niż pojedyncze usługi"
        : "Packages are cheaper than individual services"
    },
    {
      icon: Check,
      title: i18n.language === 'pl' ? "Kompleksowe Działanie" : i18n.language === 'en' ? "Comprehensive Approach" : i18n.language === 'ua' ? "Комплексний Підхід" : "Комплексный Подход",
      description: i18n.language === 'pl'
        ? "Pełna opieka i spójny plan działania"
        : "Complete care and consistent action plan"
    },
    {
      icon: Check,
      title: i18n.language === 'pl' ? "Elastyczne Płatności" : i18n.language === 'en' ? "Flexible Payment" : i18n.language === 'ua' ? "Гнучка Оплата" : "Гибкая Оплата",
      description: i18n.language === 'pl'
        ? "Możliwość rozłożenia płatności na raty"
        : "Option to pay in installments"
    },
    {
      icon: Check,
      title: i18n.language === 'pl' ? "Wsparcie 24/7" : i18n.language === 'en' ? "24/7 Support" : i18n.language === 'ua' ? "Підтримка 24/7" : "Поддержка 24/7",
      description: i18n.language === 'pl'
        ? "Pomoc i doradztwo przez cały czas trwania pakietu"
        : "Help and advice throughout the package duration"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Packages & Bundles — Beauty & Fitness Deals | Warsaw"
        description="Save up to 30% on beauty and fitness packages. Special offers on microblading, training programs, and combined treatments."
        keywords="packages Warsaw, beauty deals, fitness packages, microblading package, personal training package, special offers"
      />
      <Navigation />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-background via-background to-muted/10 pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="absolute inset-0 bg-gradient-to-r from-bronze/20 via-transparent to-background/30" />

        <div className="container mx-auto px-6 md:px-8 max-w-7xl relative z-10">
          <div className="max-w-4xl space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass-accent border border-champagne/20 animate-fade-rise">
              <Package className="w-4 h-4 text-champagne-200" />
              <span className="text-xs font-body tracking-[0.3em] uppercase font-light text-champagne-200">
                {i18n.language === 'pl' ? "Pakiety i Promocje" : i18n.language === 'en' ? "Packages & Deals" : i18n.language === 'ua' ? "Пакети та Акції" : "Пакеты и Акции"}
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.85] text-pearl tracking-tight font-light font-display animate-fade-rise">
              <div className="space-y-2">
                <span className="block">
                  {i18n.language === 'pl' ? "Oszczędzaj do" : i18n.language === 'en' ? "Save up to" : i18n.language === 'ua' ? "Економ до" : "Экономия до"}
                </span>
                <span className="block bg-gradient-to-r from-bronze via-champagne-200 to-champagne bg-clip-text text-transparent font-normal">
                  30%
                </span>
              </div>
            </h1>

            <div className="w-24 h-[3px] bg-gradient-to-r from-bronze via-champagne to-bronze rounded-full shadow-luxury animate-fade-rise-delay" />

            <p className="text-xl sm:text-2xl text-pearl/80 leading-relaxed font-light font-body max-w-3xl animate-fade-rise-delay">
              {i18n.language === 'pl'
                ? "Wybierz z naszych starannie przygotowanych pakietów i ciesz się kompleksową opieką w atrakcyjnej cenie."
                : i18n.language === 'en'
                ? "Choose from our carefully prepared packages and enjoy comprehensive care at an attractive price."
                : i18n.language === 'ua'
                ? "Оберіть з наших ретельно підготовлених пакетів і насолоджуйтесь комплексною турботою за привабливою ціною."
                : "Выберите из наших тщательно подготовленных пакетов и наслаждайтесь комплексной заботой по привлекательной цене."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-rise-delay">
              <Link
                to="#packages"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-brand text-brand-foreground rounded-full font-medium shadow-luxury hover:shadow-luxury-lg transition-all duration-300 hover:scale-105 group"
              >
                <span>{i18n.language === 'pl' ? "Zobacz Pakiety" : i18n.language === 'en' ? "View Packages" : i18n.language === 'ua' ? "Переглянути Пакети" : "Посмотреть Пакеты"}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/book"
                className="inline-flex items-center gap-3 px-8 py-4 glass-subtle text-pearl rounded-full font-medium border border-champagne/20 hover:bg-white/10 transition-all duration-300"
              >
                <span>{i18n.language === 'pl' ? "Umów Konsultację" : i18n.language === 'en' ? "Book Consultation" : i18n.language === 'ua' ? "Записати на Консультацію" : "Записать на Консультацию"}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 md:py-24 bg-gradient-to-b from-muted/10 to-transparent">
        <div className="container mx-auto px-6 md:px-8 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-semibold text-pearl leading-tight tracking-tight mb-4">
              {i18n.language === 'pl' ? "Dlaczego Warto Wybrać Pakiet?" : i18n.language === 'en' ? "Why Choose a Package?" : i18n.language === 'ua' ? "Чому Варто Обрати Пакет?" : "Почему Стоит Выбрать Пакет?"}
            </h2>
            <p className="text-xl text-pearl/70 font-light font-body max-w-2xl mx-auto">
              {i18n.language === 'pl'
                ? "Korzyści płynące z wyboru pakietu usług"
                : i18n.language === 'en'
                ? "Benefits of choosing a service package"
                : i18n.language === 'ua'
                ? "Переваги вибору пакету послуг"
                : "Преимущества выбора пакета услуг"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="glass-card p-6 rounded-2xl border border-champagne/20 hover:border-champagne/40 transition-all duration-300 hover:scale-105 animate-fade-rise"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full glass-accent flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-5 h-5 text-champagne-200" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-semibold text-pearl mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-pearl/70 font-body text-sm leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="py-8 md:py-12 sticky top-20 z-40 glass-card backdrop-blur-xl border-b border-champagne/20 bg-charcoal/80">
        <div className="container mx-auto px-6 md:px-8 max-w-7xl">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 border font-body ${
                  selectedCategory === category.id
                    ? "bg-gradient-brand text-brand-foreground shadow-luxury border-white/10 scale-105"
                    : "glass-subtle text-pearl/80 hover:text-pearl hover:bg-white/10 hover:border-white/20 border-white/10"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Packages Grid */}
      <section id="packages" className="py-20 md:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background to-muted/10" />

        <div className="container mx-auto px-6 md:px-8 max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredPackages.map((pkg, index) => (
              <div
                key={pkg.id}
                className={`glass-card p-8 rounded-3xl border ${
                  pkg.popular
                    ? 'border-champagne/40 bg-champagne/5 relative'
                    : 'border-champagne/20'
                } hover:border-champagne/40 transition-all duration-300 hover:scale-[1.02] animate-fade-rise`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {pkg.badge && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="px-4 py-2 bg-gradient-brand text-brand-foreground rounded-full text-sm font-medium">
                      {pkg.badge}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-accent mb-3">
                      <Package className="w-4 h-4 text-champagne-200" />
                      <span className="text-xs text-champagne-200 font-body uppercase tracking-[0.2em]">
                        {pkg.category === 'beauty' ? 'Beauty' : pkg.category === 'fitness' ? 'Fitness' : 'Combined'}
                      </span>
                    </div>
                    <h3 className="text-2xl font-display font-semibold text-pearl mb-3">
                      {pkg.title}
                    </h3>
                    <p className="text-pearl/70 font-body leading-relaxed">
                      {pkg.description}
                    </p>
                  </div>
                  {pkg.discount > 0 && (
                    <div className="text-right">
                      <div className="text-sm text-rose line-through">
                        {pkg.originalPrice} PLN
                      </div>
                      <div className="text-2xl font-bold text-champagne-200">
                        -{pkg.discount}%
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-baseline gap-3 mb-6">
                  <span className="text-4xl font-bold text-pearl">{pkg.price} PLN</span>
                  {pkg.originalPrice > pkg.price && (
                    <span className="text-lg text-pearl/60 line-through">
                      {pkg.originalPrice} PLN
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-pearl/70 font-body text-sm mb-6">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{pkg.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    <span>{pkg.sessions} {i18n.language === 'pl' ? 'sesji' : i18n.language === 'en' ? 'sessions' : i18n.language === 'ua' ? 'сесій' : 'сессий'}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  {pkg.includes.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-champagne-200 flex-shrink-0 mt-0.5" />
                      <span className="text-pearl/80 font-body text-sm">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Link
                    to="/book"
                    className="flex-1 px-6 py-3 bg-gradient-brand text-brand-foreground rounded-full font-medium shadow-luxury hover:shadow-luxury-lg transition-all duration-300 hover:scale-105 text-center"
                  >
                    {i18n.language === 'pl' ? "Kup Pakiet" : i18n.language === 'en' ? "Buy Package" : i18n.language === 'ua' ? "Купити Пакет" : "Купить Пакет"}
                  </Link>
                  <Link
                    to="/contact"
                    className="px-6 py-3 glass-subtle text-pearl rounded-full font-medium border border-champagne/20 hover:bg-white/10 transition-all duration-300 text-center"
                  >
                    {i18n.language === 'pl' ? "Info" : i18n.language === 'en' ? "Info" : i18n.language === 'ua' ? "Інфо" : "Инфо"}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {filteredPackages.length === 0 && (
            <div className="text-center py-20">
              <Package className="w-20 h-20 text-champagne-200 mx-auto mb-6" />
              <p className="text-xl text-pearl/70 font-body">
                {i18n.language === 'pl'
                  ? "Brak pakietów w tej kategorii"
                  : i18n.language === 'en'
                  ? "No packages in this category"
                  : i18n.language === 'ua'
                  ? "Немає пакетів в цій категорії"
                  : "Нет пакетов в этой категории"}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Payment Options Section */}
      <section className="py-20 md:py-24 bg-gradient-to-b from-muted/10 to-transparent">
        <div className="container mx-auto px-6 md:px-8 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-pearl leading-tight tracking-tight mb-4">
              {i18n.language === 'pl' ? "Opcje Płatności" : i18n.language === 'en' ? "Payment Options" : i18n.language === 'ua' ? "Опції Оплати" : "Варианты Оплаты"}
            </h2>
            <p className="text-xl text-pearl/70 font-body">
              {i18n.language === 'pl'
                ? "Dopasuj płatność do swoich możliwości"
                : i18n.language === 'en'
                ? "Adjust payment to your capabilities"
                : i18n.language === 'ua'
                ? "Налаштуйте оплату під свої можливості"
                : "Настройте оплату под свои возможности"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: i18n.language === 'pl' ? "Płatność Jednorazowa" : i18n.language === 'en' ? "One-time Payment" : i18n.language === 'ua' ? "Одноразова Оплата" : "Разовая Оплата",
                description: i18n.language === 'pl' ? "Zapłać z góry i zyskaj dodatkowy rabat 5%" : i18n.language === 'en' ? "Pay in advance and get an additional 5% discount" : i18n.language === 'ua' ? "Сплатіть заздалегідь і отримайте додаткову знижку 5%" : "Заплатите заранее и получите дополнительную скидку 5%",
                discount: "-5%"
              },
              {
                title: i18n.language === 'pl' ? "Płatność w 2 Ratach" : i18n.language === 'en' ? "2 Installments" : i18n.language === 'ua' ? "Оплата в 2 Частини" : "Оплата в 2 Части",
                description: i18n.language === 'pl' ? "Wygodne raty bez dodatkowych opłat" : i18n.language === 'en' ? "Convenient installments without additional fees" : i18n.language === 'ua' ? "Зручні частини без додаткових платежів" : "Удобные части без дополнительных платежей"
              },
              {
                title: i18n.language === 'pl' ? "Płatność w 4 Ratach" : i18n.language === 'en' ? "4 Installments" : i18n.language === 'ua' ? "Оплата в 4 Частини" : "Оплата в 4 Части",
                description: i18n.language === 'pl' ? "Rozłóż płatność na 4 wygodne raty" : i18n.language === 'en' ? "Spread payment over 4 convenient installments" : i18n.language === 'ua' ? "Розподіліть оплату на 4 зручні частини" : "Разделите оплату на 4 удобные части"
              }
            ].map((option, index) => (
              <div
                key={index}
                className="glass-card p-6 rounded-2xl border border-champagne/20 text-center animate-fade-rise"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {option.discount && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-accent mb-4">
                    <span className="text-sm text-champagne-200 font-semibold">{option.discount}</span>
                  </div>
                )}
                <h3 className="text-xl font-display font-semibold text-pearl mb-3">
                  {option.title}
                </h3>
                <p className="text-pearl/70 font-body text-sm">
                  {option.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <MobileFooter mode="beauty" />
    </div>
  );
};

export default Packages;