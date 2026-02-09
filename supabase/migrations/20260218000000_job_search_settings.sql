-- Job search settings for premium: country (ISO), city, employment types, seniority.
-- notification_preferences: opt-in for weekly job digest email.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS job_search_country TEXT,
  ADD COLUMN IF NOT EXISTS job_search_city TEXT,
  ADD COLUMN IF NOT EXISTS job_employment_types TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS job_seniority TEXT;

-- Employment: full_time, part_time, contract, freelance, internship. Seniority: entry, mid, senior, lead, executive.
COMMENT ON COLUMN public.profiles.job_employment_types IS 'Preferred employment types: full_time, part_time, contract, freelance, internship';
COMMENT ON COLUMN public.profiles.job_seniority IS 'Preferred level: entry, mid, senior, lead, executive';

ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS job_digest_email BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.notification_preferences.job_digest_email IS 'Send weekly job recommendations digest by email when find_jobs_enabled is on';
