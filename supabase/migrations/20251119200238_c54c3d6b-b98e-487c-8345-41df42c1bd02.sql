-- Make audio and covers storage buckets public
UPDATE storage.buckets 
SET public = true 
WHERE name IN ('audio', 'covers');