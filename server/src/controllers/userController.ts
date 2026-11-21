import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER']),
});

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        title: true,
        department: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            assignedTasks: true,
            comments: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        title: true,
        department: true,
        isActive: true,
        createdAt: true,
        assignedTasks: {
          where: { status: { not: 'DONE' } },
          select: {
            id: true,
            code: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            project: { select: { id: true, name: true, key: true } },
          },
          take: 10,
        },
        _count: {
          select: {
            assignedTasks: true,
            comments: true,
            reportedTasks: true,
          },
        },
      },
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { role } = updateRoleSchema.parse(req.body);

    if (req.user!.role !== 'ADMIN') {
      return next(new AppError('Only Admins can change user roles', 403));
    }

    if (id === req.user!.id && role !== 'ADMIN') {
      return next(new AppError('Admins cannot demote their own account', 400));
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      data: { user: updated },
    });
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (req.user!.role !== 'ADMIN') {
      return next(new AppError('Only Admins can deactivate or activate accounts', 403));
    }

    if (id === req.user!.id) {
      return next(new AppError('You cannot deactivate your own account', 400));
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return next(new AppError('User not found', 404));

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, name: true, email: true, isActive: true },
    });

    res.json({
      success: true,
      message: `User ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user: updated },
    });
  } catch (error) {
    next(error);
  }
};
