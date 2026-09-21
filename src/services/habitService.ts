import { SyncEngine } from './syncEngine';
import { supabase, isCloudConfigured } from './supabaseClient';
import type { Habit, HabitLog } from '../types';
import { calculateActiveStreak } from './dateUtils';
import { throwIfSupabaseError } from './supabaseResult';
import { createId } from './idUtils';

export const DEFAULT_HABITS: Habit[] = [
  {
    id: 'habit-1',
    user_id: 'guest-local-user',
    name: 'Morning Workout & Hydration',
    frequency: 'daily',
    target_count_per_period: 1,
    current_streak: 0,
    longest_streak: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'habit-2',
    user_id: 'guest-local-user',
    name: '1-Hour Tech Learning (DevOps + AI)',
    frequency: 'daily',
    target_count_per_period: 1,
    current_streak: 0,
    longest_streak: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'habit-3',
    user_id: 'guest-local-user',
    name: '10-15 Min Market & Financial Study',
    frequency: 'daily',
    target_count_per_period: 1,
    current_streak: 0,
    longest_streak: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function normalizeHabitKey(name: string): string {
  const lower = (name || '').toLowerCase().trim();
  if (lower.includes('workout') || lower.includes('fitness')) return 'standard-workout';
  if (lower.includes('tech learning') || (lower.includes('devops') && lower.includes('ai'))) return 'standard-learning';
  if (lower.includes('investment') || lower.includes('market') || lower.includes('financial')) return 'standard-investment';
  return lower;
}

export class HabitService {
  static async getHabits(userId: string, includeArchived: boolean = false): Promise<Habit[]> {
    let rawHabits: Habit[] = [];

    if (!isCloudConfigured || userId === 'guest-local-user') {
      rawHabits = await SyncEngine.getLocalItems<Habit>('habits', userId);
    } else {
      const { data, error } = await supabase.from('habits').select('*').eq('user_id', userId).is('deleted_at', null);
      if (error) {
        rawHabits = await SyncEngine.getLocalItems<Habit>('habits', userId);
      } else {
        rawHabits = data ?? [];
      }
    }

    // If user has no habits at all, seed the 3 default non-negotiable habits
    if (rawHabits.length === 0) {
      const now = new Date().toISOString();
      const initialHabits: Habit[] = [
        {
          id: createId(),
          user_id: userId,
          name: 'Morning Workout & Hydration',
          frequency: 'daily',
          target_count_per_period: 1,
          current_streak: 0,
          longest_streak: 0,
          created_at: now,
          updated_at: now,
        },
        {
          id: createId(),
          user_id: userId,
          name: '1-Hour Tech Learning (DevOps + AI)',
          frequency: 'daily',
          target_count_per_period: 1,
          current_streak: 0,
          longest_streak: 0,
          created_at: now,
          updated_at: now,
        },
        {
          id: createId(),
          user_id: userId,
          name: '10-15 Min Market & Financial Study',
          frequency: 'daily',
          target_count_per_period: 1,
          current_streak: 0,
          longest_streak: 0,
          created_at: now,
          updated_at: now,
        },
      ];
      for (const h of initialHabits) {
        await SyncEngine.saveLocalItem('habits', h);
      }
      rawHabits = initialHabits;
    }

    // Deduplicate habits by normalized key
    const seen = new Map<string, Habit>();
    const duplicateMap = new Map<string, string>(); // duplicateId -> primaryId

    for (const habit of rawHabits) {
      const key = normalizeHabitKey(habit.name);
      if (!seen.has(key)) {
        seen.set(key, { ...habit });
      } else {
        const primary = seen.get(key)!;
        duplicateMap.set(habit.id, primary.id);
        if ((habit.current_streak || 0) > (primary.current_streak || 0)) {
          primary.current_streak = habit.current_streak;
        }
        if ((habit.longest_streak || 0) > (primary.longest_streak || 0)) {
          primary.longest_streak = habit.longest_streak;
        }
      }
    }

    // Clean up duplicate records from storage and merge their completion logs
    if (duplicateMap.size > 0) {
      const allLogs = await this.getHabitLogs(userId);
      for (const log of allLogs) {
        if (duplicateMap.has(log.habit_id)) {
          const primaryId = duplicateMap.get(log.habit_id)!;
          const alreadyLogged = allLogs.some(l => l.habit_id === primaryId && l.completed_date === log.completed_date);
          if (!alreadyLogged) {
            log.habit_id = primaryId;
            await SyncEngine.saveLocalItem('habit_logs', log);
          } else {
            await SyncEngine.deleteLocalItem('habit_logs' as any, log.id);
          }
        }
      }

      for (const dupId of duplicateMap.keys()) {
        await SyncEngine.deleteLocalItem('habits', dupId);
        if (isCloudConfigured && userId !== 'guest-local-user') {
          try {
            const res = await supabase.from('habits').delete().eq('id', dupId).eq('user_id', userId);
            throwIfSupabaseError(res);
          } catch (err) {
            console.warn('Queued habit dedup delete for sync:', err);
          }
        }
      }
    }

    // Attach deduplicated logs and calculate fresh streaks
    const logs = await this.getHabitLogs(userId);
    const uniqueHabits = Array.from(seen.values());

    const mapped = uniqueHabits.map(h => {
      const habitLogs = logs.filter(l => l.habit_id === h.id);
      const dateMap = new Map<string, HabitLog>();
      for (const l of habitLogs) {
        if (!dateMap.has(l.completed_date)) {
          dateMap.set(l.completed_date, l);
        }
      }
      const dedupedLogs = Array.from(dateMap.values());
      const streak = calculateActiveStreak(dedupedLogs.map(l => l.completed_date));

      return {
        ...h,
        current_streak: streak,
        longest_streak: Math.max(h.longest_streak || 0, streak),
        logs: dedupedLogs,
      };
    });

    return includeArchived ? mapped : mapped.filter(h => !h.archived_at);
  }

  static async archiveHabit(userId: string, habitId: string): Promise<void> {
    const habit = await SyncEngine.getLocalItem<Habit>('habits', habitId);
    if (habit && habit.user_id === userId) {
      habit.archived_at = new Date().toISOString();
      habit.updated_at = new Date().toISOString();
      await SyncEngine.saveLocalItem('habits', habit, 'UPDATE');
      if (isCloudConfigured && userId !== 'guest-local-user') {
        try {
          const res = await supabase.from('habits').update({ archived_at: habit.archived_at, updated_at: habit.updated_at }).eq('id', habitId).eq('user_id', userId);
          throwIfSupabaseError(res);
        } catch (e) {
          console.warn('Queued archive habit for sync:', e);
        }
      }
    }
  }

  static async unarchiveHabit(userId: string, habitId: string): Promise<void> {
    const habit = await SyncEngine.getLocalItem<Habit>('habits', habitId);
    if (habit && habit.user_id === userId) {
      delete habit.archived_at;
      habit.updated_at = new Date().toISOString();
      await SyncEngine.saveLocalItem('habits', habit, 'UPDATE');
      if (isCloudConfigured && userId !== 'guest-local-user') {
        try {
          const res = await supabase.from('habits').update({ archived_at: null, updated_at: habit.updated_at }).eq('id', habitId).eq('user_id', userId);
          throwIfSupabaseError(res);
        } catch (e) {
          console.warn('Queued unarchive habit for sync:', e);
        }
      }
    }
  }

  static async getHabitLogs(userId: string): Promise<HabitLog[]> {
    if (!isCloudConfigured || userId === 'guest-local-user') {
      return SyncEngine.getLocalItems<HabitLog>('habit_logs', userId);
    }
    const { data, error } = await supabase.from('habit_logs').select('*').eq('user_id', userId);
    return error ? SyncEngine.getLocalItems<HabitLog>('habit_logs', userId) : (data ?? []);
  }

  static async createHabit(userId: string, name: string, frequency: 'daily' | 'weekly' = 'daily', targetCount: number = 1): Promise<Habit> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Habit name cannot be empty');

    const existingHabits = await this.getHabits(userId, true);
    const key = normalizeHabitKey(trimmed);
    const existing = existingHabits.find(h => normalizeHabitKey(h.name) === key);
    if (existing) {
      if (existing.archived_at) {
        await this.unarchiveHabit(userId, existing.id);
      }
      return existing;
    }

    const newHabit: Habit = {
      id: createId(),
      user_id: userId,
      name: trimmed,
      frequency,
      target_count_per_period: targetCount,
      current_streak: 0,
      longest_streak: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await SyncEngine.saveLocalItem('habits', newHabit);

    if (isCloudConfigured && userId !== 'guest-local-user') {
      try {
        throwIfSupabaseError(await supabase.from('habits').insert(newHabit));
      } catch (err) {
        console.warn('Queued habit in sync engine:', err);
      }
    }

    return newHabit;
  }

  static async toggleHabitForDate(userId: string, habitId: string, targetDate: string): Promise<boolean> {
    const logs = await this.getHabitLogs(userId);
    const existingLog = logs.find(l => l.habit_id === habitId && l.completed_date === targetDate);

    if (existingLog) {
      // Remove completion log
      await SyncEngine.deleteLocalItem('habit_logs' as any, existingLog.id);
      if (isCloudConfigured && userId !== 'guest-local-user') {
        throwIfSupabaseError(await supabase.from('habit_logs').delete().eq('id', existingLog.id).eq('user_id', userId));
      }
      await this.recalculateStreak(userId, habitId);
      return false;
    } else {
      // Add completion log
      const newLog: HabitLog = {
        id: createId(),
        habit_id: habitId,
        user_id: userId,
        completed_date: targetDate,
        created_at: new Date().toISOString(),
      };
      await SyncEngine.saveLocalItem('habit_logs', newLog);
      if (isCloudConfigured && userId !== 'guest-local-user') {
        throwIfSupabaseError(await supabase.from('habit_logs').insert(newLog));
      }
      await this.recalculateStreak(userId, habitId);
      return true;
    }
  }

  static async recalculateStreak(userId: string, habitId: string): Promise<number> {
    const logs = await this.getHabitLogs(userId);
    const completedDates = logs
      .filter(l => l.habit_id === habitId)
      .map(l => l.completed_date)
    const streak = calculateActiveStreak(completedDates);

    const habits = await this.getHabits(userId);
    const target = habits.find(h => h.id === habitId);
    if (target) {
      target.current_streak = streak;
      if (streak > target.longest_streak) {
        target.longest_streak = streak;
      }
      target.updated_at = new Date().toISOString();
      await SyncEngine.saveLocalItem('habits', target);
      if (isCloudConfigured && userId !== 'guest-local-user') {
        throwIfSupabaseError(await supabase.from('habits').update({ current_streak: target.current_streak, longest_streak: target.longest_streak }).eq('id', habitId).eq('user_id', userId));
      }
    }

    return streak;
  }

  static async deleteHabit(userId: string, habitId: string): Promise<void> {
    await SyncEngine.deleteLocalItem('habits', habitId);
    if (isCloudConfigured && userId !== 'guest-local-user') {
      throwIfSupabaseError(await supabase.from('habits').update({ deleted_at: new Date().toISOString() }).eq('id', habitId).eq('user_id', userId));
    }
  }
}
