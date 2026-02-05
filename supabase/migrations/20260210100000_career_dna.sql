-- Career DNA Analyzer: viral quiz results and squad challenges.
-- career_dna_squads: group challenge containers
-- career_dna_results: individual quiz results (squad_id nullable until user creates/joins squad)
-- career_dna_squad_members: links results to squads

CREATE TABLE public.career_dna_squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.career_dna_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  ip_hash TEXT,
  current_field TEXT NOT NULL,
  is_student BOOLEAN DEFAULT false,
  match_score INTEGER NOT NULL,
  personality_archetype TEXT,
  archetype_description TEXT,
  superpower TEXT,
  superpower_rarity TEXT,
  hidden_talent TEXT,
  hidden_talent_career_hint TEXT,
  shareable_quote TEXT,
  score_tier TEXT CHECK (score_tier IN ('unicorn', 'solid', 'misaligned', 'urgent')),
  suggested_careers JSONB DEFAULT '[]',
  raw_answers JSONB NOT NULL,
  language TEXT DEFAULT 'en',
  squad_id UUID REFERENCES public.career_dna_squads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.career_dna_squad_members (
  squad_id UUID NOT NULL REFERENCES public.career_dna_squads(id) ON DELETE CASCADE,
  result_id UUID NOT NULL REFERENCES public.career_dna_results(id) ON DELETE CASCADE,
  PRIMARY KEY (squad_id, result_id)
);

CREATE INDEX idx_career_dna_results_created ON public.career_dna_results(created_at);
CREATE INDEX idx_career_dna_results_squad ON public.career_dna_results(squad_id) WHERE squad_id IS NOT NULL;
CREATE INDEX idx_career_dna_squads_slug ON public.career_dna_squads(slug);
