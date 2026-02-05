-- Admin settings table for feature flags and system configuration
CREATE TABLE IF NOT EXISTS public.admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Initial settings
INSERT INTO public.admin_settings (key, value, description) VALUES
  ('feature_flags', '{"maintenance_mode": false, "signups_enabled": true}', 'Feature flags for platform control'),
  ('rate_limits', '{"guest_roadmaps_per_hour": 3, "chat_messages_per_minute": 10}', 'Rate limits configuration'),
  ('content_moderation', '{"auto_moderate_chat": false, "require_approval_roadmaps": false}', 'Content moderation settings')
ON CONFLICT (key) DO NOTHING;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_admin_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_admin_settings_updated_at ON public.admin_settings;
CREATE TRIGGER update_admin_settings_updated_at
    BEFORE UPDATE ON public.admin_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_admin_settings_updated_at();
