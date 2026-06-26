'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="border-b border-zinc-200 bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold text-indigo-950 tracking-tight">Cosmix</span>
        </div>
        
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="relative h-10 w-10 rounded-full hover:bg-zinc-100 transition-colors outline-none cursor-pointer flex items-center justify-center">
              <Avatar className="h-10 w-10 border border-zinc-200 shadow-sm">
                <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold text-sm">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2 border border-zinc-200 shadow-md">
              <div className="px-3 py-2 text-sm text-zinc-500 italic">
                Signed in as
                <p className="font-semibold text-zinc-700 not-italic truncate">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer py-2 hover:bg-zinc-50">
                <User className="mr-2 h-4 w-4 text-zinc-500" />
                <span>My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/history')} className="cursor-pointer py-2 hover:bg-zinc-50">
                <Settings className="mr-2 h-4 w-4 text-zinc-500" />
                <span>Analysis History</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer py-2 text-red-600 focus:bg-red-50 focus:text-red-700">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
