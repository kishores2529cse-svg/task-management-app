import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { emitToProject, emitGlobal } from '../services/socketService.js';
import { logActivity } from '../services/activityService.js';
import { createNotification } from '../services/notificationService.js';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional().nullable(),
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  type: z.enum(['TASK', 'BUG', 'FEATURE', 'IMPROVEMENT', 'MILESTONE']).default('TASK'),
  projectId: z.string().min(1, 'Project ID is required'),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  estimatedHours: z.number().min(0).optional().nullable(),
  actualHours: z.number().min(0).optional().nullable(),
  tags: z.array(z.string()).optional(),
  subtasks: z.array(z.string()).optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  type: z.enum(['TASK', 'BUG', 'FEATURE', 'IMPROVEMENT', 'MILESTONE']).optional(),
  projectId: z.string().optional(),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  estimatedHours: z.number().min(0).optional().nullable(),
  actualHours: z.number().min(0).optional().nullable(),
  orderIndex: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

const batchUpdateSchema = z.object({
  taskIds: z.array(z.string()).min(1),
  action: z.enum(['update_status', 'update_priority', 'update_assignee', 'delete']),
  value: z.any().optional(),
});

export const getTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      projectId,
      status,
      priority,
      type,
      assigneeId,
      reporterId,
      search,
      tag,
      dueDateRange,
      page = '1',
      limit = '50',
      sortBy = 'orderIndex',
      sortOrder = 'asc',
    } = req.query;

    const where: any = {};

    if (projectId && projectId !== 'all') {
      where.projectId = String(projectId);
    }

    if (status && status !== 'ALL') {
      const statuses = String(status).split(',');
      where.status = { in: statuses };
    }

    if (priority && priority !== 'ALL') {
      const priorities = String(priority).split(',');
      where.priority = { in: priorities };
    }

    if (type && type !== 'ALL') {
      where.type = String(type);
    }

    if (assigneeId) {
      if (assigneeId === 'unassigned') {
        where.assigneeId = null;
      } else {
        where.assigneeId = String(assigneeId);
      }
    }

    if (reporterId) {
      where.reporterId = String(reporterId);
    }

    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: String(tag),
          },
        },
      };
    }

    if (search) {
      const q = String(search).trim();
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { code: { contains: q } },
      ];
    }

    // Due date filter presets
    const now = new Date();
    if (dueDateRange === 'overdue') {
      where.dueDate = { lt: now };
      where.status = { notIn: ['DONE', 'CANCELLED'] };
    } else if (dueDateRange === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      where.dueDate = { gte: startOfDay, lte: endOfDay };
    } else if (dueDateRange === 'this_week') {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
      where.dueDate = { gte: startOfWeek, lte: endOfWeek };
    }

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(String(limit), 10)));
    const skip = (pageNum - 1) * pageSize;

    const validSortFields = ['dueDate', 'priority', 'createdAt', 'updatedAt', 'title', 'orderIndex', 'status'];
    const sortField = validSortFields.includes(String(sortBy)) ? String(sortBy) : 'orderIndex';
    const direction = String(sortOrder).toLowerCase() === 'desc' ? 'desc' : 'asc';

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortField]: direction },
        include: {
          project: {
            select: { id: true, name: true, key: true, color: true },
          },
          assignee: {
            select: { id: true, name: true, email: true, avatar: true, role: true },
          },
          reporter: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          subtasks: {
            select: { id: true, title: true, isCompleted: true, orderIndex: true },
            orderBy: { orderIndex: 'asc' },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: { comments: true, attachments: true, subtasks: true },
          },
        },
      }),
      prisma.task.count({ where }),
    ]);

    // Format tasks to flatten tags
    const formattedTasks = tasks.map((task) => ({
      ...task,
      tags: task.tags.map((t) => t.tag),
      completedSubtasksCount: task.subtasks.filter((s) => s.isCompleted).length,
      totalSubtasksCount: task.subtasks.length,
    }));

    res.json({
      success: true,
      data: {
        tasks: formattedTasks,
        pagination: {
          total,
          page: pageNum,
          limit: pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: {
        OR: [{ id }, { code: id }],
      },
      include: {
        project: {
          select: { id: true, name: true, key: true, color: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, avatar: true, role: true, title: true },
        },
        reporter: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
        subtasks: {
          orderBy: { orderIndex: 'asc' },
        },
        tags: {
          include: { tag: true },
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true, role: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
        },
        activities: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    res.json({
      success: true,
      data: {
        task: {
          ...task,
          tags: task.tags.map((t) => t.tag),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createTaskSchema.parse(req.body);

    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Generate unique code for this project
    const taskCount = await prisma.task.count({
      where: { projectId: project.id },
    });
    const code = `${project.key}-${taskCount + 101}`;

    // Get max orderIndex for status column
    const highestOrder = await prisma.task.findFirst({
      where: { projectId: project.id, status: data.status },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    });
    const nextOrderIndex = (highestOrder?.orderIndex ?? -1) + 1;

    const task = await prisma.task.create({
      data: {
        code,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        type: data.type,
        projectId: project.id,
        assigneeId: data.assigneeId || null,
        reporterId: req.user!.id,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        estimatedHours: data.estimatedHours ?? null,
        actualHours: data.actualHours ?? null,
        orderIndex: nextOrderIndex,
      },
      include: {
        project: {
          select: { id: true, name: true, key: true, color: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
        reporter: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        subtasks: true,
      },
    });

    // Handle subtasks
    if (data.subtasks && data.subtasks.length > 0) {
      await prisma.subtask.createMany({
        data: data.subtasks.map((st, index) => ({
          taskId: task.id,
          title: st,
          orderIndex: index,
        })),
      });
    }

    // Handle tags
    if (data.tags && data.tags.length > 0) {
      for (const tagName of data.tags) {
        const cleanName = tagName.trim().toLowerCase();
        let tagRecord = await prisma.tag.findUnique({ where: { name: cleanName } });
        if (!tagRecord) {
          tagRecord = await prisma.tag.create({
            data: {
              name: cleanName,
              color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
            },
          });
        }
        await prisma.taskTag.create({
          data: {
            taskId: task.id,
            tagId: tagRecord.id,
          },
        });
      }
    }

    // Log Activity
    await logActivity({
      userId: req.user!.id,
      taskId: task.id,
      projectId: project.id,
      action: 'CREATED',
      details: JSON.stringify({ message: `Created task "${task.title}" (${task.code})` }),
    });

    // Notify assignee if not creator
    if (task.assigneeId && task.assigneeId !== req.user!.id) {
      await createNotification({
        userId: task.assigneeId,
        title: 'New Task Assigned',
        message: `${req.user!.name} assigned you to "${task.title}" (${task.code})`,
        type: 'ASSIGNMENT',
        taskId: task.id,
      });
    }

    // Fetch full task with relations for broadcast
    const fullTask = await prisma.task.findUnique({
      where: { id: task.id },
      include: {
        project: { select: { id: true, name: true, key: true, color: true } },
        assignee: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        reporter: { select: { id: true, name: true, email: true, avatar: true } },
        subtasks: true,
        tags: { include: { tag: true } },
        _count: { select: { comments: true, attachments: true, subtasks: true } },
      },
    });

    const formattedTask = {
      ...fullTask,
      tags: fullTask?.tags.map((t) => t.tag) || [],
    };

    emitToProject(project.id, 'task:created', formattedTask);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task: formattedTask },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateTaskSchema.parse(req.body);

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { assignee: true, project: true },
    });

    if (!existingTask) {
      return next(new AppError('Task not found', 404));
    }

    // Role check: viewers cannot edit
    if (req.user!.role === 'VIEWER') {
      return next(new AppError('Viewers do not have permission to modify tasks', 403));
    }

    const updatePayload: any = {};
    const activityDetails: string[] = [];

    if (data.title !== undefined && data.title !== existingTask.title) {
      updatePayload.title = data.title;
      activityDetails.push(`Changed title from "${existingTask.title}" to "${data.title}"`);
    }

    if (data.description !== undefined) {
      updatePayload.description = data.description;
    }

    if (data.status !== undefined && data.status !== existingTask.status) {
      updatePayload.status = data.status;
      activityDetails.push(`Status changed from ${existingTask.status} to ${data.status}`);
    }

    if (data.priority !== undefined && data.priority !== existingTask.priority) {
      updatePayload.priority = data.priority;
      activityDetails.push(`Priority changed from ${existingTask.priority} to ${data.priority}`);
    }

    if (data.type !== undefined && data.type !== existingTask.type) {
      updatePayload.type = data.type;
    }

    if (data.dueDate !== undefined) {
      updatePayload.dueDate = data.dueDate ? new Date(data.dueDate) : null;
      activityDetails.push(`Due date updated`);
    }

    if (data.estimatedHours !== undefined) {
      updatePayload.estimatedHours = data.estimatedHours;
    }

    if (data.actualHours !== undefined) {
      updatePayload.actualHours = data.actualHours;
    }

    if (data.orderIndex !== undefined) {
      updatePayload.orderIndex = data.orderIndex;
    }

    if (data.assigneeId !== undefined && data.assigneeId !== existingTask.assigneeId) {
      updatePayload.assigneeId = data.assigneeId;
      activityDetails.push(`Assignee updated`);

      if (data.assigneeId && data.assigneeId !== req.user!.id) {
        await createNotification({
          userId: data.assigneeId,
          title: 'Task Assigned',
          message: `${req.user!.name} assigned you to "${existingTask.title}" (${existingTask.code})`,
          type: 'ASSIGNMENT',
          taskId: existingTask.id,
        });
      }
    }

    // Update tags if provided
    if (data.tags !== undefined) {
      await prisma.taskTag.deleteMany({ where: { taskId: id } });
      for (const tagName of data.tags) {
        const cleanName = tagName.trim().toLowerCase();
        let tagRecord = await prisma.tag.findUnique({ where: { name: cleanName } });
        if (!tagRecord) {
          tagRecord = await prisma.tag.create({
            data: {
              name: cleanName,
              color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
            },
          });
        }
        await prisma.taskTag.create({
          data: { taskId: id, tagId: tagRecord.id },
        });
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updatePayload,
      include: {
        project: { select: { id: true, name: true, key: true, color: true } },
        assignee: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        reporter: { select: { id: true, name: true, email: true, avatar: true } },
        subtasks: true,
        tags: { include: { tag: true } },
        _count: { select: { comments: true, attachments: true, subtasks: true } },
      },
    });

    if (activityDetails.length > 0) {
      await logActivity({
        userId: req.user!.id,
        taskId: id,
        projectId: updatedTask.projectId,
        action: 'UPDATED',
        details: JSON.stringify({ changes: activityDetails }),
      });
    }

    // If status changed and assignee is someone else, notify assignee
    if (
      data.status &&
      data.status !== existingTask.status &&
      updatedTask.assigneeId &&
      updatedTask.assigneeId !== req.user!.id
    ) {
      await createNotification({
        userId: updatedTask.assigneeId,
        title: 'Task Status Updated',
        message: `${req.user!.name} moved "${updatedTask.title}" to ${data.status}`,
        type: 'STATUS_CHANGE',
        taskId: updatedTask.id,
      });
    }

    const formattedTask = {
      ...updatedTask,
      tags: updatedTask.tags.map((t) => t.tag),
    };

    emitToProject(updatedTask.projectId, 'task:updated', formattedTask);

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: { task: formattedTask },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, orderIndex } = req.body;

    if (!status) {
      return next(new AppError('Status is required', 400));
    }

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existingTask) {
      return next(new AppError('Task not found', 404));
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status,
        orderIndex: orderIndex !== undefined ? orderIndex : existingTask.orderIndex,
      },
      include: {
        project: { select: { id: true, name: true, key: true, color: true } },
        assignee: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        reporter: { select: { id: true, name: true, email: true, avatar: true } },
        subtasks: true,
        tags: { include: { tag: true } },
        _count: { select: { comments: true, attachments: true, subtasks: true } },
      },
    });

    await logActivity({
      userId: req.user!.id,
      taskId: id,
      projectId: existingTask.projectId,
      action: 'STATUS_CHANGED',
      details: JSON.stringify({ from: existingTask.status, to: status }),
    });

    const formattedTask = {
      ...updatedTask,
      tags: updatedTask.tags.map((t) => t.tag),
    };

    emitToProject(existingTask.projectId, 'task:status_changed', {
      taskId: id,
      status,
      orderIndex: updatedTask.orderIndex,
      task: formattedTask,
    });

    res.json({
      success: true,
      data: { task: formattedTask },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    if (req.user!.role !== 'ADMIN' && req.user!.role !== 'MANAGER' && task.reporterId !== req.user!.id) {
      return next(new AppError('Only Admins, Managers, or the task creator can delete this task', 403));
    }

    await prisma.task.delete({
      where: { id },
    });

    await logActivity({
      userId: req.user!.id,
      projectId: task.projectId,
      action: 'DELETED',
      details: JSON.stringify({ message: `Deleted task "${task.title}" (${task.code})` }),
    });

    emitToProject(task.projectId, 'task:deleted', { taskId: id, projectId: task.projectId });

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const batchUpdateTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskIds, action, value } = batchUpdateSchema.parse(req.body);

    if (req.user!.role === 'VIEWER') {
      return next(new AppError('Forbidden: Viewers cannot perform batch updates', 403));
    }

    let affectedCount = 0;

    if (action === 'update_status') {
      const result = await prisma.task.updateMany({
        where: { id: { in: taskIds } },
        data: { status: value },
      });
      affectedCount = result.count;
    } else if (action === 'update_priority') {
      const result = await prisma.task.updateMany({
        where: { id: { in: taskIds } },
        data: { priority: value },
      });
      affectedCount = result.count;
    } else if (action === 'update_assignee') {
      const result = await prisma.task.updateMany({
        where: { id: { in: taskIds } },
        data: { assigneeId: value || null },
      });
      affectedCount = result.count;
    } else if (action === 'delete') {
      if (req.user!.role !== 'ADMIN' && req.user!.role !== 'MANAGER') {
        return next(new AppError('Only Admins or Managers can bulk delete tasks', 403));
      }
      const result = await prisma.task.deleteMany({
        where: { id: { in: taskIds } },
      });
      affectedCount = result.count;
    }

    emitGlobal('tasks:batch_updated', { taskIds, action, value });

    res.json({
      success: true,
      message: `Successfully processed ${affectedCount} tasks`,
      data: { count: affectedCount },
    });
  } catch (error) {
    next(error);
  }
};

// Subtasks
export const addSubtask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return next(new AppError('Subtask title is required', 400));
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return next(new AppError('Task not found', 404));

    const highestOrder = await prisma.subtask.findFirst({
      where: { taskId },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    });

    const subtask = await prisma.subtask.create({
      data: {
        taskId,
        title: title.trim(),
        orderIndex: (highestOrder?.orderIndex ?? -1) + 1,
      },
    });

    emitToProject(task.projectId, 'subtask:created', { taskId, subtask });

    res.status(201).json({
      success: true,
      data: { subtask },
    });
  } catch (error) {
    next(error);
  }
};

export const toggleSubtask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subtaskId } = req.params;

    const subtask = await prisma.subtask.findUnique({
      where: { id: subtaskId },
      include: { task: true },
    });

    if (!subtask) return next(new AppError('Subtask not found', 404));

    const updated = await prisma.subtask.update({
      where: { id: subtaskId },
      data: { isCompleted: !subtask.isCompleted },
    });

    emitToProject(subtask.task.projectId, 'subtask:updated', {
      taskId: subtask.taskId,
      subtask: updated,
    });

    res.json({
      success: true,
      data: { subtask: updated },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSubtask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subtaskId } = req.params;

    const subtask = await prisma.subtask.findUnique({
      where: { id: subtaskId },
      include: { task: true },
    });

    if (!subtask) return next(new AppError('Subtask not found', 404));

    await prisma.subtask.delete({ where: { id: subtaskId } });

    emitToProject(subtask.task.projectId, 'subtask:deleted', {
      taskId: subtask.taskId,
      subtaskId,
    });

    res.json({
      success: true,
      message: 'Subtask deleted',
    });
  } catch (error) {
    next(error);
  }
};

// Attachments
export const addAttachment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;
    const { name, url, size, type } = req.body;

    if (!name || !url) {
      return next(new AppError('Name and URL are required', 400));
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return next(new AppError('Task not found', 404));

    const attachment = await prisma.attachment.create({
      data: {
        taskId,
        name,
        url,
        size: size || '1.2 MB',
        type: type || 'document',
      },
    });

    emitToProject(task.projectId, 'attachment:created', { taskId, attachment });

    res.status(201).json({
      success: true,
      data: { attachment },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAttachment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { attachmentId } = req.params;

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { task: true },
    });

    if (!attachment) return next(new AppError('Attachment not found', 404));

    await prisma.attachment.delete({ where: { id: attachmentId } });

    emitToProject(attachment.task.projectId, 'attachment:deleted', {
      taskId: attachment.taskId,
      attachmentId,
    });

    res.json({
      success: true,
      message: 'Attachment deleted',
    });
  } catch (error) {
    next(error);
  }
};
