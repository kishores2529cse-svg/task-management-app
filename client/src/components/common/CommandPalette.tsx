import React, { useState, useEffect } from 'react';
import { Search, CheckSquare, Plus, Moon, Sun, BarChart3, ArrowRight } from 'lucide-react';
import type { Task, Project } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { PriorityBadge } from './Badge';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  projects: Project[];
  onSelectTask: (task: Task) => void;
  onSelectProject: (projectId: string) => void;
  onOpenCreateTask: () => void;
  onChangeTab: (tab: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  tasks,
  projects,
  onSelectTask,
  onSelectProject,
  onOpenCreateTask,
  onChangeTab,
}) => {
  const [query, setQuery] = useState('');
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredTasks = q
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      ).slice(0, 5)
    : tasks.slice(0, 4);

  const filteredProjects = q
    ? projects.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.key.toLowerCase().includes(q)
      ).slice(0, 3)
    : projects.slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative mx-auto max-w-xl transform rounded-lg bg-white dark:bg-zinc-900 shadow-md border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all animate-in zoom-in-95 duration-100">
        {/* Search Input */}
        <div className="relative flex items-center px-3.5 border-b border-zinc-200 dark:border-zinc-800">
          <Search className="w-4 h-4 text-zinc-400 mr-2.5 flex-shrink-0" />
          <input
            type="text"
            className="h-11 w-full bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-normal"
            placeholder="Search tasks, switch projects, run commands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {/* Quick Actions */}
          <div>
            <p className="px-2.5 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              Actions
            </p>
            <div className="space-y-0.5">
              <button
                onClick={() => {
                  onClose();
                  onOpenCreateTask();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors text-left"
              >
                <Plus className="w-3.5 h-3.5 text-zinc-400" />
                <span>Create new task</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onChangeTab('analytics');
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors text-left"
              >
                <BarChart3 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Go to Analytics</span>
              </button>

              <button
                onClick={() => {
                  toggleTheme();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors text-left"
              >
                {theme === 'dark' ? (
                  <Sun className="w-3.5 h-3.5 text-zinc-400" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <span>Toggle {theme === 'dark' ? 'light' : 'dark'} mode</span>
              </button>
            </div>
          </div>

          {/* Tasks */}
          {filteredTasks.length > 0 && (
            <div>
              <p className="px-2.5 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                Tasks
              </p>
              <div className="space-y-0.5">
                {filteredTasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onClose();
                      onSelectTask(t);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors text-left group"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200" />
                    <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                      {t.code}
                    </span>
                    <span className="truncate flex-1 font-medium">{t.title}</span>
                    <PriorityBadge priority={t.priority} size="sm" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {filteredProjects.length > 0 && (
            <div>
              <p className="px-2.5 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                Projects
              </p>
              <div className="space-y-0.5">
                {filteredProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onClose();
                      onSelectProject(p.id);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors text-left"
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="font-medium truncate">{p.name}</span>
                    <span className="font-mono text-[11px] text-zinc-400">({p.key})</span>
                    <span className="ml-auto text-[11px] text-zinc-400">
                      {p.stats?.totalTasks || 0} tasks
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
