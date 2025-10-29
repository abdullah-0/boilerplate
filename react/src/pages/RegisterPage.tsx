import { ChangeEvent, FormEvent, useState } from "react";
import { Link } from "react-router-dom";

import { register } from "@/api/auth";
import AuthForm from "@/components/AuthForm";

const RegisterPage = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      await register({
        email: form.email,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
      });
      setMessage("Account created! Please check your email to verify your address.");
    } catch (err) {
      setError("Unable to create your account. Email may already exist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthForm
      title="Create account"
      onSubmit={handleSubmit}
      footer={
        <p className="center">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      }
      isSubmitting={isSubmitting}
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
        <input type="email" name="email" value={form.email} onChange={handleChange} required />
      </label>
      <label>
        Password
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          minLength={8}
          required
        />
      </label>
      {error ? <p className="center" role="alert">{error}</p> : null}
      {message ? <p className="center">{message}</p> : null}
      <button type="submit" disabled={isSubmitting}>
        Create account
      </button>
    </AuthForm>
  );
};

export default RegisterPage;
