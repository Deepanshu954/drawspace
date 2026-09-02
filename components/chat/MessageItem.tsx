'use client';

import React, { useState } from 'react';
import { Message, MessageAttachment } from '@/types/database';
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
  Copy,
  Check,
  Download,
  X,
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
  const [copiedCode, setCopiedCode] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const sender = message.sender;
  const isSelf = message.sender_id === currentUserId;

  const EMOJIS = ['👍', '❤️', '🔥', '🚀', '💡', '👀'];

  const handleCopyCode = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isImageAttachment = (att: MessageAttachment) => {
    return (
      att.file_type?.startsWith('image/') ||
      att.file_name.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i) ||
      att.file_url.startsWith('data:image/')
    );
  };

  return (
    <div className="group relative flex gap-3 px-4 py-2 hover:bg-zinc-800/40 transition-colors">
      {/* Avatar */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-950 font-bold text-xs text-indigo-300 border border-indigo-900/50">
        {getInitials(sender?.name || 'User')}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-xs text-zinc-100">
            {sender?.name || 'Unknown User'}
          </span>
          {sender?.username && (
            <span className="text-[10px] text-zinc-400 font-mono">
              @{sender.username}
            </span>
          )}
          <span className="text-[10px] text-zinc-400">
            {formatDate(message.created_at)}
          </span>
          {message.is_edited && (
            <span className="text-[9px] text-zinc-400">(edited)</span>
          )}
        </div>

        {/* Message body / Code Box */}
        {message.message_type === 'code' ? (
          <div className="mt-2 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden max-w-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800/80 px-3 py-1.5 bg-zinc-900/80 text-[11px] text-zinc-400">
              <span className="font-mono font-semibold uppercase text-indigo-400">
                {message.metadata?.language || 'Code Snippet'}
              </span>
              <button
                onClick={() => handleCopyCode(message.content)}
                className="flex items-center gap-1 rounded px-2 py-0.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 text-xs font-mono text-zinc-200 overflow-x-auto leading-relaxed">
              <code>{message.content}</code>
            </pre>
          </div>
        ) : (
          <div className="mt-1 text-sm text-zinc-200 leading-relaxed break-words whitespace-pre-wrap">
            {message.content}
          </div>
        )}

        {/* Object reference badge if linked */}
        {message.metadata?.boardId && (
          <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-indigo-900/60 bg-indigo-950/40 px-3 py-2 text-xs font-medium text-indigo-200">
            <Layout className="w-4 h-4 text-indigo-400" />
            <span>Referenced Whiteboard:</span>
            <Link
              href={`/board/${message.metadata.boardId}`}
              className="font-bold underline hover:opacity-80 flex items-center gap-1"
            >
              {message.metadata.boardName || 'Open Board'}
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Rich Attachments Preview */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-3">
            {message.attachments.map((att) => {
              const isImg = isImageAttachment(att);

              if (isImg) {
                return (
                  <div
                    key={att.id}
                    className="group/img relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 max-w-sm cursor-pointer shadow-xs"
                    onClick={() => setLightboxImage(att.file_url)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={att.file_url}
                      alt={att.file_name}
                      className="max-h-56 w-auto object-cover rounded-xl transition-transform group-hover/img:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-medium">
                      <span>Click to expand</span>
                    </div>
                  </div>
                );
              }

              return (
                <a
                  key={att.id}
                  href={att.file_url}
                  download={att.file_name}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700 transition-colors shadow-2xs"
                >
                  <FileIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div className="truncate max-w-xs">
                    <p className="font-semibold truncate">{att.file_name}</p>
                    <p className="text-[10px] text-zinc-400">
                      {(att.file_size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Download className="w-3.5 h-3.5 text-zinc-400 ml-1 shrink-0" />
                </a>
              );
            })}
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
                  className="flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
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
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Action Menu on hover */}
      <div className="absolute right-4 top-2 hidden group-hover:flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 p-1 shadow-sm z-10">
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
            title="React"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>

          {showEmojiPicker && (
            <div className="absolute right-0 top-full mt-1 flex gap-1 rounded-xl border border-zinc-700 bg-zinc-800 p-1.5 shadow-lg z-20">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    if (onAddReaction) onAddReaction(message.id, e);
                    setShowEmojiPicker(false);
                  }}
                  className="rounded p-1 hover:bg-zinc-700 text-sm"
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
            className="rounded p-1 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
            title="Reply in thread"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Lightbox Image Preview Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-6 h-6" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage}
              alt="Preview"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
