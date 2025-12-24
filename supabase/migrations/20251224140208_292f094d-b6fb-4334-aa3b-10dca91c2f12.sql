-- Create comments table for songs
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for comments
CREATE POLICY "Admin and listener can view comments"
ON public.comments
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'listener'));

CREATE POLICY "Admin and listener can create comments"
ON public.comments
FOR INSERT
WITH CHECK ((has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'listener')) AND auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON public.comments
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.comments
FOR DELETE
USING (auth.uid() = user_id);

-- Add play_count column to songs table
ALTER TABLE public.songs ADD COLUMN play_count INTEGER NOT NULL DEFAULT 0;

-- Create trigger for updated_at on comments
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to increment play count
CREATE OR REPLACE FUNCTION public.increment_play_count(song_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.songs
  SET play_count = play_count + 1
  WHERE id = song_id;
END;
$$;