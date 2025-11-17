import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer } from "@/contexts/PlayerContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Music } from "lucide-react";
import { toast } from "sonner";

interface Song {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  cover_url: string | null;
  description: string | null;
}

export default function Library() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const { playSong, playQueue } = usePlayer();

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSongs(data || []);
    } catch (error: any) {
      toast.error("Failed to load songs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = (song: Song, index: number) => {
    playQueue(songs, index);
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {[...Array(10)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-square bg-muted"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Music className="mx-auto h-16 w-16 text-muted-foreground opacity-50" />
          <h2 className="mt-4 text-2xl font-bold">No songs yet</h2>
          <p className="mt-2 text-muted-foreground">
            The library is empty. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
        Music Library
      </h1>
      
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {songs.map((song, index) => (
          <Card
            key={song.id}
            className="group overflow-hidden border-border bg-card transition-all hover:shadow-glow hover:scale-105"
          >
            <div className="relative aspect-square overflow-hidden bg-muted">
              {song.cover_url ? (
                <img
                  src={song.cover_url}
                  alt={song.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-110"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Music className="h-16 w-16 text-muted-foreground opacity-50" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="lg"
                  className="h-14 w-14 rounded-full shadow-glow"
                  onClick={() => handlePlaySong(song, index)}
                >
                  <Play className="h-6 w-6" />
                </Button>
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold truncate">{song.title}</h3>
              <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
