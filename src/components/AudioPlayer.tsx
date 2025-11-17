import { usePlayer } from "@/contexts/PlayerContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";

export function AudioPlayer() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlay,
    seekTo,
    setVolume,
    playNext,
    playPrevious,
  } = usePlayer();

  if (!currentSong) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-card shadow-glow">
      <div className="container px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Song Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {currentSong.cover_url && (
              <img
                src={currentSong.cover_url}
                alt={currentSong.title}
                className="h-12 w-12 rounded object-cover"
              />
            )}
            <div className="min-w-0">
              <p className="font-semibold truncate">{currentSong.title}</p>
              <p className="text-sm text-muted-foreground truncate">{currentSong.artist}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={playPrevious}>
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={togglePlay} className="h-9 w-9 rounded-full">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={playNext}>
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2 w-full max-w-md">
              <span className="text-xs text-muted-foreground w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                min={0}
                max={duration || 100}
                step={1}
                onValueChange={(value) => seekTo(value[0])}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-10">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[volume * 100]}
              min={0}
              max={100}
              step={1}
              onValueChange={(value) => setVolume(value[0] / 100)}
              className="w-24"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
