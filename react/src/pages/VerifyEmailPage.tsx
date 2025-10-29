import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { resendVerification, verifyEmail } from "@/api/auth";

const VerifyEmailPage = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<string>("Verifying your email...");

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setStatus("Verification token missing. Please request a new email.");
        return;
      }
      try {
        await verifyEmail(token);
        setStatus("Email verified! You can now close this tab and sign in.");
      } catch (err) {
        setStatus("Verification failed. Try requesting a new email.");
      }
    };
    void run();
  }, [token]);

  const handleResend = async () => {
    const email = window.prompt("Enter your email to resend verification link:");
    if (email) {
      await resendVerification(email);
      setStatus("Verification email sent. Check your inbox.");
    }
  };

  return (
    <main>
      <div className="card">
        <h1>Email verification</h1>
        <p className="center">{status}</p>
        <button type="button" onClick={handleResend}>
          Resend verification email
        </button>
      </div>
    </main>
  );
};

export default VerifyEmailPage;
