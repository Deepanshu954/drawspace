'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import {
  Send,
  Paperclip,
  Code,
  X,
  FileIcon,
  Image as ImageIcon,
} from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (
    content: string,
    messageType?: 'text' | 'code' | 'object_ref',
    attachments?: any[]
  ) => Promise<void>;
  placeholder?: string;
}

export function MessageInput({
  onSendMessage,
  placeholder = 'Type a message or drag & drop files/images...',
}: MessageInputProps) {
  const { error } = useToast();
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<
    { name: string; url: string; type: string; size: number }[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() && attachments.length === 0) return;

    setIsSending(true);
    try {
      await onSendMessage(
        content.trim(),
        'text',
        attachments.length > 0 ? attachments : undefined
      );
      setContent('');
      setAttachments([]);
    } catch (err: any) {
      error(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      // Create local object URL for instant preview / upload
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            url: dataUrl,
            type: file.type,
            size: file.size,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      handleFiles(e.clipboardData.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`relative border-t border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 transition-colors ${
        isDragging
          ? 'bg-indigo-50/50 border-indigo-400 dark:bg-indigo-950/30 dark:border-indigo-600'
          : ''
      }`}
    >
      {/* Attachments preview row */}
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {att.type.startsWith('image/') ? (
                <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
              ) : (
                <FileIcon className="w-3.5 h-3.5 text-zinc-400" />
              )}
              <span className="truncate max-w-[150px]">{att.name}</span>
              <button
                type="button"
                onClick={() =>
                  setAttachments((prev) => prev.filter((_, i) => i !== idx))
                }
                className="rounded p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input container */}
      <div className="flex items-end gap-2 rounded-xl border border-zinc-200 bg-zinc-50/70 p-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800/60">
        <textarea
          rows={1}
          placeholder={isDragging ? 'Drop file to attach...' : placeholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className="flex-1 max-h-32 min-h-[36px] resize-none bg-transparent px-2 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100"
        />

        <div className="flex items-center gap-1 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFiles(e.target.files)}
            multiple
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200 transition-colors"
            title="Attach file or screenshot"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={() => handleSend()}
            isLoading={isSending}
            disabled={!content.trim() && attachments.length === 0}
            className="px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
