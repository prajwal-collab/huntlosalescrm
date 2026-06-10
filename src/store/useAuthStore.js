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

          if (session?.provider_token && session?.user) {
            supabase.from('user_google_credentials').upsert({
              user_id: session.user.id,
              access_token: session.provider_token,
              refresh_token: session.provider_refresh_token || null,
              expires_at: new Date(Date.now() + (session.expires_in || 3600) * 1000).toISOString()
            }).then(({ error }) => {
              if (error) console.error('Failed to sync google credentials on init:', error);
            });
          }

          supabase.auth.onAuthStateChange((_event, session) => {
            set({ session, user: session?.user ?? null });
            if (session?.provider_token && session?.user) {
              supabase.from('user_google_credentials').upsert({
                user_id: session.user.id,
                access_token: session.provider_token,
                refresh_token: session.provider_refresh_token || null,
                expires_at: new Date(Date.now() + (session.expires_in || 3600) * 1000).toISOString()
              }).then(({ error }) => {
                if (error) console.error('Failed to sync google credentials on state change:', error);
              });
            }
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
      signUp: async (email, password, fullName, metadata = {}) => {
        set({ error: null, loading: true });
        if (!isConfigured) {
          set({ error: 'Supabase is not configured. Please complete setup first.', loading: false });
          return { success: false };
        }
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { 
              data: { 
                full_name: fullName,
                ...metadata
              } 
            },
          });
          if (error) throw error;
          set({ loading: false });
          return { success: true, needsConfirmation: !data.session };
        } catch (err) {
          set({ error: err.message, loading: false });
          return { success: false, error: err.message };
        }
      },

      // Link Google Workspace
      linkGoogle: async () => {
        set({ error: null, loading: true });
        if (!isConfigured) {
          set({ error: 'Supabase is not configured.', loading: false });
          return { success: false };
        }
        try {
          const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${appUrl}/settings?tab=integrations`,
              scopes: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.send',
              queryParams: {
                access_type: 'offline',
                prompt: 'consent',
              }
            }
          });
          if (error) throw error;
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
        try {
          const { data, error } = await supabase.from('team_members').select('*');
          if (error) throw error;
          if (data) set({ team: data });
        } catch (err) {
          console.warn('[AuthStore] Failed to fetch team from Supabase, maintaining local state:', err.message);
          const currentTeam = get().team;
          if (!currentTeam || currentTeam.length === 0) {
            set({
              team: [
                { id: 'u1', name: 'Alex Reid', email: 'alex.reid@earlyjobs.in', role: 'Admin', status: 'active', initials: 'AR', color: '#3b82f6' },
                { id: 'u2', name: 'Sarah Connor', email: 'sarah@earlyjobs.in', role: 'Member', status: 'active', initials: 'SC', color: '#8b5cf6' },
                { id: 'u3', name: 'John Doe', email: 'john@earlyjobs.in', role: 'Member', status: 'invited', initials: 'JD', color: '#f59e0b' }
              ]
            });
          }
        }
      },

      inviteMember: async (invite) => {
        const token = invite.token || Math.random().toString(36).substring(2);
        try {
          const { data, error } = await supabase.from('invitations').insert({
            email: invite.email,
            role: invite.role,
            token: token,
          }).select().single();
          if (error) throw error;
          await get().fetchTeam();
          return data;
        } catch (err) {
          console.warn('[AuthStore] inviteMember database insert failed, falling back to local state:', err.message);
          const newInvite = {
            id: `inv-${Date.now()}`,
            name: invite.email.split('@')[0],
            email: invite.email,
            role: invite.role,
            status: 'invited',
            initials: invite.email.substring(0, 2).toUpperCase(),
            color: '#f59e0b',
            token: token
          };
          set(state => ({ team: [...state.team, newInvite] }));
          return newInvite;
        }
      },

      removeMember: async (memberId) => {
        try {
          await supabase.from('profiles').delete().eq('id', memberId);
          await supabase.from('invitations').delete().eq('id', memberId);
          await get().fetchTeam();
        } catch (err) {
          console.warn('[AuthStore] removeMember database call failed, falling back to local state:', err.message);
          set(state => ({ team: state.team.filter(m => m.id !== memberId) }));
        }
      },

      updateMemberRole: async (memberId, role) => {
        try {
          await supabase.from('profiles').update({ role }).eq('id', memberId);
          await supabase.from('invitations').update({ role }).eq('id', memberId);
          await get().fetchTeam();
        } catch (err) {
          console.warn('[AuthStore] updateMemberRole database call failed, falling back to local state:', err.message);
          set(state => ({
            team: state.team.map(m => m.id === memberId ? { ...m, role } : m)
          }));
        }
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
