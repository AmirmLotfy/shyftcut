-- User events tracking table for analytics and user journey analysis
CREATE TABLE IF NOT EXISTS public.user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'click', 'conversion', 'custom')),
  event_name TEXT NOT NULL,
  page_path TEXT NOT NULL,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
  browser TEXT,
  country TEXT,
  session_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON public.user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_event_type ON public.user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_events_created_at ON public.user_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_session_id ON public.user_events(session_id);
CREATE INDEX IF NOT EXISTS idx_user_events_page_path ON public.user_events(page_path);
CREATE INDEX IF NOT EXISTS idx_user_events_utm_source ON public.user_events(utm_source) WHERE utm_source IS NOT NULL;
