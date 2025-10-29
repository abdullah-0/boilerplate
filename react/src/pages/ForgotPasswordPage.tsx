import { FormEvent, useState } from "react";

import { forgotPassword } from "@/api/auth";
import AuthForm from "@/components/AuthForm";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      await forgotPassword(email);
      setMessage("If an account exists for that email, a reset link has been sent.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthForm title="Reset your password" onSubmit={handleSubmit} isSubmitting={isSubmitting}>
      <label>
        Email
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      {message ? <p className="center">{message}</p> : null}
      <button type="submit" disabled={isSubmitting}>
        Send reset link
      </button>
    </AuthForm>
  );
};

export default ForgotPasswordPage;
