import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
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
});

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

const NewServer = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "", short_description: "", long_description: "",
    version: "", rate: "", region: "", website_url: "", discord_url: "", banner_url: "",
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
      owner_id: user.id,
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
    };
    const { data, error } = await supabase.from("servers").insert(insert).select().single();
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Server submitted!");
    navigate(`/server/${data.slug}`);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Add Server</h1>
        <p className="text-muted-foreground text-sm">List your Conquer Online private server.</p>
      </div>
      <div className="glass-strong rounded-2xl p-6 space-y-4">
        <Field label="Name *" v={form.name} onChange={set("name")} />
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
