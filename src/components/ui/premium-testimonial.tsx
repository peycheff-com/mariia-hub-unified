import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar?: string;
  service: string;
}

interface PremiumTestimonialProps {
  testimonials: Testimonial[];
  className?: string;
  autoPlay?: boolean;
  interval?: number;
}

export const PremiumTestimonial = ({
  testimonials,
  className,
  autoPlay = true,
  interval = 5000,
}: PremiumTestimonialProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, interval, testimonials.length]);

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    setIsPlaying(false);
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
    setIsPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsPlaying(false);
  };

  if (!testimonials.length) return null;

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div className={cn('relative w-full', className)}>
      {/* Main testimonial card */}
      <div className="relative overflow-hidden rounded-3xl glass-card p-8 md:p-12 animate-fade-in card-elegant">
        {/* Decorative quote icon */}
        <div className="absolute top-6 left-6 opacity-10">
          <Quote className="w-16 h-16 text-champagne" />
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-6">
          {/* Rating */}
          <div className="flex items-center gap-1">
            {[...Array(currentTestimonial.rating)].map((_, i) => (
              <Star
                key={i}
                className="w-5 h-5 fill-champagne text-champagne animate-scale-in"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>

          {/* Testimonial text */}
          <blockquote className="text-xl md:text-2xl font-light leading-relaxed text-graphite-800 animate-slide-up" style={{ animationDelay: '200ms' }}>
            "{currentTestimonial.content}"
          </blockquote>

          {/* Author info */}
          <div className="flex items-center gap-4 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <div className="w-12 h-12 rounded-full glass-accent flex items-center justify-center">
              {currentTestimonial.avatar ? (
                <img
                  src={currentTestimonial.avatar}
                  alt={currentTestimonial.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-xl font-semibold text-champagne">
                  {currentTestimonial.name.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <div className="font-semibold text-graphite-900 heading-serif">
                {currentTestimonial.name}
              </div>
              <div className="text-sm text-graphite-600">
                {currentTestimonial.role} • {currentTestimonial.service}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation arrows */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass-card hover:bg-champagne/20 transition-all duration-300 magnetic-hover"
          onClick={goToPrevious}
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass-card hover:bg-champagne/20 transition-all duration-300 magnetic-hover"
          onClick={goToNext}
          aria-label="Next testimonial"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Dots indicator */}
      <div className="flex items-center justify-center gap-2 mt-6 animate-fade-in" style={{ animationDelay: '600ms' }}>
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              'transition-all duration-300 rounded-full',
              index === currentIndex
                ? 'w-8 h-2 bg-champagne'
                : 'w-2 h-2 bg-champagne/30 hover:bg-champagne/50 hover:w-4'
            )}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>

      {/* Play/pause button */}
      {autoPlay && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute bottom-4 right-4 glass-subtle hover:bg-champagne/10 transition-all duration-300"
          onClick={() => setIsPlaying(!isPlaying)}
          aria-label={isPlaying ? 'Pause autoplay' : 'Resume autoplay'}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
      )}
    </div>
  );
};

export default PremiumTestimonial;
