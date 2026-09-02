'use client';

import React, { useState } from 'react';
import { Profile, UserRole } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { getInitials, formatDate } from '@/lib/utils';
import { CreateUserModal } from '@/components/admin/CreateUserModal';
import { ResetPasswordModal } from '@/components/admin/ResetPasswordModal';
import { Dialog } from '@/components/ui/Dialog';
import {
  UserPlus,
  KeyRound,
  Trash2,
  CheckCircle,
  XCircle,
  Shield,
  User,
  AlertTriangle,
} from 'lucide-react';

interface UserTableProps {
  initialUsers: Profile[];
  currentUserId: string;
}

export function UserTable({ initialUsers, currentUserId }: UserTableProps) {
  const { error, success } = useToast();
  const [users, setUsers] = useState<Profile[]>(initialUsers);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<Profile | null>(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<Profile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUserCreated = (newUser: Profile) => {
    setUsers((prev) => [newUser, ...prev]);
  };

  const handleToggleStatus = async (user: Profile) => {
    const newStatus = !user.is_active;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user status');
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: newStatus } : u))
      );
      success(`User ${user.name} is now ${newStatus ? 'Active' : 'Deactivated'}`);
    } catch (err: any) {
      error(err.message || 'Error updating status');
    }
  };

  const handleToggleRole = async (user: Profile) => {
    const newRole: UserRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to change role');
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
      success(`User ${user.name} role changed to ${newRole}`);
    } catch (err: any) {
      error(err.message || 'Error changing role');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUserForDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUserForDelete.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      setUsers((prev) => prev.filter((u) => u.id !== selectedUserForDelete.id));
      success(`User ${selectedUserForDelete.name} permanently deleted`);
      setSelectedUserForDelete(null);
    } catch (err: any) {
      error(err.message || 'Error deleting user');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            User Management
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Create user accounts, set credentials, manage activation status, and assign roles.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateOpen(true)}
          className="shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Create User
        </Button>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
              <tr>
                <th scope="col" className="px-6 py-4">User</th>
                <th scope="col" className="px-6 py-4">Role</th>
                <th scope="col" className="px-6 py-4">Status</th>
                <th scope="col" className="px-6 py-4">Created</th>
                <th scope="col" className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {users.map((user) => {
                const isSelf = user.id === currentUserId;

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-zinc-50/75 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 font-bold text-xs text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {user.name}
                            </span>
                            {isSelf && (
                              <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                                (You)
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={user.role as any}>{user.role}</Badge>
                        {!isSelf && (
                          <button
                            onClick={() => handleToggleRole(user)}
                            className="text-[11px] text-zinc-400 hover:text-indigo-600 underline dark:hover:text-indigo-400"
                            title="Switch between User and Admin role"
                          >
                            Change
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <Badge variant={user.is_active ? 'active' : 'inactive'}>
                        {user.is_active ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>

                    <td className="px-6 py-4 text-xs text-zinc-400">
                      {formatDate(user.created_at)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedUserForReset(user)}
                          title="Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="hidden md:inline">Reset Pass</span>
                        </Button>

                        {!isSelf && (
                          <>
                            <Button
                              size="sm"
                              variant={user.is_active ? 'outline' : 'secondary'}
                              onClick={() => handleToggleStatus(user)}
                            >
                              {user.is_active ? (
                                <>
                                  <XCircle className="w-3.5 h-3.5 text-amber-500" />
                                  <span className="hidden md:inline">Disable</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="hidden md:inline">Enable</span>
                                </>
                              )}
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedUserForDelete(user)}
                              className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onUserCreated={handleUserCreated}
      />

      <ResetPasswordModal
        user={selectedUserForReset}
        isOpen={!!selectedUserForReset}
        onClose={() => setSelectedUserForReset(null)}
      />

      {/* Delete User Confirmation Dialog */}
      <Dialog
        isOpen={!!selectedUserForDelete}
        onClose={() => setSelectedUserForDelete(null)}
        title="Delete User Account"
        description="Permanently remove this user from the workspace."
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="font-semibold">
                Delete account for &ldquo;{selectedUserForDelete?.name}&rdquo;?
              </p>
              <p className="mt-1 text-xs opacity-90">
                This will delete their user profile, remove them from all shared boards, and revoke their login credentials.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setSelectedUserForDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteUser}
              isLoading={isDeleting}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
