'use client';

import React, { useState } from 'react';
import { Board } from '@/types/database';
import { BoardCard } from '@/components/boards/BoardCard';
import { CreateBoardModal } from '@/components/boards/CreateBoardModal';
import { RenameBoardModal } from '@/components/boards/RenameBoardModal';
import { DeleteBoardModal } from '@/components/boards/DeleteBoardModal';
import { ShareModal } from '@/components/sharing/ShareModal';
import { Button } from '@/components/ui/Button';
import {
  Plus,
  Search,
  LayoutGrid,
  Users,
  FolderPlus,
  Sparkles,
} from 'lucide-react';

interface BoardGridProps {
  initialOwnedBoards: Board[];
  initialSharedBoards: Board[];
  currentUserId: string;
  currentUserRole?: string;
}

export function BoardGrid({
  initialOwnedBoards,
  initialSharedBoards,
  currentUserId,
  currentUserRole,
}: BoardGridProps) {
  const [ownedBoards, setOwnedBoards] = useState<Board[]>(initialOwnedBoards);
  const [sharedBoards, setSharedBoards] = useState<Board[]>(initialSharedBoards);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBoardForRename, setSelectedBoardForRename] = useState<Board | null>(null);
  const [selectedBoardForDelete, setSelectedBoardForDelete] = useState<Board | null>(null);
  const [selectedBoardForShare, setSelectedBoardForShare] = useState<Board | null>(null);

  // Filtered boards
  const filteredOwned = ownedBoards.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredShared = sharedBoards.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBoardRenamed = (updatedBoard: Board) => {
    setOwnedBoards((prev) =>
      prev.map((b) => (b.id === updatedBoard.id ? { ...b, name: updatedBoard.name } : b))
    );
    setSharedBoards((prev) =>
      prev.map((b) => (b.id === updatedBoard.id ? { ...b, name: updatedBoard.name } : b))
    );
  };

  const handleBoardDeleted = (boardId: string) => {
    setOwnedBoards((prev) => prev.filter((b) => b.id !== boardId));
    setSharedBoards((prev) => prev.filter((b) => b.id !== boardId));
  };

  return (
    <div className="space-y-10">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Workspace Boards
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Create, collaborate, and share Excalidraw whiteboards in real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search boards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateOpen(true)}
            className="shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Board
          </Button>
        </div>
      </div>

      {/* Section 1: My Boards */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
          <LayoutGrid className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            My Boards ({filteredOwned.length})
          </h2>
        </div>

        {filteredOwned.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredOwned.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                onRename={(b) => setSelectedBoardForRename(b)}
                onDelete={(b) => setSelectedBoardForDelete(b)}
                onShare={(b) => setSelectedBoardForShare(b)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 p-10 text-center dark:border-zinc-800">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mb-3">
              <FolderPlus className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {searchQuery ? 'No matching boards' : 'No boards yet'}
            </h3>
            <p className="mt-1 text-xs text-zinc-500 max-w-sm">
              {searchQuery
                ? 'Try a different search query'
                : 'Create your first collaborative drawing board to start mapping ideas.'}
            </p>
            {!searchQuery && (
              <Button
                variant="primary"
                size="sm"
                className="mt-4"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Create a Board
              </Button>
            )}
          </div>
        )}
      </section>

      {/* Section 2: Shared With Me */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Shared With Me ({filteredShared.length})
          </h2>
        </div>

        {filteredShared.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredShared.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                onRename={(b) => setSelectedBoardForRename(b)}
                onDelete={(b) => setSelectedBoardForDelete(b)}
                onShare={(b) => setSelectedBoardForShare(b)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200/60 bg-zinc-50/50 p-6 text-center text-xs text-zinc-500 dark:border-zinc-800/60 dark:bg-zinc-900/30">
            No boards have been shared with you yet. When a teammate invites you, they will appear here.
          </div>
        )}
      </section>

      {/* Modals */}
      <CreateBoardModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <RenameBoardModal
        board={selectedBoardForRename}
        isOpen={!!selectedBoardForRename}
        onClose={() => setSelectedBoardForRename(null)}
        onRenamed={handleBoardRenamed}
      />

      <DeleteBoardModal
        board={selectedBoardForDelete}
        isOpen={!!selectedBoardForDelete}
        onClose={() => setSelectedBoardForDelete(null)}
        onDeleted={() => {
          if (selectedBoardForDelete) {
            handleBoardDeleted(selectedBoardForDelete.id);
          }
        }}
      />

      <ShareModal
        board={selectedBoardForShare}
        isOpen={!!selectedBoardForShare}
        onClose={() => setSelectedBoardForShare(null)}
        currentUserId={currentUserId}
      />
    </div>
  );
}
