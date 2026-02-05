-- Create public avatars bucket for profile avatar uploads (Edge Function api expects this).
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;
