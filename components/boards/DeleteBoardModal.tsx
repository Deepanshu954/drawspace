'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Board } from '@/types/database';
import { AlertTriangle } from 'lucide-react';

interface DeleteBoardModalProps {
  board: Board | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export function DeleteBoardModal({
  board,
  isOpen,
  onClose,
  onDeleted,
}: DeleteBoardModalProps) {
  const router = useRouter();
  const { error, success } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!board) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/boards/${board.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete board');
      }

      success(`Board "${board.name}" deleted`);
      onClose();

      if (onDeleted) {
        onDeleted();
      } else {
        router.refresh();
      }
    } catch (err: any) {
      error(err.message || 'Error deleting board');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Board"
      description="This action cannot be undone."
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
          <div>
            <p className="font-semibold">Are you sure you want to permanently delete this board?</p>
            <p className="mt-1 text-xs opacity-90">
              Board <strong>&ldquo;{board?.name}&rdquo;</strong> and all associated drawing elements, members, and share links will be permanently removed.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            isLoading={isLoading}
          >
            Delete Board
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
