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
          let msg = err.message;
          if (msg === 'Invalid login credentials') {
            msg = 'Incorrect email or password. Please try again.';
          } else if (msg.includes('Email not confirmed')) {
            msg = 'Your email is not yet confirmed. Please check your inbox or contact support.';
          } else if (msg.includes('rate limit') || msg.includes('too many requests')) {
            msg = 'Too many login attempts. Please wait a moment and try again.';
          }
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

          // If email confirmation is disabled, Supabase returns a session immediately
          if (data.session) {
            set({ user: data.user, session: data.session, loading: false });
            return { success: true, needsConfirmation: false };
          }

          set({ loading: false });
          return { success: true, needsConfirmation: true };
        } catch (err) {
          let msg = err.message;
          // Provide user-friendly messages for common Supabase auth errors
          if (msg.includes('Error sending confirmation email') || msg.includes('Error sending confirmation')) {
            msg = 'Unable to send confirmation email. Please try again in a few minutes, or contact support.';
          } else if (msg.includes('User already registered') || msg.includes('already been registered')) {
            msg = 'An account with this email already exists. Please sign in instead.';
          } else if (msg.includes('rate limit') || msg.includes('too many requests')) {
            msg = 'Too many sign-up attempts. Please wait a moment and try again.';
          } else if (msg.includes('Password should be at least')) {
            msg = 'Password must be at least 6 characters long.';
          }
          set({ error: msg, loading: false });
          return { success: false, error: msg };
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
        if (error) {
          let msg = error.message;
          if (msg.includes('Error sending recovery email') || msg.includes('rate limit')) {
            msg = 'Email rate limit reached (max 3 per hour on Supabase free tier). Please configure a custom SMTP provider in your Supabase Auth settings, or wait an hour.';
          }
          return { success: false, error: msg };
        }
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

      // Update profile metadata and/or password
      updateProfile: async ({ fullName, password }) => {
        set({ loading: true, error: null });
        try {
          const updates = {};
          if (password) {
            updates.password = password;
          }
          if (fullName) {
            updates.data = { full_name: fullName };
          }

          let updatedUser = get().user;

          if (Object.keys(updates).length > 0) {
            const { data, error } = await supabase.auth.updateUser(updates);
            if (error) throw error;
            updatedUser = data.user;
          }

          if (fullName && updatedUser) {
            const { error: profileError } = await supabase
              .from('profiles')
              .update({ full_name: fullName })
              .eq('id', updatedUser.id);
            if (profileError) {
              console.warn('[AuthStore] Failed to update public.profiles:', profileError.message);
            }
          }

          set({ user: updatedUser, loading: false });
          return { success: true };
        } catch (err) {
          set({ error: err.message, loading: false });
          return { success: false, error: err.message };
        }
      },

      fetchTeam: async () => {
        const u = get().user;
        
        // Auto-upgrade prajwal to Admin in DB if needed (best effort)
        if (u && u.email === 'prajwal@earlyjobs.in') {
          supabase.from('profiles').update({ role: 'Admin' }).eq('id', u.id).then();
        }

        try {
          const [profilesRes, invitesRes] = await Promise.all([
            supabase.from('profiles').select('*'),
            supabase.from('invitations').select('*')
          ]);

          if (profilesRes.error) throw profilesRes.error;
          if (invitesRes.error) throw invitesRes.error;

          let team = [
            ...(profilesRes.data || []).map(m => ({ 
                ...m, 
                type: 'member', 
                status: 'active', 
                name: m.full_name || m.email || 'Unknown User', 
                initials: (m.full_name || m.email || '?').substring(0, 2).toUpperCase(),
                color: '#3b82f6' 
            })),
            ...(invitesRes.data || []).map(i => ({ 
                ...i, 
                type: 'invite', 
                name: i.email.split('@')[0], 
                status: 'invited', 
                initials: i.email.substring(0, 2).toUpperCase(),
                color: '#f59e0b' 
            }))
          ];

          // Ensure current user is always visible in the list, even if DB query misses them
          if (u && !team.some(m => m.id === u.id)) {
             team.push({
                id: u.id,
                email: u.email,
                name: u.user_metadata?.full_name || u.email || 'You',
                role: u.email === 'prajwal@earlyjobs.in' ? 'Admin' : 'Member',
                status: 'active',
                type: 'member',
                initials: (u.email || '?').substring(0, 2).toUpperCase(),
                color: '#3b82f6'
             });
          }

          // Force prajwal to show as Admin in UI
          team = team.map(m => {
            if (m.email === 'prajwal@earlyjobs.in') {
              return { ...m, role: 'Admin' };
            }
            return m;
          });

          set({ team });
        } catch (err) {
          console.warn('[AuthStore] Failed to fetch team from Supabase, falling back:', err.message);
          if (u) {
            set({ team: [{
                id: u.id,
                email: u.email,
                name: u.user_metadata?.full_name || u.email || 'You',
                role: u.email === 'prajwal@earlyjobs.in' ? 'Admin' : 'Member',
                status: 'active',
                type: 'member',
                initials: (u.email || '?').substring(0, 2).toUpperCase(),
                color: '#3b82f6'
            }] });
          } else {
            set({ team: [] });
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
          const { data: profileData, error: profileErr } = await supabase.from('profiles').delete().eq('id', memberId).select();
          if (profileErr) throw profileErr;

          const { data: inviteData, error: inviteErr } = await supabase.from('invitations').delete().eq('id', memberId).select();
          if (inviteErr) throw inviteErr;

          const affectedProfiles = profileData ? profileData.length : 0;
          const affectedInvites = inviteData ? inviteData.length : 0;
          if (affectedProfiles === 0 && affectedInvites === 0) {
            throw new Error('Member not found or permission denied (RLS policy violation).');
          }

          await get().fetchTeam();
        } catch (err) {
          console.warn('[AuthStore] removeMember database call failed, falling back to local state:', err.message);
          set(state => ({ team: state.team.filter(m => m.id !== memberId) }));
          throw err;
        }
      },

      updateMemberRole: async (memberId, role) => {
        try {
          const { data: profileData, error: profileErr } = await supabase.from('profiles').update({ role }).eq('id', memberId).select();
          if (profileErr) throw profileErr;

          const { data: inviteData, error: inviteErr } = await supabase.from('invitations').update({ role }).eq('id', memberId).select();
          if (inviteErr) throw inviteErr;

          const affectedProfiles = profileData ? profileData.length : 0;
          const affectedInvites = inviteData ? inviteData.length : 0;
          if (affectedProfiles === 0 && affectedInvites === 0) {
            throw new Error('Member not found or permission denied (RLS policy violation).');
          }

          await get().fetchTeam();
        } catch (err) {
          console.warn('[AuthStore] updateMemberRole database call failed, falling back to local state:', err.message);
          set(state => ({
            team: state.team.map(m => m.id === memberId ? { ...m, role } : m)
          }));
          throw err;
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
