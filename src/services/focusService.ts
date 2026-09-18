import { SyncEngine } from './syncEngine';
import { supabase, isCloudConfigured } from './supabaseClient';
import type { FocusSession } from '../types';
import { throwIfSupabaseError } from './supabaseResult';
import { getLocalDateString } from './dateUtils';

export function calculateElapsedFocusMinutes(startedAt: Date, completedAt = new Date()): number {
  return Math.max(1, Math.round((completedAt.getTime() - startedAt.getTime()) / 60_000));
}

export class FocusService {
  static async getFocusSessions(userId: string): Promise<FocusSession[]> {
    if (!isCloudConfigured || userId === 'guest-local-user') {
      return SyncEngine.getLocalItems<FocusSession>('focus_sessions', userId);
    }

    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (error) {
      console.warn('Falling back to local focus sessions:', error);
      return SyncEngine.getLocalItems<FocusSession>('focus_sessions', userId);
    }
    return data || [];
  }

  static async logFocusSession(
    userId: string,
    durationMinutes: number,
    taskId?: string,
    completedAt = new Date(),
    notes?: string
  ): Promise<FocusSession> {
    const session: FocusSession = {
      id: crypto.randomUUID(),
      user_id: userId,
      task_id: taskId,
      duration_minutes: durationMinutes,
      started_at: new Date(completedAt.getTime() - durationMinutes * 60 * 1000).toISOString(),
      completed_at: completedAt.toISOString(),
      notes: notes?.trim() || undefined,
    };

    await SyncEngine.saveLocalItem('focus_sessions', session);

    if (isCloudConfigured && userId !== 'guest-local-user') {
      try {
        throwIfSupabaseError(await supabase.from('focus_sessions').insert(session));
      } catch (err) {
        console.warn('Failed cloud save for focus session, queued in syncEngine:', err);
      }
    }

    return session;
  }

  static calculateFocusStats(sessions: FocusSession[]): { todayMinutes: number; weekMinutes: number; totalSessions: number } {
    const todayStr = getLocalDateString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    let todayMinutes = 0;
    let weekMinutes = 0;

    sessions.forEach(s => {
      const sessionDate = s.completed_at ? s.completed_at.split('T')[0] : s.started_at.split('T')[0];
      const sessionTime = new Date(s.started_at);

      if (sessionDate === todayStr) {
        todayMinutes += s.duration_minutes;
      }
      if (sessionTime >= sevenDaysAgo) {
        weekMinutes += s.duration_minutes;
      }
    });

    return {
      todayMinutes,
      weekMinutes,
      totalSessions: sessions.length,
    };
  }
}
