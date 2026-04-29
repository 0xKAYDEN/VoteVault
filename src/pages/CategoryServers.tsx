import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { api } from "@/lib/api";
import { ServerCard, ServerRow } from "@/components/ServerCard";
import { ArrowLeft, Gamepad2, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  server_count?: number;
}

type SortKey = "votes" | "rating" | "newest" | "name" | "players";

const CategoryServers = () => {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [servers, setServers] = useState<ServerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("votes");
  const [region, setRegion] = useState<string>("all");
  const [version, setVersion] = useState<string>("all");
  const [rate, setRate] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const [categoryData, serversData] = await Promise.all([
          api.categories.getBySlug(slug),
          api.categories.getServersByCategory(slug)
        ]);
        setCategory(categoryData);
        setServers(serversData || []);
      } catch (err) {
        console.error("Error fetching category data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const filtered = useMemo(() => {
    let list = [...servers];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.short_description.toLowerCase().includes(q));
    }
    if (region !== "all") list = list.filter(s => s.region === region);
    if (version !== "all") list = list.filter(s => s.version === version);
    if (rate !== "all") list = list.filter(s => s.rate === rate);

    switch (sort) {
      case "votes": list.sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0)); break;
      case "rating": list.sort((a, b) => (b.rating_avg ?? 0) - (a.rating_avg ?? 0)); break;
      case "newest": list.sort((a, b) => b.id - a.id); break;
      case "name": list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "players": list.sort((a, b) => (b.active_players ?? 0) - (a.active_players ?? 0)); break;
    }
    return list;
  }, [servers, search, sort, region, version, rate]);

  const regions = Array.from(new Set(servers.map(s => s.region).filter(Boolean))) as string[];
  const versions = Array.from(new Set(servers.map(s => s.version).filter(Boolean))) as string[];
  const rates = Array.from(new Set(servers.map(s => s.rate).filter(Boolean))) as string[];

  if (loading) {
    return (
      <div className="container py-10 md:py-14">
        <div className="glass rounded-xl h-32 shimmer mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass rounded-xl h-32 shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container py-10 md:py-14">
        <div className="glass rounded-xl p-12 text-center">
          <h2 className="text-2xl font-bold mb-2">Category not found</h2>
          <p className="text-muted-foreground mb-6">The category you're looking for doesn't exist.</p>
          <Button variant="hero" asChild>
            <Link to="/categories"><ArrowLeft className="h-4 w-4 mr-2" />Back to Categories</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10 md:py-14">
      <Helmet>
        <title>{category.name} Servers — VoteVault</title>
        <meta name="description" content={`Browse ${category.name} servers. ${category.description}`} />
      </Helmet>

      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/categories"><ArrowLeft className="h-4 w-4 mr-2" />All Categories</Link>
        </Button>

        <div className="glass rounded-2xl p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-crimson shrink-0">
              <Gamepad2 className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h1 className="font-display font-bold text-3xl md:text-4xl mb-2">{category.name}</h1>
              <p className="text-muted-foreground mb-3">{category.description}</p>
              <div className="text-sm font-mono-num text-primary-glow">
                {filtered.length} {filtered.length === 1 ? "server" : "servers"}
                {filtered.length !== servers.length && ` (${servers.length} total)`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass rounded-xl p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search servers in this category..."
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(f => !f)}
            className="md:w-auto"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Sort By</Label>
              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="votes">Most Votes</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="players">Most Players</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {regions.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Region</Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    {regions.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {versions.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Version</Label>
                <Select value={version} onValueChange={setVersion}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Versions</SelectItem>
                    {versions.map(v => (
                      <SelectItem key={v} value={v}>v{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {rates.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Rate</Label>
                <Select value={rate} onValueChange={setRate}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rates</SelectItem>
                    {rates.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Server list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center text-muted-foreground">
            {search ? `No servers matching "${search}"` : "No servers in this category yet."}
          </div>
        ) : (
          filtered.map((server, i) => (
            <ServerCard key={server.id} server={server} rank={i + 1} />
          ))
        )}
      </div>
    </div>
  );
};

export default CategoryServers;
