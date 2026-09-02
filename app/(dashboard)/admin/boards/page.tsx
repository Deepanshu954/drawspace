import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Board } from '@/types/database';
import { BoardCard } from '@/components/boards/BoardCard';
import { redirect } from 'next/navigation';
import { Layers } from 'lucide-react';
import Link from 'next/link';

export default async function AdminBoardsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard?error=unauthorized');
  }

  // Fetch all boards across the system
  const { data: boards, error } = await supabase
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
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching all boards:', error);
  }

  const formattedBoards: Board[] = (boards || []).map((b: any) => ({
    ...b,
    owner: Array.isArray(b.owner) ? b.owner[0] : b.owner,
    userPermission: 'owner', // Admin has full access
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Layers className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            Workspace Boards (Admin View)
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Overview of all {formattedBoards.length} boards created across all users in DrawSpace.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {formattedBoards.map((board) => (
          <div
            key={board.id}
            className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {board.name}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Owner: <strong>{board.owner?.name}</strong> ({board.owner?.email})
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs text-zinc-400 dark:border-zinc-800">
              <span>{new Date(board.updated_at).toLocaleDateString()}</span>
              <Link
                href={`/board/${board.id}`}
                className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                Open Board →
              </Link>
            </div>
          </div>
        ))}

        {formattedBoards.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-zinc-200 p-12 text-center text-sm text-zinc-400">
            No boards exist in the system yet.
          </div>
        )}
      </div>
    </div>
  );
}
