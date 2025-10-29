import { useTranslation } from "react-i18next";

import { SEO } from "@/components/SEO";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileFooter from "@/components/MobileFooter";

const PrivacyPolicy = () => {
  const { i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Privacy Policy — Data Protection & Privacy | Mariia Hub"
        description="Privacy policy for Mariia Hub beauty and fitness services. Learn how we collect, use, and protect your personal data."
        keywords="privacy policy, data protection, GDPR compliance, personal data, privacy rights"
      />
      <Navigation />

      {/* Header */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-16">
        <div className="container mx-auto px-6 md:px-8 max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold text-pearl leading-tight tracking-tight mb-6">
            {i18n.language === 'pl' ? "Polityka Prywatności" : i18n.language === 'en' ? "Privacy Policy" : i18n.language === 'ua' ? "Політика Конфіденційності" : "Политика Конфиденциальности"}
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

      {/* Content */}
      <section className="pb-32">
        <div className="container mx-auto px-6 md:px-8 max-w-4xl">
          <div className="prose prose-invert prose-lg max-w-none">
            <div className="space-y-12 text-pearl/80 font-body">

              <section>
                <h2 className="text-2xl font-display font-semibold text-pearl mb-4">
                  1. {i18n.language === 'pl' ? "Informacje Ogólne" : i18n.language === 'en' ? "General Information" : i18n.language === 'ua' ? "Загальна Інформація" : "Общая Информация"}
                </h2>
                <p className="leading-relaxed">
                  {i18n.language === 'pl'
                    ? "Niniejsza Polityka Prywatności określa sposób przetwarzania danych osobowych przez Mariia Hub z siedzibą w Warszawie. Szanujemy prywatność naszych klientów i zobowiązujemy się do ochrony ich danych osobowych."
                    : i18n.language === 'en'
                    ? "This Privacy Policy determines how personal data is processed by Mariia Hub, based in Warsaw. We respect the privacy of our clients and are committed to protecting their personal data."
                    : i18n.language === 'ua'
                    ? "Ця Політика Конфіденційності визначає спосіб обробки персональних даних Mariia Hub, що знаходиться у Варшаві. Ми поважаємо приватність наших клієнтів і зобов'язуємося захищати їхні персональні дані."
                    : "Настоящая Политика Конфиденциальности определяет порядок обработки персональных данных Mariia Hub, находящейся в Варшаве. Мы уважаем приватность наших клиентов и обязуемся защищать их персональные данные."}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-display font-semibold text-pearl mb-4">
                  2. {i18n.language === 'pl' ? "Zakres Przetwarzanych Danych" : i18n.language === 'en' ? "Scope of Processed Data" : i18n.language === 'ua' ? "Обсяг Оброблюваних Даних" : "Объем Обрабатываемых Данных"}
                </h2>
                <p className="leading-relaxed mb-4">
                  {i18n.language === 'pl'
                    ? "Przetwarzamy następujące kategorie danych osobowych:"
                    : i18n.language === 'en'
                    ? "We process the following categories of personal data:"
                    : i18n.language === 'ua'
                    ? "Ми обробляємо наступні категорії персональних даних:"
                    : "Мы обрабатываем следующие категории персональных данных:"}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{i18n.language === 'pl' ? "Dane kontaktowe (imię, nazwisko, email, numer telefonu)" : i18n.language === 'en' ? "Contact information (name, surname, email, phone number)" : i18n.language === 'ua' ? "Контактні дані (ім'я, прізвище, email, номер телефону)" : "Контактная информация (имя, фамилия, email, номер телефона)"}</li>
                  <li>{i18n.language === 'pl' ? "Dane rezerwacyjne (data, godzina, rodzaj usługi)" : i18n.language === 'en' ? "Booking data (date, time, service type)" : i18n.language === 'ua' ? "Дані бронювання (дата, час, тип послуги)" : "Данные бронирования (дата, время, тип услуги)"}</li>
                  <li>{i18n.language === 'pl' ? "Dane płatności (informacje niezbędne do realizacji płatności)" : i18n.language === 'en' ? "Payment data (information necessary for payment processing)" : i18n.language === 'ua' ? "Дані оплати (інформація, необхідна для обробки платежу)" : "Платежные данные (информация, необходимая для обработки платежа)"}</li>
                  <li>{i18n.language === 'pl' ? "Dane medyczne (alergie, przeciwwskazania – dobrowolnie podawane)" : i18n.language === 'en' ? "Medical data (allergies, contraindications – voluntarily provided)" : i18n.language === 'ua' ? "Медичні дані (алергії, протипоказання – надаються добровільно)" : "Медицинские данные (аллергии, противопоказания – предоставляются добровольно)"}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-display font-semibold text-pearl mb-4">
                  3. {i18n.language === 'pl' ? "Cele Przetwarzania Danych" : i18n.language === 'en' ? "Purposes of Data Processing" : i18n.language === 'ua' ? "Мети Обробки Даних" : "Цели Обработки Данных"}
                </h2>
                <p className="leading-relaxed mb-4">
                  {i18n.language === 'pl'
                    ? "Twoje dane osobowe przetwarzamy w następujących celach:"
                    : i18n.language === 'en'
                    ? "We process your personal data for the following purposes:"
                    : i18n.language === 'ua'
                    ? "Ваші персональні дані обробляються з наступних цілей:"
                    : "Ваши персональные данные обрабатываются для следующих целей:"}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{i18n.language === 'pl' ? "Realizacja rezerwacji i świadczenia usług" : i18n.language === 'en' ? "Booking realization and service provision" : i18n.language === 'ua' ? "Реалізація бронювання та надання послуг" : "Реализация бронирования и оказание услуг"}</li>
                  <li>{i18n.language === 'pl' ? "Komunikacja z klientami (potwierdzenia, przypomnienia)" : i18n.language === 'en' ? "Communication with clients (confirmations, reminders)" : i18n.language === 'ua' ? "Комунікація з клієнтами (підтвердження, нагадування)" : "Коммуникация с клиентами (подтверждения, напоминания)"}</li>
                  <li>{i18n.language === 'pl' ? "Przetwarzanie płatności" : i18n.language === 'en' ? "Payment processing" : i18n.language === 'ua' ? "Обробка платежів" : "Обработка платежей"}</li>
                  <li>{i18n.language === 'pl' ? "Marketing i newsletter (za zgodą)" : i18n.language === 'en' ? "Marketing and newsletter (with consent)" : i18n.language === 'ua' ? "Маркетинг та новини (за згодою)" : "Маркетинг и рассылка (с согласия)"}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-display font-semibold text-pearl mb-4">
                  4. {i18n.language === 'pl' ? "Prawa Osób, Których Dane Dotyczą" : i18n.language === 'en' ? "Rights of Data Subjects" : i18n.language === 'ua' ? "Права Суб'єктів Даних" : "Права Субъектов Данных"}
                </h2>
                <p className="leading-relaxed mb-4">
                  {i18n.language === 'pl'
                    ? "Masz prawo do:"
                    : i18n.language === 'en'
                    ? "You have the right to:"
                    : i18n.language === 'ua'
                    ? "Ви маєте право на:"
                    : "Вы имеете право на:"}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{i18n.language === 'pl' ? "Dostępu do swoich danych osobowych" : i18n.language === 'en' ? "Access your personal data" : i18n.language === 'ua' ? "Доступ до своїх персональних даних" : "Доступ к своим персональным данным"}</li>
                  <li>{i18n.language === 'pl' ? "Sprostowania nieprawidłowych danych" : i18n.language === 'en' ? "Rectification of incorrect data" : i18n.language === 'ua' ? "Виправлення неправильних даних" : "Исправление неверных данных"}</li>
                  <li>{i18n.language === 'pl' ? "Usunięcia danych (prawo do bycia zapomnianym)" : i18n.language === 'en' ? "Erasure of data (right to be forgotten)" : i18n.language === 'ua' ? "Видалення даних (право на забуття)" : "Удаление данных (право на забвение)"}</li>
                  <li>{i18n.language === 'pl' ? "Ograniczenia przetwarzania" : i18n.language === 'en' ? "Restriction of processing" : i18n.language === 'ua' ? "Обмеження обробки" : "Ограничение обработки"}</li>
                  <li>{i18n.language === 'pl' ? "Przenoszenia danych" : i18n.language === 'en' ? "Data portability" : i18n.language === 'ua' ? "Перенесення даних" : "Переносимость данных"}</li>
                  <li>{i18n.language === 'pl' ? "Sprzeciwu wobec przetwarzania" : i18n.language === 'en' ? "Objection to processing" : i18n.language === 'ua' ? "Заперечення проти обробки" : "Возражение против обработки"}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-display font-semibold text-pearl mb-4">
                  5. {i18n.language === 'pl' ? "Przechowywanie Danych" : i18n.language === 'en' ? "Data Storage" : i18n.language === 'ua' ? "Зберігання Даних" : "Хранение Данных"}
                </h2>
                <p className="leading-relaxed">
                  {i18n.language === 'pl'
                    ? "Dane osobowe przechowujemy przez okres niezbędny do realizacji celów, dla których zostały zebrane, zgodnie z obowiązującymi przepisami prawa. Dane rezerwacyjne przechowujemy przez 2 lata od ostatniej wizyty."
                    : i18n.language === 'en'
                    ? "Personal data is stored for the period necessary to achieve the purposes for which it was collected, in accordance with applicable law. Booking data is stored for 2 years from the last visit."
                    : i18n.language === 'ua'
                    ? "Персональні дані зберігаються протягом періоду, необхідного для досягнення цілей, для яких вони були зібрані, відповідно до чинного законодавства. Дані бронювання зберігаються протягом 2 років з моменту останнього візиту."
                    : "Персональные данные хранятся в течение периода, необходимого для достижения целей, для которых они были собраны, в соответствии с действующим законодательством. Данные бронирования хранятся в течение 2 лет с момента последнего визита."}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-display font-semibold text-pearl mb-4">
                  6. {i18n.language === 'pl' ? "Pliki Cookies" : i18n.language === 'en' ? "Cookies" : i18n.language === 'ua' ? "Файли Cookies" : "Файлы Cookies"}
                </h2>
                <p className="leading-relaxed">
                  {i18n.language === 'pl'
                    ? "Nasza strona używa plików cookies w celu zapewnienia prawidłowego funkcjonowania, analizy ruchu oraz dostosowania treści do preferencji użytkowników. Możesz zmienić ustawienia cookies w przeglądarce."
                    : i18n.language === 'en'
                    ? "Our website uses cookies to ensure proper functioning, traffic analysis, and content customization according to user preferences. You can change cookie settings in your browser."
                    : i18n.language === 'ua'
                    ? "Наш вебсайт використовує файли cookies для забезпечення правильної роботи, аналізу трафіку та налаштування контенту згідно з перевагами користувачів. Ви можете змінити налаштування cookies у вашому браузері."
                    : "Наш веб-сайт использует файлы cookies для обеспечения правильной работы, анализа трафика и настройки контента в соответствии с предпочтениями пользователей. Вы можете изменить настройки cookies в вашем браузере."}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-display font-semibold text-pearl mb-4">
                  7. {i18n.language === 'pl' ? "Udostępnianie Danych" : i18n.language === 'en' ? "Data Sharing" : i18n.language === 'ua' ? "Надання Даних" : "Передача Данных"}
                </h2>
                <p className="leading-relaxed">
                  {i18n.language === 'pl'
                    ? "Twoje dane mogą być udostępniane podmiotom trzecim wyłącznie w celu realizacji usług (np. systemy płatności, systemy rezerwacyjne). Nie sprzedajemy ani nie udostępniamy danych innym podmiotom w celach marketingowych."
                    : i18n.language === 'en'
                    ? "Your data may be shared with third parties exclusively for service realization (e.g., payment systems, booking systems). We do not sell or share data with other entities for marketing purposes."
                    : i18n.language === 'ua'
                    ? "Ваші дані можуть надаватися третім особам виключно з метою реалізації послуг (наприклад, платіжні системи, системи бронювання). Ми не продаємо і не надаємо дані іншим особам з маркетингових цілей."
                    : "Ваши данные могут передаваться третьим лицам исключительно для оказания услуг (например, платежные системы, системы бронирования). Мы не продаем и не передаем данные другим лицам в маркетинговых целях."}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-display font-semibold text-pearl mb-4">
                  8. {i18n.language === 'pl' ? "Bezpieczeństwo Danych" : i18n.language === 'en' ? "Data Security" : i18n.language === 'ua' ? "Безпека Даних" : "Безопасность Данных"}
                </h2>
                <p className="leading-relaxed">
                  {i18n.language === 'pl'
                    ? "Stosujemy odpowiednie środki techniczne i organizacyjne w celu ochrony danych osobowych przed utratą, nieuprawnionym dostępem lub niewłaściwym przetwarzaniem. Dostęp do danych mają wyłącznie upoważnione osoby."
                    : i18n.language === 'en'
                    ? "We apply appropriate technical and organizational measures to protect personal data against loss, unauthorized access, or improper processing. Access to data is limited to authorized persons only."
                    : i18n.language === 'ua'
                    ? "Ми застосовуємо відповідні технічні та організаційні заходи для захисту персональних даних від втрати, несанкціонованого доступу або неправильної обробки. Доступ до даних мають лише уповноважені особи."
                    : "Мы применяем соответствующие технические и организационные меры для защиты персональных данных от потери, несанкционированного доступа или неправильной обработки. Доступ к данным имеют только уполномоченные лица."}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-display font-semibold text-pearl mb-4">
                  9. {i18n.language === 'pl' ? "Kontakt w Sprawie Prywatności" : i18n.language === 'en' ? "Privacy Contact" : i18n.language === 'ua' ? "Контакт з Приватності" : "Контакт по вопросам конфиденциальности"}
                </h2>
                <p className="leading-relaxed mb-4">
                  {i18n.language === 'pl'
                    ? "W sprawach związanych z przetwarzaniem danych osobowych możesz skontaktować się z nami:"
                    : i18n.language === 'en'
                    ? "For matters related to personal data processing, you can contact us:"
                    : i18n.language === 'ua'
                    ? "З питань, пов'язаних з обробкою персональних даних, ви можете зв'язатися з нами:"
                    : "По вопросам, связанным с обработкой персональных данных, вы можете связаться с нами:"}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{i18n.language === 'pl' ? "Email: privacy@mariia-hub.pl" : i18n.language === 'en' ? "Email: privacy@mariia-hub.pl" : i18n.language === 'ua' ? "Email: privacy@mariia-hub.pl" : "Email: privacy@mariia-hub.pl"}</li>
                  <li>{i18n.language === 'pl' ? "Telefon: +48 123 456 789" : i18n.language === 'en' ? "Phone: +48 123 456 789" : i18n.language === 'ua' ? "Телефон: +48 123 456 789" : "Телефон: +48 123 456 789"}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-display font-semibold text-pearl mb-4">
                  10. {i18n.language === 'pl' ? "Zmiany w Polityce" : i18n.language === 'en' ? "Policy Changes" : i18n.language === 'ua' ? "Зміни в Політиці" : "Изменения в Политике"}
                </h2>
                <p className="leading-relaxed">
                  {i18n.language === 'pl'
                    ? "Zastrzegamy sobie prawo do wprowadzania zmian w niniejszej Polityce Prywatności. Wszelkie zmiany będą publikowane na stronie internetowej i wchodzą w życie z dniem publikacji."
                    : i18n.language === 'en'
                    ? "We reserve the right to make changes to this Privacy Policy. All changes will be published on the website and will take effect on the date of publication."
                    : i18n.language === 'ua'
                    ? "Ми залишаємо за собою право вносити зміни до цієї Політики Конфіденційності. Усі зміни будуть публікуватися на вебсайті і набуватимуть чинності з дня публікації."
                    : "Мы оставляем за собой право вносить изменения в настоящую Политику Конфиденциальности. Все изменения будут публиковаться на веб-сайте и вступать в силу с даты публикации."}
                </p>
              </section>

            </div>
          </div>
        </div>
      </section>

      <Footer />
      <MobileFooter mode="beauty" />
    </div>
  );
};

export default PrivacyPolicy;