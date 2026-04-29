import { useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Server, KeyRound, BookOpen, Plus, BarChart3, Crown, Settings, MessageSquare, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePremium } from "@/hooks/usePremium";

const DashboardLayout = () => {
  const { user, loading } = useAuth();
  const { isPremium } = usePremium();
  const navigate = useNavigate();
  useEffect(() => { document.title = "Dashboard — VoteVault"; }, []);
  useEffect(() => { if (!loading && !user) navigate("/auth"); }, [loading, user, navigate]);

  const items = [
    { to: "/dashboard", end: true, label: "Overview", icon: LayoutDashboard },
    { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/dashboard/servers", label: "My Servers", icon: Server },
    { to: "/dashboard/reviews", label: "My Reviews", icon: Star },
    { to: "/dashboard/threads", label: "My Threads", icon: MessageSquare },
    { to: "/dashboard/api-keys", label: "API Keys", icon: KeyRound },
    { to: "/api-docs", label: "API Docs", icon: BookOpen },
    { to: "/dashboard/settings", label: "Settings", icon: Settings },
    {
      to: "/dashboard/premium",
      label: isPremium ? "Premium ✦" : "Upgrade",
      icon: Crown,
      highlight: !isPremium,
    },
  ];

  if (loading || !user) return <div className="container py-20"><div className="glass rounded-2xl h-64 shimmer" /></div>;

  return (
    <div className="container py-8">
      <div className="grid md:grid-cols-[240px_1fr] gap-6">
        <aside className="glass rounded-2xl p-3 h-max sticky top-24">
          <nav className="space-y-1">
            {items.map((it) => (
              <NavLink key={it.to} to={it.to} end={(it as any).end}
                className={({ isActive }) => cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition",
                  isActive
                    ? "bg-primary/15 text-primary-glow border border-primary/30"
                    : (it as any).highlight
                      ? "hover:bg-yellow-500/10 text-yellow-400 hover:text-yellow-300"
                      : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
                )}>
                <it.icon className="h-4 w-4" />
                {it.label}
              </NavLink>
            ))}
          </nav>
          <Button variant="hero" size="sm" className="w-full mt-3" asChild>
            <Link to="/dashboard/servers/new"><Plus className="h-4 w-4" /> Add Server</Link>
          </Button>
        </aside>
        <main><Outlet /></main>
      </div>
    </div>
  );
};

export default DashboardLayout;
