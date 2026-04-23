import { Link } from "react-router-dom";
import { Crown, Star, Users, Zap, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  vote_count: number;
  rating_avg: number;
  rating_count: number;
  player_count: number;
  profile_visits: number;
  features?: string | null;
  events_time?: string | null;
  upcoming_updates?: string | null;
}

export function ServerCard({ server, rank }: { server: ServerRow; rank: number }) {
  const isTop3 = rank <= 3;
  const accentBorder =
    rank === 1 ? "border-l-[hsl(45_95%_55%)]" :
    rank === 2 ? "border-l-[hsl(0_0%_75%)]" :
    rank === 3 ? "border-l-[hsl(28_70%_50%)]" : "border-l-primary/60";

  return (
    <div
      className={cn(
        "glass glass-hover rounded-xl overflow-hidden border-l-4 group",
        accentBorder,
        isTop3 && "shadow-[0_0_30px_hsl(0_80%_50%/0.15)]"
      )}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Rank badge */}
        <div className={cn(
          "flex sm:flex-col items-center justify-center sm:w-24 px-4 py-3 sm:py-6",
          isTop3 ? "bg-gradient-to-br from-white/[0.06] to-transparent" : ""
        )}>
          {rank === 1 && <Crown className="h-6 w-6 text-[hsl(45_95%_60%)] mb-1" fill="currentColor" />}
          <span className={cn(
            "font-display font-bold font-mono-num leading-none",
            isTop3 ? "text-3xl" : "text-2xl",
            rank === 1 && "text-gold-gradient",
            rank === 2 && "text-[hsl(0_0%_85%)]",
            rank === 3 && "text-[hsl(28_80%_60%)]",
            rank > 3 && "text-muted-foreground"
          )}>
            #{rank}
          </span>
        </div>

        {/* Banner / Logo */}
        <div className="relative w-full sm:w-48 h-28 sm:h-auto bg-gradient-to-br from-primary/20 via-primary-deep/20 to-black overflow-hidden">
          {server.banner_url ? (
            <img src={server.banner_url} alt={server.name} className="absolute inset-0 h-full w-full object-cover opacity-70 group-hover:opacity-90 transition" loading="lazy" />
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <Crown className="h-10 w-10 text-primary/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/80" />
        </div>

        {/* Info */}
        <div className="flex-1 p-4 sm:p-5 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <Link to={`/server/${server.slug}`} className="block">
                <h3 className="font-display text-xl font-bold truncate hover:text-primary transition">
                  {server.name}
                </h3>
              </Link>
              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{server.short_description}</p>
            </div>
            <span className="flex items-center gap-1.5 shrink-0 text-xs text-muted-foreground">
              <span className={cn("pulse-dot", server.is_online ? "bg-emerald-400" : "bg-muted-foreground")} />
              {server.is_online ? "Online" : "Offline"}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {server.version && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10">v{server.version}</span>}
            {server.rate && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-primary/15 border border-primary/30 text-primary-glow">{server.rate}</span>}
            {server.region && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10">{server.region}</span>}
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5" title={`${server.rating_count} reviews`}>
                <Star className="h-3.5 w-3.5 text-[hsl(45_95%_60%)]" fill="currentColor" />
                <span className="font-mono-num text-foreground">{Number(server.rating_avg).toFixed(1)}</span>
                {server.rating_count > 0 && <span className="opacity-60">({server.rating_count})</span>}
              </span>
              <span className="flex items-center gap-1.5" title="Total profile visits">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-mono-num">{server.profile_visits.toLocaleString()}</span>
              </span>
              <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /><span className="font-mono-num">{server.player_count}</span></span>
              <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-primary" /><span className="font-mono-num text-foreground font-bold">{server.vote_count.toLocaleString()}</span> votes</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild><Link to={`/server/${server.slug}`}>Details</Link></Button>
              <Button variant="vote" size="sm" asChild><Link to={`/server/${server.slug}?vote=1`}>Vote</Link></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
