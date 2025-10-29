import { Link } from "react-router-dom";

import mariiaPic from "@/assets/mariia-profile.jpg";

const PersonalStory = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-champagne/5 to-bronze/5">
      <div className="container mx-auto px-6 md:px-8 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold">Why "soft beauty, strong habits"</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              BM BEAUTY began as a small Warsaw studio focused on healed-first results—natural 
              color, gentle technique, strict hygiene. As a personal trainer, I bring the same 
              discipline to the body: gradual progress, supportive coaching, routines you can keep. 
              Beauty and fitness aren't separate; they reinforce each other.
            </p>
            <div className="flex flex-wrap gap-4 text-sm pt-2">
              <Link to="/beauty#standards" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors group">
                <span>Studio standards</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link to="/fitness#philosophy" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors group">
                <span>Coaching philosophy</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>

          <div className="relative animate-fade-in">
            <img
              src={mariiaPic}
              alt="Mariia Borysevych at work in her Warsaw beauty studio"
              className="rounded-3xl shadow-luxury hover-scale transition-transform duration-500"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PersonalStory;
