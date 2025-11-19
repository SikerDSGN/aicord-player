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
      
      <div className="flex flex-col gap-2">
        {songs.map((song, index) => {
          const isCurrentlyPlaying = currentSong?.id === song.id;
          
          return (
            <Card
              key={song.id}
              className={`group overflow-hidden border transition-all hover:shadow-glow ${
                isCurrentlyPlaying 
                  ? "border-primary shadow-glow-soft bg-gradient-card" 
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center gap-3 p-2 md:p-3">
                {/* Cover Image */}
                <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                  {song.cover_url ? (
                    <img
                      src={song.cover_url}
                      alt={song.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Music className="h-8 w-8 text-muted-foreground opacity-50" />
                    </div>
                  )}
                </div>

                {/* Song Info */}
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold truncate text-sm md:text-base ${
                    isCurrentlyPlaying ? "text-primary" : "text-foreground"
                  }`}>
                    {song.title}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">{song.artist}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 w-9 md:h-10 md:w-10 rounded-full hover:bg-primary/20"
                    onClick={() => handlePlaySong(song, index)}
                  >
                    {isCurrentlyPlaying && isPlaying ? (
                      <Pause className="h-4 w-4 md:h-5 md:w-5" />
                    ) : (
                      <Play className="h-4 w-4 md:h-5 md:w-5" />
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 w-9 md:h-10 md:w-10 rounded-full hover:bg-destructive/20"
                    onClick={() => removeFavorite(song.id)}
                  >
                    <Heart className="h-4 w-4 md:h-5 md:w-5 fill-primary text-primary" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
