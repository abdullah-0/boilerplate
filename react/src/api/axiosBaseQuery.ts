import type { AxiosError, AxiosRequestConfig } from "axios";
import type { BaseQueryFn } from "@reduxjs/toolkit/query";

import apiClient from "./client";

export type AxiosBaseQueryArgs = {
  url: string;
  method?: AxiosRequestConfig["method"];
  data?: AxiosRequestConfig["data"];
  params?: AxiosRequestConfig["params"];
  headers?: AxiosRequestConfig["headers"];
  responseType?: AxiosRequestConfig["responseType"];
};

export type AxiosBaseQueryError = {
  status: number | string | undefined;
  data: unknown;
  message: string;
};

export const axiosBaseQuery = (): BaseQueryFn<
  AxiosBaseQueryArgs,
  unknown,
  AxiosBaseQueryError
> =>
  async ({ url, method = "get", data, params, headers, responseType }) => {
    try {
      const result = await apiClient.request({
        url,
        method,
        data,
        params,
        headers,
        responseType,
      });

      return { data: result.data };
    } catch (error) {
      const axiosError = error as AxiosError;
      return {
        error: {
          status: axiosError.response?.status ?? "FETCH_ERROR",
          data: axiosError.response?.data ?? axiosError.message,
          message: axiosError.message,
        },
      };
    }
  };
