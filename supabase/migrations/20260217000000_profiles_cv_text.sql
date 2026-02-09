-- Optional CV/resume text for AI context (roadmap, chat, etc.). Set from wizard upload or profile.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cv_text TEXT;

COMMENT ON COLUMN public.profiles.cv_text IS 'Extracted text from user CV/resume for AI personalization (roadmap, chat).';
