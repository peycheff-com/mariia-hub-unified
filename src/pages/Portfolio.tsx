import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { ResponsiveGallery } from "@/components/ui/responsive-image";
import { supabase } from "@/integrations/supabase/client";

const Portfolio = () => {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "beauty" | "fitness">("all");
  const { t } = useTranslation();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('service_gallery')
        .select('*, services(service_type, title)')
        .order('display_order');
      setImages(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = filter === 'all' ? images : images.filter(img => img.services?.service_type === filter);

  return (
    <div className="min-h-screen bg-background">
      <SEO title={t('portfolioPage.title')} description={t('blogSection.subtitle')} />
      <Navigation />
      <main className="pt-24 pb-24">
        <div className="container mx-auto px-6 md:px-8 max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold">{t('portfolioPage.title')}</h1>
            <div className="flex gap-2">
              {(["all","beauty","fitness"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full border ${filter===f?"bg-primary text-primary-foreground border-primary":"hover:bg-accent"}`}>
                  {t(`portfolioPage.filters.${f}`)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground">{t('portfolioPage.loading')}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-muted-foreground">{t('portfolioPage.empty')}</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filtered.map((img) => (
                <div key={img.id} className="relative aspect-square overflow-hidden rounded-2xl group">
                  <ResponsiveGallery
                    src={img.image_url}
                    alt={img.caption || img.services?.title || 'Portfolio'}
                    className="group-hover:scale-110 transition-transform duration-500"
                  />
                  {img.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent p-3">
                      <p className="text-foreground text-xs">{img.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Portfolio;


