'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeCollaborator } from '@/types/database';
import { getCollaboratorColor } from '@/lib/utils';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseBoardRealtimeProps {
  boardId: string;
  user: { id: string; name: string; email: string } | null;
  excalidrawAPI: any;
  canEdit: boolean;
}

export function useBoardRealtime({
  boardId,
  user,
  excalidrawAPI,
  canEdit,
}: UseBoardRealtimeProps) {
  const [collaborators, setCollaborators] = useState<RealtimeCollaborator[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const clientIdRef = useRef<string>(
    typeof window !== 'undefined'
      ? Math.random().toString(36).substring(2, 11)
      : 'server'
  );
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isRemoteUpdatingRef = useRef<boolean>(false);
  const lastBroadcastTimestampRef = useRef<number>(0);

  useEffect(() => {
    if (!boardId) return;

    const supabase = createClient();
    const myClientId = clientIdRef.current;
    const userColor = user ? getCollaboratorColor(user.id) : '#6366F1';

    const channel = supabase.channel(`board:${boardId}`, {
      config: {
        broadcast: { ack: false, self: false },
        presence: {
          key: user?.id || myClientId,
        },
      },
    });

    channelRef.current = channel;

    // 1. Presence handlers
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activeUsers: RealtimeCollaborator[] = [];

        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.user) {
              activeUsers.push(p.user);
            }
          });
        });

        // Deduplicate users by id
        const unique = Array.from(
          new Map(activeUsers.map((u) => [u.id, u])).values()
        );
        setCollaborators(unique);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        // Presence sync will update full state
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        // Presence sync will update full state
      });

    // 2. Broadcast scene update handler
    channel.on(
      'broadcast',
      { event: 'scene_update' },
      ({ payload }: { payload: any }) => {
        if (!payload || payload.clientId === myClientId) {
          // Echo suppression: Ignore own updates
          return;
        }

        if (excalidrawAPI && payload.elements) {
          try {
            isRemoteUpdatingRef.current = true;
            excalidrawAPI.updateScene({
              elements: payload.elements,
              commitToHistory: false,
            });

            if (payload.files && Object.keys(payload.files).length > 0) {
              excalidrawAPI.addFiles(Object.values(payload.files));
            }
          } catch (err) {
            console.error('Error applying remote scene update:', err);
          } finally {
            // Small timeout to prevent immediate echo trigger in onChange
            setTimeout(() => {
              isRemoteUpdatingRef.current = false;
            }, 50);
          }
        }
      }
    );

    // 3. Subscribe to channel
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);

        // Track presence once subscribed
        const currentUserPresence: RealtimeCollaborator = {
          id: user?.id || myClientId,
          name: user?.name || 'Anonymous Collaborator',
          email: user?.email || '',
          color: userColor,
          lastActive: Date.now(),
        };

        await channel.track({ user: currentUserPresence });
      } else {
        setIsConnected(false);
      }
    });

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [boardId, user, excalidrawAPI]);

  // Broadcast scene changes
  const broadcastScene = useCallback(
    (elements: readonly any[], files: any) => {
      if (!canEdit || !channelRef.current || !isConnected) return;
      if (isRemoteUpdatingRef.current) return; // Do not rebroadcast incoming updates

      const now = Date.now();
      // Throttle broadcast slightly (e.g. 50ms) for high-frequency pointer strokes
      if (now - lastBroadcastTimestampRef.current < 40) return;
      lastBroadcastTimestampRef.current = now;

      channelRef.current.send({
        type: 'broadcast',
        event: 'scene_update',
        payload: {
          clientId: clientIdRef.current,
          boardId,
          timestamp: now,
          elements,
          files,
        },
      });
    },
    [boardId, canEdit, isConnected]
  );

  return {
    collaborators,
    isConnected,
    isRemoteUpdating: () => isRemoteUpdatingRef.current,
    broadcastScene,
  };
}
