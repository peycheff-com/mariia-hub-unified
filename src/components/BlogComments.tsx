import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare, Send, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { BlogCommentWithProfile, SupabaseUser } from "@/types/supabase";

interface Comment extends BlogCommentWithProfile {
  replies?: Comment[];
}

interface BlogCommentsProps {
  postId: string;
}

const BlogComments = ({ postId }: BlogCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const checkAuth = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  }, []);

  const loadComments = useCallback(async () => {
    const { data, error } = await supabase
      .from("blog_comments")
      .select(`
        id,
        content,
        created_at,
        parent_id,
        profiles (
          full_name
        )
      `)
      .eq("post_id", postId)
      .is("parent_id", null)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Load replies for each comment
      const commentsWithReplies = await Promise.all(
        (data as Comment[]).map(async (comment) => {
          const { data: replies } = await supabase
            .from("blog_comments")
            .select(`
              id,
              content,
              created_at,
              profiles (
                full_name
              )
            `)
            .eq("parent_id", comment.id)
            .order("created_at", { ascending: true });

          return { ...comment, replies: replies || [] };
        })
      );
      setComments(commentsWithReplies);
    }
  }, [postId]);

  useEffect(() => {
    loadComments();
    checkAuth();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blog_comments',
          filter: `post_id=eq.${postId}`
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, loadComments, checkAuth]);

  const handleSubmit = async (parentId: string | null = null) => {
    if (!user) {
      toast({
        title: t('comments.signInRequired', 'Sign in required'),
        description: t('comments.signInDesc', 'Please sign in to leave a comment'),
        variant: "destructive",
      });
      return;
    }

    const content = parentId ? replyContent : newComment;
    if (!content.trim()) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from("blog_comments")
        .insert([
          {
            post_id: postId,
            user_id: user!.id,
            parent_id: parentId,
            content: content.trim(),
          },
        ]);

      if (error) throw error;

      toast({
        title: t('comments.submitted', 'Comment submitted'),
        description: t('comments.pendingApproval', 'Your comment is pending approval'),
      });

      if (parentId) {
        setReplyContent("");
        setReplyTo(null);
      } else {
        setNewComment("");
      }

      loadComments();
    } catch (error: any) {
      toast({
        title: t('comments.error', 'Error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-6 h-6 text-champagne" />
        <h3 className="text-2xl font-serif text-pearl">
          {t('comments.title', 'Comments')} ({comments.length})
        </h3>
      </div>

      {/* New Comment Form */}
      {user ? (
        <div className="space-y-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('comments.placeholder', 'Share your thoughts...')}
            className="min-h-[120px] bg-charcoal/60 border-pearl/30 text-pearl placeholder:text-pearl/40 focus:border-champagne/50"
          />
          <Button
            onClick={() => handleSubmit(null)}
            disabled={loading || !newComment.trim()}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {t('comments.post', 'Post Comment')}
          </Button>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-6 text-center">
          <p className="text-pearl/70 mb-4">
            {t('comments.signInPrompt', 'Sign in to leave a comment')}
          </p>
          <Button onClick={() => (window.location.href = "/auth")}>
            {t('comments.signIn', 'Sign In')}
          </Button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <p className="text-pearl/60 text-center py-8">
            {t('comments.noComments', 'No comments yet. Be the first to comment!')}
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="glass-card rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-pearl">{comment.profiles.full_name}</p>
                  <p className="text-xs text-pearl/50">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="text-pearl/80">{comment.content}</p>
              
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyTo(comment.id)}
                  className="text-champagne hover:text-champagne/80"
                >
                  {t('comments.reply', 'Reply')}
                </Button>
              )}

              {/* Reply Form */}
              {replyTo === comment.id && (
                <div className="space-y-3 pl-6 border-l-2 border-champagne/30">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={t('comments.replyPlaceholder', 'Write a reply...')}
                    className="bg-charcoal/60 border-pearl/30 text-pearl placeholder:text-pearl/40"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSubmit(comment.id)}
                      disabled={loading || !replyContent.trim()}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        t('comments.post', 'Post')
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReplyTo(null);
                        setReplyContent("");
                      }}
                    >
                      {t('comments.cancel', 'Cancel')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="space-y-4 pl-6 border-l-2 border-pearl/10">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="space-y-2">
                      <div>
                        <p className="font-medium text-pearl text-sm">
                          {reply.profiles.full_name}
                        </p>
                        <p className="text-xs text-pearl/50">
                          {new Date(reply.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-pearl/80 text-sm">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BlogComments;
