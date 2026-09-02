import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createDocSchema = z.object({
  title: z.string().min(1).max(150),
  content: z.string().default(''),
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

    const { data: docs, error } = await supabase
      .from('documents')
      .select(`
        *,
        owner:profiles!documents_owner_id_fkey(id, name, email, role, is_active)
      `)
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = (docs || []).map((d: any) => ({
      ...d,
      owner: Array.isArray(d.owner) ? d.owner[0] : d.owner,
    }));

    return NextResponse.json({ documents: formatted });
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
    const parsed = createDocSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { data: doc, error } = await supabase
      .from('documents')
      .insert({
        title: parsed.data.title,
        content: parsed.data.content,
        owner_id: user.id,
      })
      .select(`
        *,
        owner:profiles!documents_owner_id_fkey(id, name, email, role, is_active)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = {
      ...doc,
      owner: Array.isArray(doc.owner) ? doc.owner[0] : doc.owner,
    };

    return NextResponse.json({ document: formatted }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
