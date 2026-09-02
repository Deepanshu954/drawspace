import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Please provide a valid email / gmail address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { username, email, password } = parsed.data;
    const admin = createAdminClient();

    // Check if username already exists
    const { data: existingUser } = await admin
      .from('profiles')
      .select('id')
      .ilike('username', username.trim().toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username is already taken. Please pick another one.' },
        { status: 409 }
      );
    }

    // Check if email already exists
    const { data: existingEmail } = await admin
      .from('profiles')
      .select('id')
      .ilike('email', email.trim().toLowerCase())
      .single();

    if (existingEmail) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    // Create user in Supabase Auth as unconfirmed/pending
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true, // auto-confirm email so admin can approve directly
      user_metadata: {
        username: username.trim().toLowerCase(),
        name: username.trim(),
        role: 'user',
        is_self_signup: 'true',
      },
    });

    if (authErr) {
      return NextResponse.json({ error: authErr.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Explicitly update profile to status = 'pending' and is_active = false
    await admin
      .from('profiles')
      .update({
        username: username.trim().toLowerCase(),
        status: 'pending',
        is_active: false,
      })
      .eq('id', authData.user.id);

    return NextResponse.json({
      success: true,
      message:
        'Access request submitted successfully! An administrator will review and confirm your access before you can log in.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
