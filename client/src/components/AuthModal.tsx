import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, RefreshCw } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset everything on open
  useEffect(() => {
    if (isOpen) {
      setMode('login');
      setFormData({ email: '', password: '', name: '', confirmPassword: '' });
      setShowPassword(false);
      setShowConfirmPassword(false);
      setError('');
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Email format check
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (mode === 'register') {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }

    setIsLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          ...(mode === 'register' && { name: formData.name })
        })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Authentication failed.');

      // Save token & user
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_id', data.user.id.toString());
      localStorage.setItem('auth_type', mode);

      onAuthSuccess(data.user);
      setIsLoading(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onKeyDown={e => e.key === 'Escape' && onClose()}
      onClick={onClose}
    >
      <div
        className="theme-surface rounded-2xl shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="theme-primary p-6 border-b border-[var(--theme-accent)]/30 rounded-t-2xl flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6 theme-text" />
            <h2 id="auth-modal-title" className="text-xl font-bold theme-text">
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="theme-text-secondary mb-4 text-sm">
            {mode === 'login'
              ? 'Sign in to sync your data across devices.'
              : 'Create an account to backup and sync your wellness data.'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg" role="alert">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium theme-text mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 theme-text-secondary" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[var(--theme-surface)] border border-[var(--theme-accent)]/30 rounded-lg theme-text placeholder-[var(--theme-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/50"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium theme-text mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 theme-text-secondary" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[var(--theme-surface)] border border-[var(--theme-accent)]/30 rounded-lg theme-text placeholder-[var(--theme-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium theme-text mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 theme-text-secondary" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-12 py-3 bg-[var(--theme-surface)] border border-[var(--theme-accent)]/30 rounded-lg theme-text placeholder-[var(--theme-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 theme-text-secondary hover:theme-text transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium theme-text mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 theme-text-secondary" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    required
                    className="w-full pl-10 pr-12 py-3 bg-[var(--theme-surface)] border border-[var(--theme-accent)]/30 rounded-lg theme-text placeholder-[var(--theme-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 theme-text-secondary hover:theme-text transition-colors"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center space-x-2 bg-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/80 disabled:bg-[var(--theme-accent)]/50 text-white py-3 rounded-lg font-medium transition-colors"
            >
              {isLoading && <RefreshCw className="w-5 h-5 animate-spin" />}
              <span>{isLoading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}</span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setMode(m => (m === 'login' ? 'register' : 'login'))}
              className="text-[var(--theme-accent)] hover:text-[var(--theme-accent)]/80 text-sm font-medium transition-colors"
            >
              {mode === 'login'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={onClose}
              className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)] text-sm transition-colors"
            >
              Continue as anonymous user
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
