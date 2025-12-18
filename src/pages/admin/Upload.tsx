import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload as UploadIcon, Music, Video, Info } from "lucide-react";
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
  const [uploadType, setUploadType] = useState<"audio" | "video">("audio");
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
    return fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[()[\]{}]/g, "")
      .replace(/[^\w\s.-]/g, "")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // For audio type, audio file is required
    // For video type, video file is required (audio comes from video)
    if (uploadType === "audio" && !audioFile) {
      toast.error("Audio soubor je povinný");
      return;
    }
    if (uploadType === "video" && !videoFile) {
      toast.error("Video soubor je povinný");
      return;
    }

    // Validate metadata
    const metadataResult = uploadSchema.safeParse({ title, artist, description, tags });
    if (!metadataResult.success) {
      toast.error(metadataResult.error.errors[0].message);
      return;
    }

    // Validate audio file if provided
    if (audioFile) {
      if (!ALLOWED_AUDIO_TYPES.includes(audioFile.type)) {
        toast.error("Neplatný typ audio souboru. Nahrajte MP3, WAV nebo OGG.");
        return;
      }
      if (audioFile.size > MAX_AUDIO_SIZE) {
        toast.error(`Audio soubor je příliš velký. Maximum je ${MAX_AUDIO_SIZE / 1024 / 1024}MB.`);
        return;
      }
    }

    // Validate cover image if provided
    if (coverFile) {
      if (!ALLOWED_IMAGE_TYPES.includes(coverFile.type)) {
        toast.error("Neplatný typ obrázku. Nahrajte JPEG, PNG nebo WEBP.");
        return;
      }
      if (coverFile.size > MAX_COVER_SIZE) {
        toast.error(`Obrázek je příliš velký. Maximum je ${MAX_COVER_SIZE / 1024 / 1024}MB.`);
        return;
      }
    }

    // Validate video file if provided
    if (videoFile) {
      if (!ALLOWED_VIDEO_TYPES.includes(videoFile.type)) {
        toast.error("Neplatný typ videa. Nahrajte MP4, WebM, OGG nebo MOV.");
        return;
      }
      if (videoFile.size > MAX_VIDEO_SIZE) {
        toast.error(`Video je příliš velké. Maximum je ${MAX_VIDEO_SIZE / 1024 / 1024}MB.`);
        return;
      }
    }

    setUploading(true);

    try {
      let audioUrl = null;
      let coverUrl = null;
      let videoUrl = null;

      // Upload audio file if provided (for audio type)
      if (audioFile) {
        const sanitizedAudioName = sanitizeFileName(audioFile.name);
        const audioFileName = `${Date.now()}-${sanitizedAudioName}`;
        const { error: audioError } = await supabase.storage
          .from("audio")
          .upload(audioFileName, audioFile);

        if (audioError) throw audioError;

        const { data: audioData } = supabase.storage
          .from("audio")
          .getPublicUrl(audioFileName);

        audioUrl = audioData.publicUrl;
      }

      // Upload cover image if provided
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

      // For video type without separate audio, use video URL as audio source
      const finalAudioUrl = audioUrl || videoUrl;

      if (!finalAudioUrl) {
        throw new Error("Není k dispozici žádný audio/video soubor");
      }

      // Create song record
      const { error: dbError } = await supabase.from("songs").insert({
        title,
        artist,
        description: description || null,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        audio_url: finalAudioUrl,
        cover_url: coverUrl,
        video_url: videoUrl,
        uploaded_by: user.id,
      });

      if (dbError) throw dbError;

      toast.success("Skladba byla úspěšně nahrána!");
      
      // Reset form
      setTitle("");
      setArtist("");
      setDescription("");
      setTags("");
      setAudioFile(null);
      setCoverFile(null);
      setVideoFile(null);
      setAudioInputKey((prev) => prev + 1);
      setCoverInputKey((prev) => prev + 1);
      setVideoInputKey((prev) => prev + 1);
    } catch (error: any) {
      toast.error("Nepodařilo se nahrát skladbu");
      if (import.meta.env.DEV) {
        console.error("Upload error:", error);
      }
    } finally {
      setUploading(false);
    }
  };

  const isSubmitDisabled = () => {
    if (uploading) return true;
    if (uploadType === "audio" && !audioFile) return true;
    if (uploadType === "video" && !videoFile) return true;
    return false;
  };

  return (
    <div className="container max-w-2xl py-8">
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <UploadIcon className="h-6 w-6 text-primary" />
            Nahrát novou skladbu
          </CardTitle>
          <CardDescription>
            Nahrajte audio track nebo video s hudbou
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={uploadType} onValueChange={(v) => setUploadType(v as "audio" | "video")} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="audio" className="gap-2">
                <Music className="h-4 w-4" />
                Audio track
              </TabsTrigger>
              <TabsTrigger value="video" className="gap-2">
                <Video className="h-4 w-4" />
                Video track
              </TabsTrigger>
            </TabsList>

            <TabsContent value="audio" className="mt-4">
              <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                <div className="flex items-start gap-3">
                  <Music className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Audio track</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Nahrajte MP3/WAV soubor. Volitelně můžete přidat cover obrázek.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="video" className="mt-4">
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <Video className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Video track</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Nahrajte video se zvukem (MP4, WebM). Zvuk z videa bude použit pro přehrávání.
                      Video se zobrazí v přehrávači místo cover obrázku.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Název *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Zadejte název skladby"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="artist">Interpret *</Label>
              <Input
                id="artist"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Zadejte jméno interpreta"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Popis</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Přidejte popis (volitelné)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tagy</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Zadejte tagy oddělené čárkami"
              />
            </div>

            {uploadType === "audio" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="audio">Audio soubor (MP3/WAV) *</Label>
                  <Input
                    key={audioInputKey}
                    id="audio"
                    type="file"
                    accept="audio/mpeg,audio/wav,audio/ogg"
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
                  <Label htmlFor="cover">Cover obrázek (volitelné)</Label>
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
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="video" className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-primary" />
                    Video soubor (MP4/WebM) *
                  </Label>
                  <Input
                    key={videoInputKey}
                    id="video"
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/quicktime"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    required
                  />
                  {videoFile && (
                    <p className="text-sm text-muted-foreground">
                      {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Info className="h-3 w-3" />
                    Zvuk z videa bude automaticky použit pro přehrávání
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cover">Cover obrázek (volitelné - použije se jako náhled)</Label>
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
              </>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitDisabled()}
            >
              {uploading ? (
                <>Nahrávání...</>
              ) : (
                <>
                  {uploadType === "audio" ? (
                    <Music className="mr-2 h-4 w-4" />
                  ) : (
                    <Video className="mr-2 h-4 w-4" />
                  )}
                  Nahrát {uploadType === "audio" ? "skladbu" : "video"}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
