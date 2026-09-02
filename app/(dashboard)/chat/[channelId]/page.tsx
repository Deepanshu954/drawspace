import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { Channel, Message } from '@/types/database';
import { redirect } from 'next/navigation';

interface ChannelPageProps {
  params: Promise<{ channelId: string }>;
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { channelId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch channel
  const { data: channel, error: chErr } = await supabase
    .from('channels')
    .select('*')
    .eq('id', channelId)
    .single();

  if (chErr || !channel) {
    redirect('/chat');
  }

  // Fetch messages
  const { data: msgs } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, name, email, role, is_active),
      attachments:message_attachments(*),
      reactions:message_reactions(*)
    `)
    .eq('channel_id', channelId)
    .is('parent_id', null)
    .order('created_at', { ascending: true })
    .limit(100);

  return (
    <ChatContainer
      channel={channel as Channel}
      initialMessages={(msgs as Message[]) || []}
      currentUserId={user.id}
    />
  );
}
