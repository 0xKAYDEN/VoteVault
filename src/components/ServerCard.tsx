import { Link, useNavigate } from "react-router-dom";
import {
  Crown, Star, Users, Zap, Eye, ShieldCheck, Heart,
  Globe, MessageCircle, Youtube, Facebook, Twitter, Twitch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth.context";

export interface ServerRow {
  id: number;
  public_id: string;
  name: string;
  slug: string;
  short_description: string;
  banner_url: string | null;
  logo_url: string | null;
  version: string | null;
  rate: string | null;
  region: string | null;
  is_online: boolean;
  is_verified?: boolean;
  vote_count: number;
  rating_avg: number;
  rating_count: number;
  active_players: number;
  profile_visits: number;
  features?: string | null;
  events_time?: string | null;
  upcoming_updates?: string | null;
  subscription_plan?: string | null;
  subscription_expires_at?: string | null;
  website_url?: string | null;
  discord_url?: string | null;
  youtube_url?: string | null;
  facebook_url?: string | null;
  twitter_url?: string | null;
  twitch_url?: string | null;
  owner_id?: string;
  owner_username?: string | null;
  owner_display_name?: string | null;
}

export function ServerCard({ server, rank }: { server: ServerRow; rank: number }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  const isTop3 = rank <= 3;
  const accentBorder =
    rank === 1 ? "border-l-[hsl(45_95%_55%)]" :
    rank === 2 ? "border-l-[hsl(0_0%_75%)]" :
    rank === 3 ? "border-l-[hsl(28_70%_50%)]" : "border-l-primary/60";

  const isPremium = server.subscription_plan && server.subscription_expires_at &&
    new Date(server.subscription_expires_at) > new Date();

  const getPremiumBadge = () => {
    if (!isPremium) return null;
    const plan = server.subscription_plan?.toLowerCase();
    if (plan === "basic") return { label: "Basic", color: "bg-blue-500/20 text-blue-400 border-blue-500/50" };
    if (plan === "pro") return { label: "Pro", color: "bg-purple-500/20 text-purple-400 border-purple-500/50" };
    if (plan === "enterprise") return { label: "Enterprise", color: "bg-amber-500/20 text-amber-400 border-amber-500/50" };
    return null;
  };
  const premiumBadge = getPremiumBadge();

  useEffect(() => {
    if (user) {
      api.favorites.check(server.id).then(d => setIsFavorited(d.isFavorited)).catch(() => {});
    }
    api.tags.getServerTags(server.id).then(setTags).catch(() => {});
  }, [user, server.id]);

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error("Please log in to favorite servers"); return; }
    setFavoriteLoading(true);
    try {
      const result = await api.favorites.toggle(server.id);
      setIsFavorited(result.isFavorited);
      toast.success(result.message);
    } catch (error: any) {
      toast.error(error.message || "Failed to toggle favorite");
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleVoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/server/${server.slug}?vote=1`);
  };

  const showRating = (server.rating_count ?? 0) > 0;

  return (
    <Link
      to={`/server/${server.slug}`}
      className={cn(
        "glass rounded-xl overflow-hidden border-l-4 group transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl relative block",
        accentBorder,
        isTop3 && "shadow-[0_0_30px_hsl(0_80%_50%/0.15)] hover:shadow-[0_0_50px_hsl(0_80%_50%/0.3)]",
        "animate-fade-in"
      )}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Rank */}
        <div className={cn(
          "flex sm:flex-col items-center justify-center sm:w-20 px-4 py-3 sm:py-6 flex-shrink-0",
          isTop3 ? "bg-gradient-to-br from-white/[0.06] to-transparent" : ""
        )}>
          {rank === 1 && <Crown className="h-5 w-5 text-[hsl(45_95%_60%)] mb-1" fill="currentColor" />}
          <span className={cn(
            "font-display font-bold font-mono-num leading-none",
            isTop3 ? "text-3xl" : "text-2xl",
            rank === 1 && "text-gold-gradient",
            rank === 2 && "text-[hsl(0_0%_85%)]",
            rank === 3 && "text-[hsl(28_80%_60%)]",
            rank > 3 && "text-muted-foreground"
          )}>#{rank}</span>
        </div>

        {/* Banner */}
        <div className="relative w-full sm:w-40 h-24 sm:h-auto bg-gradient-to-br from-primary/20 via-primary-deep/20 to-black overflow-hidden flex-shrink-0">
          {server.banner_url ? (
            <img src={server.banner_url} alt={server.name} className="absolute inset-0 h-full w-full object-cover opacity-70 group-hover:opacity-90 transition" loading="lazy" />
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <Crown className="h-8 w-8 text-primary/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/80" />
        </div>

        {/* Info */}
        <div className="flex-1 p-4 sm:p-5 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h3 className="font-display text-xl font-bold truncate group-hover:text-primary transition-colors">
                  {server.name}
                </h3>
                {!!server.is_verified && (
                  <ShieldCheck className="h-4 w-4 text-primary-glow shrink-0" />
                )}
                {premiumBadge && (
                  <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border font-semibold shrink-0", premiumBadge.color)}>
                    {premiumBadge.label}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">{server.short_description}</p>
              {/* Owner */}
              {(server.owner_display_name || server.owner_username) && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  by{" "}
                  <Link
                    to={`/user/${server.owner_id}`}
                    onClick={e => e.stopPropagation()}
                    className="hover:text-primary transition-colors"
                  >
                    {server.owner_display_name || server.owner_username}
                  </Link>
                </p>
              )}
            </div>
            {/* Online status */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={cn("pulse-dot", server.is_online ? "bg-emerald-400" : "bg-red-400")} />
              <span className={cn("text-xs font-medium", server.is_online ? "text-emerald-400" : "text-red-400")}>
                {server.is_online ? "Online" : "Offline"}
              </span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {server.version && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10">v{server.version}</span>}
            {server.rate && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-primary/15 border border-primary/30 text-primary-glow">{server.rate}</span>}
            {server.region && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10">{server.region}</span>}
            {tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400">{tag}</span>
            ))}
            {tags.length > 3 && (
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10 text-muted-foreground">+{tags.length - 3}</span>
            )}
          </div>

          {/* Stats + Actions */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              {/* Only show rating if there are reviews */}
              {showRating && (
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-[hsl(45_95%_60%)]" fill="currentColor" />
                  <span className="font-mono-num text-foreground">{Number(server.rating_avg ?? 0).toFixed(1)}</span>
                  <span className="opacity-60">({server.rating_count})</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                <span className="font-mono-num">{(server.profile_visits ?? 0).toLocaleString()}</span>
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-mono-num text-emerald-400 font-semibold">{server.active_players ?? 0}</span>
              </span>
              <span className="flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono-num text-foreground font-bold">{(server.vote_count ?? 0).toLocaleString()}</span>
              </span>

              {/* Social links */}
              <div className="flex items-center gap-1.5">
                {server.website_url && (
                  <a href={server.website_url} target="_blank" rel="noopener noreferrer"
                    onClick={e => { e.preventDefault(); e.stopPropagation(); window.open(server.website_url!, '_blank', 'noopener,noreferrer'); }}
                    className="text-muted-foreground hover:text-foreground transition-colors">
                    <Globe className="h-3.5 w-3.5" />
                  </a>
                )}
                {server.discord_url && (
                  <a href={server.discord_url} target="_blank" rel="noopener noreferrer"
                    onClick={e => { e.preventDefault(); e.stopPropagation(); window.open(server.discord_url!, '_blank', 'noopener,noreferrer'); }}
                    className="text-muted-foreground hover:text-indigo-400 transition-colors">
                    <MessageCircle className="h-3.5 w-3.5" />
                  </a>
                )}
                {server.youtube_url && (
                  <a href={server.youtube_url} target="_blank" rel="noopener noreferrer"
                    onClick={e => { e.preventDefault(); e.stopPropagation(); window.open(server.youtube_url!, '_blank', 'noopener,noreferrer'); }}
                    className="text-muted-foreground hover:text-red-500 transition-colors">
                    <Youtube className="h-3.5 w-3.5" />
                  </a>
                )}
                {server.facebook_url && (
                  <a href={server.facebook_url} target="_blank" rel="noopener noreferrer"
                    onClick={e => { e.preventDefault(); e.stopPropagation(); window.open(server.facebook_url!, '_blank', 'noopener,noreferrer'); }}
                    className="text-muted-foreground hover:text-blue-500 transition-colors">
                    <Facebook className="h-3.5 w-3.5" />
                  </a>
                )}
                {server.twitter_url && (
                  <a href={server.twitter_url} target="_blank" rel="noopener noreferrer"
                    onClick={e => { e.preventDefault(); e.stopPropagation(); window.open(server.twitter_url!, '_blank', 'noopener,noreferrer'); }}
                    className="text-muted-foreground hover:text-sky-400 transition-colors">
                    <Twitter className="h-3.5 w-3.5" />
                  </a>
                )}
                {server.twitch_url && (
                  <a href={server.twitch_url} target="_blank" rel="noopener noreferrer"
                    onClick={e => { e.preventDefault(); e.stopPropagation(); window.open(server.twitch_url!, '_blank', 'noopener,noreferrer'); }}
                    className="text-muted-foreground hover:text-purple-400 transition-colors">
                    <Twitch className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2" onClick={e => e.preventDefault()}>
              <Button
                variant="outline"
                size="icon"
                onClick={handleFavoriteToggle}
                disabled={favoriteLoading}
                className={cn("h-8 w-8", isFavorited && "text-red-500 hover:text-red-600")}
              >
                <Heart className={cn("h-4 w-4", isFavorited && "fill-current")} />
              </Button>
              <Button variant="vote" size="sm" onClick={handleVoteClick}>
                <Zap className="h-3.5 w-3.5 mr-1" /> Vote
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
