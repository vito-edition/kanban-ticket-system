// Shared types between API and Web — keep these pure (no framework imports)

export type UserRole = "ADMIN" | "MANAGER" | "MEMBER";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TicketStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELLED";
export type BoardMemberRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  pagination?: Pagination;
}
