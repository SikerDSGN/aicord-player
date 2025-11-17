import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Music, Library, ListMusic, Users, Upload, LogOut } from "lucide-react";
import { AudioPlayer } from "./AudioPlayer";
import aicordLogo from "@/assets/aicord-logo.png";

export function Layout({ children }: { children: React.ReactNode }) {
  const { signOut, userRole } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-dark">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={aicordLogo} alt="Aicord Logo" className="h-12 w-auto" />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Aicord PLAYER
            </span>
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
