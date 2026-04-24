import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { api } from "@/lib/api";
import { ServerCard, ServerRow } from "@/components/ServerCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trophy, Zap, Users, Sparkles, X, Grid3x3, List, LayoutGrid, BadgeCheck, Eye } from "lucide-react";
import { ServerListSkeleton, ServerCompactGridSkeleton, ServerRowListSkeleton } from "@/components/LoadingStates";

type SortKey = "votes" | "rating" | "newest" | "name" | "players";
type ViewMode = "card" | "compact" | "list";

const Index = () => {
  const [servers, setServers] = useState<ServerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("votes");
  const [region, setRegion] = useState<string | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [totalVisits, setTotalVisits] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [serversData, statsData] = await Promise.all([
          api.servers.getAll(),
          api.stats.getSiteStats().catch(() => ({ total_visits: 0 }))
        ]);
        setServers(serversData || []);
        setTotalVisits(statsData.total_visits || 0);
      } catch (err) {
        console.error("Error fetching servers:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = [...servers];
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.short_description.toLowerCase().includes(q));
    }
    if (region) list = list.filter(s => s.region === region);
    if (verifiedOnly) list = list.filter(s => s.is_verified);
    switch (sort) {
      case "votes": list.sort((a, b) => Number(b.vote_count) - Number(a.vote_count)); break;
      case "rating": list.sort((a, b) => Number(b.rating_avg) - Number(a.rating_avg)); break;
      case "newest": list.sort((a, b) => Number(b.id) - Number(a.id)); break;
      case "name": list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "players": list.sort((a, b) => Number(b.player_count) - Number(a.player_count)); break;
    }
    return list;
  }, [servers, query, sort, region, verifiedOnly]);

  const totalVotes = servers.reduce((s, x) => s + (Number(x.vote_count) || 0), 0);
  const totalPlayers = servers.reduce((s, x) => s + (Number(x.player_count) || 0), 0);
  const verifiedCount = servers.filter(s => s.is_verified).length;
  const newest = [...servers].sort((a, b) => Number(b.id) - Number(a.id))[0];

  const regions = Array.from(new Set(servers.map(s => s.region).filter(Boolean))) as string[];

  return (
    <div className="container py-10 md:py-14">
      <Helmet>
        <title>VoteVault — Premium Server Rankings & Toplist</title>
        <meta name="description" content="Discover and vote for the best servers. Real-time rankings, verified votes, and player reviews." />
        <meta property="og:title" content="VoteVault — Premium Server Rankings & Toplist" />
        <meta property="og:description" content="Discover and vote for the best servers. Real-time rankings, verified votes, and player reviews." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {/* Hero */}
      <section className="text-center mb-12 md:mb-16 animate-fade-in relative">
        {/* Animated background orbs */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float-orb" />
          <div className="absolute top-20 right-1/4 w-80 h-80 bg-accent/15 rounded-full blur-3xl animate-float-orb" style={{ animationDelay: '2s' }} />
        </div>

        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6 text-xs uppercase tracking-widest text-muted-foreground animate-slide-down">
          <Sparkles className="h-3 w-3 text-primary animate-pulse" />
          The premium server ranking platform
        </div>
        <h1 className="font-display font-bold uppercase tracking-tight leading-[0.95]
                       text-5xl md:text-7xl lg:text-8xl mb-4 animate-scale-in relative">
          <span className="block text-gradient relative z-10">VOTE</span>
          <span className="block shimmer text-crimson-gradient bg-clip-text relative z-10">VAULT</span>
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-base md:text-lg animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Discover, vote, and dominate. The ultimate server ranking platform.
        </p>

        {/* Live stats */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <StatPill icon={<Trophy className="h-4 w-4" />} label="Servers" value={servers.length} delay="0.1s" />
          <StatPill icon={<Zap className="h-4 w-4" />} label="Total Votes" value={totalVotes} accent delay="0.2s" />
          <StatPill icon={<Users className="h-4 w-4" />} label="Players Online" value={totalPlayers} delay="0.3s" />
          <StatPill icon={<BadgeCheck className="h-4 w-4" />} label="Verified" value={verifiedCount} delay="0.4s" />
          <StatPill icon={<Eye className="h-4 w-4" />} label="Total Visits" value={totalVisits} delay="0.5s" />
          {newest && <StatPill icon={<Sparkles className="h-4 w-4" />} label="Newest" value={newest.name} text delay="0.6s" />}
        </div>
      </section>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 mb-6 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search servers…"
              className="pl-10 bg-white/[0.03] border-white/10 focus-visible:ring-primary/50"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["votes", "rating", "newest", "players", "name"] as SortKey[]).map(k => (
              <Button key={k} size="sm" variant={sort === k ? "hero" : "outline"} onClick={() => setSort(k)} className="capitalize">
                {k}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={verifiedOnly ? "hero" : "outline"}
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className="gap-2"
            >
              <BadgeCheck className="h-4 w-4" />
              Verified Only
            </Button>
          </div>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">View:</span>
            <Button
              size="sm"
              variant={viewMode === "card" ? "hero" : "outline"}
              onClick={() => setViewMode("card")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === "compact" ? "hero" : "outline"}
              onClick={() => setViewMode("compact")}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === "list" ? "hero" : "outline"}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {regions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-xs uppercase tracking-wider text-muted-foreground self-center mr-1">Region:</span>
          {regions.map(r => (
            <button key={r}
              onClick={() => setRegion(region === r ? null : r)}
              className={`text-xs px-3 py-1 rounded-full border transition ${region === r ? "bg-primary/20 border-primary/50 text-primary-glow" : "bg-white/5 border-white/10 hover:border-white/20"}`}>
              {r}
            </button>
          ))}
          {region && (
            <button onClick={() => setRegion(null)} className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:border-destructive/40 flex items-center gap-1">
              <X className="h-3 w-3" /> clear
            </button>
          )}
        </div>
      )}

      {/* Server list */}
      {loading ? (
        viewMode === "card" ? (
          <ServerListSkeleton count={5} />
        ) : viewMode === "compact" ? (
          <ServerCompactGridSkeleton count={6} />
        ) : (
          <ServerRowListSkeleton count={10} />
        )
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center text-muted-foreground">
          No servers match your filters.
        </div>
      ) : (
        <div className={
          viewMode === "card" ? "space-y-3" :
          viewMode === "compact" ? "grid grid-cols-1 md:grid-cols-2 gap-3" :
          "space-y-2"
        }>
          {viewMode === "card" ? (
            filtered.map((s, i) => <ServerCard key={s.id} server={s} rank={i + 1} />)
          ) : viewMode === "compact" ? (
            filtered.map((s, i) => <CompactServerCard key={s.id} server={s} rank={i + 1} />)
          ) : (
            filtered.map((s, i) => <ListServerCard key={s.id} server={s} rank={i + 1} />)
          )}
        </div>
      )}
    </div>
  );
};

