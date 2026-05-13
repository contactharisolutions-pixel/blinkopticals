import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  isSidebarOpen: boolean
  currentModule: string
  currentShowroom: string | null
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setCurrentModule: (module: string) => void
  setCurrentShowroom: (showroom: string | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isSidebarOpen: true,
      currentModule: 'dashboard',
      currentShowroom: null,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      setCurrentModule: (module) => set({ currentModule: module }),
      setCurrentShowroom: (showroom) => {
        set({ currentShowroom: showroom });
        if (showroom) sessionStorage.setItem('global_showroom', showroom);
        else sessionStorage.removeItem('global_showroom');
      },
    }),
    {
      name: 'blink-app-storage',
    }
  )
)
