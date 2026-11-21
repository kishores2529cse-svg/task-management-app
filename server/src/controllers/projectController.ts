import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { emitGlobal } from '../services/socketService.js';
import { logActivity } from '../services/activityService.js';

const createProjectSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  key: z.string().min(2).max(10).toUpperCase(),
  description: z.string().optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#4f46e5'),
  startDate: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
});

const updateProjectSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED']).optional(),
  startDate: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
});

export const getProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true, role: true },
            },
          },
        },
        _count: {
          select: { tasks: true, members: true },
        },
        tasks: {
          select: { status: true, priority: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = projects.map((project) => {
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter((t) => t.status === 'DONE').length;
      const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        id: project.id,
        name: project.name,
        key: project.key,
        description: project.description,
        color: project.color,
        status: project.status,
        startDate: project.startDate,
        targetDate: project.targetDate,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        members: project.members,
        stats: {
          totalTasks,
          completedTasks,
          progressPercent,
          membersCount: project.members.length,
        },
      };
    });

    res.json({
      success: true,
      data: { projects: formatted },
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true, role: true, title: true, department: true },
            },
          },
        },
        tasks: {
          select: {
            id: true,
            code: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            assignee: {
              select: { id: true, name: true, avatar: true },
            },
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { tasks: true, members: true },
        },
      },
    });

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    res.json({
      success: true,
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createProjectSchema.parse(req.body);

    const existingKey = await prisma.project.findUnique({
      where: { key: data.key },
    });

    if (existingKey) {
      return next(new AppError(`Project key "${data.key}" already exists`, 409));
    }

    const project = await prisma.project.create({
      data: {
        name: data.name,
        key: data.key,
        description: data.description,
        color: data.color,
        ownerId: req.user!.id,
        startDate: data.startDate ? new Date(data.startDate) : null,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        members: {
          create: {
            userId: req.user!.id,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      },
    });

    await logActivity({
      userId: req.user!.id,
      projectId: project.id,
      action: 'CREATED',
      details: JSON.stringify({ message: `Created project "${project.name}" (${project.key})` }),
    });

    emitGlobal('project:created', project);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateProjectSchema.parse(req.body);

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
      },
    });

    emitGlobal('project:updated', project);

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (req.user!.role !== 'ADMIN') {
      return next(new AppError('Only Admins can delete projects', 403));
    }

    await prisma.project.delete({
      where: { id },
    });

    emitGlobal('project:deleted', { projectId: id });

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const addProjectMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { userId, role = 'CONTRIBUTOR' } = req.body;

    if (!userId) {
      return next(new AppError('User ID is required', 400));
    }

    const membership = await prisma.projectMember.upsert({
      where: {
        projectId_userId: { projectId: id, userId },
      },
      update: { role },
      create: { projectId: id, userId, role },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
      },
    });

    res.status(201).json({
      success: true,
      data: { membership },
    });
  } catch (error) {
    next(error);
  }
};

export const removeProjectMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, userId } = req.params;

    await prisma.projectMember.delete({
      where: {
        projectId_userId: { projectId: id, userId },
      },
    });

    res.json({
      success: true,
      message: 'Member removed from project',
    });
  } catch (error) {
    next(error);
  }
};
