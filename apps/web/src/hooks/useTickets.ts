import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import type { Ticket, ApiResponse } from "../types";
import toast from "react-hot-toast";

interface CreateTicketPayload {
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  priority?: Ticket["priority"];
  assigneeId?: string;
  dueDate?: string;
  labelIds?: string[];
}

export function useTickets(params?: Record<string, string | number | boolean | undefined>) {
  return useQuery({
    queryKey: ["tickets", params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Ticket[]>>("/tickets", { params });
      return data.data ?? [];
    },
  });
}

export function useTicket(ticketId: string | undefined) {
  return useQuery({
    queryKey: ["tickets", ticketId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Ticket>>(`/tickets/${ticketId}`);
      return data.data!;
    },
    enabled: !!ticketId,
  });
}

export function useCreateTicket(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTicketPayload) => {
      const { data } = await api.post<ApiResponse<Ticket>>("/tickets", payload);
      return data.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boards", boardId] });
      toast.success("Ticket created");
    },
  });
}

export function useUpdateTicket(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, ...payload }: Partial<Ticket> & { ticketId: string }) => {
      const { data } = await api.patch<ApiResponse<Ticket>>(`/tickets/${ticketId}`, payload);
      return data.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boards", boardId] });
    },
  });
}

export function useMoveTicket(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, columnId, position }: { ticketId: string; columnId: string; position: number }) => {
      const { data } = await api.patch<ApiResponse<Ticket>>(`/tickets/${ticketId}/move`, { columnId, position });
      return data.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boards", boardId] });
    },
  });
}

export function useDeleteTicket(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ticketId: string) => api.delete(`/tickets/${ticketId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boards", boardId] });
      toast.success("Ticket deleted");
    },
  });
}
