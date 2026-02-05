-- Public contact form submissions (anonymous).
CREATE TABLE IF NOT EXISTS public.contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  topic TEXT NOT NULL DEFAULT 'general' CHECK (topic IN ('general', 'sales', 'support', 'partnership', 'feedback', 'other')),
  company TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contact_requests_created_at ON public.contact_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_requests_topic ON public.contact_requests(topic);

ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit (anon insert).
CREATE POLICY "Anyone can insert contact requests"
  ON public.contact_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only service role can read (for dashboard/support). No public SELECT.
CREATE POLICY "Service role can read contact requests"
  ON public.contact_requests FOR SELECT
  TO service_role
  USING (true);
