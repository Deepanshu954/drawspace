'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Board, BoardPermission, Profile, RealtimeCollaborator, SaveStatus } from '@/types/database';
import { SaveStatusBadge } from '@/components/canvas/SaveStatusBadge';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ShareModal } from '@/components/sharing/ShareModal';
import { RenameBoardModal } from '@/components/boards/RenameBoardModal';
import { getInitials } from '@/lib/utils';
import {
  ArrowLeft,
  Share2,
  Pencil,
  Eye,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface CanvasHeaderProps {
  board: Board;
  currentUserId: string;
  currentUserRole?: string;
  userPermission: BoardPermission;
  saveStatus: SaveStatus;
  collaborators: RealtimeCollaborator[];
  isRealtimeConnected: boolean;
  onBoardRenamed: (board: Board) => void;
}

export function CanvasHeader({
  board,
  currentUserId,
  currentUserRole,
  userPermission,
  saveStatus,
  collaborators,
  isRealtimeConnected,
  onBoardRenamed,
}: CanvasHeaderProps) {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);

  const canManage = userPermission === 'owner' || currentUserRole === 'admin';
  const isViewer = userPermission === 'viewer';

  return (
    <header className="flex h-14 w-full items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 shrink-0 z-30">
      {/* Left: Back to dashboard & Board title */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 rounded-lg p-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors shrink-0"
          title="Return to Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Boards</span>
        </Link>

        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 shrink-0" />

        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate font-semibold text-sm text-zinc-900 dark:text-zinc-100 max-w-[180px] sm:max-w-xs md:max-w-md">
            {board.name}
          </span>

          {canManage && (
            <button
              onClick={() => setIsRenameOpen(true)}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors shrink-0"
              title="Rename Board"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}

          <Badge variant={userPermission as any} className="hidden xs:inline-flex">
            {userPermission}
          </Badge>
        </div>
      </div>

      {/* Right: Presence, Save Status & Share */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Realtime Collaborator Avatars */}
        {collaborators.length > 0 && (
          <div className="flex items-center -space-x-2 overflow-hidden py-1">
            {collaborators.slice(0, 5).map((collab) => (
              <div
                key={collab.id}
                className="group relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow-xs dark:border-zinc-900"
                style={{ backgroundColor: collab.color }}
                title={`${collab.name} (${collab.email || 'Active'})`}
              >
                {getInitials(collab.name)}
                <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 dark:bg-zinc-100 dark:text-zinc-900 z-50">
                  {collab.name}
                </span>
              </div>
            ))}

            {collaborators.length > 5 && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-zinc-200 text-[10px] font-semibold text-zinc-600 dark:border-zinc-900 dark:bg-zinc-800 dark:text-zinc-300">
                +{collaborators.length - 5}
              </div>
            )}
          </div>
        )}

        {/* Realtime connection indicator */}
        <div title={isRealtimeConnected ? 'Live Realtime Connected' : 'Connecting to Realtime'}>
          {isRealtimeConnected ? (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-zinc-400" />
          )}
        </div>

        {/* Save Status Badge */}
        {!isViewer && <SaveStatusBadge status={saveStatus} />}

        {/* Viewer indicator if in read-only mode */}
        {isViewer && (
          <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
            <Eye className="w-3.5 h-3.5" />
            <span>View Only</span>
          </div>
        )}

        {/* Share Button (if owner or admin) */}
        {canManage && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsShareOpen(true)}
            className="gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        )}
      </div>

      {/* Modals */}
      <ShareModal
        board={board}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        currentUserId={currentUserId}
      />

      <RenameBoardModal
        board={board}
        isOpen={isRenameOpen}
        onClose={() => setIsRenameOpen(false)}
        onRenamed={(updated) => {
          onBoardRenamed(updated);
          setIsRenameOpen(false);
        }}
      />
    </header>
  );
}
