import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Star, Zap, Globe, ExternalLink, Trash2, Crown, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const Favorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<number | null>(null);

  useEffect(() => {
    document.title = "Favorite Servers — VoteVault";
    if (user) loadFavorites();
  }, [user]);

  const loadFavorites = async () => {
    try {
      const data = await api.favorites.getAll();
      setFavorites(data);
    } catch {
      toast.error("Failed to load favorites");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (serverId: number) => {
    setRemoving(serverId);
    try {
      await api.favorites.toggle(serverId);
      setFavorites(prev => prev.filter(f => f.id !== serverId));
      toast.success("Removed from favorites");
    } catch {
      toast.error("Failed to remove");
    } finally {
      setRemoving(null);
    }
  };

  const getPlanBadge = (server: any) => {
    const plan = server.subscription_plan;
    const active = server.subscription_expires_at && new Date(server.subscription_expires_at) > new Date();
    if (!plan || !active) return null;
    if (plan.includes("enterprise")) return { label: "Enterprise", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
    if (plan.includes("pro"))        return { label: "Pro",        color: "bg-purple-500/20 text-purple-400 border-purple-500/30" };
    if (plan.includes("starter"))    return { label: "Starter",    color: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <Heart className="h-7 w-7 text-primary fill-primary" /> Favorite Servers
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Servers you've bookmarked for quick access.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/">Browse Servers</Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="glass rounded-xl h-32 shimmer" />)}
        </div>
      ) : favorites.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <h3 className="font-semibold mb-1">No favorites yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Browse servers and click the heart icon to save them here.
          </p>
          <Button variant="hero" asChild>
            <Link to="/">Browse Servers</Link>
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {favorites.map(server => {
            const planBadge = getPlanBadge(server);
            return (
              <div key={server.id} className="glass rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors group">
                <div className="flex items-start gap-4">
                  {/* Logo */}
                  <div className="h-14 w-14 rounded-xl bg-gradient-crimson flex items-center justify-center shrink-0 overflow-hidden border border-white/10">
                    {server.logo_url
                      ? <img src={server.logo_url} alt={server.name} className="w-full h-full object-cover" />
                      : <Crown className="h-7 w-7 text-white" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link to={`/server/${server.slug}`} className="font-semibold hover:text-primary transition-colors truncate">
                        {server.name}
                      </Link>
                      {server.is_verified && <ShieldCheck className="h-4 w-4 text-primary-glow shrink-0" />}
                      {planBadge && (
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-semibold", planBadge.color)}>
                          {planBadge.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{server.short_description}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-primary" />
                        {Number(server.vote_count || 0).toLocaleString()} votes
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-400" />
                        {Number(server.rating_avg || 0).toFixed(1)}
                      </span>
                      {server.region && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />{server.region}
                        </span>
                      )}
                      <span className={cn("flex items-center gap-1", server.is_online ? "text-green-400" : "")}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", server.is_online ? "bg-green-400" : "bg-muted-foreground")} />
                        {server.is_online ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Button size="sm" variant="hero" className="h-7 text-xs px-3" asChild>
                      <Link to={`/server/${server.slug}`}>
                        <ExternalLink className="h-3 w-3 mr-1" />Visit
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs px-3 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      disabled={removing === server.id}
                      onClick={() => handleRemove(server.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />Remove
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {favorites.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {favorites.length} favorite{favorites.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
};

export default Favorites;
