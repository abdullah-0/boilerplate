import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useResendVerificationMutation, useVerifyEmailMutation } from "@/api/user/userApi";
import { getErrorMessage } from "@/utils/error";

const VerifyEmailPage = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<string>("Verifying your email...");
  const [verifyEmail] = useVerifyEmailMutation();
  const [resendVerification] = useResendVerificationMutation();

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setStatus("Verification token missing. Please request a new email.");
        return;
      }
      try {
        await verifyEmail(token).unwrap();
        setStatus("Email verified! You can now close this tab and sign in.");
      } catch (err) {
        setStatus(getErrorMessage(err, "Verification failed. Try requesting a new email."));
      }
    };
    void run();
  }, [token, verifyEmail]);

  const handleResend = async () => {
    const email = window.prompt("Enter your email to resend verification link:");
    if (email) {
      try {
        await resendVerification(email).unwrap();
        setStatus("Verification email sent. Check your inbox.");
      } catch (err) {
        setStatus(
          getErrorMessage(
            err,
            "Unable to send verification email. Please try again later."
          )
        );
      }
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
