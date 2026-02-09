-- Cost optimization: Add tables for tracking search usage and caching course URLs

-- Chat search usage tracking (for rate limiting free users)
CREATE TABLE IF NOT EXISTS public.chat_search_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_search_usage_user_id ON public.chat_search_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_search_usage_used_at ON public.chat_search_usage(user_id, used_at DESC);

-- Course URL cache (to avoid redundant API calls for same platform+query)
CREATE TABLE IF NOT EXISTS public.course_url_cache (
    platform TEXT NOT NULL,
    query TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'en',
    url TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    PRIMARY KEY (platform, query, language)
);

CREATE INDEX IF NOT EXISTS idx_course_url_cache_platform_query ON public.course_url_cache(platform, query, language);
