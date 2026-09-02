import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { UserTable } from '@/components/admin/UserTable';
import { Profile } from '@/types/database';
import { redirect } from 'next/navigation';

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard?error=unauthorized');
  }

  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching admin users:', error);
  }

  return (
    <UserTable
      initialUsers={(users as Profile[]) || []}
      currentUserId={user.id}
    />
  );
}
