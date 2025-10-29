import { useTranslation } from "react-i18next";
import { DollarSign, CheckCircle, Clock, AlertCircle, CreditCard, Mail, Phone } from "lucide-react";

import { SEO } from "@/components/SEO";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileFooter from "@/components/MobileFooter";

const RefundPolicy = () => {
  const { i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={i18n.language === 'pl' ? "Polityka Zwrotów | Mariia Hub" :
              i18n.language === 'en' ? "Refund Policy | Mariia Hub" :
              i18n.language === 'ua' ? "Політика Повернень | Mariia Hub" :
              "Политика Возвратов | Mariia Hub"}
        description={i18n.language === 'pl' ?
              "Szczegółowa polityka zwrotów i rekompensat dla usług beauty i fitness w Mariia Hub" :
              i18n.language === 'en' ?
              "Detailed refund and compensation policy for beauty and fitness services at Mariia Hub" :
              i18n.language === 'ua' ?
              "Детальна політика повернень та компенсацій для послуг beauty та fitness в Mariia Hub" :
              "Детальная политика возвратов и компенсаций для услуг beauty и fitness в Mariia Hub"}
        keywords="refund policy, returns, money back, cancellation, service refunds"
      />
      <Navigation />

      {/* Header */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-16">
        <div className="container mx-auto px-6 md:px-8 max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold text-pearl leading-tight tracking-tight mb-6">
            {i18n.language === 'pl' ? "Polityka Zwrotów" :
             i18n.language === 'en' ? "Refund Policy" :
             i18n.language === 'ua' ? "Політика Повернень" :
             "Политика Возвратов"}
          </h1>
          <p className="text-xl text-pearl/80 font-body">
            {i18n.language === 'pl'
              ? "Ostatnia aktualizacja: 21 października 2025"
              : i18n.language === 'en'
              ? "Last updated: October 21, 2025"
              : i18n.language === 'ua'
              ? "Останнє оновлення: 21 жовтня 2025"
              : "Последнее обновление: 21 октября 2025"}
          </p>
        </div>
      </section>

      {/* Introduction */}
      <section className="pb-20">
        <div className="container mx-auto px-6 md:px-8 max-w-4xl">
          <div className="glass-card p-8 rounded-3xl border border-champagne/20">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full glass-accent flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-6 h-6 text-champagne-200" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-semibold text-pearl mb-3">
                  {i18n.language === 'pl'
                    ? "Nasza Gwarancja Satysfakcji"
                    : i18n.language === 'en'
                    ? "Our Satisfaction Guarantee"
                    : i18n.language === 'ua'
                    ? "Наша Гарантія Задоволеності"
                    : "Наша Гарантия Удовлетворенности"}
                </h2>
                <p className="text-pearl/80 font-body leading-relaxed">
                  {i18n.language === 'pl'
                    ? "W Mariia Hub pragniemy, aby każdy Klient był w pełni zadowolony z naszych usług. W przypadku, gdy usługa nie spełnia Twoich oczekiwań, oferujemy elastyczną politykę zwrotów."
                    : i18n.language === 'en'
                    ? "At Mariia Hub, we want every Client to be fully satisfied with our services. If a service does not meet your expectations, we offer a flexible refund policy."
                    : i18n.language === 'ua'
                    ? "У Mariia Hub ми хочемо, щоб кожен Клієнт був повністю задоволений нашими послугами. Якщо послуга не відповідає вашим очікуванням, ми пропонуємо гнучку політику повернень."
                    : "В Mariia Hub мы хотим, чтобы каждый Клиент был полностью удовлетворен нашими услугами. Если услуга не соответствует вашим ожиданиям, мы предлагаем гибкую политику возвратов."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Refund Conditions */}
      <section className="pb-20">
        <div className="container mx-auto px-6 md:px-8 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-pearl mb-12 text-center">
            {i18n.language === 'pl'
              ? "Warunki Zwrotu Pieniędzy"
              : i18n.language === 'en'
              ? "Refund Conditions"
              : i18n.language === 'ua'
              ? "Умови Повернення Грошей"
              : "Условия Возврата Денег"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-6 rounded-2xl border border-champagne/20">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <h3 className="text-xl font-display font-semibold text-pearl">
                  {i18n.language === 'pl' ? "Pełny Zwrot" :
                   i18n.language === 'en' ? "Full Refund" :
                   i18n.language === 'ua' ? "Повне Повернення" :
                   "Полный Возврат"}
                </h3>
              </div>
              <ul className="space-y-3 text-pearl/80 font-body">
                <li>• {i18n.language === 'pl'
                  ? "Anulowanie wizyty co najmniej 48 godzin przed terminem"
                  : i18n.language === 'en'
                  ? "Cancelling appointment at least 48 hours before"
                  : i18n.language === 'ua'
                  ? "Скасування візиту щонайменше за 48 годин до"
                  : "Отмена визита не менее чем за 48 часов до"}</li>
                <li>• {i18n.language === 'pl'
                  ? "Rezygnacja z usługi przed jej rozpoczęciem"
                  : i18n.language === 'en'
                  ? "Resigning from service before it starts"
                  : i18n.language === 'ua'
                  ? "Відмова від послуги до її початку"
                  : "Отказ от услуги до ее начала"}</li>
                <li>• {i18n.language === 'pl'
                  ? "W przypadku przeciwwskazań medycznych (z zaświadczeniem)"
                  : i18n.language === 'en'
                  ? "In case of medical contraindications (with certificate)"
                  : i18n.language === 'ua'
                  ? "У разі медичних протипоказань (з довідкою)"
                  : "В случае медицинских противопоказаний (со справкой)"}</li>
              </ul>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-champagne/20">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-yellow-400" />
                <h3 className="text-xl font-display font-semibold text-pearl">
                  {i18n.language === 'pl'
                    ? "Częściowy Zwrot"
                    : i18n.language === 'en'
                    ? "Partial Refund"
                    : i18n.language === 'ua'
                    ? "Часткове Повернення"
                    : "Частичный Возврат"}
                </h3>
              </div>
              <ul className="space-y-3 text-pearl/80 font-body">
                <li>• {i18n.language === 'pl'
                  ? "Anulowanie 24-48 godzin przed wizytą (50% zwrotu)"
                  : i18n.language === 'en'
                  ? "Cancelling 24-48 hours before (50% refund)"
                  : i18n.language === 'ua'
                  ? "Скасування за 24-48 годин (50% повернення)"
                  : "Отмена за 24-48 часов (50% возврата)"}</li>
                <li>• {i18n.language === 'pl'
                  ? "Wczesne zakończenie sesji (proporcjonalny zwrot)"
                  : i18n.language === 'en'
                  ? "Early termination of session (proportional refund)"
                  : i18n.language === 'ua'
                  ? "Передчасне завершення сесії (пропорційне повернення)"
                  : "Досрочное завершение сессии (пропорциональный возврат)"}</li>
                <li>• {i18n.language === 'pl'
                  ? "Przypadek siły wyższej"
                  : i18n.language === 'en'
                  ? "Force majeure"
                  : i18n.language === 'ua'
                  ? "Непереборна сила"
                  : "Форс-мажор"}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Non-Refundable Cases */}
      <section className="pb-20">
        <div className="container mx-auto px-6 md:px-8 max-w-5xl">
          <div className="glass-card p-8 rounded-3xl border border-rose/20 bg-rose/5">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-rose-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-2xl font-display font-semibold text-pearl mb-4">
                  {i18n.language === 'pl'
                    ? "Kiedy Zwrot Nie Jest Możliwy"
                    : i18n.language === 'en'
                    ? "When Refund Is Not Possible"
                    : i18n.language === 'ua'
                    ? "Коли Повернення Неможливе"
                    : "Когда Возврат Невозможен"}
                </h3>
                <ul className="space-y-3 text-pearl/80 font-body">
                  <li>• {i18n.language === 'pl'
                    ? "Anulowanie wizyty w ciągu 24 godzin przed planowanym terminem"
                    : i18n.language === 'en'
                    ? "Cancelling appointment within 24 hours of scheduled time"
                    : i18n.language === 'ua'
                    ? "Скасування візиту протягом 24 годин до запланованого часу"
                    : "Отмена визита в течение 24 часов до запланированного времени"}</li>
                  <li>• {i18n.language === 'pl'
                    ? "Nie stawienie się na umówioną wizytę bez wcześniejszego powiadomienia"
                    : i18n.language === 'en'
                    ? "Not showing up for scheduled appointment without prior notice"
                    : i18n.language === 'ua'
                    ? "Неявка на узгоджений візит без попереднього повідомлення"
                    : "Неявка на назначенный визит без предварительного уведомления"}</li>
                  <li>• {i18n.language === 'pl'
                    ? "Spóźnienie ponad 15 minut na wizytę"
                    : i18n.language === 'en'
                    ? "Being more than 15 minutes late for appointment"
                    : i18n.language === 'ua'
                    ? "Запізнення понад 15 хвилин на візит"
                    : "Опоздание более чем на 15 минут на визит"}</li>
                  <li>• {i18n.language === 'pl'
                    ? "Wykonanie usługi zgodnie z umową"
                    : i18n.language === 'en'
                    ? "Completion of service according to agreement"
                    : i18n.language === 'ua'
                    ? "Виконання послуги згідно з договором"
                    : "Выполнение услуги согласно договору"}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Refund Process */}
      <section className="pb-20">
        <div className="container mx-auto px-6 md:px-8 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-pearl mb-12 text-center">
            {i18n.language === 'pl'
              ? "Procedura Zwrotu"
              : i18n.language === 'en'
              ? "Refund Process"
              : i18n.language === 'ua'
              ? "Процедура Повернення"
              : "Процедура Возврата"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-2xl border border-champagne/20 text-center">
              <div className="w-16 h-16 rounded-full glass-accent flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-champagne-200">1</span>
              </div>
              <h3 className="text-lg font-display font-semibold text-pearl mb-3">
                {i18n.language === 'pl' ? "Skontaktuj się z nami" :
                 i18n.language === 'en' ? "Contact Us" :
                 i18n.language === 'ua' ? "Зв'яжіться з нами" :
                 "Свяжитесь с нами"}
              </h3>
              <p className="text-pearl/80 font-body text-sm">
                {i18n.language === 'pl'
                  ? "Wyślij email na refund@mariia-hub.pl z numerem rezerwacji"
                  : i18n.language === 'en'
                  ? "Send email to refund@mariia-hub.pl with booking number"
                  : i18n.language === 'ua'
                  ? "Надішліть email на refund@mariia-hub.pl з номером бронювання"
                  : "Отправьте email на refund@mariia-hub.pl с номером бронирования"}
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-champagne/20 text-center">
              <div className="w-16 h-16 rounded-full glass-accent flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-champagne-200">2</span>
              </div>
              <h3 className="text-lg font-display font-semibold text-pearl mb-3">
                {i18n.language === 'pl' ? "Weryfikacja" :
                 i18n.language === 'en' ? "Verification" :
                 i18n.language === 'ua' ? "Перевірка" :
                 "Проверка"}
              </h3>
              <p className="text-pearl/80 font-body text-sm">
                {i18n.language === 'pl'
                  ? "Przeanalizujemy Twój wniosek w ciągu 2-3 dni roboczych"
                  : i18n.language === 'en'
                  ? "We will review your request within 2-3 business days"
                  : i18n.language === 'ua'
                  ? "Ми розглянемо ваш запит протягом 2-3 робочих днів"
                  : "Мы рассмотрим ваш запрос в течение 2-3 рабочих дней"}
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-champagne/20 text-center">
              <div className="w-16 h-16 rounded-full glass-accent flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-champagne-200">3</span>
              </div>
              <h3 className="text-lg font-display font-semibold text-pearl mb-3">
                {i18n.language === 'pl' ? "Zwrot Pieniędzy" :
                 i18n.language === 'en' ? "Refund" :
                 i18n.language === 'ua' ? "Повернення Грошей" :
                 "Возврат Денег"}
              </h3>
              <p className="text-pearl/80 font-body text-sm">
                {i18n.language === 'pl'
                  ? "Środki zostaną zwrócone w ciągu 7 dni na konto źródłowe"
                  : i18n.language === 'en'
                  ? "Funds will be returned within 7 days to the original account"
                  : i18n.language === 'ua'
                  ? "Кошти будуть повернуті протягом 7 днів на вихідний рахунок"
                  : "Средства будут возвращены в течение 7 дней на исходный счет"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Service Packages */}
      <section className="pb-20">
        <div className="container mx-auto px-6 md:px-8 max-w-4xl">
          <div className="glass-card p-8 rounded-3xl border border-champagne/20">
            <div className="flex items-start gap-4 mb-6">
              <CreditCard className="w-6 h-6 text-champagne-200 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-2xl font-display font-semibold text-pearl mb-4">
                  {i18n.language === 'pl'
                    ? "Pakiety Usług i Vouchery"
                    : i18n.language === 'en'
                    ? "Service Packages and Vouchers"
                    : i18n.language === 'ua'
                    ? "Пакети Послуг та Ваучери"
                    : "Пакеты Услуг и Ваучеры"}
                </h3>
                <div className="space-y-4 text-pearl/80 font-body">
                  <p>
                    {i18n.language === 'pl'
                      ? "Zakupione pakiety i vouchery podlegają szczególnym warunkom zwrotu:"
                      : i18n.language === 'en'
                      ? "Purchased packages and vouchers are subject to special refund conditions:"
                      : i18n.language === 'ua'
                      ? "Придбані пакети та ваучери підлягають особливим умовам повернення:"
                      : "Приобретенные пакеты и ваучеры подлежат особым условиям возврата:"}
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li>• {i18n.language === 'pl'
                      ? "Pełny zwrot w ciągu 14 dni od zakupu (jeśli nie zostały wykorzystane)"
                      : i18n.language === 'en'
                      ? "Full refund within 14 days of purchase (if not used)"
                      : i18n.language === 'ua'
                      ? "Повне повернення протягом 14 днів з моменту покупки (якщо не використані)"
                      : "Полный возврат в течение 14 дней с момента покупки (если не использовались)"}</li>
                    <li>• {i18n.language === 'pl'
                      ? "Częściowy zwrot proporcjonalny do niewykorzystanych usług"
                      : i18n.language === 'en'
                      ? "Partial refund proportional to unused services"
                      : i18n.language === 'ua'
                      ? "Часткове повернення пропорційно до невикористаних послуг"
                      : "Частичный возврат пропорционально неиспользованным услугам"}</li>
                    <li>• {i18n.language === 'pl'
                      ? "Vouchery prezentowe mogą być wymienione na inne usługi"
                      : i18n.language === 'en'
                      ? "Gift vouchers can be exchanged for other services"
                      : i18n.language === 'ua'
                      ? "Подарункові ваучери можна обміняти на інші послуги"
                      : "Подарочные ваучеры можно обменять на другие услуги"}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-gradient-to-r from-rose/10 via-champagne/10 to-bronze/10">
        <div className="container mx-auto px-6 md:px-8 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-pearl mb-4">
            {i18n.language === 'pl'
              ? "Masz Pytania dotyczące Zwrotów?"
              : i18n.language === 'en'
              ? "Questions About Refunds?"
              : i18n.language === 'ua'
              ? "Питання щодо Повернень?"
              : "Вопросы по Возвратам?"}
          </h2>
          <p className="text-xl text-pearl/80 font-body mb-8">
            {i18n.language === 'pl'
              ? "Nasz zespół obsługi klienta jest do Twojej dyspozycji"
              : i18n.language === 'en'
              ? "Our customer service team is at your disposal"
              : i18n.language === 'ua'
              ? "Наша команда обслуговування клієнтів до ваших послуг"
              : "Наша команда обслуживания клиентов в вашем распоряжении"}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:refund@mariia-hub.pl"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-brand text-brand-foreground rounded-full font-medium shadow-luxury hover:shadow-luxury-lg transition-all duration-300 hover:scale-105 group"
            >
              <Mail className="w-5 h-5" />
              <span>{i18n.language === 'pl' ? "Napisz do Nas" :
                     i18n.language === 'en' ? "Email Us" :
                     i18n.language === 'ua' ? "Напишіть Нам" :
                     "Напишите Нам"}</span>
            </a>
            <a
              href="tel:+48123456789"
              className="inline-flex items-center gap-3 px-8 py-4 glass-subtle text-pearl rounded-full font-medium border border-champagne/20 hover:bg-white/10 transition-all duration-300"
            >
              <Phone className="w-5 h-5" />
              <span>{i18n.language === 'pl' ? "Zadzwoń" :
                     i18n.language === 'en' ? "Call Us" :
                     i18n.language === 'ua' ? "Подзвоніть" :
                     "Позвоните"}</span>
            </a>
          </div>
        </div>
      </section>

      <Footer />
      <MobileFooter mode="beauty" />
    </div>
  );
};

export default RefundPolicy;