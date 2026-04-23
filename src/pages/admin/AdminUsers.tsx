import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { 
  Users, Shield, User, Search, 
  Check, X, ShieldAlert, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  const toggleRole = async (userId: string, currentRoles: string[], roleToToggle: string) => {
    let newRoles;
    const roles = Array.isArray(currentRoles) ? currentRoles : [];
    if (roles.includes(roleToToggle)) {
      newRoles = roles.filter(r => r !== roleToToggle);
    } else {
      newRoles = [...roles, roleToToggle];
    }

    try {
      await api.admin.updateUserRoles(userId, newRoles);
      toast.success("User roles updated");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
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
                <th className="px-6 py-4 font-bold text-right">Toggle Admin</th>
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
                      {Array.isArray(u.roles) && u.roles.map((r: string) => (
                        <Badge key={r} variant="outline" className={cn(
                          "text-[10px] uppercase",
                          r === "admin" ? "border-rose-500/50 text-rose-400 bg-rose-500/5" :
                          r === "server_owner" ? "border-primary/50 text-primary-glow bg-primary/5" :
                          "border-white/10 text-muted-foreground"
                        )}>
                          {r.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      size="sm" 
                      variant={Array.isArray(u.roles) && u.roles.includes("admin") ? "destructive" : "outline"}
                      className="h-8 text-xs"
                      onClick={() => toggleRole(u.id, u.roles, "admin")}
                    >
                      {Array.isArray(u.roles) && u.roles.includes("admin") ? (
                        <><ShieldAlert className="h-3.5 w-3.5 mr-1.5" /> Revoke Admin</>
                      ) : (
                        <><ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Make Admin</>
                      )}
                    </Button>
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
