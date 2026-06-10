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
          // The page will redirect to Google
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

      inviteMember: async (invite) => {
        const { data, error } = await supabase.from('invitations').insert({
          email: invite.email,
          role: invite.role,
          token: invite.token,
        }).select().single();
        if (error) throw error;
        await get().fetchTeam();
        return data;
      },

      removeMember: async (memberId) => {
        // Try deleting from profiles or invitations (one of them will match the ID)
        await supabase.from('profiles').delete().eq('id', memberId);
        await supabase.from('invitations').delete().eq('id', memberId);
        await get().fetchTeam();
      },

      updateMemberRole: async (memberId, role) => {
        // Try updating profiles or invitations
        await supabase.from('profiles').update({ role }).eq('id', memberId);
        await supabase.from('invitations').update({ role }).eq('id', memberId);
        await get().fetchTeam();
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
