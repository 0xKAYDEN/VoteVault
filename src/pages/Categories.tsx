import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Swords, Zap, Shield, Users, Mountain, Box, Sparkles,
  Rocket, Castle, Star, Skull, Coffee, TrendingUp, TrendingDown,
  Wrench, Clock, DollarSign, Globe, Crown, Gamepad2, Search, Plus,
} from "lucide-react";

const iconMap: Record<string, any> = {
  Swords, Zap, Shield, Users, Mountain, Box, Sparkles,
  Rocket, Castle, Star, Skull, Coffee, TrendingUp, TrendingDown,
  Wrench, Clock, DollarSign, Globe, Crown, Gamepad2,
};

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  server_count?: number;
}

const Categories = () => {
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api.categories.getAll();
        const withCounts = await Promise.all(
          data.map(async (cat: Category) => {
            try {
              const servers = await api.categories.getServersByCategory(cat.slug);
              return { ...cat, server_count: servers.length };
            } catch {
              return { ...cat, server_count: 0 };
            }
          })
        );
        setCategories(withCounts);
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(c =>
      c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
    );
  }, [categories, search]);

  return (
    <div className="container py-10 md:py-14">
      <Helmet>
        <title>Categories — VoteVault</title>
        <meta name="description" content="Browse servers by category." />
      </Helmet>

      <div className="text-center mb-10 animate-fade-in">
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6 text-xs uppercase tracking-widest text-muted-foreground">
          <Gamepad2 className="h-3 w-3 text-primary" />
          Browse by category
        </div>
        <h1 className="font-display font-bold uppercase tracking-tight text-4xl md:text-6xl mb-4">
          <span className="block text-gradient">SERVER</span>
          <span className="block shimmer text-crimson-gradient">CATEGORIES</span>
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-base md:text-lg">
          Find the perfect server for your playstyle.
        </p>
      </div>

      {/* Search + Admin add */}
      <div className="flex gap-3 mb-8 max-w-lg mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="pl-9"
          />
        </div>
        {isAdmin && (
          <Button variant="hero" asChild>
            <Link to="/admin/categories/new">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Link>
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="glass rounded-xl h-32 shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center text-muted-foreground">
          {search ? `No categories matching "${search}"` : "No categories available yet."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(category => {
            const IconComponent = iconMap[category.icon] || Gamepad2;
            return (
              <Link
                key={category.id}
                to={`/categories/${category.slug}`}
                className="glass glass-hover rounded-xl p-6 flex flex-col items-center text-center gap-3 transition-all hover:scale-105 group"
              >
                <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-crimson group-hover:shadow-[0_0_20px_hsl(0_80%_50%/0.4)] transition-shadow">
                  <IconComponent className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{category.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{category.description}</p>
                  <div className="text-xs font-mono-num text-primary-glow">
                    {category.server_count || 0} {category.server_count === 1 ? "server" : "servers"}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Categories;
