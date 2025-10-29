import { ChangeEvent, FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { login } from "@/api/auth";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/hooks/useAuth";

const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuthData } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { data } = await login({ email: form.email, password: form.password });
      setAuthData(data);
      navigate("/", { replace: true });
    } catch (err) {
      setError("Incorrect credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthForm
      title="Sign in"
      onSubmit={handleSubmit}
      footer={
        <p className="center">
          Need an account? <Link to="/register">Create one</Link>
        </p>
      }
      isSubmitting={isSubmitting}
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
      {error ? <p className="center" role="alert">{error}</p> : null}
      <button type="submit" disabled={isSubmitting}>
        Sign in
      </button>
      <p className="center">
        <Link to="/forgot-password">Forgot password?</Link>
      </p>
    </AuthForm>
  );
};

export default LoginPage;
