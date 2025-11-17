import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer } from "@/contexts/PlayerContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Play, Music, Search } from "lucide-react";
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
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { playSong, playQueue } = usePlayer();

  useEffect(() => {
    fetchSongs();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredSongs(songs);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = songs.filter(
        (song) =>
          song.title.toLowerCase().includes(query) ||
          song.artist.toLowerCase().includes(query) ||
          song.description?.toLowerCase().includes(query)
      );
      setFilteredSongs(filtered);
    }
  }, [searchQuery, songs]);

  const fetchSongs = async () => {
    try {
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSongs(data || []);
      setFilteredSongs(data || []);
    } catch (error: any) {
      toast.error("Nepodařilo se načíst skladby");
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
      <div className="container py-6 md:py-8 px-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 md:gap-4">
          {[...Array(10)].map((_, i) => (
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
          <Music className="mx-auto h-12 md:h-16 w-12 md:w-16 text-primary opacity-50 neon-glow" />
          <h2 className="mt-4 text-xl md:text-2xl font-bold">Zatím žádné skladby</h2>
          <p className="mt-2 text-sm md:text-base text-muted-foreground">
            Knihovna je prázdná. Zkontrolujte to brzy!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 md:py-8 px-4">
      <h1 className="mb-4 md:mb-6 text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
        Hudební knihovna
      </h1>
      
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Hledat podle názvu, interpreta..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 neon-glow"
        />
      </div>

      {filteredSongs.length === 0 && searchQuery && (
        <div className="text-center py-8">
          <Music className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
          <p className="text-muted-foreground">Žádné skladby nenalezeny pro "{searchQuery}"</p>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 md:gap-4">
        {filteredSongs.map((song, index) => (
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
