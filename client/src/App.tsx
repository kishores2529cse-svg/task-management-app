import React, { useState, useEffect, useCallback } from 'react';
import { 
  ThemeProvider 
} from './context/ThemeContext';
import { 
  ToastProvider, 
  useToast 
} from './context/ToastContext';
import { 
  AuthProvider, 
  useAuth 
} from './context/AuthContext';
import { 
  SocketProvider, 
  useSocket 
} from './context/SocketContext';
import { 
  ProjectProvider, 
  useProject 
} from './context/ProjectContext';

import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { CommandPalette } from './components/common/CommandPalette';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ProfileModal } from './components/auth/ProfileModal';
import { ProjectModal } from './components/projects/ProjectModal';
import { TaskModal } from './components/tasks/TaskModal';
import { TaskDetailDrawer } from './components/tasks/TaskDetailDrawer';
import { TaskFilters, FilterState } from './components/tasks/TaskFilters';
import { TaskBulkActions } from './components/tasks/TaskBulkActions';
import { KanbanBoard } from './components/board/KanbanBoard';
import { TaskListView } from './components/list/TaskListView';
import { CalendarView } from './components/calendar/CalendarView';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { ActivityFeed } from './components/activity/ActivityFeed';
import { TeamManagement } from './components/team/TeamManagement';

import api from './services/api';
import type { Task, TaskPriority, TaskStatus, User } from './types';

