-- Track AI avatar generations per user (limit 3 per month for paid users).
CREATE TABLE IF NOT EXISTS public.avatar_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_avatar_generations_user_created ON public.avatar_generations(user_id, created_at DESC);

ALTER TABLE public.avatar_generations ENABLE ROW LEVEL SECURITY;

-- No policies: only service role (Edge Function) should access this table; clients do not.
COMMENT ON TABLE public.avatar_generations IS 'One row per AI-generated avatar; used to enforce 3/month for premium.';
