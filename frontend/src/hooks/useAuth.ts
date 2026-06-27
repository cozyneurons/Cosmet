import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, loginWithGoogle, logout, checkAuth } = useAuthStore();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  return {
    user,
    isAuthenticated,
    isLoading,
    loginWithGoogle,
    logout,
  };
};
