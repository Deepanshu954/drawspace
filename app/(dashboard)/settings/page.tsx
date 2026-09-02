import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';
import { Badge } from '@/components/ui/Badge';
import { redirect } from 'next/navigation';
import { User, Lock, Shield } from 'lucide-react';

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Account Settings
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Manage your account profile and security credentials.
        </p>
      </div>

      {/* Profile Overview */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Profile Information
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase">
              Full Name
            </label>
            <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {profile?.name || 'User'}
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase">
              Email Address
            </label>
            <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {profile?.email}
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase">
              Role
            </label>
            <div className="mt-1">
              <Badge variant={profile?.role as any}>{profile?.role}</Badge>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase">
              Status
            </label>
            <div className="mt-1">
              <Badge variant={profile?.is_active ? 'active' : 'inactive'}>
                {profile?.is_active ? 'Active' : 'Disabled'}
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Change Password */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Change Password
          </h2>
        </div>
        <p className="text-xs text-zinc-500">
          Update your password to keep your DrawSpace account secure.
        </p>

        <ChangePasswordForm />
      </section>
    </div>
  );
}
