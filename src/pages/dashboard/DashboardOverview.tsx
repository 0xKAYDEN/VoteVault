import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { 
  Zap, Server, Star, Users, ArrowUpRight, 
  MessageCircle, TrendingUp, Calendar, AlertCircle, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const DashboardOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({
    servers: 0,
    totalVotes: 0,
    totalVisits: 0,
    avgRating: 0,
    votes24h: 0,
    recentReviews: []
  });
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const data = await api.servers.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error("Error loading dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadStats();
  }, [user]);

  const tiles = [
    { label: "Your Servers", value: stats.servers, icon: Server },
    { label: "Total Votes", value: Number(stats.totalVotes).toLocaleString(), icon: Zap, accent: true },
    { label: "Total Visits", value: Number(stats.totalVisits).toLocaleString(), icon: Eye },
    { label: "Avg Rating", value: Number(stats.avgRating).toFixed(1), icon: Star },
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
        <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Recent Reviews
        </h3>
        <div className="space-y-4">
          {stats.recentReviews.length > 0 ? (
            stats.recentReviews.map((r: any) => (
              <div key={r.id} className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-bold text-sm">{r.display_name || r.username || "Anonymous"}</span>
                    <span className="text-muted-foreground text-xs ml-2">on {r.server_name}</span>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`h-3 w-3 ${r.rating >= s ? "text-[hsl(45_95%_60%)] fill-current" : "text-white/10"}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground italic mb-3">"{r.comment}"</p>
                {r.owner_response ? (
                  <div className="text-xs text-primary bg-primary/10 rounded-lg p-2 border border-primary/20">
                    <span className="font-bold uppercase tracking-tighter mr-2">Your Reply:</span>
                    {r.owner_response}
                  </div>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-[10px]"
                    onClick={() => {
                      const reply = prompt("Enter your reply:");
                      if (reply) {
                        api.reviews.reply(r.id, reply)
                          .then(() => {
                            toast.success("Reply submitted");
                            loadStats();
                          })
                          .catch(err => toast.error(err.message));
                      }
                    }}
                  >
                    Reply
                  </Button>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic">No reviews yet.</p>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="font-display text-lg font-bold mb-2">Welcome to your dashboard</h3>
        <p className="text-muted-foreground text-sm">Add a server to start collecting votes. Each server gets its own analytics and an API key for verifying voters.</p>
      </div>
    </div>
  );
};

export default DashboardOverview;
