import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const schema = z.object({
  identifier: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const identifier = parsed.data.identifier.trim().toLowerCase();

    // If it's already an email, return it directly
    if (identifier.includes('@')) {
      return NextResponse.json({ email: identifier });
    }

    // Resolve username to email using admin client
    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from('profiles')
      .select('email, status, is_active')
      .ilike('username', identifier)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: 'No account found with this username' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      email: profile.email,
      status: profile.status,
      is_active: profile.is_active,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
