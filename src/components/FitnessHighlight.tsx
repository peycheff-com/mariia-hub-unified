import { Link } from "react-router-dom";
import { Dumbbell, Users, Laptop } from "lucide-react";

import { Button } from "@/components/ui/button";
import AvailableSlotsList from "@/components/AvailableSlotsList";

const FitnessHighlight = () => {
  const programs = [
    {
      icon: Dumbbell,
      name: "1:1 Personal Training",
      description: "Personalized coaching at Zdrofit",
      link: "/fitness/programs/personal-training",
    },
    {
      icon: Laptop,
      name: "Online Coaching",
      description: "Train anywhere with custom programs",
      link: "/fitness/programs/online-coaching",
    },
    {
      icon: Users,
      name: "Small Group / Rehab",
      description: "Supportive group sessions & recovery",
      link: "/fitness/programs/small-group",
    },
  ];

  const clientStories = [
    {
      text: "Started with zero confidence. Three months later, I'm stronger than I ever thought possible.",
      name: "Anna, 34",
    },
    {
      text: "The gentle approach made all the difference. No judgment, just steady progress at my pace.",
      name: "Piotr, 41",
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-pearl/60 to-sage/15">
      <div className="container mx-auto px-6 md:px-8 max-w-6xl">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="heading-serif text-4xl md:text-5xl font-semibold mb-4 text-charcoal">Gentle coaching. Strong habits.</h2>
          <p className="text-xl text-graphite text-body">
            1:1 & online training that meets you where you are
          </p>
        </div>

        {/* Program Tiles */}
        <div className="grid md:grid-cols-3 gap-6 mb-16 animate-fade-in">
          {programs.map((program, idx) => (
            <Link
              key={idx}
              to={program.link}
              className="p-6 glass-card-light rounded-2xl hover:shadow-luxury transition-all duration-300 group hover-lift"
            >
              <program.icon className="w-10 h-10 text-sage mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold mb-2 text-lg text-charcoal text-body">{program.name}</h3>
              <p className="text-sm text-graphite text-body">{program.description}</p>
            </Link>
          ))}
        </div>

        {/* Schedule Peek */}
        <div className="mb-16 animate-fade-in">
          <AvailableSlotsList serviceType="fitness" limit={4} showViewAll={true} />
        </div>

        {/* Client Stories */}
        <div className="grid md:grid-cols-2 gap-6 mb-12 animate-fade-in">
          {clientStories.map((story, idx) => (
            <div key={idx} className="p-6 glass-card-light rounded-2xl hover-lift">
              <p className="text-lg italic mb-4 text-graphite text-body">"{story.text}"</p>
              <p className="font-medium text-sm text-primary text-body">— {story.name}</p>
            </div>
          ))}
        </div>

        <div className="text-center animate-fade-in">
          <Button size="lg" asChild>
            <Link to="/fitness/programs">Start Training</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FitnessHighlight;
