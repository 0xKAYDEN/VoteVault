import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Crown, Star, Users, Zap, Globe, MessageCircle, Check, ArrowLeft } from "lucide-react";
import { VoteDialog } from "@/components/VoteDialog";
import { ServerRow } from "@/components/ServerCard";
import { useAuth } from "@/hooks/useAuth";

const ServerProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const [server, setServer] = useState<(ServerRow & { long_description: string | null; website_url: string | null; discord_url: string | null }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [voteOpen, setVoteOpen] = useState(false);
  const [recentVoted, setRecentVoted] = useState(false);

  const load = async () => {
    if (!slug) return;
    const { data } = await supabase.from("servers").select("*").eq("slug", slug).maybeSingle();
    setServer(data as any);
    setLoading(false);
    if (data) document.title = `${data.name} — Conquer Top 100`;
  };

  useEffect(() => { load(); }, [slug]);

  useEffect(() => {
    if (params.get("vote") === "1" && server && user) {
      setVoteOpen(true);
      setParams({}, { replace: true });
    }
  }, [params, server, user, setParams]);

  if (loading) {
    return <div className="container py-20"><div className="glass rounded-2xl h-64 shimmer" /></div>;
  }
  if (!server) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-3xl mb-2">Server not found</h1>
        <Button variant="outline" asChild><Link to="/"><ArrowLeft className="h-4 w-4" /> Back to Top 100</Link></Button>
      </div>
    );
  }

  const onVoteSuccess = async () => {
    setRecentVoted(true);
    await load();
  };

  return (
    <div className="container py-8 md:py-12">
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
            <div className="grid h-20 w-20 md:h-24 md:w-24 place-items-center rounded-2xl bg-gradient-crimson border-4 border-card shadow-[0_0_30px_hsl(0_80%_50%/0.5)] shrink-0">
              <Crown className="h-10 w-10 md:h-12 md:w-12 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Conquer Online server</span>
                <span className={`pulse-dot ${server.is_online ? "bg-emerald-400" : "bg-muted-foreground"}`} />
              </div>
              <h1 className="font-display text-3xl md:text-5xl font-bold text-gradient">{server.name}</h1>
              <p className="text-muted-foreground mt-1">{server.short_description}</p>
            </div>
            <div className="flex flex-col items-stretch md:items-end gap-2">
              {recentVoted && (
                <div className="glass rounded-lg px-3 py-1.5 text-xs text-emerald-400 flex items-center gap-1.5 animate-slide-down">
                  <Check className="h-3.5 w-3.5" /> Vote recorded!
                </div>
              )}
              <Button variant="vote" size="lg" onClick={() => setVoteOpen(true)}>
                <Zap className="h-5 w-5" /> Vote Now
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <Stat label="Votes" value={server.vote_count.toLocaleString()} icon={<Zap className="h-4 w-4 text-primary" />} highlight={recentVoted} />
            <Stat label="Rating" value={server.rating_avg.toFixed(1)} icon={<Star className="h-4 w-4 text-[hsl(45_95%_60%)]" />} />
            <Stat label="Players" value={server.player_count.toLocaleString()} icon={<Users className="h-4 w-4" />} />
            <Stat label="Region" value={server.region ?? "—"} icon={<Globe className="h-4 w-4" />} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="info">Server Info</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
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
                <Button variant="outline" size="sm" asChild>
                  <a href={server.discord_url} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" />Discord</a>
                </Button>
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
            <Info label="Total Votes" value={server.vote_count.toLocaleString()} />
            <Info label="Reviews" value={String(server.rating_avg.toFixed(1)) + " ★"} />
          </div>
        </TabsContent>
        <TabsContent value="reviews" className="mt-4">
          <div className="glass rounded-2xl p-12 text-center text-muted-foreground">
            Reviews coming soon.
          </div>
        </TabsContent>
      </Tabs>

      <VoteDialog
        open={voteOpen}
        onOpenChange={setVoteOpen}
        serverId={server.id}
        serverName={server.name}
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
