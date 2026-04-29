import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Star, MessageCircle, Filter, ChevronLeft, ChevronRight, Reply, CheckCircle, Clock, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const StarRating = ({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(s => (
      <Star
        key={s}
        className={cn(
          size === "sm" ? "h-3 w-3" : "h-4 w-4",
          rating >= s ? "text-yellow-400 fill-current" : "text-white/15"
        )}
      />
    ))}
  </div>
);

const MyReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [servers, setServers] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [filterServer, setFilterServer] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [filterReplied, setFilterReplied] = useState("all");

  // Reply state
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    document.title = "My Reviews — VoteVault";
    if (user) loadServers();
  }, [user]);

  const loadServers = async () => {
    try {
      const data = await api.servers.getMyServers();
      setServers(data || []);
    } catch {}
  };

  const loadReviews = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const data = await api.servers.getMyReviews({
        page: p,
        limit: 15,
        server_id: filterServer !== "all" ? filterServer : undefined,
        rating: filterRating !== "all" ? filterRating : undefined,
        replied: filterReplied !== "all" ? filterReplied : undefined,
      });
      setReviews(data.reviews || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setPage(p);
      if (data.summary) setSummary(data.summary);
    } catch (err: any) {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [filterServer, filterRating, filterReplied]);

  useEffect(() => {
    if (user) loadReviews(1);
  }, [user, filterServer, filterRating, filterReplied]);

  const handleReply = async (reviewId: number) => {
    if (!replyText.trim()) { toast.error("Reply cannot be empty"); return; }
    setSubmittingReply(true);
    try {
      await api.reviews.reply(reviewId, replyText.trim());
      toast.success("Reply submitted!");
      setReplyingTo(null);
      setReplyText("");
      loadReviews(page);
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit reply");
    } finally {
      setSubmittingReply(false);
    }
  };

  const avgRating = summary?.avg_rating ? Number(summary.avg_rating).toFixed(1) : "—";
  const unanswered = summary?.unanswered || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">My Reviews</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            All reviews left on your servers — reply to engage with your community.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass rounded-xl p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Total Reviews</p>
          <p className="font-mono-num font-bold text-2xl mt-1 text-primary-glow">{summary?.total ?? "—"}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Avg Rating</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="font-mono-num font-bold text-2xl text-yellow-400">{avgRating}</p>
            {summary?.avg_rating && <StarRating rating={Math.round(Number(summary.avg_rating))} />}
          </div>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Unanswered</p>
          <p className={cn("font-mono-num font-bold text-2xl mt-1", unanswered > 0 ? "text-yellow-400" : "text-green-400")}>
            {unanswered}
          </p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Response Rate</p>
          <p className="font-mono-num font-bold text-2xl mt-1 text-blue-400">
            {summary?.total > 0
              ? `${Math.round(((summary.total - unanswered) / summary.total) * 100)}%`
              : "—"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

          <Select value={filterServer} onValueChange={v => { setFilterServer(v); }}>
            <SelectTrigger className="w-44 h-8 text-xs bg-white/5 border-white/10">
              <SelectValue placeholder="All Servers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Servers</SelectItem>
              {servers.map(s => (
                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterRating} onValueChange={setFilterRating}>
            <SelectTrigger className="w-36 h-8 text-xs bg-white/5 border-white/10">
              <SelectValue placeholder="All Ratings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              {[5, 4, 3, 2, 1].map(r => (
                <SelectItem key={r} value={String(r)}>
                  <span className="flex items-center gap-1.5">
                    {r} <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterReplied} onValueChange={setFilterReplied}>
            <SelectTrigger className="w-36 h-8 text-xs bg-white/5 border-white/10">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reviews</SelectItem>
              <SelectItem value="no">Unanswered</SelectItem>
              <SelectItem value="yes">Answered</SelectItem>
            </SelectContent>
          </Select>

          {(filterServer !== "all" || filterRating !== "all" || filterReplied !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              onClick={() => { setFilterServer("all"); setFilterRating("all"); setFilterReplied("all"); }}
            >
              Clear filters
            </Button>
          )}

          <span className="ml-auto text-xs text-muted-foreground">{total} review{total !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass rounded-xl h-28 shimmer" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground">
            {filterServer !== "all" || filterRating !== "all" || filterReplied !== "all"
              ? "No reviews match your filters."
              : "No reviews yet. Share your server to start collecting feedback!"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="glass rounded-xl p-5 border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={r.avatar_url} />
                  <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
                    {(r.display_name || r.username || "?")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{r.display_name || r.username || "Anonymous"}</span>
                      <span className="text-muted-foreground text-xs">on</span>
                      <Link
                        to={`/server/${r.server_slug}`}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        {r.server_name}
                      </Link>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-white/10 text-muted-foreground">
                        {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRating rating={r.rating} />
                      {r.owner_response ? (
                        <Badge className="text-[10px] bg-green-500/10 text-green-400 border-green-500/20 px-1.5 py-0">
                          <CheckCircle className="h-2.5 w-2.5 mr-1" />Replied
                        </Badge>
                      ) : (
                        <Badge className="text-[10px] bg-yellow-500/10 text-yellow-400 border-yellow-500/20 px-1.5 py-0">
                          <Clock className="h-2.5 w-2.5 mr-1" />Pending
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Review text */}
                  {r.comment ? (
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">"{r.comment}"</p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic mb-3">No comment left.</p>
                  )}

                  {/* Existing reply */}
                  {r.owner_response && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-3">
                      <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                        <Reply className="h-3 w-3" /> Your Reply
                      </p>
                      <p className="text-xs text-muted-foreground">{r.owner_response}</p>
                    </div>
                  )}

                  {/* Reply form */}
                  {!r.owner_response && (
                    replyingTo === r.id ? (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Write a reply to this review…"
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          rows={3}
                          className="text-sm bg-white/5 border-white/10 resize-none"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="hero"
                            className="h-7 text-xs"
                            disabled={submittingReply || !replyText.trim()}
                            onClick={() => handleReply(r.id)}
                          >
                            {submittingReply ? "Submitting…" : "Submit Reply"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-muted-foreground"
                            onClick={() => { setReplyingTo(null); setReplyText(""); }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5"
                        onClick={() => { setReplyingTo(r.id); setReplyText(""); }}
                      >
                        <Reply className="h-3 w-3" /> Reply
                      </Button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => loadReviews(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => loadReviews(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default MyReviews;
