import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Gift, Heart, Star, Check, CreditCard, Mail, Download } from "lucide-react";

import { SEO } from "@/components/SEO";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileFooter from "@/components/MobileFooter";
import { useToast } from "@/hooks/use-toast";


const GiftCards = () => {
  const { i18n } = useTranslation();
  const { toast } = useToast();
  const [selectedAmount, setSelectedAmount] = useState("200");
  const [customAmount, setCustomAmount] = useState("");
  const [formData, setFormData] = useState({
    recipientName: "",
    recipientEmail: "",
    senderName: "",
    senderEmail: "",
    message: "",
    deliveryDate: "",
    template: "elegant"
  });

  const giftAmounts = [
    { value: "100", label: "100 PLN" },
    { value: "200", label: "200 PLN" },
    { value: "300", label: "300 PLN" },
    { value: "500", label: "500 PLN" },
    { value: "750", label: "750 PLN" },
    { value: "1000", label: "1000 PLN" }
  ];

  const templates = [
    {
      id: "elegant",
      name: i18n.language === 'pl' ? "Elegancki" : i18n.language === 'en' ? "Elegant" : "Elegant",
      preview: "🎁"
    },
    {
      id: "beauty",
      name: "Beauty",
      preview: "💄"
    },
    {
      id: "fitness",
      name: "Fitness",
      preview: "💪"
    },
    {
      id: "birthday",
      name: i18n.language === 'pl' ? "Urodzinowy" : i18n.language === 'en' ? "Birthday" : "Birthday",
      preview: "🎂"
    }
  ];

  const benefits = [
    {
      icon: Check,
      title: i18n.language === 'pl' ? "Ważność 12 Miesięcy" : i18n.language === 'en' ? "12 Month Validity" : "12 Month Validity",
      description: i18n.language === 'pl'
        ? "Voucher jest ważny przez 12 miesięcy od daty zakupu"
        : "Voucher is valid for 12 months from purchase date"
    },
    {
      icon: Check,
      title: i18n.language === 'pl' ? "Szeroki Wybór Usług" : i18n.language === 'en' ? "Wide Service Selection" : "Wide Service Selection",
      description: i18n.language === 'pl'
        ? "Możliwość wykorzystania na wszystkie usługi w naszej ofercie"
        : "Can be used for all services in our offer"
    },
    {
      icon: Check,
      title: i18n.language === 'pl' ? "Eleganckie Opakowanie" : i18n.language === 'en' ? "Elegant Packaging" : "Elegant Packaging",
      description: i18n.language === 'pl'
        ? "Piękne opakowanie dostępne przy odbiorze osobistym"
        : "Beautiful packaging available for personal pickup"
    },
    {
      icon: Check,
      title: i18n.language === 'pl' ? "Natychmiastowa Dostawa" : i18n.language === 'en' ? "Instant Delivery" : "Instant Delivery",
      description: i18n.language === 'pl'
        ? "Voucher elektroniczny wysyłany natychmiast po zakupie"
        : "Electronic voucher sent immediately after purchase"
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: i18n.language === 'pl' ? "Zamówienie Przyjęte" : i18n.language === 'en' ? "Order Received" : "Order Received",
      description: i18n.language === 'pl'
        ? "Przetwarzamy Twoje zamówienie. Voucher zostanie wysłany wkrótce."
        : "We're processing your order. The voucher will be sent shortly.",
    });
  };

  const finalAmount = customAmount || selectedAmount;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Gift Cards — Perfect Gift for Beauty & Fitness | Warsaw"
        description="Buy gift cards for beauty treatments, fitness programs and wellness services. Perfect gift for any occasion."
        keywords="gift cards Warsaw, voucher beauty, bon podarunkowy, prezent urodzinowy, karta podarunkowa"
      />
      <Navigation />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-background via-background to-muted/10 pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="absolute inset-0 bg-gradient-to-r from-rose/20 via-transparent to-background/30" />

        <div className="container mx-auto px-6 md:px-8 max-w-7xl relative z-10">
          <div className="max-w-4xl space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass-accent border border-champagne/20 animate-fade-rise">
              <Gift className="w-4 h-4 text-champagne-200" />
              <span className="text-xs font-body tracking-[0.3em] uppercase font-light text-champagne-200">
                {i18n.language === 'pl' ? "Vouchery podarunkowe" : i18n.language === 'en' ? "Gift Cards" : "Gift Cards"}
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.85] text-pearl tracking-tight font-light font-display animate-fade-rise">
              <div className="space-y-2">
                <span className="block">
                  {i18n.language === 'pl' ? "Idealny" : i18n.language === 'en' ? "Perfect" : "Perfect"}
                </span>
                <span className="block bg-gradient-to-r from-rose via-champagne-200 to-champagne bg-clip-text text-transparent font-normal">
                  {i18n.language === 'pl' ? "Prezent" : i18n.language === 'en' ? "Gift" : "Gift"}
                </span>
              </div>
            </h1>

            <div className="w-24 h-[3px] bg-gradient-to-r from-rose via-champagne to-bronze rounded-full shadow-luxury animate-fade-rise-delay" />

            <p className="text-xl sm:text-2xl text-pearl/80 leading-relaxed font-light font-body max-w-3xl animate-fade-rise-delay">
              {i18n.language === 'pl'
                ? "Podaruj voucher podarunkowy na luksusowe zabiegi beauty i fitness. Niezwykły prezent, który sprawi radość każdemu."
                : i18n.language === 'en'
                ? "Give a gift voucher for luxury beauty and fitness treatments. An extraordinary gift that will bring joy to anyone."
                : "Give a gift voucher for luxury beauty and fitness treatments. An extraordinary gift that will bring joy to anyone."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-rise-delay">
              <Link
                to="#contact"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-brand text-brand-foreground rounded-full font-medium shadow-luxury hover:shadow-luxury-lg transition-all duration-300 hover:scale-105 group"
              >
                <span>{i18n.language === 'pl' ? "Skontaktuj się" : i18n.language === 'en' ? "Contact Us" : "Contact Us"}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="#services"
                className="inline-flex items-center gap-3 px-8 py-4 glass-subtle text-pearl rounded-full font-medium border border-champagne/20 hover:bg-white/10 transition-all duration-300"
              >
                <span>{i18n.language === 'pl' ? "Zobacz Ofertę" : i18n.language === 'en' ? "View Offer" : "View Offer"}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 md:py-24 bg-gradient-to-b from-muted/10 to-transparent">
        <div className="container mx-auto px-6 md:px-8 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="glass-card p-6 rounded-2xl border border-champagne/20 hover:border-champagne/40 transition-all duration-300 hover:scale-105 animate-fade-rise"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full glass-accent flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-5 h-5 text-champagne-200" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-semibold text-pearl mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-pearl/70 font-body text-sm leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-24 bg-gradient-to-r from-rose/10 via-champagne/10 to-bronze/10">
        <div className="container mx-auto px-6 md:px-8 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-pearl mb-4">
            {i18n.language === 'pl'
              ? "Gotowy na idealny prezent?"
              : i18n.language === 'en'
              ? "Ready for a perfect gift?"
              : "Ready for a perfect gift?"}
          </h2>
          <p className="text-xl text-pearl/80 font-body mb-8">
            {i18n.language === 'pl'
              ? "Skontaktuj się z nami, a my pomożemy Ci wybrać idealny voucher"
              : i18n.language === 'en'
              ? "Contact us and we'll help you choose the perfect voucher"
              : "Contact us and we'll help you choose the perfect voucher"}
          </p>
          <a
            href="mailto:info@mariia-hub.pl"
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-brand text-brand-foreground rounded-full font-medium shadow-luxury hover:shadow-luxury-lg transition-all duration-300 hover:scale-105 text-lg group"
          >
            <span>{i18n.language === 'pl' ? "Skontaktuj się" : i18n.language === 'en' ? "Contact Us" : "Contact Us"}</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </section>

      <Footer />
      <MobileFooter mode="beauty" />
    </div>
  );
};

export default GiftCards;