import api from "./client";

export interface TokenResponse {
  access: string;
  refresh: string;
  type: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name?: string;
  is_email_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token: TokenResponse;
}

export const register = (payload: {
  email: string;
  password: string;
  first_name: string;
  last_name?: string;
}) => api.post<AuthResponse>("/auth/register", payload);

export const login = (payload: { email: string; password: string }) =>
  api.post<AuthResponse>("/auth/login", payload);

export const refresh = (token: string) => api.post<TokenResponse>("/auth/refresh", { refresh: token });

export const me = () => api.get<User>("/auth/me");

export const verifyEmail = (token: string) => api.post<{ message: string }>("/auth/verify-email", { token });

export const resendVerification = (email: string) =>
  api.post<{ message: string }>("/auth/resend-verification", { email });

export const forgotPassword = (email: string) =>
  api.post<{ message: string }>("/auth/forgot-password", { email });

export const resetPassword = (payload: { token: string; password: string }) =>
  api.post<{ message: string }>("/auth/reset-password", payload);
