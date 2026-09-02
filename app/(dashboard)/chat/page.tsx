import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { Channel, Message } from '@/types/database';
import { redirect } from 'next/navigation';

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch general channel
  let { data: channel } = await supabase
    .from('channels')
    .select('*')
    .eq('name', 'general')
    .single();

  if (!channel) {
    const { data: firstChannel } = await supabase
      .from('channels')
      .select('*')
      .limit(1)
      .single();
    channel = firstChannel;
  }

  let initialMessages: Message[] = [];
  if (channel) {
    const { data: msgs } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, name, email, role, is_active),
        attachments:message_attachments(*),
        reactions:message_reactions(*)
      `)
      .eq('channel_id', channel.id)
      .is('parent_id', null)
      .order('created_at', { ascending: true })
      .limit(100);

    initialMessages = (msgs as Message[]) || [];
  }

  return (
    <ChatContainer
      channel={channel as Channel}
      initialMessages={initialMessages}
      currentUserId={user.id}
    />
  );
}
