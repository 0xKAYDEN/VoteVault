import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Crown, LayoutDashboard, LogOut, Server, BookOpen, User as UserIcon, Plus, ShieldAlert, Settings } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserTags } from "@/components/UserTag";
import { FriendsChat } from "@/components/FriendsChat";
import { NotificationBell } from "@/components/NotificationBell";
import { toast } from "sonner";

export function Header() {
  const { user, profile, isOwner, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    toast.success("Signed out");
    navigate("/");
  };

  const initials = (profile?.display_name || profile?.username || user?.email || "U")
    .slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glass-strong border-b border-white/10">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative grid h-9 w-9 place-items-center rounded-lg bg-gradient-crimson shadow-[0_0_20px_hsl(0_80%_50%/0.5)]">
              <Crown className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="font-display text-xl font-bold tracking-wider">
              <span className="text-gradient">CONQUER</span>{" "}
              <span className="text-crimson-gradient">TOP 100</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild><Link to="/">Top Servers</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/categories">Categories</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/contact">Contact</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/api-docs">API</Link></Button>
            {user && (
              <Button variant="ghost" size="sm" asChild><Link to="/dashboard/servers/new"><Plus className="h-4 w-4" /> Add Server</Link></Button>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {!user ? (
              <>
                <Button variant="ghost" size="sm" asChild><Link to="/auth">Sign In</Link></Button>
                <Button variant="hero" size="sm" asChild><Link to="/auth?mode=signup">Join</Link></Button>
              </>
            ) : (
              <>
                <NotificationBell />
                <FriendsChat />
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 glass glass-hover rounded-full pl-1 pr-3 py-1">
                    <Avatar className="h-8 w-8 border border-white/10">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback className="bg-gradient-crimson text-white text-xs font-bold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start leading-tight">
                       <span className="text-sm font-medium max-w-[120px] truncate">
                        {profile?.display_name || profile?.username || "Player"}
                      </span>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-strong border-white/10 w-56">
                  <DropdownMenuLabel className="flex flex-col">
                    <span className="text-sm font-bold truncate">{profile?.display_name || profile?.username}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{user?.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  
                  <DropdownMenuItem asChild><Link to="/dashboard/settings"><Settings className="mr-2 h-4 w-4" />Account Settings</Link></DropdownMenuItem>
                  
                  {isOwner ? (
                    <>
                      <DropdownMenuItem asChild><Link to="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/dashboard/servers"><Server className="mr-2 h-4 w-4" />My Servers</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/dashboard/api-keys"><BookOpen className="mr-2 h-4 w-4" />API Keys</Link></DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem asChild><Link to="/dashboard/servers/new"><UserIcon className="mr-2 h-4 w-4" />Become an Owner</Link></DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild><Link to="/api-docs"><BookOpen className="mr-2 h-4 w-4" />API Docs</Link></DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin"><ShieldAlert className="mr-2 h-4 w-4" />Admin Panel</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
