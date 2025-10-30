import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { AuthResponse, User } from "@/types/user/userTypes";
import { userApi, useLazyGetProfileQuery } from "@/api/user/userApi";
import { useAppDispatch } from "@/store/hooks";

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
  const dispatch = useAppDispatch();
  const [fetchProfile] = useLazyGetProfileQuery();

  const setAuthData = useCallback(
    (payload: AuthResponse) => {
      localStorage.setItem("accessToken", payload.token.access);
      localStorage.setItem("refreshToken", payload.token.refresh);
      setUser(payload.user);
      dispatch(userApi.util.upsertQueryData("getProfile", undefined, payload.user));
    },
    [dispatch]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    dispatch(userApi.util.resetApiState());
  }, [dispatch]);

  const refetchProfile = useCallback(async () => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      setIsLoading(false);
      setUser(null);
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchProfile().unwrap();
      setUser(data);
    } catch (error) {
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile, logout]);

  useEffect(() => {
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
