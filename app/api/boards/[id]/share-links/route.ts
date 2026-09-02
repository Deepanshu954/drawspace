import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateSecureToken, hashToken } from '@/lib/crypto';
import { z } from 'zod';

const createLinkSchema = z.object({
  permission: z.enum(['viewer', 'editor']),
  expires_at: z.string().datetime().optional().nullable(),
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

    const { data: shareLinks, error } = await supabase
      .from('share_links')
      .select('*')
      .eq('board_id', boardId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ shareLinks: shareLinks || [] });
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
    const parsed = createLinkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    // Deactivate previous active links for this board if generating a new one
    await supabase
      .from('share_links')
      .update({ is_active: false })
      .eq('board_id', boardId);

    // Generate secure random token and compute its SHA-256 hash
    const rawToken = generateSecureToken(32);
    const tokenHash = await hashToken(rawToken);

    const { data: shareLink, error } = await supabase
      .from('share_links')
      .insert({
        board_id: boardId,
        token_hash: tokenHash,
        permission: parsed.data.permission,
        is_active: true,
        expires_at: parsed.data.expires_at || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return the raw token only once on creation so client can copy the share URL
    return NextResponse.json(
      {
        shareLink,
        token: rawToken,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
