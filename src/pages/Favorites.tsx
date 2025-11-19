import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer } from "@/contexts/PlayerContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Music, Heart } from "lucide-react";
import { toast } from "sonner";
import { LoadingGrid } from "@/components/LoadingSkeletons";
import { useNavigate } from "react-router-dom";

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
  const { playQueue, currentSong, togglePlay, isPlaying, setNavigate } = usePlayer();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate, setNavigate]);

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
    // If clicking on currently playing song and it's playing, just toggle pause
    if (currentSong?.id === song.id && isPlaying) {
      togglePlay();
    } else if (currentSong?.id === song.id && !isPlaying) {
      // If same song but paused, resume and navigate to player
      togglePlay();
      navigate("/now-playing");
    } else {
      // Different song, play it and navigate
      playQueue(songs, index);
    }
  };

  if (loading) {
    return (
      <div className="container py-6 md:py-8 px-4">
        <h1 className="mb-4 md:mb-6 text-2xl md:text-3xl font-bold text-foreground">
          Oblíbené skladby
        </h1>
        <LoadingGrid count={6} type="song" />
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
      <h1 className="mb-4 md:mb-6 text-2xl md:text-3xl font-bold text-foreground">
        Oblíbené skladby
      </h1>
      
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 md:gap-4">
        {songs.map((song, index) => {
          const isCurrentlyPlaying = currentSong?.id === song.id;
          
          return (
            <Card
              key={song.id}
              className={`group overflow-hidden border transition-all hover:shadow-glow hover:scale-105 ${
                isCurrentlyPlaying 
                  ? "border-primary shadow-glow-soft bg-gradient-card" 
                  : "border-border bg-card"
              }`}
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
                    variant="glow"
                    className="h-12 w-12 md:h-14 md:w-14 rounded-full"
                    onClick={() => handlePlaySong(song, index)}
                  >
                    {isCurrentlyPlaying && isPlaying ? (
                      <Pause className="h-5 w-5 md:h-6 md:w-6" />
                    ) : (
                      <Play className="h-5 w-5 md:h-6 md:w-6" />
                    )}
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
                <h3 className={`font-semibold truncate text-sm md:text-base ${
                  isCurrentlyPlaying ? "text-primary" : "text-foreground"
                }`}>
                  {song.title}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground truncate">{song.artist}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
