import { useState, useEffect } from "react";
import { Plus, Trash2, Star, Facebook, Twitter } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ImageWithFallback = ({ src }: { src: string }) => {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className="w-full h-32 bg-charcoal/50 rounded-lg flex flex-col items-center justify-center text-pearl/40">
        <span className="text-xs">Image unavailable</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt="Social post"
      className="w-full h-full object-cover"
      onError={() => setError(true)}
    />
  );
};

interface SocialPost {
  id: string;
  platform: string;
  post_url: string;
  image_url: string | null;
  caption: string | null;
  posted_at: string;
  is_featured: boolean;
}

const SocialPostsManagement = () => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    platform: "facebook",
    post_url: "",
    image_url: "",
    caption: "",
    posted_at: new Date().toISOString().split("T")[0],
  });
  const { toast } = useToast();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    const { data, error } = await (supabase as any)
      .from("social_posts")
      .select("*")
      .order("posted_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await (supabase as any)
      .from("social_posts")
      .insert([formData]);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Social post added successfully",
      });
      setDialogOpen(false);
      setFormData({
        platform: "facebook",
        post_url: "",
        image_url: "",
        caption: "",
        posted_at: new Date().toISOString().split("T")[0],
      });
      loadPosts();
    }
  };

  const toggleFeatured = async (postId: string, currentStatus: boolean) => {
    const { error } = await (supabase as any)
      .from("social_posts")
      .update({ is_featured: !currentStatus })
      .eq("id", postId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      loadPosts();
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    const { error } = await (supabase as any)
      .from("social_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
      loadPosts();
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "facebook":
        return <Facebook className="w-5 h-5" />;
      case "twitter":
        return <Twitter className="w-5 h-5" />;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="text-pearl">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif text-pearl">Social Media Posts</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Post
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-charcoal border-graphite/30 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-pearl">Add Social Media Post</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-pearl/70" htmlFor="platform">Platform</label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) => setFormData({ ...formData, platform: value })}
                >
                  <SelectTrigger className="bg-cocoa/60 border-pearl/30 text-pearl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-charcoal border-pearl/30">
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-pearl/70" htmlFor="post-url">Post URL *</label>
                <Input
                  value={formData.post_url}
                  onChange={(e) => setFormData({ ...formData, post_url: e.target.value })}
                  placeholder="https://facebook.com/..."
                  className="bg-cocoa/60 border-pearl/30 text-pearl"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-pearl/70" htmlFor="image-url">Image URL</label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="bg-cocoa/60 border-pearl/30 text-pearl"
                />
                
              </div>

              <div className="space-y-2">
                <label className="text-sm text-pearl/70" htmlFor="caption">Caption</label>
                <Textarea
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  placeholder="Post caption..."
                  className="bg-cocoa/60 border-pearl/30 text-pearl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-pearl/70" htmlFor="posted-date">Posted Date *</label>
                <Input
                  type="date"
                  value={formData.posted_at}
                  onChange={(e) => setFormData({ ...formData, posted_at: e.target.value })}
                  className="bg-cocoa/60 border-pearl/30 text-pearl"
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                Add Post
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-pearl/60">No social posts yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getPlatformIcon(post.platform)}
                    <span className="text-sm text-pearl/70 capitalize">{post.platform}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={post.is_featured}
                      onCheckedChange={() => toggleFeatured(post.id, post.is_featured)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePost(post.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {post.image_url ? (
                  <div className="relative w-full h-32 bg-charcoal/50 rounded-lg overflow-hidden">
                    <ImageWithFallback src={post.image_url} alt="Image" />
                  </div>
                ) : null}
                {post.caption && (
                  <p className="text-sm text-pearl/80 line-clamp-3">{post.caption}</p>
                )}
                <div className="flex items-center justify-between text-xs text-pearl/50">
                  <span>{new Date(post.posted_at).toLocaleDateString()}</span>
                  {post.is_featured && (
                    <span className="flex items-center gap-1 text-champagne">
                      <Star className="w-3 h-3 fill-current" />
                      Featured
                    </span>
                  )}
                </div>
                <a
                  href={post.post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-champagne hover:text-champagne/80 text-sm"
                >
                  View Original Post →
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SocialPostsManagement;
