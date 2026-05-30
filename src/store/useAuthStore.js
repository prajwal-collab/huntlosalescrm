// ============================================
// HUNTLO SALES OS — AUTH STORE (Production)
// ============================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, isConfigured } from '../lib/supabase';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,
      error: null,
      team: [],
      pendingInvites: [],

      // Initialize auth state from Supabase session
      initialize: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          set({ session, user: session?.user ?? null, loading: false });

          supabase.auth.onAuthStateChange((_event, session) => {
            set({ session, user: session?.user ?? null });
          });
        } catch (err) {
          console.error('[Auth] Initialize error:', err);
          set({ loading: false });
        }
      },

      // Sign in with email + password
      signIn: async (email, password) => {
        set({ error: null, loading: true });
        if (!isConfigured) {
          set({ error: 'Supabase is not configured. Please complete setup first.', loading: false });
          return { success: false };
        }
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          set({ user: data.user, session: data.session, loading: false });
          return { success: true };
        } catch (err) {
          const msg = err.message === 'Invalid login credentials'
            ? 'Incorrect email or password. Please try again.'
            : err.message;
          set({ error: msg, loading: false });
          return { success: false, error: msg };
        }
      },

      // Sign up new user
      signUp: async (email, password, fullName) => {
        set({ error: null, loading: true });
        if (!isConfigured) {
          set({ error: 'Supabase is not configured. Please complete setup first.', loading: false });
          return { success: false };
        }
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
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
        if (isConfigured) await supabase.auth.signOut();
        set({ user: null, session: null });
      },

      // Send password reset email
      resetPassword: async (email) => {
        if (!isConfigured) return { success: false, error: 'Supabase not configured.' };
        const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${appUrl}/reset-password`,
        });
        if (error) return { success: false, error: error.message };
        return { success: true };
      },

      // Update password after reset link click
      updatePassword: async (newPassword) => {
        set({ loading: true });
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        set({ loading: false });
        if (error) return { success: false, error: error.message };
        return { success: true };
      },

      // Team management
      fetchTeam: async () => {
        const { data, error } = await supabase.from('team_members').select('*');
        if (!error && data) set({ team: data });
      },

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

      removeMember: (memberId) => {
        set(state => ({ team: state.team.filter(m => m.id !== memberId) }));
      },

      updateMemberRole: (memberId, role) => {
        set(state => ({
          team: state.team.map(m => m.id === memberId ? { ...m, role } : m)
        }));
      },

      clearError: () => set({ error: null }),

      get currentUser() {
        return get().user;
      },
    }),
    {
      name: 'huntlo-auth',
      partialize: (state) => ({ user: state.user, session: state.session }),
    }
  )
);

export default useAuthStore;
