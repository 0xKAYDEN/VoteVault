import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { api } from "@/lib/api";
import { 
  Users, Server, Zap, MessageCircle, AlertCircle, 
  TrendingUp, ShieldCheck, UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const AdminOverview = () => {
  const [stats, setStats] = useState({
    users: 0,
    servers: 0,
    votes: 0,
    reviews: 0,
    pendingServers: 0,
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
    { label: "Total Reviews", value: stats.reviews, icon: MessageCircle },
  ];

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
                  <p className={`text-3xl font-bold font-mono-num ${t.accent ? "text-primary" : ""}`}>
                    {t.value}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${t.accent ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"}`}>
                  <t.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass border-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" /> Quick Actions
            </CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/admin/servers"><Server className="h-4 w-4 mr-2" /> Approve Pending Servers</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/admin/users"><Users className="h-4 w-4 mr-2" /> Manage User Roles</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Growth
            </CardTitle>
            <CardDescription>Community growth overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Servers Approval Rate</span>
                <span className="font-bold">94%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div className="bg-primary h-full" style={{ width: '94%' }} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active Users (7d)</span>
                <span className="font-bold">82%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-400 h-full" style={{ width: '82%' }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
