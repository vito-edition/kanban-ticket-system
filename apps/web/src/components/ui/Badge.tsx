import type { FC, ReactNode } from "react";
import { clsx } from "clsx";
import type { TicketPriority } from "../../types";

interface Props {
  children: ReactNode;
  variant?: "default" | "priority";
  priority?: TicketPriority;
  color?: string;
  className?: string;
}

const priorityClasses: Record<TicketPriority, string> = {
  CRITICAL: "badge-critical",
  HIGH: "badge-high",
  MEDIUM: "badge-medium",
  LOW: "badge-low",
};

export const Badge: FC<Props> = ({ children, variant, priority, color, className }) => {
  if (variant === "priority" && priority) {
    return <span className={clsx("badge", priorityClasses[priority], className)}>{children}</span>;
  }
  if (color) {
    return (
      <span
        className={clsx("badge", className)}
        style={{ backgroundColor: `${color}20`, color }}
      >
        {children}
      </span>
    );
  }
  return <span className={clsx("badge bg-gray-100 text-gray-700", className)}>{children}</span>;
};
