import { useTranslation } from "react-i18next";
import { Shield, Eye, Trash2, FileText, Lock, Users, CheckCircle, AlertCircle } from "lucide-react";

import { SEO } from "@/components/SEO";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileFooter from "@/components/MobileFooter";
import { GDPRComplianceCenter } from "@/components/gdpr/GDPRComplianceCenter";

const GDPRCompliance = () => {
  const { i18n } = useTranslation();

  const rights = [
    {
      icon: Eye,
      title: i18n.language === 'pl' ? "Prawo Dostępu" : i18n.language === 'en' ? "Right to Access" : i18n.language === 'ua' ? "Право на Доступ" : "Право на Доступ",
      description: i18n.language === 'pl'
        ? "Możesz poprosić o kopię swoich danych osobowych, które przetwarzamy."
        : i18n.language === 'en'
        ? "You can request a copy of your personal data that we process."
        : i18n.language === 'ua'
        ? "Ви можете запросити копію своїх персональних даних, які ми обробляємо."
        : "Вы можете запросить копию своих персональных данных, которые мы обрабатываем."
    },
    {
      icon: FileText,
      title: i18n.language === 'pl' ? "Prawo do Informacji" : i18n.language === 'en' ? "Right to Information" : i18n.language === 'ua' ? "Право на Інформацію" : "Право на Информацию",
      description: i18n.language === 'pl'
        ? "Masz prawo wiedzieć, które dane przetwarzamy, w jakim celu i na jakiej podstawie."
        : i18n.language === 'en'
        ? "You have the right to know what data we process, for what purpose and on what basis."
        : i18n.language === 'ua'
        ? "Ви маєте право знати, які дані ми обробляємо, з якою метою і на якій основі."
        : "Вы имеете право знать, какие данные мы обрабатываем, для какой цели и на каком основании."
    },
    {
      icon: Trash2,
      title: i18n.language === 'pl' ? "Prawo do Usunięcia" : i18n.language === 'en' ? "Right to Erasure" : i18n.language === 'ua' ? "Право на Видалення" : "Право на Удаление",
      description: i18n.language === 'pl'
        ? "Możesz zażądać usunięcia swoich danych osobowych w określonych sytuacjach."
        : i18n.language === 'en'
        ? "You can request deletion of your personal data in specific situations."
        : i18n.language === 'ua'
        ? "Ви можете вимагати видалення своїх персональних даних у певних ситуаціях."
        : "Вы можете потребовать удаления своих персональных данных в определенных ситуациях."
    },
    {
      icon: Shield,
      title: i18n.language === 'pl' ? "Prawo do Ograniczenia" : i18n.language === 'en' ? "Right to Restriction" : i18n.language === 'ua' ? "Право на Обмеження" : "Право на Ограничение",
      description: i18n.language === 'pl'
        ? "Możesz zażądać ograniczenia przetwarzania swoich danych osobowych."
        : i18n.language === 'en'
        ? "You can request restriction of processing of your personal data."
        : i18n.language === 'ua'
        ? "Ви можете вимагати обмеження обробки своїх персональних даних."
        : "Вы можете потребовать ограничения обработки своих персональных данных."
    },
    {
      icon: Users,
      title: i18n.language === 'pl' ? "Prawo do Przenoszenia" : i18n.language === 'en' ? "Right to Portability" : i18n.language === 'ua' ? "Право на Перенесення" : "Право на Перенос",
      description: i18n.language === 'pl'
        ? "Masz prawo otrzymać swoje dane w ustrukturyzowanym, powszechnie używanym formacie."
        : i18n.language === 'en'
        ? "You have the right to receive your data in a structured, commonly used format."
        : i18n.language === 'ua'
        ? "Ви маєте право отримати свої дані в структурованому, загальновживаному форматі."
        : "Вы имеете право получить свои данные в структурированном, общеупотребительном формате."
    },
    {
      icon: Lock,
      title: i18n.language === 'pl' ? "Prawo do Sprzeciwu" : i18n.language === 'en' ? "Right to Object" : i18n.language === 'ua' ? "Право на Заперечення" : "Право на Возражение",
      description: i18n.language === 'pl'
        ? "Możesz sprzeciwić się przetwarzaniu swoich danych osobowych w określonych sytuacjach."
        : i18n.language === 'en'
        ? "You can object to the processing of your personal data in specific situations."
        : i18n.language === 'ua'
        ? "Ви можете заперечити проти обробки своїх персональних даних у певних ситуаціях."
        : "Вы можете возразить против обработки своих персональных данных в определенных ситуациях."
    }
  ];

  const measures = [
    {
      title: i18n.language === 'pl' ? "Szyfrowanie Danych" : i18n.language === 'en' ? "Data Encryption" : i18n.language === 'ua' ? "Шифрування Даних" : "Шифрование Данных",
      description: i18n.language === 'pl'
        ? "Wszystkie dane są szyfrowane przy użyciu najnowszych standardów (TLS 1.3, AES-256)."
        : i18n.language === 'en'
        ? "All data is encrypted using the latest standards (TLS 1.3, AES-256)."
        : i18n.language === 'ua'
        ? "Усі дані шифруються з використанням найновіших стандартів (TLS 1.3, AES-256)."
        : "Все данные шифруются с использованием новейших стандартов (TLS 1.3, AES-256)."
    },
    {
      title: i18n.language === 'pl' ? "Kontrola Dostępu" : i18n.language === 'en' ? "Access Control" : i18n.language === 'ua' ? "Контроль Доступу" : "Контроль Доступа",
      description: i18n.language === 'pl'
        ? "Tylko upoważniony personel ma dostęp do danych osobowych, z logowaniem każdej operacji."
        : i18n.language === 'en'
        ? "Only authorized personnel has access to personal data, with logging of every operation."
        : i18n.language === 'ua'
        ? "Тільки уповноважений персонал має доступ до персональних даних, з логуванням кожної операції."
        : "Только уполномоченный персонал имеет доступ к персональным данным, с логированием каждой операции."
    },
    {
      title: i18n.language === 'pl' ? "Regularne Audyty" : i18n.language === 'en' ? "Regular Audits" : i18n.language === 'ua' ? "Регулярні Аудити" : "Регулярные Аудиты",
      description: i18n.language === 'pl'
        ? "Przeprowadzamy regularne audyty bezpieczeństwa w celu weryfikacji zgodności z RODO."
        : i18n.language === 'en'
        ? "We conduct regular security audits to verify GDPR compliance."
        : i18n.language === 'ua'
        ? "Ми проводимо регулярні аудити безпеки для перевірки відповідності GDPR."
        : "Мы проводим регулярные аудиты безопасности для проверки соответствия GDPR."
    },
    {
      title: i18n.language === 'pl' ? "Szkolenia Personelu" : i18n.language === 'en' ? "Staff Training" : i18n.language === 'ua' ? "Навчання Персоналу" : "Обучение Персонала",
      description: i18n.language === 'pl'
        ? "Wszyscy pracownicy przeszli szkolenia z zakresu ochrony danych i RODO."
        : i18n.language === 'en'
        ? "All employees have undergone data protection and GDPR training."
        : i18n.language === 'ua'
        ? "Усі співробітники пройшли навчання з захисту даних та GDPR."
        : "Все сотрудники прошли обучение по защите данных и GDPR."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="GDPR Compliance — Data Protection Rights | mariiaborysevych"
        description="Learn about your rights under GDPR and how mariiaborysevych protects your personal data in compliance with EU regulations."
        keywords="GDPR, data protection, privacy rights, EU regulations, personal data, compliance"
      />
      <Navigation />

      {/* Interactive GDPR Compliance Center */}
      <GDPRComplianceCenter />

      {/* Static Information Section */}

      {/* Header */}
      <section className="relative bg-gradient-to-b from-background via-background to-muted/10 pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="absolute inset-0 bg-gradient-to-r from-rose/20 via-transparent to-background/30" />

        <div className="container mx-auto px-6 md:px-8 max-w-7xl relative z-10">
          <div className="max-w-4xl space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass-accent border border-champagne/20 animate-fade-rise">
              <Shield className="w-4 h-4 text-champagne-200" />
              <span className="text-xs font-body tracking-[0.3em] uppercase font-light text-champagne-200">
                {i18n.language === 'pl' ? "ZGODNOŚĆ Z RODO" : i18n.language === 'en' ? "GDPR COMPLIANCE" : i18n.language === 'ua' ? "ВІДПОВІДНІСТЬ GDPR" : "СООТВЕТСТВИЕ GDPR"}
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.85] text-pearl tracking-tight font-light font-display animate-fade-rise">
              <div className="space-y-2">
                <span className="block">
                  {i18n.language === 'pl' ? "Ochrona Twoich" : i18n.language === 'en' ? "Protecting Your" : i18n.language === 'ua' ? "Захист Ваших" : "Защита Ваших"}
                </span>
                <span className="block bg-gradient-to-r from-rose via-champagne-200 to-champagne bg-clip-text text-transparent font-normal">
                  {i18n.language === 'pl' ? "Danych Osobowych" : i18n.language === 'en' ? "Personal Data" : i18n.language === 'ua' ? "Персональних Даних" : "Персональных Данных"}
                </span>
              </div>
            </h1>

            <div className="w-24 h-[3px] bg-gradient-to-r from-rose via-champagne to-bronze rounded-full shadow-luxury animate-fade-rise-delay" />

            <p className="text-xl sm:text-2xl text-pearl/80 leading-relaxed font-light font-body max-w-3xl animate-fade-rise-delay">
              {i18n.language === 'pl'
                ? "Zgodnie z RODO (RODO/GDPR), chronimy Twoje dane osobowe i zapewniamy pełną transparentność w ich przetwarzaniu."
                : i18n.language === 'en'
                ? "In accordance with GDPR, we protect your personal data and ensure full transparency in its processing."
                : i18n.language === 'ua'
                ? "Відповідно до GDPR, ми захищаємо ваші персональні дані та забезпечуємо повну прозорість у їх обробці."
                : "В соответствии с GDPR, мы защищаем ваши персональные данные и обеспечиваем полную прозрачность в их обработке."}
            </p>
          </div>
        </div>
      </section>

      {/* Rights Section */}
      <section className="py-20 md:py-24 bg-gradient-to-b from-muted/10 to-transparent">
        <div className="container mx-auto px-6 md:px-8 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-semibold text-pearl leading-tight tracking-tight mb-4">
              {i18n.language === 'pl' ? "Twoje Prawa zgodnie z RODO" : i18n.language === 'en' ? "Your GDPR Rights" : i18n.language === 'ua' ? "Ваші Права згідно з GDPR" : "Ваши Права согласно GDPR"}
            </h2>
            <p className="text-xl text-pearl/70 font-body max-w-2xl mx-auto">
              {i18n.language === 'pl'
                ? "Pełen zestaw praw, które przysługują Ci zgodnie z Rozporządzeniem o Ochronie Danych Osobowych"
                : i18n.language === 'en'
                ? "The complete set of rights available to you under the General Data Protection Regulation"
                : i18n.language === 'ua'
                ? "Повний набір прав, які належать вам згідно із Загальним регламентом про захист даних"
                : "Полный набор прав, доступных вам согласно Общему регламенту о защите данных"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rights.map((right, index) => (
              <div
                key={index}
                className="glass-card p-6 rounded-2xl border border-champagne/20 hover:border-champagne/40 transition-all duration-300 hover:scale-105 animate-fade-rise"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full glass-accent flex items-center justify-center flex-shrink-0">
                    <right.icon className="w-6 h-6 text-champagne-200" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-semibold text-pearl mb-2">
                      {right.title}
                    </h3>
                    <p className="text-pearl/70 font-body text-sm leading-relaxed">
                      {right.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Measures */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-6 md:px-8 max-w-7xl">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-semibold text-pearl leading-tight tracking-tight mb-4">
                {i18n.language === 'pl' ? "Środki Bezpieczeństwa" : i18n.language === 'en' ? "Security Measures" : i18n.language === 'ua' ? "Заходи Безпеки" : "Меры Безопасности"}
              </h2>
              <p className="text-xl text-pearl/70 font-body max-w-2xl mx-auto">
                {i18n.language === 'pl'
                  ? "Wdrożyliśmy rygorystyczne środki bezpieczeństwa w celu ochrony Twoich danych"
                  : i18n.language === 'en'
                  ? "We have implemented rigorous security measures to protect your data"
                  : i18n.language === 'ua'
                  ? "Ми впровадили суворі заходи безпеки для захисту ваших даних"
                  : "Мы внедрили строгие меры безопасности для защиты ваших данных"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {measures.map((measure, index) => (
                <div
                  key={index}
                  className="glass-card p-6 rounded-2xl border border-champagne/20 animate-fade-rise"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-champagne-200 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-display font-semibold text-pearl mb-2">
                        {measure.title}
                      </h3>
                      <p className="text-pearl/70 font-body text-sm leading-relaxed">
                        {measure.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 md:py-24 bg-gradient-to-r from-rose/10 via-champagne/10 to-bronze/10">
        <div className="container mx-auto px-6 md:px-8 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-pearl mb-4">
            {i18n.language === 'pl'
              ? "Masz Pytania dotyczące RODO?"
              : i18n.language === 'en'
              ? "Have GDPR Questions?"
              : i18n.language === 'ua'
              ? "Маєте Питання щодо GDPR?"
              : "Есть Вопросы по GDPR?"}
          </h2>
          <p className="text-xl text-pearl/80 font-body mb-8">
            {i18n.language === 'pl'
              ? "Nasz Inspektor Ochrony Danych jest do Twojej dyspozycji"
              : i18n.language === 'en'
              ? "Our Data Protection Officer is at your disposal"
              : i18n.language === 'ua'
              ? "Наш Офіцер з захисту даних до ваших послуг"
              : "Наш Офицер по защите данных в вашем распоряжении"}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:dpo@mariia-hub.pl"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-brand text-brand-foreground rounded-full font-medium shadow-luxury hover:shadow-luxury-lg transition-all duration-300 hover:scale-105"
            >
              <AlertCircle className="w-5 h-5" />
              <span>{i18n.language === 'pl' ? "Kontakt DPO" : i18n.language === 'en' ? "Contact DPO" : i18n.language === 'ua' ? "Контакт DPO" : "Контакт DPO"}</span>
            </a>
            <a
              href="/privacy"
              className="inline-flex items-center gap-3 px-8 py-4 glass-subtle text-pearl rounded-full font-medium border border-champagne/20 hover:bg-white/10 transition-all duration-300"
            >
              <FileText className="w-5 h-5" />
              <span>{i18n.language === 'pl' ? "Polityka Prywatności" : i18n.language === 'en' ? "Privacy Policy" : i18n.language === 'ua' ? "Політика Конфіденційності" : "Политика Конфиденциальности"}</span>
            </a>
          </div>
        </div>
      </section>

      {/* Compliance Statement */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-6 md:px-8 max-w-4xl">
          <div className="glass-card p-8 rounded-3xl border border-champagne/20">
            <h2 className="text-2xl font-display font-semibold text-pearl mb-6">
              {i18n.language === 'pl' ? "Oświadczenie o Zgodności" : i18n.language === 'en' ? "Compliance Statement" : i18n.language === 'ua' ? "Заява про Відповідність" : "Заявление о Соответствии"}
            </h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-pearl/80 font-body leading-relaxed mb-4">
                {i18n.language === 'pl'
                  ? "mariiaborysevych zobowiązuje się do ochrony prywatności i bezpieczeństwa danych osobowych zgodnie z Rozporządzeniem (UE) 2016/679 (RODO). Wdrożyliśmy odpowiednie środki techniczne i organizacyjne, aby zapewnić najwyższy poziom ochrony danych. Regularnie przeglądamy i aktualizujemy nasze procedury, aby zapewnić ciągłą zgodność z obowiązującymi przepisami."
                  : i18n.language === 'en'
                  ? "mariiaborysevych is committed to protecting privacy and security of personal data in accordance with Regulation (EU) 2016/679 (GDPR). We have implemented appropriate technical and organizational measures to ensure the highest level of data protection. We regularly review and update our procedures to ensure continuous compliance with applicable regulations."
                  : i18n.language === 'ua'
                  ? "mariiaborysevych зобов'язується захищати приватність і безпеку персональних даних відповідно до Регламенту (ЄС) 2016/679 (GDPR). Ми впровадили відповідні технічні та організаційні заходи, щоб забезпечити найвищий рівень захисту даних. Ми регулярно переглядаємо та оновлюємо наші процедури, щоб забезпечити постійну відповідність чинному законодавству."
                  : "mariiaborysevych обязуется защищать конфиденциальность и безопасность персональных данных в соответствии с Регламентом (ЕС) 2016/679 (GDPR). Мы внедрили соответствующие технические и организационные меры для обеспечения высочайшего уровня защиты данных. Мы регулярно пересматриваем и обновляем наши процедуры для обеспечения постоянного соответствия применимым нормам."}
              </p>
              <p className="text-pearl/60 font-body text-sm italic">
                {i18n.language === 'pl'
                  ? "Data ostatniej aktualizacji: 21 października 2025"
                  : i18n.language === 'en'
                  ? "Last updated: October 21, 2025"
                  : i18n.language === 'ua'
                  ? "Останнє оновлення: 21 жовтня 2025"
                  : "Последнее обновление: 21 октября 2025"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <MobileFooter mode="beauty" />
    </div>
  );
};

export default GDPRCompliance;