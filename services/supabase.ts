
import { createClient } from '@supabase/supabase-js';

// Helper to get env vars in both Vite and Node environments
const getEnv = (key: string) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ FATAL: Supabase Keys Missing!", { supabaseUrl, supabaseKey });
  throw new Error("Supabase Keys Missing. Check .env or .env.local");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: (url, options) => {
      return fetch(url, { ...options, signal: AbortSignal.timeout(10000) }); // 10s timeout
    }
  }
});

export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseKey;
};
