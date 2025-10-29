import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BeforeAfter {
  id: string;
  before: string;
  after: string;
  title: string;
  description: string;
}

const BeforeAfterSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [items, setItems] = useState<BeforeAfter[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        // Fetch featured gallery images from beauty services
        const { data: galleryData } = await supabase
          .from('service_gallery')
          .select('*, services!inner(title, service_type)')
          .eq('is_featured', true)
          .eq('services.service_type', 'beauty')
          .order('display_order')
          .limit(6);

        if (galleryData && galleryData.length > 0) {
          const formattedItems: BeforeAfter[] = galleryData.map((item: Record<string, unknown>) => ({
            id: item.id,
            before: item.image_url,
            after: item.image_url,
            title: item.services.title,
            description: item.caption || "Professional beauty transformation",
          }));
          setItems(formattedItems);
        } else {
          // No fallback images - rely on database content
          setItems([]);
        }
      } catch (_error) {
        toast({
          title: "Error",
          description: "Could not load gallery images",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryImages();
  }, [toast]);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  if (loading || items.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          size="icon"
          onClick={prev}
          className="rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 text-center">
          <h3 className="text-xl font-semibold mb-1">
            {items[currentIndex].title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {items[currentIndex].description}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={next}
          className="rounded-full"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="relative rounded-xl overflow-hidden">
          <img
            src={items[currentIndex].before}
            alt="Before"
            className="w-full h-80 object-cover"
          />
          <div className="absolute top-4 left-4 bg-secondary/90 text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
            Before
          </div>
        </div>
        <div className="relative rounded-xl overflow-hidden">
          <img
            src={items[currentIndex].after}
            alt="After"
            className="w-full h-80 object-cover"
          />
          <div className="absolute top-4 left-4 bg-secondary/90 text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
            After
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-6">
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentIndex
                ? "bg-primary w-8"
                : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default BeforeAfterSlider;
