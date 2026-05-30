// ============================================
// HUNTLO SALES OS — UI STORE
// ============================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUIStore = create(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      commandCenterOpen: false,
      activeNotifications: 3,
      theme: 'dark',

      toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      openCommandCenter: () => set({ commandCenterOpen: true }),
      closeCommandCenter: () => set({ commandCenterOpen: false }),
      toggleCommandCenter: () => set(state => ({ commandCenterOpen: !state.commandCenterOpen })),
      clearNotifications: () => set({ activeNotifications: 0 }),
      toggleTheme: () => set(state => {
        const newTheme = state.theme === 'dark' ? 'light' : 'dark';
        if (newTheme === 'light') {
          document.documentElement.classList.add('light-mode');
        } else {
          document.documentElement.classList.remove('light-mode');
        }
        return { theme: newTheme };
      }),
    }),
    { name: 'huntlo-ui', partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed, theme: s.theme }) }
  )
);

export default useUIStore;
