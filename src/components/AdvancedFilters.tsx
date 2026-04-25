import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, X, ChevronDown, Filter, RotateCcw,
  TrendingUp, Star, BadgeCheck, LayoutGrid, Grid3x3, List
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type SortKey = "votes" | "rating" | "newest" | "name" | "players";
type ViewMode = "card" | "compact" | "list";

interface AdvancedFiltersProps {
  query: string;
  setQuery: (q: string) => void;
  sort: SortKey;
  setSort: (s: SortKey) => void;
  region: string | null;
  setRegion: (r: string | null) => void;
  verifiedOnly: boolean;
  setVerifiedOnly: (v: boolean) => void;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  regions: string[];
  versions: string[];
  rates: string[];
  selectedVersion: string | null;
  setSelectedVersion: (v: string | null) => void;
  selectedRate: string | null;
  setSelectedRate: (r: string | null) => void;
}

const POPULAR_SEARCHES = [
  "PvP", "PvE", "Roleplay", "High Rate", "Low Rate", "Custom", "Classic"
];

const QUICK_FILTERS = [
  { id: "top-rated", label: "Top Rated", icon: Star, sort: "rating" as SortKey },
  { id: "most-active", label: "Most Active", icon: TrendingUp, sort: "players" as SortKey },
  { id: "most-voted", label: "Most Voted", icon: TrendingUp, sort: "votes" as SortKey },
];

export function AdvancedFilters({
  query, setQuery, sort, setSort, region, setRegion,
  verifiedOnly, setVerifiedOnly, viewMode, setViewMode,
  regions, versions, rates, selectedVersion, setSelectedVersion, selectedRate, setSelectedRate
}: AdvancedFiltersProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Save preferences to localStorage
  useEffect(() => {
    const prefs = { sort, viewMode, verifiedOnly };
    localStorage.setItem("filter-preferences", JSON.stringify(prefs));
  }, [sort, viewMode, verifiedOnly]);

  // Load preferences on mount
  useEffect(() => {
    const saved = localStorage.getItem("filter-preferences");
    if (saved) {
      try {
        const prefs = JSON.parse(saved);
        if (prefs.sort) setSort(prefs.sort);
        if (prefs.viewMode) setViewMode(prefs.viewMode);
        if (typeof prefs.verifiedOnly === "boolean") setVerifiedOnly(prefs.verifiedOnly);
      } catch (e) {
        console.error("Failed to load preferences:", e);
      }
    }
  }, []);

  const clearAllFilters = () => {
    setQuery("");
    setSort("votes");
    setRegion(null);
    setVerifiedOnly(false);
    setSelectedVersion(null);
    setSelectedRate(null);
    setAdvancedOpen(false);
  };

  const hasActiveFilters = query || region || verifiedOnly || selectedVersion || selectedRate || sort !== "votes";

  const filteredSuggestions = POPULAR_SEARCHES.filter(s =>
    s.toLowerCase().includes(query.toLowerCase()) && s.toLowerCase() !== query.toLowerCase()
  );

  return (
    <div className="glass rounded-2xl p-4 mb-6 space-y-3 relative z-40">
      {/* Quick Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map(filter => (
          <Button
            key={filter.id}
            size="sm"
            variant={sort === filter.sort ? "hero" : "outline"}
            onClick={() => setSort(filter.sort)}
            className="gap-1.5"
          >
            <filter.icon className="h-3.5 w-3.5" />
            {filter.label}
          </Button>
        ))}

        {hasActiveFilters && (
          <>
            <div className="h-6 w-px bg-white/10 self-center" />
            <Button
              size="sm"
              variant="outline"
              onClick={clearAllFilters}
              className="gap-1.5 text-destructive hover:text-destructive"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear All
            </Button>
          </>
        )}
      </div>

      {/* Search Bar with Suggestions */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="relative flex-1 z-50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Search servers… (try: PvP, Roleplay, Custom)"
            className="pl-10 pr-10 bg-white/[0.03] border-white/10 focus-visible:ring-primary/50"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition z-10"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Search Suggestions */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 glass-strong rounded-lg border border-white/10 overflow-hidden z-20 animate-fade-in opacity-100 shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)]">
              <div className="p-2 text-xs text-muted-foreground border-b border-white/10">
                Popular searches
              </div>
              {filteredSuggestions.map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setQuery(suggestion);
                    setShowSuggestions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-white/5 transition flex items-center gap-2"
                >
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Verified Only */}
        <Button
          size="sm"
          variant={verifiedOnly ? "hero" : "outline"}
          onClick={() => setVerifiedOnly(!verifiedOnly)}
          className="gap-2"
        >
          <BadgeCheck className="h-4 w-4" />
          Verified Only
        </Button>

        {/* Advanced Filters Toggle */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Advanced
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", advancedOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
        </Collapsible>

        <div className="h-4 w-px bg-white/10" />

        {/* View Mode */}
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

      {/* Advanced Filters Panel */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleContent className="space-y-3 pt-3 border-t border-white/10">
          {/* Regions */}
          {regions.length > 0 && (
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                Region
              </label>
              <div className="flex flex-wrap gap-2">
                {regions.map(r => (
                  <button
                    key={r}
                    onClick={() => setRegion(region === r ? null : r)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full border transition",
                      region === r
                        ? "bg-primary/20 border-primary/50 text-primary-glow"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Versions */}
          {versions.length > 0 && (
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                Version
              </label>
              <div className="flex flex-wrap gap-2">
                {versions.map(v => (
                  <button
                    key={v}
                    onClick={() => setSelectedVersion(selectedVersion === v ? null : v)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full border transition",
                      selectedVersion === v
                        ? "bg-primary/20 border-primary/50 text-primary-glow"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    )}
                  >
                    v{v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Rates */}
          {rates.length > 0 && (
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                Rate
              </label>
              <div className="flex flex-wrap gap-2">
                {rates.map(rate => (
                  <button
                    key={rate}
                    onClick={() => setSelectedRate(selectedRate === rate ? null : rate)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full border transition",
                      selectedRate === rate
                        ? "bg-primary/20 border-primary/50 text-primary-glow"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    )}
                  >
                    {rate}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
