-- CV & Job Recommendations: profile fields and job_recommendations table.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS job_work_preference TEXT CHECK (job_work_preference IN ('remote', 'hybrid', 'on_site')),
  ADD COLUMN IF NOT EXISTS find_jobs_enabled BOOLEAN DEFAULT false NOT NULL;

CREATE TABLE IF NOT EXISTS public.job_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  company TEXT,
  url TEXT NOT NULL,
  location_type TEXT,
  location TEXT,
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  source TEXT DEFAULT 'gemini_grounding',
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_job_recommendations_user_id ON public.job_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_job_recommendations_user_fetched ON public.job_recommendations(user_id, fetched_at DESC);
