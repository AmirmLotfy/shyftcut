-- Ensure profile and subscription on sign-up (replaces Vercel /api/auth/session ensure step).
-- Trigger on auth.users insert; RLS on profiles so client can read own profile for AuthContext.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  display_name_val TEXT;
  email_val TEXT;
BEGIN
  email_val := LOWER(TRIM(COALESCE(NEW.email, '')));
  display_name_val := TRIM(COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(COALESCE(NEW.email, ''), '@', 1),
    'User'
  ));
  IF display_name_val = '' THEN
    display_name_val := 'User';
  END IF;

  INSERT INTO public.profiles (user_id, email, display_name, preferred_language)
  VALUES (NEW.id, NULLIF(email_val, ''), display_name_val, 'en')
  ON CONFLICT (user_id) DO UPDATE SET
    email = COALESCE(profiles.email, EXCLUDED.email),
    display_name = COALESCE(profiles.display_name, EXCLUDED.display_name);

  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- RLS so client (anon key + user JWT) can read own profile for AuthContext display_name
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
