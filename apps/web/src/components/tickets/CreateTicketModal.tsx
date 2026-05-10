import type { FC } from "react";
import { useForm } from "react-hook-form";
import { Modal } from "../ui/Modal";
import { useCreateTicket } from "../../hooks/useTickets";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  columnId: string;
}

interface FormValues {
  title: string;
  description?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export const CreateTicketModal: FC<Props> = ({ isOpen, onClose, boardId, columnId }) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: { priority: "MEDIUM" },
  });
  const createTicket = useCreateTicket(boardId);

  const onSubmit = async (values: FormValues) => {
    await createTicket.mutateAsync({ ...values, boardId, columnId });
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Ticket">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Title *</label>
          <input
            className="input"
            placeholder="Ticket title..."
            {...register("title", { required: "Title is required" })}
          />
          {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            className="input h-24 resize-none"
            placeholder="Optional description..."
            {...register("description")}
          />
        </div>

        <div>
          <label className="label">Priority</label>
          <select className="input" {...register("priority")}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? "Creating..." : "Create Ticket"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
