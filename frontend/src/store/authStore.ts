import { create } from 'zustand';
import { User } from '@/types/auth';
import { authUtils } from '@/lib/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: typeof window !== 'undefined' ? authUtils.getUser() : null,
  isAuthenticated: typeof window !== 'undefined' ? authUtils.isAuthenticated() : false,
  isLoading: false,
  
  loginWithGoogle: async (credential: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Google Login failed');
      }
      
      const data = await response.json();
      authUtils.setTokens(data.access_token, data.refresh_token);
      authUtils.setUser(data.user);
      
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  logout: () => {
    authUtils.clearTokens();
    set({ user: null, isAuthenticated: false });
  },
  
  checkAuth: () => {
    const user = authUtils.getUser();
    const isAuth = authUtils.isAuthenticated();
    set({ user, isAuthenticated: isAuth });
  },
}));
