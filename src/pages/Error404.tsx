import { useTranslation } from "react-i18next";
import { ArrowLeft, Home, Search, Mail, Phone, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { SEO } from "@/components/SEO";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileFooter from "@/components/MobileFooter";
import { Button } from "@/components/ui/button";

const Error404 = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Page Not Found — 404 Error | mariiaborysevych"
        description="The page you're looking for doesn't exist. Check our services or return to the homepage."
        keywords="404, page not found, error, lost page"
      />
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background z-10" />

        <div className="container mx-auto px-6 md:px-8 max-w-4xl text-center relative z-20">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass-accent border border-champagne/20 mb-6">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-body tracking-[0.3em] uppercase font-light text-rose-200">
              404
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl leading-tight font-display font-bold text-pearl mb-6">
            <span className="block">
              {i18n.language === 'pl' ? "Strona Nie Została" :
               i18n.language === 'en' ? "Page Not Found" :
               i18n.language === 'ua' ? "Сторінку Не Знайдено" :
               "Страница Не Найдена"}
            </span>
            <span className="block bg-gradient-to-r from-rose via-champagne-200 to-champagne bg-clip-text text-transparent">
              {i18n.language === 'pl' ? "Znaleziona" :
               i18n.language === 'en' ? "Found" :
               i18n.language === 'ua' ? "Знайдено" :
               "Найдена"}
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-pearl/70 font-body max-w-2xl mx-auto mb-12">
            {i18n.language === 'pl'
              ? "Przepraszamy - strona, której szukasz, prawdopodobnie nie istnieje lub została przeniesiona."
              : i18n.language === 'en'
              ? "We're sorry - the page you're looking for probably doesn't exist or has been moved."
              : i18n.language === 'ua'
              ? "Вибачте - сторінка, яку ви шукаєте, ймовірно, не існує або була переміщена."
              : "Извините - страница, которую вы ищете, вероятно, не существует или была перемещена."}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-3 px-8 py-4 glass-subtle text-pearl rounded-full font-medium border border-champagne/20 hover:bg-white/10 transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{i18n.language === 'pl' ? "Wróć" :
                     i18n.language === 'en' ? "Go Back" :
                     i18n.language === 'ua' ? "Повернутися" :
                     "Вернуться"}</span>
            </Button>
            <Button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-brand text-brand-foreground rounded-full font-medium shadow-luxury hover:shadow-luxury-lg transition-all duration-300 hover:scale-105"
            >
              <Home className="w-5 h-5" />
              <span>{i18n.language === 'pl' ? "Strona Główna" :
                     i18n.language === 'en' ? "Homepage" :
                     i18n.language === 'ua' ? "Головна Сторінка" :
                     "Главная Страница"}</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Search Suggestions */}
      <section className="pb-20">
        <div className="container mx-auto px-6 md:px-8 max-w-4xl">
          <div className="glass-card p-8 rounded-3xl border border-champagne/20">
            <div className="text-center mb-8">
              <Search className="w-12 h-12 text-champagne-200 mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-display font-semibold text-pearl mb-4">
                {i18n.language === 'pl'
                  ? "Może Cię Zainteresować:"
                  : i18n.language === 'en'
                  ? "You Might Be Interested In:"
                  : i18n.language === 'ua'
                  ? "Вас Може Зацікавити:"
                  : "Вас Может Заинтересовать:"}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-display font-medium text-pearl mb-3">
                  {i18n.language === 'pl' ? "Usługi Beauty" :
                   i18n.language === 'en' ? "Beauty Services" :
                   i18n.language === 'ua' ? "Послуги Beauty" :
                   "Услуги Beauty"}
                </h3>
                <ul className="space-y-2">
                  <a href="/beauty/brows" className="block p-3 glass-subtle rounded-xl border border-champagne/20 hover:border-champagne/40 hover:bg-white/5 transition-all duration-300 text-pearl/90 hover:text-pearl">
                    {i18n.language === 'pl' ? "• Stylizacja Brwi" :
                     i18n.language === 'en' ? "• Brow Styling" :
                     i18n.language === 'ua' ? "• Стилізація Брів" :
                     "• Стилизация Бровей"}
                  </a>
                  <a href="/beauty/makeup" className="block p-3 glass-subtle rounded-xl border border-champagne/20 hover:border-champagne/40 hover:bg-white/5 transition-all duration-300 text-pearl/90 hover:text-pearl">
                    {i18n.language === 'pl' ? "• Makijaż Permanentny" :
                     i18n.language === 'en' ? "• Permanent Makeup" :
                     i18n.language === 'ua' ? "• Перманентний Макіяж" :
                     "• Перманентный Макияж"}
                  </a>
                  <a href="/beauty/services" className="block p-3 glass-subtle rounded-xl border border-champagne/20 hover:border-champagne/40 hover:bg-white/5 transition-all duration-300 text-pearl/90 hover:text-pearl">
                    {i18n.language === 'pl' ? "• Wszystkie Usługi" :
                     i18n.language === 'en' ? "• All Services" :
                     i18n.language === 'ua' ? "• Усі Послуги" :
                     "• Все Услуги"}
                  </a>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-display font-medium text-pearl mb-3">
                  {i18n.language === 'pl' ? "Programy Fitness" :
                   i18n.language === 'en' ? "Fitness Programs" :
                   i18n.language === 'ua' ? "Фітнес Програми" :
                   "Фитнес Программы"}
                </h3>
                <ul className="space-y-2">
                  <a href="/fitness/glutes" className="block p-3 glass-subtle rounded-xl border border-champagne/20 hover:border-champagne/40 hover:bg-white/5 transition-all duration-300 text-pearl/90 hover:text-pearl">
                    {i18n.language === 'pl' ? "• Trening Pośladków" :
                     i18n.language === 'en' ? "• Glute Training" :
                     i18n.language === 'ua' ? "• Тренін Сідниць" :
                     "• Тренир Ягодиц"}
                  </a>
                  <a href="/fitness/programs" className="block p-3 glass-subtle rounded-xl border border-champagne/20 hover:border-champagne/40 hover:bg-white/5 transition-all duration-300 text-pearl/90 hover:text-pearl">
                    {i18n.language === 'pl' ? "• Wszystkie Programy" :
                     i18n.language === 'en' ? "• All Programs" :
                     i18n.language === 'ua' ? "• Усі Програми" :
                     "• Все Программы"}
                  </a>
                  <a href="/book" className="block p-3 glass-subtle rounded-xl border border-champagne/20 hover:border-champagne/40 hover:bg-white/5 transition-all duration-300 text-pearl/90 hover:text-pearl">
                    {i18n.language === 'pl' ? "• Zarezerwuj Wizytę" :
                     i18n.language === 'en' ? "• Book Appointment" :
                     i18n.language === 'ua' ? "• Забронювати Візит" :
                     "• Забронировать Визит"}
                  </a>
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-8 border-t border-champagne/20">
              <div className="space-y-4">
                <h3 className="text-lg font-display font-medium text-pearl mb-3">
                  {i18n.language === 'pl' ? "Informacje" :
                   i18n.language === 'en' ? "Information" :
                   i18n.language === 'ua' ? "Інформація" :
                   "Информация"}
                </h3>
                <ul className="space-y-2">
                  <a href="/about" className="block p-3 glass-subtle rounded-xl border border-champagne/20 hover:border-champagne/40 hover:bg-white/5 transition-all duration-300 text-pearl/90 hover:text-pearl">
                    {i18n.language === 'pl' ? "• O Nas" :
                     i18n.language === 'en' ? "• About Us" :
                     i18n.language === 'ua' ? "• Про Нас" :
                     "• О Нас"}
                  </a>
                  <a href="/faq" className="block p-3 glass-subtle rounded-xl border border-champagne/20 hover:border-champagne/40 hover:bg-white/5 transition-all duration-300 text-pearl/90 hover:text-pearl">
                    {i18n.language === 'pl' ? "• FAQ" :
                     i18n.language === 'en' ? "• FAQ" :
                     i18n.language === 'ua' ? "• FAQ" :
                     "• FAQ"}
                  </a>
                  <a href="/contact" className="block p-3 glass-subtle rounded-xl border border-champagne/20 hover:border-champagne/40 hover:bg-white/5 transition-all duration-300 text-pearl/90 hover:text-pearl">
                    {i18n.language === 'pl' ? "• Kontakt" :
                     i18n.language === 'en' ? "• Contact" :
                     i18n.language === 'ua' ? "• Контакт" :
                     "• Контакт"}
                  </a>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-display font-medium text-pearl mb-3">
                  {i18n.language === 'pl' ? "Oferty Specjalne" :
                   i18n.language === 'en' ? "Special Offers" :
                   i18n.language === 'ua' ? "Спеціальні Пропозиції" :
                   "Специальные Предложения"}
                </h3>
                <ul className="space-y-2">
                  <a href="/packages" className="block p-3 glass-subtle rounded-xl border border-champagne/20 hover:border-champagne/40 hover:bg-white/5 transition-all duration-300 text-pearl/90 hover:text-pearl">
                    {i18n.language === 'pl' ? "• Pakiety Usług" :
                     i18n.language === 'en' ? "• Service Packages" :
                     i18n.language === 'ua' ? "• Пакети Послуг" :
                     "• Пакеты Услуг"}
                  </a>
                  <a href="/gift-cards" className="block p-3 glass-subtle rounded-xl border border-champagne/20 hover:border-champagne/40 hover:bg-white/5 transition-all duration-300 text-pearl/90 hover:text-pearl">
                    {i18n.language === 'pl' ? "• Karty Prezentowe" :
                     i18n.language === 'en' ? "• Gift Cards" :
                     i18n.language === 'ua' ? "• Подарункові Картки" :
                     "• Подарочные Карты"}
                  </a>
                  <a href="/business" className="block p-3 glass-subtle rounded-xl border border-champagne/20 hover:border-champagne/40 hover:bg-white/5 transition-all duration-300 text-pearl/90 hover:text-pearl">
                    {i18n.language === 'pl' ? "• Usługi B2B" :
                     i18n.language === 'en' ? "• B2B Services" :
                     i18n.language === 'ua' ? "• B2B Послуги" :
                     "• B2B Услуги"}
                  </a>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-20 bg-gradient-to-r from-rose/10 via-champagne/10 to-bronze/10">
        <div className="container mx-auto px-6 md:px-8 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-pearl mb-4">
            {i18n.language === 'pl'
              ? "Potrzebujesz Pomocy?"
              : i18n.language === 'en'
              ? "Need Help?"
              : i18n.language === 'ua'
              ? "Потрібна Допомога?"
              : "Нужна Помощ?"}
          </h2>
          <p className="text-xl text-pearl/80 font-body mb-8">
            {i18n.language === 'pl'
              ? "Nasz zespół obsługi klienta jest gotowy pomóc Ci znaleźć to, czego szukasz"
              : i18n.language === 'en'
              ? "Our customer service team is ready to help you find what you're looking for"
              : i18n.language === 'ua'
              ? "Наша команда обслуговування клієнтів готова допомогти вам знайти те, що ви шукаєте"
              : "Наша команда обслуживания клиентов готова помочь вам найти то, что вы ищете"}
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
              href="mailto:info@mariia-hub.pl"
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

export default Error404;