import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";


const Aftercare = () => {
  const [sections, setSections] = useState<{ title: string; items: string[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('service_content')
        .select('service_id, aftercare_instructions, services(title, service_type)')
        .not('aftercare_instructions', 'is', null);
      const aggregated: Record<string, string[]> = {};
      (data || []).forEach((row: any) => {
        const key = row.services?.service_type || 'general';
        const list = (row.aftercare_instructions || '').split('\n').map((s: string) => s.trim()).filter(Boolean);
        aggregated[key] = [...(aggregated[key]||[]), ...list];
      });
      const ordered = Object.entries(aggregated).map(([k, v]) => ({ title: k.toUpperCase(), items: Array.from(new Set(v)) }));
      setSections(ordered);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEO title={t('aftercarePage.title')} description={t('aftercarePage.subtitle')} />
      <Navigation />
      <main className="pt-24 pb-24">
        <div className="container mx-auto px-6 md:px-8 max-w-5xl">
          <h1 className="text-4xl font-bold mb-6">{t('aftercarePage.title')}</h1>
          <p className="text-muted-foreground mb-10">{t('aftercarePage.subtitle')}</p>
          {loading ? (
            <div className="text-center text-muted-foreground">{t('aftercarePage.loading')}</div>
          ) : sections.length === 0 ? (
            <div className="text-center text-muted-foreground">{t('aftercarePage.empty')}</div>
          ) : (
            <div className="space-y-8">
              {sections.map((sec, idx) => (
                <section key={idx} className="bg-muted/30 rounded-2xl p-6">
                  <h2 className="text-2xl font-semibold mb-4">{sec.title}</h2>
                  <ul className="list-disc ml-6 space-y-2 text-sm text-muted-foreground">
                    {sec.items.map((it, i) => (<li key={i}>{it}</li>))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Aftercare;


