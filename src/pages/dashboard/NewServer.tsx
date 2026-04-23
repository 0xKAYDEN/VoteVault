import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const schema = z.object({
  name: z.string().trim().min(2).max(60),
  short_description: z.string().trim().min(10).max(160),
  long_description: z.string().trim().max(2000).optional().or(z.literal("")),
  version: z.string().trim().max(20).optional().or(z.literal("")),
  rate: z.string().trim().max(20).optional().or(z.literal("")),
  region: z.string().trim().max(20).optional().or(z.literal("")),
  website_url: z.string().trim().url().max(255).optional().or(z.literal("")),
  discord_url: z.string().trim().url().max(255).optional().or(z.literal("")),
  banner_url: z.string().trim().url().max(500).optional().or(z.literal("")),
  logo_url: z.string().trim().url().max(500).optional().or(z.literal("")),
  features: z.string().trim().max(1000).optional().or(z.literal("")),
  events_time: z.string().trim().max(1000).optional().or(z.literal("")),
  upcoming_updates: z.string().trim().max(1000).optional().or(z.literal("")),
});

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

const NewServer = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "", short_description: "", long_description: "",
    version: "", rate: "", region: "", website_url: "", discord_url: "", banner_url: "", logo_url: "",
    features: "", events_time: "", upcoming_updates: "",
  });
  const set = (k: keyof typeof form) => (e: any) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    if (!user) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const baseSlug = slugify(form.name);
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;
    const insert = {
      name: form.name.trim(),
      slug,
      short_description: form.short_description.trim(),
      long_description: form.long_description?.trim() || null,
      version: form.version?.trim() || null,
      rate: form.rate?.trim() || null,
      region: form.region?.trim() || null,
      website_url: form.website_url?.trim() || null,
      discord_url: form.discord_url?.trim() || null,
      banner_url: form.banner_url?.trim() || null,
      logo_url: form.logo_url?.trim() || null,
      features: form.features?.trim() || null,
      events_time: form.events_time?.trim() || null,
      upcoming_updates: form.upcoming_updates?.trim() || null,
    };
    try {
      const data = await api.servers.create(insert);
      toast.success("Server submitted!");
      navigate(`/server/${data.slug}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Add Server</h1>
        <p className="text-muted-foreground text-sm">List your Conquer Online private server.</p>
      </div>
      <div className="glass-strong rounded-2xl p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Name *" v={form.name} onChange={set("name")} />
          <Field label="Logo URL" v={form.logo_url} onChange={set("logo_url")} placeholder="https://...logo.png" />
        </div>
        <Field label="Short description *" v={form.short_description} onChange={set("short_description")} />
        <div>
          <Label>Long description</Label>
          <Textarea value={form.long_description} onChange={set("long_description")} rows={4} className="bg-white/5 border-white/10" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Version" v={form.version} onChange={set("version")} placeholder="5165" />
          <Field label="Rate" v={form.rate} onChange={set("rate")} placeholder="High" />
          <Field label="Region" v={form.region} onChange={set("region")} placeholder="EU" />
        </div>
        <Field label="Website URL" v={form.website_url} onChange={set("website_url")} placeholder="https://" />
        <Field label="Discord URL" v={form.discord_url} onChange={set("discord_url")} placeholder="https://discord.gg/..." />
        <Field label="Banner URL" v={form.banner_url} onChange={set("banner_url")} placeholder="https://...image.jpg" />
        
        <div className="space-y-4 pt-4 border-t border-white/5">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Additional Details</h3>
          <div>
            <Label>Server Features</Label>
            <Textarea 
              value={form.features} 
              onChange={set("features")} 
              rows={3} 
              className="bg-white/5 border-white/10" 
              placeholder="List key features (e.g., Level cap, Starting gear, Custom quests)"
            />
          </div>
          <div>
            <Label>Event's Time</Label>
            <Textarea 
              value={form.events_time} 
              onChange={set("events_time")} 
              rows={3} 
              className="bg-white/5 border-white/10" 
              placeholder="Weekly event schedule or specific event times"
            />
          </div>
          <div>
            <Label>Upcoming Updates</Label>
            <Textarea 
              value={form.upcoming_updates} 
              onChange={set("upcoming_updates")} 
              rows={3} 
              className="bg-white/5 border-white/10" 
              placeholder="What's coming next to your server?"
            />
          </div>
        </div>

        <Button variant="hero" onClick={submit} disabled={busy} className="w-full">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Server"}
        </Button>
      </div>
    </div>
  );
};

function Field({ label, v, onChange, placeholder }: { label: string; v: string; onChange: any; placeholder?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={v} onChange={onChange} placeholder={placeholder} className="bg-white/5 border-white/10" />
    </div>
  );
}

export default NewServer;
