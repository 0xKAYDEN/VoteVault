import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Shield, Star, User, Crown, Hammer } from "lucide-react";

export type RoleType = "player" | "server_owner" | "admin" | "vip" | "mod";

const roleConfig: Record<RoleType, { label: string; class: string; icon: any }> = {
  admin: { 
    label: "Admin", 
    class: "bg-rose-500/10 text-rose-400 border-rose-500/20", 
    icon: Shield 
  },
  mod: { 
    label: "Mod", 
    class: "bg-amber-500/10 text-amber-400 border-amber-500/20", 
    icon: Hammer 
  },
  server_owner: { 
    label: "Owner", 
    class: "bg-primary/10 text-primary-glow border-primary/20", 
    icon: Crown 
  },
  vip: { 
    label: "VIP", 
    class: "bg-purple-500/10 text-purple-400 border-purple-500/20", 
    icon: Star 
  },
  player: { 
    label: "Player", 
    class: "bg-white/5 text-muted-foreground border-white/10", 
    icon: User 
  },
};

export function UserTag({ role, className }: { role: RoleType | string; className?: string }) {
  const config = roleConfig[role as RoleType] || roleConfig.player;
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1 px-1.5 py-0 text-[10px] uppercase font-bold tracking-tight h-5 leading-none", 
        config.class, 
        className
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {config.label}
    </Badge>
  );
}

export function UserTags({ roles, className }: { roles?: string[] | string; className?: string }) {
  if (!roles) return null;
  const roleArray = Array.isArray(roles) ? roles : roles.split(',').map(r => r.trim());
  
  // Sort roles by priority: admin > mod > owner > vip > player
  const priority = { admin: 0, mod: 1, server_owner: 2, vip: 3, player: 4 };
  const sorted = [...roleArray].sort((a, b) => 
    (priority[a as keyof typeof priority] ?? 99) - (priority[b as keyof typeof priority] ?? 99)
  );

  return (
    <div className={cn("flex flex-wrap gap-1 items-center", className)}>
      {sorted.map(role => (
        <UserTag key={role} role={role} />
      ))}
    </div>
  );
}
