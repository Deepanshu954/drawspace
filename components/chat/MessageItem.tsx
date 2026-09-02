'use client';

import React, { useState } from 'react';
import { Message, Profile } from '@/types/database';
import { getInitials, formatDate } from '@/lib/utils';
import {
  MessageSquare,
  Smile,
  FileIcon,
  Paperclip,
  ExternalLink,
  Code,
  Layout,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

interface MessageItemProps {
  message: Message;
  currentUserId: string;
  onOpenThread?: (message: Message) => void;
  onAddReaction?: (messageId: string, emoji: string) => void;
}

export function MessageItem({
  message,
  currentUserId,
  onOpenThread,
  onAddReaction,
}: MessageItemProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const sender = message.sender;
  const isSelf = message.sender_id === currentUserId;

  const EMOJIS = ['👍', '❤️', '🔥', '🚀', '💡', '👀'];

  return (
    <div className="group relative flex gap-3 px-4 py-2 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-colors">
      {/* Avatar */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 font-bold text-xs text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
        {getInitials(sender?.name || 'User')}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
            {sender?.name || 'Unknown User'}
          </span>
          <span className="text-[10px] text-zinc-400">
            {formatDate(message.created_at)}
          </span>
          {message.is_edited && (
            <span className="text-[9px] text-zinc-400">(edited)</span>
          )}
        </div>

        {/* Message body */}
        <div className="mt-1 text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed break-words whitespace-pre-wrap">
          {message.content}
        </div>

        {/* Object reference badge if linked */}
        {message.metadata?.boardId && (
          <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/60 px-3 py-2 text-xs font-medium text-indigo-900 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200">
            <Layout className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Referenced Whiteboard:</span>
            <Link
              href={`/board/${message.metadata.boardId}`}
              className="font-bold underline hover:opacity-80 flex items-center gap-1"
            >
              {message.metadata.boardName || 'View Board'}
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.attachments.map((att) => (
              <a
                key={att.id}
                href={att.file_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 shadow-2xs"
              >
                <Paperclip className="w-3.5 h-3.5 text-zinc-400" />
                <span className="truncate max-w-xs">{att.file_name}</span>
              </a>
            ))}
          </div>
        )}

        {/* Reactions */}
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex items-center gap-1">
              {Object.entries(
                message.reactions.reduce((acc: Record<string, number>, r) => {
                  acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                  return acc;
                }, {})
              ).map(([emoji, count]) => (
                <button
                  key={emoji}
                  onClick={() => onAddReaction && onAddReaction(message.id, emoji)}
                  className="flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  <span>{emoji}</span>
                  <span className="text-[10px] font-semibold">{count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Thread reply count button */}
          {(message.replyCount || 0) > 0 && onOpenThread && (
            <button
              onClick={() => onOpenThread(message)}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Action Menu on hover */}
      <div className="absolute right-4 top-2 hidden group-hover:flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 z-10">
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200 transition-colors"
            title="React"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>

          {showEmojiPicker && (
            <div className="absolute right-0 top-full mt-1 flex gap-1 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-700 dark:bg-zinc-800 z-20">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    if (onAddReaction) onAddReaction(message.id, e);
                    setShowEmojiPicker(false);
                  }}
                  className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-sm"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        {onOpenThread && !message.parent_id && (
          <button
            onClick={() => onOpenThread(message)}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200 transition-colors"
            title="Reply in thread"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
