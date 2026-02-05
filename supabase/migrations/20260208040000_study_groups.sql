-- Study groups (paid community): groups and members.

CREATE TABLE IF NOT EXISTS public.study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  roadmap_id UUID REFERENCES public.roadmaps(id) ON DELETE SET NULL,
  target_career TEXT,
  experience_level TEXT,
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_study_groups_target_career ON public.study_groups(target_career);
CREATE INDEX IF NOT EXISTS idx_study_groups_experience_level ON public.study_groups(experience_level);
CREATE INDEX IF NOT EXISTS idx_study_groups_created_by ON public.study_groups(created_by_user_id);

ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read study_groups" ON public.study_groups;
CREATE POLICY "Users can read study_groups"
  ON public.study_groups FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Paid users can insert study_groups" ON public.study_groups;
CREATE POLICY "Paid users can insert study_groups"
  ON public.study_groups FOR INSERT
  WITH CHECK (auth.uid() = created_by_user_id);

DROP POLICY IF EXISTS "Creator can update own study_groups" ON public.study_groups;
CREATE POLICY "Creator can update own study_groups"
  ON public.study_groups FOR UPDATE
  USING (auth.uid() = created_by_user_id)
  WITH CHECK (auth.uid() = created_by_user_id);

DROP POLICY IF EXISTS "Creator can delete own study_groups" ON public.study_groups;
CREATE POLICY "Creator can delete own study_groups"
  ON public.study_groups FOR DELETE
  USING (auth.uid() = created_by_user_id);

-- Members
CREATE TABLE IF NOT EXISTS public.study_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_study_group_members_group_id ON public.study_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_user_id ON public.study_group_members(user_id);

ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read study_group_members" ON public.study_group_members;
CREATE POLICY "Users can read study_group_members"
  ON public.study_group_members FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can join study_group_members" ON public.study_group_members;
CREATE POLICY "Users can join study_group_members"
  ON public.study_group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave or admin can remove" ON public.study_group_members;
CREATE POLICY "Users can leave or admin can remove"
  ON public.study_group_members FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.study_groups g
      WHERE g.id = study_group_members.group_id AND g.created_by_user_id = auth.uid()
    )
  );
