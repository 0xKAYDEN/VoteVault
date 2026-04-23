import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Copy, KeyRound } from "lucide-react";

// Simple SHA-256 hash via SubtleCrypto
async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
function genKey() {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return "ct_" + Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}

const ApiKeys = () => {
  const { user } = useAuth();
  const [keys, setKeys] = useState<any[]>([]);
  const [servers, setServers] = useState<any[]>([]);
  const [serverId, setServerId] = useState<string>("");
  const [label, setLabel] = useState("");
  const [reveal, setReveal] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const [k, s] = await Promise.all([
      supabase.from("api_keys").select("*").eq("owner_id", user.id).order("created_at", { ascending: false }),
      supabase.from("servers").select("id,name").eq("owner_id", user.id),
    ]);
    setKeys(k.data ?? []);
    setServers(s.data ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const create = async () => {
    if (!user) return;
    const key = genKey();
    const hash = await sha256(key);
    const { error } = await supabase.from("api_keys").insert({
      owner_id: user.id,
      server_id: serverId ? Number(serverId) : null,
      key_prefix: key.slice(0, 10),
      key_hash: hash,
      label: label || null,
    });
    if (error) return toast.error(error.message);
    setReveal(key);
    setLabel("");
    toast.success("API key created — copy it now, it won't be shown again");
    load();
  };

  const revoke = async (id: number) => {
    if (!confirm("Revoke this key?")) return;
    const { error } = await supabase.from("api_keys").update({ revoked: true }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Revoked");
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">API Keys</h1>
        <p className="text-muted-foreground text-sm">Generate keys to verify votes from your server.</p>
      </div>

      <div className="glass-strong rounded-2xl p-5 space-y-3">
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <Label>Server (optional)</Label>
            <select value={serverId} onChange={(e) => setServerId(e.target.value)} className="w-full h-10 rounded-md bg-white/5 border border-white/10 px-3 text-sm">
              <option value="">All servers</option>
              {servers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <Label>Label</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. production-bot" className="bg-white/5 border-white/10" />
          </div>
        </div>
        <Button variant="hero" onClick={create}><Plus className="h-4 w-4" />Generate Key</Button>

        {reveal && (
          <div className="glass rounded-lg p-3 flex items-center gap-2 animate-fade-in">
            <KeyRound className="h-4 w-4 text-primary shrink-0" />
            <code className="font-mono-num text-sm flex-1 truncate">{reveal}</code>
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(reveal); toast.success("Copied"); }}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {keys.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-muted-foreground text-sm">No keys yet.</div>
        ) : keys.map(k => (
          <div key={k.id} className="glass rounded-xl p-3 flex items-center gap-3">
            <KeyRound className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-mono-num text-sm">{k.key_prefix}…{k.revoked && <span className="ml-2 text-xs text-destructive">REVOKED</span>}</div>
              <div className="text-xs text-muted-foreground">{k.label || "no label"} · created {new Date(k.created_at).toLocaleDateString()}</div>
            </div>
            {!k.revoked && (
              <Button size="sm" variant="outline" onClick={() => revoke(k.id)} className="hover:border-destructive/50 hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApiKeys;
