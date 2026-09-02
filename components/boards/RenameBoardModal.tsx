'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Board } from '@/types/database';

interface RenameBoardModalProps {
  board: Board | null;
  isOpen: boolean;
  onClose: () => void;
  onRenamed?: (board: Board) => void;
}

export function RenameBoardModal({
  board,
  isOpen,
  onClose,
  onRenamed,
}: RenameBoardModalProps) {
  const router = useRouter();
  const { error, success } = useToast();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (board) {
      setName(board.name);
    }
  }, [board]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!board || !name.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/boards/${board.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to rename board');
      }

      success('Board renamed successfully');
      onClose();

      if (onRenamed) {
        onRenamed(data.board);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      error(err.message || 'Error renaming board');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Rename Board"
      description="Update the title for this board."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Board Name"
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
            Save Changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
