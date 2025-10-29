import apiClient from "./client";

export type Credentials = {
  email: string;
  password: string;
};

export type RegisterPayload = Credentials & {
  first_name: string;
  last_name?: string;
};

export type TokenResponse = {
  access: string;
  refresh: string;
  type: string;
};

export type AuthResponse = {
  user: User;
  token: TokenResponse;
};

export type User = {
  id: number;
  email: string;
  first_name: string;
  last_name?: string;
  is_email_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const register = (payload: RegisterPayload) => {
  return apiClient.post<AuthResponse>("/auth/register", payload);
};

export const login = (payload: Credentials) => {
  return apiClient.post<AuthResponse>("/auth/login", payload);
};

export const refreshToken = (refresh: string) => {
  return apiClient.post<TokenResponse>("/auth/refresh", { refresh });
};

export const resendVerification = (email: string) => {
  return apiClient.post<{ message: string }>("/auth/resend-verification", { email });
};

export const verifyEmail = (token: string) => {
  return apiClient.post<{ message: string }>("/auth/verify-email", { token });
};

export const forgotPassword = (email: string) => {
  return apiClient.post<{ message: string }>("/auth/forgot-password", { email });
};

export const resetPassword = (token: string, password: string) => {
  return apiClient.post<{ message: string }>("/auth/reset-password", { token, password });
};

export const getProfile = () => {
  return apiClient.get<User>("/auth/me");
};
