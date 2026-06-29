'use client';

import { useState, useTransition } from 'react';
import { Plane, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { adminLoginAction } from '@/app/admin/dashboard/actions';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      const result = await adminLoginAction(email, password);
      if (result.success) {
        router.push(result.data.redirect);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <main className="min-h-screen animated-bg flex items-center justify-center px-6">
      {/* Background orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600/20 rounded-2xl border border-indigo-500/20 mb-4">
            <Plane className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Admin Login</h1>
          <p className="text-slate-400 mt-2">Sign in to the AirTransfer dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-5 glow">
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label htmlFor="admin-email" className="block text-sm text-slate-400 mb-2">
              <Mail className="inline w-4 h-4 mr-1" />Email Address
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              required
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-4 py-3 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-sm text-slate-400 mb-2">
              <Lock className="inline w-4 h-4 mr-1" />Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-4 py-3 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
            />
          </div>

          <button
            id="admin-login-btn"
            type="submit"
            disabled={isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-all"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
            ) : (
              <><Lock className="w-4 h-4" /> Sign In</>
            )}
          </button>
        </form>

        <p className="text-center text-slate-600 text-sm mt-6">
          <a href="/" className="hover:text-slate-400 transition-colors">← Back to booking site</a>
        </p>
      </div>
    </main>
  );
}
