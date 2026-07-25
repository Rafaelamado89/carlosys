-- Replace policies that call SECURITY DEFINER helpers with direct, self-scoped role checks
DROP POLICY IF EXISTS "staff manage work_orders" ON public.work_orders;
CREATE POLICY "staff manage work_orders" ON public.work_orders FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('staff','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('staff','admin')));

DROP POLICY IF EXISTS "staff manage parts_requests" ON public.parts_requests;
CREATE POLICY "staff manage parts_requests" ON public.parts_requests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('staff','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('staff','admin')));

DROP POLICY IF EXISTS "staff manage invoices" ON public.invoices;
CREATE POLICY "staff manage invoices" ON public.invoices FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('staff','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('staff','admin')));

DROP POLICY IF EXISTS "staff manage invoice_items" ON public.invoice_items;
CREATE POLICY "staff manage invoice_items" ON public.invoice_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('staff','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('staff','admin')));

-- Remove client access to elevated helper functions
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.handle_new_user_role() FROM anon, authenticated, public;