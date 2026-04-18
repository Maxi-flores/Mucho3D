import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SidebarState, Toast } from '@/types'

interface UIState {
  // Sidebar
  sidebarState: SidebarState
  toggleSidebar: () => void
  setSidebarState: (state: SidebarState) => void

  // Command Palette
  isCommandPaletteOpen: boolean
  openCommandPalette: () => void
  closeCommandPalette: () => void
  toggleCommandPalette: () => void

  // Modals
  activeModal: string | null
  openModal: (modalId: string) => void
  closeModal: () => void

  // Toasts
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void

  // Theme (for future light mode support)
  theme: 'dark' | 'light'
  setTheme: (theme: 'dark' | 'light') => void

  // Loading states
  isLoading: boolean
  setIsLoading: (isLoading: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Sidebar
      sidebarState: 'expanded',
      toggleSidebar: () =>
        set((state) => ({
          sidebarState: state.sidebarState === 'expanded' ? 'collapsed' : 'expanded',
        })),
      setSidebarState: (sidebarState) => set({ sidebarState }),

      // Command Palette
      isCommandPaletteOpen: false,
      openCommandPalette: () => set({ isCommandPaletteOpen: true }),
      closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
      toggleCommandPalette: () =>
        set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),

      // Modals
      activeModal: null,
      openModal: (modalId) => set({ activeModal: modalId }),
      closeModal: () => set({ activeModal: null }),

      // Toasts
      toasts: [],
      addToast: (toast) =>
        set((state) => ({
          toasts: [
            ...state.toasts,
            {
              ...toast,
              id: `${Date.now()}-${Math.random()}`,
            },
          ],
        })),
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        })),

      // Theme
      theme: 'dark',
      setTheme: (theme) => set({ theme }),

      // Loading
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'mucho3d-ui-storage',
      partialize: (state) => ({
        sidebarState: state.sidebarState,
        theme: state.theme,
      }),
    }
  )
)
