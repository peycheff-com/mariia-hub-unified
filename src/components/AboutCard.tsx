import { Link } from "react-router-dom";
import { MapPin, Building2, Dumbbell, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";

import mariiaPic from "@/assets/mariia-about.jpg";

const AboutCard = () => {
  const fastFacts = [
    { icon: MapPin, text: "Warsaw" },
    { icon: Building2, text: "Owner, BM BEAUTY" },
    { icon: Dumbbell, text: "Personal Trainer (Zdrofit)" },
    { icon: Shield, text: "Healed-first approach" },
  ];

  return (
    <section id="trust" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6 md:px-8 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative animate-fade-in">
            <img
              src={mariiaPic}
              alt="Mariia Borysevych - Beauty Artist and Personal Trainer"
              className="rounded-3xl shadow-luxury hover-scale transition-transform duration-500"
            />
          </div>

          <div className="space-y-6 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Mariia, in brief</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Blogger, brow stylist & makeup artist, owner of BM BEAUTY. Certified 
              personal trainer at Zdrofit. I help you look soft and natural—and build 
              strong, sustainable habits. Warsaw-based, working in PL/EN/UA.
            </p>

            <div className="flex flex-wrap gap-3">
              {fastFacts.map((fact, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-4 py-2 glass-card rounded-full text-sm hover-lift"
                >
                  <fact.icon className="w-4 h-4 text-primary" />
                  <span>{fact.text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <Button asChild size="lg">
                <Link to="/about">Read my story</Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link to="/about#press">Press & credentials</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutCard;
