-- Migration: 00002_schema_fixes.sql
-- Description: Adds missing columns and converts scheduled time columns to TIME type for cloud compatibility.

-- 1. Tasks table enhancements
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS source_date DATE;

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS is_rolled_over BOOLEAN DEFAULT FALSE;

-- Convert scheduled_start and scheduled_end from TIMESTAMPTZ to TIME to match local client model ("HH:mm")
ALTER TABLE public.tasks
ALTER COLUMN scheduled_start TYPE TIME
USING scheduled_start::time;

ALTER TABLE public.tasks
ALTER COLUMN scheduled_end TYPE TIME
USING scheduled_end::time;

-- Index on category for filtering
CREATE INDEX IF NOT EXISTS idx_tasks_user_category ON public.tasks (user_id, category) WHERE deleted_at IS NULL;

-- 2. Roadmaps table enhancements
ALTER TABLE public.roadmaps
ADD COLUMN IF NOT EXISTS template_key TEXT;

-- Drop foreign key constraint on template_id to support custom & string built-in templates
ALTER TABLE public.roadmaps
DROP CONSTRAINT IF EXISTS roadmaps_template_id_fkey;

-- Allow string template IDs in template_id as well
ALTER TABLE public.roadmaps
ALTER COLUMN template_id TYPE TEXT
USING template_id::text;

ALTER TABLE public.roadmaps
ALTER COLUMN template_id DROP NOT NULL;

-- 3. Profiles table personalization enhancements
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS work_start TIME DEFAULT '09:00';

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS work_end TIME DEFAULT '17:00';

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS selected_goals TEXT[] DEFAULT '{}';

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- 4. Auto-update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tasks_updated_at ON public.tasks;
CREATE TRIGGER trigger_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_roadmaps_updated_at ON public.roadmaps;
CREATE TRIGGER trigger_roadmaps_updated_at
BEFORE UPDATE ON public.roadmaps
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Habits table enhancements
ALTER TABLE public.habits
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

-- 6. Focus sessions table enhancements
ALTER TABLE public.focus_sessions
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 7. Tasks milestone_id flexibility for offline-first syncing
ALTER TABLE public.tasks
DROP CONSTRAINT IF EXISTS tasks_milestone_id_fkey;

ALTER TABLE public.tasks
ALTER COLUMN milestone_id TYPE TEXT
USING milestone_id::text;

