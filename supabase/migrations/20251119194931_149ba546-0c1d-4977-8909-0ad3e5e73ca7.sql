-- Add foreign key constraint between favorites and songs tables
ALTER TABLE public.favorites
ADD CONSTRAINT favorites_song_id_fkey 
FOREIGN KEY (song_id) 
REFERENCES public.songs(id) 
ON DELETE CASCADE;