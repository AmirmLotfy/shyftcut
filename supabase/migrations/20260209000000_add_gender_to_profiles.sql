-- Add gender field to profiles table for avatar generation
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'non_binary', 'prefer_not_to_say'));

COMMENT ON COLUMN public.profiles.gender IS 'User gender preference for avatar generation: male, female, non_binary, or prefer_not_to_say';
