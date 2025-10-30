import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Building2, Users, Calendar, Gift, Camera, Sparkles, Check, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";

import { SEO } from "@/components/SEO";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileFooter from "@/components/MobileFooter";
import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";


const BusinessServices = () => {
  const { i18n } = useTranslation();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();
  const [formData, setFormData] = useState({
    company: "",
    name: "",
    email: "",
    phone: "",
    service: "",
    employees: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast aria-live="polite" aria-atomic="true"({
      title: "Form Submitted",
      description: "We'll contact you within 24 hours",
    });
    setFormData({
      company: "",
      name: "",
      email: "",
      phone: "",
      service: "",
      employees: "",
      message: ""
    });
  };

  const businessServices = [
    {
      id: "corporate-wellness",
      title: i18n.language === 'pl' ? "Programy Wellness dla Firm" : "Corporate Wellness Programs",
      description: i18n.language === 'pl'
        ? "Kompleksowe pakiety wellness dla pracowników, w tym konsultacje beauty i fitness"
        : "Comprehensive wellness packages for employees, including beauty and fitness consultations",
      icon: Users,
      features: [
        i18n.language === 'pl' ? "Indywidualne konsultacje" : "Individual consultations",
        i18n.language === 'pl' ? "Grupowe warsztaty" : "Group workshops",
        i18n.language === 'pl' ? "Pakiety wellnessowe" : "Wellness packages",
        i18n.language === 'pl' ? "Elastyczne opcje" : "Flexible options"
      ],
      popular: true
    },
    {
      id: "team-building",
      title: i18n.language === 'pl' ? "Wydarzenia Team Building" : "Team Building Events",
      description: i18n.language === 'pl'
        ? "Organizacja wyjątkowych wydarzeń team building z elementami beauty i fitness"
        : "Organization of unique team building events with beauty and fitness elements",
      icon: Calendar,
      features: [
        i18n.language === 'pl' ? "Spersonalizowane programy" : "Customized programs",
        i18n.language === 'pl' ? "Profesjonalni instruktorzy" : "Professional instructors",
        i18n.language === 'pl' ? "Wszystkie potrzebne materiały" : "All necessary materials",
        i18n.language === 'pl' ? "Catering opcjonalny" : "Optional catering"
      ]
    },
    {
      id: "corporate-gifts",
      title: i18n.language === 'pl' ? "Vouchery Podarunkowe dla Firm" : "Corporate Gift Vouchers",
      description: i18n.language === 'pl'
        ? "Eleganckie vouchery podarunkowe dla pracowników i partnerów biznesowych"
        : "Elegant gift vouchers for employees and business partners",
      icon: Gift,
      features: [
        i18n.language === 'pl' ? "Personalizowane vouchery" : "Personalized vouchers",
        i18n.language === 'pl' ? "Różne wartości" : "Various values",
        i18n.language === 'pl' ? "Eleganckie opakowanie" : "Elegant packaging",
        i18n.language === 'pl' ? "Ważność 12 miesięcy" : "12-month validity"
      ]
    },
    {
      id: "photo-shoots",
      title: i18n.language === 'pl' ? "Sesje Zdjęciowe dla Firm" : "Corporate Photo Shoots",
      description: i18n.language === 'pl'
        ? "Profesjonalne sesje zdjęciowe dla pracowników i kadry zarządzającej"
        : "Professional photo shoots for employees and management",
      icon: Camera,
      features: [
        i18n.language === 'pl' ? "Profesjonalny fotograf" : "Professional photographer",
        i18n.language === 'pl' ? "Makijaż i stylizacja" : "Makeup and styling",
        i18n.language === 'pl' ? "Retusz zdjęć" : "Photo retouching",
        i18n.language === 'pl' ? "Szybka realizacja" : "Fast delivery"
      ]
    }
  ];

  const benefits = [
    {
      title: i18n.language === 'pl' ? "Zwiększenie Motywacji" : "Increased Motivation",
      description: i18n.language === 'pl'
        ? "Programy wellness zwiększają zaangażowanie i motywację pracowników"
        : "Wellness programs increase employee engagement and motivation"
    },
    {
      title: i18n.language === 'pl' ? "Redukcja Stresu" : "Stress Reduction",
      description: i18n.language === 'pl'
        ? "Zabiegi relaksacyjne pomagają w redukcji stresu i poprawie samopoczucia"
        : "Relaxation treatments help reduce stress and improve well-being"
    },
    {
      title: i18n.language === 'pl' ? "Budowanie Relacji" : "Relationship Building",
      description: i18n.language === 'pl'
        ? "Wspólne wydarzenia wzmacniają relacje w zespole"
        : "Shared events strengthen team relationships"
    },
    {
      title: i18n.language === 'pl' ? "Wizerunek Firmy" : "Company Image",
      description: i18n.language === 'pl'
        ? "Inwestycja w pracowników poprawia wizerunek pracodawcy"
        : "Investing in employees improves employer image"
    }
  ];

  const testimonials = [
    {
      company: "Tech Corp Warsaw",
      quote: i18n.language === 'pl'
        ? "Program wellnessowy znacząco poprawił atmosferę w naszym zespole. Pracownicy są bardziej zrelaksowani i zmotywowani."
        : "The wellness program significantly improved the atmosphere in our team. Employees are more relaxed and motivated.",
      author: "Anna Kowalska, HR Manager"
    },
    {
      company: "Digital Agency Pro",
      quote: i18n.language === 'pl'
        ? "Sesje zdjęciowe dla naszego zespołu były profesjonalnie zorganizowane. Jesteśmy bardzo zadowoleni z efektów!"
        : "The photo shoots for our team were professionally organized. We are very happy with the results!",
      author: "Piotr Nowak, CEO"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Business Services — Corporate Wellness & Team Building | Warsaw"
        description="Professional B2B services including corporate wellness programs, team building events, and corporate gift vouchers"
        keywords="corporate wellness Warsaw, team building, B2B services, corporate gifts, employee benefits"
      />
      <Navigation />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-background via-background to-muted/10 pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="absolute inset-0 bg-gradient-to-r from-bronze/20 via-transparent to-background/30" />

        <div className="container mx-auto px-6 md:px-8 max-w-7xl relative z-10">
          <div className="max-w-4xl space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass-accent border border-champagne/20 animate-fade-rise">
              <Building2 className="w-4 h-4 text-champagne-200" />
              <span className="text-xs font-body tracking-[0.3em] uppercase font-light text-champagne-200">
                {i18n.language === 'pl' ? "Usługi dla firm" : i18n.language === 'en' ? "Business Services" : i18n.language === 'ua' ? "Бізнес Послуги" : "Бизнес Услуги"}
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.85] text-pearl tracking-tight font-light font-display animate-fade-rise">
              <div className="space-y-2">
                <span className="block">
                  {i18n.language === 'pl' ? "Partner" : i18n.language === 'en' ? "Business" : i18n.language === 'ua' ? "Бізнес" : "Бизнес"}
                </span>
                <span className="block bg-gradient-to-r from-bronze via-champagne-200 to-champagne bg-clip-text text-transparent font-normal">
                  {i18n.language === 'pl' ? "Biznesowy" : i18n.language === 'en' ? "Partnership" : i18n.language === 'ua' ? "Партнерство" : "Партнерство"}
                </span>
              </div>
            </h1>

            <div className="w-24 h-[3px] bg-gradient-to-r from-bronze via-champagne to-bronze rounded-full shadow-luxury animate-fade-rise-delay" />

            <p className="text-xl sm:text-2xl text-pearl/80 leading-relaxed font-light font-body max-w-3xl animate-fade-rise-delay">
              {i18n.language === 'pl'
                ? "Kompleksowe usługi dla firm, które inwestują w dobrostan i rozwój swoich pracowników, budując silną i zmotywowaną drużynę."
                : i18n.language === 'en'
                ? "Comprehensive services for companies that invest in the well-being and development of their employees, building a strong and motivated team."
                : i18n.language === 'ua'
                ? "Комплексні послуги для компаній, які інвестують у добробут та розвиток своїх співробітників, створюючи сильну та мотивовану команду."
                : "Комплексные услуги для компаний, которые инвестируют в благополучие и развитие своих сотрудников, создавая сильную и мотивированную команду."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-rise-delay">
              <Link
                to="#contact"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-brand text-brand-foreground rounded-full font-medium shadow-luxury hover:shadow-luxury-lg transition-all duration-300 hover:scale-105 group"
              >
                <span>{i18n.language === 'pl' ? "Skontaktuj się" : i18n.language === 'en' ? "Contact Us" : i18n.language === 'ua' ? "Зв'язатись" : "Связаться"}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="#services"
                className="inline-flex items-center gap-3 px-8 py-4 glass-subtle text-pearl rounded-full font-medium border border-champagne/20 hover:bg-white/10 transition-all duration-300"
              >
                <span>{i18n.language === 'pl' ? "Nasze Usługi" : i18n.language === 'en' ? "Our Services" : i18n.language === 'ua' ? "Наші Послуги" : "Наши Услуги"}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 md:py-32 relative">
        <div className="container mx-auto px-6 md:px-8 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-semibold text-pearl leading-tight tracking-tight mb-4">
              {i18n.language === 'pl' ? "Usługi dla Firm" : i18n.language === 'en' ? "Business Services" : i18n.language === 'ua' ? "Бізнес Послуги" : "Бизнес Услуги"}
            </h2>
            <p className="text-xl text-pearl/70 font-light font-body max-w-2xl mx-auto">
              {i18n.language === 'pl'
                ? "Skrojone na miarę rozwiązania dla Twojej firmy"
                : i18n.language === 'en'
                ? "Tailored solutions for your company"
                : i18n.language === 'ua'
                ? "Індивідуальні рішення для Вашої компанії"
                : "Индивидуальные решения для Вашей компании"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {businessServices.map((service, index) => (
              <div
                key={service.id}
                className={`glass-card p-8 rounded-3xl border ${
                  service.popular
                    ? 'border-champagne/40 bg-champagne/5'
                    : 'border-champagne/20'
                } hover:border-champagne/40 transition-all duration-300 hover:scale-[1.02] animate-fade-rise relative`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {service.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="px-4 py-2 bg-gradient-brand text-brand-foreground rounded-full text-sm font-medium">
                      {i18n.language === 'pl' ? "Najpopularniejsze" : i18n.language === 'en' ? "Most Popular" : i18n.language === 'ua' ? "Найпопулярніше" : "Самое Популярное"}
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4 mb-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full glass-accent">
                    <service.icon className="w-7 h-7 text-champagne-200" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-display font-semibold text-pearl mb-3">
                      {service.title}
                    </h3>
                    <p className="text-pearl/70 font-body leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {service.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-champagne-200 flex-shrink-0" />
                      <span className="text-pearl/80 font-body">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-champagne/20">
                  <Link
                    to="#contact"
                    className="inline-flex items-center gap-2 text-champagne-200 hover:text-champagne-100 font-medium transition-colors"
                  >
                    <span>{i18n.language === 'pl' ? "Dowiedz się więcej" : i18n.language === 'en' ? "Learn more" : i18n.language === 'ua' ? "Дізнатись більше" : "Узнать больше"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 md:py-24 bg-gradient-to-b from-muted/10 to-transparent">
        <div className="container mx-auto px-6 md:px-8 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-semibold text-pearl leading-tight tracking-tight mb-4">
              {i18n.language === 'pl' ? "Korzyści dla Twojej Firmy" : i18n.language === 'en' ? "Benefits for Your Company" : i18n.language === 'ua' ? "Переваги для Вашої Компанії" : "Преимущества для Вашей Компании"}
            </h2>
            <p className="text-xl text-pearl/70 font-light font-body max-w-2xl mx-auto">
              {i18n.language === 'pl'
                ? "Inwestycja w pracowników to inwestycja w sukces firmy"
                : i18n.language === 'en'
                ? "Investing in employees is investing in company success"
                : i18n.language === 'ua'
                ? "Інвестиції в співробітників - це інвестиції в успіх компанії"
                : "Инвестиции в сотрудников - это инвестиции в успех компании"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="text-center space-y-4 animate-fade-rise"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full glass-accent">
                  <Sparkles className="w-8 h-8 text-champagne-200" />
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

      {/* Testimonials Section */}
      <section className="py-20 md:py-24 relative">
        <div className="container mx-auto px-6 md:px-8 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-pearl leading-tight tracking-tight mb-4">
              {i18n.language === 'pl' ? "Opinie Klientów Biznesowych" : i18n.language === 'en' ? "Business Client Reviews" : i18n.language === 'ua' ? "Відгуки Бізнес Клієнтів" : "Отзывы Бизнес Клиентов"}
            </h2>
          </div>

          <div className="space-y-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="glass-card p-8 rounded-3xl border border-champagne/20 animate-fade-rise"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <p className="text-lg text-pearl/80 font-body italic mb-6">
                  "{testimonial.quote}"
                </p>
                <div>
                  <div className="font-semibold text-pearl">{testimonial.author}</div>
                  <div className="text-champagne-200 text-sm">{testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="py-20 md:py-32 bg-gradient-to-r from-bronze/10 via-champagne/10 to-bronze/10">
        <div className="container mx-auto px-6 md:px-8 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-pearl leading-tight tracking-tight mb-4">
              {i18n.language === 'pl' ? "Skontaktuj się z Nami" : i18n.language === 'en' ? "Contact Us" : i18n.language === 'ua' ? "Зв'яжіться з Нами" : "Свяжитесь с Нами"}
            </h2>
            <p className="text-xl text-pearl/80 font-body">
              {i18n.language === 'pl'
                ? "Skontaktuj się z nami, aby omówić potrzeby Twojej firmy"
                : i18n.language === 'en'
                ? "Contact us to discuss your company's needs"
                : i18n.language === 'ua'
                ? "Зв'яжіться з нами, щоб обговорити потреби Вашої компанії"
                : "Свяжитесь с нами, чтобы обсудить потребы Вашей компании"}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-display font-semibold text-pearl mb-6">
                  {i18n.language === 'pl' ? "Informacje Kontaktowe" : i18n.language === 'en' ? "Contact Information" : i18n.language === 'ua' ? "Контактна Інформація" : "Контактная Информация"}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full glass-accent flex items-center justify-center">
                      <Mail className="w-6 h-6 text-champagne-200" />
                    </div>
                    <div>
                      <div className="text-champagne-200 text-sm">{i18n.language === 'pl' ? "Email" : i18n.language === 'en' ? "Email" : i18n.language === 'ua' ? "Email" : "Email"}</div>
                      <div className="text-pearl font-body">business@mariia-hub.pl</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full glass-accent flex items-center justify-center">
                      <Phone className="w-6 h-6 text-champagne-200" />
                    </div>
                    <div>
                      <div className="text-champagne-200 text-sm">{i18n.language === 'pl' ? "Telefon" : i18n.language === 'en' ? "Phone" : i18n.language === 'ua' ? "Телефон" : "Телефон"}</div>
                      <div className="text-pearl font-body">+48 123 456 789</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-display font-semibold text-pearl mb-3">
                  {i18n.language === 'pl' ? "Godziny Pracy" : i18n.language === 'en' ? "Business Hours" : i18n.language === 'ua' ? "Години Роботи" : "Время Работы"}
                </h4>
                <div className="text-pearl/70 font-body space-y-1">
                  <div>{i18n.language === 'pl' ? "Poniedziałek - Piątek: 9:00 - 18:00" : i18n.language === 'en' ? "Monday - Friday: 9:00 AM - 6:00 PM" : i18n.language === 'ua' ? "Понеділок - П'ятниця: 9:00 - 18:00" : "Понедельник - Пятница: 9:00 - 18:00"}</div>
                  <div>{i18n.language === 'pl' ? "Weekendy: Po uzgodnieniu" : i18n.language === 'en' ? "Weekends: By appointment" : i18n.language === 'ua' ? "Вихідні: За домовленістю" : "Выходные: По договоренности"}</div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="company" className="block text-pearl font-body mb-2">
                    {i18n.language === 'pl' ? "Firma" : i18n.language === 'en' ? "Company" : i18n.language === 'ua' ? "Компанія" : "Компания"} *
                  </label>
                  <input
                    id="company"
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl glass-subtle border border-champagne/20 text-pearl placeholder:text-pearl/40 focus:outline-none focus:border-champagne/60 focus:ring-2 focus:ring-champagne/20"
                    placeholder={i18n.language === 'pl' ? "Nazwa firmy" : i18n.language === 'en' ? "Company name" : i18n.language === 'ua' ? "Назва компанії" : "Название компании"}
                  />
                </div>
                <div>
                  <label htmlFor="name" className="block text-pearl font-body mb-2">
                    {i18n.language === 'pl' ? "Imię i Nazwisko" : i18n.language === 'en' ? "Full Name" : i18n.language === 'ua' ? "Повне Ім'я" : "Полное Имя"} *
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl glass-subtle border border-champagne/20 text-pearl placeholder:text-pearl/40 focus:outline-none focus:border-champagne/60 focus:ring-2 focus:ring-champagne/20"
                    placeholder={i18n.language === 'pl' ? "Jan Kowalski" : i18n.language === 'en' ? "John Smith" : i18n.language === 'ua' ? "Іван Петренко" : "Иван Петренко"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-pearl font-body mb-2">
                    {i18n.language === 'pl' ? "Email" : i18n.language === 'en' ? "Email" : i18n.language === 'ua' ? "Email" : "Email"} *
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl glass-subtle border border-champagne/20 text-pearl placeholder:text-pearl/40 focus:outline-none focus:border-champagne/60 focus:ring-2 focus:ring-champagne/20"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-pearl font-body mb-2">
                    {i18n.language === 'pl' ? "Telefon" : i18n.language === 'en' ? "Phone" : i18n.language === 'ua' ? "Телефон" : "Телефон"}
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl glass-subtle border border-champagne/20 text-pearl placeholder:text-pearl/40 focus:outline-none focus:border-champagne/60 focus:ring-2 focus:ring-champagne/20"
                    placeholder="+48 123 456 789"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="service" className="block text-pearl font-body mb-2">
                    {i18n.language === 'pl' ? "Usługa" : i18n.language === 'en' ? "Service" : i18n.language === 'ua' ? "Послуга" : "Услуга"} *
                  </label>
                  <select
                    id="service"
                    required
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl glass-subtle border border-champagne/20 text-pearl focus:outline-none focus:border-champagne/60 focus:ring-2 focus:ring-champagne/20 cursor-pointer"
                  >
                    <option value="">{i18n.language === 'pl' ? "Wybierz usługę" : i18n.language === 'en' ? "Select service" : i18n.language === 'ua' ? "Оберіть послугу" : "Выберите услугу"}</option>
                    {businessServices.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="employees" className="block text-pearl font-body mb-2">
                    {i18n.language === 'pl' ? "Liczba Pracowników" : i18n.language === 'en' ? "Number of Employees" : i18n.language === 'ua' ? "Кількість Співробітників" : "Количество Сотрудников"}
                  </label>
                  <input
                    id="employees"
                    type="number"
                    value={formData.employees}
                    onChange={(e) => setFormData({ ...formData, employees: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl glass-subtle border border-champagne/20 text-pearl placeholder:text-pearl/40 focus:outline-none focus:border-champagne/60 focus:ring-2 focus:ring-champagne/20"
                    placeholder={i18n.language === 'pl' ? "np. 50" : i18n.language === 'en' ? "e.g., 50" : i18n.language === 'ua' ? "напр. 50" : "напр. 50"}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-pearl font-body mb-2">
                  {i18n.language === 'pl' ? "Wiadomość" : i18n.language === 'en' ? "Message" : i18n.language === 'ua' ? "Повідомлення" : "Сообщение"}
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl glass-subtle border border-champagne/20 text-pearl placeholder:text-pearl/40 focus:outline-none focus:border-champagne/60 focus:ring-2 focus:ring-champagne/20 resize-none"
                  placeholder={i18n.language === 'pl' ? "Opisz swoje potrzeby..." : i18n.language === 'en' ? "Describe your needs..." : i18n.language === 'ua' ? "Опишіть свої потреби..." : "Опишите ваши потребы..."}
                />
              </div>

              <button
                type="submit"
                className="w-full px-8 py-4 bg-gradient-brand text-brand-foreground rounded-full font-medium shadow-luxury hover:shadow-luxury-lg transition-all duration-300 hover:scale-105 text-lg"
              >
                {i18n.language === 'pl' ? "Wyślij Wiadomość" : i18n.language === 'en' ? "Send Message" : i18n.language === 'ua' ? "Надіслати Повідомлення" : "Отправить Сообщение"}
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
      <MobileFooter mode="beauty" />
    </div>
  );
};

export default BusinessServices;