import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { BoardGrid } from '@/components/boards/BoardGrid';
import { Board, Profile } from '@/types/database';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get current user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // 1. Fetch boards owned by user
  const { data: ownedData, error: ownedError } = await supabase
    .from('boards')
    .select(`
      id,
      name,
      owner_id,
      scene_data,
      created_at,
      updated_at,
      owner:profiles!boards_owner_id_fkey(id, name, email, role, is_active)
    `)
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false });

  if (ownedError) {
    console.error('Error fetching owned boards:', ownedError);
  }

  // 2. Fetch boards shared with user
  const { data: memberData, error: memberError } = await supabase
    .from('board_members')
    .select(`
      permission,
      board:boards!board_members_board_id_fkey(
        id,
        name,
        owner_id,
        scene_data,
        created_at,
        updated_at,
        owner:profiles!boards_owner_id_fkey(id, name, email, role, is_active)
      )
    `)
    .eq('user_id', user.id);

  if (memberError) {
    console.error('Error fetching shared boards:', memberError);
  }

  const ownedBoards: Board[] = (ownedData || []).map((b: any) => ({
    ...b,
    owner: Array.isArray(b.owner) ? b.owner[0] : b.owner,
    userPermission: 'owner',
  }));

  const sharedBoards: Board[] = (memberData || [])
    .filter((m: any) => m.board)
    .map((m: any) => {
      const b = m.board;
      return {
        ...b,
        owner: Array.isArray(b.owner) ? b.owner[0] : b.owner,
        userPermission: m.permission,
      };
    });

  return (
    <BoardGrid
      initialOwnedBoards={ownedBoards}
      initialSharedBoards={sharedBoards}
      currentUserId={user.id}
      currentUserRole={profile?.role}
    />
  );
}
