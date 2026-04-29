import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Users, Shield, User, Search, ShieldAlert, ShieldCheck,
  Crown, Star, Ban, Clock, Trophy, MoreVertical, Check, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const AVAILABLE_ROLES = [
  { value: "player",       label: "Player",       icon: User,       color: "text-muted-foreground border-white/10" },
  { value: "server_owner", label: "Server Owner", icon: Crown,      color: "text-primary-glow border-primary/50 bg-primary/5" },
  { value: "mod",          label: "Moderator",    icon: Shield,     color: "text-blue-400 border-blue-500/50 bg-blue-500/5" },
  { value: "vip",          label: "VIP",          icon: Star,       color: "text-yellow-400 border-yellow-500/50 bg-yellow-500/5" },
  { value: "admin",        label: "Admin",        icon: ShieldAlert, color: "text-rose-400 border-rose-500/50 bg-rose-500/5" },
];

const getRoleColor = (role: string) =>
  AVAILABLE_ROLES.find(r => r.value === role)?.color || "border-white/10 text-muted-foreground";

const AdminUsers = () => {
  const [users, setUsers]               = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");

  // Role dialog
  const [roleUser, setRoleUser]         = useState<any>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Ban dialog
  const [banUser, setBanUser]           = useState<any>(null);
  const [banReason, setBanReason]       = useState("");
  const [banType, setBanType]           = useState<"permanent" | "temporary">("permanent");
  const [banExpiry, setBanExpiry]       = useState("");

  // Suspend dialog
  const [suspendUser, setSuspendUser]   = useState<any>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendHours, setSuspendHours] = useState("24");

  // Achievement dialog
  const [achUser, setAchUser]           = useState<any>(null);
  const [achId, setAchId]               = useState("");

  const load = async () => {
    try {
      const [u, a] = await Promise.all([
        api.admin.getUsers(),
        api.admin.getAchievements().catch(() => []),
      ]);
      setUsers(Array.isArray(u) ? u : []);
      setAchievements(Array.isArray(a) ? a : []);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Role ──────────────────────────────────────────────────────────────────
  const openRoleDialog = (u: any) => {
    setRoleUser(u);
    setSelectedRoles(Array.isArray(u.roles) ? [...u.roles] : []);
  };

  const saveRoles = async () => {
    if (!roleUser) return;
    try {
      await api.admin.updateUserRoles(roleUser.id, selectedRoles);
      toast.success("Roles updated");
      setRoleUser(null);
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  // ── Ban ───────────────────────────────────────────────────────────────────
  const submitBan = async () => {
    if (!banUser || !banReason.trim()) { toast.error("Reason required"); return; }
    try {
      await api.admin.banUser({ userId: banUser.id, reason: banReason, banType, expiresAt: banType === "temporary" ? banExpiry : undefined });
      toast.success(`User banned (${banType})`);
      setBanUser(null); setBanReason(""); setBanExpiry("");
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const submitUnban = async (userId: string) => {
    try {
      await api.admin.unbanUser(userId);
      toast.success("User unbanned");
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  // ── Suspend ───────────────────────────────────────────────────────────────
  const submitSuspend = async () => {
    if (!suspendUser || !suspendReason.trim()) { toast.error("Reason required"); return; }
    try {
      await api.admin.suspendUser(suspendUser.id, suspendReason, Number(suspendHours));
      toast.success(`User suspended for ${suspendHours}h`);
      setSuspendUser(null); setSuspendReason(""); setSuspendHours("24");
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  // ── Achievement ───────────────────────────────────────────────────────────
  const submitAchievement = async () => {
    if (!achUser || !achId) { toast.error("Select an achievement"); return; }
    try {
      const res = await api.admin.awardAchievement(achUser.id, Number(achId)) as any;
      toast.success(res.message);
      setAchUser(null); setAchId("");
    } catch (e: any) { toast.error(e.message); }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (u.email || "").toLowerCase().includes(q) ||
           (u.username || "").toLowerCase().includes(q) ||
           (u.display_name || "").toLowerCase().includes(q);
  });

  if (loading) return <div className="glass rounded-2xl h-64 shimmer" />;

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative w-full md:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by email, username, or display name…"
          className="pl-10 bg-white/5 border-white/10"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-widest text-muted-foreground">
                <th className="px-5 py-4 font-bold">User</th>
                <th className="px-5 py-4 font-bold">Status</th>
                <th className="px-5 py-4 font-bold">Roles</th>
                <th className="px-5 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                  {/* User */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-white/10">
                        <AvatarImage src={u.avatar_url} />
                        <AvatarFallback className="bg-primary/20 text-primary uppercase text-xs">
                          {(u.display_name || u.username || u.email || "?")[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <Link to={`/user/${u.id}`} className="font-bold text-sm truncate hover:text-primary transition-colors block">
                          {u.display_name || u.username || "No Name"}
                        </Link>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                        <div className="text-[10px] text-muted-foreground">ID: {u.id?.slice(0, 8)}…</div>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      {u.is_banned ? (
                        <Badge variant="outline" className="text-[10px] border-red-500/40 text-red-400 bg-red-500/5 w-fit">Banned</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] border-green-500/40 text-green-400 bg-green-500/5 w-fit">Active</Badge>
                      )}
                      {u.is_verified ? (
                        <Badge variant="outline" className="text-[10px] border-blue-500/40 text-blue-400 w-fit">Verified</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground w-fit">Unverified</Badge>
                      )}
                    </div>
                  </td>

                  {/* Roles */}
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(u.roles) && u.roles.length > 0 ? u.roles.map((r: string) => (
                        <Badge key={r} variant="outline" className={cn("text-[10px] uppercase", getRoleColor(r))}>
                          {r.replace("_", " ")}
                        </Badge>
                      )) : <span className="text-xs text-muted-foreground">No roles</span>}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass-strong border-white/10 w-48">
                        <DropdownMenuItem onClick={() => openRoleDialog(u)} className="gap-2 cursor-pointer">
                          <Shield className="h-4 w-4" /> Manage Roles
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAchUser(u)} className="gap-2 cursor-pointer">
                          <Trophy className="h-4 w-4" /> Give Achievement
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setSuspendUser(u)} className="gap-2 cursor-pointer text-yellow-400">
                          <Clock className="h-4 w-4" /> Suspend
                        </DropdownMenuItem>
                        {u.is_banned ? (
                          <DropdownMenuItem onClick={() => submitUnban(u.id)} className="gap-2 cursor-pointer text-green-400">
                            <Check className="h-4 w-4" /> Unban
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => setBanUser(u)} className="gap-2 cursor-pointer text-red-400">
                            <Ban className="h-4 w-4" /> Ban User
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">No users found.</div>
        )}
      </div>

      {/* ── Role Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={!!roleUser} onOpenChange={o => !o && setRoleUser(null)}>
        <DialogContent className="glass-strong border-white/10">
          <DialogHeader>
            <DialogTitle>Manage Roles</DialogTitle>
            <DialogDescription>{roleUser?.display_name || roleUser?.username || roleUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {AVAILABLE_ROLES.map(role => {
              const Icon = role.icon;
              return (
                <div key={role.value} className="flex items-center gap-3">
                  <Checkbox
                    id={`role-${role.value}`}
                    checked={selectedRoles.includes(role.value)}
                    onCheckedChange={() =>
                      setSelectedRoles(prev =>
                        prev.includes(role.value) ? prev.filter(r => r !== role.value) : [...prev, role.value]
                      )
                    }
                  />
                  <label htmlFor={`role-${role.value}`} className="flex items-center gap-2 cursor-pointer flex-1">
                    <Icon className={cn("h-4 w-4", role.color.split(" ")[0])} />
                    <span className="font-medium text-sm">{role.label}</span>
                  </label>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRoleUser(null)}>Cancel</Button>
            <Button variant="hero" onClick={saveRoles}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Ban Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={!!banUser} onOpenChange={o => !o && setBanUser(null)}>
        <DialogContent className="glass-strong border-white/10">
          <DialogHeader>
            <DialogTitle className="text-red-400">Ban User</DialogTitle>
            <DialogDescription>{banUser?.display_name || banUser?.username}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Ban Type</Label>
              <Select value={banType} onValueChange={(v: any) => setBanType(v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {banType === "temporary" && (
              <div>
                <Label>Expires At</Label>
                <Input type="datetime-local" value={banExpiry} onChange={e => setBanExpiry(e.target.value)} className="mt-1" />
              </div>
            )}
            <div>
              <Label>Reason</Label>
              <Textarea value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Reason for ban…" rows={3} className="mt-1" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setBanUser(null)}>Cancel</Button>
            <Button variant="destructive" onClick={submitBan}>Ban User</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Suspend Dialog ──────────────────────────────────────────────── */}
      <Dialog open={!!suspendUser} onOpenChange={o => !o && setSuspendUser(null)}>
        <DialogContent className="glass-strong border-white/10">
          <DialogHeader>
            <DialogTitle className="text-yellow-400">Suspend User</DialogTitle>
            <DialogDescription>{suspendUser?.display_name || suspendUser?.username}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Duration (hours)</Label>
              <Select value={suspendHours} onValueChange={setSuspendHours}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="6">6 hours</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="72">3 days</SelectItem>
                  <SelectItem value="168">7 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea value={suspendReason} onChange={e => setSuspendReason(e.target.value)} placeholder="Reason for suspension…" rows={3} className="mt-1" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setSuspendUser(null)}>Cancel</Button>
            <Button className="bg-yellow-500 text-black hover:bg-yellow-400 font-bold" onClick={submitSuspend}>Suspend</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Achievement Dialog ──────────────────────────────────────────── */}
      <Dialog open={!!achUser} onOpenChange={o => !o && setAchUser(null)}>
        <DialogContent className="glass-strong border-white/10">
          <DialogHeader>
            <DialogTitle>Give Achievement</DialogTitle>
            <DialogDescription>{achUser?.display_name || achUser?.username}</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label>Achievement</Label>
            <Select value={achId} onValueChange={setAchId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select achievement…" /></SelectTrigger>
              <SelectContent className="max-h-64">
                {achievements.map((a: any) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.icon} {a.name} <span className="text-muted-foreground text-xs ml-1">({a.rarity})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAchUser(null)}>Cancel</Button>
            <Button variant="hero" onClick={submitAchievement} disabled={!achId}>Award</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
