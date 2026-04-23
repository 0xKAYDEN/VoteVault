import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { ServerCard, ServerRow } from "@/components/ServerCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trophy, Zap, Users, Sparkles, X } from "lucide-react";

type SortKey = "votes" | "rating" | "newest" | "name" | "players";

const Index = () => {
  const [servers, setServers] = useState<ServerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("votes");
  const [region, setRegion] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Conquer Top 100 — Premium Conquer Online Private Server Toplist";
    const meta = document.querySelector('meta[name="description"]') || document.createElement("meta");
    meta.setAttribute("name", "description");
    meta.setAttribute("content", "Discover and vote for the best Conquer Online private servers. Real-time rankings, verified votes, and player reviews.");
    document.head.appendChild(meta);

    (async () => {
      try {
        const data = await api.servers.getAll();
        setServers(data || []);
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
    switch (sort) {
      case "votes": list.sort((a, b) => Number(b.vote_count) - Number(a.vote_count)); break;
      case "rating": list.sort((a, b) => Number(b.rating_avg) - Number(a.rating_avg)); break;
      case "newest": list.sort((a, b) => Number(b.id) - Number(a.id)); break;
      case "name": list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "players": list.sort((a, b) => Number(b.player_count) - Number(a.player_count)); break;
    }
    return list;
  }, [servers, query, sort, region]);

  const totalVotes = servers.reduce((s, x) => s + (Number(x.vote_count) || 0), 0);
  const totalPlayers = servers.reduce((s, x) => s + (Number(x.player_count) || 0), 0);
  const newest = [...servers].sort((a, b) => Number(b.id) - Number(a.id))[0];

  const regions = Array.from(new Set(servers.map(s => s.region).filter(Boolean))) as string[];

  return (
    <div className="container py-10 md:py-14">
      {/* Hero */}
      <section className="text-center mb-12 md:mb-16 animate-fade-in">
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6 text-xs uppercase tracking-widest text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          The premium Conquer Online toplist
        </div>
        <h1 className="font-display font-bold uppercase tracking-tight leading-[0.95]
                       text-5xl md:text-7xl lg:text-8xl mb-4">
          <span className="block text-gradient">CONQUER</span>
          <span className="block shimmer text-crimson-gradient">TOP 100</span>
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-base md:text-lg">
          Discover, vote, and dominate. The toplist for serious Conquer Online private servers.
        </p>

        {/* Live stats */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <StatPill icon={<Trophy className="h-4 w-4" />} label="Servers" value={servers.length} />
          <StatPill icon={<Zap className="h-4 w-4" />} label="Total Votes" value={totalVotes} accent />
          <StatPill icon={<Users className="h-4 w-4" />} label="Players Online" value={totalPlayers} />
          {newest && <StatPill icon={<Sparkles className="h-4 w-4" />} label="Newest" value={newest.name} text />}
        </div>
      </section>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
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
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass rounded-xl h-32 shimmer" />
          ))
        ) : filtered.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center text-muted-foreground">
            No servers match your filters.
          </div>
        ) : (
          filtered.map((s, i) => <ServerCard key={s.id} server={s} rank={i + 1} />)
        )}
      </div>
    </div>
  );
};

function StatPill({ icon, label, value, accent, text }: { icon: React.ReactNode; label: string; value: number | string; accent?: boolean; text?: boolean }) {
  return (
    <div className="glass rounded-full pl-3 pr-5 py-2 flex items-center gap-3">
      <div className={`grid h-7 w-7 place-items-center rounded-full ${accent ? "bg-gradient-crimson" : "bg-white/5 border border-white/10"}`}>
        {icon}
      </div>
      <div className="text-left">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground leading-none">{label}</div>
        <div className={`font-mono-num font-bold leading-tight ${accent ? "text-primary-glow" : ""} ${text ? "text-sm" : "text-base"}`}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
      </div>
    </div>
  );
}

export default Index;
