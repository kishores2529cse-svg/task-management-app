import React from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  Minus,
  AlertCircle,
  Sparkles,
  Bug,
  CheckSquare,
  Milestone,
  TrendingUp
} from 'lucide-react';
import type { TaskPriority, TaskStatus, TaskType } from '../../types';

export const PriorityBadge: React.FC<{ priority: TaskPriority; size?: 'sm' | 'md' }> = ({
  priority,
  size = 'sm',
}) => {
  const isSm = size === 'sm';
  const baseClasses = isSm
    ? 'px-1.5 py-0.5 text-[11px] font-medium rounded border inline-flex items-center gap-1 leading-none tracking-tight'
    : 'px-2 py-1 text-xs font-medium rounded-md border inline-flex items-center gap-1.5';

  switch (priority) {
    case 'URGENT':
      return (
        <span className={`${baseClasses} bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50`}>
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400" />
          Urgent
        </span>
      );
    case 'HIGH':
      return (
        <span className={`${baseClasses} bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50`}>
          <ArrowUp className={isSm ? 'w-3 h-3 text-amber-600' : 'w-3.5 h-3.5 text-amber-600'} />
          High
        </span>
      );
    case 'MEDIUM':
      return (
        <span className={`${baseClasses} bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700`}>
          <Minus className={isSm ? 'w-3 h-3 text-zinc-500' : 'w-3.5 h-3.5 text-zinc-500'} />
          Medium
        </span>
      );
    case 'LOW':
    default:
      return (
        <span className={`${baseClasses} bg-zinc-50 text-zinc-600 border-zinc-200/80 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800`}>
          <ArrowDown className={isSm ? 'w-3 h-3 text-zinc-400' : 'w-3.5 h-3.5 text-zinc-400'} />
          Low
        </span>
      );
  }
};

export const StatusBadge: React.FC<{ status: TaskStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'sm',
}) => {
  const isSm = size === 'sm';
  const baseClasses = isSm
    ? 'px-2 py-0.5 text-[11px] font-medium rounded border inline-flex items-center gap-1.5 leading-none'
    : 'px-2.5 py-1 text-xs font-medium rounded-md border inline-flex items-center gap-2';

  switch (status) {
    case 'BACKLOG':
      return (
        <span className={`${baseClasses} bg-zinc-100/80 text-zinc-600 border-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-400 dark:border-zinc-700`}>
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
          Backlog
        </span>
      );
    case 'TODO':
      return (
        <span className={`${baseClasses} bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700`}>
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
          To Do
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className={`${baseClasses} bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50`}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
          In Progress
        </span>
      );
    case 'IN_REVIEW':
      return (
        <span className={`${baseClasses} bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50`}>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400" />
          In Review
        </span>
      );
    case 'DONE':
      return (
        <span className={`${baseClasses} bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
          Done
        </span>
      );
    case 'CANCELLED':
      return (
        <span className={`${baseClasses} bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 line-through`}>
          <AlertCircle className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Cancelled
        </span>
      );
  }
};

export const TypeBadge: React.FC<{ type: TaskType }> = ({ type }) => {
  switch (type) {
    case 'BUG':
      return (
        <span className="p-0.5 rounded text-red-600 dark:text-red-400" title="Bug">
          <Bug className="w-3.5 h-3.5" />
        </span>
      );
    case 'FEATURE':
      return (
        <span className="p-0.5 rounded text-blue-600 dark:text-blue-400" title="Feature">
          <Sparkles className="w-3.5 h-3.5" />
        </span>
      );
    case 'IMPROVEMENT':
      return (
        <span className="p-0.5 rounded text-emerald-600 dark:text-emerald-400" title="Improvement">
          <TrendingUp className="w-3.5 h-3.5" />
        </span>
      );
    case 'MILESTONE':
      return (
        <span className="p-0.5 rounded text-amber-600 dark:text-amber-400" title="Milestone">
          <Milestone className="w-3.5 h-3.5" />
        </span>
      );
    case 'TASK':
    default:
      return (
        <span className="p-0.5 rounded text-zinc-500 dark:text-zinc-400" title="Task">
          <CheckSquare className="w-3.5 h-3.5" />
        </span>
      );
  }
};
