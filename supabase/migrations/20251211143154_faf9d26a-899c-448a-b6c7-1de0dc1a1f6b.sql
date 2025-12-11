-- Add video_url column to songs table
ALTER TABLE public.songs ADD COLUMN video_url text;

-- Create videos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true);

-- Storage policies for videos bucket
CREATE POLICY "Anyone can view videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

CREATE POLICY "Admins can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'videos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'videos' AND has_role(auth.uid(), 'admin'::app_role));