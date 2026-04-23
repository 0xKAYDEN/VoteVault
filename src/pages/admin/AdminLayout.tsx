import { useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Server, Users, ShieldAlert, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const adminItems = [
  { to: "/admin", end: true, label: "Admin Overview", icon: LayoutDashboard },
  { to: "/admin/servers", label: "Manage Servers", icon: Server },
  { to: "/admin/users", label: "Manage Users", icon: Users },
];

const AdminLayout = () => {
  const { user, profile, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { document.title = "Admin Panel — Conquer Top 100"; }, []);
  
  useEffect(() => { 
    if (!loading) {
      if (!user) navigate("/auth");
      else if (!isAdmin) navigate("/dashboard");
    }
  }, [loading, user, isAdmin, navigate]);

  if (loading || !user || !isAdmin) return <div className="container py-20"><div className="glass rounded-2xl h-64 shimmer" /></div>;

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-primary" /> Admin Control Panel
          </h1>
          <p className="text-muted-foreground mt-2">Manage servers, users, and global site statistics.</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard</Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-[240px_1fr] gap-6">
        <aside className="glass rounded-2xl p-3 h-max sticky top-24">
          <nav className="space-y-1">
            {adminItems.map((it) => (
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
        </aside>
        <main><Outlet /></main>
      </div>
    </div>
  );
};

export default AdminLayout;
