import React from 'react';
import { Trash2, X } from 'lucide-react';
import type { TaskPriority, TaskStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface TaskBulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onUpdateStatus: (status: TaskStatus) => void;
  onUpdatePriority: (priority: TaskPriority) => void;
  onUpdateAssignee: (assigneeId: string) => void;
  onDeleteSelected: () => void;
  availableUsers?: any[];
}

export const TaskBulkActions: React.FC<TaskBulkActionsProps> = ({
  selectedCount,
  onClearSelection,
  onUpdateStatus,
  onUpdatePriority,
  onUpdateAssignee,
  onDeleteSelected,
  availableUsers = [],
}) => {
  const { user } = useAuth();
  if (selectedCount === 0) return null;

  const canDelete = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 bg-zinc-900 dark:bg-zinc-900 text-zinc-100 px-3.5 py-2 rounded-md shadow-lg border border-zinc-800 flex flex-wrap items-center gap-2.5 text-xs animate-in slide-in-from-bottom-2 duration-150">
      <div className="flex items-center gap-1.5 pr-2 border-r border-zinc-700">
        <span className="font-mono font-semibold text-white bg-zinc-800 px-1.5 py-0.2 rounded text-[11px]">
          {selectedCount}
        </span>
        <span className="text-zinc-400">selected</span>
      </div>

      {/* Bulk Status */}
      <div className="flex items-center gap-1">
        <span className="text-[11px] text-zinc-400">Status:</span>
        <select
          onChange={(e) => {
            if (e.target.value) {
              onUpdateStatus(e.target.value as TaskStatus);
              e.target.value = '';
            }
          }}
          defaultValue=""
          className="bg-zinc-800 border border-zinc-700 text-xs rounded px-2 py-0.5 text-zinc-200 focus:outline-none"
        >
          <option value="" disabled>Change...</option>
          <option value="BACKLOG">Backlog</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="DONE">Done</option>
        </select>
      </div>

      {/* Bulk Priority */}
      <div className="flex items-center gap-1">
        <span className="text-[11px] text-zinc-400">Priority:</span>
        <select
          onChange={(e) => {
            if (e.target.value) {
              onUpdatePriority(e.target.value as TaskPriority);
              e.target.value = '';
            }
          }}
          defaultValue=""
          className="bg-zinc-800 border border-zinc-700 text-xs rounded px-2 py-0.5 text-zinc-200 focus:outline-none"
        >
          <option value="" disabled>Change...</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>

      {/* Bulk Assignee */}
      <div className="flex items-center gap-1">
        <span className="text-[11px] text-zinc-400">Assign:</span>
        <select
          onChange={(e) => {
            if (e.target.value) {
              onUpdateAssignee(e.target.value);
              e.target.value = '';
            }
          }}
          defaultValue=""
          className="bg-zinc-800 border border-zinc-700 text-xs rounded px-2 py-0.5 text-zinc-200 focus:outline-none"
        >
          <option value="" disabled>Assign to...</option>
          {availableUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      {/* Bulk Delete */}
      {canDelete && (
        <button
          onClick={onDeleteSelected}
          className="flex items-center gap-1 px-2 py-0.5 bg-red-600/80 hover:bg-red-600 text-white text-[11px] font-medium rounded transition-colors ml-1"
        >
          <Trash2 className="w-3 h-3" />
          <span>Delete</span>
        </button>
      )}

      {/* Deselect */}
      <button
        onClick={onClearSelection}
        className="p-1 text-zinc-400 hover:text-white rounded transition-colors"
        title="Deselect all"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
