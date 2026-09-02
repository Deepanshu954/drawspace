import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createSnippetSchema = z.object({
  title: z.string().min(1).max(100),
  language: z.string().min(1).max(30).default('typescript'),
  code: z.string().min(1),
  description: z.string().max(300).optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: snippets, error } = await supabase
      .from('code_snippets')
      .select(`
        *,
        owner:profiles!code_snippets_owner_id_fkey(id, name, email, role, is_active)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = (snippets || []).map((s: any) => ({
      ...s,
      owner: Array.isArray(s.owner) ? s.owner[0] : s.owner,
    }));

    return NextResponse.json({ snippets: formatted });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createSnippetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { data: snippet, error } = await supabase
      .from('code_snippets')
      .insert({
        title: parsed.data.title,
        language: parsed.data.language,
        code: parsed.data.code,
        description: parsed.data.description || null,
        owner_id: user.id,
      })
      .select(`
        *,
        owner:profiles!code_snippets_owner_id_fkey(id, name, email, role, is_active)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = {
      ...snippet,
      owner: Array.isArray(snippet.owner) ? snippet.owner[0] : snippet.owner,
    };

    return NextResponse.json({ snippet: formatted }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
