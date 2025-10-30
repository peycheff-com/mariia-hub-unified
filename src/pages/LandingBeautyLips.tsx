import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Star, MapPin, Clock, Shield, Sun, ExternalLink } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import BookingSheet from "@/components/booking/BookingSheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";

const LandingBeautyLips = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language as 'en' | 'pl' | 'ua';
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

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
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: "Could not load services",
        variant: "destructive",
      });
    }
  };

  const content = {
    en: {
      title: "PMU Lips — Soft, Natural, Long-lasting",
      subtitle: "Healed-first approach. No overlining. Professional PMU in Warsaw.",
      rating: "4.9/5 on Booksy",
      address: "Smolna 8/254, 00-375 Warsaw (Śródmieście)",
      howItWorks: {
        title: "How It Works",
        steps: [
          { title: "Mapping", desc: "Precise shape design tailored to your features" },
          { title: "Pigment Application", desc: "Professional technique for natural results" },
          { title: "Aftercare", desc: "Clear instructions for optimal healing" }
        ]
      },
      proofs: {
        title: "Healed Results",
        items: [
          "Fresh vs Week 4 comparison",
          "Natural nude finish",
          "Corrected asymmetry",
          "Sun-safe habits (SPF)"
        ]
      },
      faqs: [
        {
          q: "Is it safe?",
          a: "Yes, using sterile, high-quality pigments. Medical clearance required if you have specific conditions."
        },
        {
          q: "What about cold sores?",
          a: "History of cold sores increases risk of flare. Seek medical guidance before lips PMU."
        },
        {
          q: "When can I wear makeup?",
          a: "Avoid makeup on lips for 7-10 days during healing."
        },
        {
          q: "Can I workout?",
          a: "Avoid heavy sweating for 7-10 days to ensure proper healing."
        }
      ],
      cta: "Book Now"
    },
    pl: {
      title: "PMU Ust — Miękko, Naturalnie, Długotrwale",
      subtitle: "Najpierw gojenie. Bez przerysowania. Profesjonalny PMU w Warszawie.",
      rating: "4.9/5 na Booksy",
      address: "Smolna 8/254, 00-375 Warszawa (Śródmieście)",
      howItWorks: {
        title: "Jak to działa",
        steps: [
          { title: "Mapping", desc: "Precyzyjny projekt kształtu dopasowany do Twoich rysów" },
          { title: "Aplikacja pigmentu", desc: "Profesjonalna technika dla naturalnych efektów" },
          { title: "Pielęgnacja", desc: "Jasne instrukcje dla optymalnego gojenia" }
        ]
      },
      proofs: {
        title: "Zagojone efekty",
        items: [
          "Świeże vs 4 tydzień porównanie",
          "Naturalny nude finisz",
          "Skorygowana asymetria",
          "Nawyki bezpieczne dla słońca (SPF)"
        ]
      },
      faqs: [
        {
          q: "Czy to bezpieczne?",
          a: "Tak, używamy sterylnych, wysokiej jakości pigmentów. Wymagana zgoda lekarska w przypadku określonych stanów."
        },
        {
          q: "A co z opryszczką?",
          a: "Historia opryszczki zwiększa ryzyko nawrotu. Skonsultuj lekarza przed PMU ust."
        },
        {
          q: "Kiedy mogę używać makijażu?",
          a: "Unikaj makijażu na ustach przez 7-10 dni podczas gojenia."
        },
        {
          q: "Czy mogę ćwiczyć?",
          a: "Unikaj intensywnego pocenia się przez 7-10 dni dla prawidłowego gojenia."
        }
      ],
      cta: "Rezerwuj teraz"
    },
    ua: {
      title: "PMU губ — Ніжно, натурально, надовго",
      subtitle: "Спочатку загоєння. Без оверлайну. Професійний PMU у Варшаві.",
      rating: "4.9/5 на Booksy",
      address: "Smolna 8/254, 00-375 Варшава (Śródmieście)",
      howItWorks: {
        title: "Як це працює",
        steps: [
          { title: "Мепінг", desc: "Точний дизайн форми під ваші риси" },
          { title: "Нанесення пігменту", desc: "Професійна техніка для натуральних результатів" },
          { title: "Догляд", desc: "Чіткі інструкції для оптимального загоєння" }
        ]
      },
      proofs: {
        title: "Загоєні результати",
        items: [
          "Свіже vs 4 тиждень порівняння",
          "Натуральний nude фініш",
          "Скоригована асиметрія",
          "Безпечні звички на сонці (SPF)"
        ]
      },
      faqs: [
        {
          q: "Це безпечно?",
          a: "Так, використовуємо стерильні, високоякісні пігменти. Потрібен медичний дозвіл за певних станів."
        },
        {
          q: "А що з герпесом?",
          a: "Історія герпесу підвищує ризик спалаху. Зверніться до лікаря перед PMU губ."
        },
        {
          q: "Коли можна макіяж?",
          a: "Уникайте макіяжу на губах 7-10 днів під час загоєння."
        },
        {
          q: "Чи можна тренуватися?",
          a: "Уникайте сильного потіння 7-10 днів для правильного загоєння."
        }
      ],
      cta: "Запис зараз"
    }
  };

  const lang = content[currentLang];

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={lang.title}
        description={lang.subtitle}
      />
      <Navigation mode="beauty" />
      
      <div className="pt-20 pb-20 md:pb-0">
        {/* Hero */}
        <section className="py-16 bg-gradient-to-br from-lip-rose/10 to-champagne/10">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4">{lang.rating}</Badge>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">{lang.title}</h1>
                <p className="text-xl text-muted-foreground mb-6">{lang.subtitle}</p>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
                  <MapPin className="h-4 w-4" />
                  {lang.address}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" className="w-full sm:w-auto" onClick={() => setIsBookingOpen(true)}>
                    {lang.cta}
                  </Button>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2" asChild>
                    <a href="https://booksy.com/pl-pl/173111_b-m-beauty-studio_brwi-i-rzesy_3_warszawa" target="_blank" rel="noopener noreferrer">
                      <span>Prefer Booksy?</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>

              <div className="relative bg-muted rounded-2xl shadow-2xl aspect-square flex items-center justify-center">
                <span className="text-muted-foreground">PMU Lips</span>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-6 max-w-4xl">
            <h2 className="text-3xl font-bold mb-8 text-center">{lang.howItWorks.title}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {lang.howItWorks.steps.map((step, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold mb-3">
                      {idx + 1}
                    </div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Healed Proofs */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-6 max-w-4xl">
            <h2 className="text-3xl font-bold mb-8 text-center">{lang.proofs.title}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {lang.proofs.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4 bg-background rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Price & Duration */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-6 max-w-4xl text-center">
            <div className="inline-flex items-center gap-8 p-8 bg-muted/30 rounded-2xl">
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

        {/* FAQs */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-6 max-w-4xl">
            <h2 className="text-3xl font-bold mb-8 text-center">FAQ</h2>
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

        {/* CTA */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-6 max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4">
              {currentLang === 'en' ? 'Ready for Natural, Long-lasting Lips?' : currentLang === 'pl' ? 'Gotowa na naturalne, długotrwałe usta?' : 'Готові до натуральних, довговічних губ?'}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {currentLang === 'en' ? 'Book your PMU lips session today' : currentLang === 'pl' ? 'Zarezerwuj sesję PMU ust dzisiaj' : 'Забронюйте сесію PMU губ сьогодні'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={() => setIsBookingOpen(true)}>
                {lang.cta}
              </Button>
              <Button size="lg" variant="outline" className="gap-2" asChild>
                <a href="https://booksy.com/pl-pl/173111_b-m-beauty-studio_brwi-i-rzesy_3_warszawa" target="_blank" rel="noopener noreferrer">
                  <span>Book via Booksy</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Mobile Sticky CTA */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 z-50">
          <Button size="lg" className="w-full" onClick={() => setIsBookingOpen(true)}>
            {lang.cta}
          </Button>
        </div>
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

export default LandingBeautyLips;