function StatPill({ icon, label, value, accent, text, delay }: { icon: React.ReactNode; label: string; value: number | string; accent?: boolean; text?: boolean; delay?: string }) {
  return (
    <div className="glass rounded-full pl-3 pr-5 py-2 flex items-center gap-3 hover-lift cursor-default animate-fade-in" style={{ animationDelay: delay }}>
      <div className={`grid h-7 w-7 place-items-center rounded-full transition-all ${accent ? "bg-gradient-crimson glow-pulse" : "bg-white/5 border border-white/10 hover:border-primary/50"}`}>
        {icon}
      </div>
      <div className="text-left">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground leading-none">{label}</div>
        <div className={`font-mono-num font-bold leading-tight transition-colors ${accent ? "text-primary-glow" : "group-hover:text-primary"} ${text ? "text-sm" : "text-base"}`}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
      </div>
    </div>
  );
}

// Compact card view
function CompactServerCard({ server, rank }: { server: ServerRow; rank: number }) {
  return (
    <a href={`/server/${server.slug}`} className="glass glass-hover rounded-xl p-4 flex flex-col gap-3 transition-all hover:scale-[1.02]">
      <div className="flex items-start gap-3">
        <div className="text-2xl font-bold text-primary-glow">#{rank}</div>
        {server.logo_url && (
          <img src={server.logo_url} alt={server.name} className="h-12 w-12 rounded-lg object-cover" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold truncate">{server.name}</h3>
            {server.is_verified && <BadgeCheck className="h-4 w-4 text-primary shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{server.short_description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-primary" />
          <span className="font-mono-num">{Number(server.vote_count).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span className="font-mono-num">{Number(server.player_count).toLocaleString()}</span>
        </div>
        {server.region && (
          <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
            {server.region}
          </div>
        )}
      </div>
    </a>
  );
}

// List view
function ListServerCard({ server, rank }: { server: ServerRow; rank: number }) {
  return (
    <a href={`/server/${server.slug}`} className="glass glass-hover rounded-lg p-3 flex items-center gap-4 transition-all hover:scale-[1.01]">
      <div className="text-xl font-bold text-primary-glow w-12 text-center">#{rank}</div>
      {server.logo_url && (
        <img src={server.logo_url} alt={server.name} className="h-10 w-10 rounded-lg object-cover" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-bold truncate">{server.name}</h3>
          {server.is_verified && <BadgeCheck className="h-4 w-4 text-primary shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground truncate">{server.short_description}</p>
      </div>
      <div className="hidden md:flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <Zap className="h-4 w-4 text-primary" />
          <span className="font-mono-num">{Number(server.vote_count).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          <span className="font-mono-num">{Number(server.player_count).toLocaleString()}</span>
        </div>
        {server.region && (
          <div className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-xs">
            {server.region}
          </div>
        )}
      </div>
    </a>
  );
}

export default Index;
