// ============================================
// HUNTLO SALES OS — UI STORE
// ============================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Immediately force light mode on load
if (typeof document !== 'undefined') {
  document.documentElement.classList.add('light-mode');
}

const useUIStore = create(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      commandCenterOpen: false,
      activeNotifications: 0,
      theme: 'light', // Hardcoded to light

      toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      openCommandCenter: () => set({ commandCenterOpen: true }),
      closeCommandCenter: () => set({ commandCenterOpen: false }),
      toggleCommandCenter: () => set(state => ({ commandCenterOpen: !state.commandCenterOpen })),
      clearNotifications: () => set({ activeNotifications: 0 }),
      // Toggle theme does nothing now as we are locking to light
      toggleTheme: () => {}, 
    }),
    { name: 'huntlo-ui', partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed, theme: 'light' }) }
  )
);

export default useUIStore;
