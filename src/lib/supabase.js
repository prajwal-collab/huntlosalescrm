// ============================================
// HUNTLO SALES OS — SUPABASE CLIENT (Production)
// ============================================
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Detect if properly configured
export const isConfigured = !!(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co') &&
  supabaseAnonKey !== 'REPLACE_WITH_YOUR_ANON_KEY' &&
  supabaseAnonKey.length > 20
);

if (!isConfigured) {
  console.warn('[Huntlo] Supabase not fully configured. Check your .env file.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'huntlo-auth-token',
    },
  }
);
