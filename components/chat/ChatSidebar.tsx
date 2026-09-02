'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Channel, Profile } from '@/types/database';
import { CreateChannelModal } from '@/components/chat/CreateChannelModal';
import { getInitials } from '@/lib/utils';
import {
  Hash,
  Lock,
  Plus,
  MessageSquare,
  Users,
  Circle,
} from 'lucide-react';

interface ChatSidebarProps {
  channels: Channel[];
  users: Profile[];
  currentUserId: string;
  activeChannelId?: string;
  activeDmUserId?: string;
}

export function ChatSidebar({
  channels: initialChannels,
  users,
  currentUserId,
  activeChannelId,
  activeDmUserId,
}: ChatSidebarProps) {
  const pathname = usePathname();
  const [channels, setChannels] = useState<Channel[]>(initialChannels);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);

  const handleChannelCreated = (newChannel: Channel) => {
    setChannels((prev) => [...prev, newChannel]);
  };

  const otherUsers = users.filter((u) => u.id !== currentUserId);

  return (
    <aside className="w-64 shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 flex flex-col h-full select-none">
      {/* Workspace Header */}
      <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
            Workspace Chat
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* Channels Section */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 text-xs font-semibold uppercase text-zinc-400 dark:text-zinc-500">
            <span>Channels ({channels.length})</span>
            <button
              onClick={() => setIsCreateChannelOpen(true)}
              className="rounded p-1 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
              title="Create channel"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5 mt-1.5">
            {channels.map((ch) => {
              const isActive = activeChannelId === ch.id || (!activeChannelId && !activeDmUserId && ch.name === 'general');

              return (
                <Link
                  key={ch.id}
                  href={`/chat/${ch.id}`}
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 font-semibold'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {ch.is_private ? (
                      <Lock className="w-3.5 h-3.5 shrink-0 opacity-60" />
                    ) : (
                      <Hash className="w-3.5 h-3.5 shrink-0 opacity-60" />
                    )}
                    <span className="truncate">{ch.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Direct Messages Section */}
        <div className="space-y-1">
          <div className="px-2 text-xs font-semibold uppercase text-zinc-400 dark:text-zinc-500">
            <span>Direct Messages ({otherUsers.length})</span>
          </div>

          <div className="space-y-0.5 mt-1.5">
            {otherUsers.map((u) => {
              const isActive = activeDmUserId === u.id;

              return (
                <Link
                  key={u.id}
                  href={`/chat/dm/${u.id}`}
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 font-semibold'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className="relative">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-[9px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {getInitials(u.name)}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
                    </div>
                    <span className="truncate">{u.name}</span>
                  </div>
                </Link>
              );
            })}

            {otherUsers.length === 0 && (
              <p className="px-2 text-[11px] text-zinc-400">No other members yet.</p>
            )}
          </div>
        </div>
      </div>

      <CreateChannelModal
        isOpen={isCreateChannelOpen}
        onClose={() => setIsCreateChannelOpen(false)}
        onCreated={handleChannelCreated}
      />
    </aside>
  );
}
