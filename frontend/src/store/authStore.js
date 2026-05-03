import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      
      login: (userData, token, refreshToken) => {
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', refreshToken);
        set({ 
          user: userData, 
          accessToken: token, 
          isAuthenticated: true 
        });
      },

      logout: () => {
        localStorage.clear();
        set({ 
          user: null, 
          accessToken: null, 
          isAuthenticated: false 
        });
      },

      setUser: (userData) => set({ user: userData }),
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
    }
  )
);
