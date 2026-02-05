-- Add optional social link columns to profiles (LinkedIn, Twitter/X, GitHub).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS twitter_url TEXT,
  ADD COLUMN IF NOT EXISTS github_url TEXT;
