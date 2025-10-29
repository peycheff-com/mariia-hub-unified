import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

import { Button } from "@/components/ui/button";

const TestimonialsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      text: "The healed-first approach made all the difference. My lip blush looks natural and exactly what I wanted. Mariia's attention to detail is incredible.",
      name: "Katarzyna M.",
      type: "Beauty",
      rating: 5,
    },
    {
      text: "Best personal trainer I've worked with. Patient, knowledgeable, and genuinely cares about sustainable progress. No pressure, just results.",
      name: "Tomasz R.",
      type: "Fitness",
      rating: 5,
    },
    {
      text: "Professional, clean studio, and amazing results. Whether it's my brows or training sessions, everything is always perfect. Highly recommend!",
      name: "Elena V.",
      type: "General",
      rating: 5,
    },
  ];

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-rose-gold/5 to-champagne/5">
      <div className="container mx-auto px-6 md:px-8 max-w-4xl">
        <h2 className="text-4xl font-bold text-center mb-12">What Clients Say</h2>

        <div className="relative">
          <div className="bg-muted/30 rounded-2xl p-8 md:p-12">
            <div className="flex justify-center mb-4">
              {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-champagne fill-champagne" />
              ))}
            </div>
            <p className="text-xl md:text-2xl italic text-center mb-6 leading-relaxed">
              "{testimonials[currentIndex].text}"
            </p>
            <div className="text-center">
              <p className="font-semibold">{testimonials[currentIndex].name}</p>
              <p className="text-sm text-muted-foreground">
                {testimonials[currentIndex].type}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={prev}
              className="rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex gap-2">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentIndex
                      ? "bg-primary w-8"
                      : "bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={next}
              className="rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          <div className="text-center mt-8">
            <a
              href="https://booksy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              See all reviews on Booksy →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsCarousel;
