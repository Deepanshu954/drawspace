import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { SnippetList } from '@/components/snippets/SnippetList';
import { CodeSnippet } from '@/types/database';
import { redirect } from 'next/navigation';

export default async function SnippetsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const { data: snippets, error } = await supabase
    .from('code_snippets')
    .select(`
      *,
      owner:profiles!code_snippets_owner_id_fkey(id, name, email, role, is_active)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching code snippets:', error);
  }

  const formatted: CodeSnippet[] = (snippets || []).map((s: any) => ({
    ...s,
    owner: Array.isArray(s.owner) ? s.owner[0] : s.owner,
  }));

  return (
    <SnippetList
      initialSnippets={formatted}
      currentUserId={user.id}
      currentUserRole={profile?.role}
    />
  );
}
