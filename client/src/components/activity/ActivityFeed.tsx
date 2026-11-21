import React, { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import api from '../../services/api';
import type { Activity } from '../../types';
import { UserAvatar } from '../common/UserAvatar';

interface ActivityFeedProps {
  projectId?: string;
  onSelectTask?: (task: any) => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ projectId, onSelectTask }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const url = projectId && projectId !== 'all' ? `/activities?projectId=${projectId}` : '/activities';
      const res = await api.get(url);
      setActivities(res.data.data.activities);
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [projectId]);

  if (isLoading) {
    return <div className="p-8 text-center text-zinc-400 text-xs">Loading audit log...</div>;
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800 shadow-xs p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-zinc-400" />
          <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            Audit Trail
          </h2>
        </div>

        <span className="text-[11px] font-mono text-zinc-400">
          {activities.length} events
        </span>
      </div>

      <div className="relative pl-4 space-y-4 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-[1px] before:bg-zinc-200 dark:before:bg-zinc-800">
        {activities.map((act) => {
          let parsedDetails: any = null;
          try {
            parsedDetails = JSON.parse(act.details);
          } catch (e) {}

          return (
            <div key={act.id} className="relative text-xs">
              <div className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-600" />
              <div className="flex items-center gap-1.5 mb-1">
                <UserAvatar user={act.user} size="xs" />
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {act.user?.name}
                </span>
                <span className="text-[10px] uppercase font-mono px-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                  {act.action}
                </span>
                {act.task && (
                  <button
                    onClick={() => onSelectTask && onSelectTask(act.task)}
                    className="font-mono text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline"
                  >
                    {act.task.code}
                  </button>
                )}
                {act.project && (
                  <span className="text-[10px] text-zinc-400">({act.project.name})</span>
                )}
                <span className="text-[10px] font-mono text-zinc-400 ml-auto">
                  {new Date(act.createdAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className="p-2 rounded bg-zinc-50/60 dark:bg-zinc-850/40 border border-zinc-200/60 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400">
                {parsedDetails?.message ||
                  (parsedDetails?.from &&
                    `Status transition: from "${parsedDetails.from}" to "${parsedDetails.to}"`) ||
                  (parsedDetails?.changes && parsedDetails.changes.join(' • ')) ||
                  act.details}
              </div>
            </div>
          );
        })}

        {activities.length === 0 && (
          <p className="text-xs text-zinc-400 text-center py-8">
            No events logged.
          </p>
        )}
      </div>
    </div>
  );
};
