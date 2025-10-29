import { useTranslation } from "react-i18next";

import { SEO, generatePersonSchema } from "@/components/SEO";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileFooter from "@/components/MobileFooter";
import AboutSection from "@/components/AboutSection";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="About Mariia Borysevych — Personal Trainer & PMU Artist"
        description="Personal trainer (Zdrofit) & PMU artist (BM BEAUTY). Voice: calm, encouraging, bilingual PL/UA with EN for expats."
        structuredData={generatePersonSchema()}
      />
      <Navigation />
      <main className="section-standard">
        <AboutSection />
      </main>
      <Footer />
      <MobileFooter />
    </div>
  );
};

export default About;