const MainApp: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { socket } = useSocket();
  const { projects, selectedProjectId, setSelectedProjectId } = useProject();
  const { success, error } = useToast();

  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<string>('board');

  // Modals state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [createTaskDefaultStatus, setCreateTaskDefaultStatus] = useState<TaskStatus>('TODO');
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  // Selection for bulk operations
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Filters and pagination state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'ALL',
    priority: 'ALL',
    assigneeId: '',
    dueDateRange: '',
    sortBy: 'orderIndex',
    sortOrder: 'asc',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Fetch available users for assignments
  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setAvailableUsers(res.data.data.users);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  // Fetch tasks with filters
  const fetchTasks = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoadingTasks(true);
      const params = new URLSearchParams();

      if (selectedProjectId && selectedProjectId !== 'all') {
        params.append('projectId', selectedProjectId);
      }
      if (filters.status && filters.status !== 'ALL') {
        params.append('status', filters.status);
      }
      if (filters.priority && filters.priority !== 'ALL') {
        params.append('priority', filters.priority);
      }
      if (filters.assigneeId) {
        params.append('assigneeId', filters.assigneeId);
      }
      if (filters.dueDateRange) {
        params.append('dueDateRange', filters.dueDateRange);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      params.append('page', String(currentPage));
      params.append('limit', String(pageSize));
      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);

      const res = await api.get(`/tasks?${params.toString()}`);
      setTasks(res.data.data.tasks);
      setTotalTasks(res.data.data.pagination.total);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [user, selectedProjectId, filters, currentPage, pageSize]);

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchUsers();
    }
  }, [user, fetchTasks]);

  // Real-time socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('task:created', (newTask: Task) => {
      setTasks((prev) => {
        if (prev.some((t) => t.id === newTask.id)) return prev;
        return [newTask, ...prev];
      });
      setTotalTasks((prev) => prev + 1);
    });

    socket.on('task:updated', (updatedTask: Task) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
      );
    });

    socket.on('task:status_changed', (data: { taskId: string; status: TaskStatus; task: Task }) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === data.taskId ? { ...t, ...data.task, status: data.status } : t
        )
      );
    });

    socket.on('task:deleted', ({ taskId }: { taskId: string }) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setTotalTasks((prev) => Math.max(0, prev - 1));
      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
      }
    });

    socket.on('tasks:batch_updated', () => {
      fetchTasks();
    });

    return () => {
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:status_changed');
      socket.off('task:deleted');
      socket.off('tasks:batch_updated');
    };
  }, [socket, selectedTaskId, fetchTasks]);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update status (used in Kanban & List)
  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
    } catch (err: any) {
      error('Failed to update status', err.response?.data?.message);
      fetchTasks();
    }
  };

  // Update priority
  const handleUpdatePriority = async (taskId: string, newPriority: TaskPriority) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, priority: newPriority } : t))
    );

    try {
      await api.put(`/tasks/${taskId}`, { priority: newPriority });
      success('Priority updated');
    } catch (err: any) {
      error('Failed to update priority', err.response?.data?.message);
      fetchTasks();
    }
  };

  // Bulk Operations Handlers
  const handleToggleSelectTask = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedTaskIds.length === tasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(tasks.map((t) => t.id));
    }
  };

  const handleBulkStatus = async (status: TaskStatus) => {
    try {
      await api.post('/tasks/batch', {
        taskIds: selectedTaskIds,
        action: 'update_status',
        value: status,
      });
      success(`Updated ${selectedTaskIds.length} tasks`);
      setSelectedTaskIds([]);
      fetchTasks();
    } catch (err: any) {
      error('Bulk update failed', err.response?.data?.message);
    }
  };

  const handleBulkPriority = async (priority: TaskPriority) => {
    try {
      await api.post('/tasks/batch', {
        taskIds: selectedTaskIds,
        action: 'update_priority',
        value: priority,
      });
      success(`Updated ${selectedTaskIds.length} tasks`);
      setSelectedTaskIds([]);
      fetchTasks();
    } catch (err: any) {
      error('Bulk update failed', err.response?.data?.message);
    }
  };

  const handleBulkAssignee = async (assigneeId: string) => {
    try {
      await api.post('/tasks/batch', {
        taskIds: selectedTaskIds,
        action: 'update_assignee',
        value: assigneeId,
      });
      success(`Reassigned ${selectedTaskIds.length} tasks`);
      setSelectedTaskIds([]);
      fetchTasks();
    } catch (err: any) {
      error('Bulk update failed', err.response?.data?.message);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedTaskIds.length} tasks?`)) return;
    try {
      await api.post('/tasks/batch', {
        taskIds: selectedTaskIds,
        action: 'delete',
      });
      success(`Deleted ${selectedTaskIds.length} tasks`);
      setSelectedTaskIds([]);
      fetchTasks();
    } catch (err: any) {
      error('Bulk delete failed', err.response?.data?.message);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-400">
        <div className="flex flex-col items-center gap-2 text-xs">
          <div className="w-5 h-5 border-2 border-zinc-900 dark:border-zinc-100 border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return authView === 'login' ? (
      <LoginPage onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <RegisterPage onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  const completedCount = tasks.filter((t) => t.status === 'DONE').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors">
      {/* Top Navbar */}
      <Navbar
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenCreateProject={() => setIsCreateProjectOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onSelectTaskById={(id) => setSelectedTaskId(id)}
      />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenCreateTask={() => {
            setCreateTaskDefaultStatus('TODO');
            setIsCreateTaskOpen(true);
          }}
          onOpenCreateProject={() => setIsCreateProjectOpen(true)}
          taskStats={{
            total: totalTasks,
            completed: completedCount,
            inProgress: inProgressCount,
          }}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Filters & Export Bar (Visible in Board and List views) */}
          {(activeTab === 'board' || activeTab === 'list') && (
            <TaskFilters
              filters={filters}
              onChange={(newFilters) => {
                setFilters(newFilters);
                setCurrentPage(1);
              }}
              availableUsers={availableUsers}
              tasksToExport={tasks}
            />
          )}

          {/* Active View Switching */}
          {activeTab === 'board' && (
            <KanbanBoard
              tasks={tasks}
              onSelectTask={(task) => setSelectedTaskId(task.id)}
              onUpdateStatus={handleUpdateStatus}
              onOpenCreateTaskWithStatus={(st) => {
                setCreateTaskDefaultStatus(st);
                setIsCreateTaskOpen(true);
              }}
            />
          )}

          {activeTab === 'list' && (
            <TaskListView
              tasks={tasks}
              totalTasks={totalTasks}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              sortBy={filters.sortBy}
              sortOrder={filters.sortOrder}
              onSortChange={(field) => {
                const isAsc = filters.sortBy === field && filters.sortOrder === 'asc';
                setFilters({
                  ...filters,
                  sortBy: field,
                  sortOrder: isAsc ? 'desc' : 'asc',
                });
              }}
              selectedTaskIds={selectedTaskIds}
              onToggleSelectTask={handleToggleSelectTask}
              onToggleSelectAll={handleToggleSelectAll}
              onSelectTask={(task) => setSelectedTaskId(task.id)}
              onUpdateStatus={handleUpdateStatus}
              onUpdatePriority={handleUpdatePriority}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              tasks={tasks}
              onSelectTask={(task) => setSelectedTaskId(task.id)}
              onOpenCreateTask={() => setIsCreateTaskOpen(true)}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsDashboard
              projectId={selectedProjectId}
              onSelectTask={(task) => setSelectedTaskId(task.id)}
            />
          )}

          {activeTab === 'activity' && (
            <ActivityFeed
              projectId={selectedProjectId}
              onSelectTask={(task) => setSelectedTaskId(task.id)}
            />
          )}

          {activeTab === 'team' && <TeamManagement />}
        </main>
      </div>

      {/* Floating Bulk Operations Toolbar */}
      <TaskBulkActions
        selectedCount={selectedTaskIds.length}
        onClearSelection={() => setSelectedTaskIds([])}
        onUpdateStatus={handleBulkStatus}
        onUpdatePriority={handleBulkPriority}
        onUpdateAssignee={handleBulkAssignee}
        onDeleteSelected={handleBulkDelete}
        availableUsers={availableUsers}
      />

      {/* Slide-Over Task Details Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        availableUsers={availableUsers}
        onTaskUpdated={(updated) => {
          setTasks((prev) =>
            prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
          );
        }}
        onTaskDeleted={(deletedId) => {
          setTasks((prev) => prev.filter((t) => t.id !== deletedId));
          setTotalTasks((prev) => Math.max(0, prev - 1));
          setSelectedTaskId(null);
        }}
      />

      {/* Create Task Modal */}
      <TaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        projects={projects}
        defaultProjectId={selectedProjectId}
        availableUsers={availableUsers}
        onTaskCreated={(newTask) => {
          setTasks((prev) => [newTask, ...prev]);
          setTotalTasks((prev) => prev + 1);
        }}
      />

      {/* Create Project Modal */}
      <ProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
      />

      {/* User Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tasks={tasks}
        projects={projects}
        onSelectTask={(task) => setSelectedTaskId(task.id)}
        onSelectProject={(pId) => setSelectedProjectId(pId)}
        onOpenCreateTask={() => setIsCreateTaskOpen(true)}
        onChangeTab={(tab) => setActiveTab(tab)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <ProjectProvider>
              <MainApp />
            </ProjectProvider>
          </SocketProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
