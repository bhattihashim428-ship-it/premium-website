/*
# Storage bucket policies for screenshots
- Public read for screenshots bucket
- Authenticated users can upload to their own folder
*/
DROP POLICY IF EXISTS "screenshots_public_read" ON storage.objects;
CREATE POLICY "screenshots_public_read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'screenshots');

DROP POLICY IF EXISTS "screenshots_auth_upload" ON storage.objects;
CREATE POLICY "screenshots_auth_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'screenshots');