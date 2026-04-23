import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Server, KeyRound, BookOpen, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const items = [
  { to: "/dashboard", end: true, label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/servers", label: "My Servers", icon: Server },
  { to: "/dashboard/api-keys", label: "API Keys", icon: KeyRound },
  { to: "/api-docs", label: "API Docs", icon: BookOpen },
];

const DashboardLayout = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { document.title = "Dashboard — Conquer Top 100"; }, []);
  useEffect(() => { if (!loading && !user) navigate("/auth"); }, [loading, user, navigate]);

  if (loading || !user) return <div className="container py-20"><div className="glass rounded-2xl h-64 shimmer" /></div>;

  return (
    <div className="container py-8">
      <div className="grid md:grid-cols-[240px_1fr] gap-6">
        <aside className="glass rounded-2xl p-3 h-max sticky top-24">
          <nav className="space-y-1">
            {items.map((it) => (
              <NavLink key={it.to} to={it.to} end={it.end as any}
                className={({ isActive }) => cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition",
                  isActive ? "bg-primary/15 text-primary-glow border border-primary/30" : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
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
