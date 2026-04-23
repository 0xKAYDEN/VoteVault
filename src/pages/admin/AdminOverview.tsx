import { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { api } from "@/lib/api";
import { 
  Users, Server, Zap, MessageCircle, AlertCircle, 
  TrendingUp, ShieldCheck, UserPlus, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";

const AdminOverview = () => {
  const [stats, setStats] = useState<any>({
    users: 0,
    servers: 0,
    votes: 0,
    reviews: 0,
    pendingServers: 0,
    totalVisits: 0,
    history: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.admin.getStats();
        setStats(data);
      } catch (err) {
        console.error("Error loading admin stats:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const tiles = [
    { label: "Total Users", value: stats.users, icon: Users },
    { label: "Total Servers", value: stats.servers, icon: Server, accent: true },
    { label: "Total Votes", value: stats.votes.toLocaleString(), icon: Zap },
    { label: "Total Visits", value: stats.totalVisits.toLocaleString(), icon: Eye, variant: "emerald" },
  ];

  const chartConfig = {
    visits: {
      label: "Visits",
      color: "hsl(var(--primary))",
    },
    votes: {
      label: "Votes",
      color: "hsl(var(--primary-glow))",
    }
  } satisfies ChartConfig;

  const formattedHistory = useMemo(() => {
    return (stats.history || []).map((h: any) => ({
      date: new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      visits: h.visits,
      votes: h.votes
    }));
  }, [stats.history]);

  if (loading) return <div className="space-y-6"><div className="glass rounded-2xl h-64 shimmer" /></div>;

  return (
    <div className="space-y-8">
      {/* Pending Actions */}
      {stats.pendingServers > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20 text-primary">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Action Required</h3>
              <p className="text-muted-foreground">There are {stats.pendingServers} servers waiting for approval.</p>
            </div>
          </div>
          <Button asChild>
            <Link to="/admin/servers">Review Servers</Link>
          </Button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t) => (
          <Card key={t.label} className="glass-strong border-white/5 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">{t.label}</p>
                  <p className={`text-3xl font-bold font-mono-num ${t.accent ? "text-primary-glow" : t.variant === "emerald" ? "text-emerald-400" : ""}`}>
                    {t.value}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${t.accent ? "bg-primary/20 text-primary" : t.variant === "emerald" ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-muted-foreground"}`}>
                  <t.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="glass-strong border-white/5 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Website Traffic
            </CardTitle>
            <CardDescription>Daily visits and engagement over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[300px] w-full">
              {formattedHistory.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <AreaChart data={formattedHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      minTickGap={30}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area 
                      type="monotone" 
                      dataKey="visits" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorVisits)" 
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground italic">
                  Not enough data to display traffic chart yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass border-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" /> Admin Tasks
            </CardTitle>
            <CardDescription>Common administrative operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/admin/servers"><Server className="h-4 w-4 mr-2" /> Verify & Approve Servers</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/admin/users"><Users className="h-4 w-4 mr-2" /> Manage User Roles</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/"><Eye className="h-4 w-4 mr-2" /> View Live Site</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Daily Engagement
            </CardTitle>
            <CardDescription>Daily votes distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
               <ChartContainer config={chartConfig} className="h-full w-full">
                  <BarChart data={formattedHistory}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      minTickGap={30}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="votes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
               </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
