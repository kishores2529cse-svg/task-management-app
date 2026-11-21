import prisma from '../lib/prisma.js';
import { emitToUser } from './socketService.js';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: 'ASSIGNMENT' | 'STATUS_CHANGE' | 'DUE_SOON' | 'MENTION' | 'SYSTEM' | 'PRIORITY';
  taskId?: string;
}

export const createNotification = async (params: CreateNotificationParams) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        taskId: params.taskId,
      },
    });

    emitToUser(params.userId, 'notification:new', notification);
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};
