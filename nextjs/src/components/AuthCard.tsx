"use client";

import type { FormEventHandler, ReactNode } from "react";

type AuthCardProps = {
  title: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
  footer?: ReactNode;
  isSubmitting?: boolean;
};

const AuthCard = ({ title, onSubmit, children, footer, isSubmitting }: AuthCardProps) => (
  <main className="page">
    <div className="card">
      <h1>{title}</h1>
      <form className="stack" onSubmit={onSubmit}>
        {children}
        <button type="submit" className="primary" disabled={isSubmitting}>
          {isSubmitting ? "Please wait..." : title}
        </button>
      </form>
      {footer}
    </div>
  </main>
);

export default AuthCard;
