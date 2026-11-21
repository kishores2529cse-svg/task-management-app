export type UserRole = 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
  title?: string | null;
  department?: string | null;
  isActive?: boolean;
  createdAt?: string;
  _count?: {
    assignedTasks?: number;
    comments?: number;
    reportedTasks?: number;
  };
}

export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskType = 'TASK' | 'BUG' | 'FEATURE' | 'IMPROVEMENT' | 'MILESTONE';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  orderIndex: number;
  createdAt: string;
}

export interface Attachment {
  id: string;
  taskId: string;
  name: string;
  url: string;
  size?: string;
  type?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    role: UserRole;
  };
}

export interface Activity {
  id: string;
  taskId?: string | null;
  projectId?: string | null;
  userId: string;
  action: string;
  details: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    role: UserRole;
  };
  task?: {
    id: string;
    code: string;
    title: string;
  } | null;
  project?: {
    id: string;
    name: string;
    key: string;
  } | null;
}

export interface Task {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  projectId: string;
  assigneeId?: string | null;
  reporterId: string;
  dueDate?: string | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
    key: string;
    color: string;
  };
  assignee?: User | null;
  reporter?: User;
  subtasks?: Subtask[];
  tags?: Tag[];
  comments?: Comment[];
  attachments?: Attachment[];
  activities?: Activity[];
  completedSubtasksCount?: number;
  totalSubtasksCount?: number;
  _count?: {
    comments?: number;
    attachments?: number;
    subtasks?: number;
  };
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description?: string | null;
  color: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';
  startDate?: string | null;
  targetDate?: string | null;
  createdAt: string;
  updatedAt: string;
  members?: {
    id: string;
    userId: string;
    role: string;
    joinedAt: string;
    user: User;
  }[];
  stats?: {
    totalTasks: number;
    completedTasks: number;
    progressPercent: number;
    membersCount: number;
  };
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ASSIGNMENT' | 'STATUS_CHANGE' | 'DUE_SOON' | 'MENTION' | 'SYSTEM' | 'PRIORITY';
  taskId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface AnalyticsData {
  metrics: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    inReviewTasks: number;
    todoTasks: number;
    backlogTasks: number;
    overdueTasks: number;
    completionRate: number;
  };
  statusData: { name: string; count: number; color: string }[];
  priorityData: { name: string; count: number; color: string }[];
  workloadData: {
    id: string;
    name: string;
    avatar?: string | null;
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
  }[];
  trendData: {
    date: string;
    label: string;
    created: number;
    completed: number;
  }[];
  upcomingDeadlines: {
    id: string;
    code: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
  }[];
}
