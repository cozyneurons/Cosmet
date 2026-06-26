import { create } from 'zustand';
import { User } from '@/types/auth';
import { authUtils } from '@/lib/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: typeof window !== 'undefined' ? authUtils.getUser() : null,
  isAuthenticated: typeof window !== 'undefined' ? authUtils.isAuthenticated() : false,
  isLoading: false,
  
  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth/login`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Login failed');
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
  
  register: async (data: any) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Registration failed');
      }
      
      const user = await response.json();
      
      // Auto-login after registration
      const formData = new FormData();
      formData.append('username', data.email);
      formData.append('password', data.password);
      
      const loginRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth/login`, {
        method: 'POST',
        body: formData,
      });
      
      if (loginRes.ok) {
        const loginData = await loginRes.json();
        authUtils.setTokens(loginData.access_token, loginData.refresh_token);
        authUtils.setUser(loginData.user);
        set({ user: loginData.user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: user, isAuthenticated: false, isLoading: false });
      }
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
