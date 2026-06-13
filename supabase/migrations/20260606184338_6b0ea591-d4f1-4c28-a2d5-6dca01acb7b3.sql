
CREATE POLICY "public read product-media" ON storage.objects FOR SELECT
  USING (bucket_id = 'product-media');
CREATE POLICY "admin upload product-media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin update product-media" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete product-media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-media' AND public.has_role(auth.uid(),'admin'));
