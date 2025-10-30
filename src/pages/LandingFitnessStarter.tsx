import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Clock, Target, Calendar } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import BookingSheet from "@/components/booking/BookingSheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";

const LandingFitnessStarter = () => {
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
      title: "Start Here — One Session to Set Your Plan",
      subtitle: "45 min consult + movement screen. First week plan + habits.",
      includes: [
        "45-minute 1:1 consultation",
        "Movement assessment",
        "First week training plan",
        "Habit starter guide (steps/sleep/protein)"
      ],
      howItWorks: [
        { step: "Book in 60 seconds", desc: "Card, Apple Pay, Google Pay, BLIK, P24 via Stripe" },
        { step: "Movement screen", desc: "Assess your current fitness level and mobility" },
        { step: "Goal setting", desc: "Define your objectives and timeline" },
        { step: "Get your plan", desc: "Receive your personalized first week plan" }
      ],
      cta: "Book Starter Session"
    },
    pl: {
      title: "Start — Jedna Sesja, Jasny Plan",
      subtitle: "45 min konsultacja + ocena ruchu. Plan pierwszego tygodnia + nawyki.",
      includes: [
        "45-minutowa konsultacja 1:1",
        "Ocena ruchu",
        "Plan treningowy pierwszego tygodnia",
        "Przewodnik nawyków (kroki/sen/białko)"
      ],
      howItWorks: [
        { step: "Rezerwuj w 60 sekund", desc: "Karta, Apple Pay, Google Pay, BLIK, P24 przez Stripe" },
        { step: "Ocena ruchu", desc: "Oceń swój aktualny poziom sprawności i mobilności" },
        { step: "Ustalanie celów", desc: "Zdefiniuj swoje cele i harmonogram" },
        { step: "Otrzymaj plan", desc: "Otrzymaj spersonalizowany plan pierwszego tygodnia" }
      ],
      cta: "Rezerwuj sesję startową"
    },
    ua: {
      title: "Старт — Одна Сесія, Чіткий План",
      subtitle: "45 хв консультація + оцінка руху. План першого тижня + звички.",
      includes: [
        "45-хвилинна консультація 1:1",
        "Оцінка руху",
        "План тренувань першого тижня",
        "Посібник звичок (кроки/сон/білок)"
      ],
      howItWorks: [
        { step: "Запис за 60 секунд", desc: "Картка, Apple Pay, Google Pay, BLIK, P24 через Stripe" },
        { step: "Оцінка руху", desc: "Оцініть ваш поточний рівень фітнесу та мобільності" },
        { step: "Визначення цілей", desc: "Визначте свої цілі та терміни" },
        { step: "Отримайте план", desc: "Отримайте персоналізований план першого тижня" }
      ],
      cta: "Записатися на старт-сесію"
    }
  };

  const lang = content[currentLang];

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={lang.title}
        description={lang.subtitle}
      />
      <Navigation mode="fitness" />
      
      <div className="pt-20">
        <section className="py-16 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <div className="container mx-auto px-6 max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{lang.title}</h1>
            <p className="text-xl text-muted-foreground mb-8">{lang.subtitle}</p>
            
            <div className="grid md:grid-cols-2 gap-4 mb-8 text-left">
              {lang.includes.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 bg-background rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <Button size="lg" onClick={() => setIsBookingOpen(true)}>{lang.cta}</Button>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container mx-auto px-6 max-w-4xl">
            <h2 className="text-3xl font-bold mb-8 text-center">
              {currentLang === 'en' ? 'How It Works' : currentLang === 'pl' ? 'Jak to działa' : 'Як це працює'}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {lang.howItWorks.map((item, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold mb-3">
                      {idx + 1}
                    </div>
                    <h3 className="font-semibold mb-2">{item.step}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-6 max-w-4xl text-center">
            <div className="inline-flex items-center gap-8 p-8 bg-background rounded-2xl">
              <div>
                <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">{currentLang === 'en' ? 'Duration' : currentLang === 'pl' ? 'Czas trwania' : 'Тривалість'}</p>
                <p className="text-2xl font-bold">45 min</p>
              </div>
              <div className="h-16 w-px bg-border" />
              <div>
                <Target className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">{currentLang === 'en' ? 'Format' : currentLang === 'pl' ? 'Format' : 'Формат'}</p>
                <p className="text-2xl font-bold">1:1</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container mx-auto px-6 max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4">
              {currentLang === 'en' ? 'Ready to Start Your Fitness Journey?' : currentLang === 'pl' ? 'Gotowa rozpocząć swoją fitness podróż?' : 'Готові почати свій фітнес-шлях?'}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {currentLang === 'en' ? 'Book your starter session and get your personalized plan' : currentLang === 'pl' ? 'Zarezerwuj sesję startową i otrzymaj spersonalizowany plan' : 'Забронюйте стартову сесію та отримайте персоналізований план'}
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

export default LandingFitnessStarter;
