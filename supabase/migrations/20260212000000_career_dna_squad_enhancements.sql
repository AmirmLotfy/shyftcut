-- Career DNA squad enhancements: nickname, phone leads, signup prompts.
-- display_name: optional nickname when taking quiz via squad link
ALTER TABLE public.career_dna_results
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- career_dna_leads: optional phone collection with consent (for non-logged-in users)
CREATE TABLE IF NOT EXISTS public.career_dna_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('squad', 'result')),
  source_id TEXT NOT NULL,
  consent_marketing BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_career_dna_leads_source ON public.career_dna_leads(source, source_id);
CREATE INDEX IF NOT EXISTS idx_career_dna_leads_created ON public.career_dna_leads(created_at);
