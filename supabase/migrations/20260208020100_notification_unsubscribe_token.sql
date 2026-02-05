-- Unsubscribe token for email reminder one-click opt-out.

ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS unsubscribe_token UUID UNIQUE DEFAULT gen_random_uuid();

-- Backfill existing rows
UPDATE public.notification_preferences
SET unsubscribe_token = gen_random_uuid()
WHERE unsubscribe_token IS NULL;
