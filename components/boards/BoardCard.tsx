'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Board, Profile } from '@/types/database';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import {
  MoreVertical,
  Pencil,
  Trash2,
  Share2,
  ExternalLink,
  Clock,
  User,
} from 'lucide-react';

interface BoardCardProps {
  board: Board;
  currentUserId: string;
  currentUserRole?: string;
  onRename: (board: Board) => void;
  onDelete: (board: Board) => void;
  onShare: (board: Board) => void;
}

export function BoardCard({
  board,
  currentUserId,
  currentUserRole,
  onRename,
  onDelete,
  onShare,
}: BoardCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isOwner = board.owner_id === currentUserId;
  const isAdmin = currentUserRole === 'admin';
  const canManage = isOwner || isAdmin;
  const userPermission = isOwner ? 'owner' : board.userPermission || 'viewer';

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 flex-1 min-w-0">
            <Link
              href={`/board/${board.id}`}
              className="block truncate font-semibold text-zinc-900 hover:text-indigo-600 dark:text-zinc-100 dark:hover:text-indigo-400 transition-colors"
            >
              {board.name}
            </Link>
            <div className="flex items-center gap-2">
              <Badge variant={userPermission as any}>{userPermission}</Badge>
            </div>
          </div>

          {/* Action Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 z-50 animate-in fade-in zoom-in-95">
                  <Link
                    href={`/board/${board.id}`}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Board
                  </Link>

                  {canManage && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onShare(board);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Share & Members
                    </button>
                  )}

                  {canManage && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onRename(board);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Rename
                    </button>
                  )}

                  {canManage && (
                    <div className="border-t border-zinc-100 my-1 dark:border-zinc-800" />
                  )}

                  {canManage && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onDelete(board);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Board
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatDate(board.updated_at)}</span>
        </div>

        <div className="flex items-center gap-1.5 truncate max-w-[140px]">
          <User className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {isOwner ? 'You' : board.owner?.name || 'Shared'}
          </span>
        </div>
      </div>
    </div>
  );
}
