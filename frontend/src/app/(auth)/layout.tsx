import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-indigo-50/30 px-4">
      <div className="w-full py-12">
        {children}
      </div>
    </div>
  );
}
