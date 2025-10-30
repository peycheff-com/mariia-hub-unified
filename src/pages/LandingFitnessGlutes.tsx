import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Calendar, Dumbbell, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import BookingSheet from "@/components/booking/BookingSheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";
import { useSiteImage } from "@/hooks/useSiteImage";

import fitnessHero from "@/assets/hero-glutes.png";

const LandingFitnessGlutes = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language as 'en' | 'pl' | 'ua';
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase.from('services').select('*').eq('is_active', true).eq('service_type', 'fitness').order('display_order');
      if (error) throw error;
      setServices(data || []);
    } catch (error: any) {
      toast aria-live="polite" aria-atomic="true"({ title: "Error", description: "Could not load services", variant: "destructive" });
    }
  };

  const content = {
    en: {
      title: "Glute Sculpt — 8 Weeks, Smart Volume, Clean Form",
      subtitle: "3×/week plan (Gym/Home), video cues, deload weeks. Evidence-based program.",
      whatYouGet: [
        "3 sessions per week × 45-60 min",
        "Gym and home variants",
        "Video exercise library",
        "Deload weeks (4 & 8)",
        "Progress tracking tools"
      ],
      faqs: [
        {
          q: "Will I be sore?",
          a: "Some muscle soreness is normal, especially in weeks 1-2. It's a sign your muscles are adapting. Deload weeks help with recovery."
        },
        {
          q: "What if I travel?",
          a: "The home variant requires minimal equipment (bands, dumbbells). You can continue training anywhere."
        },
        {
          q: "Home vs gym version?",
          a: "Gym uses machines and barbells. Home uses bands, dumbbells, and bodyweight. Both effective when done with proper intensity."
        },
        {
          q: "Cycle adjustments?",
          a: "Listen to your body. Reduce volume or take extra rest days as needed. Program is flexible."
        }
      ],
      cta: "Start Glute Sculpt"
    },
    pl: {
      title: "Glute Sculpt — 8 Tygodni, Mądra Objętość, Czysta Technika",
      subtitle: "Plan 3×/tydzień (Siłownia/Dom), wideo wskazówki, tygodnie odciążenia. Program oparty na dowodach.",
      whatYouGet: [
        "3 sesje tygodniowo × 45-60 min",
        "Warianty siłownia i dom",
        "Biblioteka wideo ćwiczeń",
        "Tygodnie odciążenia (4 i 8)",
        "Narzędzia śledzenia postępów"
      ],
      faqs: [
        {
          q: "Czy będę miała zakwasy?",
          a: "Pewien ból mięśni jest normalny, szczególnie w tygodniach 1-2. To znak adaptacji mięśni. Tygodnie odciążenia pomagają w regeneracji."
        },
        {
          q: "Co jeśli podróżuję?",
          a: "Wariant domowy wymaga minimalnego sprzętu (taśmy, hantle). Możesz kontynuować trening wszędzie."
        },
        {
          q: "Wersja domowa vs siłownia?",
          a: "Siłownia używa maszyn i sztang. Dom używa taśm, hantli i masy ciała. Oba skuteczne przy odpowiedniej intensywności."
        },
        {
          q: "Dostosowania cyklu?",
          a: "Słuchaj swojego ciała. Zmniejsz objętość lub weź dodatkowe dni odpoczynku w razie potrzeby. Program jest elastyczny."
        }
      ],
      cta: "Rozpocznij Glute Sculpt"
    },
    ua: {
      title: "Glute Sculpt — 8 Тижнів, Розумний Обсяг, Чиста Техніка",
      subtitle: "План 3×/тиждень (Зал/Дім), відео підказки, тижні розвантаження. Програма на основі доказів.",
      whatYouGet: [
        "3 сесії на тиждень × 45-60 хв",
        "Варіанти зал і дім",
        "Відео-бібліотека вправ",
        "Тижні розвантаження (4 і 8)",
        "Інструменти відстеження прогресу"
      ],
      faqs: [
        {
          q: "Чи буде біль у м'язах?",
          a: "Певний біль у м'язах нормальний, особливо в тижні 1-2. Це ознака адаптації м'язів. Тижні розвантаження допомагають у відновленні."
        },
        {
          q: "Що якщо я подорожую?",
          a: "Домашній варіант потребує мінімального обладнання (стрічки, гантелі). Можете продовжувати тренування де завгодно."
        },
        {
          q: "Домашня версія vs зал?",
          a: "Зал використовує тренажери та штанги. Дім використовує стрічки, гантелі та вагу тіла. Обидва ефективні при правильній інтенсивності."
        },
        {
          q: "Коригування циклу?",
          a: "Слухайте своє тіло. Зменшіть обсяг або візьміть додаткові дні відпочинку за потреби. Програма гнучка."
        }
      ],
      cta: "Почати Glute Sculpt"
    }
  };

  const lang = content[currentLang];
  const { image: glutesHeroImg } = useSiteImage('hero-glutes');

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={lang.title}
        description={lang.subtitle}
      />
      <Navigation mode="fitness" />
      
      <div className="pt-20">
        <section className="py-16 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">{lang.title}</h1>
                <p className="text-xl text-muted-foreground mb-8">{lang.subtitle}</p>
                
                <div className="space-y-3 mb-8">
                  {lang.whatYouGet.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <Button size="lg" className="w-full md:w-auto" onClick={() => setIsBookingOpen(true)}>{lang.cta}</Button>
              </div>

              <div className="relative">
                <img
                  src={glutesHeroImg?.image_url || fitnessHero}
                  alt={glutesHeroImg?.alt_text || "Glute Sculpt program — results"}
                  className="rounded-2xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container mx-auto px-6 max-w-4xl">
            <h2 className="text-3xl font-bold mb-8 text-center">
              {currentLang === 'en' ? 'Program Structure' : currentLang === 'pl' ? 'Struktura programu' : 'Структура програми'}
            </h2>
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-semibold mb-1">{currentLang === 'en' ? 'Weeks 1-3' : currentLang === 'pl' ? 'Tygodnie 1-3' : 'Тижні 1-3'}</p>
                  <p className="text-sm text-muted-foreground">{currentLang === 'en' ? 'Foundation & Form' : currentLang === 'pl' ? 'Podstawy i technika' : 'Основи та техніка'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-semibold mb-1">{currentLang === 'en' ? 'Week 4' : currentLang === 'pl' ? 'Tydzień 4' : 'Тиждень 4'}</p>
                  <p className="text-sm text-muted-foreground">{currentLang === 'en' ? 'Deload' : currentLang === 'pl' ? 'Odciążenie' : 'Розвантаження'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Dumbbell className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-semibold mb-1">{currentLang === 'en' ? 'Weeks 5-7' : currentLang === 'pl' ? 'Tygodnie 5-7' : 'Тижні 5-7'}</p>
                  <p className="text-sm text-muted-foreground">{currentLang === 'en' ? 'Intensity & Volume' : currentLang === 'pl' ? 'Intensywność i objętość' : 'Інтенсивність та обсяг'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-semibold mb-1">{currentLang === 'en' ? 'Week 8' : currentLang === 'pl' ? 'Tydzień 8' : 'Тиждень 8'}</p>
                  <p className="text-sm text-muted-foreground">{currentLang === 'en' ? 'Deload & Assess' : currentLang === 'pl' ? 'Odciążenie i ocena' : 'Розвантаження та оцінка'}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

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

        <section className="py-16 bg-background">
          <div className="container mx-auto px-6 max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4">
              {currentLang === 'en' ? 'Ready to Build Stronger Glutes?' : currentLang === 'pl' ? 'Gotowa na silniejsze pośladki?' : 'Готові побудувати сильніші сідниці?'}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {currentLang === 'en' ? 'Start your 8-week transformation today' : currentLang === 'pl' ? 'Rozpocznij swoją 8-tygodniową transformację dzisiaj' : 'Почніть свою 8-тижневу трансформацію сьогодні'}
            </p>
            <Button size="lg" onClick={() => setIsBookingOpen(true)}>{lang.cta}</Button>
          </div>
        </section>
      </div>

      <Footer />

      <BookingSheet isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} services={services} />
    </div>
  );
};

export default LandingFitnessGlutes;
