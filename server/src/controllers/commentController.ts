import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { emitToProject } from '../services/socketService.js';
import { logActivity } from '../services/activityService.js';
import { createNotification } from '../services/notificationService.js';

const commentSchema = z.object({
  taskId: z.string().min(1),
  content: z.string().min(1, 'Comment cannot be empty'),
});

export const createComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId, content } = commentSchema.parse(req.body);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true, assignee: true },
    });

    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    const comment = await prisma.comment.create({
      data: {
        taskId,
        userId: req.user!.id,
        content,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
      },
    });

    // Check for mentions like @username in content
    const mentionMatches = content.match(/@([a-zA-Z0-9._-]+)/g);
    if (mentionMatches) {
      for (const mention of mentionMatches) {
        const username = mention.slice(1).toLowerCase();
        const mentionedUser = await prisma.user.findFirst({
          where: {
            OR: [
              { name: { contains: username } },
              { email: { contains: username } },
            ],
          },
        });

        if (mentionedUser && mentionedUser.id !== req.user!.id) {
          await createNotification({
            userId: mentionedUser.id,
            title: 'You were mentioned',
            message: `${req.user!.name} mentioned you on "${task.title}"`,
            type: 'MENTION',
            taskId: task.id,
          });
        }
      }
    }

    // Notify assignee if not the commenter
    if (task.assigneeId && task.assigneeId !== req.user!.id) {
      await createNotification({
        userId: task.assigneeId,
        title: 'New Comment on Your Task',
        message: `${req.user!.name} commented on "${task.title}"`,
        type: 'STATUS_CHANGE',
        taskId: task.id,
      });
    }

    await logActivity({
      userId: req.user!.id,
      taskId: task.id,
      projectId: task.projectId,
      action: 'COMMENTED',
      details: JSON.stringify({ message: `Added a comment` }),
    });

    emitToProject(task.projectId, 'comment:created', {
      taskId,
      comment,
    });

    res.status(201).json({
      success: true,
      data: { comment },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!comment) {
      return next(new AppError('Comment not found', 404));
    }

    if (comment.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return next(new AppError('You can only delete your own comments', 403));
    }

    await prisma.comment.delete({ where: { id } });

    emitToProject(comment.task.projectId, 'comment:deleted', {
      taskId: comment.taskId,
      commentId: id,
    });

    res.json({
      success: true,
      message: 'Comment deleted',
    });
  } catch (error) {
    next(error);
  }
};
