import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const updateUserSchema = z.object({
  is_active: z.boolean().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  role: z.enum(['admin', 'user']).optional(),
  password: z.string().min(6).optional(),
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

    // Check admin
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Password reset if provided
    if (parsed.data.password) {
      const { error: pwdErr } = await admin.auth.admin.updateUserById(id, {
        password: parsed.data.password,
      });
      if (pwdErr) {
        return NextResponse.json({ error: pwdErr.message }, { status: 400 });
      }
    }

    // 2. Profile updates
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (parsed.data.is_active !== undefined) updates.is_active = parsed.data.is_active;
    if (parsed.data.status !== undefined) {
      updates.status = parsed.data.status;
      if (parsed.data.status === 'approved') {
        updates.is_active = true;
      } else if (parsed.data.status === 'rejected') {
        updates.is_active = false;
      }
    }
    if (parsed.data.role !== undefined) updates.role = parsed.data.role;

    const { data: updatedProfile, error: profErr } = await admin
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (profErr) {
      return NextResponse.json({ error: profErr.message }, { status: 500 });
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
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (id === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own admin account' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(id);

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
