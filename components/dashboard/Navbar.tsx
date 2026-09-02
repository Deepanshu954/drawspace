'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types/database';
import { getInitials } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import {
  Pencil,
  LayoutDashboard,
  MessageSquare,
  FileText,
  Code2,
  Search,
  Shield,
  Settings,
  LogOut,
  ChevronDown,
  Layers,
} from 'lucide-react';

interface NavbarProps {
  profile: Profile | null;
}

export function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const isAdmin = profile?.role === 'admin';

  const navItems = [
    { name: 'Boards', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'Snippets', href: '/snippets', icon: Code2 },
    { name: 'Search', href: '/search', icon: Search },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6 lg:gap-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 font-bold text-lg text-zinc-900 dark:text-zinc-100 hover:opacity-90 transition-opacity"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/30">
              <Pencil className="h-5 w-5" />
            </div>
            <span>DrawSpace</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={true}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs lg:text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-xs'
                      : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                href="/admin/users"
                prefetch={true}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs lg:text-sm font-medium transition-colors ${
                  pathname.startsWith('/admin')
                    ? 'bg-purple-950/50 text-purple-200 font-semibold border border-purple-800/40'
                    : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100'
                }`}
              >
                <Shield className="w-4 h-4 text-purple-400" />
                Admin
              </Link>
            )}
          </nav>
        </div>

        {/* User profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 font-semibold text-xs text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {getInitials(profile?.name || 'User')}
            </div>
            <div className="hidden sm:flex flex-col items-start text-left">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                {profile?.name || 'User'}
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                {profile?.email}
              </span>
            </div>
            {isAdmin && <Badge variant="admin">Admin</Badge>}
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                    Signed in as
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {profile?.email}
                  </p>
                </div>

                <div className="py-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Boards
                  </Link>

                  <Link
                    href="/chat"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Workspace Chat
                  </Link>

                  <Link
                    href="/snippets"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    Code Snippets
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Account Settings
                  </Link>

                  {isAdmin && (
                    <>
                      <div className="border-t border-zinc-100 my-1 dark:border-zinc-800" />
                      <Link
                        href="/admin/users"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-purple-700 hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-950/40"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Admin Users
                      </Link>
                      <Link
                        href="/admin/boards"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-purple-700 hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-950/40"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        All Boards
                      </Link>
                    </>
                  )}
                </div>

                <div className="border-t border-zinc-100 py-1 dark:border-zinc-800">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleSignOut();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
