
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
      // SMART TIMEOUT: 60s for Storage (Uploads), 20s for DB (Safety)
      const isStorage = url.toString().includes('/storage/v1/');
      const timeout = isStorage ? 60000 : 20000;
      return fetch(url, { ...options, signal: AbortSignal.timeout(timeout) });
    }
  }
});

export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseKey;
};
