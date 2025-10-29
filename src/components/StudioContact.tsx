import { MapPin, Phone, Mail, MessageCircle, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";

const StudioContact = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-6xl">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Visit the Studio</h2>
          <p className="text-lg md:text-xl text-muted-foreground">Smolna 8, in the heart of Warsaw</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Map Placeholder */}
          <div className="relative h-64 md:h-80 lg:h-96 glass-card rounded-3xl overflow-hidden animate-fade-in hover-lift order-2 lg:order-1">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2443.5!2d21.017532!3d52.235678!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTLCsDE0JzA4LjQiTiAyMcKwMDEnMDMuMSJF!5e0!3m2!1sen!2spl!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="BM BEAUTY Studio Location - Smolna 8, Warsaw"
            />
          </div>

          {/* Contact Info */}
          <div className="space-y-6 animate-fade-in order-1 lg:order-2">
            <div className="space-y-6">
              <div className="flex items-start gap-4 group">
                <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0 transition-transform group-hover:scale-110" />
                <div className="flex-1">
                  <p className="font-semibold mb-1">Address</p>
                  <p className="text-muted-foreground leading-relaxed">
                    ul. Smolna 8, lok. 254<br />
                    00-375 Warszawa, Śródmieście
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <Phone className="w-5 h-5 text-primary mt-1 flex-shrink-0 transition-transform group-hover:scale-110" />
                <div className="flex-1">
                  <p className="font-semibold mb-1">Phone / WhatsApp</p>
                  <a href="tel:+48536200573" className="text-muted-foreground hover:text-primary transition-colors break-words">
                    +48 536 200 573
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <Mail className="w-5 h-5 text-primary mt-1 flex-shrink-0 transition-transform group-hover:scale-110" />
                <div className="flex-1">
                  <p className="font-semibold mb-1">Email</p>
                  <a href="mailto:contact@bmbeauty.pl" className="text-muted-foreground hover:text-primary transition-colors break-words">
                    contact@bmbeauty.pl
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <Globe className="w-5 h-5 text-primary mt-1 flex-shrink-0 transition-transform group-hover:scale-110" />
                <div className="flex-1">
                  <p className="font-semibold mb-1">Languages</p>
                  <p className="text-muted-foreground">Polski / English / Українська</p>
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-3">
              <Button size="lg" className="w-full sm:w-auto" asChild>
                <a
                  href="https://wa.me/48536200573"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Message on WhatsApp
                </a>
              </Button>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Mon-Fri: 07:00–22:00<br />
                Sat-Sun: 09:00–20:00
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StudioContact;
