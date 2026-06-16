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
      notifications: [], // array of notification objects
      theme: 'light', // Hardcoded to light

      toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      openCommandCenter: () => set({ commandCenterOpen: true }),
      closeCommandCenter: () => set({ commandCenterOpen: false }),
      toggleCommandCenter: () => set(state => ({ commandCenterOpen: !state.commandCenterOpen })),
      
      addNotification: (notif) => set(state => {
        // Prevent exact duplicates
        if (state.notifications.some(n => n.id === notif.id)) return state;
        const newNotifs = [notif, ...state.notifications].slice(0, 50); // keep last 50
        const unreadCount = newNotifs.filter(n => n.unread).length;
        return { notifications: newNotifs, activeNotifications: unreadCount };
      }),
      
      markNotificationRead: (id) => set(state => {
        const updated = state.notifications.map(n => n.id === id ? { ...n, unread: false } : n);
        return { notifications: updated, activeNotifications: updated.filter(n => n.unread).length };
      }),

      markAllNotificationsRead: () => set(state => ({
        notifications: state.notifications.map(n => ({ ...n, unread: false })),
        activeNotifications: 0
      })),

      clearNotifications: () => set({ activeNotifications: 0 }),
      // Toggle theme does nothing now as we are locking to light
      toggleTheme: () => {}, 
    }),
    { name: 'huntlo-ui', partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed, theme: 'light' }) }
  )
);

export default useUIStore;
