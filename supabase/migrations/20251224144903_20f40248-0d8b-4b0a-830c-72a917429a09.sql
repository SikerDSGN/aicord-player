-- Add length constraint to comments table
ALTER TABLE public.comments
ADD CONSTRAINT comments_content_length 
CHECK (length(content) > 0 AND length(content) <= 500);

-- Fix increment_play_count function to add role check and validation
CREATE OR REPLACE FUNCTION public.increment_play_count(song_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user has listener or admin role
  IF NOT (has_role(auth.uid(), 'listener') OR has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Unauthorized: User does not have permission to play songs';
  END IF;
  
  -- Check if song exists
  IF NOT EXISTS (SELECT 1 FROM public.songs WHERE id = song_id) THEN
    RAISE EXCEPTION 'Song not found';
  END IF;
  
  -- Update play count
  UPDATE public.songs
  SET play_count = play_count + 1
  WHERE id = song_id;
END;
$$;