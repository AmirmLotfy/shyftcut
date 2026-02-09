-- Support admin invite tier: when a user is created via invite, set subscription tier from raw_user_meta_data.invited_tier.

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

  -- Tier: use invited_tier from metadata when valid (admin invite), else free
  tier_val := 'free'::public.subscription_tier;
  IF NEW.raw_user_meta_data->>'invited_tier' IN ('premium', 'pro') THEN
    tier_val := (NEW.raw_user_meta_data->>'invited_tier')::public.subscription_tier;
  END IF;

  INSERT INTO public.profiles (user_id, email, display_name, preferred_language)
  VALUES (NEW.id, NULLIF(email_val, ''), display_name_val, 'en')
  ON CONFLICT (user_id) DO UPDATE SET
    email = COALESCE(profiles.email, EXCLUDED.email),
    display_name = COALESCE(profiles.display_name, EXCLUDED.display_name);

  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (NEW.id, tier_val, 'active')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
