import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Library, Users, Upload, LogOut, Menu, X, Heart } from "lucide-react";
import aicordLogo from "@/assets/aicord-logo-small.webp";
import { useState } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { signOut, userRole } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile Menu Overlay - Outside main container */}
      {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-16 left-0 right-0 bottom-0 bg-card border-t border-border z-[101] md:hidden overflow-y-auto">
            <nav className="container flex flex-col gap-2 p-4">
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant={isActive("/") ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                >
                  <Library className="mr-2 h-4 w-4" />
                  Knihovna
                </Button>
              </Link>

              <Link to="/favorites" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant={isActive("/favorites") ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                >
                  <Heart className="mr-2 h-4 w-4" />
                  Oblíbené
                </Button>
              </Link>

              {userRole === "admin" && (
                <>
                  <Link to="/admin/users" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant={isActive("/admin/users") ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Uživatelé
                    </Button>
                  </Link>
                  <Link to="/admin/upload" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant={isActive("/admin/upload") ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Nahrát
                    </Button>
                  </Link>
                </>
              )}

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
                className="w-full justify-start"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Odhlásit
              </Button>
            </nav>
          </div>
        </>
      )}

      <div className="flex min-h-screen flex-col bg-gradient-dark">
        <header className="sticky top-0 z-50 border-b border-border/50 bg-gradient-card backdrop-blur-lg shadow-elevated supports-[backdrop-filter]:bg-card/60">
          <div className="container flex h-16 items-center justify-between px-4">
            <Link to="/" className="flex items-center gap-2 md:gap-3 hover-scale">
              <img src={aicordLogo} alt="Aicord Logo" width="48" height="48" className="h-8 md:h-12 w-auto" />
              <span className="text-lg md:text-xl font-bold text-primary">
                Aicord PLAYER
              </span>
            </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <Link to="/">
              <Button
                variant={isActive("/") ? "default" : "ghost"}
                size="sm"
              >
                <Library className="mr-2 h-4 w-4" />
                Knihovna
              </Button>
            </Link>

            <Link to="/favorites">
              <Button
                variant={isActive("/favorites") ? "default" : "ghost"}
                size="sm"
              >
                <Heart className="mr-2 h-4 w-4" />
                Oblíbené
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
                    Uživatelé
                  </Button>
                </Link>
                <Link to="/admin/upload">
                  <Button
                    variant={isActive("/admin/upload") ? "default" : "ghost"}
                    size="sm"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Nahrát
                  </Button>
                </Link>
              </>
            )}

            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Odhlásit
            </Button>
          </nav>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </>
  );
}
