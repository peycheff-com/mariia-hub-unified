import { useTranslation } from "react-i18next";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import mariaProfile from "@/assets/mariia-about.jpg";

const AboutSection = () => {
  const { t } = useTranslation();
  
  const achievements = [
    { number: "500+", label: t('about.achievements.clients') },
    { number: "56K+", label: t('about.achievements.community') },
    { number: "5.0", label: t('about.achievements.rating') },
    { number: "2023", label: t('about.achievements.established') },
  ];

  return (
    <section id="about" className="relative bg-cocoa text-pearl">
      {/* Asymmetric split layout */}
      <div className="grid lg:grid-cols-12">
        {/* Image side - 7 columns, full bleed */}
        <div className="lg:col-span-7 relative h-[60vh] md:h-[70vh] lg:h-screen">
          <img 
            src={mariaProfile}
            alt="Mariia Borysevych - Beauty Artist and Personal Trainer"
            className="w-full h-full object-cover object-center"
          />
          {/* Gradient overlay for text */}
          <div className="absolute inset-0 bg-gradient-to-t from-cocoa/70 via-cocoa/20 to-transparent lg:bg-gradient-to-r lg:from-cocoa/70 lg:via-cocoa/20" />
          
          {/* Stats overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-16">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {achievements.map((stat, index) => (
                <div key={index} className="space-y-1">
                  <div className="text-4xl md:text-5xl font-serif text-pearl editorial-number">
                    {stat.number}
                  </div>
                  <div className="text-xs text-pearl/70 uppercase tracking-widest">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content side - 5 columns */}
        <div className="lg:col-span-5 flex items-center bg-cocoa">
          <div className="px-6 md:px-10 lg:px-16 py-16 md:py-24 lg:py-32 space-y-8 md:space-y-10">
            <div className="space-y-5 md:space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 glass-card rounded-full">
                <span>🕊️</span>
                <span className="text-xs text-champagne uppercase tracking-wider font-medium">{t('about.badge')}</span>
              </div>
              
              <h2 className="heading-serif text-5xl md:text-6xl lg:text-6xl leading-[0.9] text-pearl whitespace-pre-line">
                {t('about.title')}
              </h2>
              
              <div className="w-16 h-[2px] bg-gradient-to-r from-champagne to-bronze" />
            </div>
            
            <div className="space-y-6 text-lg text-pearl/85 leading-relaxed text-body font-light">
              <p>{t('about.intro')}</p>
              <p>{t('about.studio')}</p>
              <p>{t('about.mission')}</p>
            </div>

            <div className="flex flex-wrap gap-3 pt-4">
              <span className="px-4 py-2 bg-pearl/10 rounded-full text-sm text-pearl">
                {t('about.badges.trainer')}
              </span>
              <span className="px-4 py-2 bg-pearl/10 rounded-full text-sm text-pearl">
                {t('about.badges.artist')}
              </span>
              <span className="px-4 py-2 bg-pearl/10 rounded-full text-sm text-pearl">
                {t('about.badges.location')}
              </span>
            </div>
            
            {/* Book CTA */}
            <div className="pt-8">
              <a
                href="/book"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-brand text-white rounded-full font-medium hover:brightness-105 transition-all hover:scale-[1.02]"
              >
                {t('about.bookNow', 'Book Now')}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Story & Timeline */}
      <div className="container mx-auto px-6 md:px-10 lg:px-16 py-16 md:py-24">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-3xl md:text-4xl font-serif text-pearl">My Story</h3>
            <p className="text-pearl/80 leading-relaxed">
              I began as a self-taught artist and trainer, working with friends and
              early clients while obsessing over healed results and safe technique.
              Since opening my Warsaw studio in 2023, my focus has been the same:
              natural-looking beauty and sustainable strength habits you can keep.
            </p>
          </div>
          <div className="lg:col-span-7">
            <ol className="relative border-l border-pearl/10 pl-6 space-y-8">
              <li>
                <div className="absolute -left-2 top-1 w-3 h-3 rounded-full bg-champagne" />
                <h4 className="text-pearl font-semibold">2019–2022</h4>
                <p className="text-pearl/75">Apprenticeship years. Hundreds of training hours, healed-case studies, and client feedback loops.</p>
              </li>
              <li>
                <div className="absolute -left-2 top-1 w-3 h-3 rounded-full bg-champagne" />
                <h4 className="text-pearl font-semibold">2023</h4>
                <p className="text-pearl/75">Opened BM BEAUTY studio in Warsaw’s Śródmieście; launched 1:1 coaching and online programs.</p>
              </li>
              <li>
                <div className="absolute -left-2 top-1 w-3 h-3 rounded-full bg-champagne" />
                <h4 className="text-pearl font-semibold">Today</h4>
                <p className="text-pearl/75">56K+ community and 5.0 rating—built on calm service, clear aftercare, and realistic programming.</p>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Credentials & Approach */}
      <div className="container mx-auto px-6 md:px-10 lg:px-16 pb-16 md:pb-24">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-4">
            <h3 className="text-3xl md:text-4xl font-serif text-pearl">Credentials</h3>
            <ul className="space-y-3 text-pearl/85">
              <li className="flex items-start gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-champagne" />
                Certified personal trainer at Zdrofit; ongoing education in mobility and strength fundamentals.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-champagne" />
                PMU artist focused on brows and lips with a healed-first, natural aesthetic.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-champagne" />
                Hygiene-first studio: single-use disposables, medical-grade disinfection, documented aftercare.
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-3xl md:text-4xl font-serif text-pearl">Approach</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="glass-dark-subtle rounded-3xl p-4 border border-white/10">
                <h4 className="font-semibold text-pearl">Healed-first PMU</h4>
                <p className="text-pearl/75 text-sm">Skin-friendly depth, premium pigments, and controlled fade.</p>
              </div>
              <div className="glass-dark-subtle rounded-3xl p-4 border border-white/10">
                <h4 className="font-semibold text-pearl">Gentle Coaching</h4>
                <p className="text-pearl/75 text-sm">Low-drama training built on form, confidence, and habit loops.</p>
              </div>
              <div className="glass-dark-subtle rounded-3xl p-4 border border-white/10">
                <h4 className="font-semibold text-pearl">Evidence-Aligned</h4>
                <p className="text-pearl/75 text-sm">Simple programming, progressive overload, and recovery.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="container mx-auto px-6 md:px-10 lg:px-16 pb-16 md:pb-24">
        <h3 className="text-3xl md:text-4xl font-serif text-pearl mb-6">FAQs</h3>
        <Accordion type="single" collapsible className="space-y-3">
          <AccordionItem value="q1" className="glass-dark-subtle rounded-3xl px-4 border border-white/10">
            <AccordionTrigger className="text-pearl py-4">How do bookings and holds work?</AccordionTrigger>
            <AccordionContent className="text-pearl/80 pb-4">
              When you pick a time, the system places a 5‑minute hold to prevent double booking while you add details and pay.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q2" className="glass-dark-subtle rounded-3xl px-4 border border-white/10">
            <AccordionTrigger className="text-pearl py-4">What is your healed-first philosophy?</AccordionTrigger>
            <AccordionContent className="text-pearl/80 pb-4">
              We prioritize skin health and realistic color retention. Depth, passes, and pigment are chosen for how the work heals—
              not just how it looks on day one.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q3" className="glass-dark-subtle rounded-3xl px-4 border border-white/10">
            <AccordionTrigger className="text-pearl py-4">Do I need experience to start training?</AccordionTrigger>
            <AccordionContent className="text-pearl/80 pb-4">
              No. We start with movement quality and build capacity gradually. Programs include mobility, strength, and conditioning options.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Final CTA */}
      <div className="container mx-auto px-6 md:px-10 lg:px-16 pb-24">
        <div className="glass-card rounded-3xl p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h3 className="text-2xl md:text-3xl font-serif text-pearl">Ready when you are.</h3>
            <p className="text-pearl/80">Book PMU or start a gentle coaching program—both begin with a conversation.</p>
          </div>
          <a href="/book" className="inline-flex items-center justify-center h-12 px-8 rounded-3xl bg-gradient-brand text-white hover:brightness-110 transition">
            Book in 60s →
          </a>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
