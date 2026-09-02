'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Hash, Lock } from 'lucide-react';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (channel: any) => void;
}

export function CreateChannelModal({
  isOpen,
  onClose,
  onCreated,
}: CreateChannelModalProps) {
  const router = useRouter();
  const { error, success } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
    if (!cleanName) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/chat/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          description: description.trim(),
          is_private: isPrivate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create channel');
      }

      success(`Channel #${cleanName} created!`);
      setName('');
      setDescription('');
      setIsPrivate(false);
      onClose();

      if (onCreated) {
        onCreated(data.channel);
      } else {
        router.push(`/chat/${data.channel.id}`);
        router.refresh();
      }
    } catch (err: any) {
      error(err.message || 'Error creating channel');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Channel"
      description="Channels are where your team discusses projects, solves DSA problems, and shares whiteboard links."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Channel Name
          </label>
          <div className="relative flex items-center">
            <Hash className="absolute left-3 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="e.g. system-architecture"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white pl-9 pr-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              required
              autoFocus
            />
          </div>
        </div>

        <Input
          label="Topic / Description (Optional)"
          placeholder="What is this channel about?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex items-center gap-3 pt-1">
          <input
            type="checkbox"
            id="private-toggle"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="private-toggle" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-zinc-400" />
            Make channel private (invite-only)
          </label>
        </div>

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
            Create Channel
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
