-- Admin insights cache table for weekly AI-generated insights
CREATE TABLE IF NOT EXISTS public.admin_insights_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL UNIQUE,
  insights JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_insights_cache_week_start ON public.admin_insights_cache(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_admin_insights_cache_expires_at ON public.admin_insights_cache(expires_at);

-- Function to clean up expired cache entries (optional, can be called via cron)
CREATE OR REPLACE FUNCTION public.cleanup_expired_insights_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.admin_insights_cache
  WHERE expires_at < now();
END;
$$;
