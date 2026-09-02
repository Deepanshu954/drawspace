'use client';

import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Profile } from '@/types/database';

interface ResetPasswordModalProps {
  user: Profile | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ResetPasswordModal({
  user,
  isOpen,
  onClose,
}: ResetPasswordModalProps) {
  const { error, success } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPassword) return;

    if (newPassword.length < 8) {
      error('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      success(`Password updated for ${user.name}`);
      setNewPassword('');
      onClose();
    } catch (err: any) {
      error(err.message || 'Error updating password');
    } finally {
      setIsLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Reset Password for ${user?.name}`}
      description={`Set a new password for ${user?.email}.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              New Password
            </label>
            <button
              type="button"
              onClick={generateRandomPassword}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
            >
              Generate Password
            </button>
          </div>
          <Input
            type="text"
            placeholder="Min 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Update Password
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
