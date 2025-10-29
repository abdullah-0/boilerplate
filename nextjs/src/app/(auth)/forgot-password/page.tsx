"use client";

import { FormEventHandler, useState } from "react";

import AuthCard from "@/components/AuthCard";
import { forgotPassword } from "@/lib/auth";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      await forgotPassword(email);
      setStatus("If an account exists for that email, a reset link has been sent.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Password reset" onSubmit={handleSubmit} isSubmitting={loading}>
      <label>
        Email
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      {status ? <p className="center">{status}</p> : null}
    </AuthCard>
  );
};

export default ForgotPasswordPage;
