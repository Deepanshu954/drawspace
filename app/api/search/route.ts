import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UniversalSearchResult } from '@/types/database';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('q') || '').toLowerCase().trim();
    const type = searchParams.get('type') || 'all';

    const results: UniversalSearchResult[] = [];

    // 1. Search Boards
    if (type === 'all' || type === 'board') {
      let bQuery = supabase.from('boards').select('id, name, created_at, updated_at');
      if (query) {
        bQuery = bQuery.ilike('name', `%${query}%`);
      }
      const { data: boards } = await bQuery.limit(10);
      (boards || []).forEach((b) => {
        results.push({
          id: b.id,
          type: 'board',
          title: b.name,
          snippet: 'Collaborative Excalidraw whiteboard canvas',
          url: `/board/${b.id}`,
          created_at: b.updated_at,
        });
      });
    }

    // 2. Search Documents
    if (type === 'all' || type === 'document') {
      let dQuery = supabase.from('documents').select('id, title, content, updated_at');
      if (query) {
        dQuery = dQuery.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
      }
      const { data: docs } = await dQuery.limit(10);
      (docs || []).forEach((d) => {
        results.push({
          id: d.id,
          type: 'document',
          title: d.title,
          snippet: d.content.substring(0, 150),
          url: `/documents/${d.id}`,
          created_at: d.updated_at,
        });
      });
    }

    // 3. Search Code Snippets
    if (type === 'all' || type === 'snippet') {
      let sQuery = supabase.from('code_snippets').select('id, title, language, code, description, updated_at');
      if (query) {
        sQuery = sQuery.or(`title.ilike.%${query}%,code.ilike.%${query}%,description.ilike.%${query}%`);
      }
      const { data: snippets } = await sQuery.limit(10);
      (snippets || []).forEach((s) => {
        results.push({
          id: s.id,
          type: 'snippet',
          title: `${s.title} (${s.language})`,
          snippet: s.code.substring(0, 150),
          url: `/snippets`,
          created_at: s.updated_at,
        });
      });
    }

    // 4. Search Messages
    if (type === 'all' || type === 'message') {
      let mQuery = supabase.from('messages').select('id, content, channel_id, created_at');
      if (query) {
        mQuery = mQuery.ilike('content', `%${query}%`);
      }
      const { data: msgs } = await mQuery.limit(10);
      (msgs || []).forEach((m) => {
        results.push({
          id: m.id,
          type: 'message',
          title: 'Chat Message',
          snippet: m.content,
          url: m.channel_id ? `/chat/${m.channel_id}` : '/chat',
          created_at: m.created_at,
        });
      });
    }

    // Sort combined results by created_at desc
    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
