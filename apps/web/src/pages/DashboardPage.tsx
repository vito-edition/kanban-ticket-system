import type { FC } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useBoards, useCreateBoard, useDeleteBoard } from "../hooks/useBoards";
import { Modal } from "../components/ui/Modal";
import { useForm } from "react-hook-form";
import { useAuthStore } from "../store/authStore";

export const DashboardPage: FC = () => {
  const { data: boards, isLoading } = useBoards();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const deleteBoard = useDeleteBoard();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.name}</p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Board
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 h-36 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : boards?.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500 mb-4">No boards yet</p>
          <button onClick={() => setIsCreateOpen(true)} className="btn-primary">Create your first board</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards?.map((board) => (
            <div key={board.id} className="card p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ backgroundColor: board.color }} />
                  <div>
                    <Link
                      to={`/boards/${board.id}`}
                      className="font-semibold text-gray-900 hover:text-primary-600 block"
                    >
                      {board.name}
                    </Link>
                    {board._count && (
                      <p className="text-xs text-gray-500">{board._count.tickets} tickets</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Delete board "${board.name}"?`)) {
                      deleteBoard.mutate(board.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 rounded transition-all"
                  title="Delete board"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {board.description && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{board.description}</p>}

              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {board.members?.slice(0, 4).map(({ user: u }) => u && (
                    <div key={u.id} className="w-7 h-7 rounded-full bg-primary-500 border-2 border-white flex items-center justify-center text-xs text-white font-medium" title={u.name}>
                      {u.name[0]}
                    </div>
                  ))}
                </div>
                <Link to={`/boards/${board.id}`} className="text-xs text-primary-600 hover:underline font-medium">
                  Open →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateBoardModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
};

interface CreateBoardForm { name: string; description?: string; color?: string; }

const CreateBoardModal: FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const createBoard = useCreateBoard();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<CreateBoardForm>({
    defaultValues: { color: "#6366f1" },
  });

  const onSubmit = async (data: CreateBoardForm) => {
    await createBoard.mutateAsync(data);
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Board">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Board Name *</label>
          <input className="input" placeholder="My Project" {...register("name", { required: true })} />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input h-20 resize-none" placeholder="Optional description..." {...register("description")} />
        </div>
        <div>
          <label className="label">Color</label>
          <input type="color" className="h-10 w-full rounded-lg border border-gray-300 cursor-pointer p-1" {...register("color")} />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? "Creating..." : "Create Board"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
