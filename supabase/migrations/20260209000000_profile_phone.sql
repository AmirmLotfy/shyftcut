-- Add phone number (with country code) to profiles.
-- Store in E.164-like format: +1234567890

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;

COMMENT ON COLUMN public.profiles.phone IS 'Phone number with country code, e.g. +12025551234';
