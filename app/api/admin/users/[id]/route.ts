import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['admin', 'user']).optional(),
  is_active: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role server-side
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (!callerProfile || callerProfile.role !== 'admin' || !callerProfile.is_active) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Prevent self-deactivation or self-demotion to avoid lockout
    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    if (user.id === targetUserId) {
      if (parsed.data.is_active === false) {
        return NextResponse.json(
          { error: 'Admins cannot deactivate their own account.' },
          { status: 400 }
        );
      }
      if (parsed.data.role === 'user') {
        return NextResponse.json(
          { error: 'Admins cannot demote their own admin role.' },
          { status: 400 }
        );
      }
    }

    const adminClient = createAdminClient();

    // 1. If password reset requested
    if (parsed.data.password) {
      const { error: passErr } = await adminClient.auth.admin.updateUserById(
        targetUserId,
        { password: parsed.data.password }
      );
      if (passErr) {
        return NextResponse.json({ error: passErr.message }, { status: 400 });
      }
    }

    // 2. Update profile table
    const profileUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (parsed.data.name !== undefined) profileUpdates.name = parsed.data.name;
    if (parsed.data.role !== undefined) profileUpdates.role = parsed.data.role;
    if (parsed.data.is_active !== undefined) profileUpdates.is_active = parsed.data.is_active;

    const { data: updatedProfile, error: profileErr } = await adminClient
      .from('profiles')
      .update(profileUpdates)
      .eq('id', targetUserId)
      .select()
      .single();

    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    // 3. Update auth user metadata if name/role changed
    if (parsed.data.name || parsed.data.role) {
      await adminClient.auth.admin.updateUserById(targetUserId, {
        user_metadata: {
          name: updatedProfile.name,
          role: updatedProfile.role,
        },
      });
    }

    return NextResponse.json({ user: updatedProfile });
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
    const { id: targetUserId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (!callerProfile || callerProfile.role !== 'admin' || !callerProfile.is_active) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    if (user.id === targetUserId) {
      return NextResponse.json(
        { error: 'Admins cannot delete their own account.' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Delete user from auth.users (cascades to profiles, board_members, etc.)
    const { error: delError } = await adminClient.auth.admin.deleteUser(targetUserId);

    if (delError) {
      return NextResponse.json({ error: delError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
