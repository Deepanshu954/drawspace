'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateDocumentModal({
  isOpen,
  onClose,
}: CreateDocumentModalProps) {
  const router = useRouter();
  const { error, success } = useToast();
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: `# ${title.trim()}\n\nWrite your document notes here...\n\n- Point 1\n- Point 2\n`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create document');
      }

      success(`Document "${title}" created!`);
      setTitle('');
      onClose();
      router.push(`/documents/${data.document.id}`);
      router.refresh();
    } catch (err: any) {
      error(err.message || 'Error creating document');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Knowledge Document"
      description="Write technical specifications, system notes, or revision guides."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Document Title"
          placeholder="e.g. Distributed Consensus Notes, Redis Caching Architecture"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Create Document
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
