import { useState, useEffect, useRef } from "react";
import { usePlayer } from "@/contexts/PlayerContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { AudioVisualizer } from "@/components/AudioVisualizer";
import { SongComments } from "@/components/SongComments";
import { FullscreenVideo } from "@/components/FullscreenVideo";
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
  Music,
  ChevronDown,
  MoreVertical,
  Heart,
  Menu,
  MessageCircle,
  Maximize
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Link, useNavigate } from "react-router-dom";
import aicordLogo from "@/assets/aicord-logo.png";

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
    setNavigate,
  } = usePlayer();

  const navigate = useNavigate();
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const [queueOpen, setQueueOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [fullscreenVideoOpen, setFullscreenVideoOpen] = useState(false);

  // Sync video preview with audio playback
  useEffect(() => {
    const video = videoPreviewRef.current;
    const audio = audioRef.current;
    if (!video || !audio || !currentSong?.video_url) return;

    video.muted = true;
    video.currentTime = audio.currentTime;
    
    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying, currentSong, audioRef]);

  // Register navigate function with PlayerContext
  useEffect(() => {
    setNavigate(navigate);
  }, [navigate, setNavigate]);

  if (!currentSong) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-background via-background to-background/95 z-40 overflow-auto">
        <header className="sticky top-0 z-10 bg-gradient-to-b from-background/95 to-transparent backdrop-blur-md border-b border-border/20">
          <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <ChevronDown className="h-6 w-6" />
              <span className="text-sm sm:text-base">Zpět do knihovny</span>
            </Button>
          </div>
        </header>
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center">
            <Music className="mx-auto h-16 w-16 text-muted-foreground opacity-50" />
            <h2 className="mt-4 text-2xl font-bold">Žádná skladba se nepřehrává</h2>
            <p className="mt-2 text-muted-foreground">Začněte přehrávat z knihovny</p>
            <Button 
              onClick={() => navigate("/")}
              className="mt-6"
            >
              Přejít do knihovny
            </Button>
          </div>
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
    <div className="fixed inset-0 bg-gradient-to-b from-background via-background to-background/95 z-40 overflow-auto">
      {/* Header - YouTube Music Style */}
      <header className="sticky top-0 z-10 bg-gradient-to-b from-background/95 to-transparent backdrop-blur-md border-b border-border/20">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <ChevronDown className="h-6 w-6" />
            <span className="text-sm sm:text-base">Minimalizovat</span>
          </Button>

          <div className="flex items-center gap-2">
            <img src={aicordLogo} alt="Aicord" className="h-7 sm:h-8 w-auto opacity-80" />
          </div>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-2">
                <Button 
                  variant="ghost" 
                  className="justify-start" 
                  onClick={() => {
                    navigate("/");
                    setMenuOpen(false);
                  }}
                >
                  Knihovna
                </Button>
                <Button 
                  variant="ghost" 
                  className="justify-start" 
                  onClick={() => {
                    navigate("/favorites");
                    setMenuOpen(false);
                  }}
                >
                  Oblíbené
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content - Centered like YouTube Music */}
      <div className="container max-w-4xl mx-auto px-4 py-6 sm:py-12 flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)]">
        {/* Album Art / Video with Visualizer Overlay */}
        <div className="relative mb-8 animate-fade-in">
          <div 
            className="relative w-72 h-72 md:w-96 md:h-96 rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 hover-scale transition-smooth cursor-pointer"
            onClick={() => currentSong.video_url && setFullscreenVideoOpen(true)}
          >
            {currentSong.video_url ? (
              <>
                <video
                  ref={videoPreviewRef}
                  src={currentSong.video_url}
                  className="w-full h-full object-cover"
                  loop
                  playsInline
                  muted
                />
                {/* Fullscreen indicator */}
                <div className="absolute bottom-2 right-2 bg-black/50 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize className="h-4 w-4 text-white" />
                </div>
              </>
            ) : currentSong.cover_url ? (
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
            
            {/* Visualizer Overlay - only show when no video */}
            {!currentSong.video_url && (
              <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-60">
                <AudioVisualizer audioElement={audioRef.current} isPlaying={isPlaying} />
              </div>
            )}
          </div>
        </div>

        {/* Song Info */}
        <div className="w-full max-w-2xl text-center mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-foreground truncate px-4">
            {currentSong.title}
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground truncate px-4">{currentSong.artist}</p>
          {currentSong.play_count !== undefined && currentSong.play_count > 0 && (
            <p className="text-sm text-muted-foreground/70 mt-1">
              {currentSong.play_count.toLocaleString('cs-CZ')} přehrání
            </p>
          )}
        </div>

        {/* Controls Container */}
        <div className="w-full max-w-2xl space-y-6">
          {/* Progress Bar */}
          <div className="px-4">
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 100}
              step={1}
              onValueChange={(value) => seekTo(value[0])}
              className="mb-2 cursor-pointer"
            />
            <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleShuffle}
              className={shuffle ? "text-primary" : "text-muted-foreground"}
            >
              <Shuffle className="h-5 w-5" />
            </Button>
            
            <Button 
              size="icon"
              variant="ghost"
              onClick={playPrevious}
              disabled={currentIndex <= 0}
              className="h-10 w-10 sm:h-12 sm:w-12"
            >
              <SkipBack className="h-6 w-6 sm:h-7 sm:w-7" />
            </Button>
            
            <Button
              size="icon"
              onClick={togglePlay}
              className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:scale-105 transition-all"
            >
              {isPlaying ? (
                <Pause className="h-7 w-7 sm:h-8 sm:w-8" />
              ) : (
                <Play className="h-7 w-7 sm:h-8 sm:w-8 ml-1" />
              )}
            </Button>
            
            <Button 
              size="icon"
              variant="ghost"
              onClick={playNext}
              disabled={currentIndex >= queue.length - 1 && repeat === "off"}
              className="h-10 w-10 sm:h-12 sm:w-12"
            >
              <SkipForward className="h-6 w-6 sm:h-7 sm:w-7" />
            </Button>
            
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleRepeat}
              className={repeat !== "off" ? "text-primary" : "text-muted-foreground"}
            >
              {repeat === "one" ? (
                <Repeat1 className="h-5 w-5" />
              ) : (
                <Repeat className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Secondary Controls */}
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
              <Sheet open={commentsOpen} onOpenChange={setCommentsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
                  <SheetHeader>
                    <SheetTitle>Komentáře - {currentSong.title}</SheetTitle>
                    <SheetDescription>
                      Sdílejte své názory na tuto skladbu
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-4 overflow-y-auto h-[calc(100%-5rem)]">
                    <SongComments songId={currentSong.id} />
                  </div>
                </SheetContent>
              </Sheet>
              {currentSong.video_url && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setFullscreenVideoOpen(true)}
                >
                  <Maximize className="h-5 w-5" />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-xs mx-4">
              <Volume2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Slider
                value={[volume * 100]}
                min={0}
                max={100}
                step={1}
                onValueChange={(value) => setVolume(value[0] / 100)}
                className="flex-1"
              />
            </div>

            <Sheet open={queueOpen} onOpenChange={setQueueOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <List className="h-5 w-5" />
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
      </div>

      {/* Fullscreen Video */}
      <FullscreenVideo 
        isOpen={fullscreenVideoOpen} 
        onClose={() => setFullscreenVideoOpen(false)} 
      />
    </div>
  );
}
