'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, History, UserCog, ShieldCheck } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navigation = [
    { name: 'Analyze Ingredients', href: '/analyze', icon: ShieldCheck },
    { name: 'Analysis History', href: '/history', icon: History },
    { name: 'Skincare Profile', href: '/profile', icon: UserCog },
  ];

  return (
    <aside className="w-64 border-r border-zinc-200 bg-white h-[calc(100vh-73px)] sticky top-[73px] hidden md:block">
      <nav className="p-4 space-y-1.5 flex flex-col justify-between h-full pb-8">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-zinc-650 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-indigo-700' : 'text-zinc-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </div>
        
        {/* Decorative micro-card */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-2 mt-auto">
          <div className="flex items-center gap-1.5 text-indigo-650 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            AI Guard Activated
          </div>
          <p className="text-xs text-zinc-500 leading-normal">
            Your custom skin profile is automatically parsed by safety research agents.
          </p>
        </div>
      </nav>
    </aside>
  );
}
