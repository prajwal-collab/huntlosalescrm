// ============================================
// HUNTLO SALES OS — AUTH STORE (Supabase)
// ============================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Demo user for when Supabase isn't configured
const DEMO_USER = {
  id: 'demo-user-1',
  email: 'alex.reid@huntlo.io',
  user_metadata: { full_name: 'Alex Reid', avatar_color: '#3b82f6' },
};

const DEMO_TEAM = [
  { id: 'u1', name: 'Alex Reid', email: 'alex.reid@huntlo.io', role: 'Admin', initials: 'AR', color: '#3b82f6', status: 'active', joinedAt: '2026-01-15' },
  { id: 'u2', name: 'Sarah Kim', email: 'sarah.kim@huntlo.io', role: 'Member', initials: 'SK', color: '#8b5cf6', status: 'active', joinedAt: '2026-01-20' },
  { id: 'u3', name: 'James Park', email: 'james.park@huntlo.io', role: 'Member', initials: 'JP', color: '#22c55e', status: 'active', joinedAt: '2026-02-01' },
  { id: 'u4', name: 'Priya Nair', email: 'priya.nair@huntlo.io', role: 'Viewer', initials: 'PN', color: '#f59e0b', status: 'invited', joinedAt: '' },
];

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,
      error: null,
      team: DEMO_TEAM,
      pendingInvites: [],
      isDemo: false,

      // Initialize auth state
      initialize: async () => {
        if (!isSupabaseConfigured()) {
          set({ loading: false, isDemo: true });
          return;
        }
        try {
          const { data: { session } } = await supabase.auth.getSession();
          set({ session, user: session?.user ?? null, loading: false });

          supabase.auth.onAuthStateChange((_event, session) => {
            set({ session, user: session?.user ?? null });
          });
        } catch (err) {
          set({ loading: false, isDemo: true });
        }
      },

      // Sign in with email/password
      signIn: async (email, password) => {
        set({ error: null, loading: true });

        // Demo mode: accept any credentials
        if (!isSupabaseConfigured()) {
          await new Promise(r => setTimeout(r, 800));
          const demoU = { ...DEMO_USER, email };
          set({ user: demoU, session: { user: demoU }, loading: false, isDemo: true });
          return { success: true };
        }

        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          set({ user: data.user, session: data.session, loading: false });
          return { success: true };
        } catch (err) {
          set({ error: err.message, loading: false });
          return { success: false, error: err.message };
        }
      },

      // Sign up new user
      signUp: async (email, password, fullName) => {
        set({ error: null, loading: true });

        if (!isSupabaseConfigured()) {
          await new Promise(r => setTimeout(r, 800));
          const newUser = { ...DEMO_USER, email, user_metadata: { full_name: fullName, avatar_color: '#3b82f6' } };
          set({ user: newUser, session: { user: newUser }, loading: false, isDemo: true });
          return { success: true };
        }

        try {
          const { data, error } = await supabase.auth.signUp({
            email, password,
            options: { data: { full_name: fullName } },
          });
          if (error) throw error;
          set({ loading: false });
          return { success: true, needsConfirmation: !data.session };
        } catch (err) {
          set({ error: err.message, loading: false });
          return { success: false, error: err.message };
        }
      },

      // Sign out
      signOut: async () => {
        if (!isSupabaseConfigured()) {
          set({ user: null, session: null, isDemo: false });
          return;
        }
        await supabase.auth.signOut();
        set({ user: null, session: null });
      },

      // Reset password
      resetPassword: async (email) => {
        if (!isSupabaseConfigured()) {
          return { success: true, demo: true };
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) return { success: false, error: error.message };
        return { success: true };
      },

      // Update password (used after clicking reset link)
      updatePassword: async (newPassword) => {
        if (!isSupabaseConfigured()) {
          return { success: true, demo: true };
        }
        set({ loading: true });
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        });
        set({ loading: false });
        if (error) return { success: false, error: error.message };
        return { success: true };
      },

      // Add team member (invite)
      inviteMember: (invite) => {
        const newMember = {
          id: `u${Date.now()}`,
          name: invite.name || invite.email.split('@')[0],
          email: invite.email,
          role: invite.role,
          initials: (invite.name || invite.email).slice(0, 2).toUpperCase(),
          color: ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ec4899'][Math.floor(Math.random() * 5)],
          status: 'invited',
          joinedAt: '',
        };
        set(state => ({ team: [...state.team, newMember] }));
        return newMember;
      },

      // Remove team member
      removeMember: (memberId) => {
        set(state => ({ team: state.team.filter(m => m.id !== memberId) }));
      },

      // Update member role
      updateMemberRole: (memberId, role) => {
        set(state => ({
          team: state.team.map(m => m.id === memberId ? { ...m, role } : m)
        }));
      },

      clearError: () => set({ error: null }),

      // Helpers
      get currentUser() {
        const { user, isDemo } = get();
        if (isDemo && !user) return DEMO_USER;
        return user;
      },
    }),
    {
      name: 'huntlo-auth',
      partialize: (state) => ({ user: state.user, session: state.session, isDemo: state.isDemo }),
    }
  )
);

export default useAuthStore;
