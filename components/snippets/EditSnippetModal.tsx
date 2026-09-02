'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { CodeSnippet, Tag } from '@/types/database';
import { Code2, Edit3, Save } from 'lucide-react';

interface EditSnippetModalProps {
  isOpen: boolean;
  onClose: () => void;
  snippet: CodeSnippet;
  onUpdated: (updatedSnippet: CodeSnippet) => void;
}

const LANGUAGES = [
  { label: 'TypeScript', value: 'typescript' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'C++', value: 'cpp' },
  { label: 'Rust', value: 'rust' },
  { label: 'Go', value: 'go' },
  { label: 'SQL', value: 'sql' },
  { label: 'JSON / YAML', value: 'json' },
  { label: 'HTML / CSS', value: 'html' },
];

export function EditSnippetModal({
  isOpen,
  onClose,
  snippet,
  onUpdated,
}: EditSnippetModalProps) {
  const { error, success } = useToast();
  const [title, setTitle] = useState(snippet.title);
  const [language, setLanguage] = useState(snippet.language || 'typescript');
  const [code, setCode] = useState(snippet.code);
  const [description, setDescription] = useState(snippet.description || '');
  const [tags, setTags] = useState(snippet.tags?.join(', ') || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setTitle(snippet.title);
    setLanguage(snippet.language || 'typescript');
    setCode(snippet.code);
    setDescription(snippet.description || '');
    setTags(snippet.tags?.join(', ') || '');
  }, [snippet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) return;

    setIsLoading(true);

    const parsedTags = tags
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
      .filter(Boolean);

    const optimisticTags: Tag[] = parsedTags.map((t, idx) => ({
      id: `tag-${idx}`,
      name: t,
      color: '#6366f1',
      created_at: new Date().toISOString(),
    }));

    // Eager optimistic update
    const optimisticUpdated: CodeSnippet = {
      ...snippet,
      title: title.trim(),
      language,
      code,
      description: description.trim() || null,
      tags: optimisticTags,
      updated_at: new Date().toISOString(),
    };

    onUpdated(optimisticUpdated);
    onClose();

    try {
      const res = await fetch(`/api/snippets/${snippet.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          language,
          code,
          description: description.trim() || null,
          tags: parsedTags,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update code snippet');
      }

      success(`Snippet "${title}" updated!`);
      onUpdated(data.snippet);
    } catch (err: any) {
      error(err.message || 'Error updating snippet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Code Snippet"
      description="Update your code algorithm, title, or syntax language. Ray.so cards will update live."
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              label="Snippet Title"
              placeholder="e.g. Binary Search Iterative"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Code Content
          </label>
          <textarea
            rows={9}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 bg-zinc-950 p-3.5 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none dark:border-zinc-700"
            required
          />
        </div>

        <Input
          label="Tags (comma-separated)"
          placeholder="e.g. algorithm, java, arrays"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} className="gap-1.5 bg-indigo-600 hover:bg-indigo-500">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
