-- Allow null url so we can store "no valid link" and show "Find on {platform}" in UI.
ALTER TABLE public.course_recommendations
  ALTER COLUMN url DROP NOT NULL;
