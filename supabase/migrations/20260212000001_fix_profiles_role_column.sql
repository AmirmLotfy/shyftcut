-- Fix profiles.role: use quoted identifier (role is reserved in PostgreSQL).
-- Safe to run: adds column only if missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
      CREATE TYPE public.user_role AS ENUM ('user', 'admin', 'superadmin');
    END IF;
    ALTER TABLE public.profiles ADD COLUMN "role" public.user_role DEFAULT 'user'::public.user_role NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles("role");
  END IF;
END
$$;
