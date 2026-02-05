-- Update Career DNA score_tier to viral personas: Visionaries, Naturals, Explorers, Shifters, Awakeners, Misfits.
-- Drop old constraint and add new one. Migrate existing values: unicorn->visionaries, solid->naturals, misaligned->explorers, urgent->shifters.

ALTER TABLE public.career_dna_results DROP CONSTRAINT IF EXISTS career_dna_results_score_tier_check;

UPDATE public.career_dna_results
SET score_tier = CASE score_tier
  WHEN 'unicorn' THEN 'visionaries'
  WHEN 'solid' THEN 'naturals'
  WHEN 'misaligned' THEN 'explorers'
  WHEN 'urgent' THEN 'shifters'
  ELSE score_tier
END
WHERE score_tier IN ('unicorn', 'solid', 'misaligned', 'urgent');

ALTER TABLE public.career_dna_results
ADD CONSTRAINT career_dna_results_score_tier_check
CHECK (score_tier IN ('visionaries', 'naturals', 'explorers', 'shifters', 'awakeners', 'misfits'));

-- Add persona_character_id for the 4 characters per tier (optional, for avatar lookup).
ALTER TABLE public.career_dna_results
ADD COLUMN IF NOT EXISTS persona_character_id TEXT;
