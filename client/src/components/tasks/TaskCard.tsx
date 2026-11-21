import React from 'react';
import { 
  CheckSquare, 
  MessageSquare, 
  Paperclip, 
  Clock, 
  AlertCircle
} from 'lucide-react';
import type { Task } from '../../types';
import { PriorityBadge, TypeBadge } from '../common/Badge';
import { UserAvatar } from '../common/UserAvatar';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onDragStart?: (e: React.DragEvent, taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, onDragStart }) => {
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== 'DONE' &&
    task.status !== 'CANCELLED';

  const isDueToday =
    task.dueDate &&
    new Date(task.dueDate).toDateString() === new Date().toDateString() &&
    task.status !== 'DONE';

  const completedSubtasks = task.subtasks?.filter((s) => s.isCompleted).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart && onDragStart(e, task.id)}
      onClick={onClick}
      className="group relative bg-white dark:bg-zinc-900 p-3 rounded-md border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors cursor-pointer select-none"
    >
      {/* Top row: Code + Type + Priority */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5">
          <TypeBadge type={task.type} />
          <span className="font-mono text-[11px] font-medium text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
            {task.code}
          </span>
          {task.project && (
            <span className="text-[10px] font-mono text-zinc-400">
              {task.project.key}
            </span>
          )}
        </div>
        <PriorityBadge priority={task.priority} size="sm" />
      </div>

      {/* Title */}
      <h4 className="text-xs font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-relaxed">
        {task.title}
      </h4>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.tags.map((tag) => (
            <span
              key={tag.id}
              className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Subtasks Progress */}
      {totalSubtasks > 0 && (
        <div className="mt-2.5">
          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono mb-1">
            <span className="flex items-center gap-1">
              <CheckSquare className="w-3 h-3" />
              Checklist
            </span>
            <span>
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1 overflow-hidden">
            <div
              className={`h-1 rounded-full ${
                completedSubtasks === totalSubtasks
                  ? 'bg-emerald-600 dark:bg-emerald-400'
                  : 'bg-zinc-500'
              }`}
              style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Card Footer */}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-zinc-400">
        <div className="flex items-center gap-2 text-xs">
          {task.dueDate && (
            <div
              className={`flex items-center gap-1 text-[10px] font-mono ${
                isOverdue
                  ? 'text-red-600 dark:text-red-400 font-medium'
                  : isDueToday
                  ? 'text-amber-600 dark:text-amber-400 font-medium'
                  : 'text-zinc-400'
              }`}
              title={isOverdue ? 'Overdue' : isDueToday ? 'Due Today' : 'Due Date'}
            >
              {isOverdue ? (
                <AlertCircle className="w-3 h-3 text-red-500" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
              <span>
                {new Date(task.dueDate).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}

          {(task._count?.comments || 0) > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] font-mono text-zinc-400">
              <MessageSquare className="w-3 h-3" />
              {task._count?.comments}
            </span>
          )}

          {(task._count?.attachments || 0) > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] font-mono text-zinc-400">
              <Paperclip className="w-3 h-3" />
              {task._count?.attachments}
            </span>
          )}
        </div>

        {/* Assignee */}
        <div className="flex items-center">
          {task.assignee ? (
            <UserAvatar user={task.assignee} size="xs" />
          ) : (
            <div
              className="w-5 h-5 rounded-full border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-[10px] text-zinc-400"
              title="Unassigned"
            >
              -
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
