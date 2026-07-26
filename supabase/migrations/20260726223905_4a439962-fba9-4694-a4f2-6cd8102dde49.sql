CREATE SCHEMA IF NOT EXISTS app_private;

CREATE OR REPLACE FUNCTION app_private.current_user_is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('staff', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION app_private.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
$$;

REVOKE ALL ON SCHEMA app_private FROM PUBLIC;
GRANT USAGE ON SCHEMA app_private TO authenticated;
REVOKE ALL ON FUNCTION app_private.current_user_is_staff() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app_private.current_user_is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.current_user_is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.current_user_is_admin() TO authenticated;

DROP POLICY IF EXISTS "staff manage work_orders" ON public.work_orders;
DROP POLICY IF EXISTS "staff manage parts_requests" ON public.parts_requests;
DROP POLICY IF EXISTS "staff manage invoices" ON public.invoices;
DROP POLICY IF EXISTS "staff manage invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "admins manage roles" ON public.user_roles;

CREATE POLICY "staff manage work_orders"
ON public.work_orders
FOR ALL
TO authenticated
USING (app_private.current_user_is_staff())
WITH CHECK (app_private.current_user_is_staff());

CREATE POLICY "staff manage parts_requests"
ON public.parts_requests
FOR ALL
TO authenticated
USING (app_private.current_user_is_staff())
WITH CHECK (app_private.current_user_is_staff());

CREATE POLICY "staff manage invoices"
ON public.invoices
FOR ALL
TO authenticated
USING (app_private.current_user_is_staff())
WITH CHECK (app_private.current_user_is_staff());

CREATE POLICY "staff manage invoice_items"
ON public.invoice_items
FOR ALL
TO authenticated
USING (app_private.current_user_is_staff())
WITH CHECK (app_private.current_user_is_staff());

CREATE POLICY "admins manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (app_private.current_user_is_admin())
WITH CHECK (app_private.current_user_is_admin());

ALTER TABLE public.work_orders
  ALTER COLUMN client_name DROP NOT NULL,
  ALTER COLUMN motorcycle_make DROP NOT NULL,
  ALTER COLUMN motorcycle_model DROP NOT NULL;

ALTER TABLE public.parts_requests
  ALTER COLUMN part_name DROP NOT NULL;

ALTER TABLE public.invoices
  ALTER COLUMN client_name DROP NOT NULL;

ALTER TABLE public.invoice_items
  ALTER COLUMN description DROP NOT NULL;