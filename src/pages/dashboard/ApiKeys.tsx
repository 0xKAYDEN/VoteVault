import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Copy, KeyRound, Zap, Clock, TrendingUp, AlertTriangle } from "lucide-react";

const PLAN_COLORS: Record<string, string> = {
  free:       "text-muted-foreground",
  starter:    "text-blue-400",
  pro:        "text-purple-400",
  enterprise: "text-amber-400",
};

const ApiKeys = () => {
  const { user } = useAuth();
  const [keys, setKeys]         = useState<any[]>([]);
  const [quota, setQuota]       = useState<any>(null);
  const [servers, setServers]   = useState<any[]>([]);
  const [serverId, setServerId] = useState<string>("");
  const [label, setLabel]       = useState("");
  const [reveal, setReveal]     = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);

  const load = async () => {
    if (!user) return;
    try {
      const [result, s] = await Promise.all([
        api.apiKeys.getAll(),
        api.servers.getMyServers(),
      ]);
      setKeys((result as any).keys || []);
      setQuota((result as any).quota || null);
      setServers(s || []);
    } catch (err) {
      console.error("Error loading keys:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  const create = async () => {
    if (!user) return;
    try {
      const response = await api.apiKeys.create({
        server_id: serverId ? Number(serverId) : undefined,
        label: label || undefined,
      });
      setReveal((response as any).key);
      setLabel("");
      setServerId("");
      toast.success("API key created — copy it now, it won't be shown again!");
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to create key");
    }
  };

  const revoke = async (id: number) => {
    if (!confirm("Revoke this key? It will stop working immediately.")) return;
    try {
      await api.apiKeys.revoke(id);
      toast.success("Key revoked");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  const plan          = quota?.plan || "free";
  const dailyLimit    = quota?.limits?.daily ?? 500;
  const dailyUsed     = quota?.dailyUsed ?? 0;
  const dailyRemaining = quota?.dailyRemaining ?? dailyLimit;
  const isUnlimited   = dailyLimit === null;
  const usedPct       = isUnlimited ? 0 : Math.min(100, (dailyUsed / dailyLimit) * 100);
  const isNearLimit   = !isUnlimited && usedPct >= 80;
  const resetAt       = quota?.resetAt ? new Date(quota.resetAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">API Keys</h1>
        <p className="text-muted-foreground text-sm">Generate keys to integrate with the VoteVault Public API. All your keys share one daily quota.</p>
      </div>

      {/* Quota card */}
      <div className={`glass rounded-2xl p-5 border ${isNearLimit ? "border-yellow-500/40" : "border-primary/20"}`}>
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Current Plan</div>
              <div className={`text-sm font-bold ${PLAN_COLORS[plan]}`}>{plan.toUpperCase()}</div>
            </div>
          </div>
          <div className="flex gap-6 flex-wrap">
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" />Daily Limit</div>
              <div className="text-sm font-bold">{isUnlimited ? "Unlimited" : dailyLimit.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" />Used Today</div>
              <div className={`text-sm font-bold ${isNearLimit ? "text-yellow-400" : ""}`}>{dailyUsed.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Remaining</div>
              <div className={`text-sm font-bold ${isNearLimit ? "text-yellow-400" : "text-green-400"}`}>
                {isUnlimited ? "∞" : dailyRemaining.toLocaleString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Per Minute</div>
              <div className="text-sm font-bold">{quota?.limits?.perMinute ?? 10}</div>
            </div>
          </div>
          {plan === "free" && (
            <Link to="/pricing">
              <Button size="sm" className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold text-xs">
                Upgrade for more
              </Button>
            </Link>
          )}
        </div>

        {/* Daily usage progress bar */}
        {!isUnlimited && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{dailyUsed.toLocaleString()} used</span>
              <span>Resets at {resetAt}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  usedPct >= 90 ? "bg-red-500" : usedPct >= 80 ? "bg-yellow-500" : "bg-primary"
                }`}
                style={{ width: `${usedPct}%` }}
              />
            </div>
            {isNearLimit && (
              <div className="flex items-center gap-1.5 text-xs text-yellow-400 mt-1">
                <AlertTriangle className="h-3 w-3" />
                {usedPct >= 100 ? "Daily limit reached — requests are being blocked." : `${Math.round(usedPct)}% of daily quota used.`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create key */}
      <div className="glass-strong rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-sm">Generate New Key</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Server (optional)</Label>
            <select
              value={serverId}
              onChange={e => setServerId(e.target.value)}
              className="w-full h-10 rounded-md bg-white/5 border border-white/10 px-3 text-sm mt-1"
            >
              <option value="">All servers</option>
              {servers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Label</Label>
            <Input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. production-bot"
              className="bg-white/5 border-white/10 mt-1"
              onKeyDown={e => e.key === 'Enter' && create()}
            />
          </div>
        </div>
        <Button variant="hero" onClick={create}>
          <Plus className="h-4 w-4 mr-2" />Generate Key
        </Button>

        {reveal && (
          <div className="glass rounded-xl p-4 border border-green-500/30 animate-fade-in">
            <p className="text-xs text-green-400 font-semibold mb-2">⚠️ Copy this key now — it will never be shown again!</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-black/40 rounded p-2 text-sm font-mono break-all border border-white/10">
                {reveal}
              </code>
              <Button size="sm" variant="outline" onClick={() => copy(reveal)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button size="sm" variant="ghost" className="mt-2 text-xs text-muted-foreground" onClick={() => setReveal(null)}>
              I've saved it, dismiss
            </Button>
          </div>
        )}
      </div>

      {/* Key list */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Your Keys</h3>
        {loading ? (
          <div className="space-y-2">{[...Array(2)].map((_, i) => <div key={i} className="glass rounded-xl h-14 shimmer" />)}</div>
        ) : keys.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-muted-foreground text-sm">No keys yet. Generate one above.</div>
        ) : keys.map(k => (
          <div key={k.id} className={`glass rounded-xl p-3 flex items-center gap-3 ${k.revoked ? "opacity-50" : ""}`}>
            <KeyRound className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{k.key_prefix}••••••••••••••••••••••</span>
                {k.revoked && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded">REVOKED</span>}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {k.label || "no label"} · created {new Date(k.created_at).toLocaleDateString()}
                {k.last_used_at && ` · last used ${new Date(k.last_used_at).toLocaleDateString()}`}
              </div>
              {!k.revoked && (
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-muted-foreground">
                    This key: <span className="text-foreground font-medium">{(k.requests_today || 0).toLocaleString()}</span> today
                    · <span className="text-foreground font-medium">{(k.total_requests || 0).toLocaleString()}</span> total
                  </span>
                </div>
              )}
            </div>
            {!k.revoked && (
              <Button size="sm" variant="outline" onClick={() => revoke(k.id)} className="hover:border-destructive/50 hover:text-destructive flex-shrink-0">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Quick reference */}
      <div className="glass rounded-2xl p-5 border border-white/5">
        <h3 className="font-semibold text-sm mb-3">Quick Reference</h3>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>Base URL: <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono">http://localhost:5000/api/v1</code></p>
          <p>Auth header: <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono">Authorization: Bearer vv_your_key</code></p>
          <p className="text-[11px]">All keys share your plan's daily quota. The limit resets at midnight UTC.</p>
          <div className="flex gap-2 mt-2">
            <Link to="/api-docs">
              <Button size="sm" variant="outline" className="text-xs">View Full API Docs</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeys;
