import React from 'react';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Clock, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight
} from 'lucide-react';
import type { Task, TaskPriority, TaskStatus } from '../../types';
import { PriorityBadge, TypeBadge } from '../common/Badge';
import { UserAvatar } from '../common/UserAvatar';
import { useAuth } from '../../context/AuthContext';

interface TaskListViewProps {
  tasks: Task[];
  totalTasks: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: string) => void;
  selectedTaskIds: string[];
  onToggleSelectTask: (taskId: string) => void;
  onToggleSelectAll: () => void;
  onSelectTask: (task: Task) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onUpdatePriority: (taskId: string, priority: TaskPriority) => void;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  totalTasks,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sortBy,
  sortOrder,
  onSortChange,
  selectedTaskIds,
  onToggleSelectTask,
  onToggleSelectAll,
  onSelectTask,
  onUpdateStatus,
  onUpdatePriority,
}) => {
  const { user } = useAuth();
  const canEdit = user?.role !== 'VIEWER';

  const isAllSelected = tasks.length > 0 && selectedTaskIds.length === tasks.length;
  const isPartiallySelected = selectedTaskIds.length > 0 && selectedTaskIds.length < tasks.length;

  const totalPages = Math.ceil(totalTasks / pageSize) || 1;

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-zinc-900 dark:text-zinc-100" />
    ) : (
      <ArrowDown className="w-3 h-3 text-zinc-900 dark:text-zinc-100" />
    );
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden flex flex-col">
      {/* Table Container */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50/70 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-medium uppercase tracking-wider text-zinc-500 select-none">
              <th className="py-2.5 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isPartiallySelected;
                  }}
                  onChange={onToggleSelectAll}
                  className="w-3.5 h-3.5 rounded text-zinc-900 focus:ring-0 border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800"
                />
              </th>

              <th
                onClick={() => onSortChange('code')}
                className="py-2.5 px-3 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group"
              >
                <div className="flex items-center gap-1">
                  <span>Code</span>
                  {renderSortIcon('code')}
                </div>
              </th>

              <th
                onClick={() => onSortChange('title')}
                className="py-2.5 px-3 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group min-w-[240px]"
              >
                <div className="flex items-center gap-1">
                  <span>Title</span>
                  {renderSortIcon('title')}
                </div>
              </th>

              <th
                onClick={() => onSortChange('status')}
                className="py-2.5 px-3 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group"
              >
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  {renderSortIcon('status')}
                </div>
              </th>

              <th
                onClick={() => onSortChange('priority')}
                className="py-2.5 px-3 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group"
              >
                <div className="flex items-center gap-1">
                  <span>Priority</span>
                  {renderSortIcon('priority')}
                </div>
              </th>

              <th className="py-2.5 px-3">Assignee</th>

              <th
                onClick={() => onSortChange('dueDate')}
                className="py-2.5 px-3 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group"
              >
                <div className="flex items-center gap-1">
                  <span>Due Date</span>
                  {renderSortIcon('dueDate')}
                </div>
              </th>

              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
            {tasks.map((task) => {
              const isSelected = selectedTaskIds.includes(task.id);
              const isOverdue =
                task.dueDate &&
                new Date(task.dueDate) < new Date() &&
                task.status !== 'DONE' &&
                task.status !== 'CANCELLED';

              const completedSubtasks = task.subtasks?.filter((s) => s.isCompleted).length || 0;
              const totalSubtasks = task.subtasks?.length || 0;

              return (
                <tr
                  key={task.id}
                  className={`hover:bg-zinc-50 dark:hover:bg-zinc-850/60 transition-colors ${
                    isSelected ? 'bg-zinc-100/60 dark:bg-zinc-800/40' : ''
                  }`}
                >
                  {/* Select Checkbox */}
                  <td className="py-2 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectTask(task.id)}
                      className="w-3.5 h-3.5 rounded text-zinc-900 focus:ring-0 border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800"
                    />
                  </td>

                  {/* Task Code */}
                  <td className="py-2 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <TypeBadge type={task.type} />
                      <button
                        onClick={() => onSelectTask(task)}
                        className="font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      >
                        {task.code}
                      </button>
                    </div>
                  </td>

                  {/* Title & Subtasks */}
                  <td className="py-2 px-3">
                    <div
                      onClick={() => onSelectTask(task)}
                      className="cursor-pointer group/title"
                    >
                      <p className="font-medium text-zinc-900 dark:text-zinc-100 group-hover/title:text-zinc-600 dark:group-hover/title:text-zinc-300 transition-colors line-clamp-1">
                        {task.title}
                      </p>
                      {totalSubtasks > 0 && (
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {completedSubtasks}/{totalSubtasks} checklist
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-2 px-3 whitespace-nowrap">
                    <select
                      value={task.status}
                      disabled={!canEdit}
                      onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskStatus)}
                      className="text-xs rounded px-2 py-0.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none"
                    >
                      <option value="BACKLOG">Backlog</option>
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="IN_REVIEW">In Review</option>
                      <option value="DONE">Done</option>
                    </select>
                  </td>

                  {/* Priority Dropdown */}
                  <td className="py-2 px-3 whitespace-nowrap">
                    <select
                      value={task.priority}
                      disabled={!canEdit}
                      onChange={(e) => onUpdatePriority(task.id, e.target.value as TaskPriority)}
                      className="text-xs rounded px-2 py-0.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </td>

                  {/* Assignee */}
                  <td className="py-2 px-3 whitespace-nowrap">
                    {task.assignee ? (
                      <div className="flex items-center gap-1.5">
                        <UserAvatar user={task.assignee} size="xs" />
                        <span className="text-xs text-zinc-700 dark:text-zinc-300">
                          {task.assignee.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-zinc-400">Unassigned</span>
                    )}
                  </td>

                  {/* Due Date */}
                  <td className="py-2 px-3 whitespace-nowrap">
                    {task.dueDate ? (
                      <div
                        className={`flex items-center gap-1 text-[11px] font-mono ${
                          isOverdue
                            ? 'text-red-600 dark:text-red-400 font-medium'
                            : 'text-zinc-500'
                        }`}
                      >
                        {isOverdue && <AlertCircle className="w-3 h-3 text-red-500" />}
                        <span>
                          {new Date(task.dueDate).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-zinc-400 text-[11px]">-</span>
                    )}
                  </td>

                  {/* Action inspect */}
                  <td className="py-2 px-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => onSelectTask(task)}
                      className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}

            {tasks.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-zinc-400 text-xs">
                  No tasks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-3.5 py-2 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500 bg-zinc-50/50 dark:bg-zinc-900">
        <div className="flex items-center gap-1.5 text-[11px]">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
            className="px-1.5 py-0.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-700 dark:text-zinc-300"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <span>per page • {totalTasks} total</span>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-mono">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1 rounded border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 text-zinc-700 dark:text-zinc-300">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1 rounded border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
