import React, { useState } from 'react';
import { supabaseAuth } from '../services/supabaseAuth';
import { User } from '../types';
import { Scale, X, ArrowRight, Loader2, Mail, Lock, User as UserIcon } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Sign In only
      const { data, error } = await supabaseAuth.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        onLogin();
        onClose();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto shadow-2xl">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content - Split Layout */}
      <div className="relative w-full max-w-4xl min-h-[600px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row transform transition-all animate-fade-in-up">

        {/* Left Panel - Branding */}
        <div className="w-full md:w-5/12 bg-slate-900 text-white p-10 md:p-12 relative overflow-hidden flex flex-col justify-between">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-900/50 z-0" />
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px]" />
          <div className="absolute top-1/2 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]" />

          {/* Abstract Visual Lines */}
          <div className="absolute top-12 left-8 opacity-20">
            <div className="w-32 h-32 border border-blue-400 rounded-full flex items-center justify-center">
              <div className="w-20 h-20 border border-indigo-400 rounded-full" />
            </div>
            <div className="absolute top-4 right-0 w-2 h-2 bg-blue-400 rounded-full" />
          </div>

          <div className="relative z-10 flex gap-3 items-center mb-10">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
              <Scale size={20} className="text-blue-300" />
            </div>
            <span className="font-bold text-xl tracking-wide">Al-Mizan</span>
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4 leading-tight">Sharia Governance Engine</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-8">
              Access your personalized compliance dashboard and verified regulatory intelligence tools.
            </p>
            <div className="inline-flex w-12 h-12 rounded-full bg-blue-600 items-center justify-center shadow-lg shadow-blue-500/30">
              <ArrowRight size={20} />
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="w-full md:w-7/12 p-8 md:p-12 bg-white relative flex flex-col justify-center">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10"
          >
            <X size={20} />
          </button>

          <div className="w-full max-w-md mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h2>
              <p className="text-slate-500">Sign in to your account</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-6 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                <div className="mt-0.5 min-w-[4px] h-4 w-4 rounded-full bg-red-200 flex items-center justify-center text-[10px] font-bold">!</div>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                    placeholder="Enter your email address"
                  />
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                    placeholder="Enter your password"
                  />
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="flex justify-end">
                <button type="button" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-all">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-slate-400 text-xs">
                Enterprise Access Only. Contact system administrator for account requests.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;