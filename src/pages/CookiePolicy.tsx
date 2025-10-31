import { useTranslation } from "react-i18next";

import { SEO } from "@/components/SEO";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileFooter from "@/components/MobileFooter";

const CookiePolicy = () => {
  const { i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Cookie Policy — How We Use Cookies | mariiaborysevych"
        description="Learn how mariiaborysevych uses cookies and similar technologies to enhance your experience on our website."
        keywords="cookie policy, cookies, privacy, tracking, GDPR compliance"
      />
      <Navigation />

      {/* Header */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-16">
        <div className="container mx-auto px-6 md:px-8 max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold text-pearl leading-tight tracking-tight mb-6">
            {i18n.language === 'pl' ? "Polityka Cookies" : i18n.language === 'en' ? "Cookie Policy" : i18n.language === 'ua' ? "Політика Cookies" : "Политика Cookies"}
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
                  1. {i18n.language === 'pl' ? "Czym są Cookies?" : i18n.language === 'en' ? "What are Cookies?" : i18n.language === 'ua' ? "Що таке Cookies?" : "Что такое Cookies?"}
                </h2>
                <p className="leading-relaxed">
                  {i18n.language === 'pl'
                    ? "Cookies to małe pliki tekstowe, które są przechowywane na Twoim urządzeniu (komputerze, telefonie lub tablecie) podczas odwiedzania stron internetowych. Pliki cookies pozwalają rozpoznać Twoją przeglądarkę przy kolejnych odwiedzinach."
                    : i18n.language === 'en'
                    ? "Cookies are small text files that are stored on your device (computer, phone, or tablet) when you visit websites. Cookies allow your browser to be recognized on subsequent visits."
                    : i18n.language === 'ua'
                    ? "Cookies - це невеликі текстові файли, які зберігаються на вашому пристрої (комп'ютері, телефоні або планшеті) під час відвідування вебсайтів. Файли cookies дозволяють розпізнати ваш браузер при наступних візитах."
                    : "Cookies - это небольшие текстовые файлы, которые сохраняются на вашем устройстве (компьютере, телефоне или планшете) при посещении веб-сайтов. Файлы cookies позволяют распознать ваш браузер при последующих посещениях."}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-display font-semibold text-pearl mb-4">
                  2. {i18n.language === 'pl' ? "Jak Używamy Cookies" : i18n.language === 'en' ? "How We Use Cookies" : i18n.language === 'ua' ? "Як Ми Використовуємо Cookies" : "Как Мы Используем Cookies"}
                </h2>
                <p className="leading-relaxed mb-4">
                  {i18n.language === 'pl'
                    ? "Nasza strona używa różnych typów cookies w następujących celach:"
                    : i18n.language === 'en'
                    ? "Our website uses different types of cookies for the following purposes:"
                    : i18n.language === 'ua'
                    ? "Наш вебсайт використовує різні типи cookies з наступних цілей:"
                    : "Наш веб-сайт использует различные типы cookies для следующих целей:"}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{i18n.language === 'pl' ? "Cookies niezbędne – niezbędne do działania witryny" : i18n.language === 'en' ? "Essential cookies – necessary for the website to function" : i18n.language === 'ua' ? "Необхідні cookies – необхідні для роботи сайту" : "Необходимые cookies – необходимые для работы сайта"}</li>
                  <li>{i18n.language === 'pl' ? "Cookies analityczne – do analizy ruchu i sposobu korzystania ze strony" : i18n.language === 'en' ? "Analytics cookies – to analyze traffic and how the site is used" : i18n.language === 'ua' ? "Аналітичні cookies – для аналізу трафіку та способу використання сайту" : "Аналитические cookies – для анализа трафика и использования сайта"}</li>
                  <li>{i18n.language === 'pl' ? "Cookies funkcjonalne – do zapamiętywania preferencji użytkownika" : i18n.language === 'en' ? "Functional cookies – to remember user preferences" : i18n.language === 'ua' ? "Функціональні cookies – для запам'ятовування преференцій користувача" : "Функциональные cookies – для запоминания предпочтений пользователя"}</li>
                  <li>{i18n.language === 'pl' ? "Cookies marketingowe – do personalizacji reklam i treści" : i18n.language === 'en' ? "Marketing cookies – to personalize ads and content" : i18n.language === 'ua' ? "Маркетингові cookies – для персоналізації реклами та контенту" : "Маркетинговые cookies – для персонализации рекламы и контента"}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-display font-semibold text-pearl mb-4">
                  3. {i18n.language === 'pl' ? "Rodzaje Cookies Używanych na Stronie" : i18n.language === 'en' ? "Types of Cookies Used on Our Website" : i18n.language === 'ua' ? "Типи Cookies, що Використовуються на Сайті" : "Типы Cookies, Используемые на Нашем Сайте"}
                </h2>
                <p className="leading-relaxed mb-4">
                  {i18n.language === 'pl'
                    ? "Poniżej znajduje się szczegółowy opis cookies używanych na naszej stronie:"
                    : i18n.language === 'en'
                    ? "Below is a detailed description of cookies used on our website:"
                    : i18n.language === 'ua'
                    ? "Нижче наведено детальний опис cookies, що використовуються на нашому сайті:"
                    : "Ниже приведено подробное описание cookies, используемых на нашем сайте:"}
                </p>

                <div className="space-y-6">
                  <div className="glass-card p-6 rounded-2xl border border-champagne/20">
                    <h3 className="text-xl font-semibold text-pearl mb-3">
                      {i18n.language === 'pl' ? "Cookies Niezbędne" : i18n.language === 'en' ? "Essential Cookies" : i18n.language === 'ua' ? "Необхідні Cookies" : "Необходимые Cookies"}
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li>• {i18n.language === 'pl' ? "session_id – identyfikator sesji" : i18n.language === 'en' ? "session_id – session identifier" : i18n.language === 'ua' ? "session_id – ідентифікатор сесії" : "session_id – идентификатор сессии"}</li>
                      <li>• {i18n.language === 'pl' ? "csrf_token – ochrona przed atakami CSRF" : i18n.language === 'en' ? "csrf_token – protection against CSRF attacks" : i18n.language === 'ua' ? "csrf_token – захист від CSRF атак" : "csrf_token – защита от CSRF атак"}</li>
                      <li>• {i18n.language === 'pl' ? "auth_token – uwierzytelnienie użytkownika" : i18n.language === 'en' ? "auth_token – user authentication" : i18n.language === 'ua' ? "auth_token – автентифікація користувача" : "auth_token – аутентификация пользователя"}</li>
                    </ul>
                  </div>

                  <div className="glass-card p-6 rounded-2xl border border-champagne/20">
                    <h3 className="text-xl font-semibold text-pearl mb-3">
                      {i18n.language === 'pl' ? "Cookies Analityczne" : i18n.language === 'en' ? "Analytics Cookies" : i18n.language === 'ua' ? "Аналітичні Cookies" : "Аналитические Cookies"}
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li>• {i18n.language === 'pl' ? "_ga – Google Analytics identyfikator użytkownika" : i18n.language === 'en' ? "_ga – Google Analytics user identifier" : i18n.language === 'ua' ? "_ga – Google Analytics ідентифікатор користувача" : "_ga – Google Analytics идентификатор пользователя"}</li>
                      <li>• {i18n.language === 'pl' ? "_gid – Google Analytics identyfikator sesji" : i18n.language === 'en' ? "_gid – Google Analytics session identifier" : i18n.language === 'ua' ? "_gid – Google Analytics ідентифікатор сесії" : "_gid – Google Analytics идентификатор сессии"}</li>
                      <li>• {i18n.language === 'pl' ? "_gat – Google Analytics ograniczenie częstotliwości" : i18n.language === 'en' ? "_gat – Google Analytics rate limiting" : i18n.language === 'ua' ? "_gat – Google Analytics обмеження частоти" : "_gat – Google Analytics ограничение частоты"}</li>
                    </ul>
                  </div>

                  <div className="glass-card p-6 rounded-2xl border border-champagne/20">
                    <h3 className="text-xl font-semibold text-pearl mb-3">
                      {i18n.language === 'pl' ? "Cookies Funkcjonalne" : i18n.language === 'en' ? "Functional Cookies" : i18n.language === 'ua' ? "Функціональні Cookies" : "Функциональные Cookies"}
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li>• {i18n.language === 'pl' ? "language – preferencje językowe" : i18n.language === 'en' ? "language – language preferences" : i18n.language === 'ua' ? "language – мовні преференції" : "language – языковые предпочтения"}</li>
                      <li>• {i18n.language === 'pl' ? "currency – preferencje walutowe" : i18n.language === 'en' ? "currency – currency preferences" : i18n.language === 'ua' ? "currency – валютні преференції" : "currency – валютные предпочтения"}</li>
                      <li>• {i18n.language === 'pl' ? "theme – preferencje wyglądu strony" : i18n.language === 'en' ? "theme – website appearance preferences" : i18n.language === 'ua' ? "theme – преференції вигляду сайту" : "theme – предпочтения внешнего вида сайта"}</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-display font-semibold text-pearl mb-4">
                  4. {i18n.language === 'pl' ? "Zarządzanie Cookies" : i18n.language === 'en' ? "Managing Cookies" : i18n.language === 'ua' ? "Керування Cookies" : "Управление Cookies"}
                </h2>
                <p className="leading-relaxed mb-4">
                  {i18n.language === 'pl'
                    ? "Możesz zarządzać plikami cookies na kilka sposobów:"
                    : i18n.language === 'en'
                    ? "You can manage cookies in several ways:"
                    : i18n.language === 'ua'
                    ? "Ви можете керувати файлами cookies кількома способами:"
                    : "Вы можете управлять файлами cookies несколькими способами:"}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{i18n.language === 'pl' ? "Przez ustawienia przeglądarki internetowej" : i18n.language === 'en' ? "Through your web browser settings" : i18n.language === 'ua' ? "Через налаштування веббраузера" : "Через настройки веб-браузера"}</li>
                  <li>{i18n.language === 'pl' ? "Poprzez panel zgód cookies na naszej stronie" : i18n.language === 'en' ? "Through the cookies consent panel on our website" : i18n.language === 'ua' ? "Через панель згод cookies на нашому сайті" : "Через панель согласия cookies на нашем сайте"}</li>
                  <li>{i18n.language === 'pl' ? "Korzystając z narzędzi do blokowania cookies stron trzecich" : i18n.language === 'en' ? "Using tools to block third-party cookies" : i18n.language === 'ua' ? "Використовуючи інструменти для блокування cookies третіх сторін" : "Используя инструменты для блокировки cookies третьих лиц"}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-display font-semibold text-pearl mb-4">
                  5. {i18n.language === 'pl' ? "Czas Przechowywania Cookies" : i18n.language === 'en' ? "Cookie Retention Period" : i18n.language === 'ua' ? "Термін Зберігання Cookies" : "Срок Хранения Cookies"}
                </h2>
                <p className="leading-relaxed">
                  {i18n.language === 'pl'
                    ? "Czas przechowywania cookies zależy od ich typu: sesyjne cookies są usuwane po zamknięciu przeglądarki, a trwałe cookies mogą być przechowywane od kilku godzin do kilku lat. Niezbędne cookies są przechowywane przez cały okres sesji."
                    : i18n.language === 'en'
                    ? "The retention period of cookies depends on their type: session cookies are deleted when the browser is closed, while persistent cookies may be stored from a few hours to several years. Essential cookies are stored for the entire session duration."
                    : i18n.language === 'ua'
                    ? "Термін зберігання cookies залежить від їх типу: сесійні cookies видаляються після закриття браузера, а постійні cookies можуть зберігатися від кількох годин до кількох років. Необхідні cookies зберігаються протягом усього періоду сесії."
                    : "Срок хранения cookies зависит от их типа: сессионные cookies удаляются при закрытии браузера, а постоянные cookies могут храниться от нескольких часов до нескольких лет. Необходимые cookies хранятся в течение всей сессии."}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-display font-semibold text-pearl mb-4">
                  6. {i18n.language === 'pl' ? "Cookies Stron Trzecich" : i18n.language === 'en' ? "Third-Party Cookies" : i18n.language === 'ua' ? "Cookies Третіх Сторін" : "Cookies Третьих Лиц"}
                </h2>
                <p className="leading-relaxed mb-4">
                  {i18n.language === 'pl'
                    ? "Nasza strona może używać cookies stron trzecich w następujących celach:"
                    : i18n.language === 'en'
                    ? "Our website may use third-party cookies for the following purposes:"
                    : i18n.language === 'ua'
                    ? "Наш сайт може використовувати cookies третіх сторін з наступних цілей:"
                    : "Наш веб-сайт может использовать cookies третьих лиц для следующих целей:"}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{i18n.language === 'pl' ? "Google Analytics – analiza ruchu na stronie" : i18n.language === 'en' ? "Google Analytics – website traffic analysis" : i18n.language === 'ua' ? "Google Analytics – аналіз трафіку на сайті" : "Google Analytics – анализ трафика на сайте"}</li>
                  <li>{i18n.language === 'pl' ? "Google Ads – personalizacja reklam" : i18n.language === 'en' ? "Google Ads – ad personalization" : i18n.language === 'ua' ? "Google Ads – персоналізація реклами" : "Google Ads – персонализация рекламы"}</li>
                  <li>{i18n.language === 'pl' ? "Facebook Pixel – śledzenie konwersji" : i18n.language === 'en' ? "Facebook Pixel – conversion tracking" : i18n.language === 'ua' ? "Facebook Pixel – відстеження конверсій" : "Facebook Pixel – отслеживание конверсий"}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-display font-semibold text-pearl mb-4">
                  7. {i18n.language === 'pl' ? "Skutki Wyłączenia Cookies" : i18n.language === 'en' ? "Effects of Disabling Cookies" : i18n.language === 'ua' ? "Наслідки Вимкнення Cookies" : "Последствия Отключения Cookies"}
                </h2>
                <p className="leading-relaxed">
                  {i18n.language === 'pl'
                    ? "Wyłączenie cookies może wpłynąć na funkcjonalność strony. Niektóre funkcje mogą nie działać poprawnie, a doświadczenie użytkownika może być ograniczone. Niezbędne cookies są wymagane do prawidłowego działania serwisu."
                    : i18n.language === 'en'
                    ? "Disabling cookies may affect website functionality. Some features may not work properly, and user experience may be limited. Essential cookies are required for the service to function correctly."
                    : i18n.language === 'ua'
                    ? "Вимкнення cookies може вплинути на функціональність сайту. Деякі функції можуть працювати неправильно, а досвід користувача може бути обмеженим. Необхідні cookies потрібні для правильної роботи сервісу."
                    : "Отключение cookies может повлиять на функциональность веб-сайта. Некоторые функции могут работать некорректно, а пользовательский опыт может быть ограничен. Необходимые cookies требуются для корректной работы сервиса."}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-display font-semibold text-pearl mb-4">
                  8. {i18n.language === 'pl' ? "Aktualizacje Polityki Cookies" : i18n.language === 'en' ? "Updates to Cookie Policy" : i18n.language === 'ua' ? "Оновлення Політики Cookies" : "Обновления Политики Cookies"}
                </h2>
                <p className="leading-relaxed">
                  {i18n.language === 'pl'
                    ? "Zastrzegamy sobie prawo do aktualizacji niniejszej Polityki Cookies. Zmiany będą publikowane na tej stronie i wchodzą w życie z dniem publikacji. Regularnie sprawdzaj tę politykę, aby być na bieżąco."
                    : i18n.language === 'en'
                    ? "We reserve the right to update this Cookie Policy. Changes will be published on this page and will take effect on the date of publication. Regularly check this policy to stay informed."
                    : i18n.language === 'ua'
                    ? "Ми залишаємо за собою право оновлювати цю Політику Cookies. Зміни будуть публікуватися на цій сторінці і набуватимуть чинності з дня публікації. Регулярно перевіряйте цю політику, щоб бути в курсі."
                    : "Мы оставляем за собой право обновлять настоящую Политику Cookies. Изменения будут публиковаться на этой странице и вступать в силу с даты публикации. Регулярно проверяйте эту политику, чтобы быть в курсе."}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-display font-semibold text-pearl mb-4">
                  9. {i18n.language === 'pl' ? "Kontakt" : i18n.language === 'en' ? "Contact" : i18n.language === 'ua' ? "Контакт" : "Контакт"}
                </h2>
                <p className="leading-relaxed mb-4">
                  {i18n.language === 'pl'
                    ? "Jeśli masz pytania dotyczące naszej Polityki Cookies, skontaktuj się z nami:"
                    : i18n.language === 'en'
                    ? "If you have questions about our Cookie Policy, contact us:"
                    : i18n.language === 'ua'
                    ? "Якщо у вас є питання щодо нашої Політики Cookies, зв'яжіться з нами:"
                    : "Если у вас есть вопросы о нашей Политике Cookies, свяжитесь с нами:"}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{i18n.language === 'pl' ? "Email: privacy@mariia-hub.pl" : i18n.language === 'en' ? "Email: privacy@mariia-hub.pl" : i18n.language === 'ua' ? "Email: privacy@mariia-hub.pl" : "Email: privacy@mariia-hub.pl"}</li>
                  <li>{i18n.language === 'pl' ? "Telefon: +48 123 456 789" : i18n.language === 'en' ? "Phone: +48 123 456 789" : i18n.language === 'ua' ? "Телефон: +48 123 456 789" : "Телефон: +48 123 456 789"}</li>
                </ul>
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

export default CookiePolicy;