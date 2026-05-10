import type { FC } from "react";
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useBoard } from "../hooks/useBoards";
import { KanbanBoard } from "../components/kanban/KanbanBoard";
import { CreateTicketModal } from "../components/tickets/CreateTicketModal";

export const BoardPage: FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const { data: board, isLoading, error } = useBoard(boardId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const handleAddTicket = (columnId: string) => {
    setTargetColumnId(columnId);
    setIsCreateOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-gray-500">Board not found</p>
        <Link to="/" className="btn-secondary">Back to Dashboard</Link>
      </div>
    );
  }

  const firstColumnId = board.columns?.[0]?.id ?? "";

  return (
    <div className="flex flex-col h-screen">
      {/* Board header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: board.color }} />
          <h1 className="font-bold text-gray-900 text-lg">{board.name}</h1>
          {board.description && (
            <span className="text-sm text-gray-500 hidden md:block">— {board.description}</span>
          )}
        </div>
        <button
          onClick={() => { setTargetColumnId(firstColumnId); setIsCreateOpen(true); }}
          className="btn-primary"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Ticket
        </button>
      </div>

      {/* Board content */}
      <div className="flex-1 overflow-auto bg-gradient-to-b from-gray-50 to-gray-100">
        <KanbanBoard
          board={board}
          onTicketClick={setSelectedTicketId}
          onAddTicket={handleAddTicket}
        />
      </div>

      {isCreateOpen && targetColumnId && (
        <CreateTicketModal
          isOpen={isCreateOpen}
          onClose={() => { setIsCreateOpen(false); setTargetColumnId(null); }}
          boardId={board.id}
          columnId={targetColumnId}
        />
      )}
    </div>
  );
};
