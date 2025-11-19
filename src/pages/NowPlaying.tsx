import { useState } from "react";
import { usePlayer } from "@/contexts/PlayerContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { AudioVisualizer } from "@/components/AudioVisualizer";
import { NowPlayingNav } from "@/components/NowPlayingNav";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Shuffle, 
  Repeat, 
  Repeat1,
  List,
  Music
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function NowPlaying() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    queue,
    shuffle,
    repeat,
    audioRef,
    togglePlay,
    seekTo,
    setVolume,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat,
    playQueue,
  } = usePlayer();

  const [queueOpen, setQueueOpen] = useState(false);

  if (!currentSong) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Music className="mx-auto h-16 w-16 text-muted-foreground opacity-50" />
          <h2 className="mt-4 text-2xl font-bold">Žádná skladba se nepřehrává</h2>
          <p className="mt-2 text-muted-foreground">Začněte přehrávat z knihovny</p>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentIndex = queue.findIndex(song => song.id === currentSong.id);

  return (
    <>
      <NowPlayingNav />
      
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20 pt-16">
      {/* Main Content */}
      <div className="flex-1 container max-w-4xl mx-auto px-4 py-8 flex flex-col items-center justify-center">
        {/* Album Art */}
        <div className="relative mb-8 animate-fade-in">
          <div className="relative w-72 h-72 md:w-96 md:h-96 rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 hover-scale transition-smooth">
            {currentSong.cover_url ? (
              <img
                src={currentSong.cover_url}
                alt={currentSong.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Music className="h-32 w-32 text-primary opacity-30" />
              </div>
            )}
          </div>
        </div>

        {/* Song Info */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">
            {currentSong.title}
          </h1>
          <p className="text-xl text-muted-foreground">{currentSong.artist}</p>
          {currentSong.description && (
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              {currentSong.description}
            </p>
          )}
        </div>

        {/* Audio Visualizer */}
        <div className="w-full max-w-2xl mb-8">
          <AudioVisualizer audioElement={audioRef.current} isPlaying={isPlaying} />
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-2xl mb-8">
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={1}
            onValueChange={(value) => seekTo(value[0])}
            className="mb-2 cursor-pointer"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(duration - currentTime)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <Button
              size="lg"
              variant="ghost"
              onClick={toggleShuffle}
              className={shuffle ? "text-primary" : ""}
            >
              <Shuffle className="h-5 w-5" />
            </Button>
            
            <Button 
              size="lg" 
              variant="ghost" 
              onClick={playPrevious}
              disabled={currentIndex <= 0}
            >
              <SkipBack className="h-6 w-6" />
            </Button>
            
            <Button
              size="lg"
              onClick={togglePlay}
              className="h-16 w-16 rounded-full bg-gradient-primary shadow-glow hover:shadow-glow-strong hover:scale-110 transition-smooth"
            >
              {isPlaying ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="h-8 w-8 ml-1" />
              )}
            </Button>
            
            <Button 
              size="lg" 
              variant="ghost" 
              onClick={playNext}
              disabled={currentIndex >= queue.length - 1 && repeat === "off"}
            >
              <SkipForward className="h-6 w-6" />
            </Button>
            
            <Button
              size="lg"
              variant="ghost"
              onClick={toggleRepeat}
              className={repeat !== "off" ? "text-primary" : ""}
            >
              {repeat === "one" ? (
                <Repeat1 className="h-5 w-5" />
              ) : (
                <Repeat className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3 w-64">
            <Volume2 className="h-5 w-5 text-muted-foreground" />
            <Slider
              value={[volume * 100]}
              min={0}
              max={100}
              step={1}
              onValueChange={(value) => setVolume(value[0] / 100)}
              className="flex-1"
            />
          </div>
        </div>

        {/* Queue Button */}
        <Sheet open={queueOpen} onOpenChange={setQueueOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <List className="h-4 w-4" />
              Fronta ({queue.length})
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Přehrávací fronta</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-2">
              {queue.map((song, index) => (
                <Card
                  key={`${song.id}-${index}`}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    song.id === currentSong.id
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                  onClick={() => {
                    playQueue(queue, index);
                    setQueueOpen(false);
                  }}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    {song.cover_url ? (
                      <img
                        src={song.cover_url}
                        alt={song.title}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                        <Music className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{song.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {song.artist}
                      </p>
                    </div>
                    {song.id === currentSong.id && (
                      <div className="flex-shrink-0">
                        {isPlaying ? (
                          <div className="flex gap-0.5">
                            <div className="w-1 h-4 bg-primary animate-pulse" />
                            <div className="w-1 h-4 bg-primary animate-pulse delay-75" />
                            <div className="w-1 h-4 bg-primary animate-pulse delay-150" />
                          </div>
                        ) : (
                          <Pause className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
    </>
  );
}
