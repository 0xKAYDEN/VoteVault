import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  Plus, Edit, Trash2, Eye, Power, 
  ExternalLink, Zap, Star, Users, Shield, Clock, AlertCircle 
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const MyServers = () => {
  const { user } = useAuth();
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    try {
      const data = await api.servers.getMyServers();
      setServers(data || []);
    } catch (err) {
      console.error("Error loading my servers:", err);
      toast.error("Failed to load servers");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [user]);

  const toggleOnline = async (id: number, current: boolean) => {
    try {
      await api.servers.update(id, { is_online: !current });
      toast.success(`Server marked ${!current ? "online" : "offline"}`);
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this server permanently?")) return;
    try {
      await api.servers.delete(id);
      toast.success("Server deleted");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">My Servers</h1>
          <p className="text-muted-foreground text-sm">Manage your server listings.</p>
        </div>
        <Button variant="hero" asChild><Link to="/dashboard/servers/new"><Plus className="h-4 w-4" />New Server</Link></Button>
      </div>

      {loading ? (
        <div className="glass rounded-2xl h-32 shimmer" />
      ) : servers.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-muted-foreground mb-4">You don't own any servers yet.</p>
          <Button variant="hero" asChild><Link to="/dashboard/servers/new"><Plus className="h-4 w-4" />Add Your First Server</Link></Button>
        </div>
      ) : (
        <div className="space-y-3">
          {servers.map((s) => (
            <div key={s.id} className="glass rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display text-lg font-bold truncate">{s.name}</h3>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${s.is_online ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-muted-foreground"}`}>
                    {s.is_online ? "online" : "offline"}
                  </span>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${s.status === "approved" ? "bg-primary/20 text-primary-glow" : "bg-yellow-500/20 text-yellow-400"}`}>
                    {s.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{s.short_description}</p>
                <div className="text-xs text-muted-foreground mt-1 font-mono-num">
                  {s.vote_count} votes · {s.rating_avg} ★
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" asChild title="View Profile"><Link to={`/server/${s.slug}`}><Eye className="h-4 w-4" /></Link></Button>
                <Button size="sm" variant="outline" asChild title="Edit Profile"><Link to={`/dashboard/servers/edit/${s.id}`}><Edit className="h-4 w-4" /></Link></Button>
                <Button size="sm" variant="outline" onClick={() => toggleOnline(s.id, s.is_online)} title={s.is_online ? "Set Offline" : "Set Online"}><Power className="h-4 w-4" /></Button>
                <Button size="sm" variant="outline" onClick={() => remove(s.id)} title="Delete Server" className="hover:border-destructive/50 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyServers;
