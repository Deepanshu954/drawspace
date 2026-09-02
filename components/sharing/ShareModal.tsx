'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { Board, BoardMember, MemberPermission, Profile, ShareLink } from '@/types/database';
import { getInitials } from '@/lib/utils';
import {
  Users,
  Link2,
  Copy,
  Check,
  Trash2,
  Shield,
  Clock,
  Eye,
  Edit3,
  UserPlus,
} from 'lucide-react';

interface ShareModalProps {
  board: Board | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

export function ShareModal({
  board,
  isOpen,
  onClose,
  currentUserId,
}: ShareModalProps) {
  const { error, success } = useToast();
  const [activeTab, setActiveTab] = useState<'people' | 'link'>('people');

  // People State
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [selectedPermission, setSelectedPermission] = useState<MemberPermission>('editor');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Link Sharing State
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [linkPermission, setLinkPermission] = useState<MemberPermission>('viewer');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [generatedRawToken, setGeneratedRawToken] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Fetch members and share links when modal opens
  useEffect(() => {
    if (isOpen && board) {
      loadMembers();
      loadShareLinks();
      loadAllProfiles();
    }
  }, [isOpen, board]);

  const loadMembers = async () => {
    if (!board) return;
    setIsLoadingMembers(true);
    try {
      const res = await fetch(`/api/boards/${board.id}/members`);
      const data = await res.json();
      if (res.ok) {
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const loadAllProfiles = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setAllProfiles(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadShareLinks = async () => {
    if (!board) return;
    try {
      const res = await fetch(`/api/boards/${board.id}/share-links`);
      const data = await res.json();
      if (res.ok) {
        setShareLinks(data.shareLinks || []);
      }
    } catch (err) {
      console.error('Failed to load share links:', err);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!board || !selectedUserEmail.trim()) return;

    setIsAddingMember(true);
    try {
      const res = await fetch(`/api/boards/${board.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedUserEmail.trim(),
          permission: selectedPermission,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add member');
      }

      success(`Added ${selectedUserEmail} as ${selectedPermission}`);
      setSelectedUserEmail('');
      loadMembers();
    } catch (err: any) {
      error(err.message || 'Error adding member');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleUpdateMemberPermission = async (
    userId: string,
    permission: MemberPermission
  ) => {
    if (!board) return;
    try {
      const res = await fetch(`/api/boards/${board.id}/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update member');
      }

      success('Permission updated');
      loadMembers();
    } catch (err: any) {
      error(err.message || 'Error updating member');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!board) return;
    try {
      const res = await fetch(`/api/boards/${board.id}/members/${userId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove member');
      }

      success('Member removed');
      loadMembers();
    } catch (err: any) {
      error(err.message || 'Error removing member');
    }
  };

  const handleCreateShareLink = async () => {
    if (!board) return;
    setIsGeneratingLink(true);
    try {
      const res = await fetch(`/api/boards/${board.id}/share-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permission: linkPermission,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate share link');
      }

      setGeneratedRawToken(data.token);
      success('Share link generated successfully');
      loadShareLinks();
    } catch (err: any) {
      error(err.message || 'Error generating link');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleRevokeShareLink = async (linkId: string) => {
    if (!board) return;
    try {
      const res = await fetch(`/api/boards/${board.id}/share-links/${linkId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to revoke link');
      }

      success('Share link revoked');
      setGeneratedRawToken(null);
      loadShareLinks();
    } catch (err: any) {
      error(err.message || 'Error revoking link');
    }
  };

  const getShareUrl = (token: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/share/${token}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    success('Link copied to clipboard!');
    setTimeout(() => setIsCopied(false), 3000);
  };

  const activeShareLink = shareLinks.find((l) => l.is_active);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Share "${board?.name}"`}
      description="Manage who can view or collaborate on this board."
      className="max-w-xl"
    >
      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 -mt-2 mb-5">
        <button
          onClick={() => setActiveTab('people')}
          className={`flex items-center gap-2 pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'people'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <Users className="w-4 h-4" />
          People ({members.length + 1})
        </button>

        <button
          onClick={() => setActiveTab('link')}
          className={`flex items-center gap-2 pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'link'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <Link2 className="w-4 h-4" />
          Link Sharing
          {activeShareLink && (
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          )}
        </button>
      </div>

      {activeTab === 'people' && (
        <div className="space-y-6">
          {/* Add member form */}
          <form onSubmit={handleAddMember} className="flex gap-2">
            <div className="flex-1 relative">
              <input
                list="user-emails"
                type="email"
                placeholder="Enter member email (e.g. rahul@drawspace.local)"
                value={selectedUserEmail}
                onChange={(e) => setSelectedUserEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                required
              />
              <datalist id="user-emails">
                {allProfiles
                  .filter((p) => p.id !== board?.owner_id && !members.some((m) => m.user_id === p.id))
                  .map((p) => (
                    <option key={p.id} value={p.email}>
                      {p.name} ({p.role})
                    </option>
                  ))}
              </datalist>
            </div>

            <select
              value={selectedPermission}
              onChange={(e) => setSelectedPermission(e.target.value as MemberPermission)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-800 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              <option value="editor">Editor (Can draw)</option>
              <option value="viewer">Viewer (View only)</option>
            </select>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isAddingMember}
            >
              <UserPlus className="w-4 h-4" />
              Add
            </Button>
          </form>

          {/* Members List */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              People with access
            </h4>

            <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              {/* Owner */}
              <div className="flex items-center justify-between p-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {getInitials(board?.owner?.name || 'Owner')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {board?.owner?.name || 'Owner'}
                      </span>
                      {board?.owner_id === currentUserId && (
                        <span className="text-[10px] text-zinc-400">(You)</span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {board?.owner?.email}
                    </span>
                  </div>
                </div>
                <Badge variant="owner">Owner</Badge>
              </div>

              {/* Members */}
              {members.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between p-3.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {getInitials(member.profile?.name || 'User')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {member.profile?.name || 'Member'}
                        </span>
                        {member.user_id === currentUserId && (
                          <span className="text-[10px] text-zinc-400">(You)</span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {member.profile?.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={member.permission}
                      onChange={(e) =>
                        handleUpdateMemberPermission(
                          member.user_id,
                          e.target.value as MemberPermission
                        )
                      }
                      className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                    >
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>

                    <button
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
                      title="Remove access"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {members.length === 0 && (
                <div className="p-4 text-center text-xs text-zinc-400">
                  No other members have access. Add colleagues by email above.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'link' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Shareable Link
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Anyone with this link can access the board according to the permission below.
                </p>
              </div>
            </div>

            {/* If link newly generated, show full link with token */}
            {generatedRawToken ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50/50 p-2.5 dark:border-indigo-900/50 dark:bg-indigo-950/30">
                  <input
                    type="text"
                    readOnly
                    value={getShareUrl(generatedRawToken)}
                    className="flex-1 bg-transparent text-xs font-mono text-zinc-800 dark:text-zinc-200 outline-none truncate"
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => copyToClipboard(getShareUrl(generatedRawToken))}
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {isCopied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  ✓ Link generated! Copy and send it to your team.
                </p>
              </div>
            ) : activeShareLink ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      ● Active Link
                    </span>
                    <Badge variant={activeShareLink.permission as any}>
                      {activeShareLink.permission}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleRevokeShareLink(activeShareLink.id)}
                  >
                    Revoke Link
                  </Button>
                </div>
                <p className="text-[11px] text-zinc-400">
                  To get a fresh copyable link, generate a new link below (this will replace the old one).
                </p>
              </div>
            ) : (
              <p className="text-xs text-zinc-500">
                Link sharing is currently <strong>disabled</strong> for this board.
              </p>
            )}

            {/* Create new link controls */}
            <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-600 dark:text-zinc-400">
                  Permission:
                </label>
                <select
                  value={linkPermission}
                  onChange={(e) => setLinkPermission(e.target.value as MemberPermission)}
                  className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                >
                  <option value="viewer">Viewer (View only)</option>
                  <option value="editor">Editor (Can draw)</option>
                </select>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateShareLink}
                isLoading={isGeneratingLink}
              >
                <Link2 className="w-3.5 h-3.5" />
                {activeShareLink ? 'Regenerate Link' : 'Create Share Link'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
