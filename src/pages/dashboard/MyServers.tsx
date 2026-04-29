import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye, Power, Clock, AlertCircle, KeyRound, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

const SERVER_LIMITS: Record<string, number> = { free: 2, starter: 5, pro: 15, enterprise: 999 };

const MyServers = () => {
  const { user } = useAuth();
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);

  const load = async () => {
    if (!user) return;
    try {
      const [data, subData] = await Promise.all([
        api.servers.getMyServers(),
        api.payments.getSubscription(),
      ]);
      setServers(data || []);
      setSubscription(subData.subscription);
    } catch (err) {
      console.error("Error loading my servers:", err);
      toast.error("Failed to load servers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  const currentPlan = subscription?.plan?.includes('enterprise') ? 'enterprise'
    : subscription?.plan?.includes('pro') ? 'pro'
    : subscription?.plan?.includes('starter') ? 'starter'
    : 'free';
  const limit = SERVER_LIMITS[currentPlan] ?? 2;
  const isAtLimit = servers.length >= limit;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const toggleOnline = async (id: number, current: boolean) => {
    try {
      await api.servers.update(id, { is_online: !current });
      toast.success(`Server marked ${!current ? "online" : "offline"}`);
      load();
    } catch (err: any) { toast.error(err.message); }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this server permanently?")) return;
    try {
      await api.servers.delete(id);
      toast.success("Server deleted");
      load();
    } catch (err: any) { toast.error(err.message); }
  };

  const dailyLimit = currentPlan === 'enterprise' ? 'Unlimited'
    : currentPlan === 'pro' ? '50,000'
    : currentPlan === 'starter' ? '5,000'
    : '500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">My Servers</h1>
          <p className="text-muted-foreground text-sm">Manage your server listings.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Server Limit</div>
            <div className="text-sm font-bold flex items-center justify-end gap-1.5">
              <span className={isAtLimit ? "text-red-400" : "text-primary-glow"}>{servers.length}</span>
              <span className="text-muted-foreground/40">/</span>
              <span>{limit === 999 ? "∞" : limit}</span>
            </div>
          </div>
          <Button variant="hero" asChild disabled={isAtLimit}>
            <Link to={isAtLimit ? "#" : "/dashboard/servers/new"} className={isAtLimit ? "pointer-events-none opacity-50" : ""}>
              <Plus className="h-4 w-4 mr-1" />New Server
            </Link>
          </Button>
        </div>
      </div>

      {/* Pending notice */}
      {!loading && servers.some(s => s.status === 'pending') && (
        <div className="glass rounded-xl p-4 border border-yellow-500/30 flex items-start gap-3">
          <Clock className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-400">Awaiting Admin Approval</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Servers marked "pending" are under review and won't appear publicly until approved.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="glass rounded-2xl h-32 shimmer" />
      ) : servers.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-muted-foreground mb-4">You don't own any servers yet.</p>
          <Button variant="hero" asChild>
            <Link to="/dashboard/servers/new"><Plus className="h-4 w-4 mr-1" />Add Your First Server</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {servers.map((s) => (
            <div key={s.id} className="glass rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-display text-lg font-bold truncate">{s.name}</h3>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${s.is_online ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-muted-foreground"}`}>
                    {s.is_online ? "online" : "offline"}
                  </span>
                  {s.status === 'pending' ? (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />pending
                    </span>
                  ) : s.status === 'rejected' ? (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/20 text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />rejected
                    </span>
                  ) : s.status === 'approved' ? (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-primary/20 text-primary-glow">live</span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-muted-foreground">{s.status}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">{s.short_description}</p>
                <div className="text-xs text-muted-foreground mt-1 font-mono-num">
                  {s.vote_count} votes · {Number(s.rating_avg ?? 0).toFixed(1)} ★
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {s.status === 'approved' && (
                  <Button size="sm" variant="outline" asChild title="View"><Link to={`/server/${s.slug}`}><Eye className="h-4 w-4" /></Link></Button>
                )}
                <Button size="sm" variant="outline" asChild title="Edit"><Link to={`/dashboard/servers/edit/${s.id}`}><Edit className="h-4 w-4" /></Link></Button>
                {s.status === 'approved' && (
                  <Button size="sm" variant="outline" onClick={() => toggleOnline(s.id, s.is_online)} title={s.is_online ? "Set Offline" : "Set Online"}>
                    <Power className="h-4 w-4" />
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => remove(s.id)} title="Delete" className="hover:border-destructive/50 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
                {/* API Info dialog */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" title="API Info" onClick={() => setSelectedServer(s)}>
                      <KeyRound className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-strong border-white/10">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-primary" />
                        API Access — {selectedServer?.name}
                      </DialogTitle>
                      <DialogDescription>Use your Public ID with your API key to integrate.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Server Public ID</label>
                        <div className="flex gap-2">
                          <code className="flex-1 bg-black/40 rounded p-2 text-sm font-mono break-all border border-white/5">
                            {selectedServer?.public_id}
                          </code>
                          <Button size="sm" variant="outline" onClick={() => copyToClipboard(selectedServer?.public_id)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs space-y-1">
                        <p className="font-semibold text-primary-glow">Your plan: {currentPlan.toUpperCase()}</p>
                        <p className="text-muted-foreground">Rate limit: <span className="text-foreground font-medium">{dailyLimit} requests/day</span></p>
                        <p className="text-muted-foreground mt-1">
                          Go to <Link to="/dashboard/api-keys" className="text-primary underline">API Keys</Link> to generate your key, then use it with the Public API.
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyServers;
