-- Make storage buckets private to enforce RLS policies
-- This prevents unauthenticated access to audio files and cover images

UPDATE storage.buckets 
SET public = false 
WHERE id IN ('audio', 'covers');

-- RLS policies will now be enforced
-- Only authenticated users with admin or listener roles can access files