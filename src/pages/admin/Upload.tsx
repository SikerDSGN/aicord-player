import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload as UploadIcon, Music, Video } from "lucide-react";
import { z } from "zod";

// File validation constants
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_COVER_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

// Metadata validation schema
const uploadSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
  artist: z.string().trim().min(1, "Artist is required").max(200, "Artist is too long"),
  description: z.string().trim().max(1000, "Description is too long").optional(),
  tags: z.string().max(500, "Tags are too long").optional()
});

export default function Upload() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [audioInputKey, setAudioInputKey] = useState(0);
  const [coverInputKey, setCoverInputKey] = useState(0);
  const [videoInputKey, setVideoInputKey] = useState(0);

  const sanitizeFileName = (fileName: string) => {
    // Remove special characters and replace spaces with underscores
    return fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .replace(/[()[\]{}]/g, "") // Remove brackets and parentheses
      .replace(/[^\w\s.-]/g, "") // Remove other special chars except word chars, spaces, dots, dashes
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .replace(/_+/g, "_") // Replace multiple underscores with single
      .replace(/^_+|_+$/g, ""); // Remove leading/trailing underscores
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile || !user) return;

    // Validate metadata
    const metadataResult = uploadSchema.safeParse({ title, artist, description, tags });
    if (!metadataResult.success) {
      toast.error(metadataResult.error.errors[0].message);
      return;
    }

    // Validate audio file type
    if (!ALLOWED_AUDIO_TYPES.includes(audioFile.type)) {
      toast.error("Invalid audio file type. Please upload MP3, WAV, or OGG.");
      return;
    }

    // Validate audio file size
    if (audioFile.size > MAX_AUDIO_SIZE) {
      toast.error(`Audio file too large. Maximum size is ${MAX_AUDIO_SIZE / 1024 / 1024}MB.`);
      return;
    }

    // Validate cover image if provided
    if (coverFile) {
      if (!ALLOWED_IMAGE_TYPES.includes(coverFile.type)) {
        toast.error("Invalid image type. Please upload JPEG, PNG, or WEBP.");
        return;
      }
      if (coverFile.size > MAX_COVER_SIZE) {
        toast.error(`Image too large. Maximum size is ${MAX_COVER_SIZE / 1024 / 1024}MB.`);
        return;
      }
    }

    // Validate video file if provided
    if (videoFile) {
      if (!ALLOWED_VIDEO_TYPES.includes(videoFile.type)) {
        toast.error("Invalid video type. Please upload MP4, WebM, OGG, or MOV.");
        return;
      }
      if (videoFile.size > MAX_VIDEO_SIZE) {
        toast.error(`Video too large. Maximum size is ${MAX_VIDEO_SIZE / 1024 / 1024}MB.`);
        return;
      }
    }

    setUploading(true);

    try {
      // Upload audio file
      const sanitizedAudioName = sanitizeFileName(audioFile.name);
      const audioFileName = `${Date.now()}-${sanitizedAudioName}`;
      const { error: audioError } = await supabase.storage
        .from("audio")
        .upload(audioFileName, audioFile);

      if (audioError) throw audioError;

      const { data: audioData } = supabase.storage
        .from("audio")
        .getPublicUrl(audioFileName);

      // Upload cover image if provided
      let coverUrl = null;
      if (coverFile) {
        const sanitizedCoverName = sanitizeFileName(coverFile.name);
        const coverFileName = `${Date.now()}-${sanitizedCoverName}`;
        const { error: coverError } = await supabase.storage
          .from("covers")
          .upload(coverFileName, coverFile);

        if (coverError) throw coverError;

        const { data: coverData } = supabase.storage
          .from("covers")
          .getPublicUrl(coverFileName);

        coverUrl = coverData.publicUrl;
      }

      // Upload video if provided
      let videoUrl = null;
      if (videoFile) {
        const sanitizedVideoName = sanitizeFileName(videoFile.name);
        const videoFileName = `${Date.now()}-${sanitizedVideoName}`;
        const { error: videoError } = await supabase.storage
          .from("videos")
          .upload(videoFileName, videoFile);

        if (videoError) throw videoError;

        const { data: videoData } = supabase.storage
          .from("videos")
          .getPublicUrl(videoFileName);

        videoUrl = videoData.publicUrl;
      }

      // Create song record
      const { error: dbError } = await supabase.from("songs").insert({
        title,
        artist,
        description: description || null,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        audio_url: audioData.publicUrl,
        cover_url: coverUrl,
        video_url: videoUrl,
        uploaded_by: user.id,
      });

      if (dbError) throw dbError;

      toast.success("Song uploaded successfully!");
      
      // Reset form
      setTitle("");
      setArtist("");
      setDescription("");
      setTags("");
      setAudioFile(null);
      setCoverFile(null);
      setVideoFile(null);
      // Reset file inputs by changing their keys
      setAudioInputKey((prev) => prev + 1);
      setCoverInputKey((prev) => prev + 1);
      setVideoInputKey((prev) => prev + 1);
    } catch (error: any) {
      toast.error("Failed to upload song");
      if (import.meta.env.DEV) {
        console.error("Upload error:", error);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <UploadIcon className="h-6 w-6 text-primary" />
            Upload New Song
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter song title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="artist">Artist *</Label>
              <Input
                id="artist"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Enter artist name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description (optional)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Enter tags separated by commas"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="audio">Audio File (MP3/WAV) *</Label>
              <Input
                key={audioInputKey}
                id="audio"
                type="file"
                accept="audio/mpeg,audio/wav"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                required
              />
              {audioFile && (
                <p className="text-sm text-muted-foreground">
                  {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover">Cover Image (Optional)</Label>
              <Input
                key={coverInputKey}
                id="cover"
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              />
              {coverFile && (
                <p className="text-sm text-muted-foreground">
                  {coverFile.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="video" className="flex items-center gap-2">
                <Video className="h-4 w-4 text-primary" />
                Video Clip (Optional - max 500MB)
              </Label>
              <Input
                key={videoInputKey}
                id="video"
                type="file"
                accept="video/mp4,video/webm,video/ogg,video/quicktime"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              />
              {videoFile && (
                <p className="text-sm text-muted-foreground">
                  {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={uploading || !audioFile}
            >
              {uploading ? (
                <>Uploading...</>
              ) : (
                <>
                  <Music className="mr-2 h-4 w-4" />
                  Upload Song
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
