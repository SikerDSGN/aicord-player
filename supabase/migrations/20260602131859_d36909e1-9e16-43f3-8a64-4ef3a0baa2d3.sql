-- comments: add role guard to UPDATE/DELETE
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

CREATE POLICY "Users can update their own comments"
ON public.comments FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'listener'::app_role)));

CREATE POLICY "Users can delete their own comments"
ON public.comments FOR DELETE TO authenticated
USING (auth.uid() = user_id AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'listener'::app_role)));

-- favorites: add role guard
DROP POLICY IF EXISTS "Users can add their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;

CREATE POLICY "Users can view their own favorites"
ON public.favorites FOR SELECT TO authenticated
USING (auth.uid() = user_id AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'listener'::app_role)));

CREATE POLICY "Users can add their own favorites"
ON public.favorites FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'listener'::app_role)));

CREATE POLICY "Users can delete their own favorites"
ON public.favorites FOR DELETE TO authenticated
USING (auth.uid() = user_id AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'listener'::app_role)));

-- playlists: add role guard to INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Users can create their own playlists" ON public.playlists;
DROP POLICY IF EXISTS "Users can update their own playlists" ON public.playlists;
DROP POLICY IF EXISTS "Users can delete their own playlists" ON public.playlists;

CREATE POLICY "Users can create their own playlists"
ON public.playlists FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'listener'::app_role)));

CREATE POLICY "Users can update their own playlists"
ON public.playlists FOR UPDATE TO authenticated
USING (auth.uid() = created_by AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'listener'::app_role)));

CREATE POLICY "Users can delete their own playlists"
ON public.playlists FOR DELETE TO authenticated
USING (auth.uid() = created_by AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'listener'::app_role)));

-- playlist_tracks: add role guard
DROP POLICY IF EXISTS "Users can add tracks to their own playlists" ON public.playlist_tracks;
DROP POLICY IF EXISTS "Users can update tracks in their own playlists" ON public.playlist_tracks;
DROP POLICY IF EXISTS "Users can delete tracks from their own playlists" ON public.playlist_tracks;

CREATE POLICY "Users can add tracks to their own playlists"
ON public.playlist_tracks FOR INSERT TO authenticated
WITH CHECK (
  (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'listener'::app_role))
  AND EXISTS (SELECT 1 FROM playlists WHERE playlists.id = playlist_tracks.playlist_id AND playlists.created_by = auth.uid())
);

CREATE POLICY "Users can update tracks in their own playlists"
ON public.playlist_tracks FOR UPDATE TO authenticated
USING (
  (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'listener'::app_role))
  AND EXISTS (SELECT 1 FROM playlists WHERE playlists.id = playlist_tracks.playlist_id AND playlists.created_by = auth.uid())
);

CREATE POLICY "Users can delete tracks from their own playlists"
ON public.playlist_tracks FOR DELETE TO authenticated
USING (
  (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'listener'::app_role))
  AND EXISTS (SELECT 1 FROM playlists WHERE playlists.id = playlist_tracks.playlist_id AND playlists.created_by = auth.uid())
);
