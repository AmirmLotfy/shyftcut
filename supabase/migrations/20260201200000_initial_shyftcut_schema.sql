-- Shyftcut initial schema. user_id = auth.uid() (auth.users).

CREATE TYPE public.subscription_tier AS ENUM ('free', 'premium', 'pro');

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

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

CREATE TABLE public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_newsletter_subscribers_email ON public.newsletter_subscribers(email);

CREATE TABLE public.chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_roadmaps_updated_at
    BEFORE UPDATE ON public.roadmaps
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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
