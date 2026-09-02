import { BoardPermission, UserRole } from '@/types/database';

export function canEdit(permission?: BoardPermission | null): boolean {
  return permission === 'owner' || permission === 'editor';
}

export function canManageMembers(permission?: BoardPermission | null, role?: UserRole | null): boolean {
  return permission === 'owner' || role === 'admin';
}

export function canDeleteBoard(permission?: BoardPermission | null, role?: UserRole | null): boolean {
  return permission === 'owner' || role === 'admin';
}

export function isAdmin(role?: UserRole | null): boolean {
  return role === 'admin';
}
