const DEFAULT_API_BASE_URL = "http://localhost:9000/api/v1";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;

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

export type ApiEndpointGroup = typeof API_ENDPOINTS;

const deriveApiOrigin = (baseUrl: string) => {
  try {
    const url = new URL(baseUrl);
    url.pathname = "/";
    return url;
  } catch {
    const fallback =
      typeof window !== "undefined" ? window.location.origin : "http://localhost:9000";
    return new URL(fallback);
  }
};

export const buildNotificationsUrl = (token: string) => {
  const base = deriveApiOrigin(API_BASE_URL);
  base.pathname = "/ws/notifications";
  base.search = `token=${encodeURIComponent(token)}`;
  base.protocol = base.protocol === "https:" ? "wss:" : "ws:";
  return base.toString();
};
