import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Calendar, Clock, ArrowLeft, Eye } from "lucide-react";
import DOMPurify from "dompurify";

import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BlogComments from "@/components/BlogComments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  featured_image_url: string | null;
  published_at: string;
  view_count: number;
  blog_categories: {
    name: string;
    color: string;
  } | null;
  profiles: {
    full_name: string;
  };
}

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    if (slug) {
      loadPost();
    }
  }, [slug]);

  const loadPost = async () => {
    const { data, error } = await (supabase as any)
      .from("blog_posts")
      .select(`
        *,
        blog_categories (
          name,
          color
        ),
        profiles (
          full_name
        )
      `)
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (!error && data) {
      setPost(data);
      // Increment view count
      await (supabase as any)
        .from("blog_posts")
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq("id", data.id);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cocoa flex items-center justify-center">
        <div className="text-pearl">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-cocoa flex items-center justify-center">
        <div className="text-center">
          <p className="text-pearl mb-4">Post not found</p>
          <Link to="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cocoa">
      <SEO
        title={post.title}
        description={post.excerpt || undefined}
        ogTitle={post.title}
        ogDescription={post.excerpt || undefined}
        ogImage={post.featured_image_url || undefined}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": post.title,
          "image": post.featured_image_url || undefined,
          "datePublished": post.published_at,
          "author": {
            "@type": "Person",
            "name": post.profiles?.full_name || "Mariia Borysevych"
          },
          "publisher": {
            "@type": "Organization",
            "name": "BM BEAUTY STUDIO"
          }
        }}
      />
      <Navigation />
      
      <div className="pt-32 pb-24 px-6 md:px-8">
        <div className="container mx-auto max-w-4xl">
          <Link to="/blog">
            <Button variant="ghost" className="mb-8 text-pearl/70 hover:text-pearl">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('blog.backToBlog', 'Back to Blog')}
            </Button>
          </Link>

          {post.featured_image_url && (
            <div className="mb-8 rounded-3xl overflow-hidden">
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-[400px] object-cover"
              />
            </div>
          )}

          <article className="glass-card rounded-3xl p-8 md:p-12">
            <div className="flex flex-wrap items-center gap-4 mb-6">
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
              <div className="flex items-center text-sm text-pearl/60 gap-4">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(post.published_at).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {post.view_count} views
                </span>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-serif text-pearl mb-6">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-xl text-pearl/80 mb-8 italic">
                {post.excerpt}
              </p>
            )}

            <div className="mb-8 pb-8 border-b border-pearl/10">
              <p className="text-sm text-pearl/60">
                By {post.profiles.full_name}
              </p>
            </div>

            <div
              className="prose prose-invert max-w-none text-pearl/90 [&>h2]:text-pearl [&>h3]:text-pearl [&>p]:text-pearl/80 [&>ul]:text-pearl/80 [&>ol]:text-pearl/80"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
            />
          </article>

          {/* Comments Section */}
          <div className="mt-12">
            <BlogComments postId={post.id} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BlogPost;
