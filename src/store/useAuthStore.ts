import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setUser: (user: User | null, token?: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user, token = null) => 
        set({ 
          user, 
          token: token || null, 
          isAuthenticated: !!user 
        }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'blink-auth-storage',
    }
  )
)
