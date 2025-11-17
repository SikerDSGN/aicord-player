import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer } from "@/contexts/PlayerContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Music, Heart } from "lucide-react";
import { toast } from "sonner";

interface Song {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  cover_url: string | null;
  description: string | null;
}

export default function Favorites() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const { playQueue } = usePlayer();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select(`
          song_id,
          songs (
            id,
            title,
            artist,
            audio_url,
            cover_url,
            description
          )
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const favoriteSongs = data?.map((fav: any) => fav.songs).filter(Boolean) || [];
      setSongs(favoriteSongs);
    } catch (error: any) {
      toast.error("Nepodařilo se načíst oblíbené");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (songId: string) => {
    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user?.id)
        .eq("song_id", songId);

      if (error) throw error;
      
      setSongs(songs.filter(song => song.id !== songId));
      toast.success("Odebráno z oblíbených");
    } catch (error: any) {
      toast.error("Nepodařilo se odebrat z oblíbených");
      console.error(error);
    }
  };

  const handlePlaySong = (song: Song, index: number) => {
    playQueue(songs, index);
  };

  if (loading) {
    return (
      <div className="container py-6 md:py-8 px-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 md:gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-square bg-muted"></div>
              <CardContent className="p-3 md:p-4">
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
      <div className="container flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <Heart className="mx-auto h-12 md:h-16 w-12 md:w-16 text-primary opacity-50 neon-glow" />
          <h2 className="mt-4 text-xl md:text-2xl font-bold">Žádné oblíbené skladby</h2>
          <p className="mt-2 text-sm md:text-base text-muted-foreground">
            Začněte přidávat skladby do oblíbených kliknutím na srdíčko
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 md:py-8 px-4">
      <h1 className="mb-4 md:mb-6 text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
        Oblíbené skladby
      </h1>
      
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 md:gap-4">
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
                  <Music className="h-12 md:h-16 w-12 md:w-16 text-muted-foreground opacity-50" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="lg"
                  className="h-12 w-12 md:h-14 md:w-14 rounded-full neon-glow"
                  onClick={() => handlePlaySong(song, index)}
                >
                  <Play className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 backdrop-blur hover:bg-black/80"
                onClick={() => removeFavorite(song.id)}
              >
                <Heart className="h-4 w-4 fill-primary text-primary" />
              </Button>
            </div>
            <CardContent className="p-3 md:p-4">
              <h3 className="font-semibold truncate text-sm md:text-base">{song.title}</h3>
              <p className="text-xs md:text-sm text-muted-foreground truncate">{song.artist}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
