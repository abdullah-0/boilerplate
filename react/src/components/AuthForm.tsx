import { FormEvent, ReactNode } from "react";

export type AuthFormProps = {
  title: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
  footer?: ReactNode;
  isSubmitting?: boolean;
};

const AuthForm = ({ title, onSubmit, children, footer, isSubmitting }: AuthFormProps) => (
  <main>
    <div className="card">
      <h1>{title}</h1>
      <form onSubmit={onSubmit}>{children}</form>
      {footer}
      {isSubmitting ? <p className="center">Submitting...</p> : null}
    </div>
  </main>
);

export default AuthForm;
