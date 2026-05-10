import axios from "axios";
import type { AxiosInstance } from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export const api: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${BASE_URL}/api/v1/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken: string = data.data.accessToken;
        useAuthStore.getState().setAccessToken(newToken);
        refreshQueue.forEach((cb) => cb(newToken));
        refreshQueue = [];
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        refreshQueue = [];
        useAuthStore.getState().clearAuth();
        window.location.href = "/login";
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status !== 401) {
      const message = error.response?.data?.message ?? "Something went wrong";
      toast.error(message);
    }

    return Promise.reject(error);
  }
);
