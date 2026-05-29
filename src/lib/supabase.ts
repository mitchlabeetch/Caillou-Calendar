import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http')) {
    console.warn("Valid Supabase credentials not found. App will run in local-only mode.");
    return null;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
};

export const signInWithGoogle = () => {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase client not initialized");
  return sb.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: 'https://www.googleapis.com/auth/calendar.events'
    }
  });
};

export const signOut = () => {
  const sb = getSupabase();
  if (!sb) return Promise.resolve();
  return sb.auth.signOut();
};
