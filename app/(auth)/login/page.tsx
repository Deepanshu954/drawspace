import React, { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { Pencil } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
          <Pencil className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          DrawSpace
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Sign in to your private collaborative workspace
        </p>
      </div>

      <Suspense fallback={<div className="h-48 flex items-center justify-center text-sm text-zinc-400">Loading form...</div>}>
        <LoginForm />
      </Suspense>

      <div className="mt-6 border-t border-zinc-100 pt-4 text-center dark:border-zinc-800">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Access is invite-only. Contact your workspace administrator for credentials.
        </p>
      </div>
    </div>
  );
}
