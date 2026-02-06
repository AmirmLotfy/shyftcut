-- Theme settings table for admin-defined themes and user preferences
CREATE TABLE IF NOT EXISTS public.theme_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_admin_created BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  colors JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Ensure only one default theme
CREATE UNIQUE INDEX IF NOT EXISTS idx_theme_settings_default ON public.theme_settings(is_default) WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_theme_settings_admin_created ON public.theme_settings(is_admin_created) WHERE is_admin_created = true;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_theme_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_theme_settings_updated_at ON public.theme_settings;
CREATE TRIGGER update_theme_settings_updated_at
    BEFORE UPDATE ON public.theme_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_theme_settings_updated_at();

-- Insert default dark and light themes
INSERT INTO public.theme_settings (name, is_default, is_admin_created, colors, description) VALUES
  ('Dark', true, false, '{"background": "240 10% 3.9%", "foreground": "0 0% 98%", "primary": "250 95% 65%", "secondary": "240 5% 16%", "accent": "180 70% 50%", "muted": "240 5% 16%", "destructive": "0 84% 60%", "border": "240 5% 18%", "card": "240 10% 5.9%", "popover": "240 10% 5.9%"}'::jsonb, 'Default dark theme'),
  ('Light', false, false, '{"background": "0 0% 100%", "foreground": "240 10% 10%", "primary": "250 95% 55%", "secondary": "240 5% 96%", "accent": "180 70% 45%", "muted": "240 5% 96%", "destructive": "0 84% 55%", "border": "240 6% 90%", "card": "0 0% 100%", "popover": "0 0% 100%"}'::jsonb, 'Default light theme')
ON CONFLICT DO NOTHING;
