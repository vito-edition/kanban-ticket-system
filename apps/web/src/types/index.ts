export type UserRole = "ADMIN" | "MANAGER" | "MEMBER";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TicketStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELLED";
export type BoardMemberRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
  createdAt?: string;
  lastLoginAt?: string | null;
}

export interface Board {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  members?: BoardMember[];
  columns?: Column[];
  labels?: Label[];
  _count?: { tickets: number };
}

export interface BoardMember {
  id: string;
  boardId: string;
  userId: string;
  role: BoardMemberRole;
  user?: Pick<User, "id" | "name" | "email" | "avatarUrl">;
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  position: number;
  color?: string | null;
  wipLimit?: number | null;
  isDefault: boolean;
  tickets?: Ticket[];
  _count?: { tickets: number };
}

export interface Ticket {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description?: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  position: number;
  storyPoints?: number | null;
  dueDate?: string | null;
  slaDeadline?: string | null;
  slaBreached: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  assignee?: Pick<User, "id" | "name" | "avatarUrl"> | null;
  creator?: Pick<User, "id" | "name">;
  labels?: TicketLabel[];
  column?: Pick<Column, "id" | "name">;
  _count?: { comments: number; attachments: number };
}

export interface TicketLabel {
  ticketId: string;
  labelId: string;
  label: Label;
}

export interface Label {
  id: string;
  boardId: string;
  name: string;
  color: string;
}

export interface Comment {
  id: string;
  ticketId: string;
  authorId: string;
  content: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  author: Pick<User, "id" | "name" | "avatarUrl">;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
