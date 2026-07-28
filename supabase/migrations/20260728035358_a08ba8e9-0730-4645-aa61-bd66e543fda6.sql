ALTER TABLE public.parts_requests ADD COLUMN IF NOT EXISTS image_url text;

CREATE TABLE public.manuals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  description text,
  brand text,
  model text,
  keywords text,
  external_url text,
  file_path text,
  file_name text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.manuals TO authenticated;
GRANT ALL ON public.manuals TO service_role;

ALTER TABLE public.manuals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff manage manuals" ON public.manuals FOR ALL TO authenticated
USING (app_private.current_user_is_staff())
WITH CHECK (app_private.current_user_is_staff());

CREATE TRIGGER manuals_set_updated_at BEFORE UPDATE ON public.manuals
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();