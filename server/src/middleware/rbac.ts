import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden: Role '${req.user.role}' does not have sufficient permissions for this action. Required: ${allowedRoles.join(', ')}`,
          403
        )
      );
    }

    next();
  };
};

export const canModifyTask = (userRole: string, isAssignee: boolean, isReporter: boolean) => {
  if (['ADMIN', 'MANAGER'].includes(userRole)) return true;
  if (userRole === 'MEMBER' && (isAssignee || isReporter)) return true;
  return false;
};
