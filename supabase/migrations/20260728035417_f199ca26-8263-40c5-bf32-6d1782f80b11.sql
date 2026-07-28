CREATE POLICY "staff read manuals files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'manuals' AND app_private.current_user_is_staff());

CREATE POLICY "staff upload manuals files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'manuals' AND app_private.current_user_is_staff());

CREATE POLICY "staff update manuals files" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'manuals' AND app_private.current_user_is_staff())
WITH CHECK (bucket_id = 'manuals' AND app_private.current_user_is_staff());

CREATE POLICY "staff delete manuals files" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'manuals' AND app_private.current_user_is_staff());