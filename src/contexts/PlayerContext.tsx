import { createContext, useContext, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Song {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  cover_url?: string;
  description?: string | null;
}

interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: Song[];
  shuffle: boolean;
  repeat: "off" | "all" | "one";
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  playSong: (song: Song) => void;
  playQueue: (songs: Song[], startIndex: number) => void;
  togglePlay: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setNavigate: (navigate: (path: string) => void) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<"off" | "all" | "one">("off");
  const [originalQueue, setOriginalQueue] = useState<Song[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigateRef = useRef<((path: string) => void) | null>(null);

  // Store navigate function from any child component that has it
  const setNavigate = (navigate: (path: string) => void) => {
    navigateRef.current = navigate;
  };

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      console.log("Audio metadata loaded, duration:", audio.duration);
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      console.log("Audio ended");
      if (repeat === "one") {
        seekTo(0);
        setIsPlaying(true);
      } else {
        playNext();
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
      audio.src = "";
    };
  }, [repeat]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (currentSong && audioRef.current) {
      const audio = audioRef.current;
      console.log("Setting audio source:", currentSong.audio_url);
      audio.src = currentSong.audio_url;
      
      // Wait for audio to be loaded before playing
      const handleCanPlay = () => {
        console.log("Audio can play, isPlaying:", isPlaying);
        if (isPlaying) {
          audio.play().catch((error) => {
            console.error("Error playing audio:", error);
            setIsPlaying(false);
          });
        }
      };
      
      const handleError = (e: Event) => {
        console.error("Audio error:", e);
      };
      
      audio.addEventListener('canplay', handleCanPlay, { once: true });
      audio.addEventListener('error', handleError);
      audio.load();
      
      return () => {
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('error', handleError);
      };
    }
  }, [currentSong]);

  useEffect(() => {
    if (audioRef.current && currentSong) {
      const audio = audioRef.current;
      
      console.log("isPlaying changed to:", isPlaying);
      if (isPlaying) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error("Error playing audio:", error);
            setIsPlaying(false);
          });
        }
      } else {
        audio.pause();
      }
    }
  }, [isPlaying, currentSong]);

  const playSong = (song: Song) => {
    console.log("Playing song:", song.title);
    setCurrentSong(song);
    setQueue([song]);
    setCurrentIndex(0);
    setIsPlaying(true);
    // Navigate to now-playing page
    if (navigateRef.current) {
      console.log("Navigating to /now-playing");
      navigateRef.current("/now-playing");
    }
  };

  const playQueue = (songs: Song[], startIndex: number) => {
    console.log("Playing queue, starting at:", songs[startIndex]?.title);
    console.log("navigateRef.current:", navigateRef.current);
    setQueue(songs);
    setOriginalQueue(songs);
    setCurrentIndex(startIndex);
    setCurrentSong(songs[startIndex]);
    setIsPlaying(true);
    // Navigate to now-playing page
    if (navigateRef.current) {
      console.log("Navigating to /now-playing");
      navigateRef.current("/now-playing");
    } else {
      console.log("navigateRef.current is null, cannot navigate");
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const seekTo = (time: number) => {
    if (audioRef.current && currentSong) {
      console.log("Seeking to:", time);
      try {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
      } catch (error) {
        console.error("Error seeking:", error);
      }
    }
  };

  const playNext = () => {
    if (queue.length === 0) return;

    if (currentIndex < queue.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setCurrentSong(queue[nextIndex]);
      setIsPlaying(true);
    } else if (repeat === "all") {
      setCurrentIndex(0);
      setCurrentSong(queue[0]);
      setIsPlaying(true);
    }
  };

  const playPrevious = () => {
    if (currentTime > 3) {
      seekTo(0);
    } else if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setCurrentSong(queue[prevIndex]);
      setIsPlaying(true);
    }
  };

  const toggleShuffle = () => {
    if (!shuffle) {
      // Enable shuffle - create a shuffled copy
      const shuffledQueue = [...queue];
      const currentSongCopy = queue[currentIndex];
      
      // Remove current song from shuffle
      shuffledQueue.splice(currentIndex, 1);
      
      // Shuffle remaining songs
      for (let i = shuffledQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledQueue[i], shuffledQueue[j]] = [shuffledQueue[j], shuffledQueue[i]];
      }
      
      // Put current song at the beginning
      shuffledQueue.unshift(currentSongCopy);
      
      setQueue(shuffledQueue);
      setCurrentIndex(0);
    } else {
      // Disable shuffle - restore original queue
      const currentSongId = currentSong?.id;
      const originalIndex = originalQueue.findIndex(s => s.id === currentSongId);
      setQueue(originalQueue);
      setCurrentIndex(originalIndex >= 0 ? originalIndex : 0);
    }
    setShuffle(!shuffle);
  };

  const toggleRepeat = () => {
    setRepeat((current) => {
      if (current === "off") return "all";
      if (current === "all") return "one";
      return "off";
    });
  };

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        queue,
        shuffle,
        repeat,
        audioRef,
        playSong,
        playQueue,
        togglePlay,
        seekTo,
        setVolume,
        playNext,
        playPrevious,
        toggleShuffle,
        toggleRepeat,
        setNavigate,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
