import { createContext, useContext, useState, useRef, useEffect } from "react";

interface Song {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  cover_url?: string;
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

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
    });

    audio.addEventListener("ended", () => {
      if (repeat === "one") {
        seekTo(0);
        setIsPlaying(true);
      } else {
        playNext();
      }
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (currentSong && audioRef.current) {
      audioRef.current.src = currentSong.audio_url;
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const playSong = (song: Song) => {
    setCurrentSong(song);
    setQueue([song]);
    setCurrentIndex(0);
    setIsPlaying(true);
  };

  const playQueue = (songs: Song[], startIndex: number) => {
    setQueue(songs);
    setOriginalQueue(songs);
    setCurrentIndex(startIndex);
    setCurrentSong(songs[startIndex]);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
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
