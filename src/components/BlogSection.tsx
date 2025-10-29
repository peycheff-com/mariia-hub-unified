import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import heroBeauty from "@/assets/hero-beauty.jpg";
import heroFitness from "@/assets/hero-fitness.jpg";
import heroLifestyle from "@/assets/hero-lifestyle.jpg";

const BlogSection = () => {
  const { t } = useTranslation();
  
  const blogPosts = [
    {
      title: t('blogSection.posts.art.title'),
      excerpt: t('blogSection.posts.art.excerpt'),
      image: heroBeauty,
      category: t('blogSection.posts.art.category'),
      date: "Mar 15",
      featured: true,
      url: "/blog",
    },
    {
      title: t('blogSection.posts.habits.title'),
      excerpt: t('blogSection.posts.habits.excerpt'),
      image: heroFitness,
      category: t('blogSection.posts.habits.category'),
      date: "Mar 10",
      url: "/blog",
    },
    {
      title: t('blogSection.posts.lifestyle.title'),
      excerpt: t('blogSection.posts.lifestyle.excerpt'),
      image: heroLifestyle,
      category: t('blogSection.posts.lifestyle.category'),
      date: "Mar 5",
      url: "/blog",
    },
  ];

  return (
    <section id="blog" className="relative bg-gradient-hero py-24 md:py-32">
      <div className="container mx-auto px-6 md:px-8 max-w-7xl">
        {/* Header */}
        <div className="mb-16 md:mb-20 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 md:gap-8 text-pearl">
          <div className="max-w-2xl space-y-5 md:space-y-6">
            <h2 className="text-5xl md:text-6xl lg:text-7xl leading-[0.9] tracking-tight whitespace-pre-line">
              {t('blogSection.title')}
            </h2>
            <div className="w-16 h-[2px] bg-gradient-to-r from-champagne to-bronze" />
            <p className="text-lg md:text-xl text-pearl/80 font-light">
              {t('blogSection.subtitle')}
            </p>
          </div>
          
          <button 
            onClick={() => window.open('/blog', '_self')}
            className="group flex items-center gap-3 text-pearl hover:text-champagne transition-colors"
          >
            <span className="text-sm uppercase tracking-wider">{t('blogSection.viewAll')}</span>
            <div className="w-10 h-10 rounded-full border border-pearl/40 group-hover:border-champagne flex items-center justify-center group-hover:bg-champagne/10 transition-all">
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>
        </div>

        {/* Magazine-style layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Featured post - spans 8 columns */}
          <a
            href={blogPosts[0].url}
            target="_blank"
            rel="noopener noreferrer"
            className="lg:col-span-8 group cursor-pointer block"
          >
            <div className="relative h-[50vh] md:h-[60vh] lg:h-[70vh] rounded-3xl overflow-hidden hover-scale transition-all duration-300">
              <img
                src={blogPosts[0].image}
                alt={blogPosts[0].title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-cocoa via-cocoa/40 to-transparent" />

              {/* Content overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-12 space-y-4">
                <div className="flex items-center gap-3 text-xs text-pearl/95">
                  <span className="px-3 py-1.5 bg-lip-rose/90 backdrop-blur-sm rounded-full font-medium uppercase tracking-wider">
                    {blogPosts[0].category}
                  </span>
                  <span>{blogPosts[0].date}</span>
                </div>

                <h3 className="text-2xl md:text-3xl lg:text-5xl font-serif text-pearl leading-tight max-w-2xl">
                  {blogPosts[0].title}
                </h3>

                <p className="text-base md:text-lg text-pearl/90 max-w-xl">
                  {blogPosts[0].excerpt}
                </p>

                <div className="flex items-center gap-2 text-pearl pt-4 group-hover:gap-4 transition-all">
                  <span className="text-sm uppercase tracking-wider">{t('blogSection.readArticle')}</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          </a>

          {/* Side posts - spans 4 columns */}
          <div className="lg:col-span-4 space-y-6">
            {blogPosts.slice(1).map((post, index) => (
              <a
                key={index}
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group cursor-pointer glass-card rounded-3xl overflow-hidden hover-scale transition-all duration-300 block h-full"
              >
                <div className="h-40 md:h-48 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="p-4 md:p-6 space-y-3">
                  <div className="flex items-center gap-3 text-xs">
                    <span className={`px-3 py-1 rounded-full font-medium uppercase tracking-wider ${
                      post.category === t('blogSection.posts.habits.category') ? 'bg-sage/20 text-pearl' : 'bg-bronze/20 text-pearl'
                    }`}>
                      {post.category}
                    </span>
                    <span className="text-pearl/90">{post.date}</span>
                  </div>

                  <h4 className="text-lg md:text-xl font-serif text-pearl leading-snug group-hover:text-champagne transition-colors">
                    {post.title}
                  </h4>

                  <p className="text-sm text-pearl/95 leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center gap-2 text-champagne text-sm pt-2 group-hover:gap-3 transition-all">
                    <span>{t('blogSection.read')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
