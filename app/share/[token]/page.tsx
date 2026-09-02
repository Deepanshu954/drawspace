import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { hashToken } from '@/lib/crypto';
import { ExcalidrawCanvas } from '@/components/canvas/ExcalidrawCanvas';
import { Board, BoardPermission, Profile } from '@/types/database';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Link2Off } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;

  if (!token || token.length < 16) {
    return <InvalidLinkView message="The link token is invalid or malformed." />;
  }

  // Compute SHA-256 hash
  const tokenHash = await hashToken(token);

  // Use admin client to verify link without requiring preexisting session
  const adminClient = createAdminClient();

  const { data: shareLink, error: linkError } = await adminClient
    .from('share_links')
    .select('*')
    .eq('token_hash', tokenHash)
    .eq('is_active', true)
    .single();

  if (linkError || !shareLink) {
    return <InvalidLinkView message="This share link does not exist or has been revoked by the owner." />;
  }

  // Check expiry
  if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
    return <InvalidLinkView message="This share link has expired." />;
  }

  // Fetch board
  const { data: board, error: boardError } = await adminClient
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
    .eq('id', shareLink.board_id)
    .single();

  if (boardError || !board) {
    return <InvalidLinkView message="The board associated with this link was not found or was deleted." />;
  }

  // Check if current user is logged in
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (currentUser) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();
    profile = prof;
  }

  const userPermission: BoardPermission = shareLink.permission as BoardPermission;
  const guestId = currentUser ? currentUser.id : `guest-${token.substring(0, 8)}`;
  const guestProfile: Profile = profile || {
    id: guestId,
    name: 'Guest Collaborator',
    email: '',
    role: 'user' as const,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const rawOwner = Array.isArray(board.owner) ? board.owner[0] : board.owner;
  const formattedBoard: Board = {
    ...board,
    owner: rawOwner as Profile,
    userPermission,
  };

  return (
    <ExcalidrawCanvas
      board={formattedBoard}
      currentUserId={guestId}
      currentUserRole="user"
      currentUserProfile={guestProfile}
      userPermission={userPermission}
    />
  );
}

function InvalidLinkView({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 mb-4">
        <Link2Off className="h-8 w-8" />
      </div>
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
        Share Link Unavailable
      </h1>
      <p className="mt-2 text-sm text-zinc-500 max-w-sm">
        {message}
      </p>
      <Link href="/login" className="mt-6">
        <Button variant="primary">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Go to Sign In
        </Button>
      </Link>
    </div>
  );
}
