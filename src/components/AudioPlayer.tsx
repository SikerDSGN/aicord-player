import { usePlayer } from "@/contexts/PlayerContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Volume2, Shuffle, Repeat, Repeat1 } from "lucide-react";

export function AudioPlayer() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    shuffle,
    repeat,
    togglePlay,
    seekTo,
    setVolume,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat,
  } = usePlayer();

  if (!currentSong) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border/50 bg-gradient-card backdrop-blur-lg shadow-elevated">
      <div className="container px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Song Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {currentSong.cover_url && (
              <img
                src={currentSong.cover_url}
                alt={currentSong.title}
                className="h-12 w-12 rounded-lg object-cover shadow-glow-soft hover-scale"
              />
            )}
            <div className="min-w-0 animate-fade-in-fast">
              <p className="font-semibold truncate text-foreground">{currentSong.title}</p>
              <p className="text-sm text-muted-foreground truncate">{currentSong.artist}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={toggleShuffle}
                className={shuffle ? "text-primary" : ""}
              >
                <Shuffle className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={playPrevious}>
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={togglePlay} className="h-10 w-10 rounded-full bg-gradient-primary shadow-glow-soft hover:shadow-glow hover:scale-110 transition-smooth">
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={playNext}>
                <SkipForward className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={toggleRepeat}
                className={repeat !== "off" ? "text-primary" : ""}
              >
                {repeat === "one" ? (
                  <Repeat1 className="h-4 w-4" />
                ) : (
                  <Repeat className="h-4 w-4" />
                )}
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
