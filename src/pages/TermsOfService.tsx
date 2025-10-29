import { useTranslation } from "react-i18next";

import { SEO } from "@/components/SEO";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileFooter from "@/components/MobileFooter";

const TermsOfService = () => {
  const { i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Terms of Service — Legal Terms & Conditions | Mariia Hub"
        description="Terms of service and conditions for using Mariia Hub beauty and fitness services."
        keywords="terms of service, legal terms, conditions, agreement, policies"
      />
      <Navigation />

      {/* Header */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-16">
        <div className="container mx-auto px-6 md:px-8 max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold text-pearl leading-tight tracking-tight mb-6">
            {i18n.language === 'pl' ? "Regulamin Usług" : i18n.language === 'en' ? "Terms of Service" : i18n.language === 'ua' ? "Умови Надання Послуг" : "Условия Оказания Услуг"}
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
                  1. {i18n.language === 'pl' ? "Postanowienia Ogólne" : i18n.language === 'en' ? "General Terms" : i18n.language === 'ua' ? "Загальні Положення" : "Общие Положения"}
                </h2>
                <p className="leading-relaxed">
                  {i18n.language === 'pl'
                    ? "Niniejszy regulamin określa zasady świadczenia usług przez Mariia Hub z siedzibą w Warszawie, zwaną dalej 'Salonem'. Korzystanie z usług Salonu jest równoznaczne z akceptacją niniejszego regulaminu."
                    : i18n.language === 'en'
                    ? "These terms and conditions define the rules for providing services by Mariia Hub, based in Warsaw, hereinafter referred to as the 'Salon'. Use of the Salon's services is equivalent to acceptance of these terms."
                    : i18n.language === 'ua'
                    ? "Цей регламент визначає правила надання послуг Mariia Hub, що знаходиться у Варшаві, надалі називаною 'Салоном'. Використання послуг Салону є рівнозначним прийняттю цього регламенту."
                    : "Настоящие правила и условия определяют порядок оказания услуг Mariia Hub, находящейся в Варшаве, далее именуемой 'Салоном'. Использование услуг Салона равносильно принятию настоящих правил."}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-display font-semibold text-pearl mb-4">
                  2. {i18n.language === 'pl' ? "Zakres Usług" : i18n.language === 'en' ? "Scope of Services" : i18n.language === 'ua' ? "Обсяг Послуг" : "Объем Услуг"}
                </h2>
                <p className="leading-relaxed mb-4">
                  {i18n.language === 'pl'
                    ? "Salon świadczy następujące usługi:"
                    : i18n.language === 'en'
                    ? "The Salon provides the following services:"
                    : i18n.language === 'ua'
                    ? "Салон надає наступні послуги:"
                    : "Салон оказывает следующие услуги:"}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{i18n.language === 'pl' ? "Usługi makijażu permanentnego (microblading, ombre, combo brows)" : i18n.language === 'en' ? "Permanent makeup services (microblading, ombre, combo brows)" : i18n.language === 'ua' ? "Послуги перманентного макіяжу (мікроблейдинг, омбре, комбіновані брові)" : "Услуги перманентного макияжа (микроблейдинг, омбре, комбо брови)"}</li>
                  <li>{i18n.language === 'pl' ? "Stylizacja brwi i rzęs (laminacja, regulacja, przedłużanie)" : i18n.language === 'en' ? "Brow and lash styling (lamination, shaping, extensions)" : i18n.language === 'ua' ? "Стилізація брів та вій (ламінація, корекція, нарощування)" : "Стилизация бровей и ресниц (ламинация, коррекция, наращивание)"}</li>
                  <li>{i18n.language === 'pl' ? "Treningi personalne i programy fitness" : i18n.language === 'en' ? "Personal training and fitness programs" : i18n.language === 'ua' ? "Персональні тренування та фітнес програми" : "Персональные тренировки и фитнес программы"}</li>
                  <li>{i18n.language === 'pl' ? "Zabiegi pielęgnacyjne i regeneracyjne" : i18n.language === 'en' ? "Skincare and regeneration treatments" : i18n.language === 'ua' ? "Доглядові та регенеруючі процедури" : "Уходовые и регенерирующие процедуры"}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-display font-semibold text-pearl mb-4">
                  3. {i18n.language === 'pl' ? "Rezerwacja Wizyt" : i18n.language === 'en' ? "Booking Appointments" : i18n.language === 'ua' ? "Бронювання Візитів" : "Бронирование Визитов"}
                </h2>
                <p className="leading-relaxed mb-4">
                  {i18n.language === 'pl'
                    ? "Rezerwacji wizyt można dokonywać:"
                    : i18n.language === 'en'
                    ? "Appointments can be booked by:"
                    : i18n.language === 'ua'
                    ? "Бронювання візитів можна здійснювати:"
                    : "Бронирование визитов можно осуществлять:"}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{i18n.language === 'pl' ? "Telefonicznie pod numer +48 123 456 789" : i18n.language === 'en' ? "By phone at +48 123 456 789" : i18n.language === 'ua' ? "Телефонно за номером +48 123 456 789" : "По телефону +48 123 456 789"}</li>
                  <li>{i18n.language === 'pl' ? "Poprzez formularz online na stronie internetowej" : i18n.language === 'en' ? "Through the online form on the website" : i18n.language === 'ua' ? "Через онлайн-форму на вебсайті" : "Через онлайн-форму на сайте"}</li>
                  <li>{i18n.language === 'pl' ? "Osobiście w Salonie" : i18n.language === 'en' ? "In person at the Salon" : i18n.language === 'ua' ? "Особисто в Салоні" : "Лично в Салоне"}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-display font-semibold text-pearl mb-4">
                  4. {i18n.language === 'pl' ? "Ceny i Płatności" : i18n.language === 'en' ? "Prices and Payments" : i18n.language === 'ua' ? "Ціни та Оплати" : "Цены и Оплаты"}
                </h2>
                <p className="leading-relaxed">
                  {i18n.language === 'pl'
                    ? "Ceny usług są dostępne w cenniku na stronie internetowej Salonu. Płatności można dokonywać gotówką, kartą płatniczą lub przelewem bankowym. Wszystkie ceny podane są w złotych polskich i zawierają podatek VAT."
                    : i18n.language === 'en'
                    ? "Service prices are available in the price list on the Salon's website. Payments can be made in cash, by payment card or bank transfer. All prices are given in Polish zlotys and include VAT."
                    : i18n.language === 'ua'
                    ? "Ціни на послуги доступні в прайс-листі на вебсайті Салону. Оплату можна здійснювати готівкою, платіжною карткою або банківським переказом. Всі ціни вказані в польських злотих і включають ПДВ."
                    : "Цены на услуги доступны в прайс-листе на веб-сайте Салона. Оплату можно производить наличными, платежной картой или банковским переводом. Все цены указаны в польских злотых и включают НДС."}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-display font-semibold text-pearl mb-4">
                  5. {i18n.language === 'pl' ? "Anulowanie i Przełożenie Wizyt" : i18n.language === 'en' ? "Cancellation and Rescheduling" : i18n.language === 'ua' ? "Скасування та Перенесення Візитів" : "Отмена и Перенос Визитов"}
                </h2>
                <p className="leading-relaxed">
                  {i18n.language === 'pl'
                    ? "Klient ma prawo anulować lub przełożyć wizytę nie później niż 24 godziny przed planowanym terminem. W przypadku anulowania wizyty w późniejszym terminie, Salon może zażądać zapłaty za nieodbyte godziny."
                    : i18n.language === 'en'
                    ? "The client has the right to cancel or reschedule an appointment no later than 24 hours before the planned time. In case of cancellation at a later time, the Salon may demand payment for unused hours."
                    : i18n.language === 'ua'
                    ? "Клієнт має право скасувати або перенести візит не пізніше ніж за 24 години до запланованого часу. У разі скасування візиту в пізніший термін, Салон може вимагати оплати за невикористані години."
                    : "Клиент имеет право отменить или перенести визит не позднее чем за 24 часа до запланированного времени. В случае отмены в более поздний срок, Салон может потребовать оплату за неиспользованные часы."}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-display font-semibold text-pearl mb-4">
                  6. {i18n.language === 'pl' ? "Obowiązki Klienta" : i18n.language === 'en' ? "Client's Obligations" : i18n.language === 'ua' ? "Зобов'язання Клієнта" : "Обязательства Клиента"}
                </h2>
                <p className="leading-relaxed mb-4">
                  {i18n.language === 'pl'
                    ? "Klient zobowiązany jest do:"
                    : i18n.language === 'en'
                    ? "The client is obliged to:"
                    : i18n.language === 'ua'
                    ? "Клієнт зобов'язаний:"
                    : "Клиент обязан:"}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{i18n.language === 'pl' ? "Stawić się na umówioną wizytę w wyznaczonym czasie" : i18n.language === 'en' ? "Arrive for the scheduled appointment at the designated time" : i18n.language === 'ua' ? "Прибутти на узгоджений візит у визначений час" : "Прибыть на назначенный визит в указанное время"}</li>
                  <li>{i18n.language === 'pl' ? "Przestrzegać zaleceń dotyczących przygotowania do zabiegu" : i18n.language === 'en' ? "Follow recommendations regarding preparation for the treatment" : i18n.language === 'ua' ? "Дотримуватися рекомендацій щодо підготовки до процедури" : "Соблюдать рекомендации по подготовке к процедуре"}</li>
                  <li>{i18n.language === 'pl' ? "Poinformować o przeciwwskazaniach i alergiach" : i18n.language === 'en' ? "Inform about contraindications and allergies" : i18n.language === 'ua' ? "Повідомити про протипоказання та алергії" : "Сообщать о противопоказаниях и аллергиях"}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-display font-semibold text-pearl mb-4">
                  7. {i18n.language === 'pl' ? "Poufność" : i18n.language === 'en' ? "Confidentiality" : i18n.language === 'ua' ? "Конфіденційність" : "Конфиденциальность"}
                </h2>
                <p className="leading-relaxed">
                  {i18n.language === 'pl'
                    ? "Salon zobowiązuje się do zachowania poufności wszystkich informacji dotyczących Klienta, zgodnie z przepisami RODO. Szczegółowe zasady przetwarzania danych osobowych zawarte są w Polityce Prywatności."
                    : i18n.language === 'en'
                    ? "The Salon undertakes to maintain confidentiality of all information concerning the Client, in accordance with GDPR regulations. Detailed rules for processing personal data are contained in the Privacy Policy."
                    : i18n.language === 'ua'
                    ? "Салон зобов'язується зберігати конфіденційність усієї інформації, що стосується Клієнта, відповідно до регламентів GDPR. Детальні правила обробки персональних даних містяться в Політиці Конфіденційності."
                    : "Салон обязуется хранить конфиденциальность всей информации, касающейся Клиента, в соответствии с регламентами GDPR. Детальные правила обработки персональных данных содержатся в Политике Конфиденциальности."}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-display font-semibold text-pearl mb-4">
                  8. {i18n.language === 'pl' ? "Reklamacje" : i18n.language === 'en' ? "Complaints" : i18n.language === 'ua' ? "Скарги" : "Жалобы"}
                </h2>
                <p className="leading-relaxed">
                  {i18n.language === 'pl'
                    ? "Ewentualne reklamacje należy składać w formie pisemnej w terminie 7 dni od daty wykonania usługi. Salon rozpatruje reklamację w ciągu 14 dni od jej otrzymania."
                    : i18n.language === 'en'
                    ? "Any complaints should be submitted in writing within 7 days from the date of service provision. The Salon will consider the complaint within 14 days of its receipt."
                    : i18n.language === 'ua'
                    ? "Будь-які скарги сл подавати у письмовій формі протягом 7 днів з дати надання послуги. Салон розгляне скаргу протягом 14 днів з моменту її отримання."
                    : "Любые жалобы следует подавать в письменной форме в течение 7 дней с даты оказания услуги. Салон рассмотрит жалобу в течение 14 дней с момента ее получения."}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-display font-semibold text-pearl mb-4">
                  9. {i18n.language === 'pl' ? "Odpowiedzialność" : i18n.language === 'en' ? "Liability" : i18n.language === 'ua' ? "Відповідальність" : "Ответственность"}
                </h2>
                <p className="leading-relaxed">
                  {i18n.language === 'pl'
                    ? "Salon ponosi odpowiedzialność za szkody wynikające z nienależytego wykonania usługi, z wyłączeniem przypadku siły wyższej. Odpowiedzialność Salonu jest ograniczona do wartości wykonanej usługi."
                    : i18n.language === 'en'
                    ? "The Salon is liable for damages resulting from improper performance of the service, excluding force majeure. The Salon's liability is limited to the value of the performed service."
                    : i18n.language === 'ua'
                    ? "Салон несе відповідальність за збитки, що виникли внаслідок неналежного виконання послуги, за винятком випадку непереборної сили. Відповідальність Салону обмежена вартістю виконаної послуги."
                    : "Салон несет ответственность за убытки, возникшие вследствие ненадлежащего оказания услуги, за исключением случая непреодолимой силы. Ответственность Салона ограничена стоимостью оказанной услуги."}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-display font-semibold text-pearl mb-4">
                  10. {i18n.language === 'pl' ? "Postanowienia Końcowe" : i18n.language === 'en' ? "Final Provisions" : i18n.language === 'ua' ? "Кінцеві Положення" : "Заключительные Положения"}
                </h2>
                <p className="leading-relaxed">
                  {i18n.language === 'pl'
                    ? "W sprawach nieuregulowanych niniejszym regulaminem zastosowanie mają przepisy polskiego Kodeksu Cywilnego. Wszelkie spory będą rozstrzygane przez sąd właściwy dla siedziby Salonu."
                    : i18n.language === 'en'
                    ? "In matters not regulated by these terms and conditions, the provisions of the Polish Civil Code shall apply. All disputes will be resolved by the court competent for the Salon's seat."
                    : i18n.language === 'ua'
                    ? "У питаннях, не врегульованих цим регламентом, застосовуються положення польського Цивільного кодексу. Усі спори будуть вирішуватися судом, компетентним для місцезнаходження Салону."
                    : "В вопросах, не урегулированных настоящими правилами и условиями, применяются положения Польского гражданского кодекса. Все споры будут разрешаться судом, компетентным для местонахождения Салона."}
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

export default TermsOfService;