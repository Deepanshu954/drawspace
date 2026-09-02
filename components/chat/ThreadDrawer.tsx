'use client';

import React, { useState, useEffect } from 'react';
import { Message } from '@/types/database';
import { MessageItem } from '@/components/chat/MessageItem';
import { MessageInput } from '@/components/chat/MessageInput';
import { X, MessageSquare } from 'lucide-react';

interface ThreadDrawerProps {
  parentMessage: Message | null;
  onClose: () => void;
  currentUserId: string;
}

export function ThreadDrawer({
  parentMessage,
  onClose,
  currentUserId,
}: ThreadDrawerProps) {
  const [replies, setReplies] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (parentMessage) {
      loadReplies();
    }
  }, [parentMessage]);

  const loadReplies = async () => {
    if (!parentMessage) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/chat/messages?parentId=${parentMessage.id}`);
      const data = await res.json();
      if (res.ok) {
        setReplies(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to load thread replies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReply = async (content: string, type?: any, attachments?: any[]) => {
    if (!parentMessage) return;

    const res = await fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        channel_id: parentMessage.channel_id,
        dm_id: parentMessage.dm_id,
        parent_id: parentMessage.id,
        attachments,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to reply in thread');
    }

    const data = await res.json();
    setReplies((prev) => [...prev, data.message]);
  };

  if (!parentMessage) return null;

  return (
    <div className="w-80 sm:w-96 border-l border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 flex flex-col h-full shrink-0 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
            Thread Replies
          </h3>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Parent Message Preview */}
      <div className="border-b border-zinc-100 bg-zinc-50/50 p-2 dark:border-zinc-800/60 dark:bg-zinc-900/30">
        <MessageItem
          message={parentMessage}
          currentUserId={currentUserId}
        />
      </div>

      {/* Replies list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {replies.map((reply) => (
          <MessageItem
            key={reply.id}
            message={reply}
            currentUserId={currentUserId}
          />
        ))}

        {replies.length === 0 && !isLoading && (
          <p className="p-4 text-center text-xs text-zinc-400">
            No replies in this thread yet. Start the conversation below.
          </p>
        )}
      </div>

      {/* Reply input */}
      <MessageInput
        onSendMessage={handleSendReply}
        placeholder="Reply in thread..."
      />
    </div>
  );
}
