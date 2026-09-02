'use client';

import React, { useState, useRef } from 'react';
import { toPng, toSvg } from 'html-to-image';
import { CodeSnippet } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import {
  Download,
  Copy,
  Check,
  Send,
  Sparkles,
  Terminal,
  FileCode,
  Image as ImageIcon,
  Layers,
} from 'lucide-react';

interface RaysoCardProps {
  snippet: CodeSnippet;
  currentUserId: string;
  onShareToChat?: (snippet: CodeSnippet, imageDataUrl: string) => void;
  onDelete?: (snippetId: string) => void;
  canDelete?: boolean;
}

const THEMES = [
  { name: 'Breeze', bg: 'bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600' },
  { name: 'Sunset', bg: 'bg-gradient-to-tr from-amber-500 via-orange-600 to-rose-600' },
  { name: 'Midnight', bg: 'bg-gradient-to-tr from-slate-900 via-purple-950 to-zinc-950' },
  { name: 'Candy', bg: 'bg-gradient-to-tr from-fuchsia-600 via-pink-600 to-rose-500' },
  { name: 'Emerald', bg: 'bg-gradient-to-tr from-emerald-500 via-teal-600 to-cyan-700' },
  { name: 'Noir', bg: 'bg-gradient-to-tr from-zinc-900 via-zinc-950 to-black' },
];

export function RaysoCard({
  snippet,
  currentUserId,
  onShareToChat,
  onDelete,
  canDelete,
}: RaysoCardProps) {
  const { error, success } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);

  const [themeIdx, setThemeIdx] = useState(0);
  const [padding, setPadding] = useState<'sm' | 'md' | 'lg'>('md');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const paddingClass = {
    sm: 'p-4 sm:p-6',
    md: 'p-6 sm:p-10',
    lg: 'p-8 sm:p-14',
  }[padding];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(snippet.code);
    setCopiedCode(true);
    success('Code copied to clipboard!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleExportPNG = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, quality: 0.95 });
      const link = document.createElement('a');
      link.download = `${snippet.title.toLowerCase().replace(/\s+/g, '-')}-rayso.png`;
      link.href = dataUrl;
      link.click();
      success('Exported crisp Ray.so PNG!');
    } catch (err: any) {
      error('Failed to export PNG: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSVG = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toSvg(cardRef.current);
      const link = document.createElement('a');
      link.download = `${snippet.title.toLowerCase().replace(/\s+/g, '-')}-rayso.svg`;
      link.href = dataUrl;
      link.click();
      success('Exported scalable Ray.so SVG!');
    } catch (err: any) {
      error('Failed to export SVG: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareToChat = async () => {
    if (!cardRef.current) return;
    setIsSharing(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 1.5 });
      
      // Share to #code-snippets or #general
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `⚡ Shared Code Snippet: **${snippet.title}** (${snippet.language})\n\n\`\`\`${snippet.language}\n${snippet.code}\n\`\`\``,
          message_type: 'code',
          metadata: {
            snippetId: snippet.id,
            snippetTitle: snippet.title,
            language: snippet.language,
          },
          attachments: [
            {
              name: `${snippet.title.toLowerCase().replace(/\s+/g, '-')}-snippet.png`,
              url: dataUrl,
              type: 'image/png',
              size: Math.round((dataUrl.length * 3) / 4),
            },
          ],
        }),
      });

      if (!res.ok) throw new Error('Failed to share to chat');
      success(`Snippet & Ray.so image shared to Team Chat!`);
    } catch (err: any) {
      error(err.message || 'Error sharing snippet to chat');
    } finally {
      setIsSharing(false);
    }
  };

  const codeLines = snippet.code.split('\n');

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-md">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 bg-zinc-950/60 px-4 py-2.5 gap-2 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-zinc-400">Theme:</span>
            <div className="flex items-center gap-1">
              {THEMES.map((th, idx) => (
                <button
                  key={th.name}
                  onClick={() => setThemeIdx(idx)}
                  className={`h-4 w-4 rounded-full ${th.bg} transition-transform ${
                    themeIdx === idx ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={th.name}
                />
              ))}
            </div>
          </div>

          <div className="h-3.5 w-px bg-zinc-800" />

          <div className="flex items-center gap-1">
            <span className="text-[11px] font-medium text-zinc-400">Padding:</span>
            {(['sm', 'md', 'lg'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPadding(p)}
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase transition-colors ${
                  padding === p
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCopyCode}
            className="h-7 text-xs gap-1 border-zinc-700 bg-zinc-800/80"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedCode ? 'Copied' : 'Copy Code'}
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleExportPNG}
            isLoading={isExporting}
            className="h-7 text-xs gap-1 border-zinc-700 bg-zinc-800/80"
          >
            <Download className="w-3.5 h-3.5" />
            PNG
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleExportSVG}
            disabled={isExporting}
            className="h-7 text-xs gap-1 border-zinc-700 bg-zinc-800/80"
          >
            <FileCode className="w-3.5 h-3.5" />
            SVG
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={handleShareToChat}
            isLoading={isSharing}
            className="h-7 text-xs gap-1 bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            <Send className="w-3.5 h-3.5" />
            Share to Chat
          </Button>
        </div>
      </div>

      {/* Ray.so Canvas Frame for Export */}
      <div
        ref={cardRef}
        className={`flex items-center justify-center transition-all ${THEMES[themeIdx].bg} ${paddingClass}`}
      >
        <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-zinc-950/90 shadow-2xl backdrop-blur-md overflow-hidden">
          {/* macOS Traffic Lights Header */}
          <div className="flex h-9 items-center justify-between border-b border-white/10 px-3.5 bg-zinc-900/50">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#FF5F56] inline-block shadow-xs" />
              <span className="h-3 w-3 rounded-full bg-[#FFBD2E] inline-block shadow-xs" />
              <span className="h-3 w-3 rounded-full bg-[#27C93F] inline-block shadow-xs" />
            </div>

            <span className="font-mono text-xs font-semibold text-zinc-300 truncate max-w-[200px]">
              {snippet.title}
            </span>

            <span className="font-mono text-[10px] font-bold text-zinc-500 uppercase">
              {snippet.language}
            </span>
          </div>

          {/* Code Content */}
          <div className="p-4 sm:p-5 font-mono text-xs leading-relaxed text-zinc-100 overflow-x-auto select-all">
            <pre className="flex">
              {showLineNumbers && (
                <div className="select-none pr-4 text-right text-zinc-600 font-mono">
                  {codeLines.map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
              )}
              <code className="flex-1">{snippet.code}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2.5 text-xs text-zinc-500 bg-zinc-950/40">
        <span>By {snippet.owner?.name || 'Teammate'} • {formatDate(snippet.created_at)}</span>
        {canDelete && onDelete && (
          <button
            onClick={() => onDelete(snippet.id)}
            className="text-zinc-500 hover:text-red-400 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
