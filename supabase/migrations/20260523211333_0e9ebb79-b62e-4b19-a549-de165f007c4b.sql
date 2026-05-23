
-- COURSES
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  cover_image_url text,
  is_published boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View published courses" ON public.courses FOR SELECT TO authenticated
  USING (is_published OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coordinator'));
CREATE POLICY "Admins/coordinators manage courses" ON public.courses FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coordinator'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coordinator'));

CREATE TRIGGER trg_courses_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- LESSONS
CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lessons_course ON public.lessons(course_id, position);
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View lessons of viewable courses" ON public.lessons FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id
    AND (c.is_published OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'coordinator'))));
CREATE POLICY "Admins/coordinators manage lessons" ON public.lessons FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'coordinator'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'coordinator'));

CREATE TRIGGER trg_lessons_updated_at BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ENROLMENTS
CREATE TABLE public.course_enrolments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, user_id)
);
ALTER TABLE public.course_enrolments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own or all (admin/coord)" ON public.course_enrolments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'coordinator'));
CREATE POLICY "Users enrol themselves" ON public.course_enrolments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins/coordinators manage enrolments" ON public.course_enrolments FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'coordinator'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'coordinator'));

-- LESSON PROGRESS
CREATE TABLE public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
CREATE INDEX idx_lesson_progress_completed ON public.lesson_progress(completed_at DESC);
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own or all (admin/coord)" ON public.lesson_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'coordinator'));
CREATE POLICY "Users record own progress" ON public.lesson_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own progress" ON public.lesson_progress FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'));
