import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { api } from "@/lib/api";
import {
  Swords, Zap, Shield, Users, Mountain, Box, Sparkles,
  Rocket, Castle, Star, Skull, Coffee, TrendingUp, TrendingDown,
  Wrench, Clock, DollarSign, Globe, Crown, Gamepad2
} from "lucide-react";

const iconMap: Record<string, any> = {
  Swords, Zap, Shield, Users, Mountain, Box, Sparkles,
  Rocket, Castle, Star, Skull, Coffee, TrendingUp, TrendingDown,
  Wrench, Clock, DollarSign, Globe, Crown, Gamepad2
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.categories.getAll();

        // Fetch server counts for each category
        const categoriesWithCounts = await Promise.all(
          data.map(async (cat: Category) => {
            try {
              const servers = await api.categories.getServersByCategory(cat.slug);
              return { ...cat, server_count: servers.length };
            } catch {
              return { ...cat, server_count: 0 };
            }
          })
        );

        setCategories(categoriesWithCounts);
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="container py-10 md:py-14">
      <Helmet>
        <title>Categories — VoteVault</title>
        <meta name="description" content="Browse servers by category. Find MMORPG, PvP, PvE, and more gaming categories." />
      </Helmet>

      <div className="text-center mb-12 animate-fade-in">
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6 text-xs uppercase tracking-widest text-muted-foreground">
          <Gamepad2 className="h-3 w-3 text-primary" />
          Browse by category
        </div>
        <h1 className="font-display font-bold uppercase tracking-tight text-4xl md:text-6xl mb-4">
          <span className="block text-gradient">SERVER</span>
          <span className="block shimmer text-crimson-gradient">CATEGORIES</span>
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-base md:text-lg">
          Find the perfect server for your playstyle. Browse by game type, difficulty, and more.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="glass rounded-xl h-32 shimmer" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((category) => {
            const IconComponent = iconMap[category.icon] || Gamepad2;

            return (
              <Link
                key={category.id}
                to={`/categories/${category.slug}`}
                className="glass glass-hover rounded-xl p-6 flex flex-col items-center text-center gap-3 transition-all hover:scale-105"
              >
                <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-crimson">
                  <IconComponent className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">{category.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {category.description}
                  </p>
                  <div className="text-xs font-mono-num text-primary-glow">
                    {category.server_count || 0} {category.server_count === 1 ? 'server' : 'servers'}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!loading && categories.length === 0 && (
        <div className="glass rounded-xl p-12 text-center text-muted-foreground">
          No categories available yet.
        </div>
      )}
    </div>
  );
};

export default Categories;
