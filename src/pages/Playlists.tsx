import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ListMusic, Music } from "lucide-react";
import { Link } from "react-router-dom";

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
}

export default function Playlists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="container py-8">
        <p className="text-center text-muted-foreground">Loading playlists...</p>
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <ListMusic className="mx-auto h-16 w-16 text-muted-foreground opacity-50" />
          <h2 className="mt-4 text-2xl font-bold">No playlists yet</h2>
          <p className="mt-2 text-muted-foreground">
            Check back soon for curated playlists!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold bg-gradient-secondary bg-clip-text text-transparent">
        Playlists
      </h1>

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
    </div>
  );
}
