import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  Crown, LayoutDashboard, LogOut, Server, BookOpen,
  User as UserIcon, Plus, ShieldAlert, Settings,
  MessageSquare, Menu, X, Home, Tag, DollarSign, Mail,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FriendsChat } from "@/components/FriendsChat";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { to: "/", label: "Top Servers", icon: Home },
  { to: "/categories", label: "Categories", icon: Tag },
  { to: "/threads", label: "Community", icon: MessageSquare },
  { to: "/pricing", label: "Pricing", icon: DollarSign },
  { to: "/contact", label: "Contact", icon: Mail },
];

export function Header() {
  const { user, profile, isOwner, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = () => {
    signOut();
    toast.success("Signed out");
    navigate("/");
    setMobileOpen(false);
  };

  const initials = (profile?.display_name || profile?.username || user?.email || "U")
    .slice(0, 2).toUpperCase();

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl">
      <div className="glass-strong border-b border-white/10 shadow-lg">
        <div className="container flex h-16 items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="relative grid h-9 w-9 place-items-center rounded-lg bg-gradient-crimson shadow-[0_0_20px_hsl(0_80%_50%/0.5)] transition-all group-hover:shadow-[0_0_30px_hsl(0_80%_50%/0.7)] group-hover:scale-110">
              <Crown className="h-5 w-5 text-white transition-transform group-hover:rotate-12" strokeWidth={2.5} />
            </div>
            <div className="font-display text-xl font-bold tracking-wider">
              <span className="text-gradient">VOTE</span>{" "}
              <span className="text-crimson-gradient">VAULT</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <Button
                key={to}
                variant="ghost"
                size="sm"
                className={cn(
                  "hover:bg-primary/10 transition-all",
                  isActive(to) && "bg-primary/10 text-primary-glow"
                )}
                asChild
              >
                <Link to={to}>{label}</Link>
              </Button>
            ))}
            {user && (
              <Button variant="ghost" size="sm" className="hover:bg-primary/10 transition-all" asChild>
                <Link to="/dashboard/servers/new"><Plus className="h-4 w-4 mr-1" />Add Server</Link>
              </Button>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Theme toggle — visible on all screen sizes */}
            <ThemeToggle />

            {!user ? (
              <>
                <Button variant="ghost" size="sm" className="hidden sm:flex hover:bg-primary/10" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button variant="hero" size="sm" className="shadow-lg hover:shadow-xl transition-all hover:scale-105" asChild>
                  <Link to="/auth?mode=signup">Join</Link>
                </Button>
              </>
            ) : (
              <>
                <NotificationBell />
                <FriendsChat />
                {/* User dropdown — desktop */}
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 glass rounded-full pl-1 pr-3 py-1 hover:bg-white/10 transition-all hover:scale-105">
                        <Avatar className="h-8 w-8 border border-white/10">
                          <AvatarImage src={profile?.avatar_url || ""} />
                          <AvatarFallback className="bg-gradient-crimson text-white text-xs font-bold">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium max-w-[120px] truncate">
                          {profile?.display_name || profile?.username || "Player"}
                        </span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-strong border-white/10 w-56">
                      <DropdownMenuLabel className="flex flex-col">
                        <span className="text-sm font-bold truncate">{profile?.display_name || profile?.username}</span>
                        <span className="text-[10px] text-muted-foreground truncate">{user?.email}</span>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem asChild><Link to={`/user/${profile?.id}`}><UserIcon className="mr-2 h-4 w-4" />My Profile</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/messages"><MessageSquare className="mr-2 h-4 w-4" />Messages</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/dashboard/settings"><Settings className="mr-2 h-4 w-4" />Account Settings</Link></DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem asChild><Link to="/admin"><ShieldAlert className="mr-2 h-4 w-4" />Admin Panel</Link></DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            )}

            {/* Mobile hamburger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="glass-strong border-white/10 w-72 p-0">
                <div className="flex flex-col h-full">
                  {/* Mobile header */}
                  <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <span className="font-display font-bold text-lg">
                      <span className="text-gradient">VOTE</span>{" "}
                      <span className="text-crimson-gradient">VAULT</span>
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* User info on mobile */}
                  {user && profile && (
                    <div className="flex items-center gap-3 p-4 border-b border-white/10">
                      <Avatar className="h-10 w-10 border border-white/10">
                        <AvatarImage src={profile.avatar_url || ""} />
                        <AvatarFallback className="bg-gradient-crimson text-white text-sm font-bold">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{profile.display_name || profile.username}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  )}

                  {/* Nav links */}
                  <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                          isActive(to)
                            ? "bg-primary/15 text-primary-glow border border-primary/30"
                            : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Link>
                    ))}

                    {user && (
                      <>
                        <div className="pt-2 pb-1 px-3 text-[10px] uppercase tracking-widest text-muted-foreground">Account</div>
                        <Link to={`/user/${profile?.id}`} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
                          <UserIcon className="h-4 w-4" />My Profile
                        </Link>
                        <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
                          <LayoutDashboard className="h-4 w-4" />Dashboard
                        </Link>
                        <Link to="/dashboard/settings" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
                          <Settings className="h-4 w-4" />Settings
                        </Link>
                        {isAdmin && (
                          <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
                            <ShieldAlert className="h-4 w-4" />Admin Panel
                          </Link>
                        )}
                      </>
                    )}
                  </nav>

                  {/* Bottom actions */}
                  <div className="p-3 border-t border-white/10 space-y-2">
                    {user ? (
                      <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleSignOut}>
                        <LogOut className="h-4 w-4 mr-2" />Sign Out
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" asChild onClick={() => setMobileOpen(false)}>
                          <Link to="/auth">Sign In</Link>
                        </Button>
                        <Button variant="hero" className="flex-1" asChild onClick={() => setMobileOpen(false)}>
                          <Link to="/auth?mode=signup">Join</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
