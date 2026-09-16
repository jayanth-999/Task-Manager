import { createClient } from '@supabase/supabase-js';

// Environment variables or fallback default placeholders for Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo-apex-productivity.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

