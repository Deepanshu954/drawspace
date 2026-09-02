import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createMessageSchema = z.object({
  content: z.string().min(1),
  channel_id: z.string().optional().nullable(),
  dm_id: z.string().optional().nullable(),
  parent_id: z.string().optional().nullable(),
  message_type: z.enum(['text', 'code', 'object_ref', 'system']).default('text'),
  metadata: z.record(z.string(), z.any()).optional(),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        url: z.string(),
        type: z.string(),
        size: z.number(),
      })
    )
    .optional(),
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

    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get('channelId');
    const dmId = searchParams.get('dmId');
    const parentId = searchParams.get('parentId');

    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, name, email, role, is_active),
        attachments:message_attachments(*),
        reactions:message_reactions(*)
      `)
      .order('created_at', { ascending: true })
      .limit(100);

    if (parentId) {
      query = query.eq('parent_id', parentId);
    } else if (channelId) {
      query = query.eq('channel_id', channelId).is('parent_id', null);
    } else if (dmId) {
      query = query.eq('dm_id', dmId).is('parent_id', null);
    }

    const { data: messages, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages: messages || [] });
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
    const parsed = createMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    // 1. Insert message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        content: parsed.data.content,
        channel_id: parsed.data.channel_id || null,
        dm_id: parsed.data.dm_id || null,
        parent_id: parsed.data.parent_id || null,
        sender_id: user.id,
        message_type: parsed.data.message_type,
        metadata: parsed.data.metadata || {},
      })
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, name, email, role, is_active)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 2. Insert attachments if provided
    let savedAttachments: any[] = [];
    if (parsed.data.attachments && parsed.data.attachments.length > 0) {
      const attachmentsPayload = parsed.data.attachments.map((att) => ({
        message_id: message.id,
        file_name: att.name,
        file_url: att.url,
        file_type: att.type,
        file_size: att.size,
      }));

      const { data: attData } = await supabase
        .from('message_attachments')
        .insert(attachmentsPayload)
        .select();

      savedAttachments = attData || [];
    }

    return NextResponse.json(
      {
        message: {
          ...message,
          attachments: savedAttachments,
          reactions: [],
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
