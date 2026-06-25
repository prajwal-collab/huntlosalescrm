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
      newLeadOpen: false,
      activeNotifications: 0,
      notifications: [], // array of notification objects
      theme: 'light', // Hardcoded to light

      toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      openCommandCenter: () => set({ commandCenterOpen: true }),
      closeCommandCenter: () => set({ commandCenterOpen: false }),
      toggleCommandCenter: () => set(state => ({ commandCenterOpen: !state.commandCenterOpen })),
      openNewLead: () => set({ newLeadOpen: true }),
      closeNewLead: () => set({ newLeadOpen: false }),
      
      addNotification: (notif) => set(state => {
        // Prevent exact duplicates by ID
        if (state.notifications.some(n => n.id === notif.id)) return state;
        const newNotifs = [{ ...notif, time: notif.time || new Date().toISOString() }, ...state.notifications].slice(0, 60); // keep last 60
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

      deleteNotification: (id) => set(state => {
        const updated = state.notifications.filter(n => n.id !== id);
        return { notifications: updated, activeNotifications: updated.filter(n => n.unread).length };
      }),

      clearNotifications: () => set({ notifications: [], activeNotifications: 0 }),

      // Toggle theme does nothing now as we are locking to light
      toggleTheme: () => {}, 
    }),
    { 
      name: 'huntlo-ui', 
      partialize: (s) => ({ 
        sidebarCollapsed: s.sidebarCollapsed, 
        theme: 'light',
        notifications: s.notifications.slice(0, 30), // persist last 30 notifications
      }) 
    }
  )
);

export default useUIStore;
