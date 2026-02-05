-- Supabase schema. Run in Supabase SQL editor.
-- No public.users: auth.users (Supabase Auth) is source of truth. user_id = auth.uid().

-- Subscription tier enum
CREATE TYPE public.subscription_tier AS ENUM ('free', 'premium', 'pro');

-- Profiles: user_id = auth.users.id. email stored for Polar/Resend lookups.
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    job_title TEXT,
    target_career TEXT,
    experience_level TEXT,
    industry TEXT,
    skills TEXT[] DEFAULT '{}',
    learning_style TEXT,
    weekly_hours INTEGER DEFAULT 10,
    budget TEXT,
    preferred_language TEXT DEFAULT 'en',
    onboarding_completed BOOLEAN DEFAULT false,
    location TEXT,
    job_work_preference TEXT CHECK (job_work_preference IN ('remote', 'hybrid', 'on_site')),
    find_jobs_enabled BOOLEAN DEFAULT false NOT NULL,
    linkedin_url TEXT,
    twitter_url TEXT,
    github_url TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Job recommendations (paid: find jobs for me, weekly 10)
CREATE TABLE public.job_recommendations (
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
CREATE INDEX idx_job_recommendations_user_id ON public.job_recommendations(user_id);
CREATE INDEX idx_job_recommendations_user_fetched ON public.job_recommendations(user_id, fetched_at DESC);

-- Subscriptions table
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    tier subscription_tier DEFAULT 'free' NOT NULL,
    polar_customer_id TEXT,
    polar_subscription_id TEXT,
    status TEXT DEFAULT 'active' NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Roadmaps table
CREATE TABLE public.roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_role TEXT NOT NULL,
    duration_weeks INTEGER DEFAULT 12 NOT NULL,
    difficulty_level TEXT DEFAULT 'intermediate',
    status TEXT DEFAULT 'active' NOT NULL,
    progress_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Roadmap weeks table
CREATE TABLE public.roadmap_weeks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roadmap_id UUID REFERENCES public.roadmaps(id) ON DELETE CASCADE NOT NULL,
    user_id UUID NOT NULL,
    week_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    skills_to_learn TEXT[] DEFAULT '{}',
    deliverables TEXT[] DEFAULT '{}',
    estimated_hours INTEGER DEFAULT 10,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Course recommendations table
CREATE TABLE public.course_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roadmap_week_id UUID REFERENCES public.roadmap_weeks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    instructor TEXT,
    duration TEXT,
    difficulty_level TEXT,
    price DECIMAL(10, 2),
    currency TEXT DEFAULT 'USD',
    rating DECIMAL(2, 1),
    relevance_score INTEGER,
    is_saved BOOLEAN DEFAULT false,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Quiz results table
CREATE TABLE public.quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roadmap_week_id UUID REFERENCES public.roadmap_weeks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    answers JSONB DEFAULT '{}',
    feedback TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Newsletter subscribers table
CREATE TABLE public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_newsletter_subscribers_email ON public.newsletter_subscribers(email);

-- Chat history table
CREATE TABLE public.chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_roadmaps_updated_at
    BEFORE UPDATE ON public.roadmaps
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_roadmaps_user_id ON public.roadmaps(user_id);
CREATE INDEX idx_roadmap_weeks_roadmap_id ON public.roadmap_weeks(roadmap_id);
CREATE INDEX idx_roadmap_weeks_user_id ON public.roadmap_weeks(user_id);
CREATE INDEX idx_course_recommendations_week_id ON public.course_recommendations(roadmap_week_id);
CREATE INDEX idx_quiz_results_week_id ON public.quiz_results(roadmap_week_id);
CREATE INDEX idx_chat_history_user_id ON public.chat_history(user_id);
CREATE INDEX idx_chat_history_created_at ON public.chat_history(created_at DESC);

-- Optional RLS: enable and add policies if frontend reads directly with anon key.
-- Server uses connection string / service role and bypasses RLS.
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
-- (repeat for other tables as needed)
