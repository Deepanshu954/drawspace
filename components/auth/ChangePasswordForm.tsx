'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Lock, Check } from 'lucide-react';

export function ChangePasswordForm() {
  const { error, success } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      error('New password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      success('Password changed successfully! You can use this for your next login.');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      error(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <Input
        label="New Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        helperText="Minimum 8 characters"
        required
      />

      <Input
        label="Confirm New Password"
        type="password"
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      <Button
        type="submit"
        variant="primary"
        size="md"
        isLoading={isLoading}
      >
        <Lock className="w-4 h-4" />
        Update Password
      </Button>
    </form>
  );
}
