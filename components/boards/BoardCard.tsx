'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Board } from '@/types/database';
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
  Layout,
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
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isOwner = board.owner_id === currentUserId;
  const isAdmin = currentUserRole === 'admin';
  const canManage = isOwner || isAdmin;
  const userPermission = isOwner ? 'owner' : board.userPermission || 'viewer';

  const handleCardClick = () => {
    router.push(`/board/${board.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-xs transition-all hover:border-indigo-500/70 hover:shadow-xl hover:shadow-indigo-500/5 cursor-pointer select-none"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-900/50 shrink-0">
                <Layout className="w-3.5 h-3.5" />
              </div>
              <h3 className="truncate font-bold text-base text-zinc-100 group-hover:text-indigo-400 transition-colors">
                {board.name}
              </h3>
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <Badge variant={userPermission as any}>{userPermission}</Badge>
            </div>
          </div>

          {/* Action Menu (stops propagation so clicking menu doesn't trigger card navigation) */}
          <div
            className="relative"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Board options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                  }}
                />
                <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-zinc-800 bg-zinc-900 py-1 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      router.push(`/board/${board.id}`);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors text-left"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                    Open Board
                  </button>

                  {canManage && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(false);
                        onShare(board);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors text-left"
                    >
                      <Share2 className="w-3.5 h-3.5 text-blue-400" />
                      Share & Members
                    </button>
                  )}

                  {canManage && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(false);
                        onRename(board);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors text-left"
                    >
                      <Pencil className="w-3.5 h-3.5 text-amber-400" />
                      Rename
                    </button>
                  )}

                  {canManage && (
                    <div className="border-t border-zinc-800 my-1" />
                  )}

                  {canManage && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(false);
                        onDelete(board);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-950/40 transition-colors text-left"
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
      <div className="mt-6 flex items-center justify-between border-t border-zinc-800 pt-3 text-xs text-zinc-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatDate(board.updated_at)}</span>
        </div>

        <div className="flex items-center gap-1.5 truncate max-w-[140px]">
          <User className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
          <span className="truncate text-zinc-400">
            {isOwner ? 'You' : board.owner?.name || 'Shared'}
          </span>
        </div>
      </div>
    </div>
  );
}
