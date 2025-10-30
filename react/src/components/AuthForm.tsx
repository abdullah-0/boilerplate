import { FormEvent, ReactNode } from "react";

export type AuthFormProps = {
  title: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
  footer?: ReactNode;
  isSubmitting?: boolean;
};

const AuthForm = ({ title, onSubmit, children, footer, isSubmitting }: AuthFormProps) => (
  <div className="auth-page">
    <div className="card auth-card">
      <h1>{title}</h1>
      <form onSubmit={onSubmit}>{children}</form>
      {footer}
      {isSubmitting ? <p className="center">Submitting...</p> : null}
    </div>
  </div>
);

export default AuthForm;
