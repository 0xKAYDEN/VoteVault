import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { Link } from "react-router-dom";

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

const EditServer = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [initialCategories, setInitialCategories] = useState<number[]>([]);
  const [form, setForm] = useState({
    name: "", short_description: "", long_description: "",
    version: "", rate: "", region: "", website_url: "", discord_url: "",
    banner_url: "", logo_url: "",
    features: "", events_time: "", upcoming_updates: "",
  });

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      try {
        const [serverData, allCategories, serverCategories] = await Promise.all([
          api.servers.getById(Number(id)),
          api.categories.getAll(),
          api.categories.getServerCategories(Number(id))
        ]);

        if (serverData.owner_id !== user.id) {
          toast.error("You do not own this server");
          navigate("/dashboard/servers");
          return;
        }

        setForm({
          name: serverData.name || "",
          short_description: serverData.short_description || "",
          long_description: serverData.long_description || "",
          version: serverData.version || "",
          rate: serverData.rate || "",
          region: serverData.region || "",
          website_url: serverData.website_url || "",
          discord_url: serverData.discord_url || "",
          banner_url: serverData.banner_url || "",
          logo_url: serverData.logo_url || "",
          features: serverData.features || "",
          events_time: serverData.events_time || "",
          upcoming_updates: serverData.upcoming_updates || "",
        });

        setCategories(allCategories);
        const categoryIds = serverCategories.map((c: any) => c.id);
        setSelectedCategories(categoryIds);
        setInitialCategories(categoryIds);
        setLoading(false);
      } catch (err: any) {
        toast.error(err.message || "Server not found");
        navigate("/dashboard/servers");
      }
    })();
  }, [user, id, navigate]);

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const set = (k: keyof typeof form) => (e: any) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    if (!user || !id) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) { 
      toast.error(parsed.error.issues[0].message); 
      return; 
    }
    
    setBusy(true);
      const update = {
        name: form.name.trim(),
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
        updated_at: new Date().toISOString(),
      };

    try {
      await api.servers.update(Number(id), update);

      // Update categories
      const toAdd = selectedCategories.filter(c => !initialCategories.includes(c));
      const toRemove = initialCategories.filter(c => !selectedCategories.includes(c));

      await Promise.all([
        ...toAdd.map(categoryId => api.categories.addToServer(Number(id), categoryId)),
        ...toRemove.map(categoryId => api.categories.removeFromServer(Number(id), categoryId))
      ]);

      toast.success("Server profile updated!");
      navigate("/dashboard/servers");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/dashboard/servers"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Link>
        </Button>
        <div>
          <h1 className="font-display text-3xl font-bold">Edit Server</h1>
          <p className="text-muted-foreground text-sm">Update your server profile information.</p>
        </div>
      </div>

      <div className="glass-strong rounded-2xl p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Server Name *" v={form.name} onChange={set("name")} />
          <Field label="Logo URL" v={form.logo_url} onChange={set("logo_url")} placeholder="https://...logo.png" />
        </div>
        
        <Field label="Short description *" v={form.short_description} onChange={set("short_description")} />
        
        <div>
          <Label>Long description</Label>
          <Textarea 
            value={form.long_description} 
            onChange={set("long_description")} 
            rows={6} 
            className="bg-white/5 border-white/10" 
            placeholder="Detailed description of your server, features, etc."
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Version" v={form.version} onChange={set("version")} placeholder="5165" />
          <Field label="Rate" v={form.rate} onChange={set("rate")} placeholder="High" />
          <Field label="Region" v={form.region} onChange={set("region")} placeholder="EU" />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Website URL" v={form.website_url} onChange={set("website_url")} placeholder="https://" />
          <Field label="Discord URL" v={form.discord_url} onChange={set("discord_url")} placeholder="https://discord.gg/..." />
        </div>

        <Field label="Banner URL" v={form.banner_url} onChange={set("banner_url")} placeholder="https://...banner.jpg" />

        <div className="space-y-4 pt-4 border-t border-white/5">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`cat-${cat.id}`}
                  checked={selectedCategories.includes(cat.id)}
                  onCheckedChange={() => toggleCategory(cat.id)}
                />
                <label
                  htmlFor={`cat-${cat.id}`}
                  className="text-sm cursor-pointer select-none"
                >
                  {cat.name}
                </label>
              </div>
            ))}
          </div>
        </div>

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

        <div className="pt-2">
          <Button variant="hero" onClick={submit} disabled={busy} className="w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

function Field({ label, v, onChange, placeholder }: { label: string; v: string; onChange: any; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <Input value={v} onChange={onChange} placeholder={placeholder} className="bg-white/5 border-white/10" />
    </div>
  );
}

export default EditServer;
