"use client";

import { create } from "zustand";

import type { AuthResponse, User } from "@/lib/auth";

export type AuthState = {
  user: User | null;
  isLoading: boolean;
  setAuth: (payload: AuthResponse) => void;
  clear: () => void;
  hydrate: () => Promise<void>;
};

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setAuth: (payload) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("accessToken", payload.token.access);
      window.localStorage.setItem("refreshToken", payload.token.refresh);
    }
    set({ user: payload.user });
  },
  clear: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("accessToken");
      window.localStorage.removeItem("refreshToken");
    }
    set({ user: null });
  },
  hydrate: async () => {
    if (typeof window === "undefined") {
      return;
    }
    const accessToken = window.localStorage.getItem("accessToken");
    if (!accessToken) {
      set({ user: null, isLoading: false });
      return;
    }
    const { me } = await import("@/lib/auth");
    try {
      const { data } = await me();
      set({ user: data });
    } catch {
      set({ user: null });
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useAuthStore;
