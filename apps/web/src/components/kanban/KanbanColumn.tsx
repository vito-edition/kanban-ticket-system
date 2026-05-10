import type { FC } from "react";
import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { clsx } from "clsx";
import type { Column } from "../../types";
import { TicketCard } from "./TicketCard";

interface Props {
  column: Column;
  onTicketClick?: (ticketId: string) => void;
  onAddTicket?: (columnId: string) => void;
}

export const KanbanColumn: FC<Props> = ({ column, onTicketClick, onAddTicket }) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { type: "column", column } });
  const tickets = column.tickets ?? [];
  const isOverLimit = column.wipLimit != null && tickets.length >= column.wipLimit;

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          {column.color && (
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }} />
          )}
          <h3 className="font-semibold text-gray-700 text-sm">{column.name}</h3>
          <span className={clsx(
            "badge ml-1",
            isOverLimit ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
          )}>
            {tickets.length}
            {column.wipLimit != null && `/${column.wipLimit}`}
          </span>
        </div>
        <button
          onClick={() => onAddTicket?.(column.id)}
          className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors"
          title="Add ticket"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={clsx(
          "flex-1 min-h-[200px] rounded-xl p-2 space-y-2 transition-colors",
          isOver ? "bg-primary-50 border-2 border-dashed border-primary-300" : "bg-gray-100/60"
        )}
      >
        <SortableContext items={tickets.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => onTicketClick?.(ticket.id)}
            />
          ))}
        </SortableContext>

        {tickets.length === 0 && (
          <div className="flex items-center justify-center h-24 text-sm text-gray-400">
            Drop tickets here
          </div>
        )}
      </div>
    </div>
  );
};
