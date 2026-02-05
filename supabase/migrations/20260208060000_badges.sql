-- Gamification: badges and user_badges.

CREATE TABLE IF NOT EXISTS public.badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  criteria TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read badges" ON public.badges;
CREATE POLICY "Anyone can read badges"
  ON public.badges FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can read own user_badges" ON public.user_badges;
CREATE POLICY "Users can read own user_badges"
  ON public.user_badges FOR SELECT
  USING (true);

-- Seed default badges
INSERT INTO public.badges (id, name, description, criteria) VALUES
  ('first_week', 'First week done', 'Complete your first roadmap week', 'week_complete'),
  ('streak_7', '7-day streak', 'Study 7 days in a row', 'streak_7'),
  ('streak_30', '30-day streak', 'Study 30 days in a row', 'streak_30'),
  ('group_member', 'Study buddy', 'Join a study group', 'join_group'),
  ('early_bird', 'Early bird', 'Log study activity before 9 AM', 'study_before_9am')
ON CONFLICT (id) DO NOTHING;
