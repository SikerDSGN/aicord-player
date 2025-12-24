import { useEffect, useRef, useState } from "react";
import { usePlayer } from "@/contexts/PlayerContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  X, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Maximize,
  Minimize
} from "lucide-react";

interface FullscreenVideoProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FullscreenVideo({ isOpen, onClose }: FullscreenVideoProps) {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    audioRef,
    togglePlay,
    seekTo,
    setVolume,
    playNext,
    playPrevious,
  } = usePlayer();

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

  // Sync video with audio on open and play/pause changes
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio || !isOpen) return;

    video.muted = true;
    
    // Only sync time once when opening
    const timeDiff = Math.abs(video.currentTime - audio.currentTime);
    if (timeDiff > 0.5) {
      video.currentTime = audio.currentTime;
    }
    
    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying, isOpen, audioRef]);

  // Keep video in sync with audio time (less aggressive)
  useEffect(() => {
    if (!isOpen || !videoRef.current || !audioRef.current) return;

    const syncInterval = setInterval(() => {
      const video = videoRef.current;
      const audio = audioRef.current;
      if (video && audio && isPlaying) {
        const drift = Math.abs(video.currentTime - audio.currentTime);
        if (drift > 1) { // Only sync if drift is significant (>1 second)
          video.currentTime = audio.currentTime;
        }
      }
    }, 2000); // Check less frequently

    return () => clearInterval(syncInterval);
  }, [isOpen, isPlaying, audioRef]);

  // Auto-hide controls
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    };
  }, []);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent container onClick from interfering
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    onClose();
  };

  if (!isOpen || !currentSong?.video_url) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[300] bg-black flex items-center justify-center"
      onMouseMove={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={currentSong.video_url}
        className="w-full h-full object-contain"
        loop
        playsInline
        muted
      />

      {/* Controls Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-white text-lg font-semibold truncate">
              {currentSong.title}
            </h2>
            <p className="text-white/70 text-sm truncate">{currentSong.artist}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={handleClose}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-20 w-20 rounded-full bg-white/20 hover:bg-white/30 text-white"
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause className="h-10 w-10" />
            ) : (
              <Play className="h-10 w-10 ml-1" />
            )}
          </Button>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <span className="text-white/70 text-xs w-10 text-right">
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
            <span className="text-white/70 text-xs w-10">
              {formatTime(duration)}
            </span>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            {/* Left - Volume */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
              >
                {volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              <Slider
                value={[volume * 100]}
                min={0}
                max={100}
                step={1}
                onValueChange={(value) => setVolume(value[0] / 100)}
                className="w-24"
              />
            </div>

            {/* Center - Playback */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={playPrevious}
              >
                <SkipBack className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 text-white"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-0.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={playNext}
              >
                <SkipForward className="h-6 w-6" />
              </Button>
            </div>

            {/* Right - Fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
