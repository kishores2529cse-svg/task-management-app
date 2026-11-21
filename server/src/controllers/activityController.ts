import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';

export const getActivities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, taskId, limit = '30' } = req.query;

    const where: any = {};
    if (projectId && projectId !== 'all') {
      where.projectId = String(projectId);
    }
    if (taskId) {
      where.taskId = String(taskId);
    }

    const activities = await prisma.activity.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        task: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(100, parseInt(String(limit), 10)),
    });

    res.json({
      success: true,
      data: { activities },
    });
  } catch (error) {
    next(error);
  }
};
