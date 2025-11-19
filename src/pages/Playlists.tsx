import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ListMusic, Music, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
}

export default function Playlists() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({
    name: "",
    description: "",
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchPlaylists();
  }, []);

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
      setLoading(false);
    }
  };

  const sanitizeFileName = (fileName: string) => {
    return fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s.-]/g, "")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_");
  };

  const handleCreatePlaylist = async () => {
    if (!user || !newPlaylist.name.trim()) {
      toast.error("Vyplňte název playlistu");
      return;
    }

    setCreating(true);

    try {
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

      const { error } = await supabase.from("playlists").insert({
        name: newPlaylist.name.trim(),
        description: newPlaylist.description.trim() || null,
        cover_url: coverUrl,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success("Playlist byl vytvořen");
      setNewPlaylist({ name: "", description: "" });
      setCoverFile(null);
      setShowCreateDialog(false);
      fetchPlaylists();
    } catch (error: any) {
      toast.error("Nepodařilo se vytvořit playlist");
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <p className="text-center text-muted-foreground">Loading playlists...</p>
      </div>
    );
  }

  if (playlists.length === 0 && !loading) {
    return (
      <div className="container py-6 md:py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Playlisty
          </h1>
          {user && (
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nový playlist
            </Button>
          )}
        </div>

        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <ListMusic className="mx-auto h-16 w-16 text-muted-foreground opacity-50" />
            <h2 className="mt-4 text-2xl font-bold">Zatím žádné playlisty</h2>
            <p className="mt-2 text-muted-foreground">
              {user 
                ? "Vytvořte si svůj první playlist kliknutím na tlačítko výše!" 
                : "Pro vytváření playlistů se prosím přihlaste"}
            </p>
          </div>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Vytvořit nový playlist</DialogTitle>
              <DialogDescription>
                Vytvořte si vlastní playlist pro vaše oblíbené skladby
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="playlist-name">Název *</Label>
                <Input
                  id="playlist-name"
                  value={newPlaylist.name}
                  onChange={(e) =>
                    setNewPlaylist({ ...newPlaylist, name: e.target.value })
                  }
                  placeholder="Např. Moje oblíbené"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="playlist-description">Popis</Label>
                <Textarea
                  id="playlist-description"
                  value={newPlaylist.description}
                  onChange={(e) =>
                    setNewPlaylist({ ...newPlaylist, description: e.target.value })
                  }
                  placeholder="Přidejte popis (volitelné)"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="playlist-cover">Obrázek (volitelné)</Label>
                <Input
                  id="playlist-cover"
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
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewPlaylist({ name: "", description: "" });
                  setCoverFile(null);
                }}
                disabled={creating}
              >
                Zrušit
              </Button>
              <Button onClick={handleCreatePlaylist} disabled={creating}>
                {creating ? "Vytvářím..." : "Vytvořit"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="container py-6 md:py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Playlisty
        </h1>
        {user && (
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nový playlist
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {playlists.map((playlist) => (
          <Link key={playlist.id} to={`/playlist/${playlist.id}`}>
            <Card className="group overflow-hidden border-border bg-card transition-all hover:shadow-glow hover:scale-105">
              <div className="relative aspect-video overflow-hidden bg-muted">
                {playlist.cover_url ? (
                  <img
                    src={playlist.cover_url}
                    alt={playlist.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ListMusic className="h-16 w-16 text-muted-foreground opacity-50" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg">{playlist.name}</h3>
                {playlist.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {playlist.description}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Vytvořit nový playlist</DialogTitle>
            <DialogDescription>
              Vytvořte si vlastní playlist pro vaše oblíbené skladby
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="playlist-name">Název *</Label>
              <Input
                id="playlist-name"
                value={newPlaylist.name}
                onChange={(e) =>
                  setNewPlaylist({ ...newPlaylist, name: e.target.value })
                }
                placeholder="Např. Moje oblíbené"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="playlist-description">Popis</Label>
              <Textarea
                id="playlist-description"
                value={newPlaylist.description}
                onChange={(e) =>
                  setNewPlaylist({ ...newPlaylist, description: e.target.value })
                }
                placeholder="Přidejte popis (volitelné)"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="playlist-cover">Obrázek (volitelné)</Label>
              <Input
                id="playlist-cover"
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
              onClick={() => {
                setShowCreateDialog(false);
                setNewPlaylist({ name: "", description: "" });
                setCoverFile(null);
              }}
              disabled={creating}
            >
              Zrušit
            </Button>
            <Button onClick={handleCreatePlaylist} disabled={creating}>
              {creating ? "Vytvářím..." : "Vytvořit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
