-- Seed Gemini Team as a Premium test user for manual testing and CI.
-- Credentials: gemini@shyftcut.com / Gemini3@devpost.com
-- Run with: supabase db push (or supabase db reset for local)

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'gemini@shyftcut.com';
  v_encrypted_pw TEXT := extensions.crypt('Gemini3@devpost.com', extensions.gen_salt('bf'));
  v_new_id UUID := 'b8e7f4a2-3c1d-4e5f-9a0b-2d3e4f5a6b7c';
BEGIN
  -- Resolve user id: use existing if email exists, else we will insert
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := v_new_id;
    -- 1a. Insert new user (trigger creates profile + free subscription)
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    )
    VALUES (
      v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      v_email, v_encrypted_pw, NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"display_name": "Gemini Team"}'::jsonb, NOW(), NOW()
    );

    -- 2a. Create identity for email login
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      v_user_id, v_user_id,
      format('{"sub": "%s", "email": "%s"}', v_user_id, v_email)::jsonb,
      'email', v_user_id::text, NOW(), NOW(), NOW()
    );
  ELSE
    -- 1b. Update existing user password and metadata
    UPDATE auth.users
    SET encrypted_password = v_encrypted_pw, raw_user_meta_data = '{"display_name": "Gemini Team"}'::jsonb, updated_at = NOW()
    WHERE id = v_user_id;
  END IF;

  -- 3. Ensure profile exists and set display name
  INSERT INTO public.profiles (user_id, email, display_name, preferred_language, created_at, updated_at)
  VALUES (v_user_id, v_email, 'Gemini Team', 'en', NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET display_name = 'Gemini Team', email = v_email, updated_at = NOW();

  -- 4. Ensure subscription exists and set to premium
  INSERT INTO public.subscriptions (user_id, tier, status, created_at, updated_at)
  VALUES (v_user_id, 'premium', 'active', NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET tier = 'premium', status = 'active', updated_at = NOW();
END
$$;
