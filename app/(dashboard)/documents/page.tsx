import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { DocumentList } from '@/components/documents/DocumentList';
import { Document } from '@/types/database';
import { redirect } from 'next/navigation';

export default async function DocumentsPage() {
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

  const { data: docs, error } = await supabase
    .from('documents')
    .select(`
      *,
      owner:profiles!documents_owner_id_fkey(id, name, email, role, is_active)
    `)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
  }

  const formatted: Document[] = (docs || []).map((d: any) => ({
    ...d,
    owner: Array.isArray(d.owner) ? d.owner[0] : d.owner,
  }));

  return (
    <DocumentList
      initialDocuments={formatted}
      currentUserId={user.id}
      currentUserRole={profile?.role}
    />
  );
}
