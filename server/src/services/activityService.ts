import prisma from '../lib/prisma.js';
import { emitToProject, emitGlobal } from './socketService.js';

interface LogActivityParams {
  userId: string;
  action: string;
  details: string;
  taskId?: string;
  projectId?: string;
}

export const logActivity = async (params: LogActivityParams) => {
  try {
    const activity = await prisma.activity.create({
      data: {
        userId: params.userId,
        action: params.action,
        details: params.details,
        taskId: params.taskId,
        projectId: params.projectId,
      },
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
      },
    });

    if (params.projectId) {
      emitToProject(params.projectId, 'activity:new', activity);
    } else {
      emitGlobal('activity:new', activity);
    }

    return activity;
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
