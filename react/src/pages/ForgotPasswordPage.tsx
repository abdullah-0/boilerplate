import { FormEvent, useState } from "react";

import { useForgotPasswordMutation } from "@/api/user/userApi";
import AuthForm from "@/components/AuthForm";
import { getErrorMessage } from "@/utils/error";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    try {
      await forgotPassword(email).unwrap();
      setMessage("If an account exists for that email, a reset link has been sent.");
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "We could not process that request. Please verify the email and try again."
        )
      );
    }
  };

  return (
    <AuthForm title="Reset your password" onSubmit={handleSubmit} isSubmitting={isLoading}>
      <label>
        Email
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      {message ? <p className="center">{message}</p> : null}
      {error ? <p className="center" role="alert">{error}</p> : null}
      <button type="submit" disabled={isLoading}>
        Send reset link
      </button>
    </AuthForm>
  );
};

export default ForgotPasswordPage;
