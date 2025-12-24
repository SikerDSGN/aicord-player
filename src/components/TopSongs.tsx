import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer } from "@/contexts/PlayerContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Play, Pause, TrendingUp } from "lucide-react";

interface TopSong {
  id: string;
  title: string;
  artist: string;
  cover_url: string | null;
  play_count: number;
  audio_url: string;
  video_url: string | null;
}

export function TopSongs() {
  const [topSongs, setTopSongs] = useState<TopSong[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentSong, isPlaying, togglePlay, playQueue } = usePlayer();

  useEffect(() => {
    fetchTopSongs();
  }, []);

  const fetchTopSongs = async () => {
    try {
      const { data, error } = await supabase
        .from("songs")
        .select("id, title, artist, cover_url, play_count, audio_url, video_url")
        .order("play_count", { ascending: false })
        .limit(10);

      if (error) throw error;
      setTopSongs(data || []);
    } catch (error) {
      console.error("Error fetching top songs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (song: TopSong, index: number) => {
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      playQueue(topSongs as any, index);
    }
  };

  const formatPlayCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-card to-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Nejhranější skladby
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded bg-muted" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (topSongs.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-card to-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Nejhranější skladby
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {topSongs.map((song, index) => {
          const isCurrentlyPlaying = currentSong?.id === song.id;

          return (
            <div
              key={song.id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                isCurrentlyPlaying
                  ? "bg-primary/10"
                  : "hover:bg-muted/50"
              }`}
            >
              {/* Rank */}
              <span className={`w-6 text-center font-bold ${
                index < 3 ? "text-primary" : "text-muted-foreground"
              }`}>
                {index + 1}
              </span>

              {/* Cover */}
              <div className="relative h-10 w-10 rounded overflow-hidden bg-muted flex-shrink-0">
                {song.cover_url ? (
                  <img
                    src={song.cover_url}
                    alt={song.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Music className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm truncate ${
                  isCurrentlyPlaying ? "text-primary" : ""
                }`}>
                  {song.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {song.artist}
                </p>
              </div>

              {/* Play Count */}
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {formatPlayCount(song.play_count)} ▶
              </span>

              {/* Play Button */}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => handlePlay(song, index)}
              >
                {isCurrentlyPlaying && isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
