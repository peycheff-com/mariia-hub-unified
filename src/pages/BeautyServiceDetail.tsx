import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Clock, Check, Star, Shield, AlertCircle } from "lucide-react";

import { useBooking } from "@/contexts/BookingContext";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileFooter from "@/components/MobileFooter";
import BookingSheet from "@/components/booking/BookingSheet";
import { Button } from "@/components/ui/button";
import { ResponsiveCard } from "@/components/ui/responsive-image";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAnalytics } from "@/hooks/useAnalytics";
import EmptyState from "@/components/EmptyState";
import AvailableSlotsList from "@/components/AvailableSlotsList";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ServiceDetail, ServiceGallery, ServiceFAQ, ServiceContent, ServiceReview } from "@/types/services";
import { SEOHead } from "@/components/seo/SEOHead";
import { useStructuredData } from "@/components/seo/StructuredDataHook";

const BeautyServiceDetail = () => {
  const { slug } = useParams();
  const { toast } = useToast();
  const { trackPageView } = useAnalytics();
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [gallery, setGallery] = useState<ServiceGallery[]>([]);
  const [faqs, setFaqs] = useState<ServiceFAQ[]>([]);
  const [content, setContent] = useState<ServiceContent | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [services, setServices] = useState<ServiceDetail[]>([]);
  const { generateServiceSchema, generateFAQSchema, generateBreadcrumbSchema } = useStructuredData();

  useEffect(() => {
    trackPageView('beauty-service-detail');
    loadServices();
    fetchServiceDetails();
  }, [slug]);

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
      toast({
        title: "Error",
        description: "Could not load services",
        variant: "destructive",
      });
    }
  };

  const fetchServiceDetails = async () => {
      try {
        // Fetch service
        const { data: serviceData, error: serviceError } = await supabase
          .from('services')
          .select('*')
          .eq('slug', slug)
          .eq('service_type', 'beauty')
          .maybeSingle();

        if (serviceError) throw serviceError;
        setService(serviceData);

        if (serviceData) {
          // Track service view
          trackPageView('beauty-service');
          // Fetch gallery
          const { data: galleryData } = await supabase
            .from('service_gallery')
            .select('*')
            .eq('service_id', serviceData.id)
            .order('display_order');
          setGallery(galleryData || []);

          // Fetch FAQs
          const { data: faqsData } = await supabase
            .from('service_faqs')
            .select('*')
            .eq('service_id', serviceData.id)
            .order('display_order');
          setFaqs(faqsData || []);

          // Fetch content
          const { data: contentData } = await supabase
            .from('service_content')
            .select('*')
            .eq('service_id', serviceData.id)
            .maybeSingle();
          setContent(contentData);

          // Fetch reviews
          const { data: reviewsData } = await supabase
            .from('reviews')
            .select('*, profiles(full_name)')
            .eq('service_id', serviceData.id)
            .eq('is_approved', true)
            .order('created_at', { ascending: false });
          setReviews(reviewsData || []);
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Could not load service details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation mode="beauty" />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation mode="beauty" />
        <div className="container-standard py-24 text-center">
          <AlertCircle className="w-16 h-16 text-muted mx-auto mb-4" />
          <h1 className="text-hero text-3xl mb-2">Service Not Found</h1>
          <p className="text-description text-muted mb-6">The service you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/beauty/services">Back to Services</Link>
          </Button>
        </div>
      </div>
    );
  }

  const mockService = {
    ...service,
    benefits: service.features || [],
  };

  const storageBase = 'https://lckxvimdqnfjzkbrusgu.supabase.co/storage/v1/object/public/site-images/services';
  const storageFallback = service?.slug ? `${storageBase}/${service.slug}-hero.png` : undefined;

  // Enhanced SEO for service detail page
  const serviceStructuredData = service && service.title ? {
    ...generateServiceSchema(service),
    ...generateBreadcrumbSchema(),
    mainEntity: {
      "@type": "BeautyService",
      name: service.title,
      description: service.description,
      provider: {
        "@type": "BeautySalon",
        name: "mariiaborysevych",
        address: {
          "@type": "PostalAddress",
          streetAddress: "ul. Marszałkowska 123",
          addressLocality: "Warsaw",
          addressCountry: "PL"
        }
      },
      offers: {
        "@type": "Offer",
        price: service.price_from,
        priceCurrency: "PLN",
        availability: "https://schema.org/InStock",
        priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      areaServed: {
        "@type": "City",
        name: "Warsaw"
      }
    }
  } : generateBreadcrumbSchema();

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navigation mode="beauty" />

      {/* SEO Meta Tags */}
      {service && service.title && (
        <SEOHead
          title={`${service.title} - Beauty Service | mariiaborysevych Warsaw`}
          description={service.description}
          keywords={`${service.title}, beauty service Warsaw, ${service.category || 'beauty treatment'}, PMU, brow lamination, lip enhancements, mariiaborysevych`}
          ogImage={storageFallback || '/og-default-service.webp'}
          ogType="article"
          structuredData={serviceStructuredData}
        />
      )}

      <main role="main" className="pt-20">
        {/* Hero Section */}
        <section className="relative py-16 bg-gradient-to-br from-lip-rose/10 to-champagne/10">
          <div className="container mx-auto px-6 md:px-8 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Link
                  to="/beauty/services"
                  className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                  ← Back to Services
                </Link>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">{mockService.title}</h1>
                <p className="text-xl text-muted-foreground mb-6">{mockService.description}</p>

                <div className="flex flex-wrap gap-4 mb-8">
                  {mockService.duration_minutes && (
                    <div className="flex items-center gap-2 bg-background/50 backdrop-blur px-4 py-2 rounded-full">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="font-medium">{mockService.duration_minutes} min</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 bg-background/50 backdrop-blur px-4 py-2 rounded-full">
                    <span className="text-2xl font-bold">
                      {mockService.price_from && mockService.price_to 
                        ? `${mockService.price_from}-${mockService.price_to}` 
                        : `From ${mockService.price_from}`} PLN
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    size="lg" 
                    className="w-full md:w-auto min-h-[48px]"
                    onClick={() => setIsBookingOpen(true)}
                    aria-label={`Book ${mockService.title} service`}
                  >
                    Book This Service
                  </Button>
                  
                  </div>
              </div>

              <div className="relative">
                {(mockService.image_url || (gallery[0]?.image_url) || storageFallback) && (
                  <ResponsiveCard
                    src={mockService.image_url || gallery[0]?.image_url || storageFallback}
                    alt={mockService.title}
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
            <AvailableSlotsList serviceType="beauty" limit={6} showViewAll={false} />
          </div>
        </section>

        {/* Gallery - Standardized */}
        {gallery.length > 0 ? (
          <section className="section-standard bg-background">
            <div className="container-standard">
              <h2 className="text-section text-center mb-12">Gallery</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {gallery.map((image) => (
                  <div key={image.id} className="relative aspect-square overflow-hidden rounded-2xl group">
                    <img
                      src={image.image_url}
                      alt={image.caption || mockService.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
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
        ) : null}

        {/* Description & Benefits - Standardized */}
        <section className="section-standard bg-muted/30">
          <div className="container-narrow">
            {mockService.benefits.length > 0 && (
              <>
                <h2 className="text-section mb-8">What You'll Love</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {mockService.benefits.map((benefit: string, idx: number) => (
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

        {/* What to Expect & Contraindications - Standardized */}
        {content && (
          <section className="section-standard bg-background">
            <div className="container-narrow">
              {content.what_to_expect && content.what_to_expect.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-section mb-8">What to Expect</h2>
                  <div className="space-y-3">
                    {content.what_to_expect.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 card-feature p-4">
                        <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-medium-contrast">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {content.contraindications && content.contraindications.length > 0 && (
                <div className="p-6 bg-destructive/10 rounded-xl border-l-4 border-destructive">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-destructive" />
                    Contraindications
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    This service may not be suitable if you have:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {content.contraindications.map((item: string, idx: number) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {content.aftercare_instructions && (
                <div className="mt-8 p-6 bg-primary/10 rounded-xl">
                  <h3 className="font-semibold mb-3">Aftercare Instructions</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{content.aftercare_instructions}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Reviews - Standardized */}
        <section className="section-standard bg-muted/30">
          <div className="container-narrow">
            <h2 className="text-section text-center mb-12">Client Reviews</h2>
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
                description="Be the first to review this service after your appointment."
              />
            )}
          </div>
        </section>

        {/* FAQs - Standardized */}
        {faqs.length > 0 && (
          <section className="section-standard bg-background">
            <div className="container-narrow">
              <h2 className="text-section text-center mb-12">Frequently Asked Questions</h2>
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
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg mb-8 text-muted-foreground">
              Book your consultation today and take the first step toward effortless beauty.
            </p>
            <Button 
              size="lg" 
              onClick={() => setIsBookingOpen(true)}
            >
              Book {mockService.title}
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
            Book Now - {mockService.price_from && mockService.price_to 
              ? `${mockService.price_from}-${mockService.price_to}` 
              : `From ${mockService.price_from}`} PLN
          </Button>
        </div>
      </main>

      <Footer />
      <MobileFooter mode="beauty" />
      
      <BookingSheet
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        preselectedService={service?.id}
        services={services}
      />
    </div>
  );
};

export default BeautyServiceDetail;
