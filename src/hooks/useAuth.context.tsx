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
  login: (credentials: any) => Promise<void>;
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

  const loadUserData = async () => {
    try {
      const prof = await api.auth.getMe();
      setProfile(prof);
      setUser({ id: prof.id, email: "" });

      // Initialize socket connection
      const token = localStorage.getItem("token");
      if (token) {
        initializeSocket(token);
      }
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
    disconnectSocket();
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
