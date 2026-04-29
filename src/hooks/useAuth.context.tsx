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

  // Check both storage locations for token
  const getStoredToken = () =>
    localStorage.getItem("token") || sessionStorage.getItem("token");

  const loadUserData = async () => {
    try {
      const prof = await api.auth.getMe();
      setProfile(prof as any);
      setUser({ id: prof.id, email: (prof as any).email || "" });
      const token = getStoredToken();
      if (token) initializeSocket(token);
    } catch (err) {
      signOut();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (getStoredToken()) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials: any) => {
    const result = await api.auth.login(credentials);
    const { token, user: userData, requires2FA } = result as any;

    if (requires2FA) return result; // pass through for 2FA handling

    // Remember me → localStorage (persists across browser restarts)
    // Not remembered → sessionStorage (cleared when browser closes)
    if (credentials.rememberMe) {
      localStorage.setItem("token", token);
      sessionStorage.removeItem("token");
    } else {
      sessionStorage.setItem("token", token);
      localStorage.removeItem("token");
    }
    setUser(userData);
    await loadUserData();
  };

  const register = async (data: any) => {
    const result = await api.auth.register(data);
    // If email verification is required, don't log the user in
    if ((result as any).requiresVerification) return;
    // Legacy path (shouldn't happen now, but safe fallback)
    const { token, user: userData } = result as any;
    if (token) {
      localStorage.setItem("token", token);
      setUser(userData);
      await loadUserData();
    }
  };

  const signOut = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setUser(null);
    setProfile(null);
    disconnectSocket();
  };

  const refresh = async () => {
    if (getStoredToken()) await loadUserData();
  };

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
