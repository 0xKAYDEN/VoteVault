import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { 
  Server, Check, X, Ban, ExternalLink, 
  Search, Filter, MoreVertical, Edit, Trash2,
  ShieldCheck, ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const AdminServers = () => {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const load = async () => {
    try {
      const data = await api.admin.getServers();
      // backend returns { servers: [], total, page } or a plain array (fallback)
      const list = Array.isArray(data) ? data : (data as any)?.servers ?? [];
      setServers(list);
    } catch (err) {
      console.error("Error loading servers:", err);
      setServers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await api.admin.updateServerStatus(id, status);
      toast.success(`Server marked as ${status}`);
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleVerifyToggle = async (id: number, current: boolean) => {
    try {
      await api.admin.verifyServer(id, !current);
      toast.success(`Server ${!current ? 'verified' : 'unverified'}`);
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filtered = (servers || []).filter(s => {
    if (!s) return false;
    const name = s.name || "";
    const owner = s.owner_username || s.owner_display_name || "";
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || 
                          owner.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || s.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <div className="glass rounded-2xl h-64 shimmer" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search servers or owners..." 
            className="pl-10 bg-white/5 border-white/10" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {["all", "pending", "approved", "rejected", "banned"].map(f => (
            <Button 
              key={f} 
              variant={filter === f ? "hero" : "outline"} 
              size="sm" 
              onClick={() => setFilter(f)}
              className="capitalize whitespace-nowrap"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-widest text-muted-foreground">
                <th className="px-6 py-4 font-bold">Server</th>
                <th className="px-6 py-4 font-bold">Owner</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold text-center">Votes</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                        {s.logo_url ? <img src={s.logo_url} className="w-full h-full object-cover" alt="" /> : <Server className="h-5 w-5 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <div className="font-bold truncate">{s.name || "Unnamed"}</div>
                          {s.is_verified ? <ShieldCheck className="h-3.5 w-3.5 text-primary-glow" /> : null}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">v{s.version || "?"} • {s.region || "?"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium">{s.owner_display_name || s.owner_username || "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">ID: {s.owner_id?.slice(0, 8)}...</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "capitalize",
                        s.status === "approved" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" :
                        s.status === "pending" ? "border-amber-500/30 text-amber-400 bg-amber-500/5" :
                        s.status === "rejected" ? "border-rose-500/30 text-rose-400 bg-rose-500/5" :
                        "border-white/10 text-muted-foreground"
                      )}
                    >
                      {s.status || "Unknown"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-center font-mono-num text-sm font-bold">
                    {(s.vote_count || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {s.status === "pending" && (
                        <>
                          <Button size="icon" variant="outline" className="h-8 w-8 text-emerald-400 hover:text-emerald-300" onClick={() => handleStatusUpdate(s.id, "approved")} title="Approve">
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="outline" className="h-8 w-8 text-rose-400 hover:text-rose-300" onClick={() => handleStatusUpdate(s.id, "rejected")} title="Reject">
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {s.status === "approved" && (
                        <Button size="icon" variant="outline" className="h-8 w-8 text-rose-400 hover:text-rose-300" onClick={() => handleStatusUpdate(s.id, "banned")} title="Ban Server">
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                      {s.status === "banned" && (
                        <Button size="icon" variant="outline" className="h-8 w-8 text-emerald-400 hover:text-emerald-300" onClick={() => handleStatusUpdate(s.id, "approved")} title="Unban Server">
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        size="icon" 
                        variant="outline" 
                        className={cn("h-8 w-8", s.is_verified ? "text-primary" : "text-muted-foreground")}
                        onClick={() => handleVerifyToggle(s.id, !!s.is_verified)}
                        title={s.is_verified ? "Unverify Server" : "Verify Server"}
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="outline" className="h-8 w-8" asChild>
                        <Link to={`/server/${s.slug}`} target="_blank"><ExternalLink className="h-4 w-4" /></Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">
            No servers found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminServers;
