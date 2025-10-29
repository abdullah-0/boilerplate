"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import useAuthStore from "@/store/useAuthStore";

const DashboardPage = () => {
  const router = useRouter();
  const { user, isLoading, clear } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, router, user]);

  if (isLoading) {
    return <p className="center">Loading...</p>;
  }

  if (!user) {
    return null;
  }

  return (
    <main className="page">
      <div className="card" style={{ textAlign: "center" }}>
        <h1>Welcome back</h1>
        <p className="center">{user.email}</p>
        <button type="button" className="secondary" onClick={clear}>
          Sign out
        </button>
      </div>
    </main>
  );
};

export default DashboardPage;
