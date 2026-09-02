import React from 'react';
import { SaveStatus } from '@/types/database';
import { Cloud, CloudOff, Loader2, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SaveStatusBadgeProps {
  status: SaveStatus;
  className?: string;
}

export function SaveStatusBadge({ status, className }: SaveStatusBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all select-none',
        status === 'saved' &&
          'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
        status === 'saving' &&
          'bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60',
        status === 'offline' &&
          'bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
        status === 'error' &&
          'bg-red-50 text-red-700 border border-red-200/80 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/60',
        className
      )}
    >
      {status === 'saved' && (
        <>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Saved</span>
        </>
      )}

      {status === 'saving' && (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-indigo-600 dark:text-indigo-400" />
          <span>Saving…</span>
        </>
      )}

      {status === 'offline' && (
        <>
          <CloudOff className="w-3 h-3 text-amber-600" />
          <span>Offline</span>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertCircle className="w-3 h-3 text-red-600" />
          <span>Save failed</span>
        </>
      )}
    </div>
  );
}
