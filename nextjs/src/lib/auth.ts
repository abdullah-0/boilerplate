"use client";

import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/config";

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
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AuthResponse = {
  user: User;
  token: TokenResponse;
};

export const login = (payload: { email: string; password: string }) =>
  api.post<AuthResponse>(API_ENDPOINTS.user.login, payload);
export const register = (payload: {
  email: string;
  password: string;
  first_name: string;
  last_name?: string;
}) => api.post<AuthResponse>(API_ENDPOINTS.user.register, payload);
export const me = () => api.get<User>(API_ENDPOINTS.user.profile);
export const verifyEmail = (token: string) =>
  api.post<{ message: string }>(API_ENDPOINTS.user.verifyEmail, { token });
export const resendVerification = (email: string) =>
  api.post<{ message: string }>(API_ENDPOINTS.user.resendVerification, { email });
export const forgotPassword = (email: string) =>
  api.post<{ message: string }>(API_ENDPOINTS.user.forgotPassword, { email });
export const resetPassword = (payload: { token: string; password: string }) =>
  api.post<{ message: string }>(API_ENDPOINTS.user.resetPassword, payload);
