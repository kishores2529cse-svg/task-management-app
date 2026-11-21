import React, { useState } from 'react';
import { CheckSquare, ArrowRight, Lock, Mail, User, Briefcase, Building } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const { error, success } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER'>('MEMBER');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      error('Please complete required fields');
      return;
    }
    if (password.length < 6) {
      error('Password must be at least 6 characters');
      return;
    }

    try {
      setIsLoading(true);
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        title: title.trim() || null,
        department: department.trim() || null,
        role,
      });
      success('Account created');
    } catch (err: any) {
      error('Registration failed', err.response?.data?.message || 'Email already exists');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center py-12 px-4 sm:px-6">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-9 h-9 rounded bg-zinc-900 dark:bg-zinc-100 items-center justify-center text-white dark:text-zinc-900 mb-3 shadow-xs">
          <CheckSquare className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Create Account
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Set up your team member profile
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-zinc-900 py-6 px-5 sm:px-6 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Full Name */}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Elena Rostova"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 font-medium"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="elena@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 font-mono"
                />
              </div>
            </div>

            {/* Title & Department */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  placeholder="Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  placeholder="Engineering"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                Role Tier
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
              >
                <option value="MEMBER">Member (Contributor)</option>
                <option value="MANAGER">Manager (Project Lead)</option>
                <option value="ADMIN">Admin (Full Access)</option>
                <option value="VIEWER">Viewer (Read-Only)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2 px-3 rounded text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <span>{isLoading ? 'Creating account...' : 'Create Account'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="text-center pt-1 text-xs text-zinc-500">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
