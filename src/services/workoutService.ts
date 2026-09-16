import type { WorkoutMode, WorkoutTemplate } from '../types';

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'wt-home',
    user_id: 'system',
    title: 'Home Bodyweight & Core Routine (Non-Gym Days)',
    mode: 'home',
    created_at: new Date().toISOString(),
    exercises: [
      { name: 'Standard Push-Ups', sets: 3, reps: '15-20 reps' },
      { name: 'Bodyweight Squats', sets: 4, reps: '20 reps' },
      { name: 'Walking Lunges', sets: 3, reps: '12 reps / leg' },
      { name: 'Plank Hold', sets: 3, reps: '60 seconds' },
      { name: 'Mountain Climbers', sets: 3, reps: '45 seconds' },
    ],
  },
  {
    id: 'wt-gym',
    user_id: 'system',
    title: 'Gym Basic Equipment Workout (Gym Days)',
    mode: 'gym',
    created_at: new Date().toISOString(),
    exercises: [
      { name: 'Barbell / Dumbbell Bench Press', sets: 4, reps: '8-12 reps', equipment: 'Bench & Weights' },
      { name: 'Lat Pulldown / Cable Rows', sets: 4, reps: '10-12 reps', equipment: 'Cable Machine' },
      { name: 'Dumbbell Shoulder Press', sets: 3, reps: '10 reps', equipment: 'Dumbbells' },
      { name: 'Leg Press / Squat Rack', sets: 4, reps: '10-12 reps', equipment: 'Leg Press Machine' },
      { name: 'Triceps Rope Pushdowns', sets: 3, reps: '12 reps', equipment: 'Cable Machine' },
    ],
  },
];

export const DIET_GUIDE = {
  pre_workout: {
    title: 'Morning Pre-Workout Energizing Bite (7:00 AM)',
    items: [
      '1 Banana + 5 Almonds',
      'Or 1 slice Whole Wheat Toast with Peanut Butter',
      'Or Black Coffee / Warm Lemon Honey Water',
    ],
  },
  post_workout: {
    title: 'Post-Workout High-Protein Recovery Breakfast (8:30 AM)',
    items: [
      '3 Boiled Eggs (or 100g Sautéed Paneer / Tofu)',
      'Or Whey Protein Shake + Oats Bowl',
      'Or Sprouted Moong Salad with Lemon & Pomegranate',
    ],
  },
};

export class WorkoutService {
  static getWorkoutTemplate(mode: WorkoutMode): WorkoutTemplate {
    return WORKOUT_TEMPLATES.find(t => t.mode === mode) || WORKOUT_TEMPLATES[0];
  }
}

