-- Study activity: one row per activity (week complete or study session). Streak = consecutive calendar days with at least one activity.
CREATE TABLE IF NOT EXISTS public.study_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('week_complete', 'study_session')),
  roadmap_week_id UUID REFERENCES public.roadmap_weeks(id) ON DELETE SET NULL,
  study_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_study_activity_user_date ON public.study_activity(user_id, activity_date DESC);

-- Cached streak per user (recomputed when activity is recorded).
CREATE TABLE IF NOT EXISTS public.study_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- RLS: users can only read/insert their own activity; read own streak.
ALTER TABLE public.study_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own study_activity" ON public.study_activity;
CREATE POLICY "Users can read own study_activity"
  ON public.study_activity FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own study_activity" ON public.study_activity;
CREATE POLICY "Users can insert own study_activity"
  ON public.study_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own study_streaks" ON public.study_streaks;
CREATE POLICY "Users can read own study_streaks"
  ON public.study_streaks FOR SELECT
  USING (auth.uid() = user_id);

-- Service role (Edge Function) can insert/update study_activity and study_streaks for any user.
-- No INSERT policy for study_streaks for client; backend updates it.
