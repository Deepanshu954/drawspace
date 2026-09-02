import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateBoardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  scene_data: z.any().optional(),
});

export async function GET(
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

    // Fetch board with owner
    const { data: board, error } = await supabase
      .from('boards')
      .select(`
        id,
        name,
        owner_id,
        scene_data,
        created_at,
        updated_at,
        owner:profiles!boards_owner_id_fkey(id, name, email, role, is_active)
      `)
      .eq('id', id)
      .single();

    if (error || !board) {
      return NextResponse.json({ error: 'Board not found or access denied' }, { status: 404 });
    }

    // Resolve permission
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    let permission: 'owner' | 'editor' | 'viewer' = 'viewer';
    if (board.owner_id === user.id || profile?.role === 'admin') {
      permission = 'owner';
    } else {
      const { data: member } = await supabase
        .from('board_members')
        .select('permission')
        .eq('board_id', id)
        .eq('user_id', user.id)
        .single();

      if (member) {
        permission = member.permission as 'editor' | 'viewer';
      }
    }

    return NextResponse.json({
      board: {
        ...board,
        owner: Array.isArray(board.owner) ? board.owner[0] : board.owner,
        userPermission: permission,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const body = await req.json();
    const parsed = updateBoardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (parsed.data.name !== undefined) {
      updatePayload.name = parsed.data.name;
    }
    if (parsed.data.scene_data !== undefined) {
      updatePayload.scene_data = parsed.data.scene_data;
    }

    const { data: board, error } = await supabase
      .from('boards')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ board });
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

    const { error } = await supabase.from('boards').delete().eq('id', id);

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
