import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isTestEnvironment = import.meta.env.MODE === 'test';

export const isCloudConfigured = Boolean(
  !isTestEnvironment &&
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('demo-apex-productivity') &&
  !supabaseAnonKey.includes('demo-anon-key')
);

// Fallback dummy client if not configured so imports don't crash in local mode
export const supabase = isCloudConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
