import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  Wrench,
  Shield,
  Zap,
  Mail,
  Phone,
  Calendar
} from "lucide-react";

import { SEO } from "@/components/SEO";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileFooter from "@/components/MobileFooter";

const Maintenance = () => {
  const { i18n } = useTranslation();

  const maintenanceInfo = [
    {
      icon: <Wrench className="w-6 h-6 text-champagne-200" />,
      title: i18n.language === 'pl' ? "Aktualizacja Systemu" :
             i18n.language === 'en' ? "System Upgrade" :
             i18n.language === 'ua' ? "Оновлення Системи" :
             "Обновление Системы",
      description: i18n.language === 'pl'
        ? "Wdrażamy nowe funkcje i ulepszenia dla lepszej obsługi."
        : i18n.language === 'en'
        ? "Implementing new features and improvements for better service."
        : i18n.language === 'ua'
        ? "Впроваджуємо нові функції та покращення для кращого обслуговування."
        : "Внедряем новые функции и улучшения для лучшего обслуживания."
    },
    {
      icon: <Zap className="w-6 h-6 text-champagne-200" />,
      title: i18n.language === 'pl' ? "Optymalizacja Wydajności" :
             i18n.language === 'en' ? "Performance Optimization" :
             i18n.language === 'ua' ? "Оптимізація Продуктивності" :
             "Оптимизация Производительности",
      description: i18n.language === 'pl'
        ? "Poprawiamy wydajność i niezawodność naszych usług online."
        : i18n.language === 'en'
        ? "Improving the performance and reliability of our online services."
        : i18n.language === 'ua'
        ? "Покращуємо продуктивність та надійність наших онлайн послуг."
        : "Улучшаем производительность и надежность наших онлайн-услуг."
    },
    {
      icon: <Shield className="w-6 h-6 text-champagne-200" />,
      title: i18n.language === 'pl' ? "Bezpieczeństwo" :
             i18n.language === 'en' ? "Security" :
             i18n.language === 'ua' ? "Безпека" :
             "Безопасность",
      description: i18n.language === 'pl'
        ? "Wzmacniamy zabezpieczenia dla ochrony Twoich danych."
        : i18n.language === 'en'
        ? "Strengthening security measures to protect your data."
        : i18n.language === 'ua'
        ? "Зміцнюємо заходи безпеки для захисту ваших даних."
        : "Усиливаем меры безопасности для защиты ваших данных."
    }
  ];

  const timeline = [
    {
      time: i18n.language === 'pl' ? "Faza 1: Przygotowanie" :
            i18n.language === 'en' ? "Phase 1: Preparation" :
            i18n.language === 'ua' ? "Фаза 1: Підготовка" :
            "Фаза 1: Подготовка",
      status: "completed",
      duration: i18n.language === 'pl' ? "2 godziny" :
               i18n.language === 'en' ? "2 hours" :
               i18n.language === 'ua' ? "2 години" :
               "2 часа"
    },
    {
      time: i18n.language === 'pl' ? "Faza 2: Implementacja" :
            i18n.language === 'en' ? "Phase 2: Implementation" :
            i18n.language === 'ua' ? "Фаза 2: Впровадження" :
            "Фаза 2: Внедрение",
      status: "current",
      duration: i18n.language === 'pl' ? "3 godziny" :
               i18n.language === 'en' ? "3 hours" :
               i18n.language === 'ua' ? "3 години" :
               "3 часа"
    },
    {
      time: i18n.language === 'pl' ? "Faza 3: Testowanie" :
            i18n.language === 'en' ? "Phase 3: Testing" :
            i18n.language === 'ua' ? "Фаза 3: Тестування" :
            "Фаза 3: Тестирование",
      status: "pending",
      duration: i18n.language === 'pl' ? "1 godzina" :
               i18n.language === 'en' ? "1 hour" :
               i18n.language === 'ua' ? "1 година" :
               "1 час"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'current':
        return <Clock className="w-5 h-5 text-yellow-400 animate-pulse" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-champagne/30" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={i18n.language === 'pl' ? "Konserwacja - Przerwa Techniczna | Mariia Hub" :
              i18n.language === 'en' ? "Maintenance - Technical Break | Mariia Hub" :
              i18n.language === 'ua' ? "Обслуговування - Технічна Перерва | Mariia Hub" :
              "Обслуживание - Технический Перерыв | Mariia Hub"}
        description={i18n.language === 'pl' ?
              "Chwilowa przerwa techniczna. Wrócimy wkrótce z ulepszoną wersją serwisu." :
              i18n.language === 'en' ?
              "Temporary technical break. We'll be back soon with an improved version of our service." :
              i18n.language === 'ua' ?
              "Тимчасова технічна перерва. Ми повернемось незабаром з покращеною версією сервісу." :
              "Временный технический перерыв. Мы вернемся вскоре с улучшенной версией сервиса."}
        keywords="maintenance, technical break, update, improvement"
      />
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background z-10" />

        <div className="container mx-auto px-6 md:px-8 max-w-4xl text-center relative z-20">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass-accent border border-champagne/20 mb-6">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-body tracking-[0.3em] uppercase font-light text-amber-200">
              {i18n.language === 'pl' ? "PRZERWA TECHNICZNA" :
               i18n.language === 'en' ? "TECHNICAL BREAK" :
               i18n.language === 'ua' ? "ТЕХНІЧНА ПЕРЕРВА" :
               "ТЕХНИЧЕСКИЙ ПЕРЕРЫВ"}
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl leading-tight font-display font-bold text-pearl mb-6">
            <span className="block">
              {i18n.language === 'pl' ? "Trwa" :
               i18n.language === 'en' ? "We're Under" :
               i18n.language === 'ua' ? "Триває" :
               "Идет"}
            </span>
            <span className="block bg-gradient-to-r from-rose via-champagne-200 to-champagne bg-clip-text text-transparent">
              {i18n.language === 'pl' ? "Konserwacji" :
               i18n.language === 'en' ? "Maintenance" :
               i18n.language === 'ua' ? "Обслуговування" :
               "Обслуживание"}
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-pearl/80 font-body max-w-2xl mx-auto mb-8">
            {i18n.language === 'pl'
              ? "Pracujemy nad ulepszeniami naszej strony internetowej, aby zapewnić Ci najlepsze doświadczenia."
              : i18n.language === 'en'
              ? "We're working on improving our website to provide you with the best experience."
              : i18n.language === 'ua'
              ? "Ми працюємо над покращенням нашого веб-сайту, щоб забезпечити вам найкращий досвід."
              : "Мы работаем над улучшением нашего веб-сайта, чтобы предоставить вам лучший опыт."}
          </p>

          {/* Progress indicator */}
          <div className="w-full max-w-md mx-auto mb-12">
            <div className="h-2 bg-champagne/20 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-brand rounded-full animate-pulse" style={{ width: '70%' }} />
            </div>
            <p className="text-sm text-pearl/60 font-body mt-2">
              {i18n.language === 'pl' ? "Szacowany czas pozostały: 1 godzina" :
               i18n.language === 'en' ? "Estimated time remaining: 1 hour" :
               i18n.language === 'ua' ? "Розрахунковий час, що залишився: 1 година" :
               "Расчетное оставшееся время: 1 час"}
            </p>
          </div>
        </div>
      </section>

      {/* Maintenance Info */}
      <section className="pb-20">
        <div className="container mx-auto px-6 md:px-8 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {maintenanceInfo.map((item, idx) => (
              <div key={idx} className="glass-card p-6 rounded-3xl border border-champagne/20 text-center">
                <div className="w-16 h-16 rounded-full glass-accent flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="text-xl font-display font-semibold text-pearl mb-3">
                  {item.title}
                </h3>
                <p className="text-pearl/80 font-body">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="glass-card p-8 rounded-3xl border border-champagne/20">
            <h2 className="text-2xl md:text-3xl font-display font-semibold text-pearl mb-8 text-center">
              {i18n.language === 'pl' ? "Harmonogram Prac" :
               i18n.language === 'en' ? "Work Timeline" :
               i18n.language === 'ua' ? "Графік Робіт" :
               "График Работ"}
            </h2>
            <div className="space-y-6">
              {timeline.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {getStatusIcon(item.status)}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-display font-medium text-pearl">
                        {item.time}
                      </h3>
                      <span className="text-sm text-pearl/60 font-body">
                        {item.duration}
                      </span>
                    </div>
                    {item.status === 'current' && (
                      <div className="h-1 bg-champagne/20 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-brand rounded-full animate-pulse" style={{ width: '60%' }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Notification Signup */}
      <section className="pb-20">
        <div className="container mx-auto px-6 md:px-8 max-w-4xl">
          <div className="glass-card p-8 rounded-3xl border border-champagne/20 text-center">
            <Calendar className="w-12 h-12 text-champagne-200 mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-display font-semibold text-pearl mb-4">
              {i18n.language === 'pl'
                ? "Powiadom mnie o Zakończeniu"
                : i18n.language === 'en'
                ? "Notify Me When Complete"
                : i18n.language === 'ua'
                ? "Повідомте мене про Завершення"
                : "Уведомить меня о Завершении"}
            </h2>
            <p className="text-pearl/80 font-body mb-6">
              {i18n.language === 'pl'
                ? "Wpisz swój email, a powiadomimy Cię, gdy serwis będzie znowu dostępny."
                : i18n.language === 'en'
                ? "Enter your email and we'll notify you when the service is available again."
                : i18n.language === 'ua'
                ? "Введіть свою email адресу, і ми повідомимо вас, коли сервіс буде знову доступний."
                : "Введите ваш email, и мы уведомим вас, когда сервис снова будет доступен."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <input
                type="email"
                placeholder={i18n.language === 'pl' ? "Twój adres email" :
                           i18n.language === 'en' ? "Your email address" :
                           i18n.language === 'ua' ? "Ваша email адреса" :
                           "Ваш email адрес"}
                className="flex-grow px-4 py-3 rounded-full bg-white/10 border border-champagne/20 text-pearl placeholder:text-pearl/50 focus:outline-none focus:border-champagne/40 transition-colors"
              />
              <button className="px-8 py-3 bg-gradient-brand text-brand-foreground rounded-full font-medium shadow-luxury hover:shadow-luxury-lg transition-all duration-300 hover:scale-105 whitespace-nowrap">
                {i18n.language === 'pl' ? "Powiadom mnie" :
                 i18n.language === 'en' ? "Notify Me" :
                 i18n.language === 'ua' ? "Повідомити" :
                 "Уведомить"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-20 bg-gradient-to-r from-rose/10 via-champagne/10 to-bronze/10">
        <div className="container mx-auto px-6 md:px-8 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-pearl mb-4">
            {i18n.language === 'pl'
              ? "Potrzebujesz Pilnej Pomocy?"
              : i18n.language === 'en'
              ? "Need Urgent Assistance?"
              : i18n.language === 'ua'
              ? "Потрібна Термінова Допомога?"
              : "Нужна Срочная Помощь?"}
          </h2>
          <p className="text-xl text-pearl/80 font-body mb-8">
            {i18n.language === 'pl'
              ? "Nasz zespół jest dostępny w sprawach pilnych."
              : i18n.language === 'en'
              ? "Our team is available for urgent matters."
              : i18n.language === 'ua'
              ? "Наша команда доступна для термінових справ."
              : "Наша команда доступна для срочных вопросов."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:+48123456789"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-brand text-brand-foreground rounded-full font-medium shadow-luxury hover:shadow-luxury-lg transition-all duration-300 hover:scale-105"
            >
              <Phone className="w-5 h-5" />
              <span>{i18n.language === 'pl' ? "Zadzwoń Teraz" :
                     i18n.language === 'en' ? "Call Now" :
                     i18n.language === 'ua' ? "Подзвоніть Зараз" :
                     "Позвоните Немедленно"}</span>
            </a>
            <a
              href="mailto:support@mariia-hub.pl"
              className="inline-flex items-center gap-3 px-8 py-4 glass-subtle text-pearl rounded-full font-medium border border-champagne/20 hover:bg-white/10 transition-all duration-300"
            >
              <Mail className="w-5 h-5" />
              <span>{i18n.language === 'pl' ? "Wyślij Email" :
                     i18n.language === 'en' ? "Send Email" :
                     i18n.language === 'ua' ? "Надішліть Email" :
                     "Отправить Email"}</span>
            </a>
          </div>
        </div>
      </section>

      <Footer />
      <MobileFooter mode="beauty" />
    </div>
  );
};

export default Maintenance;