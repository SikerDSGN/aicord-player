import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer } from "@/contexts/PlayerContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Music, Search, Heart, Trash2, Pencil, Plus, ListMusic, Share2 } from "lucide-react";
import { toast } from "sonner";
import { LoadingGrid } from "@/components/LoadingSkeletons";
import { Link } from "react-router-dom";
import { SharePlaylistDialog } from "@/components/SharePlaylistDialog";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Song {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  cover_url: string | null;
  description: string | null;
}

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
}

export default function Library() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [playlistsLoading, setPlaylistsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [songToDelete, setSongToDelete] = useState<string | null>(null);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [showCreatePlaylistDialog, setShowCreatePlaylistDialog] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [newPlaylist, setNewPlaylist] = useState({
    name: "",
    description: "",
  });
  const [playlistCoverFile, setPlaylistCoverFile] = useState<File | null>(null);
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    artist: "",
    description: "",
    cover_url: "",
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { playSong, playQueue, currentSong } = usePlayer();
  const { user, userRole } = useAuth();

  useEffect(() => {
    fetchSongs();
    fetchPlaylists();
    if (user) {
      fetchFavorites();
    }
  }, [user]);

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

  const fetchPlaylists = async () => {
    try {
      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPlaylists(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setPlaylistsLoading(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!user || !newPlaylist.name.trim()) {
      toast.error("Vyplňte název playlistu");
      return;
    }

    setCreatingPlaylist(true);

    try {
      let coverUrl = null;

      if (playlistCoverFile) {
        const sanitizedCoverName = sanitizeFileName(playlistCoverFile.name);
        const coverFileName = `${Date.now()}-${sanitizedCoverName}`;
        const { error: coverError } = await supabase.storage
          .from("covers")
          .upload(coverFileName, playlistCoverFile);

        if (coverError) throw coverError;

        const { data: coverData } = supabase.storage
          .from("covers")
          .getPublicUrl(coverFileName);

        coverUrl = coverData.publicUrl;
      }

      const { error } = await supabase.from("playlists").insert({
        name: newPlaylist.name.trim(),
        description: newPlaylist.description.trim() || null,
        cover_url: coverUrl,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success("Playlist byl vytvořen");
      setNewPlaylist({ name: "", description: "" });
      setPlaylistCoverFile(null);
      setShowCreatePlaylistDialog(false);
      fetchPlaylists();
    } catch (error: any) {
      toast.error("Nepodařilo se vytvořit playlist");
      console.error(error);
    } finally {
      setCreatingPlaylist(false);
    }
  };

  const handlePlaySong = (song: Song, index: number) => {
    playQueue(songs, index);
  };

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("song_id")
        .eq("user_id", user?.id);

      if (error) throw error;
      
      const favoriteIds = new Set(data?.map((fav) => fav.song_id) || []);
      setFavorites(favoriteIds);
    } catch (error: any) {
      console.error("Error fetching favorites:", error);
    }
  };

  const toggleFavorite = async (songId: string) => {
    if (!user) {
      toast.error("Pro přidání do oblíbených se přihlaste");
      return;
    }

    const isFavorite = favorites.has(songId);

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("song_id", songId);

        if (error) throw error;
        
        setFavorites((prev) => {
          const newFavorites = new Set(prev);
          newFavorites.delete(songId);
          return newFavorites;
        });
        toast.success("Odebráno z oblíbených");
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, song_id: songId });

        if (error) throw error;
        
        setFavorites((prev) => new Set(prev).add(songId));
        toast.success("Přidáno do oblíbených");
      }
    } catch (error: any) {
      toast.error("Chyba při aktualizaci oblíbených");
      console.error(error);
    }
  };

  const handleDeleteSong = async (songId: string) => {
    try {
      const { error } = await supabase
        .from("songs")
        .delete()
        .eq("id", songId);

      if (error) throw error;

      setSongs((prev) => prev.filter((s) => s.id !== songId));
      setFilteredSongs((prev) => prev.filter((s) => s.id !== songId));
      toast.success("Skladba byla smazána");
      setSongToDelete(null);
    } catch (error: any) {
      toast.error("Nepodařilo se smazat skladbu");
      console.error(error);
    }
  };

  const openEditDialog = (song: Song) => {
    setEditingSong(song);
    setEditForm({
      title: song.title,
      artist: song.artist,
      description: song.description || "",
      cover_url: song.cover_url || "",
    });
    setCoverFile(null);
  };

  const sanitizeFileName = (fileName: string) => {
    return fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s.-]/g, "")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_");
  };

  const handleUpdateSong = async () => {
    if (!editingSong) return;

    setUploading(true);

    try {
      let coverUrl = editForm.cover_url;

      // Upload new cover if provided
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

      const { error } = await supabase
        .from("songs")
        .update({
          title: editForm.title,
          artist: editForm.artist,
          description: editForm.description || null,
          cover_url: coverUrl,
        })
        .eq("id", editingSong.id);

      if (error) throw error;

      toast.success("Skladba byla aktualizována");
      
      // Update local state
      setSongs((prev) =>
        prev.map((song) =>
          song.id === editingSong.id
            ? { ...song, ...editForm, cover_url: coverUrl }
            : song
        )
      );
      setFilteredSongs((prev) =>
        prev.map((song) =>
          song.id === editingSong.id
            ? { ...song, ...editForm, cover_url: coverUrl }
            : song
        )
      );
      
      setEditingSong(null);
      setCoverFile(null);
    } catch (error: any) {
      toast.error("Nepodařilo se aktualizovat skladbu");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-6 md:py-8 px-4">
        <h1 className="mb-4 md:mb-6 text-2xl md:text-3xl font-bold text-foreground">
          Knihovna
        </h1>
        <LoadingGrid count={10} type="song" />
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
      <h1 className="mb-4 md:mb-6 text-2xl md:text-3xl font-bold text-foreground">
        Hudební knihovna
      </h1>
      
      <Tabs defaultValue="songs" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="songs" className="gap-2">
            <Music className="h-4 w-4" />
            Všechny skladby
          </TabsTrigger>
          <TabsTrigger value="playlists" className="gap-2">
            <ListMusic className="h-4 w-4" />
            Playlisty
          </TabsTrigger>
        </TabsList>

        {/* Songs Tab */}
        <TabsContent value="songs" className="mt-0">
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Hledat podle názvu, interpreta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredSongs.length === 0 && searchQuery && (
            <div className="text-center py-8">
              <Music className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">Žádné skladby nenalezeny pro "{searchQuery}"</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 md:gap-4">
            {filteredSongs.map((song, index) => {
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
                        <Play className="h-5 w-5 md:h-6 md:w-6" />
                      </Button>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 rounded-full bg-black/60 backdrop-blur hover:bg-black/80"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(song.id);
                        }}
                      >
                        <Heart 
                          className={`h-4 w-4 ${
                            favorites.has(song.id)
                              ? "fill-primary text-primary"
                              : "text-white"
                          }`}
                        />
                      </Button>
                      {userRole === "admin" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 rounded-full bg-black/60 backdrop-blur hover:bg-primary/80"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(song);
                            }}
                          >
                            <Pencil className="h-4 w-4 text-white" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 rounded-full bg-black/60 backdrop-blur hover:bg-destructive/80"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSongToDelete(song.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-white" />
                          </Button>
                        </>
                      )}
                    </div>
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
        </TabsContent>

        {/* Playlists Tab */}
        <TabsContent value="playlists" className="mt-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Vaše playlisty</h2>
            {user && (
              <Button onClick={() => setShowCreatePlaylistDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Nový playlist
              </Button>
            )}
          </div>

          {playlistsLoading ? (
            <LoadingGrid count={6} type="playlist" />
          ) : playlists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ListMusic className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Žádné playlisty</h3>
              <p className="text-muted-foreground text-center mb-4">
                {user ? "Vytvořte svůj první playlist" : "Přihlaste se pro vytvoření playlistu"}
              </p>
              {user && (
                <Button onClick={() => setShowCreatePlaylistDialog(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Vytvořit playlist
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {playlists.map((playlist) => (
                <Card key={playlist.id} className="group overflow-hidden border-border bg-card transition-all hover:shadow-glow">
                  <Link to={`/playlist/${playlist.id}`}>
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      {playlist.cover_url ? (
                        <img
                          src={playlist.cover_url}
                          alt={playlist.name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ListMusic className="h-16 w-16 text-muted-foreground opacity-30" />
                        </div>
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/playlist/${playlist.id}`} className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{playlist.name}</h3>
                        {playlist.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {playlist.description}
                          </p>
                        )}
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedPlaylist(playlist);
                          setShareDialogOpen(true);
                        }}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Song Dialog */}
      <AlertDialog open={!!songToDelete} onOpenChange={() => setSongToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat skladbu?</AlertDialogTitle>
            <AlertDialogDescription>
              Tato akce je nevratná. Skladba bude trvale smazána z knihovny.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => songToDelete && handleDeleteSong(songToDelete)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Song Dialog */}
      <Dialog open={!!editingSong} onOpenChange={() => setEditingSong(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upravit skladbu</DialogTitle>
            <DialogDescription>
              Změňte informace o skladbě
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Název</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-artist">Interpret</Label>
              <Input
                id="edit-artist"
                value={editForm.artist}
                onChange={(e) =>
                  setEditForm({ ...editForm, artist: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Popis</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cover">Nový obrázek (volitelné)</Label>
              <Input
                id="edit-cover"
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              />
              {coverFile && (
                <p className="text-sm text-muted-foreground">{coverFile.name}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingSong(null)}
              disabled={uploading}
            >
              Zrušit
            </Button>
            <Button onClick={handleUpdateSong} disabled={uploading}>
              {uploading ? "Ukládám..." : "Uložit změny"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Playlist Dialog */}
      <Dialog open={showCreatePlaylistDialog} onOpenChange={setShowCreatePlaylistDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vytvořit nový playlist</DialogTitle>
            <DialogDescription>
              Vytvořte playlist pro organizaci vaší hudby
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="playlist-name">Název *</Label>
              <Input
                id="playlist-name"
                placeholder="Můj playlist"
                value={newPlaylist.name}
                onChange={(e) => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="playlist-description">Popis</Label>
              <Textarea
                id="playlist-description"
                placeholder="Popis playlistu..."
                value={newPlaylist.description}
                onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="playlist-cover">Obrázek</Label>
              <Input
                id="playlist-cover"
                type="file"
                accept="image/*"
                onChange={(e) => setPlaylistCoverFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePlaylistDialog(false)}>
              Zrušit
            </Button>
            <Button onClick={handleCreatePlaylist} disabled={creatingPlaylist}>
              {creatingPlaylist ? "Vytváření..." : "Vytvořit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Playlist Dialog */}
      {selectedPlaylist && (
        <SharePlaylistDialog
          playlistId={selectedPlaylist.id}
          playlistName={selectedPlaylist.name}
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
        />
      )}
    </div>
  );
}
