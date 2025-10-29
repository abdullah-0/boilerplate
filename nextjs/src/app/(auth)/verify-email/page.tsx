"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { resendVerification, verifyEmail } from "@/lib/auth";

const VerifyEmailPage = () => {
  const params = useSearchParams();
  const [status, setStatus] = useState("Verifying your email...");

  useEffect(() => {
    const token = params.get("token");
    const run = async () => {
      if (!token) {
        setStatus("Token missing. Request a new verification email.");
        return;
      }
      try {
        await verifyEmail(token);
        setStatus("Email verified. You may now close this tab.");
      } catch (err) {
        setStatus("Verification failed. Request a new email.");
      }
    };
    void run();
  }, [params]);

  const handleResend = async () => {
    const email = window.prompt("Enter your email to resend verification link:");
    if (email) {
      await resendVerification(email);
      setStatus("Verification email sent.");
    }
  };

  return (
    <main className="page">
      <div className="card">
        <h1>Email verification</h1>
        <p className="center">{status}</p>
        <button type="button" className="secondary" onClick={handleResend}>
          Resend email
        </button>
      </div>
    </main>
  );
};

export default VerifyEmailPage;
