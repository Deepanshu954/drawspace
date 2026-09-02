'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { SaveStatus, ExcalidrawSceneData } from '@/types/database';

interface UseDebounceSaveOptions {
  boardId: string;
  canEdit: boolean;
  debounceMs?: number;
  onSaved?: () => void;
  onError?: (err: Error) => void;
}

export function useDebounceSave({
  boardId,
  canEdit,
  debounceMs = 1000,
  onSaved,
  onError,
}: UseDebounceSaveOptions) {
  const [status, setStatus] = useState<SaveStatus>('saved');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDataRef = useRef<ExcalidrawSceneData | null>(null);
  const isSavingRef = useRef<boolean>(false);

  // Sanitize appState to preserve canvas defaults without transient view selections
  const sanitizeAppState = (appState: any) => {
    if (!appState) return {};
    return {
      viewBackgroundColor: appState.viewBackgroundColor,
      gridSize: appState.gridSize,
      scrollX: appState.scrollX,
      scrollY: appState.scrollY,
      zoom: appState.zoom,
    };
  };

  const persistToDatabase = useCallback(
    async (sceneData: ExcalidrawSceneData) => {
      if (!canEdit) return;

      try {
        isSavingRef.current = true;
        setStatus('saving');

        const res = await fetch(`/api/boards/${boardId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scene_data: {
              elements: sceneData.elements || [],
              appState: sanitizeAppState(sceneData.appState),
              files: sceneData.files || {},
              revision: Date.now(),
            },
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to persist board');
        }

        setStatus('saved');
        pendingDataRef.current = null;
        if (onSaved) onSaved();
      } catch (err: any) {
        console.error('Error saving board scene:', err);
        setStatus('error');
        if (onError) onError(err);
      } finally {
        isSavingRef.current = false;
      }
    },
    [boardId, canEdit, onSaved, onError]
  );

  const scheduleSave = useCallback(
    (elements: readonly any[], appState: any, files: any) => {
      if (!canEdit) return;

      const sceneData: ExcalidrawSceneData = {
        elements: elements as any[],
        appState,
        files,
      };

      pendingDataRef.current = sceneData;
      setStatus('saving');

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        if (pendingDataRef.current) {
          persistToDatabase(pendingDataRef.current);
        }
      }, debounceMs);
    },
    [canEdit, debounceMs, persistToDatabase]
  );

  // Flush on page unload or visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && pendingDataRef.current) {
        if (timerRef.current) clearTimeout(timerRef.current);
        persistToDatabase(pendingDataRef.current);
      }
    };

    const handleBeforeUnload = () => {
      if (pendingDataRef.current) {
        const payload = JSON.stringify({
          scene_data: {
            elements: pendingDataRef.current.elements || [],
            appState: sanitizeAppState(pendingDataRef.current.appState),
            files: pendingDataRef.current.files || {},
            revision: Date.now(),
          },
        });
        // Use sendBeacon for reliable unmount write
        navigator.sendBeacon(`/api/boards/${boardId}`, payload);
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [boardId, persistToDatabase]);

  return {
    status,
    scheduleSave,
    flushSave: () => {
      if (pendingDataRef.current) {
        if (timerRef.current) clearTimeout(timerRef.current);
        persistToDatabase(pendingDataRef.current);
      }
    },
  };
}
