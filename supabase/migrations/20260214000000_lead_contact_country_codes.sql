-- Add country_code for phone numbers in leads and contact requests.
ALTER TABLE public.career_dna_leads
ADD COLUMN IF NOT EXISTS country_code TEXT;

ALTER TABLE public.contact_requests
ADD COLUMN IF NOT EXISTS phone_country_code TEXT;

CREATE INDEX IF NOT EXISTS idx_career_dna_leads_country ON public.career_dna_leads(country_code);
CREATE INDEX IF NOT EXISTS idx_contact_requests_topic_created ON public.contact_requests(topic, created_at DESC);
