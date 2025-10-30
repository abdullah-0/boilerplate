import { createApi } from "@reduxjs/toolkit/query/react";

import { axiosBaseQuery } from "@/api/axiosBaseQuery";
import type {
  AuthResponse,
  Credentials,
  RegisterPayload,
  TokenResponse,
  User,
  UpdateProfilePayload,
} from "@/types/user/userTypes";
import { USER_ENDPOINTS } from "./endpoints";

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Profile"],
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, RegisterPayload>({
      query: (payload) => ({
        url: USER_ENDPOINTS.register,
        method: "POST",
        data: payload,
      }),
      invalidatesTags: ["Profile"],
    }),
    login: builder.mutation<AuthResponse, Credentials>({
      query: (payload) => ({
        url: USER_ENDPOINTS.login,
        method: "POST",
        data: payload,
      }),
      invalidatesTags: ["Profile"],
    }),
    refreshToken: builder.mutation<TokenResponse, string>({
      query: (refresh) => ({
        url: USER_ENDPOINTS.refresh,
        method: "POST",
        data: { refresh },
      }),
    }),
    forgotPassword: builder.mutation<{ message: string }, string>({
      query: (email) => ({
        url: USER_ENDPOINTS.forgotPassword,
        method: "POST",
        data: { email },
      }),
    }),
    resetPassword: builder.mutation<{ message: string }, { token: string; password: string }>({
      query: ({ token, password }) => ({
        url: USER_ENDPOINTS.resetPassword,
        method: "POST",
        data: { token, password },
      }),
    }),
    resendVerification: builder.mutation<{ message: string }, string>({
      query: (email) => ({
        url: USER_ENDPOINTS.resendVerification,
        method: "POST",
        data: { email },
      }),
    }),
    verifyEmail: builder.mutation<{ message: string }, string>({
      query: (token) => ({
        url: USER_ENDPOINTS.verifyEmail,
        method: "POST",
        data: { token },
      }),
    }),
    getProfile: builder.query<User, void>({
      query: () => ({
        url: USER_ENDPOINTS.profile,
        method: "GET",
      }),
      providesTags: ["Profile"],
    }),
    updateProfile: builder.mutation<User, UpdateProfilePayload>({
      query: (payload) => ({
        url: USER_ENDPOINTS.updateProfile,
        method: "PATCH",
        data: payload,
      }),
      invalidatesTags: ["Profile"],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useResendVerificationMutation,
  useVerifyEmailMutation,
  useGetProfileQuery,
  useLazyGetProfileQuery,
  useRefreshTokenMutation,
  useUpdateProfileMutation,
} = userApi;
