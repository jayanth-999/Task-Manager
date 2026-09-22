-- Migration: 00003_subtasks_relationship.sql
-- Ensures Supabase/PostgREST can resolve tasks -> subtasks(*) queries.

CREATE TABLE IF NOT EXISTS public.subtasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users access own subtasks" ON public.subtasks;
CREATE POLICY "Users access own subtasks"
ON public.subtasks
FOR ALL
USING (auth.uid() = user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'subtasks_task_id_fkey'
      AND conrelid = 'public.subtasks'::regclass
  ) THEN
    ALTER TABLE public.subtasks
      ADD CONSTRAINT subtasks_task_id_fkey
      FOREIGN KEY (task_id)
      REFERENCES public.tasks(id)
      ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_subtasks_task_id
ON public.subtasks (task_id)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_subtasks_user_id
ON public.subtasks (user_id)
WHERE deleted_at IS NULL;

-- Ask PostgREST to reload its relationship cache immediately.
NOTIFY pgrst, 'reload schema';
