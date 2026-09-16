import { supabase } from './supabaseClient';
import { SyncEngine } from './syncEngine';
import type { UserProfile } from '../types';

export const GUEST_USER_ID = 'guest-local-user';

export const GUEST_PROFILE: UserProfile = {
  id: GUEST_USER_ID,
  email: 'guest@apex-productivity.local',
  full_name: 'Guest User',
  shift_preset: '2PM_11PM',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export class AuthService {
  // Get active user profile
  static async getCurrentUser(): Promise<UserProfile> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return GUEST_PROFILE;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    return profile || {
      id: session.user.id,
      email: session.user.email || '',
      full_name: session.user.user_metadata?.full_name || 'Apex User',
      shift_preset: '2PM_11PM',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // Sign up with Email/Password
  static async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) throw error;

    if (data.user) {
      // Create user profile
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
        shift_preset: '2PM_11PM',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      });
      // Migrate guest data to cloud
      await SyncEngine.migrateGuestDataToAccount(data.user.id);
    }
    return data;
  }

  // Sign in with Email/Password
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      await SyncEngine.migrateGuestDataToAccount(data.user.id);
    }
    return data;
  }

  // Sign out
  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Sign out error:', error);
  }
}

