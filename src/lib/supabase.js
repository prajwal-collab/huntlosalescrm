// ============================================
// HUNTLO SALES OS — SUPABASE CLIENT (Production)
// ============================================
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Detect if properly configured (not empty, not placeholder)
export const isConfigured = !!(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co')
);

if (!isConfigured) {
  console.warn(
    '[Huntlo] Supabase not configured. Add VITE_SUPABASE_URL and ' +
    'VITE_SUPABASE_ANON_KEY to your .env file and restart the dev server.'
  );
}

// Create client — uses placeholders if unconfigured so app doesn't crash at import
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
