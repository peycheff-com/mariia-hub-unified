import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Instagram, Facebook, Twitter, ExternalLink, Image as ImageIcon } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

interface SocialPost {
  id: string;
  platform: string;
  post_url: string;
  image_url: string | null;
  caption: string | null;
  posted_at: string;
  is_featured: boolean;
}

const SocialFeed = () => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    const { data, error } = await (supabase as any)
      .from("social_posts")
      .select("*")
      .order("posted_at", { ascending: false })
      .limit(6);

    if (!error && data) {
      setPosts(data);
    }
    setLoading(false);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram":
        return <Instagram className="w-5 h-5" />;
      case "facebook":
        return <Facebook className="w-5 h-5" />;
      case "twitter":
        return <Twitter className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "instagram":
        return "from-purple-600 to-pink-500";
      case "facebook":
        return "from-blue-600 to-blue-400";
      case "twitter":
        return "from-sky-500 to-blue-500";
      default:
        return "from-champagne to-bronze";
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
              <div className="relative aspect-square bg-muted animate-pulse" />
              <CardContent className="p-5 space-y-3">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className={`grid gap-6 ${posts.length === 1 ? 'md:grid-cols-1 max-w-md mx-auto' : posts.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
        {posts.map((post) => (
          <a
            key={post.id}
            href={post.post_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <Card className="overflow-hidden hover-scale h-full border-border/50 bg-card/50 backdrop-blur-sm">
              {post.image_url ? (
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <img
                    src={post.image_url}
                    alt={post.caption || "Social post"}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent && parent.querySelector) {
                        const fallback = parent.querySelector('.image-fallback');
                        if (fallback) {
                          (fallback as HTMLElement).style.display = 'flex';
                        }
                      }
                    }}
                  />
                  <div className="image-fallback hidden w-full h-full absolute inset-0 flex-col items-center justify-center text-muted-foreground">
                    <Instagram className="w-12 h-12 mb-2" />
                    <span className="text-sm">Image unavailable</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-5 h-5 text-foreground" />
                  </div>
                  <div
                    className={`absolute top-4 right-4 w-10 h-10 rounded-full bg-gradient-to-br ${getPlatformColor(
                      post.platform
                    )} flex items-center justify-center text-primary-foreground shadow-lg`}
                  >
                    {getPlatformIcon(post.platform)}
                  </div>
                </div>
              ) : (
                <div className="relative aspect-square bg-muted flex flex-col items-center justify-center text-muted-foreground">
                  <Instagram className="w-12 h-12 mb-2" />
                  <span className="text-sm">No image</span>
                </div>
              )}
              {post.caption && (
                <CardContent className="p-5">
                  <p className="text-sm leading-relaxed line-clamp-3 text-muted-foreground mb-3">
                    {post.caption}
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    {new Date(post.posted_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </CardContent>
              )}
            </Card>
          </a>
        ))}
      </div>

      <div className="text-center pt-4">
        <a
          href="https://www.instagram.com/bm.beauty.permanent/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group"
        >
          <Instagram className="w-5 h-5 text-primary transition-transform group-hover:scale-110" />
          <span className="font-medium">
            {t('social.followInstagram', 'Follow on Instagram')}
          </span>
        </a>
      </div>
    </div>
  );
};

export default SocialFeed;
