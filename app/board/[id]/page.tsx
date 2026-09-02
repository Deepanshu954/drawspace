import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { ExcalidrawCanvas } from '@/components/canvas/ExcalidrawCanvas';
import { Board, BoardPermission, Profile } from '@/types/database';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface BoardPageProps {
  params: Promise<{ id: string }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { id: boardId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/board/${boardId}`);
  }

  // Fetch current user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch board
  const { data: board, error } = await supabase
    .from('boards')
    .select(`
      id,
      name,
      owner_id,
      scene_data,
      created_at,
      updated_at,
      owner:profiles!boards_owner_id_fkey(id, name, email, role, is_active, created_at, updated_at)
    `)
    .eq('id', boardId)
    .single();

  if (error || !board) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Board Not Found or Access Denied
        </h1>
        <p className="mt-2 text-sm text-zinc-500 max-w-sm">
          You don&apos;t have permission to access this board, or it may have been deleted by the owner.
        </p>
        <Link href="/dashboard" className="mt-6">
          <Button variant="primary">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  // Resolve permission
  let userPermission: BoardPermission = 'viewer';

  if (board.owner_id === user.id || profile?.role === 'admin') {
    userPermission = 'owner';
  } else {
    const { data: member } = await supabase
      .from('board_members')
      .select('permission')
      .eq('board_id', boardId)
      .eq('user_id', user.id)
      .single();

    if (member) {
      userPermission = member.permission as BoardPermission;
    }
  }

  const rawOwner = Array.isArray(board.owner) ? board.owner[0] : board.owner;
  const formattedBoard: Board = {
    ...board,
    owner: rawOwner as Profile,
    userPermission,
  };

  return (
    <ExcalidrawCanvas
      board={formattedBoard}
      currentUserId={user.id}
      currentUserRole={profile?.role}
      currentUserProfile={profile}
      userPermission={userPermission}
    />
  );
}
