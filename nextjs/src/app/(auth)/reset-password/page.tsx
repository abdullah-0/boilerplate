"use client";

import { useSearchParams } from "next/navigation";
import { ChangeEvent, FormEventHandler, useEffect, useState } from "react";

import AuthCard from "@/components/AuthCard";
import { resetPassword } from "@/lib/auth";

const ResetPasswordPage = () => {
  const params = useSearchParams();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [params]);

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setStatus(null);
    setError(null);
    setLoading(true);

    try {
      await resetPassword({ token, password });
      setStatus("Password updated. You can close this tab.");
    } catch (err) {
      setError("Unable to reset the password. Request a new email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Choose a new password" onSubmit={handleSubmit} isSubmitting={loading}>
      <label>
        Token
        <input value={token} onChange={(event: ChangeEvent<HTMLInputElement>) => setToken(event.target.value)} required />
      </label>
      <label>
        New password
        <input
          type="password"
          value={password}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
          minLength={8}
          required
        />
      </label>
      {status ? <p className="success">{status}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </AuthCard>
  );
};

export default ResetPasswordPage;
