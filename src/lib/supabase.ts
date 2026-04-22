import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (supabaseInstance) return supabaseInstance;

  // @ts-ignore
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  // @ts-ignore
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your secrets in the AI Studio settings.');
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
};
