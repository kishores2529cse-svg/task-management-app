import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Task, TaskStatus } from '../../types';
import { TaskCard } from '../tasks/TaskCard';
import { useAuth } from '../../context/AuthContext';

interface KanbanBoardProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
  onOpenCreateTaskWithStatus?: (status: TaskStatus) => void;
}

interface ColumnConfig {
  id: TaskStatus;
  title: string;
  dotColor: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: 'BACKLOG',
    title: 'Backlog',
    dotColor: 'bg-zinc-400',
  },
  {
    id: 'TODO',
    title: 'To Do',
    dotColor: 'bg-zinc-500',
  },
  {
    id: 'IN_PROGRESS',
    title: 'In Progress',
    dotColor: 'bg-blue-500',
  },
  {
    id: 'IN_REVIEW',
    title: 'In Review',
    dotColor: 'bg-purple-500',
  },
  {
    id: 'DONE',
    title: 'Done',
    dotColor: 'bg-emerald-500',
  },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onSelectTask,
  onUpdateStatus,
  onOpenCreateTaskWithStatus,
}) => {
  const { user } = useAuth();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const canEdit = user?.role !== 'VIEWER';

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    if (!canEdit) return;
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = (_e: React.DragEvent, status: TaskStatus) => {
    if (dragOverColumn === status) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== targetStatus) {
      onUpdateStatus(taskId, targetStatus);
    }
    setDraggedTaskId(null);
  };

  return (
    <div className="flex-1 overflow-x-auto pb-4">
      <div className="flex gap-3.5 min-w-[1100px] h-[calc(100vh-12rem)]">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          const isOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={(e) => handleDragLeave(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex-1 flex flex-col rounded-md bg-zinc-50/70 dark:bg-zinc-900/40 border transition-colors ${
                isOver
                  ? 'border-zinc-400 dark:border-zinc-600 bg-zinc-100/80 dark:bg-zinc-850/50'
                  : 'border-zinc-200 dark:border-zinc-800'
              }`}
            >
              {/* Column Header */}
              <div className="px-3 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900 rounded-t-md">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                  <h3 className="font-medium text-xs text-zinc-900 dark:text-zinc-100 tracking-tight">
                    {col.title}
                  </h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                    {colTasks.length}
                  </span>
                </div>

                {canEdit && onOpenCreateTaskWithStatus && (
                  <button
                    onClick={() => onOpenCreateTaskWithStatus(col.id)}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title={`Add task`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Tasks List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => onSelectTask(task)}
                    onDragStart={handleDragStart}
                  />
                ))}

                {colTasks.length === 0 && (
                  <div className="h-24 flex items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800/80 rounded text-zinc-400 text-xs font-normal">
                    Empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
