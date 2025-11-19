import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer } from "@/contexts/PlayerContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Music, ArrowLeft, Trash2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Song {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  cover_url: string | null;
}

interface PlaylistTrack {
  id: string;
  song_id: string;
  position: number;
  songs: Song;
}

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  created_by: string;
}

export default function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playQueue, currentSong, togglePlay, isPlaying, setNavigate } = usePlayer();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [trackToDelete, setTrackToDelete] = useState<string | null>(null);

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate, setNavigate]);

  useEffect(() => {
    if (id) {
      fetchPlaylist();
      fetchTracks();
      fetchAllSongs();
    }
  }, [id]);

  const fetchPlaylist = async () => {
    try {
      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setPlaylist(data);
    } catch (error: any) {
      toast.error("Nepodařilo se načíst playlist");
      console.error(error);
    }
  };

  const fetchTracks = async () => {
    try {
      const { data, error } = await supabase
        .from("playlist_tracks")
        .select("*, songs(*)")
        .eq("playlist_id", id)
        .order("position", { ascending: true });

      if (error) throw error;
      setTracks(data || []);
    } catch (error: any) {
      toast.error("Nepodařilo se načíst skladby");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSongs = async () => {
    try {
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .order("title");

      if (error) throw error;
      setAllSongs(data || []);
    } catch (error: any) {
      console.error(error);
    }
  };

  const handlePlayPlaylist = () => {
    const songs = tracks.map((t) => t.songs);
    playQueue(songs, 0);
  };

  const handlePlaySong = (index: number) => {
    const songs = tracks.map((t) => t.songs);
    const song = songs[index];
    
    // If clicking on currently playing song, just toggle play/pause
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      playQueue(songs, index);
    }
  };

  const handleAddSong = async (songId: string) => {
    if (!playlist || !user) return;

    try {
      const maxPosition = tracks.length > 0 
        ? Math.max(...tracks.map((t) => t.position)) 
        : -1;

      const { error } = await supabase.from("playlist_tracks").insert({
        playlist_id: playlist.id,
        song_id: songId,
        position: maxPosition + 1,
      });

      if (error) throw error;

      toast.success("Skladba přidána do playlistu");
      fetchTracks();
      setShowAddDialog(false);
      setSearchQuery("");
    } catch (error: any) {
      toast.error("Nepodařilo se přidat skladbu");
      console.error(error);
    }
  };

  const handleRemoveTrack = async () => {
    if (!trackToDelete) return;

    try {
      const { error } = await supabase
        .from("playlist_tracks")
        .delete()
        .eq("id", trackToDelete);

      if (error) throw error;

      toast.success("Skladba odebrána z playlistu");
      fetchTracks();
      setTrackToDelete(null);
    } catch (error: any) {
      toast.error("Nepodařilo se odebrat skladbu");
      console.error(error);
    }
  };

  const isOwner = user && playlist && user.id === playlist.created_by;

  const filteredSongs = allSongs.filter((song) => {
    const alreadyInPlaylist = tracks.some((t) => t.song_id === song.id);
    const matchesSearch = searchQuery.trim() === "" ||
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase());
    return !alreadyInPlaylist && matchesSearch;
  });

  if (loading) {
    return (
      <div className="container py-8">
        <p className="text-center text-muted-foreground">Načítání...</p>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="container py-8">
        <p className="text-center text-muted-foreground">Playlist nenalezen</p>
      </div>
    );
  }

  return (
    <div className="container py-6 md:py-8 px-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/playlists")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Zpět na playlisty
      </Button>

      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-full md:w-64 aspect-square rounded-lg overflow-hidden bg-muted">
            {playlist.cover_url ? (
              <img
                src={playlist.cover_url}
                alt={playlist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Music className="h-24 w-24 text-muted-foreground opacity-50" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">
              {playlist.name}
            </h1>
            {playlist.description && (
              <p className="text-muted-foreground mb-4">{playlist.description}</p>
            )}
            <p className="text-sm text-muted-foreground mb-4">
              {tracks.length} {tracks.length === 1 ? "skladba" : "skladby"}
            </p>
            <div className="flex gap-2">
              <Button
                size="lg"
                onClick={handlePlayPlaylist}
                disabled={tracks.length === 0}
                className="gap-2"
              >
                <Play className="h-5 w-5" />
                Přehrát vše
              </Button>
              {isOwner && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowAddDialog(true)}
                  className="gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Přidat skladbu
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {tracks.length === 0 ? (
        <div className="text-center py-12">
          <Music className="mx-auto h-16 w-16 text-muted-foreground opacity-50 mb-4" />
          <p className="text-muted-foreground">
            Tento playlist zatím neobsahuje žádné skladby
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tracks.map((track, index) => {
            const isCurrentlyPlaying = currentSong?.id === track.songs.id;
            return (
              <Card
                key={track.id}
                className={`group overflow-hidden border transition-all hover:shadow-glow ${
                  isCurrentlyPlaying
                    ? "border-primary shadow-glow-soft bg-gradient-card"
                    : "border-border bg-card"
                }`}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <span className="text-muted-foreground w-8 text-center">
                    {index + 1}
                  </span>
                  <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                    {track.songs.cover_url ? (
                      <img
                        src={track.songs.cover_url}
                        alt={track.songs.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Music className="h-6 w-6 text-muted-foreground opacity-50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-semibold truncate ${
                        isCurrentlyPlaying ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {track.songs.title}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {track.songs.artist}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePlaySong(index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {isCurrentlyPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTrackToDelete(track.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Přidat skladbu do playlistu</DialogTitle>
            <DialogDescription>Vyberte skladbu k přidání</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Hledat skladby..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {filteredSongs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {searchQuery ? "Žádné skladby nenalezeny" : "Všechny skladby jsou již v playlistu"}
                </p>
              ) : (
                filteredSongs.map((song) => (
                  <Card
                    key={song.id}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleAddSong(song.id)}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                        {song.cover_url ? (
                          <img
                            src={song.cover_url}
                            alt={song.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Music className="h-5 w-5 text-muted-foreground opacity-50" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{song.title}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {song.artist}
                        </p>
                      </div>
                      <Plus className="h-5 w-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!trackToDelete} onOpenChange={() => setTrackToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Odebrat skladbu z playlistu?</AlertDialogTitle>
            <AlertDialogDescription>
              Skladba bude odebrána z tohoto playlistu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveTrack}
              className="bg-destructive hover:bg-destructive/90"
            >
              Odebrat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
