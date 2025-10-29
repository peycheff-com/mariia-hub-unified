import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "./ui/button";

const FitnessSection = () => {
  const { t } = useTranslation();
  
  const programs = [
    {
      number: t('fitnessSection.programs.personal.number'),
      title: t('fitnessSection.programs.personal.title'),
      description: t('fitnessSection.programs.personal.description'),
      features: t('fitnessSection.programs.personal.features', { returnObjects: true }) as string[],
    },
    {
      number: t('fitnessSection.programs.holistic.number'),
      title: t('fitnessSection.programs.holistic.title'),
      description: t('fitnessSection.programs.holistic.description'),
      features: t('fitnessSection.programs.holistic.features', { returnObjects: true }) as string[],
    },
    {
      number: t('fitnessSection.programs.strength.number'),
      title: t('fitnessSection.programs.strength.title'),
      description: t('fitnessSection.programs.strength.description'),
      features: t('fitnessSection.programs.strength.features', { returnObjects: true }) as string[],
    },
  ];

  return (
    <section id="fitness" className="relative bg-charcoal py-24 md:py-32">
      <div className="container mx-auto px-6 md:px-8 max-w-7xl">
        {/* Header */}
        <div className="max-w-4xl mb-16 md:mb-20 space-y-6 md:space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 glass-card rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />
            <span className="text-xs text-sage uppercase tracking-wider font-medium">{t('fitnessSection.badge')}</span>
          </div>
          
          <h2 className="text-5xl md:text-6xl lg:text-7xl leading-[0.9] text-pearl tracking-tight whitespace-pre-line">
            {t('fitnessSection.title')}
          </h2>
          
          <div className="w-16 h-[2px] bg-gradient-to-r from-sage to-champagne" />
          
          <p className="text-xl md:text-2xl text-pearl/90 leading-relaxed font-light max-w-3xl">
            {t('fitnessSection.description')}
          </p>
        </div>

        {/* Programs - Clean layout without overlapping numbers */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-16 md:mb-20">
          {programs.map((program, index) => (
            <div
              key={index}
              className="group relative glass-card rounded-3xl p-8 hover-scale transition-all duration-300"
            >
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-sage uppercase tracking-widest font-medium px-3 py-1 bg-sage/10 rounded-full">
                      {program.number}
                    </div>
                  </div>
                  <h3 className="text-2xl font-serif text-pearl">{program.title}</h3>
                  <div className="w-12 h-[1px] bg-sage/30 group-hover:w-full transition-all duration-300" />
                </div>
                
                <p className="text-pearl/90 leading-relaxed">{program.description}</p>
                
                <div className="space-y-2 pt-4">
                  {program.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-pearl/80">
                      <div className="w-1 h-1 rounded-full bg-sage" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 pt-12 border-t border-graphite/20">
          <div className="space-y-2">
            <p className="text-xl text-pearl font-light">{t('fitnessSection.cta')}</p>
            <p className="text-sm text-pearl/80">{t('fitnessSection.ctaDetails')}</p>
          </div>
          
          <Button 
            size="lg" 
            variant="outline"
            className="group bg-transparent border-pearl/30 text-pearl hover:bg-pearl/10"
            asChild
          >
            <Link to="/fitness/programs">
              {t('fitnessSection.ctaButton')}
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FitnessSection;
