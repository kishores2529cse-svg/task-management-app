import React, { useState, useEffect } from 'react';
import { Users, Briefcase, Building } from 'lucide-react';
import api from '../../services/api';
import type { User, UserRole } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const TeamManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { success, error } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = currentUser?.role === 'ADMIN';

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/users');
      setUsers(res.data.data.users);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!isAdmin) return;
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      success('Role updated', `Role changed to ${newRole}`);
    } catch (err: any) {
      error('Failed to change role', err.response?.data?.message);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    if (!isAdmin) return;
    try {
      const res = await api.patch(`/users/${userId}/status`);
      const updatedUser = res.data.data.user;
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: updatedUser.isActive } : u))
      );
      success(
        'Status updated',
        `User is now ${updatedUser.isActive ? 'Active' : 'Inactive'}`
      );
    } catch (err: any) {
      error('Failed to toggle status', err.response?.data?.message);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-zinc-400 text-xs">Loading team...</div>;
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800 shadow-xs p-4 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-zinc-500" />
            Team Directory & Roles
          </h2>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Manage organization members and role permissions
          </p>
        </div>

        <span className="text-[11px] font-mono text-zinc-400">
          {users.length} members
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {users.map((member) => (
          <div
            key={member.id}
            className="p-3.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/40 flex flex-col justify-between space-y-3"
          >
            <div className="flex items-start gap-3">
              <UserAvatar user={member} size="md" showOnline={true} isOnline={member.isActive} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-xs text-zinc-900 dark:text-zinc-100 truncate">
                    {member.name}
                  </h3>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                      member.isActive
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800'
                    }`}
                  >
                    {member.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                  {member.email}
                </p>

                {member.title && (
                  <div className="flex items-center gap-1 text-[11px] text-zinc-600 dark:text-zinc-400 mt-1.5">
                    <Briefcase className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                    <span className="truncate">{member.title}</span>
                  </div>
                )}

                {member.department && (
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-0.5">
                    <Building className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{member.department}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Controls */}
            <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                  Role:
                </span>
                {isAdmin && member.id !== currentUser?.id ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                    className="px-1.5 py-0.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="MEMBER">MEMBER</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                ) : (
                  <span className="font-mono text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                    {member.role}
                  </span>
                )}
              </div>

              {isAdmin && member.id !== currentUser?.id && (
                <button
                  onClick={() => handleToggleStatus(member.id)}
                  className={`text-[11px] hover:underline ${
                    member.isActive
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-zinc-500'
                  }`}
                >
                  {member.isActive ? 'Deactivate' : 'Activate'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
