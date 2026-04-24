import { useEffect, useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Crown, Star, Users, Zap, Globe, MessageCircle, Check, ArrowLeft, Send, TrendingUp, BarChart3, Calendar, ListChecks, Sparkles, Eye, Edit, ShieldCheck } from "lucide-react";
import { VoteDialog } from "@/components/VoteDialog";
import { ServerRow } from "@/components/ServerCard";
import { useAuth } from "@/hooks/useAuth";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserTags } from "@/components/UserTag";
import { format, subDays, eachDayOfInterval, isSameDay } from "date-fns";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";

const ServerProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const [params, setParams] = useSearchParams();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [server, setServer] = useState<(ServerRow & { long_description: string | null; website_url: string | null; discord_url: string | null; owner_id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [voteOpen, setVoteOpen] = useState(false);
  const [recentVoted, setRecentVoted] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [voteHistory, setVoteHistory] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  const load = async () => {
    if (!slug) return;
    try {
      const data = await api.servers.getBySlug(slug);
      if (data) {
        setServer(data as any);
        loadReviews(data.id);
        loadStats(data.id);
        api.servers.incrementVisits(data.id);
      }
    } catch (err) {
      console.error("Error loading server:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async (serverId: number, page: number = 1) => {
    setReviewsLoading(true);
    try {
      const data = await api.reviews.getByServerId(serverId, page);
      setReviews(data.reviews || []);
      setTotalPages(data.totalPages || 1);
      setReviewsPage(data.page || 1);
    } catch (error) {
      console.error("Error loading reviews:", error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const loadStats = async (serverId: number) => {
    setStatsLoading(true);
    try {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const data = await api.votes.getAnalytics({
        server_id: serverId,
        from: thirtyDaysAgo,
        to: new Date().toISOString(),
        public: true
      });
      setVoteHistory(data || []);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const chartData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date(),
    });

    return days.map(day => {
      const count = (voteHistory || []).filter(v => {
        const vDate = new Date(v.voted_at);
        return isSameDay(vDate, day);
      }).length;
      return {
        date: format(day, "MMM dd"),
        votes: count,
      };
    });
  }, [voteHistory]);

  const ratingDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        dist[r.rating - 1]++;
      }
    });
    return dist.map((count, i) => ({
      rating: `${i + 1} ★`,
      count,
    }));
  }, [reviews]);

  const chartConfig = {
    votes: {
      label: "Votes",
      color: "hsl(var(--primary))",
    },
    ratings: {
      label: "Count",
      color: "hsl(var(--primary))",
    }
  } satisfies ChartConfig;

  useEffect(() => { load(); }, [slug]);

  useEffect(() => {
    if (params.get("vote") === "1" && server && user) {
      setVoteOpen(true);
      setParams({}, { replace: true });
    }
  }, [params, server, user, setParams]);

  const onVoteSuccess = async () => {
    setRecentVoted(true);
    await load();
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !server) return;

    setSubmittingReview(true);
    try {
      if (editingReviewId) {
        await api.reviews.update(editingReviewId, {
          rating: newRating,
          comment: newComment.trim() || null,
        });
        toast({
          title: "Review updated",
          description: "Your changes have been saved.",
        });
      } else {
        await api.reviews.submit({
          server_id: server.id,
          rating: newRating,
          comment: newComment.trim() || null,
        });
        toast({
          title: "Review submitted",
          description: "Thank you for your feedback!",
        });
      }

      setNewComment("");
      setNewRating(5);
      setEditingReviewId(null);
      await load(); // Refresh server stats and reviews
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to process review",
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <div className="container py-20"><div className="glass rounded-2xl h-64 shimmer" /></div>;
  }
  if (!server) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-3xl mb-2">Server not found</h1>
        <Button variant="outline" asChild><Link to="/"><ArrowLeft className="h-4 w-4" /> Back to Top 100</Link></Button>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12">
      <Helmet>
        <title>{`${server.name} — Conquer Top 100`}</title>
        <meta name="description" content={server.short_description} />
        <meta property="og:title" content={`${server.name} — Conquer Top 100`} />
        <meta property="og:description" content={server.short_description} />
        {server.banner_url && <meta property="og:image" content={server.banner_url} />}
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Top 100
      </Link>

      {/* Hero */}
      <div className="glass-strong rounded-3xl overflow-hidden mb-6 animate-fade-in">
        <div className="relative h-48 md:h-64 bg-gradient-to-br from-primary/30 via-primary-deep/20 to-black overflow-hidden">
          {server.banner_url && <img src={server.banner_url} alt={server.name} className="absolute inset-0 w-full h-full object-cover opacity-50" />}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        </div>
        <div className="p-6 md:p-8 -mt-16 relative">
          <div className="flex flex-col md:flex-row gap-6 md:items-end">
            <div className="grid h-20 w-20 md:h-24 md:w-24 place-items-center rounded-2xl bg-gradient-crimson border-4 border-card shadow-[0_0_30px_hsl(0_80%_50%/0.5)] shrink-0 overflow-hidden">
              {server.logo_url ? (
                <img src={server.logo_url} alt={server.name} className="w-full h-full object-cover" />
              ) : (
                <Crown className="h-10 w-10 md:h-12 md:w-12 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Conquer Online server</span>
                <span className={`pulse-dot ${server.is_online ? "bg-emerald-400" : "bg-muted-foreground"}`} />
              </div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-display text-3xl md:text-5xl font-bold text-gradient">{server.name}</h1>
                {server.is_verified && (
                  <ShieldCheck className="h-6 w-6 md:h-8 md:w-8 text-primary-glow shrink-0" title="Verified Server" />
                )}
              </div>
              <p className="text-muted-foreground mt-1">{server.short_description}</p>
            </div>
            <div className="flex flex-col items-stretch md:items-end gap-2">
              {recentVoted && (
                <div className="glass rounded-lg px-3 py-1.5 text-xs text-emerald-400 flex items-center gap-1.5 animate-slide-down">
                  <Check className="h-3.5 w-3.5" /> Vote recorded!
                </div>
              )}
              <div className="flex flex-wrap gap-2 justify-end">
                {server.website_url && (
                  <Button variant="outline" size="lg" asChild className="flex-1 md:flex-none">
                    <a href={server.website_url} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-5 w-5 mr-2" /> Website
                    </a>
                  </Button>
                )}
                {server.discord_url && (
                  <Button variant="outline" size="lg" asChild className="flex-1 md:flex-none border-indigo-500/30 hover:bg-indigo-500/10 hover:border-indigo-500/50">
                    <a href={server.discord_url} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-5 w-5 mr-2" /> Discord
                    </a>
                  </Button>
                )}
                <Button variant="vote" size="lg" onClick={() => setVoteOpen(true)} className="flex-[2] md:flex-none">
                  <Zap className="h-5 w-5" /> Vote Now
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {server.version && <Badge variant="outline" className="bg-white/5 border-white/10 font-normal">v{server.version}</Badge>}
            {server.rate && <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary-glow font-normal">{server.rate}</Badge>}
            
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <Stat label="Total Votes" value={server.vote_count.toLocaleString()} icon={<Zap className="h-4 w-4 text-primary" />} highlight={recentVoted} />
            <Stat label="Total Visits" value={server.profile_visits.toLocaleString()} icon={<Eye className="h-4 w-4 text-primary" />} highlight={recentVoted} />
            <Stat 
              label="Avg Rating" 
              value={`${Number(server.rating_avg).toFixed(1)} (${server.rating_count})`} 
              icon={<Star className="h-4 w-4 text-[hsl(45_95%_60%)]" />} 
            />
            <Stat label="Active Players" value={server.player_count.toLocaleString()} icon={<Users className="h-4 w-4" />} />
            <Stat label="Server Region" value={server.region ?? "—"} icon={<Globe className="h-4 w-4" />} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="info">Server Info</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display text-xl font-bold mb-3">About</h3>
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
              {server.long_description || server.short_description}
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              {server.website_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={server.website_url} target="_blank" rel="noopener noreferrer"><Globe className="h-4 w-4" />Website</a>
                </Button>
              )}
              {server.discord_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={server.discord_url} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" />Discord</a>
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Features */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" /> Features
              </h3>
              {server.features ? (
                <div className="flex flex-wrap gap-2">
                  {server.features.split(/[\n,]+/).map((feature, idx) => {
                    const trimmed = feature.trim();
                    if (!trimmed) return null;
                    return (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="bg-primary/5 border-primary/20 text-primary-glow px-3 py-1 text-xs font-normal hover:bg-primary/10 transition-colors"
                      >
                        <Check className="h-3 w-3 mr-1.5 text-primary" />
                        {trimmed}
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No features listed yet.</p>
              )}
            </div>

            {/* Events Time */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Event's Time
              </h3>
              {server.events_time ? (
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {server.events_time}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No events scheduled yet.</p>
              )}
            </div>

            {/* Upcoming Updates */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Upcoming Updates
              </h3>
              {server.upcoming_updates ? (
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {server.upcoming_updates}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No upcoming updates listed.</p>
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="info" className="mt-4">
          <div className="glass rounded-2xl p-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <Info label="Version" value={server.version ?? "—"} />
            <Info label="Rate" value={server.rate ?? "—"} />
            <Info label="Region" value={server.region ?? "—"} />
            <Info label="Status" value={server.is_online ? "Online" : "Offline"} />
            <Info label="Total Votes" value={server.vote_count.toLocaleString()} />
            <Info label="Reviews" value={`${Number(server.rating_avg).toFixed(1)} ★ (${server.rating_count} reviews)`} />
          </div>
        </TabsContent>
        <TabsContent value="reviews" className="mt-4 space-y-6">
          {/* Review Form */}
          <div className="glass rounded-2xl p-6" id="reviews-section">
            <h3 className="font-display text-xl font-bold mb-4">{editingReviewId ? "Edit Your Review" : "Leave a Review"}</h3>
            {user ? (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">Your Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className={`p-1 transition-colors ${newRating >= star ? "text-[hsl(45_95%_60%)]" : "text-muted-foreground hover:text-white/40"}`}
                      >
                        <Star className={`h-8 w-8 ${newRating >= star ? "fill-current" : ""}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="comment" className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">Your Comment (Optional)</label>
                  <Textarea
                    id="comment"
                    placeholder="Tell others about your experience on this server..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="bg-white/5 border-white/10 min-h-[100px] focus:ring-primary/50"
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={submittingReview} className="w-full md:w-auto">
                    {submittingReview ? "Processing..." : editingReviewId ? "Save Changes" : <><Send className="h-4 w-4 mr-2" /> Submit Review</>}
                  </Button>
                  {editingReviewId && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setEditingReviewId(null);
                        setNewRating(5);
                        setNewComment("");
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            ) : (
              <div className="bg-white/5 rounded-xl p-6 text-center">
                <p className="text-muted-foreground mb-4">You must be logged in to leave a review.</p>
                <Button asChild variant="outline">
                  <Link to="/auth">Sign In / Register</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            <h3 className="font-display text-xl font-bold px-2">Community Reviews</h3>
            {reviewsLoading ? (
              <div className="glass rounded-2xl p-12 text-center animate-pulse">Loading reviews...</div>
            ) : reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="glass rounded-2xl p-6 animate-fade-in">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10 border border-white/10">
                      <AvatarImage src={review.avatar_url} />
                      <AvatarFallback className="bg-primary/20 text-primary uppercase">
                        {review.display_name?.[0] || review.username?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              to={`/user/${review.user_id}`}
                              className="font-bold text-foreground hover:text-primary transition-colors"
                            >
                              {review.display_name || review.username || "Anonymous"}
                            </Link>
                            <UserTags roles={review.roles} />
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                            {new Date(review.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${review.rating >= star ? "text-[hsl(45_95%_60%)] fill-current" : "text-white/10"}`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-line italic">
                          "{review.comment}"
                        </p>
                      )}
                      {review.owner_response && (
                        <div className="mt-4 bg-primary/5 border border-primary/10 rounded-xl p-4">
                          <div className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1">Owner Response</div>
                          <p className="text-sm text-muted-foreground italic">"{review.owner_response}"</p>
                        </div>
                      )}
                      {/* Actions for owner or reviewer */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {user && review.user_id === user.id && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs"
                            onClick={() => {
                              setEditingReviewId(review.id);
                              setNewRating(review.rating);
                              setNewComment(review.comment || "");
                              window.scrollTo({ top: document.getElementById("reviews-section")?.offsetTop || 0, behavior: 'smooth' });
                            }}
                          >
                            <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit My Review
                          </Button>
                        )}
                        
                        {user && server.owner_id === user.id && !review.owner_response && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs border-primary/30 text-primary-glow"
                            onClick={() => {
                              const reply = prompt("Enter your reply to this review:");
                              if (reply) {
                                api.reviews.reply(review.id, reply)
                                  .then(() => {
                                    toast({ title: "Reply submitted" });
                                    loadReviews(server.id, reviewsPage);
                                  })
                                  .catch(err => toast({ variant: "destructive", title: err.message }));
                              }
                            }}
                          >
                            <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Reply as Owner
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="glass rounded-2xl p-12 text-center text-muted-foreground">
                No reviews yet. Be the first to review!
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: totalPages }).map((_, i) => (
                <Button
                  key={i}
                  variant={reviewsPage === i + 1 ? "hero" : "outline"}
                  size="sm"
                  onClick={() => {
                    setReviewsPage(i + 1);
                    loadReviews(server.id, i + 1);
                  }}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="stats" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vote History Chart */}
            <Card className="glass-strong border-white/5 overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Vote History</CardTitle>
                    <CardDescription>Last 30 days performance</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[250px] w-full">
                  {statsLoading ? (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground animate-pulse">Loading data...</div>
                  ) : (
                    <ChartContainer config={chartConfig} className="h-full w-full">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                          minTickGap={30}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area 
                          type="monotone" 
                          dataKey="votes" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorVotes)" 
                        />
                      </AreaChart>
                    </ChartContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Rating Distribution Chart */}
            <Card className="glass-strong border-white/5 overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-[hsl(45_95%_60%)]/10 text-[hsl(45_95%_60%)]">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Rating Distribution</CardTitle>
                    <CardDescription>Based on community reviews</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[250px] w-full">
                  {reviewsLoading ? (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground animate-pulse">Loading data...</div>
                  ) : (
                    <ChartContainer config={chartConfig} className="h-full w-full">
                      <BarChart data={ratingDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis 
                          dataKey="rating" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                          allowDecimals={false}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {ratingDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${0.2 + (index * 0.2)})`} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Quick Stats
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Votes</div>
                <div className="text-2xl font-bold font-mono-num">{server.vote_count.toLocaleString()}</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Average Rating</div>
                <div className="text-2xl font-bold font-mono-num">{Number(server.rating_avg).toFixed(1)} / 5.0</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Review Count</div>
                <div className="text-2xl font-bold font-mono-num">{server.rating_count}</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Players Online</div>
                <div className="text-2xl font-bold font-mono-num">{server.player_count.toLocaleString()}</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <Eye className="h-3 w-3" /> Total Visits
                </div>
                <div className="text-2xl font-bold font-mono-num">{server.profile_visits.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <VoteDialog
        open={voteOpen}
        onOpenChange={setVoteOpen}
        serverId={server.id}
        serverName={server.name}
        onSuccess={onVoteSuccess}
      />
    </div>
  );
};

function Stat({ label, value, icon, highlight }: { label: string; value: string; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`glass rounded-xl p-3 flex items-center gap-3 ${highlight ? "ring-1 ring-primary/50 animate-pulse-glow" : ""}`}>
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 border border-white/10">{icon}</div>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="font-mono-num font-bold text-base">{value}</div>
      </div>
    </div>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-mono-num text-sm mt-0.5">{value}</div>
    </div>
  );
}

export default ServerProfile;
