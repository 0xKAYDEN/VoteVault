import { useEffect, useState, useMemo, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Crown, Star, Users, Zap, Globe, MessageCircle, Check, ArrowLeft, Send, TrendingUp, BarChart3, Calendar, ListChecks, Sparkles, Eye, Edit, ShieldCheck, Flag, Youtube, Facebook, Twitter, Twitch, Trophy, UserCircle, Heart } from "lucide-react";
import { VoteDialog } from "@/components/VoteDialog";
import { ServerRow } from "@/components/ServerCard";
import { useAuth } from "@/hooks/useAuth";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ─── Report Button ────────────────────────────────────────────────────────────
function ReportButton({ serverId, serverName }: { serverId: number; serverName: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      await api.userExperience.submitReport({
        reportedType: 'server',
        reportedId: String(serverId),
        reason,
        description: details,
      });
      toast.success("Report submitted. Our team will review it.");
      setOpen(false);
      setReason(""); setDetails("");
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" title="Report server">
          <Flag className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-strong border-white/10">
        <DialogHeader>
          <DialogTitle>Report "{serverName}"</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select a reason..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="spam">Spam or misleading</SelectItem>
                <SelectItem value="inappropriate">Inappropriate content</SelectItem>
                <SelectItem value="fake">Fake or fraudulent server</SelectItem>
                <SelectItem value="vote_manipulation">Vote manipulation</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Additional details (optional)</Label>
            <Textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Describe the issue..."
              rows={3}
              className="mt-1"
              maxLength={500}
            />
          </div>
          <Button onClick={handleSubmit} disabled={!reason || submitting} className="w-full" variant="destructive">
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { UserTags } from "@/components/UserTag";
import { format, subDays, eachDayOfInterval, isSameDay } from "date-fns";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { LoadingSpinner, ChartSkeleton, ProfileSkeleton } from "@/components/LoadingStates";
import { Skeleton } from "@/components/ui/skeleton";

const ServerProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const [params, setParams] = useSearchParams();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Sync active tab with URL hash — e.g. /server/my-server#reviews
  const hashTab = window.location.hash.replace("#", "") || "overview";
  const validTabs = ["overview", "info", "reviews", "stats"];
  const [activeTab, setActiveTab] = useState(validTabs.includes(hashTab) ? hashTab : "overview");

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `${window.location.pathname}#${tab}`);
  };
  const [server, setServer] = useState<(ServerRow & {
    long_description: string | null;
    website_url: string | null;
    discord_url: string | null;
    youtube_url: string | null;
    facebook_url: string | null;
    twitter_url: string | null;
    twitch_url: string | null;
    owner_id: string;
    owner_username: string | null;
    owner_display_name: string | null;
    owner_avatar_url: string | null;
  }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [voteOpen, setVoteOpen] = useState(false);
  const [recentVoted, setRecentVoted] = useState(false);
  const [voteTrackingParam, setVoteTrackingParam] = useState<string | undefined>(undefined);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [voteHistory, setVoteHistory] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const load = useCallback(async () => {
    if (!slug) return;
    try {
      // If slug is a pure number it's a legacy numeric ID from old notifications — fetch by ID
      let data;
      if (/^\d+$/.test(slug)) {
        data = await api.servers.getById(Number(slug));
      } else {
        data = await api.servers.getBySlug(slug);
      }
      if (data) {
        setServer(data as any);
        loadReviews(data.id);
        loadStats(data.id);
        api.servers.incrementVisits(data.id);
        // Check favorite status
        if (user) {
          api.favorites.check(data.id)
            .then(d => setFavorited(d.favorited))
            .catch(() => {});
        }
        // Load owner profile
        if (data.owner_id) {
          api.users.getProfile(data.owner_id)
            .then(p => setOwnerProfile(p))
            .catch(() => {});
        }
        // Load server achievements (user achievements for the owner as proxy)
        if (data.owner_id) {
          api.achievements.getUserAchievements(data.owner_id)
            .then(a => setAchievements(a || []))
            .catch(() => {});
        }
      }
    } catch (err) {
      console.error("Error loading server:", err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

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

  useEffect(() => { load(); }, [slug, load]);

  useEffect(() => {
    if (params.get("vote") === "1" && server && user) {
      setVoteTrackingParam(params.get("ref") || undefined);
      setVoteOpen(true);
      setParams({}, { replace: true });
    }
  }, [params, server, user, setParams]);

  const onVoteSuccess = async () => {
    setRecentVoted(true);
    await load();
  };

  const toggleFavorite = async () => {
    if (!user || !server) return;
    setFavLoading(true);
    try {
      const data = await api.favorites.toggle(server.id);
      setFavorited(data.favorited);
      toast.success(data.favorited ? "Added to favorites" : "Removed from favorites");
    } catch {
      toast.error("Failed to update favorites");
    } finally {
      setFavLoading(false);
    }
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
    return (
      <div className="container py-10">
        <ProfileSkeleton />
      </div>
    );
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
        <title>{`${server.name} — VoteVault`}</title>
        <meta name="description" content={server.short_description} />
        <meta property="og:title" content={`${server.name} — VoteVault`} />
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
                  <ShieldCheck className="h-6 w-6 md:h-8 md:w-8 text-primary-glow shrink-0" aria-label="Verified Server" />
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
                <Button variant="vote" size="lg" onClick={() => {
                  if (!user) { window.location.href = "/auth"; return; }
                  setVoteOpen(true);
                }} className="flex-[2] md:flex-none">
                  <Zap className="h-5 w-5" /> Vote Now
                </Button>
                {user && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFavorite}
                    disabled={favLoading}
                    title={favorited ? "Remove from favorites" : "Add to favorites"}
                    className={favorited ? "text-red-400 hover:text-red-300" : "text-muted-foreground hover:text-red-400"}
                  >
                    <Heart className={`h-5 w-5 ${favorited ? "fill-current" : ""}`} />
                  </Button>
                )}
                {user && (
                  <ReportButton serverId={server.id} serverName={server.name} />
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {server.version && <Badge variant="outline" className="bg-white/5 border-white/10 font-normal">v{server.version}</Badge>}
            {server.rate && <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary-glow font-normal">{server.rate}</Badge>}
            
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <Stat label="Total Votes" value={(server.vote_count ?? 0).toLocaleString()} icon={<Zap className="h-4 w-4 text-primary" />} highlight={recentVoted} />
            <Stat label="Total Visits" value={(server.profile_visits ?? 0).toLocaleString()} icon={<Eye className="h-4 w-4 text-primary" />} highlight={recentVoted} />
            <Stat 
              label="Avg Rating" 
              value={`${Number(server.rating_avg ?? 0).toFixed(1)} (${server.rating_count ?? 0})`} 
              icon={<Star className="h-4 w-4 text-[hsl(45_95%_60%)]" />} 
            />
            <Stat label="Active Players" value={(server.active_players ?? 0).toLocaleString()} icon={<Users className="h-4 w-4" />} />
            <Stat label="Server Region" value={server.region ?? "—"} icon={<Globe className="h-4 w-4" />} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
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
                <Button variant="outline" size="sm" asChild className="border-indigo-500/30 hover:bg-indigo-500/10">
                  <a href={server.discord_url} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" />Discord</a>
                </Button>
              )}
              {(server as any).youtube_url && (
                <Button variant="outline" size="sm" asChild className="border-red-500/30 hover:bg-red-500/10">
                  <a href={(server as any).youtube_url} target="_blank" rel="noopener noreferrer"><Youtube className="h-4 w-4" />YouTube</a>
                </Button>
              )}
              {(server as any).facebook_url && (
                <Button variant="outline" size="sm" asChild className="border-blue-500/30 hover:bg-blue-500/10">
                  <a href={(server as any).facebook_url} target="_blank" rel="noopener noreferrer"><Facebook className="h-4 w-4" />Facebook</a>
                </Button>
              )}
              {(server as any).twitter_url && (
                <Button variant="outline" size="sm" asChild className="border-sky-500/30 hover:bg-sky-500/10">
                  <a href={(server as any).twitter_url} target="_blank" rel="noopener noreferrer"><Twitter className="h-4 w-4" />Twitter</a>
                </Button>
              )}
              {(server as any).twitch_url && (
                <Button variant="outline" size="sm" asChild className="border-purple-500/30 hover:bg-purple-500/10">
                  <a href={(server as any).twitch_url} target="_blank" rel="noopener noreferrer"><Twitch className="h-4 w-4" />Twitch</a>
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

          {/* Owner Card + Achievements row */}
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            {/* Server Owner */}
            <div className="glass rounded-2xl p-5">
              <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-primary" /> Server Owner
              </h3>
              {ownerProfile ? (
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-primary/30">
                    <AvatarImage src={ownerProfile.avatar_url} />
                    <AvatarFallback className="bg-primary/20 text-primary text-lg font-bold">
                      {(ownerProfile.display_name || ownerProfile.username || "?")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/user/${server.owner_id}`}
                      className="font-bold text-base hover:text-primary transition-colors block truncate"
                    >
                      {ownerProfile.display_name || ownerProfile.username}
                    </Link>
                    {ownerProfile.username && ownerProfile.display_name && (
                      <p className="text-xs text-muted-foreground">@{ownerProfile.username}</p>
                    )}
                    {ownerProfile.bio && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ownerProfile.bio}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" asChild className="text-xs h-7">
                        <Link to={`/user/${server.owner_id}`}>View Profile</Link>
                      </Button>
                      {user && user.id !== server.owner_id && (
                        <Button size="sm" variant="outline" asChild className="text-xs h-7">
                          <Link to={`/messages/${server.owner_id}`}>
                            <MessageCircle className="h-3 w-3 mr-1" /> Message
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Owner info unavailable.</p>
              )}
            </div>

            {/* Achievements */}
            <div className="glass rounded-2xl p-5">
              <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" /> Achievements
              </h3>
              {achievements.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {achievements.slice(0, 9).map((a: any) => (
                    <div
                      key={a.id}
                      title={`${a.name}: ${a.description}`}
                      className="flex flex-col items-center gap-1 glass rounded-xl p-2 text-center hover:border-primary/30 transition-colors cursor-default"
                    >
                      <span className="text-2xl">{a.icon || "🏆"}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight line-clamp-2">{a.name}</span>
                    </div>
                  ))}
                  {achievements.length > 9 && (
                    <div className="flex flex-col items-center justify-center glass rounded-xl p-2 text-center">
                      <span className="text-xs text-muted-foreground font-semibold">+{achievements.length - 9}</span>
                      <span className="text-[10px] text-muted-foreground">more</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No achievements yet.</p>
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
            <Info label="Total Votes" value={(server.vote_count ?? 0).toLocaleString()} />
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
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="glass">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-3 w-1/4" />
                          <Skeleton className="h-16 w-full" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
                    <div className="h-full w-full flex items-center justify-center">
                      <Skeleton className="h-full w-full" />
                    </div>
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
                    <div className="h-full w-full flex items-center justify-center">
                      <Skeleton className="h-full w-full" />
                    </div>
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
                <div className="text-2xl font-bold font-mono-num">{(server.vote_count ?? 0).toLocaleString()}</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Average Rating</div>
                <div className="text-2xl font-bold font-mono-num">{Number(server.rating_avg ?? 0).toFixed(1)} / 5.0</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Review Count</div>
                <div className="text-2xl font-bold font-mono-num">{server.rating_count ?? 0}</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Players Online</div>
                <div className="text-2xl font-bold font-mono-num">{(server.active_players ?? 0).toLocaleString()}</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <Eye className="h-3 w-3" /> Total Visits
                </div>
                <div className="text-2xl font-bold font-mono-num">{(server.profile_visits ?? 0).toLocaleString()}</div>
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
        trackingParam={voteTrackingParam}
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
