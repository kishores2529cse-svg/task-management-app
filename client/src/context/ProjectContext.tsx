import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { Project } from '../types';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

interface ProjectContextType {
  projects: Project[];
  selectedProjectId: string;
  selectedProject: Project | null;
  setSelectedProjectId: (id: string) => void;
  isLoading: boolean;
  refreshProjects: () => Promise<void>;
  createProject: (data: any) => Promise<Project>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProjects = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const res = await api.get('/projects');
      setProjects(res.data.data.projects);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    socket.on('project:created', (newProj: Project) => {
      setProjects((prev) => [newProj, ...prev]);
    });

    socket.on('project:updated', (updatedProj: Project) => {
      setProjects((prev) =>
        prev.map((p) => (p.id === updatedProj.id ? { ...p, ...updatedProj } : p))
      );
    });

    socket.on('project:deleted', ({ projectId }: { projectId: string }) => {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (selectedProjectId === projectId) {
        setSelectedProjectId('all');
      }
    });

    return () => {
      socket.off('project:created');
      socket.off('project:updated');
      socket.off('project:deleted');
    };
  }, [socket, selectedProjectId]);

  const createProject = async (data: any) => {
    const res = await api.post('/projects', data);
    const newProj = res.data.data.project;
    setProjects((prev) => [newProj, ...prev]);
    return newProj;
  };

  const selectedProject =
    selectedProjectId === 'all'
      ? null
      : projects.find((p) => p.id === selectedProjectId) || null;

  return (
    <ProjectContext.Provider
      value={{
        projects,
        selectedProjectId,
        selectedProject,
        setSelectedProjectId,
        isLoading,
        refreshProjects: fetchProjects,
        createProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
