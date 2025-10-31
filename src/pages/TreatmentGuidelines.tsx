import { useTranslation } from "react-i18next";
import {
  Heart,
  Shield,
  Users,
  Sparkles,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Droplets,
  Sun,
  Coffee,
  Utensils,
  Moon,
  Activity
} from "lucide-react";

import { SEO } from "@/components/SEO";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileFooter from "@/components/MobileFooter";

const TreatmentGuidelines = () => {
  const { i18n } = useTranslation();

  const guidelines = {
    preparation: {
      title: i18n.language === 'pl' ? "Przygotowanie do Zabiegu" :
              i18n.language === 'en' ? "Preparation for Your Treatment" :
              i18n.language === 'ua' ? "Підготовка до Процедури" :
              "Подготовка к Процедуре",
      description: i18n.language === 'pl'
        ? "Odpowiednie przygotowanie zapewni najlepsze efekty i komfort zabiegu."
        : i18n.language === 'en'
        ? "Proper preparation ensures the best results and comfort for your treatment."
        : i18n.language === 'ua'
        ? "Правильна підготовка забезпечить найкращі результати та комфорт процедури."
        : "Правильная подготовка обеспечит лучшие результаты и комфорт процедуры.",
      sections: [
        {
          category: i18n.language === 'pl' ? "Przed Zabiegiem (24-48h)" :
                   i18n.language === 'en' ? "Before Treatment (24-48h)" :
                   i18n.language === 'ua' ? "Перед Процедурою (24-48г)" :
                   "Перед Процедурой (24-48ч)",
          items: [
            { icon: <AlertCircle className="w-5 h-5 text-rose-400" />, text: i18n.language === 'pl' ? "Unikaj alkoholu i kofeiny" : i18n.language === 'en' ? "Avoid alcohol and caffeine" : i18n.language === 'ua' ? "Уникайте алкоголю та кофеїну" : "Избегайте алкоголя и кофеина" },
            { icon: <Droplets className="w-5 h-5 text-blue-400" />, text: i18n.language === 'pl' ? "Pij dużo wody" : i18n.language === 'en' ? "Drink plenty of water" : i18n.language === 'ua' ? "Пийте багато води" : "Пейте много воды" },
            { icon: <Sun className="w-5 h-5 text-yellow-400" />, text: i18n.language === 'pl' ? "Unikaj słońca i solarium" : i18n.language === 'en' ? "Avoid sun and tanning beds" : i18n.language === 'ua' ? "Уникайте сонця та солярію" : "Избегайте солнца и солярия" },
            { icon: <Activity className="w-5 h-5 text-green-400" />, text: i18n.language === 'pl' ? "Odstaw intensywne ćwiczenia" : i18n.language === 'en' ? "Avoid intense workouts" : i18n.language === 'ua' ? "Припиніть інтенсивні тренування" : "Прекратите интенсивные тренировки" }
          ]
        },
        {
          category: i18n.language === 'pl' ? "W Dniu Zabiegu" :
                   i18n.language === 'en' ? "On Treatment Day" :
                   i18n.language === 'ua' ? "У День Процедури" :
                   "В День Процедуры",
          items: [
            { icon: <Coffee className="w-5 h-5 text-amber-600" />, text: i18n.language === 'pl' ? "Nie pij kawy na czczo" : i18n.language === 'en' ? "Don't drink coffee on empty stomach" : i18n.language === 'ua' ? "Не пийте каву натщесерце" : "Не пейте кофе натощак" },
            { icon: <Utensils className="w-5 h-5 text-orange-600" />, text: i18n.language === 'pl' ? "Zjedz lekkie śniadanie" : i18n.language === 'en' ? "Eat a light breakfast" : i18n.language === 'ua' ? "З'їжте легкий сніданок" : "Съешьте легкий завтрак" },
            { icon: <Clock className="w-5 h-5 text-purple-600" />, text: i18n.language === 'pl' ? "Przyjdź 10 minut wcześniej" : i18n.language === 'en' ? "Arrive 10 minutes early" : i18n.language === 'ua' ? "Прибудьте за 10 хвилин" : "Прибудьте за 10 минут" },
            { icon: <Moon className="w-5 h-5 text-indigo-600" />, text: i18n.language === 'pl' ? "Unikaj kosmetyków kolorowych" : i18n.language === 'en' ? "Avoid colored cosmetics" : i18n.language === 'ua' ? "Уникайте кольорової косметики" : "Избегайте цветной косметики" }
          ]
        }
      ]
    },
    during: {
      title: i18n.language === 'pl' ? "Podczas Zabiegu" :
              i18n.language === 'en' ? "During Your Treatment" :
              i18n.language === 'ua' ? "Під Час Процедури" :
              "Во время Процедуры",
      description: i18n.language === 'pl'
        ? "Twój komfort i bezpieczeństwo są naszym priorytetem. Zrelaksuj się i zaufaj naszemu personelowi."
        : i18n.language === 'en'
        ? "Your comfort and safety are our priority. Relax and trust our professional staff."
        : i18n.language === 'ua'
        ? "Ваш комфорт та безпека - наш пріоритет. Розслабтеся і довірте нашому професійному персоналу."
        : "Ваш комфорт и безопасность - наш приоритет. Расслабьтесь и доверьтесь нашему профессиональному персоналу.",
      sections: [
        {
          category: i18n.language === 'pl' ? "Ogólne Zasady" :
                   i18n.language === 'en' ? "General Guidelines" :
                   i18n.language === 'ua' ? "Загальні Правила" :
                   "Общие Правила",
          items: [
            { icon: <Heart className="w-5 h-5 text-champagne-200" />, text: i18n.language === 'pl' ? "Poinformuj o alergiach i wrażliwościach" : i18n.language === 'en' ? "Inform about allergies and sensitivities" : i18n.language === 'ua' ? "Повідомте про алергії та чутливість" : "Сообщите об аллергиях и чувствительности" },
            { icon: <Shield className="w-5 h-5 text-champagne-200" />, text: i18n.language === 'pl' ? "Przestrzegaj higieny osobistej" : i18n.language === 'en' ? "Maintain personal hygiene" : i18n.language === 'ua' ? "Дотримуйтесь особистої гігієни" : "Соблюдайте личную гигиену" },
            { icon: <Users className="w-5 h-5 text-champagne-200" />, text: i18n.language === 'pl' ? "Komunikuj potrzeby z personelem" : i18n.language === 'en' ? "Communicate your needs to the staff" : i18n.language === 'ua' ? "Спілкуйтеся про свої потреби з персоналом" : "Сообщите персоналу о своих потребностях" },
            { icon: <Sparkles className="w-5 h-5 text-champagne-200" />, text: i18n.language === 'pl' ? "Wyłącz telefon i zrelaksuj się" : i18n.language === 'en' ? "Turn off your phone and relax" : i18n.language === 'ua' ? "Вимкніть телефон і розслабтеся" : "Выключите телефон и расслабьтесь" }
          ]
        }
      ]
    },
    aftercare: {
      title: i18n.language === 'pl' ? "Pielęgnacja Po Zabiegu" :
              i18n.language === 'en' ? "Aftercare Instructions" :
              i18n.language === 'ua' ? "Догляд Після Процедури" :
              "Уход После Процедуры",
      description: i18n.language === 'pl'
        ? "Prawidłowa pielęgnacja po zabiegu jest kluczowa dla uzyskania najlepszych rezultatów."
        : i18n.language === 'en'
        ? "Proper aftercare is crucial for achieving the best results."
        : i18n.language === 'ua'
        ? "Правильний догляд після процедури є ключовим для досягнення найкращих результатів."
        : "Правильный уход после процедуры является ключевым для достижения лучших результатов.",
      sections: [
        {
          category: i18n.language === 'pl' ? "Pierwsze 48 Godzin" :
                   i18n.language === 'en' ? "First 48 Hours" :
                   i18n.language === 'ua' ? "Перші 48 Годин" :
                   "Первые 48 Часов",
          items: [
            { icon: <Droplets className="w-5 h-5 text-blue-400" />, text: i18n.language === 'pl' ? "Unikaj wody na obszarze zabiegowym" : i18n.language === 'en' ? "Keep the treated area dry" : i18n.language === 'ua' ? "Уникайте води на обробленій ділянці" : "Избегайте воды на обработанной области" },
            { icon: <Sun className="w-5 h-5 text-yellow-400" />, text: i18n.language === 'pl' ? "Chroń przed słońcem" : i18n.language === 'en' ? "Protect from sun exposure" : i18n.language === 'ua' ? "Захищайте від сонця" : "Защищайте от солнца" },
            { icon: <Activity className="w-5 h-5 text-green-400" />, text: i18n.language === 'pl' ? "Unikaj sauny i sportu" : i18n.language === 'en' ? "Avoid sauna and exercise" : i18n.language === 'ua' ? "Уникайте сауни та спорту" : "Избегайте сауны и спорта" },
            { icon: <AlertCircle className="w-5 h-5 text-rose-400" />, text: i18n.language === 'pl' ? "Nie drap i nie dotykaj" : i18n.language === 'en' ? "Don't scratch or touch" : i18n.language === 'ua' ? "Не розчісуйте і не торкайтеся" : "Не чешите и не трогайте" }
          ]
        },
        {
          category: i18n.language === 'pl' ? "Pierwszy Tydzień" :
                   i18n.language === 'en' ? "First Week" :
                   i18n.language === 'ua' ? "Перший Тиждень" :
                   "Первая Неделя",
          items: [
            { icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />, text: i18n.language === 'pl' ? "Stosuj zalecone kosmetyki" : i18n.language === 'en' ? "Use recommended products" : i18n.language === 'ua' ? "Використовуйте рекомендовані засоби" : "Используйте рекомендованные средства" },
            { icon: <Heart className="w-5 h-5 text-rose-600" />, text: i18n.language === 'pl' ? "Delikatna pielęgnacja" : i18n.language === 'en' ? "Gentle care routine" : i18n.language === 'ua' ? "Дбайливий догляд" : "Бережный уход" },
            { icon: <Calendar className="w-5 h-5 text-blue-600" />, text: i18n.language === 'pl' ? "Nie anuluj wizyt kontrolnych" : i18n.language === 'en' ? "Don't skip follow-up appointments" : i18n.language === 'ua' ? "Не пропускайте контрольні візити" : "Не пропускайте контрольные визиты" }
          ]
        }
      ]
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={i18n.language === 'pl' ? "Wytyczne Zabiegów | mariiaborysevych" :
              i18n.language === 'en' ? "Treatment Guidelines | mariiaborysevych" :
              i18n.language === 'ua' ? "Вказівки по Процедурах | mariiaborysevych" :
              "Рекомендации по Процедурам | mariiaborysevych"}
        description={i18n.language === 'pl' ?
              "Kompleksowe wytyczne dotyczące przygotowania, przebiegu i pielęgnacji po zabiegach" :
              i18n.language === 'en' ?
              "Comprehensive guidelines for treatment preparation, procedure, and aftercare" :
              i18n.language === 'ua' ?
              "Комплексні вказівки щодо підготовки, проведення та догляду після процедур" :
              "Комплексные рекомендации по подготовке, проведению и уходу после процедур"}
        keywords="treatment guidelines, preparation, aftercare, beauty, fitness"
      />
      <Navigation />

      {/* Header */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-16">
        <div className="container mx-auto px-6 md:px-8 max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold text-pearl leading-tight tracking-tight mb-6">
            {i18n.language === 'pl' ? "Wytyczne Zabiegów" :
             i18n.language === 'en' ? "Treatment Guidelines" :
             i18n.language === 'ua' ? "Вказівки по Процедурах" :
             "Рекомендации по Процедурам"}
          </h1>
          <p className="text-xl text-pearl/80 font-body">
            {i18n.language === 'pl'
              ? "Jak przygotować się do zabiegu i dbać o efekty po jego zakończeniu"
              : i18n.language === 'en'
              ? "How to prepare for your treatment and care for results afterward"
              : i18n.language === 'ua'
              ? "Як підготуватися до процедури та доглядати за результатами після її завершення"
              : "Как подготовиться к процедуре и ухаживать за результатами после ее завершения"}
          </p>
        </div>
      </section>

      {/* Guidelines Sections */}
      <div className="pb-20">
        {Object.entries(guidelines).map(([key, section]) => (
          <section key={key} className="pb-20">
            <div className="container mx-auto px-6 md:px-8 max-w-5xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-display font-semibold text-pearl mb-4">
                  {section.title}
                </h2>
                <p className="text-xl text-pearl/80 font-body max-w-3xl mx-auto">
                  {section.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {section.sections.map((subsection, idx) => (
                  <div key={idx} className="glass-card p-8 rounded-3xl border border-champagne/20">
                    <h3 className="text-xl font-display font-semibold text-pearl mb-6 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full glass-accent flex items-center justify-center">
                        <span className="text-sm font-bold text-champagne-200">{idx + 1}</span>
                      </div>
                      {subsection.category}
                    </h3>
                    <ul className="space-y-4">
                      {subsection.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {item.icon}
                          </div>
                          <span className="text-pearl/90 font-body">{item.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Emergency Section */}
      <section className="pb-20">
        <div className="container mx-auto px-6 md:px-8 max-w-4xl">
          <div className="glass-card p-8 rounded-3xl border border-rose/20 bg-rose/5">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-rose-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-2xl font-display font-semibold text-pearl mb-4">
                  {i18n.language === 'pl'
                    ? "Kiedy Skontaktować się z Nami"
                    : i18n.language === 'en'
                    ? "When to Contact Us"
                    : i18n.language === 'ua'
                    ? "Коли Зв'язатися з Нами"
                    : "Когда Связаться с Нами"}
                </h3>
                <ul className="space-y-2 text-pearl/80 font-body mb-6">
                  <li>• {i18n.language === 'pl'
                    ? "Silny ból lub obrzęk utrzymujący się powyżej 24 godzin"
                    : i18n.language === 'en'
                    ? "Severe pain or swelling lasting more than 24 hours"
                    : i18n.language === 'ua'
                    ? "Сильний біль або набряк, що триває понад 24 години"
                    : "Сильная боль или отек, длящиеся более 24 часов"}</li>
                  <li>• {i18n.language === 'pl'
                    ? "Objawy infekcji (gorączka, ropa, zaczerwienienie)"
                    : i18n.language === 'en'
                    ? "Signs of infection (fever, pus, excessive redness)"
                    : i18n.language === 'ua'
                    ? "Симптоми інфекції (гарячка, гній, почервоніння)"
                    : "Признаки инфекции (температура, гной, сильное покраснение)"}</li>
                  <li>• {i18n.language === 'pl'
                    ? "Reakcje alergiczne (wysypka, świąd, trudności w oddychaniu)"
                    : i18n.language === 'en'
                    ? "Allergic reactions (rash, itching, difficulty breathing)"
                    : i18n.language === 'ua'
                    ? "Алергічні реакції (висип, свербіж, утруднене дихання)"
                    : "Аллергические реакции (сыпь, зуд, затрудненное дыхание)"}</li>
                </ul>
                <div className="text-center">
                  <p className="text-lg font-display text-pearl mb-4">
                    {i18n.language === 'pl'
                      ? "W razie wątpliwości zawsze skontaktuj się z nami!"
                      : i18n.language === 'en'
                      ? "When in doubt, always contact us!"
                      : i18n.language === 'ua'
                      ? "У разі сумнівів завжди зв'яжіться з нами!"
                      : "В случае сомнений всегда свяжитесь с нами!"}
                  </p>
                  <a
                    href="tel:+48123456789"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-brand text-brand-foreground rounded-full font-medium shadow-luxury hover:shadow-luxury-lg transition-all duration-300 hover:scale-105"
                  >
                    <AlertCircle className="w-5 h-5" />
                    <span>{i18n.language === 'pl' ? "Zadzwoń Teraz" :
                           i18n.language === 'en' ? "Call Now" :
                           i18n.language === 'ua' ? "Подзвоніть Зараз" :
                           "Позвоните Немедленно"}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <MobileFooter mode="beauty" />
    </div>
  );
};

export default TreatmentGuidelines;