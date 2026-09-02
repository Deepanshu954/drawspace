import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const addMemberSchema = z.object({
  email: z.string().email(),
  permission: z.enum(['viewer', 'editor']),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: boardId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: members, error } = await supabase
      .from('board_members')
      .select(`
        board_id,
        user_id,
        permission,
        created_at,
        profile:profiles!board_members_user_id_fkey(id, name, email, role, is_active)
      `)
      .eq('board_id', boardId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = (members || []).map((m: any) => ({
      ...m,
      profile: Array.isArray(m.profile) ? m.profile[0] : m.profile,
    }));

    return NextResponse.json({ members: formatted });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: boardId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = addMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    // 1. Find profile by email
    const { data: targetProfile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, name, email, is_active')
      .eq('email', parsed.data.email.toLowerCase().trim())
      .single();

    if (profileErr || !targetProfile) {
      return NextResponse.json(
        { error: 'User with this email not found in DrawSpace.' },
        { status: 404 }
      );
    }

    if (!targetProfile.is_active) {
      return NextResponse.json(
        { error: 'Cannot add a deactivated user account.' },
        { status: 400 }
      );
    }

    // 2. Check if user is owner of this board
    const { data: board } = await supabase
      .from('boards')
      .select('owner_id')
      .eq('id', boardId)
      .single();

    if (board && board.owner_id === targetProfile.id) {
      return NextResponse.json(
        { error: 'User is already the owner of this board.' },
        { status: 400 }
      );
    }

    // 3. Insert or update member permission
    const { data: member, error: insertErr } = await supabase
      .from('board_members')
      .upsert(
        {
          board_id: boardId,
          user_id: targetProfile.id,
          permission: parsed.data.permission,
        },
        { onConflict: 'board_id,user_id' }
      )
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ member, profile: targetProfile }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
