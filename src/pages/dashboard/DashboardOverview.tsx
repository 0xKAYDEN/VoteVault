import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Server, Zap, Star, TrendingUp } from "lucide-react";

const DashboardOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ servers: 0, totalVotes: 0, avgRating: 0, votes24h: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: srvs } = await supabase.from("servers").select("id,vote_count,rating_avg").eq("owner_id", user.id);
      const ids = (srvs ?? []).map(s => s.id);
      const totalVotes = (srvs ?? []).reduce((s, x) => s + (x.vote_count || 0), 0);
      const avgRating = srvs && srvs.length ? srvs.reduce((s, x) => s + (x.rating_avg || 0), 0) / srvs.length : 0;
      let votes24h = 0;
      if (ids.length) {
        const since = new Date(Date.now() - 86_400_000).toISOString();
        const { count } = await supabase.from("votes").select("*", { count: "exact", head: true }).in("server_id", ids).gte("voted_at", since);
        votes24h = count ?? 0;
      }
      setStats({ servers: srvs?.length ?? 0, totalVotes, avgRating, votes24h });
    })();
  }, [user]);

  const tiles = [
    { label: "Your Servers", value: stats.servers, icon: Server },
    { label: "Total Votes", value: stats.totalVotes.toLocaleString(), icon: Zap, accent: true },
    { label: "Avg Rating", value: stats.avgRating.toFixed(1), icon: Star },
    { label: "Votes (24h)", value: stats.votes24h, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Server owner control center.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="glass rounded-2xl p-4">
            <div className={`grid h-9 w-9 place-items-center rounded-lg ${t.accent ? "bg-gradient-crimson" : "bg-white/5 border border-white/10"} mb-3`}>
              <t.icon className="h-4 w-4 text-white" />
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t.label}</div>
            <div className="font-mono-num font-bold text-2xl mt-0.5">{t.value}</div>
          </div>
        ))}
      </div>
      <div className="glass rounded-2xl p-6">
        <h3 className="font-display text-lg font-bold mb-2">Welcome to your dashboard</h3>
        <p className="text-muted-foreground text-sm">Add a server to start collecting votes. Each server gets its own analytics and an API key for verifying voters.</p>
      </div>
    </div>
  );
};

export default DashboardOverview;
