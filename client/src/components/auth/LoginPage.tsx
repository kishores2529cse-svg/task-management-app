import React, { useState } from 'react';
import { CheckSquare, ArrowRight, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const { error, success } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      error('Email and password required');
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password);
      success('Signed in');
    } catch (err: any) {
      error('Sign in failed', err.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    try {
      setIsLoading(true);
      await login(demoEmail, 'Password123!');
      success('Signed in as demo persona');
    } catch (err: any) {
      error('Sign in failed', err.response?.data?.message);
    } finally {
      setIsLoading(false);
    }
  };

  const DEMO_PERSONAS = [
    {
      role: 'ADMIN',
      name: 'Sarah Chen',
      title: 'VP of Product',
      email: 'admin@taskflow.com',
    },
    {
      role: 'MANAGER',
      name: 'Alex Rivera',
      title: 'Lead Architect',
      email: 'manager@taskflow.com',
    },
    {
      role: 'MEMBER',
      name: 'Jordan Lee',
      title: 'Senior Engineer',
      email: 'member@taskflow.com',
    },
    {
      role: 'VIEWER',
      name: 'Taylor Smith',
      title: 'Product Auditor',
      email: 'viewer@taskflow.com',
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center py-12 px-4 sm:px-6">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-9 h-9 rounded bg-zinc-900 dark:bg-zinc-100 items-center justify-center text-white dark:text-zinc-900 mb-3 shadow-xs">
          <CheckSquare className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Sign in to TaskFlow
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Enterprise task management and team workspace
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-zinc-900 py-6 px-5 sm:px-6 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-5">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-1 py-2 px-3 rounded text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <span>{isLoading ? 'Signing in...' : 'Sign in'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Personas */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <span className="block text-[10px] font-medium uppercase tracking-wider text-zinc-400 mb-2">
              Demo Personas:
            </span>

            <div className="grid grid-cols-2 gap-2 text-left">
              {DEMO_PERSONAS.map((persona) => (
                <button
                  key={persona.email}
                  type="button"
                  onClick={() => handleQuickLogin(persona.email)}
                  disabled={isLoading}
                  className="p-2 rounded border border-zinc-200 dark:border-zinc-750 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-0.5">
                    <span>{persona.role}</span>
                  </div>
                  <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                    {persona.name}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate">{persona.title}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Switch to Register */}
          <div className="text-center pt-1 text-xs text-zinc-500">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToRegister}
              className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
            >
              Create one
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
