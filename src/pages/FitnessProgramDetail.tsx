import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Clock, Check, Target, AlertCircle, Star } from "lucide-react";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileFooter from "@/components/MobileFooter";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";
import { useAnalytics } from "@/hooks/useAnalytics";
import BookingSheet from "@/components/booking/BookingSheet";
import AvailableSlotsList from "@/components/AvailableSlotsList";
import EmptyState from "@/components/EmptyState";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FitnessProgramDetail = () => {
  const { slug } = useParams();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();
  const { trackServiceView } = useAnalytics();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<any>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [content, setContent] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    const fetchProgramDetails = async () => {
      try {
        // Fetch program
        const { data: programData, error: programError } = await supabase
          .from('services')
          .select('*')
          .eq('slug', slug)
          .eq('service_type', 'fitness')
          .maybeSingle();

        if (programError) throw programError;
        setProgram(programData);

        // Load all services for booking
        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('display_order');
        
        setServices(servicesData || []);

        if (programData) {
          // Track program view
          trackServiceView(programData.id, 'fitness');
          // Fetch gallery
          const { data: galleryData } = await supabase
            .from('service_gallery')
            .select('*')
            .eq('service_id', programData.id)
            .order('display_order');
          setGallery(galleryData || []);

          // Fetch FAQs
          const { data: faqsData } = await supabase
            .from('service_faqs')
            .select('*')
            .eq('service_id', programData.id)
            .order('display_order');
          setFaqs(faqsData || []);

          // Fetch content
          const { data: contentData } = await supabase
            .from('service_content')
            .select('*')
            .eq('service_id', programData.id)
            .maybeSingle();
          setContent(contentData);

          // Fetch reviews
          const { data: reviewsData } = await supabase
            .from('reviews')
            .select('*, profiles(full_name)')
            .eq('service_id', programData.id)
            .eq('is_approved', true)
            .order('created_at', { ascending: false });
          setReviews(reviewsData || []);
        }
      } catch (error) {
        toast aria-live="polite" aria-atomic="true"({
          title: "Error",
          description: "Could not load program details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProgramDetails();
  }, [slug, toast aria-live="polite" aria-atomic="true"]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation mode="fitness" />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation mode="fitness" />
        <div className="container-standard py-24 text-center">
          <AlertCircle className="w-16 h-16 text-muted mx-auto mb-4" />
          <h1 className="text-hero text-3xl mb-2">Program Not Found</h1>
          <p className="text-description text-muted mb-6">The program you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/fitness/programs">Back to Programs</Link>
          </Button>
        </div>
      </div>
    );
  }

  const mockProgram = {
    ...program,
    benefits: program.features || [],
  };
  const storageBase = 'https://lckxvimdqnfjzkbrusgu.supabase.co/storage/v1/object/public/site-images/services';
  const storageFallback = program?.slug ? `${storageBase}/${program.slug}-hero.png` : undefined;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navigation mode="fitness" />

      <main role="main" className="pt-20">
        {/* Hero Section - Standardized */}
        <section className="section-standard bg-gradient-to-br from-sage/10 to-primary/5">
          <div className="container-standard">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Link
                  to="/fitness/programs"
                  className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                  ← Back to Programs
                </Link>
                <h1 className="text-hero mb-4">{mockProgram.title}</h1>
                <p className="text-description text-high-contrast mb-6">{mockProgram.description}</p>

                <div className="flex flex-wrap gap-4 mb-8">
                  {mockProgram.duration_minutes && (
                    <div className="flex items-center gap-2 bg-background/50 backdrop-blur px-4 py-2 rounded-full">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="font-medium">{mockProgram.duration_minutes} min/session</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 bg-background/50 backdrop-blur px-4 py-2 rounded-full">
                    <span className="text-2xl font-bold">
                      {mockProgram.price_from && mockProgram.price_to 
                        ? `${mockProgram.price_from}-${mockProgram.price_to}` 
                        : `From ${mockProgram.price_from}`} PLN
                    </span>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  className="w-full md:w-auto" 
                  onClick={() => setIsBookingOpen(true)}
                >
                  Book This Program
                </Button>
              </div>

              <div className="relative">
                {(mockProgram.image_url || (gallery[0]?.image_url) || storageFallback) && (
                  <img
                    src={mockProgram.image_url || gallery[0]?.image_url || storageFallback}
                    alt={mockProgram.title}
                    className="rounded-2xl shadow-2xl"
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Available Slots - Standardized */}
        <section className="section-standard bg-muted/30">
          <div className="container-narrow">
            <h2 className="text-section text-center mb-12">Available Slots</h2>
            <AvailableSlotsList serviceType="fitness" limit={6} showViewAll={false} />
          </div>
        </section>

        {/* Gallery - Standardized */}
        {gallery.length > 0 && (
          <section className="section-standard bg-background">
            <div className="container-standard">
              <h2 className="text-section text-center mb-12">Gallery</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {gallery.map((image) => (
                  <div key={image.id} className="relative aspect-square overflow-hidden rounded-2xl">
                    <img
                      src={image.image_url}
                      alt={image.caption || mockProgram.title}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                     {image.caption && (
                       <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-charcoal/90 to-transparent p-4">
                         <p className="text-on-gradient-strong text-sm">{image.caption}</p>
                       </div>
                     )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Description & Benefits - Standardized */}
        <section className="section-standard bg-muted/30">
          <div className="container-narrow">
            {mockProgram.benefits.length > 0 && (
              <>
                <h2 className="text-section mb-8">What You'll Gain</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {mockProgram.benefits.map((benefit: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 card-feature p-4">
                      <Check className="w-5 h-5 text-sage mt-0.5 flex-shrink-0" />
                      <span className="text-high-contrast">{benefit}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Content sections - Standardized */}
        {content && content.what_to_expect && content.what_to_expect.length > 0 && (
          <section className="section-standard bg-background">
            <div className="container-narrow">
              <h2 className="text-section mb-8">What to Expect</h2>
              <div className="space-y-3">
                {content.what_to_expect.map((item: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 card-feature p-4">
                    <Target className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-medium-contrast">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Reviews - Standardized */}
        <section className="section-standard bg-muted/30">
          <div className="container-narrow">
            <h2 className="text-section text-center mb-12">Client Success Stories</h2>
            {reviews.length > 0 ? (
              <div className="grid-testimonials">
                {reviews.map((review) => (
                  <div key={review.id} className="card-testimonial hover-lift h-full">
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 transition-colors ${
                            i < review.rating ? 'fill-primary text-primary' : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    {review.title && <h3 className="font-semibold mb-2 text-high-contrast">{review.title}</h3>}
                    <p className="text-medium-contrast text-sm mb-3">{review.content}</p>
                    <p className="text-xs text-muted">
                      - {review.profiles?.full_name || 'Anonymous'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Star}
                title="No Reviews Yet"
                description="Be the first to review this program after your session."
              />
            )}
          </div>
        </section>

        {/* FAQs */}
        {faqs.length > 0 && (
          <section className="py-16 bg-background">
            <div className="container mx-auto px-6 md:px-8 max-w-4xl">
              <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id} className="bg-muted/30 rounded-lg px-6">
                    <AccordionTrigger className="text-left font-semibold">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-16 glass-card">
          <div className="container mx-auto px-6 md:px-8 max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Training?</h2>
            <p className="text-lg mb-8 text-muted-foreground">
              Book your first session and experience personalized coaching that gets results.
            </p>
            <Button 
              size="lg" 
              onClick={() => setIsBookingOpen(true)}
            >
              Book {mockProgram.title}
            </Button>
          </div>
        </section>

        {/* Sticky Mobile CTA */}
        <div className="md:hidden fixed bottom-16 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 z-40">
          <Button 
            size="lg" 
            className="w-full" 
            onClick={() => setIsBookingOpen(true)}
          >
            Book Now - {mockProgram.price_from && mockProgram.price_to 
              ? `${mockProgram.price_from}-${mockProgram.price_to}` 
              : `From ${mockProgram.price_from}`} PLN
          </Button>
        </div>
      </main>

      <BookingSheet
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        preselectedService={program?.id}
        services={services}
      />

      <Footer />
      <MobileFooter mode="fitness" />
    </div>
  );
};

export default FitnessProgramDetail;
