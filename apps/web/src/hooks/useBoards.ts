import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import type { Board, ApiResponse } from "../types";
import toast from "react-hot-toast";

export function useBoards() {
  return useQuery({
    queryKey: ["boards"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Board[]>>("/boards");
      return data.data ?? [];
    },
  });
}

export function useBoard(boardId: string | undefined) {
  return useQuery({
    queryKey: ["boards", boardId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Board>>(`/boards/${boardId}`);
      return data.data!;
    },
    enabled: !!boardId,
  });
}

export function useCreateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; description?: string; color?: string }) => {
      const { data } = await api.post<ApiResponse<Board>>("/boards", payload);
      return data.data!;
    },
    onSuccess: (board) => {
      qc.invalidateQueries({ queryKey: ["boards"] });
      toast.success(`Board "${board.name}" created`);
    },
  });
}

export function useUpdateBoard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Board>) => {
      const { data } = await api.patch<ApiResponse<Board>>(`/boards/${boardId}`, payload);
      return data.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boards", boardId] });
      qc.invalidateQueries({ queryKey: ["boards"] });
    },
  });
}

export function useDeleteBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (boardId: string) => api.delete(`/boards/${boardId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boards"] });
      toast.success("Board deleted");
    },
  });
}
