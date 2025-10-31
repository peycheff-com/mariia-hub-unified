import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, MapPin, Clock, Star, ExternalLink } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import BookingSheet from "@/components/booking/BookingSheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSiteImage } from "@/hooks/useSiteImage";

import browsHero from "@/assets/hero-brows.png";

const LandingBeautyBrows = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language as 'en' | 'pl' | 'ua';
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .eq('service_type', 'beauty')
        .order('display_order');
      if (error) throw error;
      setServices(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: "Could not load services", variant: "destructive" });
    }
  };

  const content = {
    en: {
      title: "PMU Brows — Your Face Frame, Not a Filter",
      subtitle: "Mapping first, heal clean. Professional eyebrow PMU in Warsaw.",
      rating: "4.9/5 on Booksy",
      address: "Smolna 8/254, 00-375 Warsaw",
      benefits: [
        "Natural, hair-like strokes",
        "Perfect symmetry without harsh lines",
        "Long-lasting (1-3 years)",
        "Time-saving morning routine"
      ],
      faqs: [
        {
          q: "Microblading or shading?",
          a: "Technique chosen per your skin type and style after consultation and mapping."
        },
        {
          q: "Does it hurt?",
          a: "Numbing cream is applied. Most clients report minimal discomfort."
        },
        {
          q: "How long to heal?",
          a: "7-10 days for initial healing. Full color develops in 4-6 weeks."
        }
      ],
      cta: "Book on Booksy"
    },
    pl: {
      title: "PMU Brwi — Rama Twarzy Bez Filtra",
      subtitle: "Najpierw mapping, potem czyste gojenie. Profesjonalny PMU brwi w Warszawie.",
      rating: "4.9/5 na Booksy",
      address: "Smolna 8/254, 00-375 Warszawa",
      benefits: [
        "Naturalne, przypominające włoski kreski",
        "Idealna symetria bez ostrych linii",
        "Długotrwałe (1-3 lata)",
        "Oszczędność czasu rano"
      ],
      faqs: [
        {
          q: "Microblading czy cieniowanie?",
          a: "Technika dobrana do typu skóry i stylu po konsultacji i mapowaniu."
        },
        {
          q: "Czy to boli?",
          a: "Stosujemy krem znieczulający. Większość klientek zgłasza minimalny dyskomfort."
        },
        {
          q: "Ile trwa gojenie?",
          a: "7-10 dni wstępne gojenie. Pełny kolor rozwija się w 4-6 tygodni."
        }
      ],
      cta: "Rezerwuj w Booksy"
    },
    ua: {
      title: "PMU брів — Рамка Обличчя Без Фільтрів",
      subtitle: "Спочатку мепінг, потім чисте загоєння. Професійний PMU брів у Варшаві.",
      rating: "4.9/5 на Booksy",
      address: "Smolna 8/254, 00-375 Варшава",
      benefits: [
        "Натуральні, схожі на волоски штрихи",
        "Ідеальна симетрія без різких ліній",
        "Довговічні (1-3 роки)",
        "Економія часу вранці"
      ],
      faqs: [
        {
          q: "Мікроблейдинг чи шейдинг?",
          a: "Техніка обирається під тип шкіри та стиль після консультації та мепінгу."
        },
        {
          q: "Чи це боляче?",
          a: "Використовуємо знеболюючий крем. Більшість клієнток повідомляють про мінімальний дискомфорт."
        },
        {
          q: "Скільки загоюється?",
          a: "7-10 днів початкове загоєння. Повний колір розвивається за 4-6 тижнів."
        }
      ],
      cta: "Запис у Booksy"
    }
  };

  const lang = content[currentLang];
  const { image: browsHeroImg } = useSiteImage('hero-brows');

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={lang.title}
        description={lang.subtitle}
      />
      <Navigation mode="beauty" />
      
      <div className="pt-20">
        <section className="section-standard bg-gradient-to-br from-lip-rose/10 to-champagne/10">
          <div className="container-standard">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4">{lang.rating}</Badge>
                <h1 className="text-hero mb-4">{lang.title}</h1>
                <p className="text-description text-high-contrast mb-6">{lang.subtitle}</p>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
                  <MapPin className="h-4 w-4" />
                  {lang.address}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  {lang.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" onClick={() => setIsBookingOpen(true)}>{lang.cta}</Button>
                  <Button size="lg" variant="outline" className="gap-2" asChild>
                    <a href="https://booksy.com/pl-pl/173111_b-m-beauty-studio_brwi-i-rzesy_3_warszawa" target="_blank" rel="noopener noreferrer">
                      <span>Prefer Booksy?</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>

              <div className="relative">
                <img
                  src={browsHeroImg?.image_url || browsHero}
                  alt={browsHeroImg?.alt_text || "PMU Brows — healed natural result"}
                  className="rounded-2xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="section-compact bg-background">
          <div className="container-narrow text-center">
            <div className="inline-flex items-center gap-8 p-8 glass-card rounded-2xl">
              <div>
                <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">{currentLang === 'en' ? 'Duration' : currentLang === 'pl' ? 'Czas trwania' : 'Тривалість'}</p>
                <p className="text-2xl font-bold">2h 30min</p>
              </div>
              <div className="h-16 w-px bg-border" />
              <div>
                <Star className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">{currentLang === 'en' ? 'Price' : currentLang === 'pl' ? 'Cena' : 'Ціна'}</p>
                <p className="text-2xl font-bold">720-900 PLN</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section-standard bg-muted/30">
          <div className="container-narrow">
            <h2 className="text-section text-center mb-12">FAQ</h2>
            <Accordion type="single" collapsible>
              {lang.faqs.map((faq, idx) => (
                <AccordionItem key={idx} value={`item-${idx}`}>
                  <AccordionTrigger>{faq.q}</AccordionTrigger>
                  <AccordionContent>{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="section-compact bg-background">
          <div className="container-narrow text-center">
            <h2 className="text-section mb-4">
              {currentLang === 'en' ? 'Ready for Perfect Brows?' : currentLang === 'pl' ? 'Gotowa na idealne brwi?' : 'Готові до ідеальних брів?'}
            </h2>
            <p className="text-description text-muted mb-8">
              {currentLang === 'en' ? 'Book your PMU brows consultation today' : currentLang === 'pl' ? 'Zarezerwuj konsultację PMU brwi dzisiaj' : 'Забронюйте консультацію PMU брів сьогодні'}
            </p>
            <Button size="lg" asChild>
              <a href="https://booksy.com/pl-pl/173111_b-m-beauty-studio_brwi-i-rzesy_3_warszawa" target="_blank" rel="noopener noreferrer">
                {lang.cta}
              </a>
            </Button>
          </div>
        </section>
      </div>

      <Footer />

      <BookingSheet
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        services={services}
      />
    </div>
  );
};

export default LandingBeautyBrows;
