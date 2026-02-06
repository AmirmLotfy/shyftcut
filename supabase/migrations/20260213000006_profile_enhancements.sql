-- Enhance profiles table with theme preference, notes, tags, and last_active_at
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS preferred_theme_id UUID REFERENCES public.theme_settings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS user_notes TEXT,
  ADD COLUMN IF NOT EXISTS user_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_profiles_preferred_theme_id ON public.profiles(preferred_theme_id);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active_at ON public.profiles(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_user_tags ON public.profiles USING GIN(user_tags);
