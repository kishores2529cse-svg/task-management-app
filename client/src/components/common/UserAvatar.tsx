import React from 'react';
import type { UserRole } from '../../types';

interface UserAvatarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    avatar?: string | null;
    role?: UserRole | string;
  } | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showOnline?: boolean;
  isOnline?: boolean;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  showOnline = false,
  isOnline = false,
  className = '',
}) => {
  const name = user?.name || user?.email || 'User';
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sizeClasses = {
    xs: 'w-5 h-5 text-[9px]',
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-7 h-7 text-xs',
    lg: 'w-9 h-9 text-sm',
    xl: 'w-12 h-12 text-base font-medium',
  }[size];

  const dotSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
    xl: 'w-3 h-3',
  }[size];

  return (
    <div className={`relative inline-flex items-center justify-center flex-shrink-0 ${className}`}>
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={name}
          className={`${sizeClasses} rounded-full object-cover border border-zinc-200 dark:border-zinc-800`}
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      ) : (
        <div
          className={`${sizeClasses} bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-full font-medium flex items-center justify-center select-none`}
        >
          {initials}
        </div>
      )}

      {showOnline && (
        <span
          className={`absolute bottom-0 right-0 ${dotSizes} rounded-full ring-2 ring-white dark:ring-zinc-950 ${
            isOnline ? 'bg-emerald-500' : 'bg-zinc-400'
          }`}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};
