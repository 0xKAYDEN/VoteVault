import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus, MessageSquare, Flame, Pin, Lock, Trash2, Edit,
  Eye, Clock, Hash, Gamepad2, Star, HelpCircle, Megaphone, Shuffle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, any> = {
  general: Hash,
  "game-discussion": Gamepad2,
  "server-reviews": Star,
  "help-support": HelpCircle,
  announcements: Megaphone,
  "off-topic": Shuffle,
};

const MyThreads = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => { document.title = "My Threads — VoteVault"; }, []);

  const { data: threads = [], isLoading } = useQuery({
    queryKey: ["my-threads", user?.id],
    queryFn: () => user ? api.users.getThreads(user.id) : Promise.resolve([]),
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: (publicId: string) => api.threads.delete(publicId),
    onSuccess: () => {
      toast.success("Thread deleted");
      queryClient.invalidateQueries({ queryKey: ["my-threads"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to delete thread"),
  });

  const handleDelete = (publicId: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    deleteMutation.mutate(publicId);
  };

  const stats = {
    total: threads.length,
    totalReplies: threads.reduce((s: number, t: any) => s + (t.reply_count || 0), 0),
    totalViews: threads.reduce((s: number, t: any) => s + (t.view_count || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">My Threads</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your community discussions
          </p>
        </div>
        <Button variant="hero" onClick={() => navigate("/threads/new")}>
          <Plus className="h-4 w-4 mr-2" /> New Thread
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Threads", value: stats.total, icon: MessageSquare },
          { label: "Total Replies", value: stats.totalReplies, icon: MessageSquare },
          { label: "Total Views", value: stats.totalViews, icon: Eye },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold font-mono-num">{value.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Thread list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="glass rounded-xl h-20 shimmer" />)}
        </div>
      ) : threads.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <h3 className="font-semibold mb-1">No threads yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Start a discussion in the community</p>
          <Button variant="hero" onClick={() => navigate("/threads/new")}>
            <Plus className="h-4 w-4 mr-2" /> Create Your First Thread
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {(threads as any[]).map((thread) => {
            const CatIcon = CATEGORY_ICONS[thread.category_slug] || Hash;
            return (
              <div key={thread.public_id} className="glass rounded-xl p-4 flex items-start gap-4 group hover:border-white/15 border border-white/5 transition-all">
                {/* Category icon */}
                <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CatIcon className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {!!thread.is_pinned && <Pin className="h-3.5 w-3.5 text-yellow-400 flex-shrink-0" />}
                    {!!thread.is_locked && <Lock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                    <Link
                      to={`/threads/${thread.public_id}`}
                      className="font-semibold text-sm hover:text-primary transition-colors truncate"
                    >
                      {thread.title}
                    </Link>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <CatIcon className="h-3 w-3" />
                      {thread.category_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {thread.reply_count} {thread.reply_count === 1 ? "reply" : "replies"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {thread.view_count} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    asChild
                  >
                    <Link to={`/threads/${thread.public_id}`}>
                      <Eye className="h-3.5 w-3.5 mr-1" />View
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={() => navigate(`/threads/${thread.public_id}`, { state: { edit: true } })}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={() => handleDelete(thread.public_id, thread.title)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Link to community */}
      <div className="text-center pt-2">
        <Link to="/threads" className="text-sm text-muted-foreground hover:text-primary transition-colors">
          Browse all community threads →
        </Link>
      </div>
    </div>
  );
};

export default MyThreads;
