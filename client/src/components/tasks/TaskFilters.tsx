import React from 'react';
import { Search, X, FileSpreadsheet, FileCode } from 'lucide-react';
import type { Task } from '../../types';

export interface FilterState {
  search: string;
  status: string;
  priority: string;
  assigneeId: string;
  dueDateRange: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface TaskFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  availableUsers?: any[];
  tasksToExport?: Task[];
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  onChange,
  availableUsers = [],
  tasksToExport = [],
}) => {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== 'ALL' ||
    filters.priority !== 'ALL' ||
    filters.assigneeId !== '' ||
    filters.dueDateRange !== '';

  const handleReset = () => {
    onChange({
      search: '',
      status: 'ALL',
      priority: 'ALL',
      assigneeId: '',
      dueDateRange: '',
      sortBy: 'orderIndex',
      sortOrder: 'asc',
    });
  };

  const handleExportCSV = () => {
    if (tasksToExport.length === 0) return;
    const headers = [
      'Task Code',
      'Title',
      'Project',
      'Status',
      'Priority',
      'Type',
      'Assignee',
      'Due Date',
      'Estimated Hours',
      'Actual Hours',
      'Subtasks Progress',
      'Created At',
    ];

    const rows = tasksToExport.map((t) => [
      `"${t.code}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.project?.name || ''}"`,
      `"${t.status}"`,
      `"${t.priority}"`,
      `"${t.type}"`,
      `"${t.assignee?.name || 'Unassigned'}"`,
      `"${t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : ''}"`,
      t.estimatedHours || 0,
      t.actualHours || 0,
      `"${t.subtasks ? `${t.subtasks.filter((s) => s.isCompleted).length}/${t.subtasks.length}` : '0/0'}"`,
      `"${new Date(t.createdAt).toISOString()}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TaskFlow_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (tasksToExport.length === 0) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(tasksToExport, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `TaskFlow_Export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800 p-2.5 shadow-xs space-y-2">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, description, code..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full pl-8 pr-7 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Status */}
          <select
            value={filters.status}
            onChange={(e) => onChange({ ...filters, status: e.target.value })}
            className="px-2 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="BACKLOG">Backlog</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
          </select>

          {/* Priority */}
          <select
            value={filters.priority}
            onChange={(e) => onChange({ ...filters, priority: e.target.value })}
            className="px-2 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none"
          >
            <option value="ALL">All Priority</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Assignee */}
          <select
            value={filters.assigneeId}
            onChange={(e) => onChange({ ...filters, assigneeId: e.target.value })}
            className="px-2 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none"
          >
            <option value="">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          {/* Due date presets */}
          <select
            value={filters.dueDateRange}
            onChange={(e) => onChange({ ...filters, dueDateRange: e.target.value })}
            className="px-2 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none"
          >
            <option value="">Any Due Date</option>
            <option value="overdue">Overdue</option>
            <option value="today">Due Today</option>
            <option value="this_week">Due This Week</option>
          </select>

          {/* Reset button */}
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
            >
              <X className="w-3 h-3" />
              Reset
            </button>
          )}

          {/* Export dropdown */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded transition-colors"
              title="Export CSV"
            >
              <FileSpreadsheet className="w-3 h-3 text-zinc-500" />
              <span>CSV</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded transition-colors"
              title="Export JSON"
            >
              <FileCode className="w-3 h-3 text-zinc-500" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
