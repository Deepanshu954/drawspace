import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateSnippetSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  language: z.string().min(1).max(30).optional(),
  code: z.string().min(1).optional(),
  description: z.string().max(300).optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user profile for role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Check ownership
    const { data: existing, error: findErr } = await supabase
      .from('code_snippets')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (findErr || !existing) {
      return NextResponse.json({ error: 'Snippet not found' }, { status: 404 });
    }

    const isOwner = existing.owner_id === user.id;
    const isAdmin = profile?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: only the owner or admin can edit this snippet' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = updateSnippetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (parsed.data.title !== undefined) updates.title = parsed.data.title;
    if (parsed.data.language !== undefined) updates.language = parsed.data.language;
    if (parsed.data.code !== undefined) updates.code = parsed.data.code;
    if (parsed.data.description !== undefined) updates.description = parsed.data.description;
    if (parsed.data.tags !== undefined) updates.tags = parsed.data.tags;

    const { data: updatedSnippet, error: updateErr } = await supabase
      .from('code_snippets')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        owner:profiles!code_snippets_owner_id_fkey(id, name, email, role, is_active)
      `)
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    const formatted = {
      ...updatedSnippet,
      owner: Array.isArray(updatedSnippet.owner) ? updatedSnippet.owner[0] : updatedSnippet.owner,
    };

    return NextResponse.json({ snippet: formatted });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user profile for role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Check ownership
    const { data: existing, error: findErr } = await supabase
      .from('code_snippets')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (findErr || !existing) {
      return NextResponse.json({ error: 'Snippet not found' }, { status: 404 });
    }

    const isOwner = existing.owner_id === user.id;
    const isAdmin = profile?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: only the owner or admin can delete this snippet' },
        { status: 403 }
      );
    }

    const { error } = await supabase.from('code_snippets').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
