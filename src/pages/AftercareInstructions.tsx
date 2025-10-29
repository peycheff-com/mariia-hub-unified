import { useTranslation } from "react-i18next";
import {
  Droplets,
  Sun,
  Clock,
  Heart,
  AlertCircle,
  Shield,
  Sparkles,
  Calendar,
  Utensils,
  Moon,
  Activity,
  CheckCircle2
} from "lucide-react";

import { SEO } from "@/components/SEO";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileFooter from "@/components/MobileFooter";

const AftercareInstructions = () => {
  const { i18n } = useTranslation();

  const aftercareCategories = [
    {
      id: 'brows',
      title: i18n.language === 'pl' ? 'Pielęgnacja Brwi' :
             i18n.language === 'en' ? 'Brow Aftercare' :
             i18n.language === 'ua' ? 'Догляд за Бровами' :
             'Уход за Бровями',
      icon: <Sparkles className="w-6 h-6" />,
      color: 'from-champagne-200 to-champagne',
      instructions: [
        {
          timeframe: i18n.language === 'pl' ? 'Pierwsze 24 godziny' :
                     i18n.language === 'en' ? 'First 24 Hours' :
                     i18n.language === 'ua' ? 'Перші 24 години' :
                     'Первые 24 часа',
          items: [
            { icon: <Droplets className="w-5 h-5 text-blue-400" />, text: i18n.language === 'pl' ? 'Unikaj kontaktu z wodą' : i18n.language === 'en' ? 'Keep dry, avoid water' : i18n.language === 'ua' ? 'Уникайте контакту з водою' : 'Избегайте контакта с водой' },
            { icon: <Sun className="w-5 h-5 text-yellow-400" />, text: i18n.language === 'pl' ? 'Chroń przed słońcem' : i18n.language === 'en' ? 'Avoid sun exposure' : i18n.language === 'ua' ? 'Захищайте від сонця' : 'Защищайте от солнца' },
            { icon: <Activity className="w-5 h-5 text-purple-400" />, text: i18n.language === 'pl' ? 'Unikaj sauny i sportu' : i18n.language === 'en' ? 'No sauna or exercise' : i18n.language === 'ua' ? 'Уникайте сауни та спорту' : 'Избегайте сауны и спорта' },
            { icon: <Heart className="w-5 h-5 text-rose-400" />, text: i18n.language === 'pl' ? 'Nie dotykaj brwi' : i18n.language === 'en' ? "Don't touch brows" : i18n.language === 'ua' ? 'Не торкайтеся брів' : 'Не трогайте брови' }
          ]
        },
        {
          timeframe: i18n.language === 'pl' ? 'Pierwszy tydzień' :
                     i18n.language === 'en' ? 'First Week' :
                     i18n.language === 'ua' ? 'Перший тиждень' :
                     'Первая неделя',
          items: [
            { icon: <Shield className="w-5 h-5 text-green-400" />, text: i18n.language === 'pl' ? 'Stosuj balsam po gojeniu' : i18n.language === 'en' ? 'Apply healing balm' : i18n.language === 'ua' ? 'Використовуйте бальзам після загоєння' : 'Применяйте бальзам после заживления' },
            { icon: <Calendar className="w-5 h-5 text-blue-500" />, text: i18n.language === 'pl' ? 'Nie używaj makijażu' : i18n.language === 'en' ? 'No makeup on brows' : i18n.language === 'ua' ? 'Не використовуйте макіяж' : 'Не используйте макияж' },
            { icon: <Moon className="w-5 h-5 text-indigo-500" />, text: i18n.language === 'pl' ? 'Śpij na plecach' : i18n.language === 'en' ? 'Sleep on your back' : i18n.language === 'ua' ? 'Спіть на спині' : 'Спите на спине' }
          ]
        },
        {
          timeframe: i18n.language === 'pl' ? 'Długoterminowa pielęgnacja' :
                     i18n.language === 'en' ? 'Long-term Care' :
                     i18n.language === 'ua' ? 'Довгостроковий догляд' :
                     'Долгосрочный уход',
          items: [
            { icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, text: i18n.language === 'pl' ? 'Używaj witaminy E' : i18n.language === 'en' ? 'Use vitamin E oil' : i18n.language === 'ua' ? 'Використовуйте вітамін Е' : 'Используйте витамин Е' },
            { icon: <Sparkles className="w-5 h-5 text-amber-500" />, text: i18n.language === 'pl' ? 'Farbuj tylko u specjalisty' : i18n.language === 'en' ? 'Only color with professional' : i18n.language === 'ua' ? 'Фарбуйте тільки у професіонала' : 'Красьте только у профессионала' }
          ]
        }
      ]
    },
    {
      id: 'lips',
      title: i18n.language === 'pl' ? 'Pielęgnacja Ust' :
             i18n.language === 'en' ? 'Lip Aftercare' :
             i18n.language === 'ua' ? 'Догляд за Губами' :
             'Уход за Губами',
      icon: <Heart className="w-6 h-6" />,
      color: 'from-rose to-pink-400',
      instructions: [
        {
          timeframe: i18n.language === 'pl' ? 'Pierwsze 48 godzin' :
                     i18n.language === 'en' ? 'First 48 Hours' :
                     i18n.language === 'ua' ? 'Перші 48 годин' :
                     'Первые 48 часов',
          items: [
            { icon: <Droplets className="w-5 h-5 text-blue-400" />, text: i18n.language === 'pl' ? 'Pij przez słomkę' : i18n.language === 'en' ? 'Drink through straw' : i18n.language === 'ua' ? 'Пийте через соломинку' : 'Пейте через соломинку' },
            { icon: <Utensils className="w-5 h-5 text-orange-400" />, text: i18n.language === 'pl' ? 'Unikaj gorących potraw' : i18n.language === 'en' ? 'Avoid hot foods' : i18n.language === 'ua' ? 'Уникайте гарячої їжі' : 'Избегайте горячей еды' },
            { icon: <Sun className="w-5 h-5 text-yellow-400" />, text: i18n.language === 'pl' ? 'Stosuj krem SPF' : i18n.language === 'en' ? 'Apply SPF cream' : i18n.language === 'ua' ? 'Використовуйте крем SPF' : 'Используйте крем SPF' },
            { icon: <Clock className="w-5 h-5 text-purple-400" />, text: i18n.language === 'pl' ? 'Usuń naskórek po 3 dniach' : i18n.language === 'en' ? 'Remove crusts after 3 days' : i18n.language === 'ua' ? 'Видаліть кірки через 3 дні' : 'Удалите корки через 3 дня' }
          ]
        },
        {
          timeframe: i18n.language === 'pl' ? 'Pierwszy tydzień' :
                     i18n.language === 'en' ? 'First Week' :
                     i18n.language === 'ua' ? 'Перший тиждень' :
                     'Первая неделя',
          items: [
            { icon: <Shield className="w-5 h-5 text-green-400" />, text: i18n.language === 'pl' ? 'Stosuj maść regenerującą' : i18n.language === 'en' ? 'Use regeneration ointment' : i18n.language === 'ua' ? 'Використовуйте регенеруючу мазь' : 'Используйте регенерирующую мазь' },
            { icon: <Activity className="w-5 h-5 text-rose-400" />, text: i18n.language === 'pl' ? 'Unikaj pocałunków' : i18n.language === 'en' ? 'Avoid kissing' : i18n.language === 'ua' ? 'Уникайте поцілунків' : 'Избегайте поцелуев' },
            { icon: <Calendar className="w-5 h-5 text-blue-500" />, text: i18n.language === 'pl' ? 'Nie farbuj ust' : i18n.language === 'en' ? 'No lip coloring' : i18n.language === 'ua' ? 'Не фарбуйте губи' : 'Не красьте губы' }
          ]
        }
      ]
    },
    {
      id: 'eyeliner',
      title: i18n.language === 'pl' ? 'Pielęgnacja Eyelineru' :
             i18n.language === 'en' ? 'Eyeliner Aftercare' :
             i18n.language === 'ua' ? 'Догляд за Айлайнером' :
             'Уход за Айлайнером',
      icon: <Sparkles className="w-6 h-6" />,
      color: 'from-violet-400 to-purple-500',
      instructions: [
        {
          timeframe: i18n.language === 'pl' ? 'Pierwsze 72 godziny' :
                     i18n.language === 'en' ? 'First 72 Hours' :
                     i18n.language === 'ua' ? 'Перші 72 години' :
                     'Первые 72 часа',
          items: [
            { icon: <Droplets className="w-5 h-5 text-blue-400" />, text: i18n.language === 'pl' ? 'Unikaj wody w okolicy oczu' : i18n.language === 'en' ? 'Keep eye area dry' : i18n.language === 'ua' ? 'Тримайте область очей сухою' : 'Держите область глаз сухой' },
            { icon: <Moon className="w-5 h-5 text-indigo-400" />, text: i18n.language === 'pl' ? 'Śpij na plecach' : i18n.language === 'en' ? 'Sleep on your back' : i18n.language === 'ua' ? 'Спіть на спині' : 'Спите на спине' },
            { icon: <Activity className="w-5 h-5 text-purple-400" />, text: i18n.language === 'pl' ? 'Nie używaj soczewek' : i18n.language === 'en' ? 'No contact lenses' : i18n.language === 'ua' ? 'Не носіть лінзи' : 'Не носите линзы' },
            { icon: <Sun className="w-5 h-5 text-yellow-400" />, text: i18n.language === 'pl' ? 'Chroń przed słońcem' : i18n.language === 'en' ? 'Protect from sun' : i18n.language === 'ua' ? 'Захищайте від сонця' : 'Защищайте от солнца' }
          ]
        },
        {
          timeframe: i18n.language === 'pl' ? 'Pierwsze 2 tygodnie' :
                     i18n.language === 'en' ? 'First 2 Weeks' :
                     i18n.language === 'ua' ? 'Перші 2 тижні' :
                     'Первые 2 недели',
          items: [
            { icon: <Calendar className="w-5 h-5 text-green-400" />, text: i18n.language === 'pl' ? 'Nie używaj eyelinera' : i18n.language === 'en' ? 'No eyeliner makeup' : i18n.language === 'ua' ? 'Не використовуйте олівець' : 'Не используйте подведку' },
            { icon: <Shield className="w-5 h-5 text-blue-500" />, text: i18n.language === 'pl' ? 'Delikatnie oczyszczaj' : i18n.language === 'en' ? 'Cleanse gently' : i18n.language === 'ua' ? 'Обережно очищуйте' : 'Очищайте осторожно' }
          ]
        }
      ]
    },
    {
      id: 'fitness',
      title: i18n.language === 'pl' ? 'Regeneracja Treningowa' :
             i18n.language === 'en' ? 'Workout Recovery' :
             i18n.language === 'ua' ? 'Відновлення Тренувань' :
             'Восстановление Тренировок',
      icon: <Activity className="w-6 h-6" />,
      color: 'from-emerald-400 to-green-500',
      instructions: [
        {
          timeframe: i18n.language === 'pl' ? 'Bezpośrednio po treningu' :
                     i18n.language === 'en' ? 'Immediately After Workout' :
                     i18n.language === 'ua' ? 'Негайно після тренування' :
                     'Сразу после тренировки',
          items: [
            { icon: <Droplets className="w-5 h-5 text-blue-400" />, text: i18n.language === 'pl' ? 'Uzupełniaj płyny' : i18n.language === 'en' ? 'Rehydrate with water' : i18n.language === 'ua' ? 'Поповнюйте рідини' : 'Восполняйте жидкости' },
            { icon: <Utensils className="w-5 h-5 text-orange-400" />, text: i18n.language === 'pl' ? 'Zjedz białko w 30min' : i18n.language === 'en' ? 'Eat protein within 30min' : i18n.language === 'ua' ? 'З\'їжте білок протягом 30хв' : 'Съешьте белок в течение 30мин' },
            { icon: <Clock className="w-5 h-5 text-purple-400" />, text: i18n.language === 'pl' ? 'Zrób rozciąganie' : i18n.language === 'en' ? 'Do stretching exercises' : i18n.language === 'ua' ? 'Зробіть розтяжку' : 'Сделайте растяжку' }
          ]
        },
        {
          timeframe: i18n.language === 'pl' ? 'Pierwsze 24 godziny' :
                     i18n.language === 'en' ? 'First 24 Hours' :
                     i18n.language === 'ua' ? 'Перші 24 години' :
                     'Первые 24 часа',
          items: [
            { icon: <Moon className="w-5 h-5 text-indigo-400" />, text: i18n.language === 'pl' ? 'Śpij 7-8 godzin' : i18n.language === 'en' ? 'Sleep 7-8 hours' : i18n.language === 'ua' ? 'Спіть 7-8 годин' : 'Спите 7-8 часов' },
            { icon: <Activity className="w-5 h-5 text-green-400" />, text: i18n.language === 'pl' ? 'Lekka aktywność' : i18n.language === 'en' ? 'Light activity only' : i18n.language === 'ua' ? 'Тільки легка активність' : 'Только легкая активность' },
            { icon: <Droplets className="w-5 h-5 text-blue-500" />, text: i18n.language === 'pl' ? 'Masaż lub rolowanie' : i18n.language === 'en' ? 'Massage or foam rolling' : i18n.language === 'ua' ? 'Масаж або ролик' : 'Массаж или ролик' }
          ]
        },
        {
          timeframe: i18n.language === 'pl' ? 'Długoterminowo' :
                     i18n.language === 'en' ? 'Long-term' :
                     i18n.language === 'ua' ? 'Довгостроково' :
                     'Долгосрочно',
          items: [
            { icon: <Sun className="w-5 h-5 text-yellow-400" />, text: i18n.language === 'pl' ? 'Dni odpoczynku' : i18n.language === 'en' ? 'Rest days between workouts' : i18n.language === 'ua' ? 'Дні відпочинку' : 'Дни отдыха между тренировками' },
            { icon: <Heart className="w-5 h-5 text-rose-400" />, text: i18n.language === 'pl' ? 'Słuchaj swojego ciała' : i18n.language === 'en' ? 'Listen to your body' : i18n.language === 'ua' ? 'Слухайте своє тіло' : 'Слушайте свое тело' }
          ]
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={i18n.language === 'pl' ? 'Instrukcje Pielęgnacji | Mariia Hub' :
              i18n.language === 'en' ? 'Aftercare Instructions | Mariia Hub' :
              i18n.language === 'ua' ? 'Інструкції Догляду | Mariia Hub' :
              'Инструкции Ухода | Mariia Hub'}
        description={i18n.language === 'pl' ?
              'Szczegółowe instrukcje pielęgnacji po zabiegach permanentnego makijażu i treningach fitness' :
              i18n.language === 'en' ?
              'Detailed aftercare instructions for permanent makeup procedures and fitness training' :
              i18n.language === 'ua' ?
              'Детальні інструкції догляду після процедур перманентного макіяжу та тренувань фітнесу' :
              'Подробные инструкции по уходу после процедур перманентного макияжа и фитнес тренировок'}
        keywords="aftercare, post-treatment care, beauty, fitness, recovery, healing"
      />
      <Navigation />

      {/* Header */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-16">
        <div className="container mx-auto px-6 md:px-8 max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold text-pearl leading-tight tracking-tight mb-6">
            {i18n.language === 'pl' ? 'Instrukcje Pielęgnacji' :
             i18n.language === 'en' ? 'Aftercare Instructions' :
             i18n.language === 'ua' ? 'Інструкції Догляду' :
             'Инструкции Ухода'}
          </h1>
          <p className="text-xl text-pearl/80 font-body">
            {i18n.language === 'pl'
              ? 'Jak dbać o efekty zabiegów i przyspieszać regenerację organizmu'
              : i18n.language === 'en'
              ? 'How to care for treatment results and accelerate body recovery'
              : i18n.language === 'ua'
              ? 'Як доглядати за результатами процедур та прискорювати регенерацію організму'
              : 'Как ухаживать за результатами процедур и ускорять регенерацию организма'}
          </p>
        </div>
      </section>

      {/* Aftercare Categories */}
      <div className="pb-20">
        {aftercareCategories.map((category) => (
          <section key={category.id} className="pb-20">
            <div className="container mx-auto px-6 md:px-8 max-w-6xl">
              <div className="text-center mb-12">
                <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full glass-accent border border-champagne/20 mb-4 bg-gradient-to-r ${category.color}`}>
                  {category.icon}
                  <h2 className="text-2xl font-display font-semibold text-pearl">
                    {category.title}
                  </h2>
                </div>
                <p className="text-lg text-pearl/80 font-body max-w-3xl mx-auto">
                  {i18n.language === 'pl'
                    ? 'Postępuj zgodnie z poniższymi instrukcjami, aby zapewnić najlepsze rezultaty'
                    : i18n.language === 'en'
                    ? 'Follow the instructions below to ensure the best results'
                    : i18n.language === 'ua'
                    ? 'Дотримуйтесь наведених нижче інструкцій, щоб забезпечити найкращі результати'
                    : 'Следуйте инструкциям ниже, чтобы обеспечить лучшие результаты'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {category.instructions.map((instruction, idx) => (
                  <div key={idx} className="glass-card p-6 rounded-3xl border border-champagne/20 hover:border-champagne/40 transition-all duration-300">
                    <h3 className="text-xl font-display font-semibold text-pearl mb-6 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full glass-accent flex items-center justify-center bg-gradient-to-r from-champagne/20 to-bronze/20">
                        <Clock className="w-4 h-4 text-champagne-200" />
                      </div>
                      {instruction.timeframe}
                    </h3>
                    <ul className="space-y-4">
                      {instruction.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {item.icon}
                          </div>
                          <span className="text-pearl/90 font-body leading-relaxed">{item.text}</span>
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
                    ? 'Kiedy Skontaktować się z Nami'
                    : i18n.language === 'en'
                    ? 'When to Contact Us'
                    : i18n.language === 'ua'
                    ? 'Коли Зв\'язатися з Нами'
                    : 'Когда Связаться с Нами'}
                </h3>
                <ul className="space-y-2 text-pearl/80 font-body mb-6">
                  <li>• {i18n.language === 'pl'
                    ? 'Nadmierny obrzęk lub ból utrzymujący się ponad 48 godzin'
                    : i18n.language === 'en'
                    ? 'Excessive swelling or pain lasting more than 48 hours'
                    : i18n.language === 'ua'
                    ? 'Надмірний набряк або біль, що триває понад 48 годин'
                    : 'Чрезмерный отек или боль, длящиеся более 48 часов'}</li>
                  <li>• {i18n.language === 'pl'
                    ? 'Objawy infekcji (gorączka, ropa, zaczerwienienie)'
                    : i18n.language === 'en'
                    ? 'Signs of infection (fever, pus, excessive redness)'
                    : i18n.language === 'ua'
                    ? 'Симптоми інфекції (гарячка, гній, почервоніння)'
                    : 'Признаки инфекции (температура, гной, сильное покраснение)'}</li>
                  <li>• {i18n.language === 'pl'
                    ? 'Reakcje alergiczne (wysypka, świąd, obrzęk)'
                    : i18n.language === 'en'
                    ? 'Allergic reactions (rash, itching, swelling)'
                    : i18n.language === 'ua'
                    ? 'Алергічні реакції (висип, свербіж, набряк)'
                    : 'Аллергические реакции (сыпь, зуд, отек)'}</li>
                </ul>
                <div className="text-center">
                  <a
                    href="tel:+48123456789"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-brand text-brand-foreground rounded-full font-medium shadow-luxury hover:shadow-luxury-lg transition-all duration-300 hover:scale-105"
                  >
                    <AlertCircle className="w-5 h-5" />
                    <span>{i18n.language === 'pl' ? 'Zadzwoń Teraz' :
                           i18n.language === 'en' ? 'Call Now' :
                           i18n.language === 'ua' ? 'Подзвоніть Зараз' :
                           'Позвоните Немедленно'}</span>
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

export default AftercareInstructions;