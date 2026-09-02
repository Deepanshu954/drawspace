import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { DocumentEditor } from '@/components/documents/DocumentEditor';
import { Document } from '@/types/database';
import { redirect } from 'next/navigation';

interface DocumentPageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: doc, error } = await supabase
    .from('documents')
    .select(`
      *,
      owner:profiles!documents_owner_id_fkey(id, name, email, role, is_active)
    `)
    .eq('id', id)
    .single();

  if (error || !doc) {
    redirect('/documents');
  }

  const formatted: Document = {
    ...doc,
    owner: Array.isArray(doc.owner) ? doc.owner[0] : doc.owner,
  };

  return (
    <DocumentEditor
      document={formatted}
      currentUserId={user.id}
    />
  );
}
