import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Error: Missing Supabase Environment Variables!\n" +
    "Please make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment (e.g., Netlify Environment Variables)."
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url-please-set-env-vars.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

