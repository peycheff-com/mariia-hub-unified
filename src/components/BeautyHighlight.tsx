import { Link } from "react-router-dom";
import { Star, MapPin, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";

const BeautyHighlight = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-pearl/60 to-champagne/20">
      <div className="container mx-auto px-6 md:px-8 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="heading-serif text-4xl font-semibold mb-4 text-charcoal">Healed-first permanent makeup</h2>
          <p className="text-xl text-graphite text-body">
            Natural color, gentle technique, strict hygiene
          </p>
        </div>

        <BeforeAfterSlider />

        {/* How It Works */}
        <div className="grid md:grid-cols-3 gap-6 my-16">
          <div className="text-center">
            <div className="w-12 h-12 bg-lip-rose/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-semibold text-lip-rose heading-serif">1</span>
            </div>
            <h3 className="font-semibold mb-2 text-charcoal text-body">Consult</h3>
            <p className="text-sm text-graphite text-body">
              We design your perfect look together
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-lip-rose/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-semibold text-lip-rose heading-serif">2</span>
            </div>
            <h3 className="font-semibold mb-2 text-charcoal text-body">Procedure</h3>
            <p className="text-sm text-graphite text-body">
              Gentle work with premium pigments
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-lip-rose/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-semibold text-lip-rose heading-serif">3</span>
            </div>
            <h3 className="font-semibold mb-2 text-charcoal text-body">Aftercare</h3>
            <p className="text-sm text-graphite text-body">
              Full support through healing
            </p>
          </div>
        </div>

        {/* Trust Row */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-graphite mb-8">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-champagne fill-champagne" />
            <span className="font-medium">5.0 / 44 reviews</span>
            <span className="text-xs">(Booksy)</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span>Smolna 8, Śródmieście</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>Open 07:00–22:00</span>
          </div>
        </div>

        <div className="text-center">
          <Button size="lg" asChild>
            <Link to="/beauty/services">Book Beauty</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BeautyHighlight;
