import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Lock, Pin, Trash2, Edit, Send, Loader2, MessageSquare, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserTags } from "@/components/UserTag";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

const ReactionBar = ({
  reactions, myReaction, onReact,
}: {
  reactions: Array<{ reaction: string; count: number }>;
  myReaction: string | null;
  onReact: (r: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const map = Object.fromEntries((reactions || []).map(r => [r.reaction, r.count]));

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {REACTIONS.filter(r => map[r]).map(r => (
        <button
          key={r}
          onClick={() => onReact(r)}
          className={cn(
            "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition",
            myReaction === r
              ? "border-primary/50 bg-primary/10 text-primary-glow"
              : "border-white/10 hover:border-white/30 bg-white/5"
          )}
        >
          {r} <span>{map[r]}</span>
        </button>
      ))}
      <div className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className="text-xs px-2 py-0.5 rounded-full border border-white/10 hover:border-white/30 bg-white/5 transition"
        >
          {myReaction || "😊"} React
        </button>
        {open && (
          <div className="absolute bottom-full left-0 mb-1 flex gap-1 glass rounded-lg p-2 border border-white/10 z-10">
            {REACTIONS.map(r => (
              <button key={r} onClick={() => { onReact(r); setOpen(false); }} className="text-lg hover:scale-125 transition-transform">
                {r}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ThreadDetail = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [replyBody, setReplyBody] = useState("");
  const [replyPage, setReplyPage] = useState(1);
  const [replyingTo, setReplyingTo] = useState<{ id: number; public_id: string; author: string; body: string } | null>(null);
  const replyBoxRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  const { data: thread, isLoading: threadLoading } = useQuery({
    queryKey: ["thread", publicId],
    queryFn: () => api.threads.get(publicId!),
    enabled: !!publicId,
  });

  const { data: repliesData, isLoading: repliesLoading } = useQuery({
    queryKey: ["thread-replies", publicId, replyPage],
    queryFn: () => api.threads.getReplies(publicId!, replyPage),
    enabled: !!publicId,
  });

  const replyMutation = useMutation({
    mutationFn: ({ body, parentReplyId }: { body: string; parentReplyId?: number }) =>
      api.threads.createReply(publicId!, body, parentReplyId),
    onSuccess: () => {
      toast.success("Reply posted");
      setReplyBody("");
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ["thread-replies", publicId] });
      queryClient.invalidateQueries({ queryKey: ["thread", publicId] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to post reply"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.threads.delete(publicId!),
    onSuccess: () => { toast.success("Thread deleted"); navigate("/threads"); },
  });

  const deleteReplyMutation = useMutation({
    mutationFn: (replyPublicId: string) => api.threads.deleteReply(replyPublicId),
    onSuccess: () => {
      toast.success("Reply deleted");
      queryClient.invalidateQueries({ queryKey: ["thread-replies", publicId] });
    },
  });

  const reactMutation = useMutation({
    mutationFn: ({ type, id, reaction }: { type: 'thread' | 'reply'; id: number; reaction: string }) =>
      api.threads.react(type, id, reaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thread", publicId] });
      queryClient.invalidateQueries({ queryKey: ["thread-replies", publicId] });
    },
  });

  const lockMutation = useMutation({
    mutationFn: (locked: boolean) => api.threads.lock(publicId!, locked),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["thread", publicId] }),
  });

  const pinMutation = useMutation({
    mutationFn: (pinned: boolean) => api.threads.pin(publicId!, pinned),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["thread", publicId] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ title, body }: { title: string; body: string }) =>
      api.threads.update(publicId!, { title, body }),
    onSuccess: () => {
      toast.success("Thread updated");
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["thread", publicId] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to update thread"),
  });

  const startEdit = () => {
    setEditTitle(thread?.title || "");
    setEditBody(thread?.body || "");
    setEditing(true);
  };

  if (threadLoading) {
    return <div className="container py-10"><div className="glass rounded-xl h-64 shimmer" /></div>;
  }

  if (!thread) {
    return (
      <div className="container py-10 text-center">
        <p className="text-muted-foreground mb-4">Thread not found.</p>
        <Button asChild variant="outline"><Link to="/threads"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link></Button>
      </div>
    );
  }

  const isAuthor = user?.id === thread.author_id;
  const replies = repliesData?.replies || [];
  const totalReplies = repliesData?.total || 0;
  const totalPages = Math.ceil(totalReplies / 20);

  return (
    <div className="container py-10 max-w-4xl">
      <Helmet>
        <title>{thread.title} — VoteVault Community</title>
      </Helmet>

      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/threads"><ArrowLeft className="h-4 w-4 mr-2" />Back to Threads</Link>
      </Button>

      {/* Thread */}
      <div className="glass rounded-2xl p-6 mb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {!!thread.is_pinned && <Pin className="h-4 w-4 text-yellow-400" />}
              {!!thread.is_locked && <Lock className="h-4 w-4 text-muted-foreground" />}
              <span className="text-xs text-muted-foreground">
                {thread.category_icon} {thread.category_name}
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold mb-3">{thread.title}</h1>
          </div>
          {(isAuthor || isAdmin) && (
            <div className="flex gap-1 flex-shrink-0">
              {isAdmin && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => pinMutation.mutate(!thread.is_pinned)} title={!!thread.is_pinned ? "Unpin" : "Pin"}>
                    <Pin className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => lockMutation.mutate(!thread.is_locked)} title={!!thread.is_locked ? "Unlock" : "Lock"}>
                    <Lock className="h-4 w-4" />
                  </Button>
                </>
              )}
              {isAuthor && !editing && (
                <Button variant="ghost" size="sm" onClick={startEdit} title="Edit thread">
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost" size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => confirm("Delete this thread?") && deleteMutation.mutate()}
                title="Delete thread"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={thread.author_avatar} />
              <AvatarFallback>{thread.author_display_name?.[0] || "?"}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Link to={`/user/${thread.author_id}`} className="font-semibold hover:underline text-sm">
                {thread.author_display_name || thread.author_username}
              </Link>
              <UserTags roles={thread.author_roles || []} />
              <span className="text-xs text-muted-foreground">
                {format(new Date(thread.created_at), "MMM d, yyyy 'at' HH:mm")}
              </span>
            </div>
            {editing ? (
              <div className="space-y-3">
                <Input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="font-semibold text-base"
                  maxLength={255}
                />
                <Textarea
                  value={editBody}
                  onChange={e => setEditBody(e.target.value)}
                  rows={6}
                  maxLength={20000}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => updateMutation.mutate({ title: editTitle, body: editBody })}
                    disabled={updateMutation.isPending || !editTitle.trim() || !editBody.trim()}
                  >
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-foreground/90">
                {thread.body}
              </div>
            )}
            <div className="mt-4">
              <ReactionBar
                reactions={thread.reactions || []}
                myReaction={thread.my_reaction}
                onReact={(r) => reactMutation.mutate({ type: 'thread', id: thread.id, reaction: r })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Replies */}
      <div className="space-y-3 mb-6">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider px-1">
          {totalReplies} {totalReplies === 1 ? "Reply" : "Replies"}
        </h2>

        {repliesLoading ? (
          <div className="glass rounded-xl h-20 shimmer" />
        ) : replies.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-muted-foreground text-sm">
            No replies yet. Be the first to respond!
          </div>
        ) : (
          replies.map((reply: any) => (
            <div key={reply.public_id} className="glass rounded-xl p-4 flex gap-4">
              <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarImage src={reply.author_avatar} />
                <AvatarFallback>{reply.author_display_name?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/user/${reply.author_id}`} className="font-semibold text-sm hover:underline">
                      {reply.author_display_name || reply.author_username}
                    </Link>
                    <UserTags roles={reply.author_roles || []} />
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Reply button */}
                    {user && !reply.is_deleted && !thread.is_locked && (
                      <button
                        onClick={() => {
                          setReplyingTo({
                            id: reply.id,
                            public_id: reply.public_id,
                            author: reply.author_display_name || reply.author_username,
                            body: reply.body,
                          });
                          setTimeout(() => {
                            replyBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 50);
                        }}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5"
                      >
                        <MessageSquare className="h-3 w-3" />
                        Reply
                      </button>
                    )}
                    {(user?.id === reply.author_id || isAdmin) && !reply.is_deleted && (
                      <Button
                        variant="ghost" size="sm"
                        className="text-muted-foreground hover:text-destructive h-6 w-6 p-0"
                        onClick={() => deleteReplyMutation.mutate(reply.public_id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className={cn("text-sm whitespace-pre-wrap", reply.is_deleted && "italic text-muted-foreground")}>
                  {reply.body}
                </p>
                {!reply.is_deleted && (
                  <div className="mt-2">
                    <ReactionBar
                      reactions={reply.reactions || []}
                      myReaction={reply.my_reaction}
                      onReact={(r) => reactMutation.mutate({ type: 'reply', id: reply.id, reaction: r })}
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" disabled={replyPage <= 1} onClick={() => setReplyPage(p => p - 1)}>Previous</Button>
            <span className="flex items-center text-sm text-muted-foreground px-3">{replyPage} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={replyPage >= totalPages} onClick={() => setReplyPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </div>

      {/* Reply box */}
      {user ? (
        !!thread.is_locked ? (
          <div className="glass rounded-xl p-4 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
            <Lock className="h-4 w-4" /> This thread is locked
          </div>
        ) : (
          <div className="glass rounded-xl p-4" ref={replyBoxRef}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">
                {replyingTo ? `Replying to @${replyingTo.author}` : "Post a Reply"}
              </h3>
              {replyingTo && (
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Cancel reply
                </button>
              )}
            </div>

            {/* Quoted reply preview */}
            {replyingTo && (
              <div className="mb-3 pl-3 border-l-2 border-primary/40 bg-white/5 rounded-r-lg p-2">
                <p className="text-xs text-primary font-medium mb-0.5">@{replyingTo.author}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{replyingTo.body}</p>
              </div>
            )}

            <Textarea
              value={replyBody}
              onChange={e => setReplyBody(e.target.value)}
              placeholder={replyingTo ? `Reply to @${replyingTo.author}...` : "Write your reply..."}
              rows={4}
              className="mb-3"
              maxLength={10000}
              autoFocus={!!replyingTo}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{replyBody.length}/10000</span>
              <Button
                onClick={() => replyBody.trim() && replyMutation.mutate({
                  body: replyBody,
                  parentReplyId: replyingTo?.id,
                })}
                disabled={replyMutation.isPending || !replyBody.trim()}
              >
                {replyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                {replyingTo ? "Post Reply" : "Post Reply"}
              </Button>
            </div>
          </div>
        )
      ) : (
        <div className="glass rounded-xl p-4 text-center text-sm text-muted-foreground">
          <Link to="/auth" className="text-primary hover:underline">Sign in</Link> to post a reply
        </div>
      )}
    </div>
  );
};

export default ThreadDetail;
