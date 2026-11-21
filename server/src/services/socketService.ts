import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

let io: Server | null = null;
const onlineUsers = new Map<string, { socketId: string; user: any }>();
const taskViewers = new Map<string, Set<string>>(); // taskId -> Set of userIds

export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
  });

  io.use((socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers.authorization?.replace('Bearer ', ''));

      if (!token) {
        // Allow anonymous connection or restrict
        return next();
      }

      const decoded = jwt.verify(token, config.jwtSecret) as any;
      (socket as any).user = decoded;
      next();
    } catch (err) {
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;

    if (user?.id) {
      onlineUsers.set(user.id, { socketId: socket.id, user });
      socket.join(`user:${user.id}`);
      broadcastOnlineUsers();
    }

    // Join project room
    socket.on('project:join', (projectId: string) => {
      socket.join(`project:${projectId}`);
    });

    socket.on('project:leave', (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    // Task viewing indicators
    socket.on('task:view_start', ({ taskId, userId, userName }: { taskId: string; userId: string; userName: string }) => {
      socket.join(`task:${taskId}`);
      if (!taskViewers.has(taskId)) {
        taskViewers.set(taskId, new Set());
      }
      taskViewers.get(taskId)?.add(userName);
      io?.to(`task:${taskId}`).emit('task:viewers_updated', {
        taskId,
        viewers: Array.from(taskViewers.get(taskId) || []),
      });
    });

    socket.on('task:view_stop', ({ taskId, userName }: { taskId: string; userName: string }) => {
      socket.leave(`task:${taskId}`);
      taskViewers.get(taskId)?.delete(userName);
      io?.to(`task:${taskId}`).emit('task:viewers_updated', {
        taskId,
        viewers: Array.from(taskViewers.get(taskId) || []),
      });
    });

    socket.on('disconnect', () => {
      if (user?.id) {
        onlineUsers.delete(user.id);
        broadcastOnlineUsers();
      }
    });
  });

  const broadcastOnlineUsers = () => {
    if (!io) return;
    const users = Array.from(onlineUsers.values()).map((entry) => ({
      id: entry.user.id,
      name: entry.user.name,
      email: entry.user.email,
      role: entry.user.role,
    }));
    io.emit('presence:online_users', users);
  };

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
};

// Real-time notification helpers
export const emitToUser = (userId: string, event: string, data: any) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

export const emitToProject = (projectId: string, event: string, data: any) => {
  if (!io) return;
  io.to(`project:${projectId}`).emit(event, data);
  // Also emit globally for dashboards that view all projects
  io.emit(event, { ...data, projectId });
};

export const emitGlobal = (event: string, data: any) => {
  if (!io) return;
  io.emit(event, data);
};
