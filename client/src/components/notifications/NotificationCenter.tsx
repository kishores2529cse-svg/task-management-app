import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, Calendar, UserPlus, AlertCircle, MessageSquare } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import type { Notification } from '../../types';

interface NotificationCenterProps {
  onSelectTaskById?: (taskId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onSelectTaskById }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
  } = useSocket();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'ASSIGNMENT':
        return <UserPlus className="w-3.5 h-3.5 text-zinc-500" />;
      case 'DUE_SOON':
        return <Calendar className="w-3.5 h-3.5 text-amber-500" />;
      case 'MENTION':
        return <MessageSquare className="w-3.5 h-3.5 text-blue-500" />;
      case 'STATUS_CHANGE':
        return <Check className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.isRead) {
      markNotificationAsRead(n.id);
    }
    if (n.taskId && onSelectTaskById) {
      onSelectTaskById(n.taskId);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 rounded text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-80 rounded-md bg-white dark:bg-zinc-900 shadow-md border border-zinc-200 dark:border-zinc-800 z-50 overflow-hidden animate-in fade-in duration-100">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllNotificationsAsRead}
                  className="p-1 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="p-1 text-xs text-zinc-400 hover:text-red-600 rounded"
                  title="Clear all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-zinc-400 text-xs">
                No notifications
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3 flex items-start gap-2.5 transition-colors cursor-pointer text-xs ${
                    !n.isRead
                      ? 'bg-zinc-50 dark:bg-zinc-850 hover:bg-zinc-100/70 dark:hover:bg-zinc-800'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-850/60'
                  }`}
                >
                  <div className="p-1 rounded bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate text-[11px]">
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 leading-snug">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-zinc-400 font-mono mt-1 inline-block">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
