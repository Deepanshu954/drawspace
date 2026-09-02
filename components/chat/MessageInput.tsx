'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { CodeSnippet, Board } from '@/types/database';
import {
  Send,
  Paperclip,
  Code,
  X,
  FileIcon,
  Image as ImageIcon,
  Layout,
  Hash,
  AtSign,
  Sparkles,
} from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (
    content: string,
    messageType?: 'text' | 'code' | 'object_ref',
    attachments?: any[]
  ) => Promise<void>;
  placeholder?: string;
}

interface SuggestionItem {
  id: string;
  type: 'snippet' | 'board' | 'user';
  title: string;
  subtitle?: string;
  snippetData?: CodeSnippet;
}

export function MessageInput({
  onSendMessage,
  placeholder = 'Type a message, tag with / or @ (e.g. /snippet), paste screenshots...',
}: MessageInputProps) {
  const { error } = useToast();
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<
    { name: string; url: string; type: string; size: number }[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(0);
  const [triggerChar, setTriggerChar] = useState<string | null>(null);

  // Load available snippets and boards on mount for instant zero-latency autocomplete
  useEffect(() => {
    const loadReferences = async () => {
      try {
        const [snippetsRes, boardsRes] = await Promise.all([
          fetch('/api/snippets'),
          fetch('/api/boards'),
        ]);

        const items: SuggestionItem[] = [];

        if (snippetsRes.ok) {
          const sData = await snippetsRes.json();
          (sData.snippets || []).forEach((s: CodeSnippet) => {
            items.push({
              id: s.id,
              type: 'snippet',
              title: s.title,
              subtitle: `${s.language} snippet`,
              snippetData: s,
            });
          });
        }

        if (boardsRes.ok) {
          const bData = await boardsRes.json();
          (bData.boards || []).forEach((b: Board) => {
            items.push({
              id: b.id,
              type: 'board',
              title: b.name,
              subtitle: 'Whiteboard canvas',
            });
          });
        }

        setSuggestions(items);
      } catch (err) {
        console.error('Error preloading suggestions:', err);
      }
    };

    loadReferences();
  }, []);

  // Detect triggers (/ or @ or #) in input
  const handleContentChange = (newText: string) => {
    setContent(newText);

    // Check last word
    const match = newText.match(/(?:^|\s)([/@#])([a-zA-Z0-9_-]*)$/);
    if (match) {
      const char = match[1];
      const query = match[2].toLowerCase();
      setTriggerChar(char);

      const matches = suggestions.filter((item) => {
        if (char === '/' && item.type !== 'snippet') return false;
        if (char === '#' && item.type !== 'board') return false;
        return item.title.toLowerCase().includes(query);
      });

      setFilteredSuggestions(matches.slice(0, 6));
      setShowSuggestions(matches.length > 0);
      setSelectedSuggestionIdx(0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (item: SuggestionItem) => {
    if (item.type === 'snippet' && item.snippetData) {
      const s = item.snippetData;
      // Append formatted snippet content
      const replaced = content.replace(/(?:^|\s)([/@#])[a-zA-Z0-9_-]*$/, '');
      const formattedSnippet = `${replaced.trim() ? replaced.trim() + '\n\n' : ''}⚡ **${s.title}** (${s.language}):\n\`\`\`${s.language}\n${s.code}\n\`\`\``;
      setContent(formattedSnippet);
    } else if (item.type === 'board') {
      const replaced = content.replace(/(?:^|\s)([/@#])[a-zA-Z0-9_-]*$/, '');
      const formattedBoard = `${replaced.trim() ? replaced.trim() + ' ' : ''}🎨 [Whiteboard: ${item.title}](/board/${item.id})`;
      setContent(formattedBoard);
    } else {
      const replaced = content.replace(/(?:^|\s)([/@#])[a-zA-Z0-9_-]*$/, '');
      setContent(`${replaced.trim()} @${item.title} `);
    }

    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() && attachments.length === 0) return;

    setIsSending(true);
    try {
      const messageType = content.includes('```') ? 'code' : 'text';
      await onSendMessage(
        content.trim(),
        messageType,
        attachments.length > 0 ? attachments : undefined
      );
      setContent('');
      setAttachments([]);
      setShowSuggestions(false);
    } catch (err: any) {
      error(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && filteredSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIdx((prev) => (prev + 1) % filteredSuggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIdx((prev) =>
          prev === 0 ? filteredSuggestions.length - 1 : prev - 1
        );
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleSelectSuggestion(filteredSuggestions[selectedSuggestionIdx]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
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
      className={`relative border-t border-zinc-800 bg-zinc-900 p-3 select-none transition-colors ${
        isDragging ? 'bg-indigo-950/40 border-indigo-500' : ''
      }`}
    >
      {/* Autocomplete Suggestions Popup */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute bottom-full left-4 mb-2 w-80 rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden z-30 animate-in fade-in slide-in-from-bottom-2">
          <div className="px-3 py-2 border-b border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase flex items-center justify-between">
            <span>Tag & Share Reference</span>
            <span className="text-[10px] text-zinc-500">↑↓ to navigate, Enter to pick</span>
          </div>
          <div className="py-1">
            {filteredSuggestions.map((item, idx) => {
              const isSelected = idx === selectedSuggestionIdx;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectSuggestion(item)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                    isSelected ? 'bg-indigo-950 text-indigo-200' : 'hover:bg-zinc-800/60 text-zinc-300'
                  }`}
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-indigo-400">
                    {item.type === 'snippet' ? (
                      <Code className="w-3.5 h-3.5" />
                    ) : (
                      <Layout className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs truncate text-zinc-100">{item.title}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{item.subtitle}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Attachments preview row */}
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-200"
            >
              {att.type.startsWith('image/') ? (
                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <FileIcon className="w-3.5 h-3.5 text-zinc-400" />
              )}
              <span className="truncate max-w-[150px]">{att.name}</span>
              <button
                type="button"
                onClick={() =>
                  setAttachments((prev) => prev.filter((_, i) => i !== idx))
                }
                className="rounded p-0.5 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input container */}
      <div className="flex items-end gap-2 rounded-xl border border-zinc-700 bg-zinc-950 p-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder={isDragging ? 'Drop file to attach...' : placeholder}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className="flex-1 max-h-32 min-h-[36px] resize-none bg-transparent px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
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
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors cursor-pointer"
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
            className="px-3 bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
