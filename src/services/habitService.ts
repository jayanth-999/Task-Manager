import { supabase } from './supabaseClient';
import type { Habit } from '../types';

export class HabitService {
  static async getHabits(userId: string): Promise<Habit[]> {
    if (userId === 'guest-local-user') {
      const raw = localStorage.getItem('apex_habits');
      if (!raw) {
        const defaults: Habit[] = [
          { id: 'h1', user_id: userId, name: 'Morning Fitness / Workout', frequency: 'daily', target_count_per_period: 1, current_streak: 5, longest_streak: 12, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'h2', user_id: userId, name: '1-Hour Tech Learning (DevOps + AI)', frequency: 'daily', target_count_per_period: 1, current_streak: 7, longest_streak: 14, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'h3', user_id: userId, name: '10-15 Min Morning Investment Study', frequency: 'daily', target_count_per_period: 1, current_streak: 3, longest_streak: 8, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ];
        localStorage.setItem('apex_habits', JSON.stringify(defaults));
        return defaults;
      }
      return JSON.parse(raw);
    }

    const { data } = await supabase.from('habits').select('*').eq('user_id', userId).is('deleted_at', null);
    return data || [];
  }

  static async logHabitCompletion(userId: string, habitId: string): Promise<number> {
    const habits = await this.getHabits(userId);
    const target = habits.find(h => h.id === habitId);
    if (!target) return 0;

    target.current_streak += 1;
    if (target.current_streak > target.longest_streak) {
      target.longest_streak = target.current_streak;
    }

    if (userId === 'guest-local-user') {
      localStorage.setItem('apex_habits', JSON.stringify(habits));
      return target.current_streak;
    }

    await supabase.from('habits').update({ current_streak: target.current_streak, longest_streak: target.longest_streak }).eq('id', habitId);
    return target.current_streak;
  }
}
