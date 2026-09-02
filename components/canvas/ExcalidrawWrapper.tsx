'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { Board, BoardPermission, ExcalidrawSceneData } from '@/types/database';
import { useDebounceSave } from '@/hooks/useDebounceSave';
import { useBoardRealtime } from '@/hooks/useBoardRealtime';
import { CanvasHeader } from '@/components/canvas/CanvasHeader';

interface ExcalidrawWrapperProps {
  board: Board;
  currentUserId: string;
  currentUserRole?: string;
  currentUserProfile?: { id: string; name: string; email: string } | null;
  userPermission: BoardPermission;
}

export default function ExcalidrawWrapper({
  board: initialBoard,
  currentUserId,
  currentUserRole,
  currentUserProfile,
  userPermission,
}: ExcalidrawWrapperProps) {
  const [board, setBoard] = useState<Board>(initialBoard);
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

  const canEdit = userPermission === 'owner' || userPermission === 'editor';
  const isViewer = userPermission === 'viewer';

  // Persistence Hook
  const { status: saveStatus, scheduleSave } = useDebounceSave({
    boardId: board.id,
    canEdit,
  });

  // Realtime Broadcast & Presence Hook
  const {
    collaborators,
    isConnected: isRealtimeConnected,
    isRemoteUpdating,
    broadcastScene,
  } = useBoardRealtime({
    boardId: board.id,
    user: currentUserProfile || {
      id: currentUserId,
      name: 'Collaborator',
      email: '',
    },
    excalidrawAPI,
    canEdit,
  });

  // Intercept Excalidraw onChange
  const handleChange = (
    elements: readonly any[],
    appState: any,
    files: any
  ) => {
    if (!canEdit) return;

    // If change was triggered by remote broadcast, do not rebroadcast or save immediately
    if (isRemoteUpdating()) return;

    // 1. Broadcast to peer collaborators immediately
    broadcastScene(elements, files);

    // 2. Schedule debounced save to database
    scheduleSave(elements, appState, files);
  };

  // Initial Data
  const sceneData: ExcalidrawSceneData = board.scene_data || {
    elements: [],
    appState: {},
    files: {},
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950">
      {/* Header Bar */}
      <CanvasHeader
        board={board}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        userPermission={userPermission}
        saveStatus={saveStatus}
        collaborators={collaborators}
        isRealtimeConnected={isRealtimeConnected}
        onBoardRenamed={(updated) => setBoard(updated)}
      />

      {/* Excalidraw Canvas Container with non-zero dimensions */}
      <div className="relative flex-1 w-full h-full">
        <Excalidraw
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          initialData={{
            elements: sceneData.elements || [],
            appState: {
              ...(sceneData.appState || {}),
              viewModeEnabled: isViewer,
            },
            files: sceneData.files || {},
          }}
          onChange={handleChange}
          viewModeEnabled={isViewer}
          UIOptions={{
            canvasActions: {
              changeViewBackgroundColor: true,
              clearCanvas: canEdit,
              export: { saveFileToDisk: true },
              loadScene: canEdit,
              saveToActiveFile: false,
              toggleTheme: true,
            },
          }}
        />
      </div>
    </div>
  );
}
