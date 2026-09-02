'use client';

import React, { useState } from 'react';
import { CodeSnippet } from '@/types/database';
import { CreateSnippetModal } from '@/components/snippets/CreateSnippetModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import {
  Code2,
  Copy,
  Check,
  Plus,
  Search,
  Tag as TagIcon,
  Trash2,
  Terminal,
} from 'lucide-react';

interface SnippetListProps {
  initialSnippets: CodeSnippet[];
  currentUserId: string;
  currentUserRole?: string;
}

export function SnippetList({
  initialSnippets,
  currentUserId,
  currentUserRole,
}: SnippetListProps) {
  const { error, success } = useToast();
  const [snippets, setSnippets] = useState<CodeSnippet[]>(initialSnippets);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const copyCode = (snippet: CodeSnippet) => {
    navigator.clipboard.writeText(snippet.code);
    setCopiedId(snippet.id);
    success(`Copied "${snippet.title}" to clipboard!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDelete = async (snippetId: string) => {
    try {
      const res = await fetch(`/api/snippets/${snippetId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete snippet');
      setSnippets((prev) => prev.filter((s) => s.id !== snippetId));
      success('Snippet deleted');
    } catch (err: any) {
      error(err.message || 'Error deleting snippet');
    }
  };

  const filteredSnippets = snippets.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesLang = selectedLanguage === 'all' || s.language === selectedLanguage;
    return matchesSearch && matchesLang;
  });

  const languages = Array.from(new Set(snippets.map((s) => s.language)));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Code2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Code Snippets
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Save, categorize, and quickly reference code solutions and algorithmic templates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search code & titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>

          <Button
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            className="shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Snippet
          </Button>
        </div>
      </div>

      {/* Language filter pills */}
      {languages.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedLanguage('all')}
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
              selectedLanguage === 'all'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            All ({snippets.length})
          </button>
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
                selectedLanguage === lang
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      )}

      {/* Snippet Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {filteredSnippets.map((snippet) => {
          const isOwner = snippet.owner_id === currentUserId;
          const isAdmin = currentUserRole === 'admin';
          const isCopied = copiedId === snippet.id;

          return (
            <div
              key={snippet.id}
              className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden dark:border-zinc-800 dark:bg-zinc-900"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/75 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
                <div className="flex items-center gap-2.5 truncate">
                  <Terminal className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                    {snippet.title}
                  </span>
                  <span className="rounded-md bg-zinc-200/70 px-2 py-0.5 font-mono text-[10px] font-bold text-zinc-700 uppercase dark:bg-zinc-800 dark:text-zinc-300">
                    {snippet.language}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => copyCode(snippet)}
                    className="h-7 text-xs gap-1"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {isCopied ? 'Copied' : 'Copy'}
                  </Button>

                  {(isOwner || isAdmin) && (
                    <button
                      onClick={() => handleDelete(snippet.id)}
                      className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
                      title="Delete snippet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Code display */}
              <div className="p-4 bg-zinc-950 text-zinc-100 font-mono text-xs overflow-x-auto max-h-64 leading-relaxed select-all">
                <pre>
                  <code>{snippet.code}</code>
                </pre>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-2.5 text-xs text-zinc-400 dark:border-zinc-800">
                <span>By {snippet.owner?.name || 'Teammate'}</span>
                <span>{formatDate(snippet.created_at)}</span>
              </div>
            </div>
          );
        })}

        {filteredSnippets.length === 0 && (
          <div className="col-span-full rounded-2xl border-2 border-dashed border-zinc-200 p-12 text-center text-sm text-zinc-400 dark:border-zinc-800">
            {searchQuery ? 'No code snippets match your filter.' : 'No code snippets saved yet. Click "New Snippet" above to add one!'}
          </div>
        )}
      </div>

      <CreateSnippetModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(newSnippet) => setSnippets((prev) => [newSnippet, ...prev])}
      />
    </div>
  );
}
