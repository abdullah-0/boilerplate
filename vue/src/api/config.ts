const DEFAULT_API_BASE_URL = "http://localhost:8000/api/v1";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;

export const API_ENDPOINTS = {
  user: {
    register: "/user/register",
    login: "/user/login",
    refresh: "/user/refresh",
    resendVerification: "/user/resend-verification",
    verifyEmail: "/user/verify-email",
    forgotPassword: "/user/forgot-password",
    resetPassword: "/user/reset-password",
    profile: "/user/me",
    updateProfile: "/user/me",
  },
  teams: {
    root: "/teams",
    invite: (teamId: number | string) => `/teams/${teamId}/invite`,
    member: (teamId: number | string, memberId: number | string) =>
      `/teams/${teamId}/members/${memberId}`,
  },
} as const;

const deriveApiOrigin = (baseUrl: string) => {
  try {
    const url = new URL(baseUrl);
    url.pathname = "/";
    return url;
  } catch {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.origin);
      url.pathname = "/";
      return url;
    }
    return new URL("http://localhost:8000");
  }
};

export const buildNotificationsUrl = (token: string) => {
  const origin = deriveApiOrigin(API_BASE_URL);
  origin.pathname = "/ws/notifications";
  origin.search = `token=${encodeURIComponent(token)}`;
  origin.protocol = origin.protocol === "https:" ? "wss:" : "ws:";
  return origin.toString();
};

export type ApiEndpoints = typeof API_ENDPOINTS;
