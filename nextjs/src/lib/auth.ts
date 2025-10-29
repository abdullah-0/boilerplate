"use client";

import api from "@/lib/api";

export type TokenResponse = {
  access: string;
  refresh: string;
  type: string;
};

export type User = {
  id: number;
  email: string;
  first_name: string;
  last_name?: string;
  is_email_verified: boolean;
};

export type AuthResponse = {
  user: User;
  token: TokenResponse;
};

export const login = (payload: { email: string; password: string }) => api.post<AuthResponse>("/auth/login", payload);
export const register = (payload: {
  email: string;
  password: string;
  first_name: string;
  last_name?: string;
}) => api.post<AuthResponse>("/auth/register", payload);
export const me = () => api.get<User>("/auth/me");
export const verifyEmail = (token: string) => api.post<{ message: string }>("/auth/verify-email", { token });
export const resendVerification = (email: string) =>
  api.post<{ message: string }>("/auth/resend-verification", { email });
export const forgotPassword = (email: string) => api.post<{ message: string }>("/auth/forgot-password", { email });
export const resetPassword = (payload: { token: string; password: string }) =>
  api.post<{ message: string }>("/auth/reset-password", payload);
