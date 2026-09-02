'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (boardId: string) => void;
}

export function CreateBoardModal({
  isOpen,
  onClose,
  onCreated,
}: CreateBoardModalProps) {
  const router = useRouter();
  const { error, success } = useToast();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create board');
      }

      success(`Board "${name.trim()}" created successfully`);
      setName('');
      onClose();

      if (onCreated) {
        onCreated(data.board.id);
      } else {
        router.push(`/board/${data.board.id}`);
        router.refresh();
      }
    } catch (err: any) {
      error(err.message || 'Error creating board');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Board"
      description="Give your new collaborative drawing board a descriptive title."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Board Name"
          placeholder="e.g. System Design Diagram, DSA Notes"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
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
            Create Board
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
