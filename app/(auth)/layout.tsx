import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-6">
        {children}
      </div>
    </div>
  );
}
