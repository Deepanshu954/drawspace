'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Lock, User, Mail, AlertCircle, CheckCircle2, UserPlus, LogIn } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';
  const urlError = searchParams.get('error');

  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state (2 fields)
  const [identifier, setIdentifier] = useState(''); // username or email
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state (3 fields: Username, Gmail/Email, Pass)
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    urlError === 'deactivated'
      ? 'Your account has been deactivated by an administrator.'
      : urlError === 'unauthorized'
      ? 'You do not have administrative privileges to access that section.'
      : null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle Login (Username/Email + Password)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const idVal = identifier.trim();
    if (!idVal || !loginPassword) {
      setErrorMessage('Please enter both your Username/Email and Password.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Resolve identifier to email if username was entered
      let targetEmail = idVal;
      if (!idVal.includes('@')) {
        const res = await fetch('/api/auth/resolve-identifier', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: idVal }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'No account found with this username');
        }
        targetEmail = data.email;

        if (data.status === 'pending') {
          throw new Error(
            'Your registration is currently pending administrator confirmation. Please check back once approved.'
          );
        }

        if (data.is_active === false) {
          throw new Error(
            'Your account is deactivated. Please contact your workspace administrator.'
          );
        }
      }

      // 2. Sign in with resolved email and password
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: loginPassword,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        // Double-check profile status and activation
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_active, status, role')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          if (profile.status === 'pending' || !profile.is_active) {
            await supabase.auth.signOut();
            throw new Error(
              profile.status === 'pending'
                ? 'Your access request is pending administrator confirmation.'
                : 'Your account is deactivated. Contact an administrator.'
            );
          }
        }

        router.push(redirectTo);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sign in. Please try again.');
      setIsLoading(false);
    }
  };

  // Handle Self-Registration Request (3 fields: Username, Email, Pass)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regUsername.trim() || !regEmail.trim() || !regPassword) {
      setErrorMessage('Please fill in all 3 fields.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername.trim(),
          email: regEmail.trim(),
          password: regPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit registration');
      }

      setSuccessMessage(
        'Access request sent! The administrator will review and confirm your account before you can log in.'
      );
      setRegUsername('');
      setRegEmail('');
      setRegPassword('');
      setMode('login');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error submitting access request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Mode Switcher Tabs */}
      <div className="flex rounded-xl bg-zinc-900 p-1 border border-zinc-800">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setErrorMessage(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
            mode === 'login'
              ? 'bg-zinc-800 text-zinc-100 shadow-xs'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          Sign In
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('register');
            setErrorMessage(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
            mode === 'register'
              ? 'bg-zinc-800 text-zinc-100 shadow-xs'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Request Access
        </button>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-red-900/50 bg-red-950/50 p-3.5 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <p className="leading-snug">{errorMessage}</p>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-900/50 bg-emerald-950/50 p-3.5 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          <p className="leading-snug">{successMessage}</p>
        </div>
      )}

      {mode === 'login' ? (
        /* Sign In Form: 2 Fields (Username/Email, Password) */
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Input
              label="Username or Email / Gmail"
              placeholder="e.g. deepanshu or you@gmail.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-2"
          >
            Sign In to DrawSpace
          </Button>
        </form>
      ) : (
        /* Request Access Form: 3 Fields (Username, Email/Gmail, Password) */
        <form onSubmit={handleRegister} className="space-y-3.5">
          <div>
            <Input
              label="1. Desired Username"
              placeholder="e.g. alex_coder"
              value={regUsername}
              onChange={(e) => setRegUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <Input
              label="2. Email / Gmail Address"
              type="email"
              placeholder="you@gmail.com"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              label="3. Password"
              type="password"
              placeholder="At least 6 characters"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-3"
          >
            Submit Access Request
          </Button>

          <p className="text-[11px] text-zinc-500 text-center pt-1">
            Your request will be sent to the administrator to confirm.
          </p>
        </form>
      )}
    </div>
  );
}
