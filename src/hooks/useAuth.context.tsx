import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "@/lib/api";
import { initializeSocket, disconnectSocket } from "@/lib/socket";

export type AppRole = "player" | "server_owner" | "admin" | "mod" | "vip";

interface User {
  id: string;
  email: string;
}

interface Profile {
  id: string;
  public_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  roles: AppRole[];
  bio: string | null;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  login: (credentials: any) => Promise<any>;
  register: (data: any) => Promise<void>;
  signOut: () => void;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Load the current user from the server.
   * The JWT lives in an HttpOnly cookie — we never touch localStorage.
   * If the cookie is absent or expired the server returns 401 and we sign out.
   */
  const loadUserData = async () => {
    try {
      const prof = await api.auth.getMe();
      setProfile(prof as any);
      setUser({ id: prof.id, email: (prof as any).email || "" });
      // Socket needs the token — fetch it from the cookie via a dedicated
      // endpoint, or pass the user id. For now we re-use the profile id as
      // the socket identity (the server validates via cookie on upgrade).
      initializeSocket('cookie'); // signal: use cookie auth on WS handshake
    } catch {
      // 401 → not authenticated; clear local state
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // On mount, try to restore session from the HttpOnly cookie
  useEffect(() => { loadUserData(); }, []);

  const login = async (credentials: any) => {
    const result = await api.auth.login(credentials);
    const { user: userData, requires2FA } = result as any;

    if (requires2FA) return result;

    // Cookie is set by the server — nothing to store in JS
    setUser(userData);
    await loadUserData();
  };

  const register = async (data: any) => {
    const result = await api.auth.register(data);
    if ((result as any).requiresVerification) return;
    // Legacy path — shouldn't happen now
    const { user: userData } = result as any;
    if (userData) { setUser(userData); await loadUserData(); }
  };

  const signOut = async () => {
    try { await api.auth.logout(); } catch { /* ignore */ }
    setUser(null);
    setProfile(null);
    disconnectSocket();
  };

  const refresh = async () => { await loadUserData(); };

  const roles = profile?.roles || [];

  return (
    <AuthContext.Provider value={{
      user, profile, roles, loading,
      isOwner: roles.includes("server_owner") || roles.includes("admin"),
      isAdmin: roles.includes("admin"),
      login, register, signOut, refresh,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
