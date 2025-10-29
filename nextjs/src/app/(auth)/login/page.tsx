"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEventHandler, useEffect, useState } from "react";

import AuthCard from "@/components/AuthCard";
import { login } from "@/lib/auth";
import useAuthStore from "@/store/useAuthStore";

const LoginPage = () => {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data } = await login(form);
      setAuth(data);
      router.replace("/");
    } catch (err) {
      setError("Unable to sign in. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/");
    }
  }, [isLoading, router, user]);

  return (
    <AuthCard
      title="Sign in"
      onSubmit={handleSubmit}
      footer={
        <p className="center">
          Need an account? <Link href="/register">Create one</Link>
        </p>
      }
      isSubmitting={loading}
    >
      <label>
        Email
        <input name="email" type="email" value={form.email} onChange={handleChange} required />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          required
        />
      </label>
      {error ? <p className="error">{error}</p> : null}
      <p className="center">
        <Link href="/forgot-password">Forgot password?</Link>
      </p>
    </AuthCard>
  );
};

export default LoginPage;
