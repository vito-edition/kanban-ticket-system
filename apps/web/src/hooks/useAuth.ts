import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { useAuthStore } from "../store/authStore";
import type { User, ApiResponse } from "../types";
import toast from "react-hot-toast";

interface LoginPayload { email: string; password: string; }
interface RegisterPayload { name: string; email: string; password: string; }

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const { data } = await api.post<ApiResponse<{ user: User; accessToken: string }>>("/auth/login", payload);
      return data.data!;
    },
    onSuccess: ({ user, accessToken }) => {
      setAuth(user, accessToken);
      toast.success(`Welcome back, ${user.name}!`);
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const { data } = await api.post<ApiResponse<{ user: User; accessToken: string }>>("/auth/register", payload);
      return data.data!;
    },
    onSuccess: ({ user, accessToken }) => {
      setAuth(user, accessToken);
      toast.success("Account created!");
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => api.post("/auth/logout"),
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
    },
  });
}

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<User>>("/auth/me");
      return data.data!;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}
