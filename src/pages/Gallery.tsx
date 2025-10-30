import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Camera, Heart, Filter, Grid3x3, Maximize2, X } from "lucide-react";

import { SEO } from "@/components/SEO";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileFooter from "@/components/MobileFooter";
import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";


interface GalleryImage {
  id: string;
  url: string;
  title: string;
  category: string;
  description?: string;
  likes?: number;
  featured?: boolean;
}

const Gallery = () => {
  const { i18n } = useTranslation();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "masonry">("grid");

  // Sample gallery data - in production, this would come from Supabase
  const sampleImages: GalleryImage[] = [
    {
      id: "1",
      url: "/api/placeholder/400/600",
      title: "Microblading Brwi",
      category: "brows",
      description: "Naturalny efekt microbladingu",
      likes: 124,
      featured: true
    },
    {
      id: "2",
      url: "/api/placeholder/600/400",
      title: "Usta w Ombre",
      category: "lips",
      description: "Delikatny efekt ombre na ustach",
      likes: 89,
      featured: true
    },
    {
      id: "3",
      url: "/api/placeholder/400/400",
      title: "Eyeliner Permanentny",
      category: "eyes",
      description: "Precyzyjny eyeliner permanentny",
      likes: 67
    },
    {
      id: "4",
      url: "/api/placeholder/500/600",
      title: "Trening Personalny",
      category: "fitness",
      description: "Sesja treningowa personalna",
      likes: 156,
      featured: true
    },
    {
      id: "5",
      url: "/api/placeholder/600/500",
      title: "Laminacja Brwi",
      category: "brows",
      description: "Elegancka laminacja brwi",
      likes: 98
    },
    {
      id: "6",
      url: "/api/placeholder/400/500",
      title: "Makijaż Wieczorowy",
      category: "makeup",
      description: "Szykowny makijaż na wieczór",
      likes: 143
    },
    {
      id: "7",
      url: "/api/placeholder/500/400",
      title: "Zabieg Regenerujący",
      category: "treatment",
      description: "Luksusowy zabieg na twarz",
      likes: 76
    },
    {
      id: "8",
      url: "/api/placeholder/600/600",
      title: "Transformacja 8 Tygodni",
      category: "fitness",
      description: "Efekty programu treningowego",
      likes: 234,
      featured: true
    }
  ];

  useEffect(() => {
    // Simulate loading images
    setTimeout(() => {
      setImages(sampleImages);
      setLoading(false);
    }, 1000);
  }, []);

  const categories = [
    { id: "all", label: i18n.language === 'pl' ? "Wszystkie" : i18n.language === 'en' ? "All" : i18n.language === 'ua' ? "Всі" : "Все" },
    { id: "brows", label: i18n.language === 'pl' ? "Brwi" : i18n.language === 'en' ? "Brows" : i18n.language === 'ua' ? "Брові" : "Брови" },
    { id: "lips", label: i18n.language === 'pl' ? "Usta" : i18n.language === 'en' ? "Lips" : i18n.language === 'ua' ? "Губи" : "Губы" },
    { id: "eyes", label: i18n.language === 'pl' ? "Oczy" : i18n.language === 'en' ? "Eyes" : i18n.language === 'ua' ? "Очі" : "Глаза" },
    { id: "makeup", label: i18n.language === 'pl' ? "Makijaż" : i18n.language === 'en' ? "Makeup" : i18n.language === 'ua' ? "Макіяж" : "Макияж" },
    { id: "fitness", label: i18n.language === 'pl' ? "Fitness" : i18n.language === 'en' ? "Fitness" : i18n.language === 'ua' ? "Фітнес" : "Фитнес" },
    { id: "treatment", label: i18n.language === 'pl' ? "Zabiegi" : i18n.language === 'en' ? "Treatments" : i18n.language === 'ua' ? "Процедури" : "Процедуры" }
  ];

  const filteredImages = selectedCategory === "all"
    ? images
    : images.filter(img => img.category === selectedCategory);

  const featuredImages = images.filter(img => img.featured);

  const handleLike = (imageId: string) => {
    setImages(images.map(img =>
      img.id === imageId ? { ...img, likes: (img.likes || 0) + 1 } : img
    ));
    toast aria-live="polite" aria-atomic="true"({
      title: "Liked!",
      description: "You liked this photo",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Photo Gallery — Beauty & Fitness Results | Warsaw"
        description="Browse our photo gallery showcasing amazing transformations, makeup artistry, and fitness results from our satisfied clients."
        keywords="photo gallery Warsaw, beauty photos, fitness results, microblading before after, makeup portfolio"
      />
      <Navigation />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-background via-background to-muted/10 pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="absolute inset-0 bg-gradient-to-r from-rose/20 via-transparent to-background/30" />

        <div className="container mx-auto px-6 md:px-8 max-w-7xl relative z-10">
          <div className="max-w-4xl space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass-accent border border-champagne/20 animate-fade-rise">
              <Camera className="w-4 h-4 text-champagne-200" />
              <span className="text-xs font-body tracking-[0.3em] uppercase font-light text-champagne-200">
                {i18n.language === 'pl' ? "Galeria zdjęć" : i18n.language === 'en' ? "Photo Gallery" : i18n.language === 'ua' ? "Фотогалерея" : "Фотогалерея"}
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.85] text-pearl tracking-tight font-light font-display animate-fade-rise">
              <div className="space-y-2">
                <span className="block">
                  {i18n.language === 'pl' ? "Nasze" : i18n.language === 'en' ? "Our" : i18n.language === 'ua' ? "Наші" : "Наши"}
                </span>
                <span className="block bg-gradient-to-r from-rose via-champagne-200 to-champagne bg-clip-text text-transparent font-normal">
                  {i18n.language === 'pl' ? "Realizacje" : i18n.language === 'en' ? "Work" : i18n.language === 'ua' ? "Роботи" : "Работы"}
                </span>
              </div>
            </h1>

            <div className="w-24 h-[3px] bg-gradient-to-r from-rose via-champagne to-bronze rounded-full shadow-luxury animate-fade-rise-delay" />

            <p className="text-xl sm:text-2xl text-pearl/80 leading-relaxed font-light font-body max-w-3xl animate-fade-rise-delay">
              {i18n.language === 'pl'
                ? "Zobacz efekty naszej pracy – transformacje, które pokazują pasję i profesjonalizm w każdym detalu."
                : i18n.language === 'en'
                ? "See the results of our work – transformations that show passion and professionalism in every detail."
                : i18n.language === 'ua'
                ? "Перегляньте результати нашої роботи – трансформації, які демонструють пристрасть та професіоналізм у кожній деталі."
                : "Посмотрите результаты нашей работы – трансформации, показывающие страсть и профессионализм в каждой детали."}
            </p>
          </div>
        </div>
      </section>

      {/* Featured Gallery */}
      {!loading && featuredImages.length > 0 && (
        <section className="py-20 md:py-24 bg-gradient-to-b from-muted/10 to-transparent">
          <div className="container mx-auto px-6 md:px-8 max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-semibold text-pearl leading-tight tracking-tight mb-4">
                {i18n.language === 'pl' ? "Wyróżnione Prace" : i18n.language === 'en' ? "Featured Work" : i18n.language === 'ua' ? "Вибрані Роботи" : "Избранные Работы"}
              </h2>
              <p className="text-xl text-pearl/70 font-body max-w-2xl mx-auto">
                {i18n.language === 'pl'
                  ? "Najlepsze realizacje, z których jesteśmy szczególnie dumni"
                  : i18n.language === 'en'
                  ? "Best realizations we are particularly proud of"
                  : i18n.language === 'ua'
                  ? "Найкращі роботи, якими ми особливо пишаємося"
                  : "Лучшие работы, которыми мы особенно гордимся"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredImages.slice(0, 3).map((image, index) => (
                <div
                  key={image.id}
                  className="relative group cursor-pointer animate-fade-rise"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => setSelectedImage(image)}
                >
                  <div className="aspect-square overflow-hidden rounded-2xl">
                    <img
                      src={image.url}
                      alt={image.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl">
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-xl font-display font-semibold text-pearl mb-2">
                        {image.title}
                      </h3>
                      <p className="text-pearl/80 font-body text-sm">
                        {image.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery Controls */}
      <section className="py-8 md:py-12 sticky top-20 z-40 glass-card backdrop-blur-xl border-b border-champagne/20 bg-charcoal/80">
        <div className="container mx-auto px-6 md:px-8 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-champagne-200" />
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 border font-body ${
                      selectedCategory === category.id
                        ? "bg-gradient-brand text-brand-foreground shadow-luxury border-white/10 scale-105"
                        : "glass-subtle text-pearl/80 hover:text-pearl hover:bg-white/10 hover:border-white/20 border-white/10"
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid" ? "text-champagne-200" : "text-pearl/60 hover:text-pearl"
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("masonry")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "masonry" ? "text-champagne-200" : "text-pearl/60 hover:text-pearl"
                }`}
              >
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Gallery */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-6 md:px-8 max-w-7xl">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square bg-muted/20 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredImages.map((image, index) => (
                    <div
                      key={image.id}
                      className="relative group cursor-pointer animate-fade-rise"
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => setSelectedImage(image)}
                    >
                      <div className="aspect-square overflow-hidden rounded-2xl">
                        <img
                          src={image.url}
                          alt={image.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-lg font-display font-semibold text-pearl mb-1">
                            {image.title}
                          </h3>
                          <div className="flex items-center justify-between">
                            <p className="text-pearl/80 font-body text-sm">
                              {image.description}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLike(image.id);
                              }}
                              className="flex items-center gap-1 text-rose/80 hover:text-rose transition-colors"
                            >
                              <Heart className="w-4 h-4" />
                              <span className="text-xs">{image.likes}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
                  {filteredImages.map((image, index) => (
                    <div
                      key={image.id}
                      className="relative group cursor-pointer mb-4 animate-fade-rise break-inside-avoid"
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => setSelectedImage(image)}
                    >
                      <div className="overflow-hidden rounded-2xl">
                        <img
                          src={image.url}
                          alt={image.title}
                          className="w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-lg font-display font-semibold text-pearl mb-1">
                            {image.title}
                          </h3>
                          <div className="flex items-center justify-between">
                            <p className="text-pearl/80 font-body text-sm">
                              {image.description}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLike(image.id);
                              }}
                              className="flex items-center gap-1 text-rose/80 hover:text-rose transition-colors"
                            >
                              <Heart className="w-4 h-4" />
                              <span className="text-xs">{image.likes}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredImages.length === 0 && (
                <div className="text-center py-20">
                  <Camera className="w-20 h-20 text-champagne-200 mx-auto mb-6" />
                  <p className="text-xl text-pearl/70 font-body">
                    {i18n.language === 'pl'
                      ? "Brak zdjęć w tej kategorii"
                      : i18n.language === 'en'
                      ? "No photos in this category"
                      : i18n.language === 'ua'
                      ? "Немає фото в цій категорії"
                      : "Нет фото в этой категории"}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-charcoal/95 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full glass-subtle text-pearl hover:bg-white/10 transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-4xl w-full">
            <div className="relative">
              <img
                src={selectedImage.url}
                alt={selectedImage.title}
                className="w-full h-auto rounded-2xl"
              />
            </div>
            <div className="mt-6 text-center">
              <h3 className="text-2xl font-display font-semibold text-pearl mb-2">
                {selectedImage.title}
              </h3>
              <p className="text-pearl/80 font-body">
                {selectedImage.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section className="py-20 md:py-24 bg-gradient-to-r from-rose/10 via-champagne/10 to-bronze/10">
        <div className="container mx-auto px-6 md:px-8 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-pearl mb-4">
            {i18n.language === 'pl'
              ? "Chcesz Zobaczyć Więcej?"
              : i18n.language === 'en'
              ? "Want to See More?"
              : i18n.language === 'ua'
              ? "Хочете Більше?"
              : "Хотите Еще?"}
          </h2>
          <p className="text-xl text-pearl/80 font-body mb-8">
            {i18n.language === 'pl'
              ? "Umów się na konsultację i zobacz, jak możemy pomóc Ci osiągnąć podobne efekty"
              : i18n.language === 'en'
              ? "Book a consultation and see how we can help you achieve similar results"
              : i18n.language === 'ua'
              ? "Запишіться на консультацію і подивіться, як ми можемо допомогти Вам досягти подібних результатів"
              : "Запишитесь на консультацию и посмотрите, как мы можем помочь Вам достичь подобных результатов"}
          </p>
          <a
            href="/book"
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-brand text-brand-foreground rounded-full font-medium shadow-luxury hover:shadow-luxury-lg transition-all duration-300 hover:scale-105 text-lg group"
          >
            <span>{i18n.language === 'pl' ? "Umów Konsultację" : i18n.language === 'en' ? "Book Consultation" : i18n.language === 'ua' ? "Записати на Консультацію" : "Записать на Консультацию"}</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </section>

      <Footer />
      <MobileFooter mode="beauty" />
    </div>
  );
};

export default Gallery;