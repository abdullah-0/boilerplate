import { FormEvent, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { resetPassword } from "@/api/auth";
import AuthForm from "@/components/AuthForm";

const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const tokenFromUrl = params.get("token") ?? "";
  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setIsSubmitting(true);

    try {
      await resetPassword(token, password);
      setMessage("Password updated successfully. You can close this page.");
    } catch (err) {
      setError("Unable to reset password. Check your token or request a new email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthForm title="Choose a new password" onSubmit={handleSubmit} isSubmitting={isSubmitting}>
      <label>
        Token
        <input value={token} onChange={(event) => setToken(event.target.value)} required />
      </label>
      <label>
        New password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
        />
      </label>
      {message ? <p className="center">{message}</p> : null}
      {error ? <p className="center" role="alert">{error}</p> : null}
      <button type="submit" disabled={isSubmitting}>
        Update password
      </button>
    </AuthForm>
  );
};

export default ResetPasswordPage;
