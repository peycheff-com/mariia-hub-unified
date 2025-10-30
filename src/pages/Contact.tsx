import { useTranslation } from "react-i18next";

import { SEO, generateLocalBusinessSchema } from "@/components/SEO";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileFooter from "@/components/MobileFooter";
import ContactSection from "@/components/ContactSection";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Contact BM BEAUTY & Mariia | Warsaw"
        description="Studio: Smolna 8/254, 00-375 Warsaw. Training: Zdrofit / studio gym / online. Email: hi@mariiaborysevych.com"
        structuredData={generateLocalBusinessSchema()}
      />
      <Navigation />
      <main role="main" className="section-standard">
        <ContactSection />
      </main>
      <Footer />
      <MobileFooter />
    </div>
  );
};

export default Contact;
