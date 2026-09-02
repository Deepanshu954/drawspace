'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Channel, Message, Profile } from '@/types/database';
import { MessageItem } from '@/components/chat/MessageItem';
import { MessageInput } from '@/components/chat/MessageInput';
import { ThreadDrawer } from '@/components/chat/ThreadDrawer';
import { createClient } from '@/lib/supabase/client';
import { Hash, Lock, Users, Sparkles } from 'lucide-react';

interface ChatContainerProps {
  channel?: Channel | null;
  dmUser?: Profile | null;
  initialMessages: Message[];
  currentUserId: string;
}

export function ChatContainer({
  channel,
  dmUser,
  initialMessages,
  currentUserId,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [activeThreadMessage, setActiveThreadMessage] = useState<Message | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  // Realtime subscription for incoming messages
  useEffect(() => {
    const supabase = createClient();
    const channelId = channel?.id;
    const roomKey = channelId ? `chat:${channelId}` : dmUser ? `chat:dm:${currentUserId}:${dmUser.id}` : null;

    if (!roomKey) return;

    const rtChannel = supabase
      .channel(roomKey)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: channelId ? `channel_id=eq.${channelId}` : undefined,
        },
        async (payload) => {
          // Fetch sender info for newly inserted message
          const { data: newMsg } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey(id, name, email, role, is_active),
              attachments:message_attachments(*),
              reactions:message_reactions(*)
            `)
            .eq('id', payload.new.id)
            .single();

          if (newMsg) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg as Message];
            });
            scrollToBottom();
          }
        }
      )
      .subscribe();

    return () => {
      rtChannel.unsubscribe();
      supabase.removeChannel(rtChannel);
    };
  }, [channel?.id, dmUser?.id, currentUserId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (
    content: string,
    messageType: 'text' | 'code' | 'object_ref' = 'text',
    attachments?: any[]
  ) => {
    const res = await fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        channel_id: channel?.id,
        dm_id: dmUser ? dmUser.id : undefined,
        message_type: messageType,
        attachments,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to send message');
    }

    const data = await res.json();
    setMessages((prev) => {
      if (prev.some((m) => m.id === data.message.id)) return prev;
      return [...prev, data.message];
    });
    scrollToBottom();
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      await fetch(`/api/chat/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
      // Optimistic local update
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === messageId) {
            const existing = m.reactions || [];
            return {
              ...m,
              reactions: [...existing, { message_id: messageId, user_id: currentUserId, emoji, created_at: new Date().toISOString() }],
            };
          }
          return m;
        })
      );
    } catch (err) {
      console.error('Error adding reaction:', err);
    }
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-white dark:bg-zinc-900">
      {/* Messages Column */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Channel / DM Header */}
        <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-6 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {channel ? (
              <>
                {channel.is_private ? (
                  <Lock className="w-4 h-4 text-zinc-400 shrink-0" />
                ) : (
                  <Hash className="w-4 h-4 text-zinc-400 shrink-0" />
                )}
                <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                  {channel.name}
                </h2>
                {channel.description && (
                  <span className="hidden sm:inline text-xs text-zinc-400 truncate max-w-sm">
                    — {channel.description}
                  </span>
                )}
              </>
            ) : dmUser ? (
              <>
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                  {dmUser.name}
                </h2>
                <span className="text-xs text-zinc-400">({dmUser.email})</span>
              </>
            ) : (
              <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Workspace Discussions
              </h2>
            )}
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto py-4 space-y-1">
          {/* Welcome header in channel */}
          <div className="px-6 py-6 border-b border-zinc-100 dark:border-zinc-800/60 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mb-2">
              <Hash className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              Welcome to #{channel?.name || 'chat'}!
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              This is the start of the #{channel?.name || 'chat'} discussion. Drop thoughts, paste screenshots, or share whiteboard links.
            </p>
          </div>

          {messages
            .filter((m) => !m.parent_id)
            .map((msg) => (
              <MessageItem
                key={msg.id}
                message={msg}
                currentUserId={currentUserId}
                onOpenThread={(m) => setActiveThreadMessage(m)}
                onAddReaction={handleAddReaction}
              />
            ))}

          <div ref={scrollAnchorRef} />
        </div>

        {/* Input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          placeholder={`Message #${channel?.name || 'chat'} (drag files or paste images)...`}
        />
      </div>

      {/* Side Thread Drawer if active */}
      <ThreadDrawer
        parentMessage={activeThreadMessage}
        onClose={() => setActiveThreadMessage(null)}
        currentUserId={currentUserId}
      />
    </div>
  );
}
