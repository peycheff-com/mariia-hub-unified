import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, Search, MessageCircle, Mail, Phone } from "lucide-react";

import { SEO } from "@/components/SEO";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileFooter from "@/components/MobileFooter";

const FAQ = () => {
  const { i18n } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const toggleItem = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id)
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const expandAll = () => {
    setExpandedItems(faqData.map(item => item.id));
  };

  const collapseAll = () => {
    setExpandedItems([]);
  };

  const faqData = [
    // Beauty FAQs
    {
      id: "microblading-duration",
      category: "beauty",
      question: i18n.language === 'pl' ? "Jak długo utrzymuje się efekt microbladingu?" : i18n.language === 'en' ? "How long does microblading last?" : i18n.language === 'ua' ? "Як довго триває ефект мікроблейдингу?" : "Как долго держится эффект микроблейдинга?",
      answer: i18n.language === 'pl'
        ? "Efekt microbladingu utrzymuje się zazwyczaj 12-18 miesięcy. Zalecamy wizytę uzupełniającą po 6-8 tygodniach dla idealnego rezultatu."
        : i18n.language === 'en'
        ? "Microblading typically lasts 12-18 months. We recommend a touch-up visit after 6-8 weeks for perfect results."
        : i18n.language === 'ua'
        ? "Ефект мікроблейдингу зазвичай триває 12-18 місяців. Рекомендуємо візит для доповнення через 6-8 тижнів для ідеального результату."
        : "Эффект микроблейдинга обычно держится 12-18 месяцев. Рекомендуем визит для пополнения через 6-8 недель для идеального результата."
    },
    {
      id: "pmu-painful",
      category: "beauty",
      question: i18n.language === 'pl' ? "Czy zabiegi PMU są bolesne?" : i18n.language === 'en' ? "Are PMU treatments painful?" : i18n.language === 'ua' ? "Чи болячі процедури PMU?" : "Болезненны ли процедуры PMU?",
      answer: i18n.language === 'pl'
        ? "Przed zabiegiem stosujemy znieczulenie w kremie, które minimalizuje dyskomfort. Większość klientów opisuje uczucie jako delikatne drapanie."
        : i18n.language === 'en'
        ? "We apply numbing cream before the treatment to minimize discomfort. Most clients describe the sensation as gentle scratching."
        : i18n.language === 'ua'
        ? "Перед процедурою ми застосовуємо знеболювальний крем, який мінімізує дискомфорт. Більшість клієнтів описують відчуття як легке подряпування."
        : "Перед процедурой мы применяем обезболивающий крем, который минимизирует дискомфорт. Большинство клиентов описывают ощущение как легкое расчесывание."
    },
    {
      id: "treatment-preparation",
      category: "beauty",
      question: i18n.language === 'pl' ? "Jak przygotować się do zabiegu?" : i18n.language === 'en' ? "How to prepare for the treatment?" : i18n.language === 'ua' ? "Як підготуватись до процедури?" : "Как подготовиться к процедуре?",
      answer: i18n.language === 'pl'
        ? "Unikaj alkoholu i kofeiny przez 24 godziny przed zabiegiem. Nie stosuj aspiryny i innych leków rozrzedzających krew przez 3 dni przed zabiegiem."
        : i18n.language === 'en'
        ? "Avoid alcohol and caffeine for 24 hours before the treatment. Do not take aspirin or other blood thinners for 3 days before the treatment."
        : i18n.language === 'ua'
        ? "Уникайте алкоголю та кофеїну за 24 години до процедури. Не приймайте аспірин та інші препарати, що розріджують кров, протягом 3 днів до процедури."
        : "Избегайте алкоголя и кофеина за 24 часа до процедуры. Не принимайте аспирин и другие разжижающие кровь препараты за 3 дня до процедуры."
    },

    // Fitness FAQs
    {
      id: "training-frequency",
      category: "fitness",
      question: i18n.language === 'pl' ? "Jak często powinienem trenować?" : i18n.language === 'en' ? "How often should I train?" : i18n.language === 'ua' ? "Як часто я повинен тренуватись?" : "Как часто мне следует тренироваться?",
      answer: i18n.language === 'pl'
        ? "Częstotliwość treningów zależy od Twoich celów i poziomu zaawansowania. Zazwyczaj rekomendujemy 3-4 treningi tygodniowo dla optymalnych wyników."
        : i18n.language === 'en'
        ? "Training frequency depends on your goals and fitness level. We usually recommend 3-4 workouts per week for optimal results."
        : i18n.language === 'ua'
        ? "Частота тренувань залежить від Ваших цілей та рівня підготовки. Зазвичай ми рекомендуємо 3-4 тренування на тиждень для оптимальних результатів."
        : "Частота тренировок зависит от ваших целей и уровня подготовки. Обычно мы рекомендуем 3-4 тренировки в неделю для оптимальных результатов."
    },
    {
      id: "nutrition-plan",
      category: "fitness",
      question: i18n.language === 'pl' ? "Czy otrzymam plan żywieniowy?" : i18n.language === 'en' ? "Will I receive a nutrition plan?" : i18n.language === 'ua' ? "Чи отримаю я план харчування?" : "Получу ли я план питания?",
      answer: i18n.language === 'pl'
        ? "Tak, każdy klient otrzymuje spersonalizowany plan żywieniowy dostosowany do jego celów i preferencji."
        : i18n.language === 'en'
        ? "Yes, each client receives a personalized nutrition plan tailored to their goals and preferences."
        : i18n.language === 'ua'
        ? "Так, кожен клієнт отримує персоналізований план харчування, адаптований до його цілей та переваг."
        : "Да, каждый клиент получает персонализированный план питания, адаптированный под его цели и предпочтения."
    },

    // Booking FAQs
    {
      id: "cancel-reschedule",
      category: "booking",
      question: i18n.language === 'pl' ? "Jak mogę odwołać lub przełożyć wizytę?" : i18n.language === 'en' ? "How can I cancel or reschedule my appointment?" : i18n.language === 'ua' ? "Як я можу скасувати або перенести візит?" : "Как я могу отменить или перенести визит?",
      answer: i18n.language === 'pl'
        ? "Możesz anulować lub przełożyć wizytę do 24 godzin przed zaplanowanym czasem przez panel klienta lub kontaktując się z nami bezpośrednio. Późne anulacje mogą wiązać się z opłatą."
        : i18n.language === 'en'
        ? "You can cancel or reschedule up to 24 hours before the scheduled time through your client panel or by contacting us directly. Late cancellations may incur a fee."
        : i18n.language === 'ua'
        ? "Ви можете скасувати або перенести візит до 24 годин перед запланованим часом через клієнтський панель або зв'язавшись з нами безпосередньо. Пізніші скасування можуть бути обкладені платою."
        : "Вы можете отменить или перенести визит за 24 часа до запланированного времени через клиентскую панель или связавшись с нами напрямую. Поздние отмены могут быть обложены комиссией."
    },
    {
      id: "payment-methods",
      category: "booking",
      question: i18n.language === 'pl' ? "Jakie formy płatności akceptujecie?" : i18n.language === 'en' ? "What payment methods do you accept?" : i18n.language === 'ua' ? "Які форми оплати ви приймаєте?" : "Какие способы оплаты вы принимаете?",
      answer: i18n.language === 'pl'
        ? "Akceptujemy płatności gotówką, kartą, przelewem bankowym oraz przez Stripe (online). Przy zakupie pakietów oferujemy również płatności ratalne."
        : i18n.language === 'en'
        ? "We accept cash, card, bank transfer and Stripe (online) payments. For package purchases, we also offer installment payments."
        : i18n.language === 'ua'
        ? "Ми приймаємо оплату готівкою, карткою, банківським переказом та через Stripe (онлайн). При купівлі пакетів ми також пропонуємо оплату частинами."
        : "Мы принимаем оплату наличными, картой, банковским переводом и через Stripe (онлайн). При покупке пакетов мы также предлагаем оплату в рассрочку."
    },

    // General FAQs
    {
      id: "salon-location",
      category: "general",
      question: i18n.language === 'pl' ? "Gdzie znajduje się salon?" : i18n.language === 'en' ? "Where is the salon located?" : i18n.language === 'ua' ? "Де знаходиться салон?" : "Где находится салон?",
      answer: i18n.language === 'pl'
        ? "Nasz salon znajduje się w centrum Warszawy przy ulicy Przykładowa 123. Najbliższa stacja metra to Centrum."
        : i18n.language === 'en'
        ? "Our salon is located in the center of Warsaw at Example Street 123. The nearest metro station is Centrum."
        : i18n.language === 'ua'
        ? "Наш салон знаходиться в центрі Варшави за адресою вулиця Прикладна 123. Найближча станція метро - Центр."
        : "Наш салон находится в центре Варшавы по адресу Примерная улица 123. Ближайшая станция метро - Центр."
    },
    {
      id: "gift-packages",
      category: "general",
      question: i18n.language === 'pl' ? "Czy oferujecie pakiety prezentowe?" : i18n.language === 'en' ? "Do you offer gift packages?" : i18n.language === 'ua' ? "Чи пропонуєте ви подарункові пакети?" : "Предлагаете ли вы подарочные пакеты?",
      answer: i18n.language === 'pl'
        ? "Tak, oferujemy eleganckie vouchery prezentowe na wszystkie nasze usługi. Można je zakupić online lub bezpośrednio w salonie."
        : i18n.language === 'en'
        ? "Yes, we offer elegant gift vouchers for all our services. They can be purchased online or directly at the salon."
        : i18n.language === 'ua'
        ? "Так, ми пропонуємо елегантні подарункові ваучери на всі наші послуги. Їх можна придбати онлайн або безпосередньо в салоні."
        : "Да, мы предлагаем элегантные подарочные ваучеры на все наши услуги. Их можно приобрести онлайн или непосредственно в салоне."
    }
  ];

  const categories = [
    { id: "all", label: i18n.language === 'pl' ? "Wszystkie" : i18n.language === 'en' ? "All" : i18n.language === 'ua' ? "Всі" : "Все" },
    { id: "beauty", label: i18n.language === 'pl' ? "Beauty" : i18n.language === 'en' ? "Beauty" : i18n.language === 'ua' ? "Beauty" : "Beauty" },
    { id: "fitness", label: i18n.language === 'pl' ? "Fitness" : i18n.language === 'en' ? "Fitness" : i18n.language === 'ua' ? "Fitness" : "Fitness" },
    { id: "booking", label: i18n.language === 'pl' ? "Rezerwacja" : i18n.language === 'en' ? "Booking" : i18n.language === 'ua' ? "Бронювання" : "Бронирование" },
    { id: "general", label: i18n.language === 'pl' ? "Ogólne" : i18n.language === 'en' ? "General" : i18n.language === 'ua' ? "Загальні" : "Общие" }
  ];

  const filteredFAQs = faqData.filter(item => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="FAQ — Frequently Asked Questions | mariiaborysevych"
        description="Find answers to common questions about our beauty and fitness services, booking, and policies."
        keywords="FAQ, questions, answers, beauty, fitness, booking, policies"
      />
      <Navigation />

      {/* Header - Standardized */}
      <section className="hero-compact pt-32">
        <div className="container-narrow">
          <h1 className="text-hero">
            {i18n.language === 'pl' ? "Najczęstsze Pytania" : i18n.language === 'en' ? "Frequently Asked Questions" : i18n.language === 'ua' ? "Найчастіші Питання" : "Часто Задаваемые Вопросы"}
          </h1>
          <p className="text-description text-high-contrast">
            {i18n.language === 'pl'
              ? "Znajdź odpowiedzi na najczęściej zadawane pytania o nasze usługi"
              : i18n.language === 'en'
              ? "Find answers to the most common questions about our services"
              : i18n.language === 'ua'
              ? "Знайдіть відповіді на найпоширеніші питання про наші послуги"
              : "Найдите ответы на самые частые вопросы о наших услугах"}
          </p>
        </div>
      </section>

      {/* Search - Standardized */}
      <section className="section-compact">
        <div className="container-narrow">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pearl/60" aria-hidden="true" />
            <input
              type="text"
              aria-label={i18n.language === 'pl' ? "Szukaj pytań" : i18n.language === 'en' ? "Search questions" : i18n.language === 'ua' ? "Пошук питань" : "Поиск вопросов"}
              placeholder={i18n.language === 'pl' ? "Szukaj pytań..." : i18n.language === 'en' ? "Search questions..." : i18n.language === 'ua' ? "Пошук питань..." : "Поиск вопросов..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 glass-subtle border border-champagne/20 rounded-full text-pearl placeholder:text-pearl/60 focus:outline-none focus:ring-2 focus:ring-champagne/50 focus:border-champagne/40 transition-all duration-300"
            />
          </div>
        </div>
      </section>

      {/* Categories - Standardized */}
      <section className="section-compact">
        <div className="container-narrow">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  selectedCategory === category.id
                    ? "bg-gradient-brand text-brand-foreground shadow-luxury"
                    : "glass-subtle text-pearl/80 hover:text-pearl border border-champagne/20 hover:border-champagne/40"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Items - Standardized */}
      <section className="section-spacious">
        <div className="container-narrow">
          <div className="flex justify-between items-center mb-8">
            <p className="text-muted-foreground font-body">
              {i18n.language === 'pl'
                ? `${filteredFAQs.length} znalezionych pytań`
                : i18n.language === 'en'
                ? `${filteredFAQs.length} questions found`
                : i18n.language === 'ua'
                ? `${filteredFAQs.length} знайдених питань`
                : `${filteredFAQs.length} найденных вопросов`}
            </p>
            <div className="flex gap-4">
              <button
                onClick={expandAll}
                className="text-medium-contrast hover:text-high-contrast font-body text-sm transition-colors"
              >
                {i18n.language === 'pl' ? "Rozwiń wszystkie" : i18n.language === 'en' ? "Expand all" : i18n.language === 'ua' ? "Розгорнути всі" : "Развернуть все"}
              </button>
              <button
                onClick={collapseAll}
                className="text-medium-contrast hover:text-high-contrast font-body text-sm transition-colors"
              >
                {i18n.language === 'pl' ? "Zwiń wszystkie" : i18n.language === 'en' ? "Collapse all" : i18n.language === 'ua' ? "Згорнути всі" : "Свернуть все"}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredFAQs.map((item) => (
              <div
                key={item.id}
                className="glass-card rounded-2xl border border-champagne/20 overflow-hidden transition-all duration-300 hover:border-champagne/40"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={expandedItems.includes(item.id)}
                  aria-controls={`faq-answer-${item.id}`}
                  className="w-full px-6 py-5 flex justify-between items-center text-left hover:bg-white/5 transition-colors"
                >
                  <h3 className="text-lg font-display font-medium text-pearl pr-4">
                    {item.question}
                  </h3>
                  <div className="flex-shrink-0">
                    {expandedItems.includes(item.id) ? (
                      <ChevronUp className="w-5 h-5 text-champagne-200" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-champagne-200" />
                    )}
                  </div>
                </button>
                {expandedItems.includes(item.id) && (
                  <div
                    id={`faq-answer-${item.id}`}
                    className="px-6 pb-5"
                  >
                    <div className="h-px bg-gradient-to-r from-transparent via-champagne/30 to-transparent mb-4" />
                    <p className="text-pearl/80 font-body leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredFAQs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-pearl/60 font-body text-lg">
                {i18n.language === 'pl'
                  ? "Nie znaleziono pytań pasujących do Twojego wyszukiwania"
                  : i18n.language === 'en'
                  ? "No questions found matching your search"
                  : i18n.language === 'ua'
                  ? "Не знайдено питань, що відповідають вашому пошуку"
                  : "Вопросов, соответствующих вашему поиску, не найдено"}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-gradient-to-r from-rose/10 via-champagne/10 to-bronze/10">
        <div className="container mx-auto px-6 md:px-8 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-pearl mb-4">
            {i18n.language === 'pl'
              ? "Nie znalazłeś odpowiedzi?"
              : i18n.language === 'en'
              ? "Didn't find the answer?"
              : i18n.language === 'ua'
              ? "Не знайшли відповідь?"
              : "Не нашли ответ?"}
          </h2>
          <p className="text-xl text-pearl/80 font-body mb-8">
            {i18n.language === 'pl'
              ? "Skontaktuj się z nami, a chętnie odpowiemy na wszystkie Twoje pytania"
              : i18n.language === 'en'
              ? "Contact us and we'll be happy to answer all your questions"
              : i18n.language === 'ua'
              ? "Зв'яжіться з нами, і ми з радістю відповімо на всі ваші питання"
              : "Свяжитесь с нами, и мы с радостью ответим на все ваши вопросы"}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:info@mariia-hub.pl"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-brand text-brand-foreground rounded-full font-medium shadow-luxury hover:shadow-luxury-lg transition-all duration-300 hover:scale-105 group"
            >
              <Mail className="w-5 h-5" />
              <span>{i18n.language === 'pl' ? "Wyślij Email" : i18n.language === 'en' ? "Send Email" : i18n.language === 'ua' ? "Надіслати Email" : "Отправить Email"}</span>
            </a>
            <a
              href="tel:+48123456789"
              className="inline-flex items-center gap-3 px-8 py-4 glass-subtle text-pearl rounded-full font-medium border border-champagne/20 hover:bg-white/10 transition-all duration-300"
            >
              <Phone className="w-5 h-5" />
              <span>{i18n.language === 'pl' ? "Zadzwoń" : i18n.language === 'en' ? "Call" : i18n.language === 'ua' ? "Подзвонити" : "Позвонить"}</span>
            </a>
          </div>
        </div>
      </section>

      <Footer />
      <MobileFooter mode="beauty" />
    </div>
  );
};

export default FAQ;