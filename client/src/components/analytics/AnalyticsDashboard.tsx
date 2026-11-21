import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Layers
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import api from '../../services/api';
import type { AnalyticsData, Task } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import { PriorityBadge } from '../common/Badge';

interface AnalyticsDashboardProps {
  projectId?: string;
  onSelectTask?: (task: Task) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  projectId,
  onSelectTask,
}) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const url = projectId && projectId !== 'all' ? `/analytics?projectId=${projectId}` : '/analytics';
      const res = await api.get(url);
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [projectId]);

  if (isLoading || !data) {
    return (
      <div className="p-8 text-center text-zinc-400 text-xs">
        Loading analytics...
      </div>
    );
  }

  const { metrics, statusData, priorityData, workloadData, trendData, upcomingDeadlines } = data;

  const STATUS_COLORS: Record<string, string> = {
    Backlog: '#a1a1aa',
    'To Do': '#71717a',
    'In Progress': '#3b82f6',
    'In Review': '#8b5cf6',
    Completed: '#10b981',
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Tasks */}
        <div className="p-4 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
              Total Tasks
            </span>
            <Layers className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mt-1.5 font-mono">
            {metrics.totalTasks}
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Across active projects
          </p>
        </div>

        {/* Completion Rate */}
        <div className="p-4 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
              Completion Rate
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-mono">
              {metrics.completionRate}%
            </p>
            <span className="text-[11px] text-zinc-500 font-mono">
              ({metrics.completedTasks} done)
            </span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1 mt-2 overflow-hidden">
            <div
              className="bg-emerald-600 dark:bg-emerald-500 h-1 rounded-full"
              style={{ width: `${metrics.completionRate}%` }}
            />
          </div>
        </div>

        {/* In Progress */}
        <div className="p-4 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
              Active In Progress
            </span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mt-1.5 font-mono">
            {metrics.inProgressTasks + metrics.inReviewTasks}
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            {metrics.inProgressTasks} execution • {metrics.inReviewTasks} review
          </p>
        </div>

        {/* Overdue */}
        <div className="p-4 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
              Overdue
            </span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-semibold text-red-600 dark:text-red-400 tracking-tight mt-1.5 font-mono">
            {metrics.overdueTasks}
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Needs attention
          </p>
        </div>
      </div>

      {/* Charts Grid Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Donut */}
        <div className="p-4 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            Status Breakdown
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#71717a'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderRadius: '6px',
                    border: '1px solid #27272a',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Bar Chart */}
        <div className="p-4 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            Priority Distribution
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" fontSize={11} stroke="#a1a1aa" />
                <YAxis fontSize={11} stroke="#a1a1aa" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderRadius: '6px',
                    border: '1px solid #27272a',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="count" fill="#18181b" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Grid Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Trend Area Chart */}
        <div className="p-4 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            Task Throughput (7 Days)
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#71717a" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#71717a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="label" fontSize={10} stroke="#a1a1aa" />
                <YAxis fontSize={10} stroke="#a1a1aa" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderRadius: '6px',
                    border: '1px solid #27272a',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area
                  type="monotone"
                  dataKey="created"
                  stroke="#71717a"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#colorCreated)"
                  name="Created"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#colorCompleted)"
                  name="Completed"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Workload */}
        <div className="p-4 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            Team Workload
          </h3>
          <div className="h-56 overflow-y-auto space-y-2 text-xs">
            {workloadData.map((member) => (
              <div
                key={member.id}
                className="p-2.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/40"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <UserAvatar user={member} size="xs" />
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {member.name}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {member.completed}/{member.total} tasks
                  </span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1 overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-1"
                    style={{ width: `${(member.completed / (member.total || 1)) * 100}%` }}
                    title={`${member.completed} Completed`}
                  />
                  <div
                    className="bg-blue-500 h-1"
                    style={{ width: `${(member.inProgress / (member.total || 1)) * 100}%` }}
                    title={`${member.inProgress} In Progress`}
                  />
                  <div
                    className="bg-zinc-400 h-1"
                    style={{
                      width: `${
                        ((member.total - member.completed - member.inProgress) / (member.total || 1)) * 100
                      }%`,
                    }}
                    title="Pending"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <div className="p-4 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Clock className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Upcoming Deadlines (&lt; 48h)
            </h3>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {upcomingDeadlines.map((t) => (
              <div
                key={t.id}
                onClick={() => onSelectTask && onSelectTask(t as any)}
                className="py-2 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-850 px-1 rounded transition-colors cursor-pointer text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-zinc-400">
                    {t.code}
                  </span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200 line-clamp-1">
                    {t.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={t.priority} size="sm" />
                  <span className="text-[11px] font-mono text-zinc-500">
                    {new Date(t.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
