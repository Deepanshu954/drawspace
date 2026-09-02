'use client';

import React, { useState } from 'react';
import { CodeSnippet } from '@/types/database';
import { CreateSnippetModal } from '@/components/snippets/CreateSnippetModal';
import { RaysoCard } from '@/components/snippets/RaysoCard';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import {
  Code2,
  Plus,
  Search,
  Sparkles,
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
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleUpdate = (updatedSnippet: CodeSnippet) => {
    setSnippets((prev) =>
      prev.map((s) => (s.id === updatedSnippet.id ? updatedSnippet : s))
    );
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
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <Code2 className="w-6 h-6 text-indigo-400" />
            Code Snippets & Ray.so Image Studio
          </h1>
          <p className="text-sm text-zinc-400">
            Save algorithms, export beautiful Ray.so code images (PNG/SVG), and tag them in Team Chat.
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
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-9 pr-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <Button
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            className="shrink-0 gap-1.5 bg-indigo-600 hover:bg-indigo-500"
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
                ? 'bg-zinc-100 text-zinc-900'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
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
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      )}

      {/* Ray.so Snippet Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {filteredSnippets.map((snippet) => {
          const isOwner = snippet.owner_id === currentUserId;
          const isAdmin = currentUserRole === 'admin';

          return (
            <RaysoCard
              key={snippet.id}
              snippet={snippet}
              currentUserId={currentUserId}
              canDelete={isOwner || isAdmin}
              canEdit={isOwner || isAdmin}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          );
        })}

        {filteredSnippets.length === 0 && (
          <div className="col-span-full rounded-2xl border-2 border-dashed border-zinc-800 p-12 text-center text-sm text-zinc-500">
            {searchQuery ? 'No code snippets match your search.' : 'No code snippets saved yet. Click "New Snippet" above to add one and generate Ray.so cards!'}
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
