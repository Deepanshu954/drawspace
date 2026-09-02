'use client';

import React, { useState } from 'react';
import { Profile } from '@/types/database';
import { UserTable } from '@/components/admin/UserTable';
import { CreateUserModal } from '@/components/admin/CreateUserModal';
import { Button } from '@/components/ui/Button';
import { Shield, Plus } from 'lucide-react';

interface AdminUsersViewProps {
  initialUsers: Profile[];
  currentUserId: string;
}

export function AdminUsersView({
  initialUsers,
  currentUserId,
}: AdminUsersViewProps) {
  const [users, setUsers] = useState<Profile[]>(initialUsers);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const handleUserCreated = (newUser: Profile) => {
    setUsers((prev) => [newUser, ...prev]);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-400" />
            User Management & Access Control
          </h1>
          <p className="text-sm text-zinc-400">
            Provision team members with username, email, and password, or approve self-registration access requests.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsAddUserOpen(true)}
          className="shrink-0 gap-1.5 bg-indigo-600 hover:bg-indigo-500"
        >
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Users Table & Pending Requests */}
      <UserTable users={users} currentUserId={currentUserId} />

      {/* Add User Modal */}
      <CreateUserModal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        onUserCreated={handleUserCreated}
      />
    </div>
  );
}
