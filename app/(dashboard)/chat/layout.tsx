import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { Channel, Profile } from '@/types/database';
import { redirect } from 'next/navigation';

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch channels
  const { data: channels } = await supabase
    .from('channels')
    .select('*')
    .order('created_at', { ascending: true });

  // Fetch all active profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_active', true)
    .order('name');

  return (
    <div className="flex h-[calc(100vh-8.5rem)] rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
      <ChatSidebar
        channels={(channels as Channel[]) || []}
        users={(profiles as Profile[]) || []}
        currentUserId={user.id}
      />
      <div className="flex-1 flex overflow-hidden min-w-0">
        {children}
      </div>
    </div>
  );
}
