import { defineStore } from "pinia";
import { ref } from "vue";

import type { AuthResponse, User } from "@/api/auth";
import { me } from "@/api/auth";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const isLoading = ref(true);

  const setAuth = (payload: AuthResponse) => {
    localStorage.setItem("accessToken", payload.token.access);
    localStorage.setItem("refreshToken", payload.token.refresh);
    user.value = payload.user;
  };

  const clear = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    user.value = null;
  };

  const hydrate = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      isLoading.value = false;
      user.value = null;
      return;
    }
    try {
      const { data } = await me();
      user.value = data;
    } catch (error) {
      clear();
    } finally {
      isLoading.value = false;
    }
  };

  return { user, isLoading, setAuth, clear, hydrate };
});
