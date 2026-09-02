'use client';

import React, { useState } from 'react';
import { Profile } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ResetPasswordModal } from '@/components/admin/ResetPasswordModal';
import { useToast } from '@/components/ui/Toast';
import { formatDate, getInitials } from '@/lib/utils';
import {
  Shield,
  Key,
  Trash2,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX,
  Clock,
  Mail,
  User,
} from 'lucide-react';

interface UserTableProps {
  users: Profile[];
  currentUserId: string;
}

export function UserTable({ users: initialUsers, currentUserId }: UserTableProps) {
  const { error, success } = useToast();
  const [users, setUsers] = useState<Profile[]>(initialUsers);
  const [resetTargetUser, setResetTargetUser] = useState<Profile | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Split into pending requests and active/approved users
  const pendingUsers = users.filter((u) => u.status === 'pending');
  const activeUsers = users.filter((u) => u.status !== 'pending');

  const handleApproveRequest = async (userId: string, username: string) => {
    setActionLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved', is_active: true }),
      });

      if (!res.ok) throw new Error('Failed to approve access request');

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, status: 'approved', is_active: true } : u
        )
      );
      success(`Access confirmed! @${username} can now log in.`);
    } catch (err: any) {
      error(err.message || 'Error approving user');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectRequest = async (userId: string) => {
    setActionLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', is_active: false }),
      });

      if (!res.ok) throw new Error('Failed to reject access request');

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, status: 'rejected', is_active: false } : u
        )
      );
      success('Access request rejected');
    } catch (err: any) {
      error(err.message || 'Error rejecting request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    if (userId === currentUserId) {
      error('You cannot deactivate your own admin account');
      return;
    }

    setActionLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!res.ok) throw new Error('Failed to update user status');

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_active: !currentStatus } : u
        )
      );
      success(`User account ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (err: any) {
      error(err.message || 'Error updating status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (userId === currentUserId) {
      error('You cannot delete your own admin account');
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete user ${userEmail}?`)) {
      return;
    }

    setActionLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete user');

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      success('User permanently deleted');
    } catch (err: any) {
      error(err.message || 'Error deleting user');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Pending Access Requests Section */}
      {pendingUsers.length > 0 && (
        <div className="rounded-2xl border border-amber-900/50 bg-amber-950/20 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-base text-amber-200">
              Pending Access Requests ({pendingUsers.length})
            </h2>
          </div>
          <p className="text-xs text-amber-300/80">
            These users requested access via self-registration. Click <strong>Confirm</strong> to grant them instant login access.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-xl border border-amber-900/40 bg-zinc-900/80 p-3.5 shadow-xs"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-zinc-100 truncate">
                      @{user.username || 'user'}
                    </span>
                    <span className="rounded-full bg-amber-900/50 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-800/60">
                      Pending
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">{user.email}</p>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Requested {formatDate(user.created_at)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleApproveRequest(user.id, user.username || 'user')}
                    isLoading={actionLoadingId === user.id}
                    className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Confirm
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleRejectRequest(user.id)}
                    disabled={actionLoadingId === user.id}
                    className="h-8 text-xs text-red-400 hover:bg-red-950/40 border-zinc-700"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. All Registered Users Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base text-zinc-100">
              Workspace Team Members ({activeUsers.length})
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Active and approved accounts that can log in and collaborate.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="border-b border-zinc-800 bg-zinc-950/50 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Email / Gmail</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Joined</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {activeUsers.map((user) => {
                const isSelf = user.id === currentUserId;
                const isLoading = actionLoadingId === user.id;

                return (
                  <tr key={user.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-950 font-bold text-xs text-indigo-300 border border-indigo-900/50 shrink-0">
                          {getInitials(user.name || user.username || 'User')}
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-100 flex items-center gap-1.5">
                            {user.name}
                            {isSelf && (
                              <span className="text-[10px] text-zinc-400 font-normal">
                                (You)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-indigo-400 font-mono">
                            @{user.username || 'user'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap text-zinc-300">
                      {user.email}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <Badge variant={user.role as any}>{user.role}</Badge>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400">
                          <XCircle className="w-3.5 h-3.5" />
                          Deactivated
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-zinc-500">
                      {formatDate(user.created_at)}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setResetTargetUser(user)}
                          className="h-8 text-xs gap-1 border-zinc-700 hover:bg-zinc-800"
                          title="Reset user password"
                        >
                          <Key className="w-3.5 h-3.5" />
                          Reset Pass
                        </Button>

                        {!isSelf && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleActive(user.id, user.is_active)}
                              isLoading={isLoading}
                              className={`h-8 text-xs border-zinc-700 ${
                                user.is_active
                                  ? 'text-amber-400 hover:bg-amber-950/40'
                                  : 'text-emerald-400 hover:bg-emerald-950/40'
                              }`}
                            >
                              {user.is_active ? 'Deactivate' : 'Activate'}
                            </Button>

                            <button
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              disabled={isLoading}
                              className="rounded-lg p-2 text-zinc-500 hover:bg-red-950/50 hover:text-red-400 transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {activeUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-xs text-zinc-500">
                    No active users yet. Click &quot;Add User&quot; above to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {resetTargetUser && (
        <ResetPasswordModal
          user={resetTargetUser}
          isOpen={!!resetTargetUser}
          onClose={() => setResetTargetUser(null)}
        />
      )}
    </div>
  );
}
