-- Migration 00001: Apex Productivity Master Database Schema

-- Auto-update updated_at Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  shift_preset TEXT DEFAULT '2PM_11PM',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own profile" ON public.profiles;
CREATE POLICY "Users access own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

-- 2. Roadmap Templates Table (Versioned)
CREATE TABLE IF NOT EXISTS public.roadmap_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users, -- NULL for system templates
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  duration_months INT DEFAULT 4,
  version INT DEFAULT 1,
  structure JSONB NOT NULL,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.roadmap_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access system or own templates" ON public.roadmap_templates;
CREATE POLICY "Users access system or own templates" ON public.roadmap_templates
  FOR SELECT USING (is_system = TRUE OR auth.uid() = user_id);

-- 3. Roadmaps Table
CREATE TABLE IF NOT EXISTS public.roadmaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  template_id UUID REFERENCES public.roadmap_templates(id) ON DELETE SET NULL,
  template_version INT DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT,
  goal TEXT,
  category TEXT DEFAULT 'Career',
  duration_months INT DEFAULT 4,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')) DEFAULT 'active',
  is_primary BOOLEAN DEFAULT FALSE,
  color_code TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own roadmaps" ON public.roadmaps;
CREATE POLICY "Users access own roadmaps" ON public.roadmaps FOR ALL USING (auth.uid() = user_id);

-- 4. Roadmap Phases Table
CREATE TABLE IF NOT EXISTS public.roadmap_phases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  roadmap_id UUID REFERENCES public.roadmaps(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  phase_order INT NOT NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
ALTER TABLE public.roadmap_phases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own phases" ON public.roadmap_phases;
CREATE POLICY "Users access own phases" ON public.roadmap_phases FOR ALL USING (auth.uid() = user_id);

-- 5. Roadmap Milestones Table
CREATE TABLE IF NOT EXISTS public.roadmap_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id UUID REFERENCES public.roadmap_phases(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  status TEXT DEFAULT 'pending',
  completion_percentage INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
ALTER TABLE public.roadmap_milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own milestones" ON public.roadmap_milestones;
CREATE POLICY "Users access own milestones" ON public.roadmap_milestones FOR ALL USING (auth.uid() = user_id);

-- 6. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own projects" ON public.projects;
CREATE POLICY "Users access own projects" ON public.projects FOR ALL USING (auth.uid() = user_id);

-- 7. Master Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  milestone_id UUID REFERENCES public.roadmap_milestones(id) ON DELETE SET NULL,
  parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  is_exception BOOLEAN DEFAULT FALSE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('todo', 'in_progress', 'blocked', 'completed', 'archived', 'trash')) DEFAULT 'todo',
  priority TEXT CHECK (priority IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  due_date DATE,
  due_time TIME,
  estimated_minutes INT DEFAULT 30,
  location TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,
  recurrence_exceptions DATE[],
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  version INT DEFAULT 1
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own tasks" ON public.tasks;
CREATE POLICY "Users access own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks (user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_user_due ON public.tasks (user_id, due_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_milestone ON public.tasks (milestone_id) WHERE milestone_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_sync ON public.tasks (user_id, updated_at);

-- 8. Task Dependencies Table
CREATE TABLE IF NOT EXISTS public.task_dependencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  blocking_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  blocked_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, blocking_task_id, blocked_task_id)
);
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own dependencies" ON public.task_dependencies;
CREATE POLICY "Users access own dependencies" ON public.task_dependencies FOR ALL USING (auth.uid() = user_id);

-- 9. Subtasks Table
CREATE TABLE IF NOT EXISTS public.subtasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own subtasks" ON public.subtasks;
CREATE POLICY "Users access own subtasks" ON public.subtasks FOR ALL USING (auth.uid() = user_id);

-- 10. Habits Table & Habit Logs
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly_days', 'interval')) DEFAULT 'daily',
  target_count_per_period INT DEFAULT 1,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE (user_id, name)
);
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own habits" ON public.habits;
CREATE POLICY "Users access own habits" ON public.habits FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.habit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  completed_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own habit logs" ON public.habit_logs;
CREATE POLICY "Users access own habit logs" ON public.habit_logs FOR ALL USING (auth.uid() = user_id);

-- 11. Tech Learning Logs Table
CREATE TABLE IF NOT EXISTS public.learning_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  topic_ai TEXT,
  topic_devops TEXT,
  duration_minutes INT DEFAULT 60,
  log_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.learning_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own learning logs" ON public.learning_logs;
CREATE POLICY "Users access own learning logs" ON public.learning_logs FOR ALL USING (auth.uid() = user_id);

-- 12. Fitness & Workout Schemas
CREATE TABLE IF NOT EXISTS public.workout_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  mode TEXT CHECK (mode IN ('home', 'gym')) DEFAULT 'home',
  exercises JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own workout templates" ON public.workout_templates;
CREATE POLICY "Users access own workout templates" ON public.workout_templates FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.workout_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL,
  mode TEXT CHECK (mode IN ('home', 'gym')) DEFAULT 'home',
  completed_date DATE NOT NULL,
  duration_minutes INT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own workout logs" ON public.workout_logs;
CREATE POLICY "Users access own workout logs" ON public.workout_logs FOR ALL USING (auth.uid() = user_id);

-- 13. Meal Planning & Structured Recipes
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  instructions TEXT,
  category TEXT DEFAULT 'Quick Healthy',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own recipes" ON public.recipes;
CREATE POLICY "Users access own recipes" ON public.recipes FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own recipe ingredients" ON public.recipe_ingredients;
CREATE POLICY "Users access own recipe ingredients" ON public.recipe_ingredients FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.meal_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  plan_date DATE NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')) DEFAULT 'lunch',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own meal plans" ON public.meal_plans;
CREATE POLICY "Users access own meal plans" ON public.meal_plans FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.grocery_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  quantity TEXT,
  is_purchased BOOLEAN DEFAULT FALSE,
  target_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own grocery items" ON public.grocery_items;
CREATE POLICY "Users access own grocery items" ON public.grocery_items FOR ALL USING (auth.uid() = user_id);

-- 14. Notes Table
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  roadmap_id UUID REFERENCES public.roadmaps(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own notes" ON public.notes;
CREATE POLICY "Users access own notes" ON public.notes FOR ALL USING (auth.uid() = user_id);

-- 15. Pomodoro Focus Sessions Table
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  duration_minutes INT DEFAULT 25,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own focus sessions" ON public.focus_sessions;
CREATE POLICY "Users access own focus sessions" ON public.focus_sessions FOR ALL USING (auth.uid() = user_id);

-- 16. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  trigger_at TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own notifications" ON public.notifications;
CREATE POLICY "Users access own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- 17. Attachments Table
CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own attachments" ON public.attachments;
CREATE POLICY "Users access own attachments" ON public.attachments FOR ALL USING (auth.uid() = user_id);

