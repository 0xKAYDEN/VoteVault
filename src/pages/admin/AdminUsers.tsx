import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Users, Shield, User, Search,
  Check, X, ShieldAlert, ShieldCheck, Crown, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AVAILABLE_ROLES = [
  { value: 'player', label: 'Player', icon: User, color: 'text-muted-foreground border-white/10' },
  { value: 'server_owner', label: 'Server Owner', icon: Crown, color: 'text-primary-glow border-primary/50 bg-primary/5' },
  { value: 'mod', label: 'Moderator', icon: Shield, color: 'text-blue-400 border-blue-500/50 bg-blue-500/5' },
  { value: 'vip', label: 'VIP', icon: Star, color: 'text-yellow-400 border-yellow-500/50 bg-yellow-500/5' },
  { value: 'admin', label: 'Admin', icon: ShieldAlert, color: 'text-rose-400 border-rose-500/50 bg-rose-500/5' },
];

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const load = async () => {
    try {
      const data = await api.admin.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openRoleDialog = (user: any) => {
    setEditingUser(user);
    setSelectedRoles(Array.isArray(user.roles) ? user.roles : []);
  };

  const toggleRoleInDialog = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const saveRoles = async () => {
    if (!editingUser) return;

    try {
      await api.admin.updateUserRoles(editingUser.id, selectedRoles);
      toast.success("User roles updated successfully");
      setEditingUser(null);
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to update roles");
    }
  };

  const getRoleColor = (role: string) => {
    const roleConfig = AVAILABLE_ROLES.find(r => r.value === role);
    return roleConfig?.color || 'border-white/10 text-muted-foreground';
  };

  const filtered = (users || []).filter(u => {
    if (!u) return false;
    const email = u.email || "";
    const username = u.username || "";
    const displayName = u.display_name || "";
    return email.toLowerCase().includes(search.toLowerCase()) || 
           username.toLowerCase().includes(search.toLowerCase()) ||
           displayName.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return <div className="glass rounded-2xl h-64 shimmer" />;

  return (
    <div className="space-y-6">
      <div className="relative w-full md:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search by email, username, or display name..." 
          className="pl-10 bg-white/5 border-white/10" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-widest text-muted-foreground">
                <th className="px-6 py-4 font-bold">User</th>
                <th className="px-6 py-4 font-bold">Account Info</th>
                <th className="px-6 py-4 font-bold">Roles</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-white/10">
                        <AvatarImage src={u.avatar_url} />
                        <AvatarFallback className="bg-primary/20 text-primary uppercase">
                          {u.display_name?.[0] || u.username?.[0] || u.email?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-bold truncate">{u.display_name || u.username || "No Name"}</div>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    <div>Joined: {u.account_created ? new Date(u.account_created).toLocaleDateString() : "Unknown"}</div>
                    <div>ID: {u.id?.slice(0, 8)}...</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(u.roles) && u.roles.length > 0 ? (
                        u.roles.map((r: string) => (
                          <Badge key={r} variant="outline" className={cn(
                            "text-[10px] uppercase",
                            getRoleColor(r)
                          )}>
                            {r.replace('_', ' ')}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No roles</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => openRoleDialog(u)}
                        >
                          <Shield className="h-3.5 w-3.5 mr-1.5" />
                          Manage Roles
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glass-strong border-white/10">
                        <DialogHeader>
                          <DialogTitle>Manage User Roles</DialogTitle>
                          <DialogDescription>
                            Select roles for {u.display_name || u.username || u.email}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          {AVAILABLE_ROLES.map(role => {
                            const Icon = role.icon;
                            return (
                              <div key={role.value} className="flex items-center space-x-3">
                                <Checkbox
                                  id={`role-${role.value}`}
                                  checked={selectedRoles.includes(role.value)}
                                  onCheckedChange={() => toggleRoleInDialog(role.value)}
                                />
                                <label
                                  htmlFor={`role-${role.value}`}
                                  className="flex items-center gap-2 cursor-pointer flex-1"
                                >
                                  <Icon className={cn("h-4 w-4", role.color.split(' ')[0])} />
                                  <span className="font-medium">{role.label}</span>
                                </label>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setEditingUser(null)}>
                            Cancel
                          </Button>
                          <Button variant="hero" onClick={saveRoles}>
                            Save Changes
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">
            No users found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
