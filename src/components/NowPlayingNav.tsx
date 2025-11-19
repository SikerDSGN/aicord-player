import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, Home } from "lucide-react";
import aicordLogo from "@/assets/aicord-logo.png";

export function NowPlayingNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 border-b border-border/30 bg-gradient-card/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 md:gap-3 hover-scale">
          <img src={aicordLogo} alt="Aicord Logo" className="h-8 md:h-10 w-auto" />
          <span className="text-lg md:text-xl font-bold text-primary">
            Aicord PLAYER
          </span>
        </Link>

        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Zpět do knihovny</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
