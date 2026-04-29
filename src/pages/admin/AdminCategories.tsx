import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Check, X } from "lucide-react";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  display_order: number;
  is_active: boolean;
}

const ICON_OPTIONS = ["🎮","⚔️","🛡️","🏆","⭐","🔥","💎","🌍","👥","🎯","🚀","🏰","💬","📢","🆘","🎲","🔧","⚡","🌟","🎪"];

const AdminCategories = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);

  const emptyForm = { name: "", slug: "", description: "", icon: "🎮", display_order: 0 };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!isAdmin) { navigate("/"); return; }
    loadCategories();
  }, [isAdmin]);

  const loadCategories = async () => {
    try {
      const data = await api.categories.getAll();
      setCategories(data);
    } catch { toast.error("Failed to load categories"); }
    finally { setLoading(false); }
  };

  const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const handleCreate = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      await (api as any).adminCategories?.create(form) ??
        fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: JSON.stringify({ ...form, slug: form.slug || slugify(form.name) }),
        }).then(r => { if (!r.ok) throw new Error(); });
      toast.success("Category created");
      setShowNew(false);
      setForm(emptyForm);
      loadCategories();
    } catch { toast.error("Failed to create category"); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (cat: Category) => {
    setSaving(true);
    try {
      await fetch(`/api/admin/categories/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify(cat),
      }).then(r => { if (!r.ok) throw new Error(); });
      toast.success("Category updated");
      setEditingId(null);
      loadCategories();
    } catch { toast.error("Failed to update category"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this category? Servers will lose this tag.")) return;
    try {
      await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("Category deleted");
      loadCategories();
    } catch { toast.error("Failed to delete category"); }
  };

  if (loading) return <div className="glass rounded-xl h-64 shimmer" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground text-sm">Manage server listing categories</p>
        </div>
        <Button variant="hero" onClick={() => { setShowNew(true); setForm(emptyForm); }}>
          <Plus className="h-4 w-4 mr-2" /> New Category
        </Button>
      </div>

      {/* New category form */}
      {showNew && (
        <div className="glass rounded-xl p-5 border border-primary/30">
          <h3 className="font-semibold mb-4">New Category</h3>
          <CategoryForm form={form} setForm={setForm} slugify={slugify} />
          <div className="flex gap-2 mt-4">
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Create
            </Button>
            <Button variant="ghost" onClick={() => setShowNew(false)}><X className="h-4 w-4 mr-2" />Cancel</Button>
          </div>
        </div>
      )}

      {/* Category list */}
      <div className="space-y-2">
        {categories.map(cat => (
          <div key={cat.id} className="glass rounded-xl p-4">
            {editingId === cat.id ? (
              <div>
                <CategoryForm
                  form={cat as any}
                  setForm={(f: any) => setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, ...f } : c))}
                  slugify={slugify}
                />
                <div className="flex gap-2 mt-4">
                  <Button size="sm" onClick={() => handleUpdate(categories.find(c => c.id === cat.id)!)} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); loadCategories(); }}>
                    <X className="h-4 w-4 mr-1" />Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-2xl w-10 text-center">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{cat.name}</span>
                    <span className="text-xs text-muted-foreground">/{cat.slug}</span>
                    {!cat.is_active && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Inactive</span>}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{cat.description}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(cat.id)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(cat.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

function CategoryForm({ form, setForm, slugify }: { form: any; setForm: any; slugify: (s: string) => string }) {
  const ICON_OPTIONS = ["🎮","⚔️","🛡️","🏆","⭐","🔥","💎","🌍","👥","🎯","🚀","🏰","💬","📢","🆘","🎲","🔧","⚡","🌟","🎪"];
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <Label>Name</Label>
        <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })} placeholder="e.g. PvP Servers" className="mt-1" />
      </div>
      <div>
        <Label>Slug</Label>
        <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="pvp-servers" className="mt-1" />
      </div>
      <div className="md:col-span-2">
        <Label>Description</Label>
        <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Short description..." rows={2} className="mt-1" />
      </div>
      <div>
        <Label>Icon</Label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {ICON_OPTIONS.map(icon => (
            <button key={icon} type="button" onClick={() => setForm({ ...form, icon })}
              className={`text-xl p-1.5 rounded-lg transition-all ${form.icon === icon ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-white/10"}`}>
              {icon}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Display Order</Label>
        <Input type="number" value={form.display_order} onChange={e => setForm({ ...form, display_order: Number(e.target.value) })} className="mt-1 w-24" />
      </div>
    </div>
  );
}

export default AdminCategories;
