"use client";

import axios, { AxiosError, AxiosRequestConfig } from "axios";

import { API_BASE_URL, API_ENDPOINTS } from "@/lib/config";

type RetriableRequestConfig = AxiosRequestConfig & { _retry?: boolean };

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let subscribers: Array<(token: string) => void> = [];

const addSubscriber = (callback: (token: string) => void) => {
  subscribers.push(callback);
};

const onRefreshed = (token: string) => {
  subscribers.forEach((callback) => callback(token));
  subscribers = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (!error.response) {
      return Promise.reject(error);
    }

    const { status } = error.response;
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          addSubscriber((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = window.localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("Missing refresh token");
        }

        const { data } = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.user.refresh}`, {
          refresh: refreshToken,
        });
        window.localStorage.setItem("accessToken", data.access);
        window.localStorage.setItem("refreshToken", data.refresh);
        api.defaults.headers.common.Authorization = `Bearer ${data.access}`;
        onRefreshed(data.access);
        return api(originalRequest);
      } catch (refreshError) {
        window.localStorage.removeItem("accessToken");
        window.localStorage.removeItem("refreshToken");
        window.dispatchEvent(new Event("auth:logout"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
