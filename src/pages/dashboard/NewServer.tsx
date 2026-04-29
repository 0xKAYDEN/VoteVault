import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";

const RECAPTCHA_V2_SITE_KEY = import.meta.env.VITE_RECAPTCHA_V2_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

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

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

const NewServer = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [form, setForm] = useState({
    name: "", short_description: "", long_description: "",
    version: "", rate: "", region: "",
    website_url: "", discord_url: "", banner_url: "", logo_url: "",
    features: "", events_time: "", upcoming_updates: "",
    youtube_url: "", facebook_url: "", twitter_url: "", twitch_url: "",
  });
  const set = (k: keyof typeof form) => (e: any) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    api.categories.getAll()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const toggleCategory = (id: number) =>
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const submit = async () => {
    if (!user) return;

    if (!recaptchaToken) {
      toast.error("Please complete the reCAPTCHA verification");
      return;
    }

    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }

    setBusy(true);
    try {
      const baseSlug = slugify(form.name);
      const uniqueSuffix = Math.random().toString(36).slice(2, 8);
      const slug = `${baseSlug}-${uniqueSuffix}`;

      const data = await api.servers.create({
        ...Object.fromEntries(
          Object.entries(form).map(([k, v]) => [k, v.trim() || null])
        ),
        name: form.name.trim(),
        slug,
        recaptchaToken,
      } as any);

      if (selectedCategories.length > 0) {
        await Promise.all(selectedCategories.map(cid => api.categories.addToServer(data.id, cid)));
      }

      toast.success("Server submitted! It will be visible once approved by an admin.");
      navigate("/dashboard/servers");
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit server");
      // Reset reCAPTCHA so user can try again
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
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
        {/* Basic Info */}
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

        {/* Social Media */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Social Media</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="YouTube URL"   v={form.youtube_url}  onChange={set("youtube_url")}  placeholder="https://youtube.com/@channel" />
            <Field label="Facebook URL"  v={form.facebook_url} onChange={set("facebook_url")} placeholder="https://facebook.com/page" />
            <Field label="Twitter / X"   v={form.twitter_url}  onChange={set("twitter_url")}  placeholder="https://twitter.com/handle" />
            <Field label="Twitch URL"    v={form.twitch_url}   onChange={set("twitch_url")}   placeholder="https://twitch.tv/channel" />
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
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
                  <label htmlFor={`cat-${cat.id}`} className="text-sm cursor-pointer select-none">
                    {cat.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Details */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Additional Details</h3>
          <div>
            <Label>Server Features</Label>
            <Textarea value={form.features} onChange={set("features")} rows={3} className="bg-white/5 border-white/10"
              placeholder="List key features (e.g., Level cap, Starting gear, Custom quests)" />
          </div>
          <div>
            <Label>Event's Time</Label>
            <Textarea value={form.events_time} onChange={set("events_time")} rows={3} className="bg-white/5 border-white/10"
              placeholder="Weekly event schedule or specific event times" />
          </div>
          <div>
            <Label>Upcoming Updates</Label>
            <Textarea value={form.upcoming_updates} onChange={set("upcoming_updates")} rows={3} className="bg-white/5 border-white/10"
              placeholder="What's coming next to your server?" />
          </div>
        </div>

        {/* reCAPTCHA v2 */}
        <div className="pt-2 flex justify-center">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={RECAPTCHA_V2_SITE_KEY}
            onChange={(token) => setRecaptchaToken(token)}
            onExpired={() => setRecaptchaToken(null)}
            theme="dark"
          />
        </div>

        <Button variant="hero" onClick={submit} disabled={busy || !recaptchaToken} className="w-full">
          {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {busy ? "Submitting..." : "Submit Server"}
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
