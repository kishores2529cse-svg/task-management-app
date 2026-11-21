import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';

export const getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.query;

    const where: any = {};
    if (projectId && projectId !== 'all') {
      where.projectId = String(projectId);
    }

    const now = new Date();

    const [
      totalTasks,
      completedTasks,
      inProgressTasks,
      inReviewTasks,
      todoTasks,
      backlogTasks,
      overdueTasks,
      urgentTasks,
      highTasks,
      mediumTasks,
      lowTasks,
      allTasks,
      users,
    ] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.count({ where: { ...where, status: 'DONE' } }),
      prisma.task.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { ...where, status: 'IN_REVIEW' } }),
      prisma.task.count({ where: { ...where, status: 'TODO' } }),
      prisma.task.count({ where: { ...where, status: 'BACKLOG' } }),
      prisma.task.count({
        where: {
          ...where,
          dueDate: { lt: now },
          status: { notIn: ['DONE', 'CANCELLED'] },
        },
      }),
      prisma.task.count({ where: { ...where, priority: 'URGENT' } }),
      prisma.task.count({ where: { ...where, priority: 'HIGH' } }),
      prisma.task.count({ where: { ...where, priority: 'MEDIUM' } }),
      prisma.task.count({ where: { ...where, priority: 'LOW' } }),
      prisma.task.findMany({
        where,
        select: {
          id: true,
          code: true,
          title: true,
          status: true,
          priority: true,
          type: true,
          dueDate: true,
          assigneeId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.findMany({
        select: { id: true, name: true, avatar: true, role: true },
      }),
    ]);

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Status Distribution
    const statusData = [
      { name: 'Backlog', count: backlogTasks, color: '#94a3b8' },
      { name: 'To Do', count: todoTasks, color: '#64748b' },
      { name: 'In Progress', count: inProgressTasks, color: '#3b82f6' },
      { name: 'In Review', count: inReviewTasks, color: '#8b5cf6' },
      { name: 'Completed', count: completedTasks, color: '#10b981' },
    ];

    // Priority Distribution
    const priorityData = [
      { name: 'Urgent', count: urgentTasks, color: '#ef4444' },
      { name: 'High', count: highTasks, color: '#f59e0b' },
      { name: 'Medium', count: mediumTasks, color: '#3b82f6' },
      { name: 'Low', count: lowTasks, color: '#64748b' },
    ];

    // Workload by user
    const workloadMap = new Map<string, { total: number; completed: number; inProgress: number }>();
    users.forEach((u) => {
      workloadMap.set(u.id, { total: 0, completed: 0, inProgress: 0 });
    });

    allTasks.forEach((t) => {
      if (t.assigneeId && workloadMap.has(t.assigneeId)) {
        const entry = workloadMap.get(t.assigneeId)!;
        entry.total += 1;
        if (t.status === 'DONE') entry.completed += 1;
        if (t.status === 'IN_PROGRESS') entry.inProgress += 1;
      }
    });

    const workloadData = users
      .map((u) => {
        const stats = workloadMap.get(u.id) || { total: 0, completed: 0, inProgress: 0 };
        return {
          id: u.id,
          name: u.name,
          avatar: u.avatar,
          total: stats.total,
          completed: stats.completed,
          inProgress: stats.inProgress,
          pending: stats.total - stats.completed,
        };
      })
      .filter((w) => w.total > 0);

    // Completion Trend (last 7 days)
    const trendMap = new Map<string, { created: number; completed: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      trendMap.set(dateKey, { created: 0, completed: 0 });
    }

    allTasks.forEach((t) => {
      const createdKey = t.createdAt.toISOString().split('T')[0];
      if (trendMap.has(createdKey)) {
        trendMap.get(createdKey)!.created += 1;
      }
      if (t.status === 'DONE') {
        const updatedKey = t.updatedAt.toISOString().split('T')[0];
        if (trendMap.has(updatedKey)) {
          trendMap.get(updatedKey)!.completed += 1;
        }
      }
    });

    const trendData = Array.from(trendMap.entries()).map(([date, counts]) => {
      const d = new Date(date);
      const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      return {
        date,
        label,
        created: counts.created,
        completed: counts.completed,
      };
    });

    // Upcoming Deadlines (next 48h)
    const inTwoDays = new Date();
    inTwoDays.setDate(inTwoDays.getDate() + 2);
    const upcomingDeadlines = allTasks
      .filter((t) => t.dueDate && t.dueDate <= inTwoDays && t.status !== 'DONE')
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        metrics: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          inReviewTasks,
          todoTasks,
          backlogTasks,
          overdueTasks,
          completionRate,
        },
        statusData,
        priorityData,
        workloadData,
        trendData,
        upcomingDeadlines,
      },
    });
  } catch (error) {
    next(error);
  }
};
