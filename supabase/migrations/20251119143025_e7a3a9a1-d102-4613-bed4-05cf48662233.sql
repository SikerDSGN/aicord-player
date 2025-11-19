-- Update RLS policies for playlists to allow users to manage their own playlists

-- Drop existing policies
DROP POLICY IF EXISTS "Admin can insert playlists" ON public.playlists;
DROP POLICY IF EXISTS "Admin can update playlists" ON public.playlists;
DROP POLICY IF EXISTS "Admin can delete playlists" ON public.playlists;

-- Users can create their own playlists
CREATE POLICY "Users can create their own playlists"
ON public.playlists
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Users can update their own playlists
CREATE POLICY "Users can update their own playlists"
ON public.playlists
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

-- Users can delete their own playlists
CREATE POLICY "Users can delete their own playlists"
ON public.playlists
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Update RLS policies for playlist_tracks to allow users to manage tracks in their own playlists

-- Drop existing policies
DROP POLICY IF EXISTS "Admin can manage playlist tracks" ON public.playlist_tracks;

-- Users can add tracks to their own playlists
CREATE POLICY "Users can add tracks to their own playlists"
ON public.playlist_tracks
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.playlists
    WHERE id = playlist_id AND created_by = auth.uid()
  )
);

-- Users can update tracks in their own playlists
CREATE POLICY "Users can update tracks in their own playlists"
ON public.playlist_tracks
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.playlists
    WHERE id = playlist_id AND created_by = auth.uid()
  )
);

-- Users can delete tracks from their own playlists
CREATE POLICY "Users can delete tracks from their own playlists"
ON public.playlist_tracks
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.playlists
    WHERE id = playlist_id AND created_by = auth.uid()
  )
);