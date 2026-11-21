import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Trash2, 
  Paperclip, 
  ExternalLink, 
  Send,
  Edit2,
  Eye,
  Plus
} from 'lucide-react';
import type { Task, Subtask, Comment, TaskStatus, TaskPriority } from '../../types';
import { PriorityBadge, TypeBadge } from '../common/Badge';
import { UserAvatar } from '../common/UserAvatar';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

interface TaskDetailDrawerProps {
  taskId: string | null;
  onClose: () => void;
  onTaskUpdated?: (updatedTask: Task) => void;
  onTaskDeleted?: (taskId: string) => void;
  availableUsers?: any[];
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  taskId,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
  availableUsers = [],
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { success, error } = useToast();

  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'details' | 'checklist' | 'comments' | 'activity' | 'attachments'>('details');

  // Edit states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState('');

  // Subtask draft
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Comment draft
  const [commentContent, setCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Attachment draft
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [showAddAttachment, setShowAddAttachment] = useState(false);

  // Live viewers
  const [viewers, setViewers] = useState<string[]>([]);

  // Fetch task detail
  const fetchTask = async (id: string) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/tasks/${id}`);
      const t = res.data.data.task;
      setTask(t);
      setTitleDraft(t.title);
      setDescDraft(t.description || '');
    } catch (err: any) {
      error('Failed to load task details', err.response?.data?.message);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      fetchTask(taskId);

      if (socket && user) {
        socket.emit('task:view_start', {
          taskId,
          userId: user.id,
          userName: user.name,
        });

        socket.on('task:viewers_updated', (data: { taskId: string; viewers: string[] }) => {
          if (data.taskId === taskId) {
            setViewers(data.viewers.filter((v) => v !== user.name));
          }
        });

        socket.on('task:updated', (updated: Task) => {
          if (updated.id === taskId) {
            setTask((prev) => (prev ? { ...prev, ...updated } : updated));
          }
        });

        socket.on('comment:created', (data: { taskId: string; comment: Comment }) => {
          if (data.taskId === taskId) {
            setTask((prev) => {
              if (!prev) return null;
              const existing = prev.comments || [];
              if (existing.some((c) => c.id === data.comment.id)) return prev;
              return { ...prev, comments: [data.comment, ...existing] };
            });
          }
        });

        socket.on('subtask:created', (data: { taskId: string; subtask: Subtask }) => {
          if (data.taskId === taskId) {
            setTask((prev) => {
              if (!prev) return null;
              const existing = prev.subtasks || [];
              return { ...prev, subtasks: [...existing, data.subtask] };
            });
          }
        });

        socket.on('subtask:updated', (data: { taskId: string; subtask: Subtask }) => {
          if (data.taskId === taskId) {
            setTask((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                subtasks: prev.subtasks?.map((s) =>
                  s.id === data.subtask.id ? data.subtask : s
                ),
              };
            });
          }
        });
      }

      return () => {
        if (socket && user && taskId) {
          socket.emit('task:view_stop', {
            taskId,
            userName: user.name,
          });
          socket.off('task:viewers_updated');
          socket.off('task:updated');
          socket.off('comment:created');
          socket.off('subtask:created');
          socket.off('subtask:updated');
        }
      };
    }
  }, [taskId, socket, user?.id]);

  if (!taskId) return null;

  const canEdit = user?.role !== 'VIEWER';

  const handleSaveTitle = async () => {
    if (!task || !titleDraft.trim()) return;
    try {
      const res = await api.put(`/tasks/${task.id}`, { title: titleDraft.trim() });
      const updated = res.data.data.task;
      setTask(updated);
      setIsEditingTitle(false);
      if (onTaskUpdated) onTaskUpdated(updated);
      success('Title updated');
    } catch (err: any) {
      error('Failed to update title', err.response?.data?.message);
    }
  };

  const handleSaveDesc = async () => {
    if (!task) return;
    try {
      const res = await api.put(`/tasks/${task.id}`, { description: descDraft });
      const updated = res.data.data.task;
      setTask(updated);
      setIsEditingDesc(false);
      if (onTaskUpdated) onTaskUpdated(updated);
      success('Description updated');
    } catch (err: any) {
      error('Failed to update description', err.response?.data?.message);
    }
  };

  const handleUpdateStatus = async (status: TaskStatus) => {
    if (!task || !canEdit) return;
    try {
      const res = await api.patch(`/tasks/${task.id}/status`, { status });
      const updated = res.data.data.task;
      setTask(updated);
      if (onTaskUpdated) onTaskUpdated(updated);
      success(`Moved to ${status}`);
    } catch (err: any) {
      error('Failed to update status', err.response?.data?.message);
    }
  };

  const handleUpdatePriority = async (priority: TaskPriority) => {
    if (!task || !canEdit) return;
    try {
      const res = await api.put(`/tasks/${task.id}`, { priority });
      const updated = res.data.data.task;
      setTask(updated);
      if (onTaskUpdated) onTaskUpdated(updated);
      success(`Priority set to ${priority}`);
    } catch (err: any) {
      error('Failed to update priority', err.response?.data?.message);
    }
  };

  const handleUpdateAssignee = async (assigneeId: string | null) => {
    if (!task || !canEdit) return;
    try {
      const res = await api.put(`/tasks/${task.id}`, { assigneeId });
      const updated = res.data.data.task;
      setTask(updated);
      if (onTaskUpdated) onTaskUpdated(updated);
      success('Assignee updated');
    } catch (err: any) {
      error('Failed to update assignee', err.response?.data?.message);
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !newSubtaskTitle.trim() || !canEdit) return;
    try {
      const res = await api.post(`/tasks/${task.id}/subtasks`, { title: newSubtaskTitle.trim() });
      const created = res.data.data.subtask;
      setTask((prev) => (prev ? { ...prev, subtasks: [...(prev.subtasks || []), created] } : null));
      setNewSubtaskTitle('');
      if (onTaskUpdated && task) {
        onTaskUpdated({ ...task, subtasks: [...(task.subtasks || []), created] });
      }
    } catch (err: any) {
      error('Failed to add subtask', err.response?.data?.message);
    }
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    if (!task || !canEdit) return;
    try {
      const res = await api.patch(`/tasks/subtasks/${subtaskId}/toggle`);
      const updated = res.data.data.subtask;
      const newSubtasks = (task.subtasks || []).map((s) => (s.id === subtaskId ? updated : s));
      setTask({ ...task, subtasks: newSubtasks });
      if (onTaskUpdated) onTaskUpdated({ ...task, subtasks: newSubtasks });
    } catch (err: any) {
      error('Failed to toggle subtask', err.response?.data?.message);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!task || !canEdit) return;
    try {
      await api.delete(`/tasks/subtasks/${subtaskId}`);
      const newSubtasks = (task.subtasks || []).filter((s) => s.id !== subtaskId);
      setTask({ ...task, subtasks: newSubtasks });
      if (onTaskUpdated) onTaskUpdated({ ...task, subtasks: newSubtasks });
    } catch (err: any) {
      error('Failed to delete subtask', err.response?.data?.message);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !commentContent.trim()) return;
    try {
      setIsSubmittingComment(true);
      const res = await api.post('/comments', {
        taskId: task.id,
        content: commentContent.trim(),
      });
      const created = res.data.data.comment;
      setTask((prev) => (prev ? { ...prev, comments: [created, ...(prev.comments || [])] } : null));
      setCommentContent('');
      success('Comment posted');
    } catch (err: any) {
      error('Failed to post comment', err.response?.data?.message);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleAddAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !newAttachmentName.trim() || !newAttachmentUrl.trim()) return;
    try {
      const res = await api.post(`/tasks/${task.id}/attachments`, {
        name: newAttachmentName.trim(),
        url: newAttachmentUrl.trim(),
        size: '1.2 MB',
        type: 'link',
      });
      const created = res.data.data.attachment;
      setTask((prev) => (prev ? { ...prev, attachments: [created, ...(prev.attachments || [])] } : null));
      setNewAttachmentName('');
      setNewAttachmentUrl('');
      setShowAddAttachment(false);
      success('Attachment added');
    } catch (err: any) {
      error('Failed to add attachment', err.response?.data?.message);
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    if (!window.confirm(`Delete task ${task.code}?`)) return;
    try {
      await api.delete(`/tasks/${task.id}`);
      success('Task deleted');
      if (onTaskDeleted) onTaskDeleted(task.id);
      onClose();
    } catch (err: any) {
      error('Failed to delete task', err.response?.data?.message);
    }
  };

  const completedSubtasks = task?.subtasks?.filter((s) => s.isCompleted).length || 0;
  const totalSubtasks = task?.subtasks?.length || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white dark:bg-zinc-900 shadow-lg border-l border-zinc-200 dark:border-zinc-800 flex flex-col animate-in slide-in-from-right duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TypeBadge type={task?.type || 'TASK'} />
              <span className="font-mono text-xs font-medium text-zinc-500">
                {task?.code}
              </span>
              {task?.project && (
                <span className="text-[11px] font-mono text-zinc-400">
                  {task.project.name}
                </span>
              )}

              {/* Live Viewers Indicator */}
              {viewers.length > 0 && (
                <div className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-500 font-mono">
                  <Eye className="w-3 h-3" />
                  <span>{viewers.join(', ')}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              {(user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.id === task?.reporterId) && (
                <button
                  onClick={handleDeleteTask}
                  className="p-1 text-zinc-400 hover:text-red-600 rounded transition-colors"
                  title="Delete Task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isLoading || !task ? (
            <div className="p-8 text-center text-zinc-400 text-xs">Loading task...</div>
          ) : (
            <>
              {/* Properties Bar */}
              <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* Status */}
                <div>
                  <span className="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                    Status
                  </span>
                  <select
                    value={task.status}
                    disabled={!canEdit}
                    onChange={(e) => handleUpdateStatus(e.target.value as TaskStatus)}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
                  >
                    <option value="BACKLOG">Backlog</option>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <span className="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                    Priority
                  </span>
                  <select
                    value={task.priority}
                    disabled={!canEdit}
                    onChange={(e) => handleUpdatePriority(e.target.value as TaskPriority)}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                {/* Assignee */}
                <div>
                  <span className="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                    Assignee
                  </span>
                  <select
                    value={task.assigneeId || ''}
                    disabled={!canEdit}
                    onChange={(e) => handleUpdateAssignee(e.target.value || null)}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <span className="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                    Due Date
                  </span>
                  <div className="text-xs text-zinc-700 dark:text-zinc-300 py-1 font-mono">
                    {task.dueDate ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-zinc-400" />
                        {new Date(task.dueDate).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    ) : (
                      <span className="text-zinc-400">None</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-4 text-xs font-medium">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`py-2 px-2.5 border-b-2 transition-colors ${
                    activeTab === 'details'
                      ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-semibold'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('checklist')}
                  className={`py-2 px-2.5 border-b-2 transition-colors flex items-center gap-1 ${
                    activeTab === 'checklist'
                      ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-semibold'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <span>Checklist</span>
                  {totalSubtasks > 0 && (
                    <span className="text-[10px] font-mono px-1 rounded bg-zinc-100 dark:bg-zinc-800">
                      {completedSubtasks}/{totalSubtasks}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`py-2 px-2.5 border-b-2 transition-colors flex items-center gap-1 ${
                    activeTab === 'comments'
                      ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-semibold'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <span>Comments</span>
                  {(task.comments?.length || 0) > 0 && (
                    <span className="text-[10px] font-mono px-1 rounded bg-zinc-100 dark:bg-zinc-800">
                      {task.comments?.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`py-2 px-2.5 border-b-2 transition-colors ${
                    activeTab === 'activity'
                      ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-semibold'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Audit Log
                </button>
                <button
                  onClick={() => setActiveTab('attachments')}
                  className={`py-2 px-2.5 border-b-2 transition-colors flex items-center gap-1 ${
                    activeTab === 'attachments'
                      ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-semibold'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <span>Files</span>
                  {(task.attachments?.length || 0) > 0 && (
                    <span className="text-[10px] font-mono px-1 rounded bg-zinc-100 dark:bg-zinc-800">
                      {task.attachments?.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Tab Content Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* 1. OVERVIEW TAB */}
                {activeTab === 'details' && (
                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      {isEditingTitle ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={titleDraft}
                            onChange={(e) => setTitleDraft(e.target.value)}
                            className="w-full text-base font-semibold p-1.5 rounded border border-zinc-400 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                            autoFocus
                          />
                          <div className="flex gap-1.5">
                            <button
                              onClick={handleSaveTitle}
                              className="px-2.5 py-1 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium rounded hover:opacity-90"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setIsEditingTitle(false)}
                              className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-xs rounded text-zinc-600 dark:text-zinc-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2 group">
                          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                            {task.title}
                          </h2>
                          {canEdit && (
                            <button
                              onClick={() => setIsEditingTitle(true)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-zinc-600 rounded"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                          Description
                        </span>
                        {canEdit && !isEditingDesc && (
                          <button
                            onClick={() => setIsEditingDesc(true)}
                            className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                        )}
                      </div>

                      {isEditingDesc ? (
                        <div className="space-y-2">
                          <textarea
                            rows={5}
                            value={descDraft}
                            onChange={(e) => setDescDraft(e.target.value)}
                            placeholder="Add markdown description..."
                            className="w-full p-2.5 rounded border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-mono focus:outline-none"
                          />
                          <div className="flex gap-1.5">
                            <button
                              onClick={handleSaveDesc}
                              className="px-2.5 py-1 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium rounded hover:opacity-90"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setIsEditingDesc(false)}
                              className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-xs rounded text-zinc-600 dark:text-zinc-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/50 text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                          {task.description || (
                            <span className="text-zinc-400">No description provided.</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Hours */}
                    <div className="grid grid-cols-2 gap-3 p-3 rounded border border-zinc-200 dark:border-zinc-800 text-xs">
                      <div>
                        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">
                          Estimated Effort
                        </span>
                        <span className="font-mono text-xs font-medium text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                          {task.estimatedHours ? `${task.estimatedHours} hrs` : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">
                          Time Spent
                        </span>
                        <span className="font-mono text-xs font-medium text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                          {task.actualHours ? `${task.actualHours} hrs` : '0 hrs'}
                        </span>
                      </div>
                    </div>

                    {/* Metadata summary */}
                    <div className="text-[11px] text-zinc-400 space-y-0.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 font-mono">
                      <p>Created by {task.reporter?.name} • {new Date(task.createdAt).toLocaleDateString()}</p>
                      <p>Last updated • {new Date(task.updatedAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                )}

                {/* 2. CHECKLIST TAB */}
                {activeTab === 'checklist' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        Checklist
                      </span>
                      <span className="text-zinc-400 font-mono text-[11px]">
                        {completedSubtasks}/{totalSubtasks} completed
                      </span>
                    </div>

                    {/* Subtask items */}
                    <div className="space-y-1">
                      {task.subtasks?.map((subtask) => (
                        <div
                          key={subtask.id}
                          className="flex items-center justify-between p-2 rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group text-xs"
                        >
                          <label className="flex items-center gap-2 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={subtask.isCompleted}
                              disabled={!canEdit}
                              onChange={() => handleToggleSubtask(subtask.id)}
                              className="w-3.5 h-3.5 rounded text-zinc-900 focus:ring-0 border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800"
                            />
                            <span
                              className={`${
                                subtask.isCompleted
                                  ? 'line-through text-zinc-400 dark:text-zinc-500'
                                  : 'text-zinc-800 dark:text-zinc-200'
                              }`}
                            >
                              {subtask.title}
                            </span>
                          </label>

                          {canEdit && (
                            <button
                              onClick={() => handleDeleteSubtask(subtask.id)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-red-500 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}

                      {(!task.subtasks || task.subtasks.length === 0) && (
                        <p className="text-xs text-zinc-400 text-center py-4">
                          No checklist items.
                        </p>
                      )}
                    </div>

                    {/* Add subtask */}
                    {canEdit && (
                      <form onSubmit={handleAddSubtask} className="flex gap-1.5 pt-1">
                        <input
                          type="text"
                          placeholder="Add subtask..."
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={!newSubtaskTitle.trim()}
                          className="px-2.5 py-1 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium rounded disabled:opacity-40"
                        >
                          Add
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* 3. COMMENTS TAB */}
                {activeTab === 'comments' && (
                  <div className="space-y-4">
                    {/* Add comment */}
                    <form onSubmit={handleAddComment} className="space-y-2">
                      <textarea
                        rows={2}
                        placeholder="Write a comment (@name to mention)..."
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        className="w-full p-2.5 rounded border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isSubmittingComment || !commentContent.trim()}
                          className="px-3 py-1 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium rounded disabled:opacity-40 flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" /> Post
                        </button>
                      </div>
                    </form>

                    {/* Comment list */}
                    <div className="space-y-2.5 pt-1">
                      {task.comments?.map((comment) => (
                        <div
                          key={comment.id}
                          className="p-3 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/40 flex items-start gap-2.5 text-xs"
                        >
                          <UserAvatar user={comment.user} size="xs" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                {comment.user?.name}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                {new Date(comment.createdAt).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))}

                      {(!task.comments || task.comments.length === 0) && (
                        <p className="text-xs text-zinc-400 text-center py-4">
                          No comments yet.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. AUDIT ACTIVITY TAB */}
                {activeTab === 'activity' && (
                  <div className="space-y-3">
                    <div className="relative pl-4 space-y-4 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-[1px] before:bg-zinc-200 dark:before:bg-zinc-800">
                      {task.activities?.map((act) => {
                        let parsedDetails: any = null;
                        try {
                          parsedDetails = JSON.parse(act.details);
                        } catch (e) {}

                        return (
                          <div key={act.id} className="relative text-xs">
                            <div className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-600" />
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                {act.user?.name}
                              </span>
                              <span className="text-[10px] uppercase font-mono px-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                                {act.action}
                              </span>
                              <span className="text-[10px] text-zinc-400 ml-auto font-mono">
                                {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <p className="text-zinc-500 text-[11px]">
                              {parsedDetails?.message ||
                                (parsedDetails?.from &&
                                  `Status changed from ${parsedDetails.from} to ${parsedDetails.to}`) ||
                                (parsedDetails?.changes && parsedDetails.changes.join(', ')) ||
                                act.details}
                            </p>
                          </div>
                        );
                      })}

                      {(!task.activities || task.activities.length === 0) && (
                        <p className="text-xs text-zinc-400 text-center py-4">
                          No logged activity.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. ATTACHMENTS TAB */}
                {activeTab === 'attachments' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        Linked Resources
                      </span>
                      {canEdit && (
                        <button
                          onClick={() => setShowAddAttachment(!showAddAttachment)}
                          className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add Link
                        </button>
                      )}
                    </div>

                    {showAddAttachment && (
                      <form
                        onSubmit={handleAddAttachment}
                        className="p-3 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 space-y-2 text-xs"
                      >
                        <input
                          type="text"
                          placeholder="Resource Name..."
                          value={newAttachmentName}
                          onChange={(e) => setNewAttachmentName(e.target.value)}
                          className="w-full px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                          required
                        />
                        <input
                          type="url"
                          placeholder="https://..."
                          value={newAttachmentUrl}
                          onChange={(e) => setNewAttachmentUrl(e.target.value)}
                          className="w-full px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-[11px]"
                          required
                        />
                        <div className="flex gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => setShowAddAttachment(false)}
                            className="px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-2.5 py-0.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium"
                          >
                            Add
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="space-y-1.5">
                      {task.attachments?.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-2 rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Paperclip className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                            <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                              {att.name}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">({att.size || 'link'})</span>
                          </div>

                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ))}

                      {(!task.attachments || task.attachments.length === 0) && (
                        <p className="text-xs text-zinc-400 text-center py-4">
                          No linked resources.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
