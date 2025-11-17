import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Music, Library, ListMusic, Users, Upload, LogOut } from "lucide-react";
import { AudioPlayer } from "./AudioPlayer";

export function Layout({ children }: { children: React.ReactNode }) {
  const { signOut, userRole } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-dark">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
              <Music className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">J-Bublák Player</span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link to="/">
              <Button
                variant={isActive("/") ? "default" : "ghost"}
                size="sm"
              >
                <Library className="mr-2 h-4 w-4" />
                Library
              </Button>
            </Link>
            
            <Link to="/playlists">
              <Button
                variant={isActive("/playlists") ? "default" : "ghost"}
                size="sm"
              >
                <ListMusic className="mr-2 h-4 w-4" />
                Playlists
              </Button>
            </Link>

            {userRole === "admin" && (
              <>
                <Link to="/admin/users">
                  <Button
                    variant={isActive("/admin/users") ? "default" : "ghost"}
                    size="sm"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Users
                  </Button>
                </Link>
                <Link to="/admin/upload">
                  <Button
                    variant={isActive("/admin/upload") ? "default" : "ghost"}
                    size="sm"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </Link>
              </>
            )}

            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 pb-24">
        {children}
      </main>

      <AudioPlayer />
    </div>
  );
}
