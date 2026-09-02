import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { SearchPageContent } from '@/components/search/SearchPageContent';
import { UniversalSearchResult } from '@/types/database';
import { redirect } from 'next/navigation';

export default async function SearchPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch recent boards as initial results
  const { data: boards } = await supabase
    .from('boards')
    .select('id, name, updated_at')
    .order('updated_at', { ascending: false })
    .limit(5);

  const initialResults: UniversalSearchResult[] = (boards || []).map((b) => ({
    id: b.id,
    type: 'board',
    title: b.name,
    snippet: 'Collaborative Excalidraw whiteboard canvas',
    url: `/board/${b.id}`,
    created_at: b.updated_at,
  }));

  return <SearchPageContent initialResults={initialResults} />;
}
