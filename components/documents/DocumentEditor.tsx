'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Document, SaveStatus } from '@/types/database';
import { SaveStatusBadge } from '@/components/canvas/SaveStatusBadge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import {
  ArrowLeft,
  FileText,
  Eye,
  Edit3,
  Columns,
} from 'lucide-react';

interface DocumentEditorProps {
  document: Document;
  currentUserId: string;
}

export function DocumentEditor({
  document: initialDoc,
  currentUserId,
}: DocumentEditorProps) {
  const { error, success } = useToast();
  const [title, setTitle] = useState(initialDoc.title);
  const [content, setContent] = useState(initialDoc.content);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const saveDocument = async (newTitle: string, newContent: string) => {
    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/documents/${initialDoc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, content: newContent }),
      });

      if (!res.ok) throw new Error('Failed to save document');
      setSaveStatus('saved');
    } catch (err: any) {
      setSaveStatus('error');
      error(err.message || 'Error saving document');
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    triggerAutoSave(newTitle, content);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    triggerAutoSave(title, newContent);
  };

  const triggerAutoSave = (t: string, c: string) => {
    setSaveStatus('saving');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveDocument(t, c);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
      {/* Editor Header */}
      <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-4 sm:px-6 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Link
            href="/documents"
            className="flex items-center gap-1.5 rounded-lg p-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Docs</span>
          </Link>

          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 shrink-0" />

          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled Document"
            className="font-bold text-base bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none w-full max-w-md truncate"
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <SaveStatusBadge status={saveStatus} />

          {/* View mode toggle */}
          <div className="hidden sm:flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
            <button
              onClick={() => setViewMode('edit')}
              className={`rounded p-1 text-xs transition-colors ${
                viewMode === 'edit'
                  ? 'bg-white shadow-xs text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
              }`}
              title="Edit mode"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`rounded p-1 text-xs transition-colors ${
                viewMode === 'split'
                  ? 'bg-white shadow-xs text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
              }`}
              title="Split mode"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`rounded p-1 text-xs transition-colors ${
                viewMode === 'preview'
                  ? 'bg-white shadow-xs text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
              }`}
              title="Preview mode"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex overflow-hidden min-w-0">
        {/* Markdown Input Area */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`h-full flex-1 border-r border-zinc-200 dark:border-zinc-800 flex flex-col ${viewMode === 'edit' ? 'border-r-0' : ''}`}>
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Write your markdown content here..."
              className="w-full h-full resize-none p-6 font-mono text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
        )}

        {/* Live Preview Area */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="h-full flex-1 overflow-y-auto p-6 bg-zinc-50/50 dark:bg-zinc-950/40">
            <div className="prose dark:prose-invert max-w-none text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap font-sans">
              {content ? (
                <div>{content}</div>
              ) : (
                <p className="text-zinc-400 italic">No content to preview.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
