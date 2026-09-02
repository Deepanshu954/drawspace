'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Board, BoardPermission } from '@/types/database';
import { Loader2 } from 'lucide-react';

const DynamicExcalidrawWrapper = dynamic(
  () => import('@/components/canvas/ExcalidrawWrapper'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Initializing DrawSpace Canvas…
          </p>
        </div>
      </div>
    ),
  }
);

interface ExcalidrawCanvasProps {
  board: Board;
  currentUserId: string;
  currentUserRole?: string;
  currentUserProfile?: { id: string; name: string; email: string } | null;
  userPermission: BoardPermission;
}

export function ExcalidrawCanvas(props: ExcalidrawCanvasProps) {
  return <DynamicExcalidrawWrapper {...props} />;
}
