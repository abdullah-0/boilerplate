"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEventHandler, useEffect, useState } from "react";

import AuthCard from "@/components/AuthCard";
import { register } from "@/lib/auth";
import useAuthStore from "@/store/useAuthStore";

const RegisterPage = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState<string | null>(null);
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
    setMessage(null);

    try {
      await register(form);
      setMessage("Account created. Verify your email before signing in.");
    } catch (err) {
      setError("Could not create account. Email may already exist.");
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
      title="Create account"
      onSubmit={handleSubmit}
      footer={
        <p className="center">
          Have an account? <Link href="/login">Sign in</Link>
        </p>
      }
      isSubmitting={loading}
    >
      <label>
        First name
        <input name="first_name" value={form.first_name} onChange={handleChange} required />
      </label>
      <label>
        Last name
        <input name="last_name" value={form.last_name} onChange={handleChange} />
      </label>
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
          minLength={8}
          required
        />
      </label>
      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="success">{message}</p> : null}
    </AuthCard>
  );
};

export default RegisterPage;
