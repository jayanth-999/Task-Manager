// Apex Productivity Master Domain Models & Types

export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'completed' | 'archived' | 'trash';
export type RoadmapStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type HabitFrequency = 'daily' | 'weekly_days' | 'interval';
export type WorkoutMode = 'home' | 'gym';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  shift_preset: '2PM_11PM' | '9AM_5PM' | 'CUSTOM';
  timezone: string;
  created_at: string;
  updated_at: string;
  work_start?: string;
  work_end?: string;
  selected_goals?: string[];
  onboarding_completed?: boolean;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  color?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Task {
  id: string;
  user_id: string;
  project_id?: string;
  milestone_id?: string;
  parent_task_id?: string;
  is_exception?: boolean;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  scheduled_start?: string;
  scheduled_end?: string;
  due_at?: string;
  due_date?: string; // YYYY-MM-DD
  due_time?: string; // HH:mm
  estimated_minutes?: number;
  location?: string;
  category?: 'routine' | 'work' | 'learning' | 'fitness' | 'cooking' | 'leisure' | 'errands' | 'general';
  is_recurring?: boolean;
  recurrence_rule?: string;
  recurrence_exceptions?: string[];
  completed_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  version: number;
  is_rolled_over?: boolean;
  source_date?: string;
  // Dynamic UI joins
  subtasks?: Subtask[];
  blocking_tasks?: string[];
}

export interface Subtask {
  id: string;
  task_id: string;
  user_id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface TaskDependency {
  id: string;
  user_id: string;
  blocking_task_id: string;
  blocked_task_id: string;
  created_at: string;
}

export interface Roadmap {
  id: string;
  user_id: string;
  template_id?: string;
  template_key?: string;
  template_version: number;
  title: string;
  description?: string;
  goal?: string;
  category: string;
  duration_months: number;
  start_date: string;
  end_date: string;
  status: RoadmapStatus;
  is_primary: boolean;
  color_code: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  completed_at?: string;
  phases?: RoadmapPhase[];
}

export interface RoadmapPhase {
  id: string;
  roadmap_id: string;
  user_id: string;
  title: string;
  description?: string;
  phase_order: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  milestones?: RoadmapMilestone[];
}

export interface RoadmapMilestone {
  id: string;
  phase_id: string;
  user_id: string;
  title: string;
  description?: string;
  target_date?: string;
  status: string;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  tasks?: Task[];
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  frequency: HabitFrequency;
  target_count_per_period: number;
  current_streak: number;
  longest_streak: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  logs?: HabitLog[];
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  completed_date: string; // YYYY-MM-DD
  created_at: string;
}

export interface LearningLog {
  id: string;
  user_id: string;
  topic_ai?: string;
  topic_devops?: string;
  duration_minutes: number;
  log_date: string; // YYYY-MM-DD
  notes?: string;
  created_at: string;
}

export interface WorkoutTemplate {
  id: string;
  user_id: string;
  title: string;
  mode: WorkoutMode;
  exercises: Array<{
    name: string;
    sets: number;
    reps: string;
    equipment?: string;
  }>;
  created_at: string;
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  template_id?: string;
  mode: WorkoutMode;
  completed_date: string;
  duration_minutes?: number;
  notes?: string;
  created_at: string;
}

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  instructions?: string;
  category: string;
  created_at: string;
  ingredients?: RecipeIngredient[];
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  user_id: string;
  name: string;
  quantity: number;
  unit: string;
  created_at: string;
}

export interface MealPlan {
  id: string;
  user_id: string;
  recipe_id: string;
  plan_date: string;
  meal_type: MealType;
  created_at: string;
  recipe?: Recipe;
}

export interface GroceryItem {
  id: string;
  user_id: string;
  name: string;
  quantity?: string;
  is_purchased: boolean;
  target_date?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Note {
  id: string;
  user_id: string;
  task_id?: string;
  project_id?: string;
  roadmap_id?: string;
  title: string;
  content: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  task_id?: string;
  duration_minutes: number;
  started_at: string;
  completed_at?: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  trigger_at: string;
  type: string;
  payload: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

