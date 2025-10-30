import { useState } from "react";
import { Mail, Phone, MapPin, ArrowRight, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";
import { ContactFormSchema } from "@/schemas";
import { cn } from "@/lib/utils";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";




const ContactSection = () => {
  const { toast aria-live="polite" aria-atomic="true" } = useToast();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    service: "Beauty Services",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    try {
      // Map form data to match ContactFormSchema
      const mappedData = {
        name: formData.name,
        email: formData.email,
        subject: `Booking Request: ${formData.service}`,
        message: formData.message,
        consent: true // Consent is implied by submitting the form
      };

      const _validatedData = ContactFormSchema.parse(mappedData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            const fieldName = err.path[0] as string;
            // Map subject field back to service for UI display
            const displayField = fieldName === 'subject' ? 'service' : fieldName;
            newErrors[displayField] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive"
      });
      return;
    }

    // Sanitize form data before creating mailto link
    const sanitizeInput = (input: string) => {
      return input
        .replace(/[\r\n]/g, ' ') // Remove newlines
        .replace(/[<>]/g, '') // Remove HTML brackets
        .trim();
    };

    const subject = encodeURIComponent(`Booking Request: ${sanitizeInput(formData.service)}`);
    const body = encodeURIComponent(
      `Name: ${sanitizeInput(formData.name)}\nPhone: ${sanitizeInput(formData.phone)}\nEmail: ${sanitizeInput(formData.email)}\nService: ${sanitizeInput(formData.service)}\n\nMessage:\n${sanitizeInput(formData.message)}`
    );

    window.location.href = `mailto:hi@mariiaborysevych.com?subject=${subject}&body=${body}`;

    toast aria-live="polite" aria-atomic="true"({
      title: t('contactSection.toast aria-live="polite" aria-atomic="true".title'),
      description: t('contactSection.toast aria-live="polite" aria-atomic="true".description'),
    });

    // Reset form
    setFormData({
      name: "",
      phone: "",
      email: "",
      service: "Beauty Services",
      message: "",
    });
    setErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const fieldName = e.target.name;
    setFormData(prev => ({
      ...prev,
      [fieldName]: e.target.value
    }));

    // Clear error for this field when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  return (
    <section id="contact" className="relative bg-cocoa py-24 md:py-32 overflow-hidden">
      {/* Subtle background accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-champagne/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-bronze/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-6 md:px-8 max-w-7xl relative z-10">
        {/* Split layout */}
        <div className="grid lg:grid-cols-2 gap-12 md:gap-16 lg:gap-24">
          {/* Left - Contact info */}
          <div className="space-y-10 md:space-y-12">
            <div className="space-y-5 md:space-y-6">
              <h2 className="text-5xl md:text-6xl lg:text-7xl leading-[0.9] text-pearl tracking-tight whitespace-pre-line">
                {t('contactSection.title')}
              </h2>
              <div className="w-16 h-[2px] bg-gradient-to-r from-champagne to-bronze" />
              <p className="text-lg md:text-xl text-pearl/90 font-light max-w-lg">
                {t('contactSection.subtitle')}
              </p>
            </div>

            <div className="space-y-8 pt-4">
              <a
                href="tel:+48536200573"
                className="group flex items-start gap-4"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-champagne/10 border border-champagne/20 flex-shrink-0 group-hover:bg-champagne/20 transition-colors">
                  <Phone className="h-5 w-5 text-champagne" strokeWidth={1.25} />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-pearl/80 uppercase tracking-wider">{t('contactSection.phone')}</div>
                  <div className="text-xl text-pearl group-hover:text-champagne transition-colors">
                    +48 536 200 573
                  </div>
                </div>
              </a>
              
              <a
                href="mailto:hi@mariiaborysevych.com"
                className="group flex items-start gap-4"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-champagne/10 border border-champagne/20 flex-shrink-0 group-hover:bg-champagne/20 transition-colors">
                  <Mail className="h-5 w-5 text-champagne" strokeWidth={1.25} />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-pearl/80 uppercase tracking-wider">{t('contactSection.email')}</div>
                  <div className="text-xl text-pearl group-hover:text-champagne transition-colors break-all">
                    hi@mariiaborysevych.com
                  </div>
                </div>
              </a>
              
              <div className="group flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-champagne/10 border border-champagne/20 flex-shrink-0">
                  <MapPin className="h-5 w-5 text-champagne" strokeWidth={1.25} />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-pearl/80 uppercase tracking-wider">{t('contactSection.studio')}</div>
                  <p className="text-xl text-pearl leading-relaxed">
                    ul. Smolna 8, lok. 254<br />
                    Warszawa, Poland
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-graphite/20 text-sm text-pearl/85 whitespace-pre-line">
                {t('contactSection.hours')}
              </div>
              
              {/* Book CTA + Booksy Link */}
              <div className="pt-8 space-y-4">
                <Button 
                  size="lg"
                  className="w-full"
                  asChild
                >
                  <a href="/book">
                    {t('contactSection.bookNow', 'Book Now')}
                  </a>
                </Button>
                <p className="text-center text-sm text-pearl/80">
                  {t('contactSection.preferBooksy', 'Prefer Booksy?')}{' '}
                  <a 
                    href="https://booksy.com/pl-pl/instant-experiences/venue/928044" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-champagne hover:underline"
                  >
                    {t('contactSection.bookThere', 'Book there')}
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Right - Form */}
          <div className="glass-card rounded-3xl p-8 lg:p-12 backdrop-blur-xl">
            <h3 className="text-2xl font-serif text-pearl mb-8">{t('contactSection.formTitle')}</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-xs text-pearl/90 uppercase tracking-wider">
                    {t('contactSection.form.name')} {t('contactSection.form.required')}
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t('contactSection.form.namePlaceholder')}
                    className={cn(errors.name && "border-red-500/50")}
                  />
                  {errors.name && (
                    <div className="text-red-400 text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.name}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-xs text-pearl/90 uppercase tracking-wider">
                    {t('contactSection.form.phoneLabel')}
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t('contactSection.form.phonePlaceholder')}
                    className={cn(errors.phone && "border-red-500/50")}
                  />
                  {errors.phone && (
                    <div className="text-red-400 text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.phone}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="block text-xs text-pearl/90 uppercase tracking-wider">
                  {t('contactSection.form.email')} {t('contactSection.form.required')}
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('contactSection.form.emailPlaceholder')}
                  className={cn(errors.email && "border-red-500/50")}
                />
                {errors.email && (
                  <div className="text-red-400 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="service" className="block text-xs text-pearl/90 uppercase tracking-wider">
                  {t('contactSection.form.service')} {t('contactSection.form.required')}
                </label>
                <Select
                  value={formData.service}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, service: value }));
                    if (errors.service) {
                      setErrors(prev => ({ ...prev, service: '' }));
                    }
                  }}
                >
                  <SelectTrigger className={cn(errors.service && "border-red-500/50")}>
                    <SelectValue placeholder={t('contactSection.form.services.beauty')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beauty Services">{t('contactSection.form.services.beauty')}</SelectItem>
                    <SelectItem value="Fitness Training">{t('contactSection.form.services.training')}</SelectItem>
                    <SelectItem value="Personal Consultation">{t('contactSection.form.services.consultation')}</SelectItem>
                  </SelectContent>
                </Select>
                {errors.service && (
                  <div className="text-red-400 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.service}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="message" className="block text-xs text-pearl/90 uppercase tracking-wider">
                  {t('contactSection.form.message')} {t('contactSection.form.required')}
                </label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={t('contactSection.form.messagePlaceholder')}
                  className={cn(errors.message && "border-red-500/50")}
                />
                {errors.message && (
                  <div className="text-red-400 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.message}
                  </div>
                )}
              </div>
              
              <Button type="submit" className="w-full group justify-between" size="lg">
                <span>{t('contactSection.form.send')}</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
