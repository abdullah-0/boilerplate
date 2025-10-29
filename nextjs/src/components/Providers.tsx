"use client";

import { useEffect } from "react";

import useAuthStore from "@/store/useAuthStore";

const Providers = ({ children }: { children: React.ReactNode }) => {
  const hydrate = useAuthStore((state) => state.hydrate);
  const clear = useAuthStore((state) => state.clear);

  useEffect(() => {
    void hydrate();
    const handleLogout = () => clear();
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [clear, hydrate]);

  return children;
};

export default Providers;
