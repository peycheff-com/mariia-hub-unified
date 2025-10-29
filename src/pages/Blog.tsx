import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Calendar, Clock, ArrowRight } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileFooter from "@/components/MobileFooter";
import BlogPostSkeleton from "@/components/BlogPostSkeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";


interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image_url: string | null;
  published_at: string;
  view_count: number;
  blog_categories: {
    name: string;
    color: string;
  } | null;
}

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    const { data, error } = await (supabase as any)
      .from("blog_posts")
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image_url,
        published_at,
        view_count,
        blog_categories (
          name,
          color
        )
      `)
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (!error && data) {
      setPosts(data);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-cocoa">
      <SEO
        title="Journal — Beauty & Fitness Tips | Mariia Borysevych"
        description="Expert tips, trends, and insights on beauty and fitness. PMU aftercare, training fundamentals, Warsaw wellness guide."
        keywords="PMU aftercare, gentle training fundamentals, Warsaw fitness guide, beauty tips"
      />
      <Navigation />
      
      <div className="pt-32 pb-24 px-6 md:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-serif text-pearl mb-6">
              {t('blog.title', 'Beauty & Wellness Blog')}
            </h1>
            <p className="text-xl text-pearl/70 max-w-2xl mx-auto">
              {t('blog.subtitle', 'Expert tips, trends, and insights')}
            </p>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <BlogPostSkeleton key={i} />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center text-pearl/60">
              {t('blog.noPosts', 'No blog posts yet')}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`}>
                  <Card className="h-full hover-scale cursor-pointer overflow-hidden">
                    {post.featured_image_url && (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={post.featured_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center justify-between mb-3">
                        {post.blog_categories && (
                          <Badge
                            style={{
                              backgroundColor: `${post.blog_categories.color}20`,
                              color: post.blog_categories.color,
                            }}
                          >
                            {post.blog_categories.name}
                          </Badge>
                        )}
                        <div className="flex items-center text-xs text-pearl/50 gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(post.published_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                      {post.excerpt && (
                        <CardDescription className="line-clamp-3">
                          {post.excerpt}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-champagne font-medium text-sm group">
                        {t('blog.readMore', 'Read more')}
                        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
      <MobileFooter />
    </div>
  );
};

export default Blog;
