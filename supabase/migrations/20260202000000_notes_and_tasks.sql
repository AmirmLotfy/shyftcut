-- Notes and tasks for roadmap weeks (study tools).

CREATE TABLE public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    roadmap_week_id UUID REFERENCES public.roadmap_weeks(id) ON DELETE CASCADE,
    course_recommendation_id UUID REFERENCES public.course_recommendations(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    roadmap_week_id UUID REFERENCES public.roadmap_weeks(id) ON DELETE CASCADE,
    course_recommendation_id UUID REFERENCES public.course_recommendations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    notes TEXT DEFAULT '',
    due_date DATE,
    completed BOOLEAN DEFAULT false NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    source TEXT NOT NULL DEFAULT 'user' CHECK (source IN ('user', 'ai'))
);

CREATE INDEX idx_notes_user_id ON public.notes(user_id);
CREATE INDEX idx_notes_roadmap_week_id ON public.notes(roadmap_week_id);
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_roadmap_week_id ON public.tasks(roadmap_week_id);
CREATE INDEX idx_tasks_completed ON public.tasks(completed);

CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON public.notes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: users can only access their own notes and tasks
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY notes_select_own ON public.notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY notes_insert_own ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY notes_update_own ON public.notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY notes_delete_own ON public.notes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY tasks_select_own ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY tasks_insert_own ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY tasks_update_own ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY tasks_delete_own ON public.tasks FOR DELETE USING (auth.uid() = user_id);
