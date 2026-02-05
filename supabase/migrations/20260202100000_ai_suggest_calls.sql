-- Track AI task-suggestion API calls per user per day (for free-tier rate limiting).

CREATE TABLE public.ai_suggest_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_ai_suggest_calls_user_created ON public.ai_suggest_calls(user_id, created_at DESC);

ALTER TABLE public.ai_suggest_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_suggest_calls_insert_own ON public.ai_suggest_calls FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY ai_suggest_calls_select_own ON public.ai_suggest_calls FOR SELECT USING (auth.uid() = user_id);
