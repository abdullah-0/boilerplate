import axios, { AxiosError, AxiosRequestConfig } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

type RetriableRequestConfig = AxiosRequestConfig & { _retry?: boolean };

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let queue: Array<(token: string) => void> = [];

const addToQueue = (callback: (token: string) => void) => {
  queue.push(callback);
};

const flushQueue = (token: string) => {
  queue.forEach((callback) => callback(token));
  queue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (!error.response) {
      return Promise.reject(error);
    }

    const { status } = error.response;
    const original = error.config as RetriableRequestConfig | undefined;

    if (!original) {
      return Promise.reject(error);
    }

    if (status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          addToQueue((token) => {
            if (original.headers) {
              original.headers.Authorization = `Bearer ${token}`;
            }
            resolve(api(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refresh = localStorage.getItem("refreshToken");
        if (!refresh) {
          throw new Error("Missing refresh token");
        }

        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refresh });
        localStorage.setItem("accessToken", data.access);
        localStorage.setItem("refreshToken", data.refresh);
        api.defaults.headers.common.Authorization = `Bearer ${data.access}`;
        flushQueue(data.access);
        return api(original);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
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
