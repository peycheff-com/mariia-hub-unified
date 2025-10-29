import { useState, useEffect } from "react";
import { Sparkles, Plus, Pencil, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: string;
  category_id: string | null;
  published_at: string | null;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const BlogManagement = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [postsResult, categoriesResult] = await Promise.all([
        (supabase as any)
          .from("blog_posts")
          .select("*")
          .order("created_at", { ascending: false }),
        (supabase as any).from("blog_categories").select("*"),
      ]);

      if (postsResult.data) setPosts(postsResult.data);
      if (categoriesResult.data) setCategories(categoriesResult.data);
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateArticle = async () => {
    if (!topic.trim()) {
      toast({
        title: "Error",
        description: "Please enter a topic",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-blog-post", {
        body: { topic },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Success",
        description: "Article generated successfully!",
      });

      setGenerateOpen(false);
      setTopic("");
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate article",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const { error } = await (supabase as any).from("blog_posts").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-pearl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif text-pearl">Blog Posts</h2>
        <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate with AI
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-charcoal border-graphite/30">
            <DialogHeader>
              <DialogTitle className="text-pearl">Generate Blog Post with AI</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-pearl/70">Topic</label>
                <Input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Benefits of permanent makeup"
                />
              </div>
              <Button
                onClick={generateArticle}
                disabled={generating}
                className="w-full"
              >
                {generating ? "Generating..." : "Generate Article"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {posts.length === 0 ? (
          <div className="bg-charcoal/50 backdrop-blur-sm rounded-3xl p-12 border border-graphite/20 text-center">
            <p className="text-pearl/60">No blog posts yet. Generate your first article!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="bg-charcoal/50 backdrop-blur-sm rounded-3xl p-6 border border-graphite/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-serif text-pearl">{post.title}</h3>
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${
                        post.status === "published"
                          ? "bg-sage/20 text-sage"
                          : "bg-bronze/20 text-bronze"
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>
                  {post.excerpt && (
                    <p className="text-pearl/60 text-sm">{post.excerpt}</p>
                  )}
                  <div className="text-xs text-pearl/50">
                    Created: {new Date(post.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deletePost(post.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BlogManagement;
