import React from 'react';
import { 
  Kanban, 
  ListOrdered, 
  Calendar, 
  BarChart3, 
  History, 
  Users, 
  Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenCreateTask: () => void;
  onOpenCreateProject: () => void;
  taskStats?: {
    total: number;
    completed: number;
    inProgress: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onOpenCreateTask,
  taskStats,
}) => {
  const { user } = useAuth();
  const { selectedProject } = useProject();

  const navItems = [
    { id: 'board', label: 'Board', icon: Kanban, badge: null },
    { id: 'list', label: 'List', icon: ListOrdered, badge: taskStats?.total },
    { id: 'calendar', label: 'Calendar', icon: Calendar, badge: null },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, badge: null },
    { id: 'activity', label: 'Audit Log', icon: History, badge: null },
    { id: 'team', label: 'Team', icon: Users, badge: null },
  ];

  const canCreate = user?.role !== 'VIEWER';

  return (
    <aside className="w-56 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/30 flex flex-col justify-between p-3 flex-shrink-0 min-h-[calc(100vh-3.25rem)] select-none">
      <div className="space-y-4">
        {/* Create Task Button */}
        {canCreate && (
          <button
            onClick={onOpenCreateTask}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium text-xs transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        )}

        {/* Navigation list */}
        <div className="space-y-0.5">
          <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Views
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs transition-colors ${
                  isActive
                    ? 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive
                      ? 'text-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`ml-auto text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      isActive
                        ? 'bg-zinc-300/80 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Workspace Summary Card */}
      <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
        <div className="p-2.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono mb-1">
            <span>{selectedProject ? selectedProject.key : 'WORKSPACE'}</span>
            <span>
              {taskStats && taskStats.total > 0
                ? `${Math.round((taskStats.completed / taskStats.total) * 100)}%`
                : '0%'}
            </span>
          </div>

          <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate mb-2">
            {selectedProject ? selectedProject.name : 'All Projects'}
          </p>

          {taskStats && (
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1 overflow-hidden">
              <div
                className="bg-zinc-700 dark:bg-zinc-300 h-1 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    taskStats.total > 0
                      ? (taskStats.completed / taskStats.total) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-1 text-[11px] text-zinc-400">
          <span>Role</span>
          <span className="font-mono text-zinc-600 dark:text-zinc-300 font-medium">
            {user?.role}
          </span>
        </div>
      </div>
    </aside>
  );
};
