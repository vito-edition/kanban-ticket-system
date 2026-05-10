import type { FC } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { clsx } from "clsx";
import { format, isPast, isToday } from "date-fns";
import type { Ticket } from "../../types";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";

interface Props {
  ticket: Ticket;
  onClick?: () => void;
}

const PRIORITY_DOT: Record<Ticket["priority"], string> = {
  CRITICAL: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-green-500",
};

export const TicketCard: FC<Props> = ({ ticket, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
    data: { type: "ticket", ticket },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isDue = ticket.dueDate && isPast(new Date(ticket.dueDate)) && ticket.status !== "DONE";
  const isDueToday = ticket.dueDate && isToday(new Date(ticket.dueDate));

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={clsx(
        "card p-3 cursor-pointer hover:shadow-md transition-shadow select-none group",
        isDragging && "opacity-50 shadow-lg rotate-1 scale-105",
        ticket.slaBreached && "border-red-300 bg-red-50"
      )}
    >
      <div className="flex items-start gap-2 mb-2">
        <div className={clsx("w-2 h-2 rounded-full mt-1 flex-shrink-0", PRIORITY_DOT[ticket.priority])} />
        <p className="text-sm font-medium text-gray-900 leading-snug flex-1">{ticket.title}</p>
      </div>

      {ticket.labels && ticket.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {ticket.labels.map(({ label }) => (
            <Badge key={label.id} color={label.color}>{label.name}</Badge>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {ticket._count?.comments !== undefined && ticket._count.comments > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {ticket._count.comments}
            </span>
          )}
          {ticket.dueDate && (
            <span className={clsx(
              "flex items-center gap-1",
              isDue ? "text-red-600" : isDueToday ? "text-orange-600" : ""
            )}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {format(new Date(ticket.dueDate), "MMM d")}
            </span>
          )}
          {ticket.slaBreached && (
            <span className="text-red-600 font-medium">SLA!</span>
          )}
        </div>

        {ticket.assignee && (
          <Avatar name={ticket.assignee.name} src={ticket.assignee.avatarUrl} size="xs" />
        )}
      </div>
    </div>
  );
};
