import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";

const Reviews = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "beauty" | "fitness">("all");
  const { t } = useTranslation();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const query = supabase
        .from("reviews")
        .select("*, services(title, service_type)")
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      const { data } = await query;
      setReviews(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = filter === "all" ? reviews : reviews.filter(r => r.services?.service_type === filter);

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Client Reviews — Beauty & Fitness" description="Approved client reviews and success stories" />
      <Navigation />
      <main role="main" className="pt-24 pb-24">
        <div className="container mx-auto px-6 md:px-8 max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold">{t('reviewsPage.title')}</h1>
            <div className="flex gap-2">
              {(["all","beauty","fitness"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full border ${filter===f?"bg-primary text-primary-foreground border-primary":"hover:bg-accent"}`}>
                  {t(`reviewsPage.filters.${f}`)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground">{t('reviewsPage.loading')}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-muted-foreground">{t('reviewsPage.empty')}</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filtered.map((r) => (
                <div key={r.id} className="bg-muted/30 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < (r.rating || 0) ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                    ))}
                  </div>
                  <h3 className="font-semibold mb-1">{r.title || r.services?.title || "Review"}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{r.content}</p>
                  <div className="text-xs text-muted-foreground">{r.services?.service_type?.toUpperCase()}</div>
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

export default Reviews;
