-- Conversion events table for funnel analysis
CREATE TABLE IF NOT EXISTS public.conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversion_type TEXT NOT NULL CHECK (conversion_type IN ('signup', 'subscription', 'roadmap_generated', 'course_completed', 'quiz_completed', 'chat_message', 'custom')),
  funnel_stage TEXT NOT NULL,
  value DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  metadata JSONB DEFAULT '{}',
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conversion_events_user_id ON public.conversion_events(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_conversion_type ON public.conversion_events(conversion_type);
CREATE INDEX IF NOT EXISTS idx_conversion_events_created_at ON public.conversion_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversion_events_funnel_stage ON public.conversion_events(funnel_stage);
CREATE INDEX IF NOT EXISTS idx_conversion_events_session_id ON public.conversion_events(session_id) WHERE session_id IS NOT NULL;
