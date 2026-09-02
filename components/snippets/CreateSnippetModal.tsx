'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Code2 } from 'lucide-react';

interface CreateSnippetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (snippet: any) => void;
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

export function CreateSnippetModal({
  isOpen,
  onClose,
  onCreated,
}: CreateSnippetModalProps) {
  const router = useRouter();
  const { error, success } = useToast();
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          language,
          code,
          description: description.trim() || null,
          tags: tags
            .split(',')
            .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
            .filter(Boolean),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save code snippet');
      }

      success(`Snippet "${title}" saved!`);
      setTitle('');
      setCode('');
      setDescription('');
      setTags('');
      onClose();

      if (onCreated) {
        onCreated(data.snippet);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      error(err.message || 'Error saving snippet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Save Code Snippet"
      description="Create a first-class searchable code snippet with syntax highlighting and tags."
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              label="Snippet Title"
              placeholder="e.g. Binary Search Iterative, LRU Cache"
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
            rows={8}
            placeholder={`// Paste your ${language} code here...\nfunction example() {\n  return true;\n}`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 bg-zinc-950 p-3.5 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none dark:border-zinc-700"
            required
          />
        </div>

        <Input
          label="Tags (comma-separated)"
          placeholder="e.g. dsa, binary-search, java"
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
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Save Snippet
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
