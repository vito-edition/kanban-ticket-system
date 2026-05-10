import type { FC } from "react";
import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import type { Board, Ticket } from "../../types";
import { KanbanColumn } from "./KanbanColumn";
import { TicketCard } from "./TicketCard";
import { useMoveTicket } from "../../hooks/useTickets";

interface Props {
  board: Board;
  onTicketClick?: (ticketId: string) => void;
  onAddTicket?: (columnId: string) => void;
}

export const KanbanBoard: FC<Props> = ({ board, onTicketClick, onAddTicket }) => {
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const moveTicket = useMoveTicket(board.id);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.type === "ticket") setActiveTicket(data.ticket as Ticket);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTicket(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeData = active.data.current;
      const overData = over.data.current;
      if (!activeData || activeData.type !== "ticket") return;

      const ticket = activeData.ticket as Ticket;
      let targetColumnId: string;
      let targetPosition: number;

      if (overData?.type === "column") {
        targetColumnId = over.id as string;
        const col = board.columns?.find((c) => c.id === targetColumnId);
        targetPosition = (col?.tickets?.length ?? 0);
      } else if (overData?.type === "ticket") {
        const overTicket = overData.ticket as Ticket;
        targetColumnId = overTicket.columnId;
        targetPosition = overTicket.position;
      } else {
        return;
      }

      if (targetColumnId === ticket.columnId && targetPosition === ticket.position) return;

      moveTicket.mutate({ ticketId: ticket.id, columnId: targetColumnId, position: targetPosition });
    },
    [board.columns, moveTicket]
  );

  const columns = board.columns ?? [];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 p-6 overflow-x-auto min-h-full pb-10">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            onTicketClick={onTicketClick}
            onAddTicket={onAddTicket}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTicket && <TicketCard ticket={activeTicket} />}
      </DragOverlay>
    </DndContext>
  );
};
