import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Moon, 
  Sun, 
  ChevronDown, 
  Plus, 
  LogOut, 
  User as UserIcon, 
  Check, 
  CheckSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useProject } from '../../context/ProjectContext';
import { useSocket } from '../../context/SocketContext';
import { UserAvatar } from './UserAvatar';
import { NotificationCenter } from '../notifications/NotificationCenter';

interface NavbarProps {
  onOpenCommandPalette: () => void;
  onOpenCreateProject: () => void;
  onOpenProfile: () => void;
  onSelectTaskById: (taskId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCommandPalette,
  onOpenCreateProject,
  onOpenProfile,
  onSelectTaskById,
}) => {
  const { user, logout, quickSwitch } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { projects, selectedProjectId, setSelectedProjectId, selectedProject } = useProject();
  const { onlineUsers } = useSocket();

  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-13 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 flex items-center justify-between transition-colors">
      {/* Left side: Logo & Workspace Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900">
            <CheckSquare className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 tracking-tight">
            TaskFlow
          </span>
        </div>

        <span className="text-zinc-300 dark:text-zinc-700">/</span>

        {/* Project Selector Dropdown */}
        <div className="relative" ref={projectDropdownRef}>
          <button
            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
            className="flex items-center gap-1.5 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200 text-xs font-medium transition-colors"
          >
            {selectedProject ? (
              <>
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: selectedProject.color }}
                />
                <span className="max-w-[140px] truncate">{selectedProject.name}</span>
                <span className="font-mono text-[10px] text-zinc-400">({selectedProject.key})</span>
              </>
            ) : (
              <span>All Projects</span>
            )}
            <ChevronDown className="w-3 h-3 text-zinc-400 ml-0.5" />
          </button>

          {isProjectDropdownOpen && (
            <div className="absolute left-0 mt-1 w-64 rounded-md bg-white dark:bg-zinc-900 shadow-md border border-zinc-200 dark:border-zinc-800 z-50 p-1.5 animate-in fade-in duration-100">
              <div className="px-2 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                Workspaces
              </div>

              <button
                onClick={() => {
                  setSelectedProjectId('all');
                  setIsProjectDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded transition-colors ${
                  selectedProjectId === 'all'
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <span>All Projects</span>
                {selectedProjectId === 'all' && <Check className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />}
              </button>

              <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

              <div className="max-h-52 overflow-y-auto space-y-0.5">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProjectId(p.id);
                      setIsProjectDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded transition-colors ${
                      selectedProjectId === p.id
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="truncate">{p.name}</span>
                      <span className="font-mono text-[10px] text-zinc-400">({p.key})</span>
                    </div>
                    {selectedProjectId === p.id && <Check className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400 flex-shrink-0" />}
                  </button>
                ))}
              </div>

              {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                <>
                  <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
                  <button
                    onClick={() => {
                      setIsProjectDropdownOpen(false);
                      onOpenCreateProject();
                    }}
                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded transition-colors font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Project</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Center: Command Palette Trigger */}
      <button
        onClick={onOpenCommandPalette}
        className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800/60 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs w-64 lg:w-80 border border-zinc-200 dark:border-zinc-700/60 transition-colors"
      >
        <Search className="w-3.5 h-3.5 text-zinc-400" />
        <span className="truncate">Search or type command...</span>
        <kbd className="ml-auto px-1 py-0.2 text-[10px] font-mono text-zinc-400 bg-white dark:bg-zinc-700 rounded border border-zinc-200 dark:border-zinc-600">
          ⌘K
        </kbd>
      </button>

      {/* Right side: Presence, Notifications, Theme, User Menu */}
      <div className="flex items-center gap-2">
        {/* Real-time online team presence */}
        {onlineUsers.length > 0 && (
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-normal">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{onlineUsers.length} online</span>
          </div>
        )}

        {/* Notification Bell */}
        <NotificationCenter onSelectTaskById={onSelectTaskById} />

        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800" />

        {/* User Profile Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-1.5 p-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <UserAvatar user={user} size="xs" showOnline={true} isOnline={true} />
            <span className="hidden xl:inline text-xs font-medium text-zinc-800 dark:text-zinc-200 max-w-[100px] truncate">
              {user?.name}
            </span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-1 w-56 rounded-md bg-white dark:bg-zinc-900 shadow-md border border-zinc-200 dark:border-zinc-800 z-50 p-1.5 animate-in fade-in duration-100">
              <div className="px-2.5 py-2 border-b border-zinc-100 dark:border-zinc-800">
                <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {user?.name}
                </p>
                <p className="text-[11px] text-zinc-400 truncate">{user?.email}</p>
                <div className="mt-1">
                  <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                    {user?.role}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors text-left"
                >
                  <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Profile Settings</span>
                </button>
              </div>

              {/* Persona Switcher (Clean, professional tabs without emojis) */}
              <div className="p-2 bg-zinc-50 dark:bg-zinc-850 rounded border border-zinc-100 dark:border-zinc-800 my-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 mb-1">
                  Switch Role:
                </p>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <button
                    onClick={() => {
                      quickSwitch('admin@taskflow.com');
                      setIsUserMenuOpen(false);
                    }}
                    className={`px-2 py-1 rounded text-left transition-colors font-medium ${
                      user?.email === 'admin@taskflow.com'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    Admin
                  </button>
                  <button
                    onClick={() => {
                      quickSwitch('manager@taskflow.com');
                      setIsUserMenuOpen(false);
                    }}
                    className={`px-2 py-1 rounded text-left transition-colors font-medium ${
                      user?.email === 'manager@taskflow.com'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    Manager
                  </button>
                  <button
                    onClick={() => {
                      quickSwitch('member@taskflow.com');
                      setIsUserMenuOpen(false);
                    }}
                    className={`px-2 py-1 rounded text-left transition-colors font-medium ${
                      user?.email === 'member@taskflow.com'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    Member
                  </button>
                  <button
                    onClick={() => {
                      quickSwitch('viewer@taskflow.com');
                      setIsUserMenuOpen(false);
                    }}
                    className={`px-2 py-1 rounded text-left transition-colors font-medium ${
                      user?.email === 'viewer@taskflow.com'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    Viewer
                  </button>
                </div>
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-1">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors text-left font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
