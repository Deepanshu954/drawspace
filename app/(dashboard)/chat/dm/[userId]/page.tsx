import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { Message, Profile } from '@/types/database';
import { redirect } from 'next/navigation';

interface DmPageProps {
  params: Promise<{ userId: string }>;
}

export default async function DmPage({ params }: DmPageProps) {
  const { userId: targetUserId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch target user profile
  const { data: targetProfile, error: profErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', targetUserId)
    .single();

  if (profErr || !targetProfile) {
    redirect('/chat');
  }

  // Find or create direct message conversation
  const [user1, user2] = [user.id, targetUserId].sort();

  let { data: dmConv } = await supabase
    .from('direct_message_conversations')
    .select('*')
    .eq('user1_id', user1)
    .eq('user2_id', user2)
    .single();

  if (!dmConv) {
    const { data: newDm } = await supabase
      .from('direct_message_conversations')
      .insert({ user1_id: user1, user2_id: user2 })
      .select()
      .single();
    dmConv = newDm;
  }

  // Fetch messages in this DM
  let initialMessages: Message[] = [];
  if (dmConv) {
    const { data: msgs } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, name, email, role, is_active),
        attachments:message_attachments(*),
        reactions:message_reactions(*)
      `)
      .eq('dm_id', dmConv.id)
      .order('created_at', { ascending: true })
      .limit(100);

    initialMessages = (msgs as Message[]) || [];
  }

  return (
    <ChatContainer
      dmUser={targetProfile as Profile}
      initialMessages={initialMessages}
      currentUserId={user.id}
    />
  );
}
