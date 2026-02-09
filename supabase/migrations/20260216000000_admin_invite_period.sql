-- Set subscription period for invited premium users from raw_user_meta_data.invited_period ('1_month' | '1_year', default 1_year).

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  display_name_val TEXT;
  email_val TEXT;
  tier_val public.subscription_tier;
  period_start TIMESTAMP WITH TIME ZONE;
  period_end TIMESTAMP WITH TIME ZONE;
  invited_period TEXT;
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

  tier_val := 'free'::public.subscription_tier;
  IF NEW.raw_user_meta_data->>'invited_tier' IN ('premium', 'pro') THEN
    tier_val := (NEW.raw_user_meta_data->>'invited_tier')::public.subscription_tier;
  END IF;

  period_start := NULL;
  period_end := NULL;
  IF tier_val IN ('premium', 'pro') THEN
    period_start := now();
    invited_period := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'invited_period'), ''), '1_year');
    IF invited_period = '1_month' THEN
      period_end := now() + interval '1 month';
    ELSE
      period_end := now() + interval '1 year';
    END IF;
  END IF;

  INSERT INTO public.profiles (user_id, email, display_name, preferred_language)
  VALUES (NEW.id, NULLIF(email_val, ''), display_name_val, 'en')
  ON CONFLICT (user_id) DO UPDATE SET
    email = COALESCE(profiles.email, EXCLUDED.email),
    display_name = COALESCE(profiles.display_name, EXCLUDED.display_name);

  INSERT INTO public.subscriptions (user_id, tier, status, current_period_start, current_period_end)
  VALUES (NEW.id, tier_val, 'active', period_start, period_end)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
