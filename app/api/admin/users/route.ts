import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'user']).default('user'),
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

    // Verify admin role server-side
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin' || !profile.is_active) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users });
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

    // Verify admin role server-side
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (!callerProfile || callerProfile.role !== 'admin' || !callerProfile.is_active) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // 1. Create auth user with temporary password and email_confirm true
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: parsed.data.email.toLowerCase().trim(),
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        name: parsed.data.name.trim(),
        role: parsed.data.role,
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Failed to create user account' },
        { status: 400 }
      );
    }

    // 2. Ensure profile is saved/updated with role
    const { data: newProfile, error: profileErr } = await adminClient
      .from('profiles')
      .upsert({
        id: authData.user.id,
        name: parsed.data.name.trim(),
        email: parsed.data.email.toLowerCase().trim(),
        role: parsed.data.role,
        is_active: true,
      })
      .select()
      .single();

    if (profileErr) {
      console.error('Profile upsert warning:', profileErr);
    }

    return NextResponse.json(
      {
        user: newProfile || {
          id: authData.user.id,
          name: parsed.data.name,
          email: parsed.data.email,
          role: parsed.data.role,
        },
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
