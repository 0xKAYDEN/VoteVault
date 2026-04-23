import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "@/lib/api";

export type AppRole = "player" | "server_owner" | "admin";

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
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  signOut: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = async () => {
    try {
      const prof = await api.auth.getMe();
      setProfile(prof);
      setUser({ id: prof.id, email: "" }); // Email could be added to profile response if needed
    } catch (err) {
      signOut();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials: any) => {
    const { token, user: userData } = await api.auth.login(credentials);
    localStorage.setItem("token", token);
    setUser(userData);
    await loadUserData();
  };

  const register = async (data: any) => {
    const { token, user: userData } = await api.auth.register(data);
    localStorage.setItem("token", token);
    setUser(userData);
    await loadUserData();
  };

  const signOut = () => {
    localStorage.removeItem("token");
    setUser(null);
    setProfile(null);
  };

  const refresh = async () => {
    if (localStorage.getItem("token")) await loadUserData();
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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
