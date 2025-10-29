import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { AuthResponse, User } from "@/api/auth";
import { getProfile } from "@/api/auth";

export type AuthState = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

export type AuthContextValue = AuthState & {
  setAuthData: (payload: AuthResponse) => void;
  logout: () => void;
  refetchProfile: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setAuthData = useCallback((payload: AuthResponse) => {
    localStorage.setItem("accessToken", payload.token.access);
    localStorage.setItem("refreshToken", payload.token.refresh);
    setUser(payload.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
  }, []);

  const refetchProfile = useCallback(async () => {
    try {
      const { data } = await getProfile();
      setUser(data);
    } catch (error) {
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      setIsLoading(false);
      return;
    }
    void refetchProfile();
  }, [refetchProfile]);

  useEffect(() => {
    const handleLogout = () => logout();
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      setAuthData,
      logout,
      refetchProfile,
    }),
    [isLoading, logout, refetchProfile, setAuthData, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
