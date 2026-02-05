-- In-app chat for community (paid): one room per study group.

CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_group_id UUID UNIQUE REFERENCES public.study_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_study_group_id ON public.chat_rooms(study_group_id);

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read chat_rooms" ON public.chat_rooms;
CREATE POLICY "Members can read chat_rooms"
  ON public.chat_rooms FOR SELECT
  USING (
    study_group_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.study_group_members m
      WHERE m.group_id = chat_rooms.study_group_id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can insert chat_rooms" ON public.chat_rooms;
CREATE POLICY "Members can insert chat_rooms"
  ON public.chat_rooms FOR INSERT
  WITH CHECK (
    study_group_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.study_group_members m
      WHERE m.group_id = chat_rooms.study_group_id AND m.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(room_id, created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Room members can read chat_messages" ON public.chat_messages;
CREATE POLICY "Room members can read chat_messages"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms r
      JOIN public.study_group_members m ON m.group_id = r.study_group_id
      WHERE r.id = chat_messages.room_id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Room members can insert chat_messages" ON public.chat_messages;
CREATE POLICY "Room members can insert chat_messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.chat_rooms r
      JOIN public.study_group_members m ON m.group_id = r.study_group_id
      WHERE r.id = chat_messages.room_id AND m.user_id = auth.uid()
    )
  );
